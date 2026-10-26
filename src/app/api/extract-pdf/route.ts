import { clientIp, slidingWindow, toHeaders } from 'limitkit';

import { BodyTooLarge, originAllowed, readBoundedBytes } from '@/lib/api/guard';
import { MAX_PDF_BYTES, pdfToText } from '@/lib/analysis/source';
import { MAX_TEXT_CHARS } from '@/lib/analysis/input';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const limiter = slidingWindow({ limit: 20, windowMs: 60 * 60_000 });

const fail = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ ok: false, error: { message } }, { status, headers });

/**
 * Turn an uploaded PDF (a press clipping saved on a phone) into text. The text
 * goes back to the browser and into the paste box, where the reader can see and
 * edit it before anything is analysed. Nothing is stored.
 */
export async function POST(request: Request) {
  if (!originAllowed(request)) return fail('Request origin is not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')) {
    return fail('Send a PDF file.', 415);
  }
  const limit = limiter.check('extract-pdf:' + clientIp(request.headers));
  const headers = toHeaders(limit);
  if (!limit.allowed)
    return fail('PDF limit reached for this hour. Try again later.', 429, headers);

  let bytes: Uint8Array;
  try {
    bytes = await readBoundedBytes(request, MAX_PDF_BYTES);
  } catch (error) {
    return error instanceof BodyTooLarge
      ? fail('The PDF is larger than 10 MB.', 413, headers)
      : fail('The upload could not be read.', 400, headers);
  }
  const result = await pdfToText(bytes);
  if (!result.ok) return fail(result.reason, 422, headers);
  return Response.json(
    {
      ok: true,
      text: result.text.slice(0, MAX_TEXT_CHARS),
      truncated: result.text.length > MAX_TEXT_CHARS,
      pages: result.pages,
      title: result.title,
    },
    { headers },
  );
}
