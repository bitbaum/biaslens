import type { EvidenceStance } from './epistemic-graph';

export interface InquirySource {
  id: string;
  title: string;
  url: string;
  locator: string;
  excerpt: string;
  stance: EvidenceStance;
  addedAt: string;
}

export interface InquiryRecord {
  version: 1;
  question: string;
  scope: string;
  notes: string;
  challenge: string;
  sources: InquirySource[];
}

export const EMPTY_INQUIRY: InquiryRecord = { version: 1, question: '', scope: '', notes: '', challenge: '', sources: [] };

export function isSourceURL(value: string): boolean {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Validate browser storage as untrusted data. No source is promoted to reviewed. */
export function parseInquiryRecord(input: unknown): InquiryRecord | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  if (r.version !== 1 || !Array.isArray(r.sources) || r.sources.length > 100) return null;
  for (const key of ['question', 'scope', 'notes', 'challenge']) {
    if (typeof r[key] !== 'string' || r[key].length > 20000) return null;
  }
  const ids = new Set<string>();
  for (const source of r.sources) {
    if (!source || typeof source !== 'object') return null;
    const s = source as Record<string, unknown>;
    for (const key of ['id', 'title', 'url', 'locator', 'excerpt', 'addedAt']) {
      if (typeof s[key] !== 'string' || s[key].length > 20000) return null;
    }
    if (!s.id || !s.title || ids.has(s.id as string) || !isSourceURL(s.url as string)) return null;
    if (!['supports', 'contradicts', 'context'].includes(s.stance as string)) return null;
    ids.add(s.id as string);
  }
  return r as unknown as InquiryRecord;
}

