/**
 * Colours for share images. `ImageResponse` renders outside the page and
 * cannot read CSS custom properties, so these values mirror the primitives in
 * `src/app/theme.css`; `card-theme.test.ts` fails if they drift apart.
 */
export const CARD_THEME = {
  ink: '#1c2028',
  muted: '#5d6470',
  accent: '#3949ab',
  paper: '#f7f8fa',
  white: '#ffffff',
} as const;

/** Which theme.css primitive each card colour mirrors. */
export const CARD_THEME_SOURCE = {
  ink: '--primitive-ink-900',
  muted: '--primitive-slate-600',
  accent: '--primitive-accent-600',
  paper: '--primitive-paper',
  white: '--primitive-white',
} as const satisfies Record<keyof typeof CARD_THEME, string>;
