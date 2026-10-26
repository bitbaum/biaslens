import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from '@/lib/analysis/test-fixture';

const mocks = vi.hoisted(() => ({
  complete: vi.fn(),
  readSource: vi.fn(),
}));

vi.mock('@bitbaum/ai-kit', () => ({
  complete: mocks.complete,
  freeChain: () => [{ name: 'configured-in-test' }],
  usableChain: () => [{ name: 'configured-in-test' }],
}));

vi.mock('@/lib/analysis/source', () => ({ readSource: mocks.readSource }));

beforeEach(() => {
  mocks.complete.mockImplementation(
    async ({ messages }: { messages: { role: string; content: string }[] }) => ({
      text: JSON.stringify(
        messages[0]!.content.includes('make an inventory') ? FIXTURE_READING : FIXTURE_ASSESSMENT,
      ),
      id: 'mock/model',
    }),
  );
  mocks.readSource.mockImplementation(async (url: string) => ({
    ok: true,
    url,
    kind: 'html',
    title: 'Example report',
    text: FIXTURE_ARTICLE,
    truncated: false,
    metadata: null,
  }));
});

import { POST } from './route';

const SOURCE = 'https://example.org/article';
const TEXT = FIXTURE_ARTICLE;

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
    expect(mocks.readSource).not.toHaveBeenCalled();
  });

  it('prevents oversized requests from reaching the analysis pipeline', async () => {
    const res = await POST(
      request({ url: SOURCE }, '203.0.113.63', { 'content-length': '199000' }),
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
    expect(output.result.origin.textSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(output.result.run).toMatchObject({
      methodVersion: '0.1.0',
      promptVersion: 'report@4.1',
    });
    expect(output.result.origin).toMatchObject({
      attribution: 'user-asserted',
      kind: 'user-pasted-text',
    });
    expect(mocks.complete).toHaveBeenCalled();
  });

  it('routes fetched articles through the one source reader', async () => {
    const res = await POST(request({ url: SOURCE }, '203.0.113.66'));
    expect(res.status).toBe(200);
    expect(mocks.readSource).toHaveBeenCalledWith(SOURCE, expect.any(Number));
  });

  it('streams progress stages and the result as NDJSON when asked', async () => {
    const res = await POST(
      request({ text: TEXT, outputLanguage: 'de-CH' }, '203.0.113.68', {
        accept: 'application/x-ndjson',
      }),
    );
    expect(res.headers.get('content-type')).toContain('application/x-ndjson');
    const events = (await res.text())
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(events.filter((event) => event.type === 'stage').map((event) => event.stage)).toEqual([
      'reading',
      'assessing',
      'checking',
    ]);
    expect(events.at(-1)).toMatchObject({ type: 'result', result: { language: 'de-CH' } });
  });

  it('streams a failure as an error event', async () => {
    mocks.complete.mockResolvedValue({ text: 'nonsense', id: 'x' });
    const res = await POST(
      request({ text: TEXT }, '203.0.113.69', { accept: 'application/x-ndjson' }),
    );
    const last = JSON.parse((await res.text()).trim().split('\n').at(-1)!);
    expect(last).toMatchObject({ type: 'error', status: 502, error: { code: 'MODEL_INVALID' } });
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

it('accepts the configured public origin behind the proxy and refuses a spoofed forwarded origin', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://biaslens.example');
  try {
    const make = (origin: string) =>
      new Request('http://localhost:4038/api/analyze', {
        method: 'POST',
        headers: {
          origin,
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.89',
          'x-forwarded-host': 'attacker.example',
          'x-forwarded-proto': 'https',
        },
        body: JSON.stringify({ text: TEXT }),
      });
    expect((await POST(make('https://biaslens.example'))).status).toBe(200);
    expect((await POST(make('https://attacker.example'))).status).toBe(403);
  } finally {
    vi.unstubAllEnvs();
  }
});
