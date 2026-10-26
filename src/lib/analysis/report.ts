/**
 * Report v4: the contract between the model passes, the code that grounds
 * them, and every screen that renders a report.
 *
 * Parsing is LENIENT PER ITEM and STRICT PER REPORT: a malformed voice or
 * detection is dropped and counted, while a report missing its core fields
 * fails and is repaired once. Free models produce one bad item far more often
 * than a wholly bad answer, and throwing away nine good items for one bad one
 * made reports fail for no reader-visible reason.
 */
import { isTechniqueId, type TechniqueId } from '@/lib/domain/techniques';

import type { LocatedQuote } from './quote-locate';

export const REPORT_SCHEMA = 'biaslens-report@4' as const;

export const GENRES = [
  'news_report',
  'opinion',
  'analysis',
  'interview',
  'press_release',
  'feature',
  'other',
] as const;
export type Genre = (typeof GENRES)[number];

export const CLAIM_TYPES = ['factual', 'normative', 'causal'] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_SUPPORT = ['data', 'citation', 'quoted_view', 'none'] as const;
export type ClaimSupport = (typeof CLAIM_SUPPORT)[number];

export const VOICE_KINDS = ['person', 'organisation', 'document', 'anonymous'] as const;
export type VoiceKind = (typeof VOICE_KINDS)[number];

export const STANCES = ['supports', 'opposes', 'mixed', 'neutral', 'unclear'] as const;
export type Stance = (typeof STANCES)[number];

export const NUMBER_KINDS = ['poll', 'statistic', 'money', 'count', 'other'] as const;
export type NumberKind = (typeof NUMBER_KINDS)[number];

/** The author's own voice, as opposed to one of `voices`. */
export const AUTHOR = 'author' as const;

export interface Byline {
  authors: string[];
  publication: string | null;
  date: string | null;
  /** Where the byline came from: the page's own metadata wins over the model. */
  source: 'page-metadata' | 'model';
}

export interface Voice {
  id: string;
  name: string;
  kind: VoiceKind;
  /** As the article describes them; not independently checked. */
  affiliation: string | null;
  stance: Stance;
  quotes: LocatedQuote[];
}

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  /** `author` or a voice id. */
  speaker: string;
  support: ClaimSupport;
  quote: LocatedQuote | null;
}

export interface Figure {
  id: string;
  value: string;
  kind: NumberKind;
  about: string;
  source: string | null;
  sampleSizeStated: boolean;
  marginStated: boolean;
  comparisonGiven: boolean;
  quote: LocatedQuote | null;
}

export interface Detection {
  id: string;
  technique: TechniqueId;
  explanation: string;
  alternative: string | null;
  quote: LocatedQuote;
}

export interface Insight {
  headline: string;
  explanation: string;
  assumption: string;
  test: string;
}

export interface Metrics {
  voices: number;
  stanceCounts: Record<Stance, number>;
  quotedWordsByStance: Record<Stance, number>;
  /** Share of the text inside quotation marks, 0..1. */
  quotedShare: number;
  anonymousVoices: number;
  figures: number;
  figuresWithoutSource: number;
  pollsWithoutSample: number;
  detectionCounts: Partial<Record<TechniqueId, number>>;
  /** ≥ ONE_SIDED.minKnown voices with a known stance and ≥ ONE_SIDED.share on one side. */
  oneSided: 'supports' | 'opposes' | null;
  missingResponse: boolean;
}

export interface ReportQuality {
  proposedQuotes: number;
  groundedQuotes: number;
  droppedItems: number;
  modelRepairs: number;
}

export interface Report {
  schema: typeof REPORT_SCHEMA;
  title: string;
  byline: Byline;
  genre: Genre;
  genreReason: string;
  summary: string;
  centralClaim: { text: string; speaker: string; quote: LocatedQuote | null };
  voices: Voice[];
  claims: Claim[];
  figures: Figure[];
  detections: Detection[];
  insight: Insight;
  strongestCase: string;
  strongestObjection: string;
  missingVoices: { who: string; why: string }[];
  questions: string[];
  whatWouldChange: string[];
  metrics: Metrics;
  quality: ReportQuality;
}

// ————— Raw model shapes (before grounding) —————

export interface RawReading {
  title: string;
  byline: { authors: string[]; publication: string | null; date: string | null };
  genre: Genre;
  genre_reason: string;
  summary: string;
  central_claim: { text: string; speaker: string; quote: string | null };
  voices: {
    id: string;
    name: string;
    kind: VoiceKind;
    affiliation: string | null;
    quotes: string[];
    stance: Stance;
  }[];
  claims: {
    text: string;
    type: ClaimType;
    speaker: string;
    quote: string | null;
    support: ClaimSupport;
  }[];
  numbers: {
    value: string;
    quote: string | null;
    kind: NumberKind;
    about: string;
    source: string | null;
    sample_size_stated: boolean;
    margin_stated: boolean;
    comparison_given: boolean;
  }[];
}

export interface RawAssessment {
  detections: {
    technique: TechniqueId;
    quote: string;
    explanation: string;
    alternative: string | null;
  }[];
  insight: Insight;
  strongest_case: string;
  strongest_objection: string;
  missing_voices: { who: string; why: string }[];
  questions: string[];
  what_would_change: string[];
}

export type Parsed<T> = { ok: true; data: T; dropped: number } | { ok: false; error: string };

// ————— Small validators —————

type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const textOrNull = (value: unknown): string | null => text(value);
const bool = (value: unknown): boolean => value === true;
function oneOf<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function strings(value: unknown, max: number): string[] {
  return list(value)
    .map(text)
    .filter((item): item is string => item !== null)
    .slice(0, max);
}

/** Parse model text into JSON, tolerating a fenced block. */
export function parseModelJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/i);
  const body = fenced ? fenced[1]! : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // Some models wrap the object in prose; take the outermost braces.
    const first = body.indexOf('{');
    const last = body.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(body.slice(first, last + 1));
    throw new Error('not valid JSON');
  }
}

export function parseReading(input: unknown): Parsed<RawReading> {
  if (!isObj(input)) return { ok: false, error: 'expected a JSON object' };
  const title = text(input.title);
  const summary = text(input.summary);
  const central = isObj(input.central_claim) ? input.central_claim : null;
  const centralText = central ? text(central.text) : null;
  if (!title) return { ok: false, error: 'title is missing' };
  if (!summary) return { ok: false, error: 'summary is missing' };
  if (!central || !centralText) return { ok: false, error: 'central_claim.text is missing' };

  let dropped = 0;
  const voiceIds = new Set<string>();
  const voices: RawReading['voices'] = [];
  for (const [index, row] of list(input.voices).entries()) {
    const name = isObj(row) ? text(row.name) : null;
    if (!isObj(row) || !name) {
      dropped++;
      continue;
    }
    let id = text(row.id) ?? 'v' + (index + 1);
    if (voiceIds.has(id) || id === 'author') id = 'v' + (index + 1) + '_' + voices.length;
    voiceIds.add(id);
    voices.push({
      id,
      name,
      kind: oneOf(VOICE_KINDS, row.kind, 'person'),
      affiliation: textOrNull(row.affiliation),
      quotes: strings(row.quotes, 4),
      stance: oneOf(STANCES, row.stance, 'unclear'),
    });
  }
  const speaker = (value: unknown) => {
    const id = text(value);
    return id && voiceIds.has(id) ? id : AUTHOR;
  };

  const claims: RawReading['claims'] = [];
  for (const row of list(input.claims)) {
    const claimText = isObj(row) ? text(row.text) : null;
    if (!isObj(row) || !claimText) {
      dropped++;
      continue;
    }
    claims.push({
      text: claimText,
      type: oneOf(CLAIM_TYPES, row.type, 'factual'),
      speaker: speaker(row.speaker),
      quote: textOrNull(row.quote),
      support: oneOf(CLAIM_SUPPORT, row.support, 'none'),
    });
  }

  const numbers: RawReading['numbers'] = [];
  for (const row of list(input.numbers)) {
    const value = isObj(row) ? text(row.value) : null;
    if (!isObj(row) || !value) {
      dropped++;
      continue;
    }
    numbers.push({
      value,
      quote: textOrNull(row.quote),
      kind: oneOf(NUMBER_KINDS, row.kind, 'other'),
      about: text(row.about) ?? '',
      source: textOrNull(row.source),
      sample_size_stated: bool(row.sample_size_stated),
      margin_stated: bool(row.margin_stated),
      comparison_given: bool(row.comparison_given),
    });
  }

  const byline = isObj(input.byline) ? input.byline : {};
  return {
    ok: true,
    dropped,
    data: {
      title,
      byline: {
        authors: strings(byline.authors, 6),
        publication: textOrNull(byline.publication),
        date: textOrNull(byline.date),
      },
      genre: oneOf(GENRES, input.genre, 'other'),
      genre_reason: text(input.genre_reason) ?? '',
      summary,
      central_claim: {
        text: centralText,
        speaker: speaker(central.speaker),
        quote: textOrNull(central.quote),
      },
      voices: voices.slice(0, 14),
      claims: claims.slice(0, 8),
      numbers: numbers.slice(0, 12),
    },
  };
}

export function parseAssessment(input: unknown): Parsed<RawAssessment> {
  if (!isObj(input)) return { ok: false, error: 'expected a JSON object' };
  const insight = isObj(input.insight) ? input.insight : null;
  const headline = insight ? text(insight.headline) : null;
  const explanation = insight ? text(insight.explanation) : null;
  const assumption = insight ? text(insight.assumption) : null;
  const test = insight ? text(insight.test) : null;
  if (!headline || !explanation || !assumption || !test) {
    return { ok: false, error: 'insight needs headline, explanation, assumption and test' };
  }
  const strongestCase = text(input.strongest_case);
  const strongestObjection = text(input.strongest_objection);
  if (!strongestCase) return { ok: false, error: 'strongest_case is missing' };
  if (!strongestObjection) return { ok: false, error: 'strongest_objection is missing' };

  let dropped = 0;
  const detections: RawAssessment['detections'] = [];
  for (const row of list(input.detections)) {
    const quote = isObj(row) ? text(row.quote) : null;
    const why = isObj(row) ? text(row.explanation) : null;
    if (!isObj(row) || !quote || !why || !isTechniqueId(row.technique)) {
      dropped++;
      continue;
    }
    detections.push({
      technique: row.technique,
      quote,
      explanation: why,
      alternative: textOrNull(row.alternative),
    });
  }
  const missingVoices: RawAssessment['missing_voices'] = [];
  for (const row of list(input.missing_voices)) {
    const who = isObj(row) ? text(row.who) : null;
    if (!isObj(row) || !who) {
      dropped++;
      continue;
    }
    missingVoices.push({ who, why: text(row.why) ?? '' });
  }
  return {
    ok: true,
    dropped,
    data: {
      detections: detections.slice(0, 12),
      insight: { headline, explanation, assumption, test },
      strongest_case: strongestCase,
      strongest_objection: strongestObjection,
      missing_voices: missingVoices.slice(0, 4),
      questions: strings(input.questions, 4),
      what_would_change: strings(input.what_would_change, 4),
    },
  };
}
