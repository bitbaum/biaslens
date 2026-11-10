import { clientIp, slidingWindow, toHeaders } from '@bitbaum/limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { parseWritingInput } from '@/lib/writing/input';
import { createWrittenArticle, listArticlesByAuthor } from '@/lib/writing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 30, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit, problems?: string[]) =>
  Response.json({ ok: false, error: { message, problems } }, { status, headers });

/** Everything the signed-in person wrote, drafts included. */
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const articles = await listArticlesByAuthor(db, auth.user.id);
  return Response.json({ ok: true, articles });
}

/** Publish or save a draft. Body: WritingInput. Returns the new id. */
export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return fail('Send application/json.', 415);
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const limit = limiter.check('writing:' + (auth.user.id || clientIp(request.headers)));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Publishing limit reached for this hour.', 429, headers);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 200_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('The article is too large to send.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const parsed = parseWritingInput(body);
  if (!parsed.ok) return fail('The article is not ready.', 400, headers, parsed.problems);
  try {
    const created = await createWrittenArticle(db, auth.user.id, parsed.data);
    return Response.json({ ok: true, ...created }, { status: 201, headers });
  } catch (error) {
    console.error('BiasLens article save failed', error instanceof Error ? error.name : '');
    return fail('The article could not be saved.', 503, headers);
  }
}
