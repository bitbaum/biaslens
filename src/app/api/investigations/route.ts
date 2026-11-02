import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { db } from '@/lib/db/client';
import { investigationProblems, type Investigation } from '@/lib/domain/investigation';
import { createInvestigation } from '@/lib/investigations/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 20, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit, problems?: string[]) =>
  Response.json({ ok: false, error: { message, problems } }, { status, headers });

/** Save a new investigation. Returns its id and, once, the edit token. */
export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return fail('Send application/json.', 415);
  const limit = limiter.check('investigations:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Save limit reached for this hour.', 429, headers);
  if (!process.env.DATABASE_URL)
    return fail('Saving investigations is not available on this server yet.', 503, headers);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 400_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('Request body is too large.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const problems = investigationProblems(body);
  if (problems.length) return fail('The investigation is not valid.', 400, headers, problems);
  try {
    const created = await createInvestigation(db, body as Investigation);
    return Response.json({ ok: true, ...created }, { status: 201, headers });
  } catch (error) {
    console.error('BiasLens investigation save failed', error instanceof Error ? error.name : '');
    return fail('The investigation could not be saved.', 503, headers);
  }
}
