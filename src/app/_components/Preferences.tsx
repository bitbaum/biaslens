'use client';

import { useEffect } from 'react';

import { PREFS } from '@/lib/client/local';

export interface Prefs {
  textSize: 'normal' | 'large' | 'x-large';
  motion: 'system' | 'reduce';
}
export const DEFAULT_PREFS: Prefs = { textSize: 'normal', motion: 'system' };

export function readPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS) ?? '{}') };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyPrefs(p: Prefs) {
  document.documentElement.dataset.textSize = p.textSize;
  document.documentElement.dataset.motion = p.motion;
}

/** Applies saved reading preferences after load. Renders nothing. */
export function PreferencesApplier() {
  useEffect(() => applyPrefs(readPrefs()), []);
  return null;
}
