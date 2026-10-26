import { buildBrand } from '@/lib/config/brand';

/**
 * Same-origin check shared by every state-changing or model-spending route.
 * The reverse proxy terminates HTTPS, so request.url may name the internal
 * listener: trust the configured public origin, never forwarded headers.
 */
export function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const expected = buildBrand(process.env).siteOrigin ?? new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

export class BodyTooLarge extends Error {}

/** Read a request body with a byte limit that holds without an honest Content-Length. */
export async function readBoundedBytes(request: Request, maxBytes: number): Promise<Uint8Array> {
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const bytes = await readBoundedBytes(request, maxBytes);
  return bytes.length ? JSON.parse(new TextDecoder().decode(bytes)) : {};
}
