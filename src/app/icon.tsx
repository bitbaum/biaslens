import { ogFonts } from '@bitbaum/design-tokens/og';
import { ImageResponse } from 'next/og';

import { CARD_THEME as C } from '@/lib/replies/card-theme';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** The app icon: two overlapping lenses, as in the site's mark. */
export default async function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: C.ink,
      }}
    >
      <div
        style={{
          width: 230,
          height: 300,
          marginRight: -70,
          border: `30px solid ${C.white}`,
          borderRadius: '50%',
          transform: 'rotate(20deg)',
        }}
      />
      <div
        style={{
          width: 230,
          height: 300,
          marginLeft: -70,
          border: `30px solid ${C.white}`,
          borderRadius: '50%',
          transform: 'rotate(20deg)',
        }}
      />
    </div>,
    // No text, but the faces are given anyway: next/og's own default is never used.
    { ...size, fonts: await ogFonts() },
  );
}
