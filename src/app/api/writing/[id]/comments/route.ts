import { clientIp, slidingWindow, toHeaders } from '@bitbaum/limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { requireUser, sessionFor } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { PUBLIC_ID } from '@/lib/reports/store';
import { addComment, deleteComment, listComments, parseCommentInput } from '@/lib/writing/comments';
import { getWrittenArticle } from '@/lib/writing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };
const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

/** The comments under a published article, oldest first. */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Comments are not available here yet.', 503);
  const session = await sessionFor(request.headers);
  const article = await getWrittenArticle(db, id, session?.user.id ?? null);
  if (!article) return fail('Unknown article.', 404);
  return Response.json({ ok: true, comments: await listComments(db, id) });
}

/** Body: { body }. A signed-in person's comment. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Comments are not available here yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const limit = limiter.check('comments:' + (auth.user.id || clientIp(request.headers)));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Comment limit reached for this hour.', 429, headers);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 20_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('The comment is too long.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const parsed = parseCommentInput(body);
  if (!parsed.ok) return fail(parsed.problem, 400, headers);
  const article = await getWrittenArticle(db, id, auth.user.id);
  if (!article || article.status !== 'published') return fail('Unknown article.', 404, headers);
  const comment = await addComment(db, id, auth.user.id, parsed.body);
  return Response.json({ ok: true, comment }, { status: 201, headers });
}

/** Body: { commentId }. The comment's author, or the article's, removes it. */
export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Comments are not available here yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  let body: { commentId?: unknown };
  try {
    body = (await readBoundedJson(request, 1_000)) as { commentId?: unknown };
  } catch {
    return fail('Request body must be JSON.', 400);
  }
  if (typeof body.commentId !== 'string' || !PUBLIC_ID.test(body.commentId))
    return fail('Send a commentId.', 400);
  const article = await getWrittenArticle(db, id, auth.user.id);
  const removed = await deleteComment(db, body.commentId, auth.user.id, article?.authorId ?? null);
  return removed ? Response.json({ ok: true }) : fail('That comment is not yours to remove.', 403);
}
