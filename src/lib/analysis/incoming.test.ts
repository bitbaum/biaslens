import { describe, expect, it } from 'vitest';

import { incomingSource } from './incoming';

describe('incomingSource', () => {
  it('takes ?u= first', () => {
    expect(incomingSource({ u: 'https://example.ch/a', text: 'https://other.ch/b' })).toBe(
      'https://example.ch/a',
    );
  });

  it('finds a link inside shared text', () => {
    expect(incomingSource({ text: 'Read this: https://example.ch/story?id=4 wow' })).toBe(
      'https://example.ch/story?id=4',
    );
  });

  it('ignores anything that is not a web link', () => {
    expect(incomingSource({ u: 'javascript:alert(1)' })).toBeNull();
    expect(incomingSource({})).toBeNull();
  });
});
