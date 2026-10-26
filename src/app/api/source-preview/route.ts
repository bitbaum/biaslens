import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { originAllowed } from '@/lib/api/guard';
import { readSource } from '@/lib/analysis/source';
import { isSourceURL } from '@/lib/domain/inquiry-record';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });

/**
 * GET /api/source-preview?url=… → the page's title, publication and date, so
 * adding a source to the notebook is pasting a link and nothing else. The
 * fetch goes through readSource (SSRF guard on every redirect hop); only the
 * page's own metadata comes back, never its text.
 */
export async function GET(request: Request) {
  if (!originAllowed(request))
    return Response.json({ ok: false, error: 'Origin not allowed.' }, { status: 403 });
  const limit = limiter.check('source-preview:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return Response.json(
      { ok: false, error: 'Too many links this hour.' },
      { status: 429, headers },
    );
  const url = new URL(request.url).searchParams.get('url')?.trim() ?? '';
  if (!isSourceURL(url) || url.length > 3000)
    return Response.json({ ok: false, error: 'Paste a web address.' }, { status: 400, headers });

  const read = await readSource(url, 2_000);
  if (!read.ok) return Response.json({ ok: false, error: read.reason }, { status: 200, headers });
  return Response.json(
    {
      ok: true,
      url: read.url,
      title: (read.metadata?.headline ?? read.title ?? '').slice(0, 300) || null,
      publication: read.metadata?.publication ?? null,
      date: read.metadata?.date ?? null,
      kind: read.kind,
    },
    { headers: { ...Object.fromEntries(new Headers(headers)), 'cache-control': 'no-store' } },
  );
}
