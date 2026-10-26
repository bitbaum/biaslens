import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { isOutputLanguage } from '@/lib/config/languages';
import { resolveProfile, type ProfileResult, type ProfileRole } from '@/lib/entities/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });
const ROLES: ProfileRole[] = ['author', 'voice', 'outlet'];

// Public facts change slowly; a day-long cache keeps a popular article from
// sending the same lookups to Wikidata for every reader. Failures are not kept.
const CACHE_TTL_MS = 24 * 60 * 60_000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; value: ProfileResult }>();

const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

/** GET /api/profile?name=…&role=author|voice|outlet&context=…&lang=…[&qid=Q…] */
export async function GET(request: Request) {
  const limit = limiter.check('profile:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return fail('Profile limit reached for this hour. Try again later.', 429, headers);

  const params = new URL(request.url).searchParams;
  const name = params.get('name')?.trim().replace(/\s+/g, ' ') ?? '';
  const role = params.get('role') as ProfileRole;
  const context = params.get('context')?.trim().slice(0, 200) || null;
  const language = params.get('lang') ?? 'en';
  const qid = params.get('qid');
  if (name.length < 2 || name.length > 120) return fail('Name missing or too long.', 400, headers);
  if (!ROLES.includes(role)) return fail('Unknown role.', 400, headers);
  if (!isOutputLanguage(language)) return fail('Unknown language.', 400, headers);
  if (qid !== null && !/^Q\d+$/.test(qid)) return fail('Unknown item.', 400, headers);

  const key = JSON.stringify([name.toLowerCase(), role, context, language, qid]);
  const hit = cache.get(key);
  let value: ProfileResult;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    value = hit.value;
  } else {
    value = await resolveProfile({ name, role, context, language, qid });
    if (value.status !== 'lookup_failed') {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
      cache.set(key, { at: Date.now(), value });
    }
  }
  return Response.json(
    { ok: true, result: value },
    {
      headers: {
        ...Object.fromEntries(new Headers(headers)),
        'cache-control': value.status === 'lookup_failed' ? 'no-store' : 'public, max-age=3600',
      },
    },
  );
}
