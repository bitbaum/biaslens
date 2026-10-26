import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { analyzeArticle, AnalysisFailure, type AnalysisDeps, type Stage } from '@/lib/analysis/run';
import { parseAnalyzeInput, type AnalyzeInput } from '@/lib/analysis/input';
import { readSource } from '@/lib/analysis/source';

export const runtime = 'nodejs';
export const maxDuration = 150;
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 120_000;
const REQUESTS_PER_HOUR = 8;
const limiter = slidingWindow({ limit: REQUESTS_PER_HOUR, windowMs: 60 * 60_000 });

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
  if (!originAllowed(request)) {
    return Response.json(errorBody('ORIGIN_DENIED', 'Request origin is not allowed.'), {
      status: 403,
    });
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
    parsedBody = await readBoundedJson(request, MAX_BODY_BYTES);
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

  const modelSignal = AbortSignal.any([request.signal, AbortSignal.timeout(140_000)]);
  const deps = (onStage?: (stage: Stage) => void): AnalysisDeps => ({
    readSource: (url, maxChars) => readSource(url, maxChars),
    onStage,
    complete: async (messages, pass) => {
      const response = await complete({
        chain,
        messages,
        signal: modelSignal,
        timeoutMs: 40_000,
        maxTokens: pass === 'reading' ? 3_600 : 3_200,
        temperature: 0.2,
        reasoning: 'light',
        extraBody: { response_format: { type: 'json_object' } },
      });
      return { text: response.text, modelId: response.id };
    },
  });

  // A client that asks for NDJSON gets progress events while the two model
  // passes run (they take 20–90 s). Everyone else gets one JSON response.
  if (request.headers.get('accept')?.includes('application/x-ndjson')) {
    return streamAnalysis(input.data, deps, request.signal, headers);
  }
  try {
    const result = await analyzeArticle(input.data, deps());
    return Response.json({ ok: true, result }, { status: 200, headers });
  } catch (error) {
    const failure = describeFailure(error, request.signal.aborted);
    return Response.json(errorBody(failure.code, failure.message), {
      status: failure.status,
      headers,
    });
  }
}

function describeFailure(error: unknown, aborted: boolean) {
  if (error instanceof AnalysisFailure) {
    return { code: error.code, message: error.message, status: error.status };
  }
  if (aborted) return { code: 'CANCELLED', message: 'The request was cancelled.', status: 499 };
  console.error(
    'BiasLens analysis provider error',
    error instanceof Error ? error.name : 'unknown',
  );
  return {
    code: 'MODEL_UNAVAILABLE',
    message: 'The analysis service could not produce a report. Please retry later.',
    status: 503,
  };
}

function streamAnalysis(
  input: AnalyzeInput,
  deps: (onStage: (stage: Stage) => void) => AnalysisDeps,
  signal: AbortSignal,
  headers: HeadersInit,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          // The reader went away; the analysis is abandoned with it.
        }
      };
      try {
        const result = await analyzeArticle(
          input,
          deps((stage) => send({ type: 'stage', stage })),
        );
        send({ type: 'result', result });
      } catch (error) {
        const failure = describeFailure(error, signal.aborted);
        send({
          type: 'error',
          status: failure.status,
          error: { code: failure.code, message: failure.message },
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled reader.
        }
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      ...Object.fromEntries(new Headers(headers)),
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  });
}
