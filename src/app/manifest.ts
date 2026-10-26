import type { MetadataRoute } from 'next';

import { BRAND } from '@/lib/config/brand';
import { CARD_THEME } from '@/lib/replies/card-theme';

/**
 * Installable web app. `share_target` puts BiasLens in the phone's share menu
 * (Android, and desktop Chrome): "Share → BiasLens" from any news app opens
 * /analyze with the shared link, which starts the examination.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: 'See who speaks and which passages carry the argument in any article.',
    start_url: '/analyze',
    display: 'standalone',
    background_color: CARD_THEME.paper,
    theme_color: CARD_THEME.ink,
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' }],
    share_target: {
      action: '/analyze',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  };
}
