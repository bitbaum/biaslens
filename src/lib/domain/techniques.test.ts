import { describe, expect, it } from 'vitest';

import { forbiddenLabelsIn } from '@/lib/config/vocabulary';

import { TECHNIQUES, techniqueCatalogueForPrompt, techniqueName } from './techniques';

describe('technique catalogue', () => {
  it('has unique ids and every field in every language', () => {
    expect(new Set(TECHNIQUES.map((item) => item.id)).size).toBe(TECHNIQUES.length);
    for (const item of TECHNIQUES) {
      for (const language of ['en', 'de', 'fr'] as const) {
        expect(item.name[language].trim(), item.id).not.toBe('');
        expect(item.short[language].trim(), item.id).not.toBe('');
      }
      expect(item.countsWhen && item.doesNotCountWhen && item.whyItMatters).toBeTruthy();
    }
  });

  it('describes techniques without political labels', () => {
    expect(forbiddenLabelsIn(JSON.stringify(TECHNIQUES))).toEqual([]);
  });

  it('gives the model every id and Swiss readers Swiss spelling', () => {
    for (const item of TECHNIQUES) expect(techniqueCatalogueForPrompt()).toContain(item.id + ':');
    expect(techniqueName('number_without_base', 'de-CH')).not.toContain('ß');
  });
});
