import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { requireUser } from '@/lib/auth';
import { assistMessages, parseAssistAnswer, parseAssistInput } from '@/lib/writing/assist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const limiter = slidingWindow({ limit: 40, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

/**
 * Writing help for a signed-in writer. Body: AssistInput. Returns
 * { title, body }. The model is ai-kit's free chain; nothing is stored.
 */
export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return fail('Send application/json.', 415);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const limit = limiter.check('writing-assist:' + (auth.user.id || clientIp(request.headers)));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Writing help limit reached for this hour.', 429, headers);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 120_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('The text is too large to send.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const parsed = parseAssistInput(body);
  if (!parsed.ok) return fail(parsed.problem, 400, headers);
  const chain = usableChain(freeChain('BIASLENS'), process.env);
  if (chain.length === 0)
    return fail('Writing help is not configured on this server yet.', 503, headers);
  try {
    const response = await complete({
      chain,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(80_000)]),
      timeoutMs: 40_000,
      maxTokens: 3_000,
      temperature: 0.5,
      extraBody: { response_format: { type: 'json_object' } },
      messages: assistMessages(parsed.data),
    });
    const answer = parseAssistAnswer(response.text, parsed.data.title);
    if (!answer) return fail('The writing help answered badly. Try again.', 502, headers);
    return Response.json({ ok: true, ...answer }, { headers });
  } catch (error) {
    console.error('BiasLens writing assist failed', error instanceof Error ? error.name : '');
    return fail('Writing help could not answer just now. Try again.', 503, headers);
  }
}
