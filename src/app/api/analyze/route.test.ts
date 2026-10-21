import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const analysis = JSON.stringify({
    title: 'Example report',
    author: null,
    publication: 'Example news',
    publication_date: null,
    language: 'en',
    summary: 'This report describes policy proposals.',
    core_claims: [
      {
        claim: 'The policy would increase investment.',
        type: 'causal',
        supported_in_article: false,
        evidence_quality: 'asserted',
      },
    ],
    first_principles_critique: 'What is the identified mechanism?',
    named_sources: [],
    biases_to_consider: 'Check which outcomes were omitted.',
    what_would_change_assessment: 'An independent controlled evaluation.',
  });
  return {
    complete: vi.fn(async () => ({ text: analysis, id: 'mock/model' })),
    readPage: vi.fn(async (url: string) => ({
      ok: true,
      url,
      title: 'Example report',
      text: 'An independent researcher investigates a new economic proposal. '.repeat(7),
      truncated: false,
    })),
  };
});

vi.mock('@bitbaum/ai-kit', () => ({
  complete: mocks.complete,
  freeChain: () => [{ name: 'configured-in-test' }],
  usableChain: () => [{ name: 'configured-in-test' }],
}));

vi.mock('@bitbaum/ai-kit/web', () => ({ readPage: mocks.readPage }));

import { POST } from './route';

const SOURCE = 'https://example.org/article';
const TEXT = 'The article contains a lengthy series of claims about economic policy. '.repeat(7);

function request(body: unknown, ip: string, extras: Record<string, string> = {}): Request {
  return new Request('https://biaslens.example/api/analyze', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      ...extras,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze', () => {
  it('rejects cross-origin calls before any model request', async () => {
    const res = await POST(
      request({ url: SOURCE }, '203.0.113.61', { origin: 'https://malicious.example' }),
    );
    expect(res.status).toBe(403);
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('validates malformed inputs without fetching or invoking the model', async () => {
    const res = await POST(request({ url: 'file:///etc/passwd' }, '203.0.113.62'));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID_INPUT');
    expect(mocks.readPage).not.toHaveBeenCalled();
  });

  it('prevents oversized requests from reaching the analysis pipeline', async () => {
    const res = await POST(
      request({ url: SOURCE }, '203.0.113.63', { 'content-length': '99000' }),
    );
    expect(res.status).toBe(413);
  });

  it('never spends tokens on unsupported media types', async () => {
    const res = await POST(
      request({ url: SOURCE }, '203.0.113.64', { 'content-type': 'text/plain' }),
    );
    expect(res.status).toBe(415);
  });

  it('returns validated analysis and explicit unverified provenance for pasted text', async () => {
    const res = await POST(request({ url: SOURCE, text: TEXT }, '203.0.113.65'));
    expect(res.status).toBe(200);
    const output = await res.json();
    expect(output.ok).toBe(true);
    expect(output.result.independentlyVerified).toBe(false);
    expect(output.result.origin).toMatchObject({
      attribution: 'user-asserted',
      kind: 'user-pasted-text',
    });
    expect(mocks.complete).toHaveBeenCalled();
  });

  it('routes fetched articles through the shared reader rather than a second scraper', async () => {
    const res = await POST(request({ url: SOURCE }, '203.0.113.66'));
    expect(res.status).toBe(200);
    expect(mocks.readPage).toHaveBeenCalledWith(
      SOURCE,
      expect.objectContaining({ maxChars: 20_000 }),
    );
  });

  it('enforces its rate limit before any expensive model call', async () => {
    const ip = '203.0.113.67';
    const spent = mocks.complete.mock.calls.length;
    for (let index = 0; index < 8; index++) {
      const response = await POST(request({}, ip));
      expect(response.status).toBe(400);
    }
    const blocked = await POST(request({ url: SOURCE }, ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.has('retry-after')).toBe(true);
    expect(mocks.complete.mock.calls.length).toBe(spent);
  });
});
