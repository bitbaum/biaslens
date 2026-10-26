/**
 * Read an article from a URL: an HTML page (with the publisher's own byline
 * metadata) or a PDF (press clippings arrive this way).
 *
 * Why not only `readPage` from @bitbaum/ai-kit/web: it returns text and title
 * but refuses PDFs and drops the page's JSON-LD / meta tags, and the byline is
 * the most reliable thing a page states about itself. The fetch loop reuses
 * ai-kit's SSRF guard on every redirect hop and its readable-text extractor, so
 * only the parts ai-kit lacks live here. Candidates to move into ai-kit/web.
 */
import { extractReadableText, validateFetchTarget } from '@bitbaum/ai-kit/web';

import type { PageMetadata } from './prompts';
import { cleanSourceText } from './quote-locate';

export const MAX_HTML_BYTES = 1_500_000;
export const MAX_PDF_BYTES = 10_000_000;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 15_000;

export type SourceResult =
  | {
      ok: true;
      url: string;
      kind: 'html' | 'pdf';
      title: string | null;
      text: string;
      truncated: boolean;
      metadata: PageMetadata | null;
      pages?: number;
    }
  | { ok: false; url: string; reason: string };

type FetchLike = typeof globalThis.fetch;

export interface SourceDeps {
  fetch?: FetchLike;
  validate?: (url: string) => Promise<{ ok: boolean; reason?: string }>;
}

async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(await response.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return joined;
}

export async function readSource(
  rawUrl: string,
  maxChars: number,
  deps: SourceDeps = {},
): Promise<SourceResult> {
  const doFetch = deps.fetch ?? globalThis.fetch;
  const validate =
    deps.validate ??
    (async (url: string) => {
      const verdict = await validateFetchTarget(url);
      return verdict.ok ? { ok: true } : { ok: false, reason: verdict.reason };
    });
  let target = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const verdict = await validate(target);
    if (!verdict.ok) {
      return { ok: false, url: target, reason: verdict.reason ?? 'That address cannot be read.' };
    }
    let response: Response;
    try {
      response = await doFetch(target, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,text/plain;q=0.8',
          'user-agent': 'Mozilla/5.0 (compatible; BiasLens/1.0; +https://biaslens.orangecat.ch)',
        },
      });
    } catch (error) {
      const timeout = error instanceof Error && /timeout|abort/i.test(error.name + error.message);
      return {
        ok: false,
        url: target,
        reason: timeout ? 'The site took too long to answer.' : 'The site could not be reached.',
      };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return { ok: false, url: target, reason: 'The site redirected nowhere.' };
      target = new URL(location, target).toString();
      continue;
    }
    if (response.status === 401 || response.status === 403 || response.status === 402) {
      return {
        ok: false,
        url: target,
        reason: `The site refused automated reading (${response.status}); it may need a login or subscription.`,
      };
    }
    if (!response.ok) {
      return { ok: false, url: target, reason: `The site answered ${response.status}.` };
    }
    const type = (response.headers.get('content-type') ?? '').toLowerCase();
    const isPdf = type.includes('application/pdf') || /\.pdf(?:$|[?#])/i.test(target);
    if (isPdf) {
      const bytes = await readCapped(response, MAX_PDF_BYTES);
      if (!bytes) return { ok: false, url: target, reason: 'The PDF is larger than 10 MB.' };
      const pdf = await pdfToText(bytes);
      if (!pdf.ok) return { ok: false, url: target, reason: pdf.reason };
      return {
        ok: true,
        url: target,
        kind: 'pdf',
        title: pdf.title,
        text: pdf.text.slice(0, maxChars),
        truncated: pdf.text.length > maxChars,
        metadata: null,
        pages: pdf.pages,
      };
    }
    if (type && !/text\/html|application\/xhtml|text\/plain/.test(type)) {
      return {
        ok: false,
        url: target,
        reason: `That is a ${type.split(';')[0]} file, not an article BiasLens can read.`,
      };
    }
    const bytes = await readCapped(response, MAX_HTML_BYTES);
    if (!bytes) return { ok: false, url: target, reason: 'The page is too large to read.' };
    const html = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const extracted = extractReadableText(html, maxChars, target);
    return {
      ok: true,
      url: target,
      kind: 'html',
      title: extracted.title || null,
      text: cleanSourceText(extracted.text),
      truncated: extracted.truncated,
      metadata: pageMetadata(html),
    };
  }
  return { ok: false, url: target, reason: 'The site redirected too many times.' };
}

// ————— HTML metadata —————

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function metaContent(html: string, key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${key.replace(/[:.]/g, '\\$&')}["'][^>]*>`,
    'i',
  );
  const tag = html.match(pattern)?.[0];
  const content = tag?.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const value = content ? decode(content[1] ?? content[2] ?? '') : '';
  return value || null;
}

type Json = Record<string, unknown>;

function names(value: unknown): string[] {
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) =>
      typeof item === 'string'
        ? item
        : item && typeof item === 'object' && typeof (item as Json).name === 'string'
          ? ((item as Json).name as string)
          : '',
    )
    .map((name) => decode(name))
    .filter((name) => name && !/^https?:\/\//.test(name));
}

function articleNodes(value: unknown): Json[] {
  if (Array.isArray(value)) return value.flatMap(articleNodes);
  if (!value || typeof value !== 'object') return [];
  const node = value as Json;
  const graph = node['@graph'] ? articleNodes(node['@graph']) : [];
  const type = node['@type'];
  const types = (Array.isArray(type) ? type : [type]).map(String);
  return types.some((item) => /Article|Posting|Report/i.test(item)) ? [node, ...graph] : graph;
}

export function pageMetadata(html: string): PageMetadata | null {
  let authors: string[] = [];
  let publication: string | null = null;
  let date: string | null = null;
  let headline: string | null = null;
  for (const match of html.matchAll(
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      for (const node of articleNodes(JSON.parse(match[1]!))) {
        if (!authors.length) authors = names(node.author);
        if (!publication) publication = names(node.publisher)[0] ?? null;
        if (!date && typeof node.datePublished === 'string') date = node.datePublished;
        if (!headline && typeof node.headline === 'string') headline = decode(node.headline);
      }
    } catch {
      // Malformed JSON-LD is common; the meta tags below still apply.
    }
  }
  if (!authors.length) {
    const author = metaContent(html, 'author') ?? metaContent(html, 'article:author');
    if (author && !/^https?:\/\//.test(author)) authors = author.split(/\s*(?:,|;| und | and )\s*/);
  }
  publication ??= metaContent(html, 'og:site_name');
  date ??= metaContent(html, 'article:published_time') ?? metaContent(html, 'date');
  headline ??= metaContent(html, 'og:title');
  if (!authors.length && !publication && !date && !headline) return null;
  return { authors: authors.slice(0, 6), publication, date, headline };
}

// ————— PDF —————

/**
 * Text from a PDF: pages joined, running headers/footers that repeat on most
 * pages removed, hyphenation rejoined. A scanned PDF has no text layer; say so.
 */
export async function pdfToText(
  bytes: Uint8Array,
): Promise<
  { ok: true; text: string; title: string | null; pages: number } | { ok: false; reason: string }
> {
  let pages: string[];
  let title: string | null = null;
  try {
    const { extractText, getDocumentProxy, getMeta } = await import('unpdf');
    const document = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractText(document, { mergePages: false });
    pages = result.text;
    try {
      const meta = await getMeta(document);
      const info = meta.info as Record<string, unknown> | undefined;
      title = typeof info?.Title === 'string' && info.Title.trim() ? info.Title.trim() : null;
    } catch {
      title = null;
    }
  } catch {
    return { ok: false, reason: 'This PDF could not be opened. It may be damaged or encrypted.' };
  }
  const text = cleanPdfPages(pages);
  if (text.replace(/\s/g, '').length < 100) {
    return {
      ok: false,
      reason:
        'This PDF has no readable text layer (it is probably a scan). Copy the text into the paste box instead.',
    };
  }
  return { ok: true, text, title, pages: pages.length };
}

export function cleanPdfPages(pages: string[]): string {
  const pageLines = pages.map((page) =>
    page
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
  // Running headers and footers sit in the first or last lines of a page and
  // repeat across most pages ("PRESSESPIEGEL | Seite 3"). Body text is never
  // judged by repetition: an article may repeat a sentence on purpose.
  const edge = (lines: string[]) => new Set([...lines.slice(0, 3), ...lines.slice(-3)]);
  const counts = new Map<string, number>();
  for (const lines of pageLines) {
    for (const line of edge(lines)) counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  const threshold = Math.max(2, Math.ceil(pages.length * 0.6));
  const isRunning = (line: string, index: number, lines: string[]) =>
    (index < 3 || index >= lines.length - 3) &&
    line.length <= 120 &&
    // Running heads are labels, not sentences.
    !/[.!?:»“”"]$/.test(line) &&
    pages.length >= 2 &&
    (counts.get(line) ?? 0) >= threshold;
  const body = pageLines
    .map((lines) =>
      lines.filter(
        (line, index) =>
          !isRunning(line, index, lines) &&
          !/^(?:seite|page)?\s*\d+(?:\s*(?:\/|von|of)\s*\d+)?$/i.test(line),
      ),
    )
    .map((lines) => lines.join('\n'))
    .join('\n\n');
  return cleanSourceText(body);
}
