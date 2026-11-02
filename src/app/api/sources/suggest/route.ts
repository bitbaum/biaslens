import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { suggestSources } from '@/lib/investigations/suggest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });

/** GET ?q=claim text → candidate sources from several sides (leads, not findings). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 4 || q.length > 400)
    return Response.json(
      { ok: false, error: { message: 'Say what to look for.' } },
      { status: 400 },
    );
  const limit = limiter.check('suggest:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return Response.json(
      { ok: false, error: { message: 'Search limit reached.' } },
      { status: 429, headers },
    );
  const candidates = await suggestSources(q);
  return Response.json({ ok: true, source: 'OpenAlex', candidates }, { headers });
}
