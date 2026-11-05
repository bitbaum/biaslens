import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { requireUser, sessionFor } from '@/lib/auth';
import { BRAND } from '@/lib/config/brand';
import { db } from '@/lib/db/client';
import { PUBLIC_ID } from '@/lib/reports/store';
import { parseWritingInput } from '@/lib/writing/input';
import { articleExport } from '@/lib/writing/load';
import { deleteWrittenArticle, getWrittenArticle, updateWrittenArticle } from '@/lib/writing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };
const limiter = slidingWindow({ limit: 120, windowMs: 60 * 60_000 });
const fail = (message: string, status: number, headers?: HeadersInit, problems?: string[]) =>
  Response.json({ ok: false, error: { message, problems } }, { status, headers });

/**
 * The article as JSON, for another product to import (OrangeCat's composer
 * reads it to cross-post). Public for a published article; a draft is served
 * to its author only. Readable from any origin: it holds nothing private.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const session = await sessionFor(request.headers);
  const article = await getWrittenArticle(db, id, session?.user.id ?? null);
  if (!article) return fail('Unknown article.', 404);
  return Response.json(
    { ok: true, article: articleExport(article, BRAND.siteOrigin) },
    { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' } },
  );
}

/** Replace the article. Body: WritingInput. The author only. */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const limit = limiter.check('writing-put:' + (auth.user.id || clientIp(request.headers)));
  const headers = toHeaders(limit);
  if (!limit.allowed) return fail('Save limit reached for this hour.', 429, headers);
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
  const outcome = await updateWrittenArticle(db, id, auth.user.id, parsed.data);
  if (outcome.ok) return Response.json({ ok: true, id }, { headers });
  return outcome.reason === 'not_found'
    ? fail('Unknown article.', 404, headers)
    : fail('Only the author can change this article.', 403, headers);
}

/** Delete the article. The author only. */
export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const outcome = await deleteWrittenArticle(db, id, auth.user.id);
  if (outcome.ok) return Response.json({ ok: true });
  return outcome.reason === 'not_found'
    ? fail('Unknown article.', 404)
    : fail('Only the author can delete this article.', 403);
}
