import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { searchCommons } from '@/lib/investigations/commons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });

/** GET ?q= → openly licensed Wikimedia Commons photos with credit and licence. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3 || q.length > 200)
    return Response.json(
      { ok: false, error: { message: 'Say what to look for.' } },
      { status: 400 },
    );
  const limit = limiter.check('images:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return Response.json(
      { ok: false, error: { message: 'Search limit reached.' } },
      { status: 429, headers },
    );
  try {
    return Response.json(
      { ok: true, source: 'Wikimedia Commons', images: await searchCommons(q) },
      { headers },
    );
  } catch {
    return Response.json(
      { ok: false, error: { message: 'Commons did not answer.' } },
      { status: 502, headers },
    );
  }
}
