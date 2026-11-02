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
