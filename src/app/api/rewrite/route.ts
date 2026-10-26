import { createHash } from 'node:crypto';

import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { MAX_MODEL_CHARS } from '@/lib/analysis/run';
import { cleanSourceText } from '@/lib/analysis/quote-locate';
import { readSource } from '@/lib/analysis/source';
import { BodyTooLarge, originAllowed, readBoundedJson } from '@/lib/api/guard';
import { parseRewriteRequest } from '@/lib/config/rewrite-modes';
import { SIMULATION_OPT_OUTS } from '@/lib/config/style-presets';
import { db } from '@/lib/db/client';
import {
  checkPublicFigure,
  getEntities,
  normalizeName,
  PUBLIC_VOICE_OCCUPATIONS,
} from '@/lib/entities/wikidata';
import { getReport, saveRewrite } from '@/lib/reports/store';
import { RewriteFailure, writeRewrite } from '@/lib/rewrite/run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const limiter = slidingWindow({ limit: 6, windowMs: 60 * 60_000 });

const fail = (message: string, status: number, headers?: HeadersInit, extra?: object) =>
  Response.json({ ok: false, error: { message, ...extra } }, { status, headers });

const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return fail('Send application/json.', 415);
  }
  const limit = limiter.check('rewrite:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return fail('Rewrite limit reached for this hour. Try again later.', 429, headers);
  if (!process.env.DATABASE_URL)
    return fail('The rewrite studio is not available on this server yet.', 503, headers);

  let body: unknown;
  try {
    body = await readBoundedJson(request, 120_000);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('Request body is too large.', 413, headers)
      : fail('Request body must be JSON.', 400, headers);
  }
  const parsed = parseRewriteRequest(body);
  if (!parsed.ok) return fail(parsed.error, 400, headers);
  const input = parsed.data;

  const saved = await getReport(db, input.reportId);
  if (!saved) return fail('Unknown reading.', 404, headers);
  const result = saved.result;

  // The article text: the reader's copy if it is the examined text, else re-read
  // from its link and accepted only if it is still the same text.
  let text: string | null = null;
  if (input.text) {
    const candidate = cleanSourceText(input.text).slice(0, MAX_MODEL_CHARS);
    if (sha(candidate) === result.origin.textSha256) text = candidate;
  }
  if (!text && result.origin.url && result.origin.kind !== 'user-pasted-text') {
    const fetched = await readSource(result.origin.url, MAX_MODEL_CHARS + 2_000);
    if (fetched.ok) {
      const candidate = fetched.text.slice(0, MAX_MODEL_CHARS);
      if (sha(candidate) === result.origin.textSha256) text = candidate;
    }
  }
  if (input.form === 'rewrite' && !text) {
    return fail(
      'The original text is needed to rewrite it, and it has changed or cannot be read. Examine the article again, then rewrite it.',
      422,
      headers,
    );
  }

  // A person is simulated only if Wikidata shows a public figure with a public voice.
  let personDescription: string | null = null;
  if (input.voice.kind === 'person') {
    const voice = input.voice;
    const optedOut = SIMULATION_OPT_OUTS.some(
      (entry) =>
        (voice.qid && entry.qid === voice.qid) ||
        normalizeName(entry.name) === normalizeName(voice.name),
    );
    if (optedOut) return fail('opted_out', 422, headers, { reason: 'opted_out' });
    if (voice.qid) {
      const [entity] = await getEntities([voice.qid], result.language).catch(() => []);
      const ok =
        entity?.wikipedia &&
        normalizeName(entity.label) === normalizeName(voice.name) &&
        (entity.claims.P106 ?? []).some((occupation) => occupation in PUBLIC_VOICE_OCCUPATIONS);
      if (!ok) return fail('not_public_voice', 422, headers, { reason: 'not_public_voice' });
      personDescription = entity.description;
    } else {
      const check = await checkPublicFigure(voice.name, result.language);
      if (!check.ok) {
        return fail(check.reason, 422, headers, {
          reason: check.reason,
          candidates: check.candidates ?? [],
        });
      }
      if (SIMULATION_OPT_OUTS.some((entry) => entry.qid === check.qid)) {
        return fail('opted_out', 422, headers, { reason: 'opted_out' });
      }
      voice.qid = check.qid;
      voice.name = check.label;
      personDescription = check.description;
    }
  }

  const chain = usableChain(freeChain('BIASLENS'), process.env);
  if (chain.length === 0)
    return fail('The rewrite studio is not configured on this server yet.', 503, headers);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(110_000)]);
  try {
    const rewrite = await writeRewrite(
      {
        result,
        text,
        form: input.form,
        voice: input.voice,
        length: input.length,
        personDescription,
      },
      {
        complete: async (messages, pass) => {
          const response = await complete({
            chain,
            messages,
            signal,
            timeoutMs: 45_000,
            maxTokens: pass === 'write' ? (input.length === 'full' ? 2_400 : 900) : 1_000,
            temperature: pass === 'write' ? 0.6 : 0.1,
            reasoning: 'light',
            extraBody: { response_format: { type: 'json_object' } },
          });
          return { text: response.text, modelId: response.id };
        },
      },
    );
    const id = await saveRewrite(
      db,
      { reportId: saved.id, form: input.form, voice: input.voice, length: input.length },
      rewrite,
    );
    return Response.json(
      { ok: true, rewrite: { id, ...rewrite, form: input.form, voice: input.voice } },
      { headers },
    );
  } catch (error) {
    if (error instanceof RewriteFailure) return fail(error.message, 502, headers);
    console.error('BiasLens rewrite failed', error instanceof Error ? error.name : '');
    return fail('The rewrite could not be written. Please try again.', 503, headers);
  }
}
