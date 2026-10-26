import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { CARD_THEME, CARD_THEME_SOURCE } from './card-theme';

it('share-image colours match the theme primitives', () => {
  const theme = readFileSync(join(process.cwd(), 'src/app/theme.css'), 'utf8');
  for (const [key, primitive] of Object.entries(CARD_THEME_SOURCE)) {
    const value = theme.match(new RegExp(primitive + ':\\s*(#[0-9a-fA-F]{6})'))?.[1];
    expect(value?.toLowerCase(), primitive).toBe(CARD_THEME[key as keyof typeof CARD_THEME]);
  }
});
