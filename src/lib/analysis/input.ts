/**
 * Input boundary for a real on-demand analysis. Parsing does not perform
 * network access and never treats a pasted URL as verified attribution.
 */
export const MAX_TEXT_CHARS = 30_000;
export const MAX_SOURCE_URL_CHARS = 2_048;
export const MIN_TEXT_CHARS = 200;

export interface AnalyzeInput {
  mode: 'url' | 'text';
  url: string | null;
  text: string | null;
  outputLanguage?: 'en' | 'de' | 'fr';
}

export type InputResult = { ok: true; data: AnalyzeInput } | { ok: false; error: string };

export function parseAnalyzeInput(value: unknown): InputResult {
  const invalid = (error: string): InputResult => ({ ok: false, error });
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalid('Send a JSON object containing a URL or pasted article text.');
  }

  const raw = value as Record<string, unknown>;
  const outputLanguage = raw.outputLanguage ?? 'en';
  if (!['en', 'de', 'fr'].includes(String(outputLanguage))) {
    return invalid('Choose English, German or French for the analysis.');
  }
  if (raw.url !== undefined && typeof raw.url !== 'string') {
    return invalid('URL must be a string.');
  }
  if (raw.text !== undefined && typeof raw.text !== 'string') {
    return invalid('Article text must be a string.');
  }

  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';

  if (url.length > MAX_SOURCE_URL_CHARS) return invalid('URL is too long.');
  if (text.length > MAX_TEXT_CHARS) {
    return invalid('Pasted article text exceeds 30,000 characters. Shorten it to continue.');
  }
  if (text && text.length < MIN_TEXT_CHARS) {
    return invalid('Article text must contain at least 200 characters.');
  }
  if (!text && !url) return invalid('Provide an article URL or paste its text.');

  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return invalid('Enter a valid article URL.');
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      !['', '80', '443'].includes(parsed.port)
    ) {
      return invalid('Only public HTTP(S) URLs without credentials or custom ports are allowed.');
    }
  }

  return {
    ok: true,
    data: {
      mode: text ? 'text' : 'url',
      url: url || null,
      text: text || null,
      outputLanguage: outputLanguage as AnalyzeInput['outputLanguage'],
    },
  };
}
