/**
 * Find a model-proposed quotation in the examined text.
 *
 * Exact byte matching threw away correct quotes whenever a copy-paste or a PDF
 * changed typography: curly vs straight quotes, « » vs " ", a line break or a
 * non-breaking space where the model wrote a space. Matching here ignores only
 * those cosmetic differences. A changed or missing WORD still fails, and the
 * returned text is always the article's own substring, never the model's
 * string, so what we display is what the article says.
 */
export interface LocatedQuote {
  text: string;
  start: number;
  end: number;
}

const MIN_NORMALIZED_LENGTH = 12;

const DOUBLE_QUOTES = '"“”„‟″«»〝〞＂';
const SINGLE_QUOTES = "'‘’‚‛′‹›`´";
const DASHES = '‐‑‒–—―−';
const INVISIBLE = '­​‌‍⁠﻿';

function cosmetic(char: string): string {
  if (DOUBLE_QUOTES.includes(char)) return '"';
  if (SINGLE_QUOTES.includes(char)) return "'";
  if (DASHES.includes(char)) return '-';
  if (char === '…') return '...';
  if (INVISIBLE.includes(char)) return '';
  if (/\s/u.test(char)) return ' ';
  const lower = char.toLowerCase();
  return lower.length === char.length ? lower : char;
}

/**
 * Normalize text, keeping for each normalized character the index of the
 * original character it came from. Whitespace runs collapse to one space.
 */
export function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = '';
  const map: number[] = [];
  for (let index = 0; index < text.length; index++) {
    const replacement = cosmetic(text[index]!);
    for (const char of replacement) {
      if (char === ' ' && (normalized.length === 0 || normalized.endsWith(' '))) continue;
      normalized += char;
      map.push(index);
    }
  }
  return { normalized, map };
}

function trimQuote(quote: string): string {
  // Models often wrap a quotation in its own quote marks or trailing ellipses.
  return quote
    .trim()
    .replace(/^(?:["'“”„«»‘’‚‹›]|\.{3}|…)+\s*/u, '')
    .replace(/\s*(?:["'“”„«»‘’‚‹›]|\.{3}|…)+$/u, '')
    .trim();
}

export function locateQuote(text: string, quote: string | null | undefined): LocatedQuote | null {
  if (!quote) return null;
  const needle = normalizeWithMap(trimQuote(quote)).normalized.trim();
  if (needle.length < MIN_NORMALIZED_LENGTH) return null;
  const haystack = normalizeWithMap(text);
  const at = haystack.normalized.indexOf(needle);
  if (at < 0) return null;
  const start = haystack.map[at]!;
  const end = haystack.map[at + needle.length - 1]! + 1;
  return { text: text.slice(start, end), start, end };
}

/**
 * Ingestion clean-up applied once to every examined text, so offsets and the
 * text shown to readers agree: Unicode NFC (PDFs often decompose umlauts),
 * invisible characters removed, and line-break hyphenation rejoined
 * ("Wähler-\ninnen" → "Wählerinnen"; "Balkan-\nSchweizer" keeps its hyphen).
 */
export function cleanSourceText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[­​‌‍⁠﻿]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/(\p{Ll})-[ \t]*\n[ \t]*(\p{Ll})/gu, '$1$2')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
