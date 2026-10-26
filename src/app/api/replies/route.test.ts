import { describe, expect, it } from 'vitest';

import { parseReplyInput } from '@/lib/replies/input';

import { POST } from './route';

const valid = {
  reportId: 'abcDEF2345',
  occasion: 'friend',
  length: 'line',
  blocks: ['voices', 'findings'],
  senderName: '  Anna ',
  note: '',
};

describe('parseReplyInput', () => {
  it('accepts a reply, orders blocks and trims optional text', () => {
    expect(parseReplyInput(valid)).toEqual({
      ok: true,
      data: {
        reportId: 'abcDEF2345',
        parentReplyId: null,
        occasion: 'friend',
        length: 'line',
        blocks: ['findings', 'voices'],
        senderName: 'Anna',
        note: null,
        rewriteId: null,
      },
    });
  });

  it('always includes the findings', () => {
    const parsed = parseReplyInput({ ...valid, blocks: ['questions'] });
    expect(parsed.ok && parsed.data.blocks).toEqual(['findings', 'questions']);
  });

  it('refuses unknown values and oversized text', () => {
    expect(parseReplyInput({ ...valid, reportId: '../../etc' }).ok).toBe(false);
    expect(parseReplyInput({ ...valid, occasion: 'spam' }).ok).toBe(false);
    expect(parseReplyInput({ ...valid, blocks: ['script'] }).ok).toBe(false);
    expect(parseReplyInput({ ...valid, note: 'x'.repeat(501) }).ok).toBe(false);
    expect(parseReplyInput({ ...valid, parentReplyId: 7 }).ok).toBe(false);
  });
});

describe('POST /api/replies', () => {
  it('refuses another origin and explains a missing database', async () => {
    const make = (headers: Record<string, string>) =>
      new Request('https://biaslens.example/api/replies', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.9',
          ...headers,
        },
        body: JSON.stringify(valid),
      });
    expect((await POST(make({ origin: 'https://elsewhere.example' }))).status).toBe(403);
    const response = await POST(make({}));
    expect(response.status).toBe(503);
  });
});
