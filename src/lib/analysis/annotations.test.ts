import { describe, expect, it } from 'vitest';

import { segmentText, type Annotation } from './annotations';
import { glanceSentences } from './glance';
import { analyzeArticle } from './run';
import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from './test-fixture';

const mark = (id: string, kind: Annotation['kind'], start: number, end: number): Annotation => ({
  id,
  kind,
  itemId: id,
  start,
  end,
});

describe('segmentText', () => {
  it('splits overlapping marks and lets a flagged technique win the colour', () => {
    const segments = segmentText(20, [
      mark('claim', 'claim', 2, 12),
      mark('flag', 'detection', 8, 16),
    ]);
    expect(segments.map((s) => [s.start, s.end, s.annotations.map((a) => a.id)])).toEqual([
      [0, 2, []],
      [2, 8, ['claim']],
      [8, 12, ['flag', 'claim']],
      [12, 16, ['flag']],
      [16, 20, []],
    ]);
  });

  it('ignores ranges outside the text', () => {
    expect(segmentText(5, [mark('x', 'voice', 3, 50)])).toEqual([
      { start: 0, end: 5, annotations: [] },
    ]);
  });
});

describe('glanceSentences', () => {
  it('states measured counts in the report language', async () => {
    const { report } = await analyzeArticle(
      { mode: 'text', url: null, text: FIXTURE_ARTICLE, outputLanguage: 'de-CH' },
      {
        readSource: async () => ({ ok: false, url: '', reason: '' }),
        complete: async (_messages, pass) => ({
          text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : FIXTURE_ASSESSMENT),
          modelId: null,
        }),
      },
    );
    expect(glanceSentences(report, 'de-CH')).toEqual([
      'Nachricht.',
      '3 Stimmen: 2 stützen die Kernaussage, 1 widerspricht.',
      '1 Stimme ist anonym.',
      '2 Zahlen, jede mit genannter Quelle.',
      '2 Umfrageergebnisse ohne Stichprobengrösse.',
      '3 Stellen markiert.',
    ]);
  });
});
