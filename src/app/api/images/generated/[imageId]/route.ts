import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { generatedImages } from '@/lib/db/schema';

export const runtime = 'nodejs';

type Context = { params: Promise<{ imageId: string }> };

/** Serves a stored AI illustration. Immutable: a new image gets a new id. */
export async function GET(_request: Request, { params }: Context) {
  const { imageId } = await params;
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(imageId) || !process.env.DATABASE_URL)
    return new Response('Not found', { status: 404 });
  const [row] = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.id, imageId))
    .limit(1);
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(row.dataBase64, 'base64'), {
    headers: {
      'content-type': row.mimeType,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'x-ai-generated': 'true',
    },
  });
}
