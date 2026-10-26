import { publicOrigin } from '@/lib/config/origin';
import { CARD_FORMATS, renderCard } from '@/lib/replies/card';
import { cardContent } from '@/lib/replies/card-content';
import { loadReport } from '@/lib/reports/load';

export const alt =
  'A BiasLens reading of an article: its strongest finding and the passage behind it';
export const size = CARD_FORMATS.og;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saved = await loadReport(id);
  const origin = await publicOrigin();
  if (!saved) {
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
  return renderCard(cardContent(saved.result, `${origin}/r/${id}`), 'og');
}
