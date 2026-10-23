import { describe, expect, it } from 'vitest';

import { getWhitepaper } from './whitepaper';

describe('the public white paper uses the shared publishing reader', () => {
  it('loads a versioned paper with substantive content', () => {
    const paper = getWhitepaper();
    expect(paper?.title).toBe('Open investigation, inspectable evidence');
    expect(paper?.date).toBe('2026-10-22');
    expect(paper?.blocks.length).toBeGreaterThan(20);
  });
});
