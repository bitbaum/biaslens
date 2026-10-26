import { ImageResponse } from 'next/og';

import { CARD_THEME as C } from '@/lib/replies/card-theme';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** The app icon: two overlapping lenses, as in the site's mark. */
export default function Icon() {
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
    size,
  );
}
