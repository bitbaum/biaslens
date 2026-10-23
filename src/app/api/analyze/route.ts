import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { readPage } from '@bitbaum/ai-kit/web';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { analyzeArticle, AnalysisFailure } from '@/lib/analysis/run';
import { parseAnalyzeInput } from '@/lib/analysis/input';

export const runtime = 'nodejs';
export const maxDuration = 90;
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 50_000;
const REQUESTS_PER_HOUR = 8;
const limiter = slidingWindow({ limit: REQUESTS_PER_HOUR, windowMs: 60 * 60_000 });

class BodyTooLarge extends Error {}

/** A size limit that still holds when Content-Length is missing or dishonest. */
async function boundedJson(req: Request): Promise<unknown> {
  const length = Number(req.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) throw new BodyTooLarge();

  const reader = req.body?.getReader();
  if (!reader) return {};
  const decoder = new TextDecoder();
  let size = 0;
  let raw = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLarge();
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  return JSON.parse(raw);
}

const errorBody = (code: string, message: string) => ({
  ok: false as const,
  error: { code, message },
});

/**
 * Public beta analysis route. Each request is capped before any external
 * fetch/model spend; the limiter is bounded and keyed by the fleet's proxy-safe
 * client-IP parser. For horizontal deployments a shared store is needed.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return Response.json(errorBody('ORIGIN_DENIED', 'Request origin is not allowed.'), {
          status: 403,
        });
      }
    } catch {
      return Response.json(errorBody('ORIGIN_DENIED', 'Request origin is not allowed.'), {
        status: 403,
      });
    }
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json(errorBody('BAD_MEDIA_TYPE', 'Send application/json.'), { status: 415 });
  }

  const limit = limiter.check('analyze:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed) {
    return Response.json(
      errorBody('RATE_LIMITED', 'Analysis limit reached for this hour. Try again later.'),
      { status: 429, headers },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await boundedJson(request);
  } catch (error) {
    const large = error instanceof BodyTooLarge;
    return Response.json(
      errorBody(
        large ? 'BODY_TOO_LARGE' : 'INVALID_JSON',
        large ? 'Request body is too large.' : 'Request body must be JSON.',
      ),
      { status: large ? 413 : 400, headers },
    );
  }

  const input = parseAnalyzeInput(parsedBody);
  if (!input.ok) {
    return Response.json(errorBody('INVALID_INPUT', input.error), { status: 400, headers });
  }

  const chain = usableChain(freeChain('BIASLENS'), process.env);
  if (chain.length === 0) {
    return Response.json(
      errorBody('MODEL_UNAVAILABLE', 'Analysis is not configured on this server yet.'),
      { status: 503, headers },
    );
  }

  try {
    const result = await analyzeArticle(input.data, {
      readPage: (url) => readPage(url, { maxChars: 20_000, maxBytes: 1_000_000 }),
      complete: async (messages) => {
        const response = await complete({
          chain,
          messages,
          signal: AbortSignal.any([request.signal, AbortSignal.timeout(75_000)]),
          timeoutMs: 22_000,
          maxTokens: 3_600,
          temperature: 0.2,
          reasoning: 'light',
        });
        return { text: response.text, modelId: response.id };
      },
    });
    return Response.json({ ok: true, result }, { status: 200, headers });
  } catch (error) {
    if (error instanceof AnalysisFailure) {
      return Response.json(errorBody(error.code, error.message), {
        status: error.status,
        headers,
      });
    }
    if (request.signal.aborted) {
      return Response.json(errorBody('CANCELLED', 'The request was cancelled.'), {
        status: 499,
        headers,
      });
    }
    console.error(
      'BiasLens analysis provider error',
      error instanceof Error ? error.name : 'unknown',
    );
    return Response.json(
      errorBody(
        'MODEL_UNAVAILABLE',
        'The analysis service could not produce a report. Please retry later.',
      ),
      { status: 503, headers },
    );
  }
}
