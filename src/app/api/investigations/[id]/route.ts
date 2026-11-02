import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { db } from '@/lib/db/client';
import { investigationProblems, type Investigation } from '@/lib/domain/investigation';
import { getInvestigation, updateInvestigation } from '@/lib/investigations/store';
import { PUBLIC_ID } from '@/lib/reports/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };
const limiter = slidingWindow({ limit: 120, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit, extra?: object) =>
  Response.json({ ok: false, error: { message, ...extra } }, { status, headers });

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id)) return fail('Unknown investigation.', 404);
  if (!process.env.DATABASE_URL) return fail('Investigations are not available here yet.', 503);
  const saved = await getInvestigation(db, id);
  if (!saved) return fail('Unknown investigation.', 404);
  return Response.json({ ok: true, ...saved });
}

/** Body: { editToken, revision, investigation }. */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown investigation.', 404);
  const limit = limiter.check('investigations-put:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Save limit reached for this hour.', 429, headers);
  if (!process.env.DATABASE_URL)
    return fail('Investigations are not available here yet.', 503, headers);
  let body: Record<string, unknown>;
  try {
    body = (await readBoundedJson(request, 400_000)) as Record<string, unknown>;
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('Request body is too large.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  if (typeof body?.editToken !== 'string' || !Number.isInteger(body.revision))
    return fail('Send editToken and revision.', 400, headers);
  const problems = investigationProblems(body.investigation);
  if (problems.length) return fail('The investigation is not valid.', 400, headers, { problems });
  const outcome = await updateInvestigation(
    db,
    id,
    body.editToken,
    body.revision as number,
    body.investigation as Investigation,
  );
  if (outcome.ok) return Response.json({ ok: true, revision: outcome.revision }, { headers });
  if (outcome.reason === 'not_found') return fail('Unknown investigation.', 404, headers);
  if (outcome.reason === 'forbidden')
    return fail('This link cannot edit the investigation.', 403, headers);
  return fail('Someone saved a newer version. Reload before saving.', 409, headers, {
    revision: outcome.revision,
  });
}
