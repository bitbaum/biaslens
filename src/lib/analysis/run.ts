import { createHash } from 'node:crypto';

import { localizeSpelling, type OutputLanguage } from '@/lib/config/languages';
import { forbiddenLabelsIn, stripForbiddenSentences } from '@/lib/config/vocabulary';
import { METHOD_VERSION } from '@/lib/domain/epistemic-graph';

import type { AnalyzeInput } from './input';
import { computeMetrics } from './metrics';
import {
  articleBlock,
  assessmentSystemPrompt,
  readingSystemPrompt,
  REPORT_PROMPT_VERSION,
  type PageMetadata,
} from './prompts';
import { cleanSourceText, locateQuote, type LocatedQuote } from './quote-locate';
import {
  AUTHOR,
  parseAssessment,
  parseModelJson,
  parseReading,
  REPORT_SCHEMA,
  type Claim,
  type Detection,
  type Figure,
  type Parsed,
  type RawAssessment,
  type RawReading,
  type Report,
  type Voice,
} from './report';
import type { SourceResult } from './source';

export const MAX_MODEL_CHARS = 18_000;
export const MIN_SOURCE_CHARS = 200;

export interface ModelResult {
  text: string;
  modelId: string | null;
}

export type Stage = 'reading-source' | 'reading' | 'assessing' | 'checking';

export interface AnalysisDeps {
  readSource(url: string, maxChars: number): Promise<SourceResult>;
  complete(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    pass: 'reading' | 'assessment',
  ): Promise<ModelResult>;
  onStage?(stage: Stage): void;
}

export interface ArticleAnalysisResult {
  report: Report;
  sourceText: string;
  language: OutputLanguage;
  origin: {
    kind: 'retrieved-page' | 'retrieved-pdf' | 'user-pasted-text';
    url: string | null;
    title: string | null;
    attribution: 'retrieved' | 'user-asserted' | 'not-provided';
    modelChars: number;
    truncated: boolean;
    /** SHA-256 of the exact text visible to the model, excluding the prompt wrapper. */
    textSha256: string;
  };
  run: {
    generatedAt: string;
    methodVersion: string;
    promptVersion: string;
    passes: { pass: 'reading' | 'assessment'; modelId: string | null; repairAttempts: number }[];
  };
  durationMs: number;
  /** Model-generated analysis; NOT independently checked against the world. */
  independentlyVerified: false;
}

export class AnalysisFailure extends Error {
  constructor(
    readonly code: 'SOURCE_UNAVAILABLE' | 'SOURCE_TOO_SHORT' | 'MODEL_INVALID',
    readonly status: 422 | 502,
    message: string,
  ) {
    super(message);
    this.name = 'AnalysisFailure';
  }
}

type Messages = Array<{ role: 'system' | 'user'; content: string }>;

/**
 * Ask, validate, and repair once. A repair restates the error and the original
 * request; it never feeds the malformed answer back, so context does not grow.
 */
async function askValidated<T>(
  deps: AnalysisDeps,
  pass: 'reading' | 'assessment',
  messages: Messages,
  parse: (value: unknown) => Parsed<T>,
  extraCheck: (data: T) => string | null,
): Promise<{ data: T; dropped: number; modelId: string | null; repairAttempts: number }> {
  let issue = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const request: Messages =
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: 'user',
              content:
                'Your previous answer failed validation: ' +
                issue +
                '. Answer again with one complete JSON object in the requested shape.',
            },
          ];
    const generated = await deps.complete(request, pass);
    try {
      const parsed = parse(parseModelJson(generated.text));
      if (!parsed.ok) {
        issue = parsed.error;
        continue;
      }
      const problem = extraCheck(parsed.data);
      if (problem && attempt === 0) {
        issue = problem;
        continue;
      }
      return {
        data: parsed.data,
        dropped: parsed.dropped,
        modelId: generated.modelId,
        repairAttempts: attempt,
      };
    } catch {
      issue = 'the answer was not valid JSON';
    }
  }
  throw new AnalysisFailure(
    'MODEL_INVALID',
    502,
    'The model could not produce a complete report after one repair. Your article is unchanged; please retry.',
  );
}

function generatedStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(generatedStrings);
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      key === 'quote' || key === 'quotes' ? [] : generatedStrings(item),
    );
  }
  return [];
}

function vocabularyIssue(value: unknown): string | null {
  const found = [...new Set(generatedStrings(value).flatMap(forbiddenLabelsIn))];
  return found.length
    ? 'it applies labels BiasLens never uses in its own voice (' +
        found.join(', ') +
        '); describe observable features instead'
    : null;
}

/** Final pass over generated text: forbidden labels removed, Swiss spelling. */
function polish(text: string, language: OutputLanguage): string {
  return localizeSpelling(stripForbiddenSentences(text), language);
}

function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export async function analyzeArticle(
  input: AnalyzeInput,
  deps: AnalysisDeps,
): Promise<ArticleAnalysisResult> {
  const started = Date.now();
  const language: OutputLanguage = input.outputLanguage ?? 'en';
  let sourceUrl = input.url;
  let title: string | null = null;
  let metadata: PageMetadata | null = null;
  let kind: ArticleAnalysisResult['origin']['kind'] = 'user-pasted-text';
  let body: string;
  let fetchTruncated = false;

  if (input.mode === 'url') {
    deps.onStage?.('reading-source');
    const fetched = await deps.readSource(input.url!, MAX_MODEL_CHARS + 2_000);
    if (!fetched.ok) {
      throw new AnalysisFailure(
        'SOURCE_UNAVAILABLE',
        422,
        fetched.reason + ' Paste the article text instead.',
      );
    }
    body = fetched.text;
    sourceUrl = fetched.url;
    title = fetched.title;
    metadata = fetched.metadata;
    kind = fetched.kind === 'pdf' ? 'retrieved-pdf' : 'retrieved-page';
    fetchTruncated = fetched.truncated;
  } else {
    body = cleanSourceText(input.text ?? '');
  }

  if (body.trim().length < MIN_SOURCE_CHARS) {
    throw new AnalysisFailure(
      'SOURCE_TOO_SHORT',
      422,
      'Less than 200 characters could be read. Paste the article body to continue.',
    );
  }

  const clipped = body.length > MAX_MODEL_CHARS;
  const text = clipped ? body.slice(0, MAX_MODEL_CHARS) : body;
  const truncated = fetchTruncated || clipped;
  const article = articleBlock({ url: sourceUrl, title, metadata, text, truncated });

  // ——— Pass 1: inventory ———
  deps.onStage?.('reading');
  const reading = await askValidated<RawReading>(
    deps,
    'reading',
    [
      { role: 'system', content: readingSystemPrompt(language) },
      { role: 'user', content: article },
    ],
    parseReading,
    vocabularyIssue,
  );

  let proposedQuotes = 0;
  let groundedQuotes = 0;
  const ground = (quote: string | null): LocatedQuote | null => {
    if (!quote) return null;
    proposedQuotes++;
    const located = locateQuote(text, quote);
    if (located) groundedQuotes++;
    return located;
  };

  // Byline: the publisher's metadata wins; the model fills gaps.
  const byline = {
    authors: metadata?.authors.length ? metadata.authors : reading.data.byline.authors,
    publication: metadata?.publication ?? reading.data.byline.publication,
    date: metadata?.date ?? reading.data.byline.date,
    source: metadata?.authors.length ? ('page-metadata' as const) : ('model' as const),
  };
  const authorKeys = new Set(byline.authors.map(nameKey));

  // The author is never a voice (the report once listed "Christoph Bernet · Autor").
  const voices: Voice[] = reading.data.voices
    .filter((voice) => !authorKeys.has(nameKey(voice.name)))
    .map((voice) => ({
      id: voice.id,
      name: voice.name,
      kind: voice.kind,
      affiliation: voice.affiliation ? polish(voice.affiliation, language) : null,
      stance: voice.stance,
      quotes: voice.quotes
        .map((quote) => ground(quote))
        .filter((quote): quote is LocatedQuote => quote !== null),
    }));
  const voiceIds = new Set(voices.map((voice) => voice.id));
  const speaker = (id: string) => (voiceIds.has(id) ? id : AUTHOR);

  const claims: Claim[] = reading.data.claims.map((claim, index) => ({
    id: 'c' + (index + 1),
    text: polish(claim.text, language),
    type: claim.type,
    speaker: speaker(claim.speaker),
    support: claim.support,
    quote: ground(claim.quote),
  }));
  const figures: Figure[] = reading.data.numbers.map((figure, index) => ({
    id: 'n' + (index + 1),
    value: figure.value,
    kind: figure.kind,
    about: polish(figure.about, language),
    source: figure.source,
    sampleSizeStated: figure.sample_size_stated,
    marginStated: figure.margin_stated,
    comparisonGiven: figure.comparison_given,
    quote: ground(figure.quote),
  }));
  const centralClaim = {
    text: polish(reading.data.central_claim.text, language),
    speaker: speaker(reading.data.central_claim.speaker),
    quote: ground(reading.data.central_claim.quote),
  };

  // ——— Pass 2: assessment, given the grounded inventory ———
  deps.onStage?.('assessing');
  const inventory = {
    genre: reading.data.genre,
    central_claim: centralClaim.text,
    byline: byline.authors,
    voices: voices.map((voice) => ({
      id: voice.id,
      name: voice.name,
      affiliation: voice.affiliation,
      stance: voice.stance,
      kind: voice.kind,
    })),
    claims: claims.map((claim) => ({ text: claim.text, type: claim.type, speaker: claim.speaker })),
    numbers: figures.map((figure) => ({
      value: figure.value,
      about: figure.about,
      source: figure.source,
      sample_size_stated: figure.sampleSizeStated,
      margin_stated: figure.marginStated,
      comparison_given: figure.comparisonGiven,
    })),
  };
  const assessment = await askValidated<RawAssessment>(
    deps,
    'assessment',
    [
      { role: 'system', content: assessmentSystemPrompt(language) },
      {
        role: 'user',
        content:
          'Checked inventory of the article:\n' + JSON.stringify(inventory) + '\n\n' + article,
      },
    ],
    parseAssessment,
    vocabularyIssue,
  );

  deps.onStage?.('checking');
  let droppedDetections = 0;
  const detections: Detection[] = [];
  for (const detection of assessment.data.detections) {
    const quote = ground(detection.quote);
    if (!quote) {
      droppedDetections++;
      continue;
    }
    detections.push({
      id: 'd' + (detections.length + 1),
      technique: detection.technique,
      explanation: polish(detection.explanation, language),
      alternative: detection.alternative ? polish(detection.alternative, language) : null,
      quote,
    });
  }

  const a = assessment.data;
  const modelRepairs =
    (reading.repairAttempts > 0 ? 1 : 0) + (assessment.repairAttempts > 0 ? 1 : 0);
  const report: Report = {
    schema: REPORT_SCHEMA,
    title: reading.data.title,
    byline,
    genre: reading.data.genre,
    genreReason: polish(reading.data.genre_reason, language),
    summary: polish(reading.data.summary, language),
    centralClaim,
    voices,
    claims,
    figures,
    detections,
    insight: {
      headline: polish(a.insight.headline, language),
      explanation: polish(a.insight.explanation, language),
      assumption: polish(a.insight.assumption, language),
      test: polish(a.insight.test, language),
    },
    strongestCase: polish(a.strongest_case, language),
    strongestObjection: polish(a.strongest_objection, language),
    missingVoices: a.missing_voices.map((item) => ({
      who: polish(item.who, language),
      why: polish(item.why, language),
    })),
    questions: a.questions.map((item) => polish(item, language)),
    whatWouldChange: a.what_would_change.map((item) => polish(item, language)),
    metrics: computeMetrics({ text, voices, figures, detections }),
    quality: {
      proposedQuotes,
      groundedQuotes,
      droppedItems: reading.dropped + assessment.dropped + droppedDetections,
      modelRepairs,
    },
  };

  return {
    report,
    sourceText: text,
    language,
    origin: {
      kind,
      url: sourceUrl,
      title,
      attribution:
        input.mode === 'url' ? 'retrieved' : sourceUrl ? 'user-asserted' : 'not-provided',
      modelChars: text.length,
      truncated,
      textSha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    },
    run: {
      generatedAt: new Date().toISOString(),
      methodVersion: METHOD_VERSION,
      promptVersion: REPORT_PROMPT_VERSION,
      passes: [
        { pass: 'reading', modelId: reading.modelId, repairAttempts: reading.repairAttempts },
        {
          pass: 'assessment',
          modelId: assessment.modelId,
          repairAttempts: assessment.repairAttempts,
        },
      ],
    },
    durationMs: Date.now() - started,
    independentlyVerified: false,
  };
}
