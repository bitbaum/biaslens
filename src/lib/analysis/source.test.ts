import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { cleanPdfPages, pageMetadata, pdfToText, readSource } from './source';

const pdfBytes = readFileSync(join(__dirname, '__fixtures__/clipping.pdf'));
const allow = async () => ({ ok: true });

describe('pdfToText', () => {
  it('reads a press clipping, drops the running header and page numbers, rejoins hyphenation', async () => {
    const result = await pdfToText(new Uint8Array(pdfBytes));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages).toBeGreaterThanOrEqual(2);
    expect(result.text).toContain('Treue Fans der Bürgerpartei');
    expect(result.text).toContain('Wählerinnen');
    expect(result.text).not.toContain('PRESSESPIEGEL');
    expect(result.text).not.toMatch(/^\d+$/m);
  });

  it('explains a PDF that cannot be opened', async () => {
    const result = await pdfToText(new TextEncoder().encode('not a pdf'));
    expect(result).toMatchObject({ ok: false });
  });
});

describe('cleanPdfPages', () => {
  it('keeps body sentences even when they repeat', () => {
    const page = (n: number) => `HEADER LINE\nThe same sentence repeats.\nUnique ${n}.\nSeite ${n}`;
    const text = cleanPdfPages([page(1), page(2), page(3)]);
    expect(text).not.toContain('HEADER LINE');
    expect(text.match(/The same sentence repeats/g)).toHaveLength(3);
    expect(text).not.toContain('Seite');
  });
});

describe('pageMetadata', () => {
  it('reads author, publisher and date from JSON-LD', () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"NewsArticle","headline":"Treue Fans","author":[{"@type":"Person","name":"Anna Muster"}],"publisher":{"@type":"Organization","name":"Seeländer Zeitung"},"datePublished":"2026-10-26T05:00:00Z"}]}</script>`;
    expect(pageMetadata(html)).toEqual({
      authors: ['Anna Muster'],
      publication: 'Seeländer Zeitung',
      date: '2026-10-26T05:00:00Z',
      headline: 'Treue Fans',
    });
  });

  it('falls back to meta tags and ignores author URLs', () => {
    const html =
      '<meta property="og:site_name" content="Example &amp; Co"><meta name="author" content="Ann Lee, Bo Chan"><meta property="article:author" content="https://x.example/ann">';
    expect(pageMetadata(html)).toMatchObject({
      authors: ['Ann Lee', 'Bo Chan'],
      publication: 'Example & Co',
    });
  });
});

describe('readSource', () => {
  it('follows a redirect only after validating the next hop, and reads a PDF', async () => {
    const seen: string[] = [];
    const result = await readSource('https://clips.example/a', 20_000, {
      validate: async (url) => {
        seen.push(url);
        return { ok: true };
      },
      fetch: (async (url: string) =>
        url === 'https://clips.example/a'
          ? new Response(null, { status: 302, headers: { location: '/file.pdf' } })
          : new Response(pdfBytes, {
              headers: { 'content-type': 'application/pdf' },
            })) as typeof fetch,
    });
    expect(seen).toEqual(['https://clips.example/a', 'https://clips.example/file.pdf']);
    expect(result).toMatchObject({ ok: true, kind: 'pdf' });
  });

  it('stops at a hop the SSRF guard refuses', async () => {
    const result = await readSource('https://example.org/a', 20_000, {
      validate: async (url) =>
        url.includes('127.0.0.1') ? { ok: false, reason: 'private address' } : { ok: true },
      fetch: (async () =>
        new Response(null, {
          status: 301,
          headers: { location: 'http://127.0.0.1/admin' },
        })) as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, url: 'http://127.0.0.1/admin', reason: 'private address' });
  });

  it('names a paywall refusal and an unsupported file type', async () => {
    const refused = await readSource('https://example.org/a', 1000, {
      validate: allow,
      fetch: (async () => new Response('', { status: 403 })) as unknown as typeof fetch,
    });
    expect(refused.ok === false && refused.reason).toMatch(/login or subscription/);
    const image = await readSource('https://example.org/a.png', 1000, {
      validate: allow,
      fetch: (async () =>
        new Response('x', { headers: { 'content-type': 'image/png' } })) as unknown as typeof fetch,
    });
    expect(image.ok === false && image.reason).toMatch(/image\/png/);
  });

  it('returns readable HTML text with the page metadata', async () => {
    const body = 'Ein langer Absatz über die Umfrage und ihre Auswertung. '.repeat(12);
    const html = `<html><head><title>Treue Fans</title><meta name="author" content="Anna Muster"></head><body><article><h1>Treue Fans</h1><p>${body}</p></article></body></html>`;
    const result = await readSource('https://example.org/a', 20_000, {
      validate: allow,
      fetch: (async () =>
        new Response(html, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })) as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, kind: 'html', title: 'Treue Fans' });
    if (result.ok) {
      expect(result.text).toContain('Umfrage');
      expect(result.metadata?.authors).toEqual(['Anna Muster']);
    }
  });
});
