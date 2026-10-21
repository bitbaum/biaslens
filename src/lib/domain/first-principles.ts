/**
 * Truth Seeker's first-principles article analysis contract, migrated into BiasLens.
 *
 * This is an UNVERIFIED model output: evidence supplied by an article is not
 * independent evidence that a claim is true. The Evidence/Claim verification
 * tables remain the source of truth for adjudication.
 *
 * Source: bitbaum/truthseeker/src/lib/analysis.ts + prompts.ts (2026-10-20).
 * No dependency on a model vendor or HTTP framework; consumers can inject a
 * model implementation and validate its output before writing to the DB.
 */

/** Versioned prompt rubric; changing substantive reasoning instructions bumps this. */
export const FIRST_PRINCIPLES_PROMPT_VERSION = 'first-principles@1' as const;

export const CLAIM_KINDS = ['factual', 'normative', 'causal'] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const ARTICLE_EVIDENCE_QUALITIES = ['strong', 'moderate', 'weak', 'asserted'] as const;
export type ArticleEvidenceQuality = (typeof ARTICLE_EVIDENCE_QUALITIES)[number];

export interface ArticleClaim {
  claim: string;
  type: ClaimKind;
  /** Evidence presented inside the article, NOT independent verification. */
  supported_in_article: boolean;
  /** Assessment of the article's stated support; NOT a verification verdict. */
  evidence_quality: ArticleEvidenceQuality;
}

export interface ArticleSource {
  name: string;
  role: string;
  attributed_claim: string;
}

export interface FirstPrinciplesAnalysis {
  title: string;
  author: string | null;
  publication: string;
  publication_date: string | null;
  language: string;
  summary: string;
  core_claims: ArticleClaim[];
  first_principles_critique: string;
  named_sources: ArticleSource[];
  biases_to_consider: string;
  what_would_change_assessment: string;
}

export type FirstPrinciplesParseResult =
  { success: true; data: FirstPrinciplesAnalysis } | { success: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function includesString<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.some((item) => item === value);
}

/**
 * Validate the model's exact Truth Seeker v0.1 JSON format before any data is
 * persisted or displayed. This does NOT authenticate statements within it.
 */
export function parseFirstPrinciplesAnalysis(input: unknown): FirstPrinciplesParseResult {
  const invalid = (reason: string): FirstPrinciplesParseResult => ({
    success: false,
    error: 'Invalid first-principles analysis: ' + reason,
  });

  if (!isObject(input)) return invalid('expected an object');
  const requiredStrings = [
    'title',
    'publication',
    'language',
    'summary',
    'first_principles_critique',
    'biases_to_consider',
    'what_would_change_assessment',
  ] as const;
  for (const key of requiredStrings) {
    if (!isNonemptyString(input[key])) return invalid(key + ' must be a nonempty string');
  }
  for (const key of ['author', 'publication_date'] as const) {
    if (!isStringOrNull(input[key])) return invalid(key + ' must be a string or null');
  }

  if (!Array.isArray(input.core_claims)) return invalid('core_claims must be an array');
  for (const [index, row] of input.core_claims.entries()) {
    if (!isObject(row)) return invalid('core_claims[' + index + '] must be an object');
    if (!isNonemptyString(row.claim)) {
      return invalid('core_claims[' + index + '].claim must be a nonempty string');
    }
    if (!includesString(CLAIM_KINDS, row.type)) {
      return invalid('core_claims[' + index + '].type must be factual, normative, or causal');
    }
    if (typeof row.supported_in_article !== 'boolean') {
      return invalid('core_claims[' + index + '].supported_in_article must be a boolean');
    }
    if (!includesString(ARTICLE_EVIDENCE_QUALITIES, row.evidence_quality)) {
      return invalid('core_claims[' + index + '].evidence_quality is invalid');
    }
  }

  if (!Array.isArray(input.named_sources)) return invalid('named_sources must be an array');
  for (const [index, row] of input.named_sources.entries()) {
    if (!isObject(row)) return invalid('named_sources[' + index + '] must be an object');
    for (const key of ['name', 'role', 'attributed_claim'] as const) {
      if (!isNonemptyString(row[key])) {
        return invalid('named_sources[' + index + '].' + key + ' must be a nonempty string');
      }
    }
  }

  // We have checked every field needed by the compatible Truth Seeker shape.
  return { success: true, data: input as unknown as FirstPrinciplesAnalysis };
}

/**
 * Text-only on-demand prompt; model invocation and source fetching deliberately
 * remain separate adapters. This prevents the analytical rubric from silently
 * depending on an LLM vendor or a crawling implementation.
 */
export const FIRST_PRINCIPLES_SYSTEM_PROMPT = [
  'You analyse an article using first-principles reasoning without political allegiance.',
  'Return only a JSON object. Separate factual, normative, and causal claims.',
  'Describe what the ARTICLE says and what support the ARTICLE presents.',
  'Do not claim that evidence in the article independently verifies its assertions.',
  'Do not manufacture citations, source affiliations, historical positions, or dates.',
  'If you cannot verify an author or outlet pattern from the supplied text, say that it is unknown.',
  'The key biases_to_consider is a hypothesis about framing, not a factual allegation.',
  'Explain the strongest argument fairly and what specific evidence would change the assessment.',
  'Use the same language as the article for summary and first_principles_critique.',
  'Return exactly these JSON keys:',
  'title, author, publication, publication_date, language, summary, core_claims,',
  'first_principles_critique, named_sources, biases_to_consider, what_would_change_assessment.',
  'Each core_claims entry: claim (string), type (factual | normative | causal),',
  'supported_in_article (boolean), evidence_quality (strong | moderate | weak | asserted).',
  'Each named_sources entry: name, role, attributed_claim (all strings).',
  'Author and publication_date can be null; arrays can be empty; do not invent missing details.',
].join('\n');

export function buildFirstPrinciplesUserPrompt(input: {
  url: string;
  title: string | null;
  text: string;
}): string {
  return [
    'URL: ' + input.url,
    input.title ? 'HTML title: ' + input.title : '',
    'Article body (may include boilerplate; disregard unrelated navigation):',
    input.text,
  ]
    .filter(Boolean)
    .join('\n\n');
}
