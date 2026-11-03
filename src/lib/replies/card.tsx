/**
 * The share image: the article, its strongest finding and the passage behind
 * it. One layout in three sizes (link preview, square post, story), rendered
 * by next/og. Carries "AI reading · not a fact check" in the image itself, so
 * the label survives a screenshot.
 */
import { ogFonts, ogText } from '@bitbaum/design-tokens/og';
import { ImageResponse } from 'next/og';

import { BRAND } from '@/lib/config/brand';

import { CARD_THEME as C } from './card-theme';

export const CARD_FORMATS = {
  og: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const;
export type CardFormat = keyof typeof CARD_FORMATS;

export function isCardFormat(value: unknown): value is CardFormat {
  return typeof value === 'string' && Object.hasOwn(CARD_FORMATS, value);
}

export interface CardContent {
  kicker: string;
  title: string;
  source: string | null;
  finding: string;
  passage: string | null;
  more: string[];
  note: string;
  url: string;
}

function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).replace(/\s+\S*$/, '') + '…';
}

/**
 * The faces the card is drawn with, from @bitbaum/design-tokens: Geist (what
 * next/og drew with by default) and Inter for what Geist lacks, such as Greek.
 * An article can be in any language; anything neither face has is left out by
 * ogText rather than fetched from Google while the card is drawn.
 */
const FACES = ['geist', 'inter:400'];

/** Every text of the card through ogText, so none can send the renderer to Google. */
function drawable(content: CardContent): CardContent {
  const t = (s: string) => ogText(s, ...FACES);
  return {
    kicker: t(content.kicker),
    title: t(content.title),
    source: content.source === null ? null : t(content.source),
    finding: t(content.finding),
    passage: content.passage === null ? null : t(content.passage),
    more: content.more.map(t).filter(Boolean),
    note: t(content.note),
    url: t(content.url),
  };
}

export async function renderCard(raw: CardContent, format: CardFormat): Promise<ImageResponse> {
  const content = drawable(raw);
  const size = CARD_FORMATS[format];
  const tall = format !== 'og';
  const scale = format === 'og' ? 1 : 1.25;
  const pad = Math.round(56 * scale);
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: pad,
        background: C.paper,
        color: C.ink,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22 * scale,
          color: C.muted,
        }}
      >
        <span style={{ fontWeight: 700, color: C.ink }}>{BRAND.name}</span>
        <span>{content.kicker}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 * scale }}>
        <div style={{ fontSize: 26 * scale, color: C.muted }}>{clip(content.source ?? '', 80)}</div>
        <div
          style={{
            fontSize: (tall ? 46 : 38) * scale,
            fontWeight: 700,
            lineHeight: 1.15,
            marginTop: 8,
          }}
        >
          {clip(content.title, tall ? 140 : 90)}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 28 * scale,
          padding: 28 * scale,
          borderRadius: 18,
          background: C.white,
          border: `2px solid ${C.ink}`,
        }}
      >
        <div style={{ fontSize: (tall ? 36 : 30) * scale, lineHeight: 1.3 }}>
          {clip(content.finding, tall ? 260 : 170)}
        </div>
        {content.passage && (
          <div
            style={{
              display: 'flex',
              marginTop: 18 * scale,
              paddingLeft: 18,
              borderLeft: `5px solid ${C.accent}`,
              fontSize: 24 * scale,
              color: C.muted,
              lineHeight: 1.35,
            }}
          >
            «{clip(content.passage, tall ? 220 : 120)}»
          </div>
        )}
      </div>
      {tall &&
        content.more.slice(0, format === 'story' ? 2 : 1).map((line) => (
          <div
            key={line}
            style={{
              display: 'flex',
              marginTop: 24 * scale,
              fontSize: 28 * scale,
              lineHeight: 1.3,
            }}
          >
            {'• ' + clip(line, 180)}
          </div>
        ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 20,
          fontSize: 20 * scale,
          color: C.muted,
        }}
      >
        <span>{content.note}</span>
        <span style={{ color: C.ink }}>{content.url.replace(/^https?:\/\//, '')}</span>
      </div>
    </div>,
    {
      ...size,
      fonts: await ogFonts(...FACES),
      headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}
