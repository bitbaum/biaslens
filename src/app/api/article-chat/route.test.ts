import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  complete: vi.fn(async (options: { messages: Array<{ role: string; content: string }> }) => ({
    text: JSON.stringify({
      answer: 'The report says costs fell.',
      source_quote: options.messages[1]?.content.includes('Costs fell by 12%')
        ? 'Costs fell by 12%.'
        : null,
    }),
    id: 'mock/article-chat',
  })),
}));

vi.mock('@bitbaum/ai-kit', () => ({
  complete: mocks.complete,
  freeChain: () => [{ name: 'configured-in-test' }],
  usableChain: () => [{ name: 'configured-in-test' }],
}));

import { POST } from './route';

const TEXT = 'An article reports the following result. Costs fell by 12%. '.repeat(5);
const DIGEST = createHash('sha256').update(TEXT).digest('hex');

function request(body: unknown, ip: string, headers: Record<string, string> = {}) {
  return new Request('https://biaslens.example/api/article-chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    question: 'What did the article report?',
    text: TEXT,
    sourceDigest: DIGEST,
    outputLanguage: 'en',
    ...overrides,
  };
}

describe('POST /api/article-chat', () => {
  it('answers from the matching article and retains only an exact source passage', async () => {
    const response = await POST(request(payload(), '203.0.113.110'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      answer: 'The report says costs fell.',
      sourceQuote: 'Costs fell by 12%.',
      sourceDigest: DIGEST,
    });
    expect(mocks.complete).toHaveBeenCalledOnce();
    expect(mocks.complete.mock.calls[0][0].messages[0].content).toContain(
      'Write the answer in English.',
    );
  });

  it('drops model quotes not found exactly in the inspected article', async () => {
    mocks.complete.mockResolvedValueOnce({
      text: JSON.stringify({ answer: 'An answer.', source_quote: 'Invented passage.' }),
      id: 'mock/article-chat',
    });
    const response = await POST(request(payload(), '203.0.113.111'));
    await expect(response.json()).resolves.toMatchObject({ ok: true, sourceQuote: null });
  });

  it('rejects a changed article whose digest does not match the displayed report', async () => {
    const before = mocks.complete.mock.calls.length;
    const response = await POST(request(payload({ text: TEXT + 'different' }), '203.0.113.112'));
    expect(response.status).toBe(400);
    expect(mocks.complete).toHaveBeenCalledTimes(before);
  });

  it('rejects cross-origin requests before calling a model', async () => {
    const response = await POST(
      request(payload(), '203.0.113.113', { origin: 'https://attacker.example' }),
    );
    expect(response.status).toBe(403);
  });

  it('rejects unsupported languages and oversized article context', async () => {
    expect((await POST(request(payload({ outputLanguage: 'it' }), '203.0.113.114'))).status).toBe(
      400,
    );
    expect(
      (await POST(request(payload({ text: 'a'.repeat(18_001) }), '203.0.113.115'))).status,
    ).toBe(400);
  });

  it('rate limits before provider calls', async () => {
    const ip = '203.0.113.116';
    const before = mocks.complete.mock.calls.length;
    for (let i = 0; i < 8; i++) await POST(request({}, ip));
    const response = await POST(request(payload(), ip));
    expect(response.status).toBe(429);
    expect(response.headers.has('retry-after')).toBe(true);
    expect(mocks.complete).toHaveBeenCalledTimes(before);
  });
});
