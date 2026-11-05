import { originAllowed, readBoundedJson } from '@/lib/api/guard';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { PUBLIC_ID } from '@/lib/reports/store';
import { setWrittenArticleReport } from '@/lib/writing/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (message: string, status: number) =>
  Response.json({ ok: false, error: { message } }, { status });

/** Body: { reportId }. Remembers the author's examination of their own text. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!PUBLIC_ID.test(id)) return fail('Unknown article.', 404);
  if (!process.env.DATABASE_URL) return fail('Writing is not available on this server yet.', 503);
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  let body: unknown;
  try {
    body = await readBoundedJson(request, 1_000);
  } catch {
    return fail('Request body must be JSON.', 400);
  }
  const reportId = (body as { reportId?: unknown })?.reportId;
  if (typeof reportId !== 'string' || !PUBLIC_ID.test(reportId))
    return fail('Send a reportId.', 400);
  await setWrittenArticleReport(db, id, auth.user.id, reportId);
  return Response.json({ ok: true });
}
