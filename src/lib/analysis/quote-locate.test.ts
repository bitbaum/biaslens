import { describe, expect, it } from 'vitest';

import { cleanSourceText, locateQuote } from './quote-locate';

describe('locateQuote', () => {
  it('finds a quote despite curly quotes, line breaks and non-breaking spaces', () => {
    const text = 'Er sagte: «Das ist\nein klarer Erfolgsfaktor», und ging.';
    const found = locateQuote(text, '"Das ist ein klarer Erfolgsfaktor"');
    expect(found?.text).toBe('Das ist\nein klarer Erfolgsfaktor');
    expect(text.slice(found!.start, found!.end)).toBe(found!.text);
  });

  it('matches German „…“ and French « … » quotation marks', () => {
    expect(
      locateQuote(
        'Er nannte es „eine harte Linie gegen Kriminalität“.',
        '"eine harte Linie gegen Kriminalität"',
      ),
    ).not.toBeNull();
    expect(
      locateQuote(
        'Il a parlé d’« une ligne dure contre la criminalité ».',
        "d'« une ligne dure contre la criminalité »",
      ),
    ).not.toBeNull();
  });

  it('returns the article text, never the model string', () => {
    const found = locateQuote(
      'Traffic fell — by 30 percent — after the lane opened.',
      'Traffic fell - by 30 percent - after',
    );
    expect(found?.text).toBe('Traffic fell — by 30 percent — after');
  });

  it('fails a near miss with one changed word', () => {
    expect(
      locateQuote(
        'Traffic fell by 30 percent after the lane opened.',
        'Traffic fell by 40 percent after the lane opened.',
      ),
    ).toBeNull();
  });

  it('ignores quotes too short to identify a passage', () => {
    expect(locateQuote('Yes, it did.', 'it did')).toBeNull();
    expect(locateQuote('anything', null)).toBeNull();
  });
});

describe('cleanSourceText', () => {
  it('rejoins line-break hyphenation but keeps compound hyphens', () => {
    expect(cleanSourceText('Wähler-\ninnen und Balkan-\nSchweizer')).toBe(
      'Wählerinnen und Balkan-\nSchweizer',
    );
  });

  it('composes decomposed umlauts and drops soft hyphens', () => {
    expect(cleanSourceText('Wähler Unter­stützung')).toBe('Wähler Unterstützung');
  });
});
