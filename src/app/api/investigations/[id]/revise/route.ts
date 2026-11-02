import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { db } from '@/lib/db/client';
import { isGapAction } from '@/lib/domain/gaps';
import { getInvestigation, updateInvestigation } from '@/lib/investigations/store';
import { ReviseFailure, reviseInvestigation } from '@/lib/investigations/revise';
import { PUBLIC_ID } from '@/lib/reports/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Context = { params: Promise<{ id: string }> };
const limiter = slidingWindow({ limit: 20, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

/** Body: { editToken, revision, gapId, action }. Writes and saves the next version. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown investigation.', 404);
  const limit = limiter.check('revise:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Rewrite limit reached for this hour.', 429, headers);
  if (!process.env.DATABASE_URL)
    return fail('Investigations are not available here yet.', 503, headers);
  let body: Record<string, unknown>;
  try {
    body = (await readBoundedJson(request, 4_000)) as Record<string, unknown>;
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('Request body is too large.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  if (
    typeof body?.editToken !== 'string' ||
    !Number.isInteger(body.revision) ||
    typeof body.gapId !== 'string' ||
    !isGapAction(body.action)
  )
    return fail('Send editToken, revision, gapId and action.', 400, headers);
  const saved = await getInvestigation(db, id);
  if (!saved) return fail('Unknown investigation.', 404, headers);
  if (saved.revision !== body.revision)
    return fail('Someone saved a newer version. Reload first.', 409, headers);
  const chain = usableChain(freeChain('BIASLENS'), process.env);
  if (chain.length === 0)
    return fail('The writing desk is not configured on this server yet.', 503, headers);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(110_000)]);
  try {
    const next = await reviseInvestigation(saved.investigation, body.gapId, body.action, {
      complete: async (messages, pass) => {
        const response = await complete({
          chain,
          messages,
          signal,
          timeoutMs: 60_000,
          maxTokens: pass === 'check' ? 1_200 : 2_400,
          temperature: pass === 'check' ? 0.1 : 0.5,
          reasoning: 'light',
          extraBody: { response_format: { type: 'json_object' } },
        });
        return { text: response.text, modelId: response.id };
      },
    });
    const outcome = await updateInvestigation(db, id, body.editToken, saved.revision, next);
    if (!outcome.ok)
      return fail(
        outcome.reason === 'forbidden'
          ? 'This link cannot edit the investigation.'
          : 'Could not save this version.',
        outcome.reason === 'forbidden' ? 403 : 409,
        headers,
      );
    return Response.json(
      { ok: true, revision: outcome.revision, draft: next.drafts!.at(-1) },
      { headers },
    );
  } catch (error) {
    if (error instanceof ReviseFailure) return fail(error.message, 422, headers);
    console.error('BiasLens revise failed', error instanceof Error ? error.name : '');
    return fail('This version could not be written. Please try again.', 503, headers);
  }
}
