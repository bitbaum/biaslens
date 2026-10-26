import {
  ChainExhaustedError,
  looksLikeSilence,
  speechChain,
  speechConfigured,
  transcribe,
} from '@bitbaum/ai-kit';
import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { originAllowed } from '@/lib/api/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The microphone's server leg for chatkit's Composer (`voice.transcribeUrl`).
 * The browser's recogniser is tried first; where it is missing (Firefox) or
 * silent (Chromium without Google's speech service), chatkit records and
 * posts the audio here. It transcribes and returns the words — nothing is
 * answered, translated or stored. The chain and the silence guard are
 * ai-kit's, the same in every product with a microphone.
 */
const MAX_BYTES = 8 * 1024 * 1024;
const limiter = slidingWindow({ limit: 60, windowMs: 60 * 60_000 });

const refuse = (error: string, status: number, headers?: HeadersInit) =>
  Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  if (!originAllowed(request)) return refuse('Origin not allowed', 403);
  if (!speechConfigured(process.env)) return refuse('Speaking is not available here yet.', 503);
  const limit = limiter.check('transcribe:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return refuse('Too many recordings this hour. Please type instead.', 429, headers);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse('Expected an audio upload.', 400, headers);
  }
  const audio = form.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0)
    return refuse('Expected an audio upload.', 400, headers);
  if (audio.size > MAX_BYTES) return refuse('That recording is too long.', 413, headers);
  const locale = form.get('locale');

  try {
    const result = await transcribe({
      audio,
      // Whisper reads the container from the name; browsers record webm.
      filename: 'dictation.webm',
      language: typeof locale === 'string' ? locale : undefined,
      chain: speechChain(),
      timeoutMs: 20_000,
      signal: request.signal,
    });
    const said = result.text.trim();
    // Silence comes back as a subtitle credit or "Thank you."; never put
    // words in the reader's question they did not say.
    return Response.json({ text: looksLikeSilence(said) ? '' : said }, { headers });
  } catch (error) {
    console.warn(
      'BiasLens transcribe failed',
      error instanceof ChainExhaustedError
        ? error.failures.map((f) => f.message.slice(0, 120)).join(' | ')
        : error instanceof Error
          ? error.name
          : 'unknown',
    );
    return refuse('Speaking is not available right now. Please type instead.', 502, headers);
  }
}
