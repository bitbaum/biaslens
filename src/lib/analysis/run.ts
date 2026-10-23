import { createHash } from 'node:crypto';

import {
  buildFirstPrinciplesUserPrompt,
  FIRST_PRINCIPLES_SYSTEM_PROMPT,
  FIRST_PRINCIPLES_PROMPT_VERSION,
  parseFirstPrinciplesAnalysis,
  type FirstPrinciplesAnalysis,
} from '@/lib/domain/first-principles';

import { METHOD_VERSION } from '@/lib/domain/epistemic-graph';

import type { AnalyzeInput } from './input';

export const MAX_MODEL_CHARS = 18_000;

export interface ReaderResult {
  ok: boolean;
  url: string;
  title?: string;
  text?: string;
  truncated?: boolean;
  failure?: { reason: string };
}

export interface ModelResult {
  text: string;
  modelId: string | null;
}

export interface AnalysisDeps {
  readPage(url: string): Promise<ReaderResult>;
  complete(messages: Array<{ role: 'system' | 'user'; content: string }>): Promise<ModelResult>;
}

export interface ArticleAnalysisResult {
  analysis: FirstPrinciplesAnalysis;
  sourceText?: string;
  origin: {
    kind: 'retrieved-page' | 'user-pasted-text';
    url: string | null;
    title: string | null;
    attribution: 'retrieved' | 'user-asserted' | 'not-provided';
    modelChars: number;
    truncated: boolean;
    /** SHA-256 of the exact article text visible to the model, excluding prompt wrapper. */
    textSha256: string;
  };
  modelId: string | null;
  run: {
    generatedAt: string;
    methodVersion: string;
    promptVersion: string;
  };
  durationMs: number;
  /** The text is model-generated analysis and has NOT been independently checked. */
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

/**
 * No database writes here. A report is a provisional model interpretation
 * until a separate, sourced verification pipeline independently assesses it.
 * The seams are injectable so tests never spend tokens or fetch the internet.
 */
export async function analyzeArticle(
  input: AnalyzeInput,
  deps: AnalysisDeps,
): Promise<ArticleAnalysisResult> {
  const started = Date.now();
  let sourceUrl = input.url;
  let title: string | null = null;
  let body: string;
  let fetchTruncated = false;

  if (input.mode === 'url') {
    const fetched = await deps.readPage(input.url!);
    if (!fetched.ok) {
      throw new AnalysisFailure(
        'SOURCE_UNAVAILABLE',
        422,
        fetched.failure?.reason ??
          'Could not read that article. Paste its text instead if the website blocks automated reading.',
      );
    }
    body = fetched.text ?? '';
    sourceUrl = fetched.url;
    title = fetched.title || null;
    fetchTruncated = !!fetched.truncated;
  } else {
    body = input.text ?? '';
  }

  if (body.trim().length < 200) {
    throw new AnalysisFailure(
      'SOURCE_TOO_SHORT',
      422,
      'Less than 200 characters could be read. Paste the article body to continue.',
    );
  }

  const clipped = body.length > MAX_MODEL_CHARS;
  const text = clipped ? body.slice(0, MAX_MODEL_CHARS) : body;
  const prompt = buildFirstPrinciplesUserPrompt({
    url:
      sourceUrl ??
      'No source URL provided. Text was pasted by a user and its origin is unverified.',
    title,
    text: text + (fetchTruncated || clipped ? '\n[Source text truncated before analysis]' : ''),
  });

  const generated = await deps.complete([
    { role: 'system', content: FIRST_PRINCIPLES_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  let parsed: unknown;
  try {
    const json = generated.text.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i, '$1');
    parsed = JSON.parse(json);
  } catch {
    throw new AnalysisFailure('MODEL_INVALID', 502, 'The model returned an invalid report. Retry.');
  }
  const valid = parseFirstPrinciplesAnalysis(parsed);
  if (!valid.success) {
    throw new AnalysisFailure(
      'MODEL_INVALID',
      502,
      'The model returned an incomplete report. Retry.',
    );
  }

  // A plausible-looking model quote is never rendered as a quotation unless
  // its exact bytes occur in the text the model actually received.
  for (const claim of valid.data.core_claims) {
    if (claim.source_quote && !text.includes(claim.source_quote)) claim.source_quote = null;
  }
  return {
    analysis: valid.data,
    sourceText: text,
    origin: {
      kind: input.mode === 'url' ? 'retrieved-page' : 'user-pasted-text',
      url: sourceUrl,
      title,
      attribution:
        input.mode === 'url' ? 'retrieved' : sourceUrl ? 'user-asserted' : 'not-provided',
      modelChars: text.length,
      truncated: fetchTruncated || clipped,
      textSha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    },
    modelId: generated.modelId,
    run: {
      generatedAt: new Date().toISOString(),
      methodVersion: METHOD_VERSION,
      promptVersion: FIRST_PRINCIPLES_PROMPT_VERSION,
    },
    durationMs: Date.now() - started,
    independentlyVerified: false,
  };
}
