import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { db } from '@/lib/db/client';
import { createReply, getReply, getReport } from '@/lib/reports/store';
import { parseReplyInput } from '@/lib/replies/input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 30, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return fail('Send application/json.', 415);
  }
  const limit = limiter.check('replies:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return fail('Reply limit reached for this hour. Try again later.', 429, headers);
  if (!process.env.DATABASE_URL)
    return fail('Replies are not available on this server yet.', 503, headers);

  let body: unknown;
  try {
    body = await readBoundedJson(request, 8_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('Request body is too large.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const input = parseReplyInput(body);
  if (!input.ok) return fail(input.error, 400, headers);

  try {
    if (!(await getReport(db, input.data.reportId))) return fail('Unknown report.', 404, headers);
    if (input.data.parentReplyId && !(await getReply(db, input.data.parentReplyId))) {
      return fail('Unknown reply.', 404, headers);
    }
    const id = await createReply(db, input.data);
    return Response.json({ ok: true, id, path: '/a/' + id }, { status: 201, headers });
  } catch (error) {
    console.error('BiasLens reply could not be saved', error instanceof Error ? error.name : '');
    return fail('The reply could not be created. Try again.', 503, headers);
  }
}
