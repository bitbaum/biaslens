import { publicOrigin } from '@/lib/config/origin';
import { isCardFormat, renderCard } from '@/lib/replies/card';
import { cardContent } from '@/lib/replies/card-content';
import { loadReply } from '@/lib/reports/load';

export const runtime = 'nodejs';

/** The reply as an image to post or send: `?format=square` (default) or `story`. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = new URL(request.url).searchParams.get('format') ?? 'square';
  if (!isCardFormat(format)) return new Response('Unknown format', { status: 400 });
  const loaded = await loadReply(id);
  if (!loaded) return new Response('Not found', { status: 404 });
  const origin = await publicOrigin();
  return renderCard(
    cardContent(loaded.report.result, `${origin}/a/${id}`, { name: loaded.reply.senderName }),
    format,
  );
}
