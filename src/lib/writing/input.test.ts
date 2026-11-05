import { describe, expect, it } from 'vitest';

import { excerptOf, parseWritingInput, readingMinutes } from './input';

describe('parseWritingInput', () => {
  it('accepts a title and a body, trimming both, and publishes by default', () => {
    expect(parseWritingInput({ title: '  Hello ', body: ' World ' })).toEqual({
      ok: true,
      data: {
        title: 'Hello',
        body: 'World',
        status: 'published',
        respondToId: null,
        sourceUrl: null,
        sourceTitle: null,
      },
    });
  });

  it('keeps a headline it responds to and an article id', () => {
    const parsed = parseWritingInput({
      title: 'T',
      body: 'B',
      status: 'draft',
      respondToId: 'abcDEF2345',
      sourceUrl: 'https://example.org/story',
      sourceTitle: ' A story ',
    });
    expect(parsed.ok && parsed.data).toMatchObject({
      status: 'draft',
      respondToId: 'abcDEF2345',
      sourceUrl: 'https://example.org/story',
      sourceTitle: 'A story',
    });
  });

  it('names every problem instead of the first', () => {
    const parsed = parseWritingInput({
      title: '',
      body: '',
      status: 'later',
      respondToId: '../x',
      sourceUrl: 'javascript:alert(1)',
    });
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.problems).toHaveLength(5);
  });

  it('refuses something that is not an object', () => {
    expect(parseWritingInput('text').ok).toBe(false);
    expect(parseWritingInput(null).ok).toBe(false);
  });
});

describe('excerptOf', () => {
  it('takes the first paragraph as plain text', () => {
    expect(excerptOf('# Head\n\n**Bold** start with a [link](https://x.y).\n\nSecond.')).toBe(
      'Head',
    );
    expect(excerptOf('**Bold** start with a [link](https://x.y).\n\nSecond.')).toBe(
      'Bold start with a link.',
    );
  });

  it('cuts at a word boundary with an ellipsis', () => {
    const long = 'word '.repeat(100).trim();
    const excerpt = excerptOf(long, 50);
    expect(excerpt.length).toBeLessThanOrEqual(50);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt).not.toContain('wor…');
  });
});

describe('readingMinutes', () => {
  it('is at least one minute and about 220 words a minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('w '.repeat(660))).toBe(3);
  });
});
