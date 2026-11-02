import { describe, expect, it } from 'vitest';

import { HOUSING_DEMO } from '@/lib/investigations/housing-demo';

import { detectGaps, sentenceDiff } from './gaps';

describe('detectGaps on the housing investigation', () => {
  const gaps = detectGaps(HOUSING_DEMO);
  it('flags one-sided claims, omissions and chartable data', () => {
    const ids = gaps.map((g) => g.id);
    expect(ids).toContain('other:c-drivers');
    expect(ids).toContain('omitted:0');
    expect(ids).toContain('chart:d-overburden');
    expect(gaps.find((g) => g.id === 'chart:d-overburden')!.actions).toEqual(['add_chart']);
  });
  it('does not call a claim one-sided when contradicting evidence is linked', () => {
    expect(gaps.map((g) => g.id)).not.toContain('other:h-rentcontrol');
  });
  it('marks a gap addressed once a version answered it', () => {
    const inv = {
      ...HOUSING_DEMO,
      drafts: [
        {
          version: 1,
          createdAt: '2026-11-02T00:00:00Z',
          action: 'add_chart',
          gapId: 'chart:d-overburden',
          title: 't',
          text: 'x',
          changeNote: '',
          citations: [],
          datasetId: 'd-overburden',
          added: [],
          removed: [],
          promptVersion: 'revise@1.0',
          modelId: null,
        },
      ],
    };
    expect(detectGaps(inv).find((g) => g.id === 'chart:d-overburden')!.title).toMatch(/addressed/);
  });
});

describe('sentenceDiff', () => {
  it('lists added and removed sentences', () => {
    expect(
      sentenceDiff('Rents rose. Incomes lagged.', 'Rents rose. Supply was capped [E2].'),
    ).toEqual({
      added: ['Supply was capped [E2].'],
      removed: ['Incomes lagged.'],
    });
  });
});

describe('sentences and list items', () => {
  it('treats each list item as its own unit', async () => {
    const { sentences } = await import('./gaps');
    expect(
      sentences(
        'Intro line.\n* In Greece rents rose [E2]. * In Denmark it differs.\n3. Third point',
      ),
    ).toEqual([
      'Intro line.',
      'In Greece rents rose [E2].',
      'In Denmark it differs.',
      'Third point',
    ]);
  });
});

describe('flagged sentences', () => {
  it('turns citation-check flags on the latest version into fix suggestions first', async () => {
    const { detectGaps } = await import('./gaps');
    const { HOUSING_DEMO } = await import('@/lib/investigations/housing-demo');
    const draft = {
      version: 2,
      createdAt: '2026-11-02T18:00:00Z',
      action: 'explain',
      gapId: null,
      title: 't',
      text: 'x',
      changeNote: '',
      citations: [],
      datasetId: null,
      added: [],
      removed: [],
      promptVersion: 'revise@1.2',
      modelId: null,
      flags: [{ sentence: 'Rents doubled [E1].', reason: 'E1 gives no change over time.' }],
    };
    const gaps = detectGaps({ ...HOUSING_DEMO, drafts: [draft] });
    expect(gaps[0]).toMatchObject({ id: 'flag:2:0', kind: 'flagged', actions: ['fix_flag'] });
  });
});
