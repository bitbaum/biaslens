/**
 * What a person may send when writing. Validated as untrusted input on every
 * write, and the limits are stated once, here.
 */
import { PUBLIC_ID } from '@/lib/reports/store';

export const WRITING_LIMITS = {
  title: 160,
  body: 60_000,
  bodyMin: 1,
  excerpt: 240,
  sourceTitle: 300,
  sourceUrl: 2000,
} as const;

export const STATUSES = ['draft', 'published'] as const;
export type WritingStatus = (typeof STATUSES)[number];

export interface WritingInput {
  title: string;
  body: string;
  status: WritingStatus;
  respondToId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
}

export type ParsedWriting = { ok: true; data: WritingInput } | { ok: false; problems: string[] };

const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;

const optionalText = (value: unknown, max: number): string | null | undefined => {
  if (value === undefined || value === null) return null;
  if (!text(value, max)) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

function httpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Parse a request body into a WritingInput, or say exactly what is wrong. */
export function parseWritingInput(input: unknown): ParsedWriting {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { ok: false, problems: ['Send a JSON object.'] };
  const r = input as Record<string, unknown>;
  const problems: string[] = [];

  const title = typeof r.title === 'string' ? r.title.trim() : '';
  if (!title) problems.push('Give the article a title.');
  else if (title.length > WRITING_LIMITS.title)
    problems.push(`The title must be ${WRITING_LIMITS.title} characters or fewer.`);

  const body = typeof r.body === 'string' ? r.body.trim() : '';
  if (body.length < WRITING_LIMITS.bodyMin) problems.push('Write something before saving.');
  else if (body.length > WRITING_LIMITS.body)
    problems.push(
      `The article must be ${WRITING_LIMITS.body.toLocaleString('en')} characters or fewer.`,
    );

  const status = r.status === undefined ? 'published' : r.status;
  if (!STATUSES.includes(status as WritingStatus))
    problems.push('Status must be draft or published.');

  let respondToId: string | null = null;
  if (r.respondToId !== undefined && r.respondToId !== null) {
    if (typeof r.respondToId === 'string' && PUBLIC_ID.test(r.respondToId))
      respondToId = r.respondToId;
    else problems.push('respondToId must be an article id.');
  }

  const sourceUrl = optionalText(r.sourceUrl, WRITING_LIMITS.sourceUrl);
  if (sourceUrl === undefined) problems.push('The source link is too long.');
  else if (sourceUrl && !httpUrl(sourceUrl)) problems.push('The source link must be http(s).');

  const sourceTitle = optionalText(r.sourceTitle, WRITING_LIMITS.sourceTitle);
  if (sourceTitle === undefined) problems.push('The source headline is too long.');

  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    data: {
      title,
      body,
      status: status as WritingStatus,
      respondToId,
      sourceUrl: sourceUrl ?? null,
      sourceTitle: sourceTitle ?? null,
    },
  };
}

/** The first sentences of a markdown body, as plain text, for lists and previews. */
export function excerptOf(body: string, max: number = WRITING_LIMITS.excerpt): string {
  const first = body.split(/\n\s*\n/).find((block) => block.trim().length > 0) ?? '';
  const plain = first
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const atSpace = cut.lastIndexOf(' ');
  return (atSpace > max / 2 ? cut.slice(0, atSpace) : cut).trimEnd() + '…';
}

/** Whole minutes at an ordinary reading pace, never 0. */
export function readingMinutes(body: string): number {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}
