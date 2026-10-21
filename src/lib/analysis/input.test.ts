import { describe, expect, it } from 'vitest';

import { parseAnalyzeInput } from './input';

describe('parseAnalyzeInput', () => {
  const text = 'A public claim needs evidence and critical reasoning. '.repeat(7);

  it('accepts a URL-only request', () => {
    expect(parseAnalyzeInput({ url: ' https://example.org/article ' })).toEqual({
      ok: true,
      data: { url: 'https://example.org/article', mode: 'url', text: null },
    });
  });

  it('accepts text alone and labels a supplied URL as unverified attribution', () => {
    expect(parseAnalyzeInput({ text })).toEqual({
      ok: true,
      data: { mode: 'text', url: null, text: text.trim() },
    });
    expect(parseAnalyzeInput({ url: 'https://example.org/a', text })).toEqual({
      ok: true,
      data: { url: 'https://example.org/a', mode: 'text', text: text.trim() },
    });
  });

  it.each([
    null,
    [],
    {},
    { url: 123 },
    { text: false },
    { url: 'file:///etc/passwd' },
    { url: 'http://localhost:5432/secret' },
    { url: 'https://user:pass@example.com/' },
    { text: 'too short' },
    { text: 'a'.repeat(30_001) },
    { url: 'https://example.org/' + 'a'.repeat(2_050) },
  ])('rejects malformed and dangerous input %#', (body) => {
    expect(parseAnalyzeInput(body).ok).toBe(false);
  });

  it('never treats pasted text as checked against the linked page', () => {
    const result = parseAnalyzeInput({ url: 'https://example.org/a', text });
    expect(result.ok && result.data.mode).toBe('text');
  });
});
