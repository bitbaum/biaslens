import { publicOrigin } from '@/lib/config/origin';
import { CARD_FORMATS, renderCard } from '@/lib/replies/card';
import { cardContent } from '@/lib/replies/card-content';
import { loadReply } from '@/lib/reports/load';

export const alt = 'A BiasLens reply: the article, its strongest finding and the passage behind it';
export const size = CARD_FORMATS.og;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadReply(id);
  const origin = await publicOrigin();
  if (!loaded) {
    return renderCard(
      {
        kicker: '',
        title: 'BiasLens',
        source: null,
        finding: 'See who speaks and which passages carry the argument.',
        passage: null,
        more: [],
        note: '',
        url: origin,
      },
      'og',
    );
  }
  return renderCard(
    cardContent(loaded.report.result, `${origin}/a/${id}`, { name: loaded.reply.senderName }),
    'og',
  );
}
