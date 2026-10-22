import { describe, expect, it } from 'vitest';

import { getPublishedPost, listPublishedPosts } from './blog';

describe('journal content: bip-kit is the single source reader', () => {
  it('returns published articles newest-first with usable slugs', () => {
    const posts = listPublishedPosts();
    expect(posts.length).toBeGreaterThanOrEqual(2);
    expect(posts.map((p) => p.slug)).toContain('why-we-dont-have-a-truth-meter');
    expect(posts.map((p) => p.slug)).toContain('how-to-measure-a-political-debate');
    expect(posts.every((post) => post.title && post.summary && post.blocks.length)).toBe(true);
    expect(posts.every((post) => post.date === '2026-10-22')).toBe(true);
  });

  it('resolves safe slugs but rejects an unknown article or path traversal', () => {
    expect(getPublishedPost('how-to-measure-a-political-debate')?.title).toMatch(/debate/i);
    expect(getPublishedPost('../../.env')).toBeUndefined();
    expect(getPublishedPost('not-a-real-article')).toBeUndefined();
  });
});
