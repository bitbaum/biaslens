import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderCard, type CardContent } from './card';

/**
 * next/og asks fonts.googleapis.com for any character no given font has (and
 * cdn.jsdelivr.net for emoji) while it draws. The card shows text from any
 * article in any language, so every face comes from @bitbaum/design-tokens and
 * what they lack is left out: drawing a card must fetch nothing.
 */
describe('renderCard', () => {
  afterEach(() => vi.restoreAllMocks());

  const content: CardContent = {
    kicker: 'Kommentar 🗞️',
    title: 'Αθήνα, 東京 und Zürich: wer zahlt ₿? ✓',
    source: 'Ελληνική Εφημερίδα',
    finding: 'Die Überschrift wertet — der Text belegt es nicht. → «so nicht»',
    passage: 'Жизнь 🐾 «Zitat»',
    more: ['Weitere Lesart'],
    note: 'AI reading · not a fact check',
    url: 'https://biaslens.example/a/1',
  };

  it.each(['og', 'square', 'story'] as const)(
    'draws the %s card without a network request',
    async (format) => {
      const realFetch = globalThis.fetch;
      const requested: string[] = [];
      vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = String(input instanceof Request ? input.url : input);
        if (!url.startsWith('data:')) requested.push(url);
        return realFetch(input, init);
      });
      const png = Buffer.from(await (await renderCard(content, format)).arrayBuffer());
      expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
      expect(requested).toEqual([]);
    },
  );
});
