import { describe, expect, it, vi } from 'vitest';

import { investigationProblems } from '@/lib/domain/investigation';

import { HOUSING_DEMO } from './housing-demo';
import { ReviseFailure, reviseInvestigation } from './revise';

const text =
  'Housing cost overburden fell across the EU from 11.5% in 2014 to 7.7% in 2025 [E1]. ' +
  'Greece stands out at 26.4%, according to the article. In England, planning refusals are linked to prices about 35% higher by 2008 [E2]. '.repeat(
    2,
  );

describe('reviseInvestigation', () => {
  it('writes version 1 with resolved citations and a diff, and stays a valid investigation', async () => {
    const complete = vi.fn(async (messages: { role: string; content: string }[], pass?: string) => {
      if (pass === 'check')
        return {
          text: JSON.stringify({
            flags: [{ n: 2, reason: 'The finding gives no place beyond England.' }],
          }),
          modelId: 'm1',
        };
      expect(messages[0]!.content).toContain('ACTION: Explain the mechanism');
      expect(messages[1]!.content).toContain('[E1] ');
      return {
        text: JSON.stringify({
          title: 'Why rent eats wages',
          text,
          changeNote: 'Explained the cause.',
        }),
        modelId: 'm1',
      };
    });
    const next = await reviseInvestigation(HOUSING_DEMO, 'omitted:0', 'explain', { complete });
    const draft = next.drafts!.at(-1)!;
    expect(draft.version).toBe(1);
    expect(draft.citations).toHaveLength(2);
    expect(draft.citations[0]).toMatch(/^\[E1\]/);
    expect(draft.added.length).toBeGreaterThan(0);
    expect(draft.removed).toEqual([]);
    expect(draft.flags).toHaveLength(1);
    expect(draft.flags![0]!.reason).toMatch(/England/);
    expect(investigationProblems(next)).toEqual([]);

    const second = await reviseInvestigation(next, 'chart:d-overburden', 'add_chart', {
      complete: async (messages, pass) => {
        if (pass === 'check') return { text: '{"flags": []}', modelId: 'm1' };
        expect(messages[1]!.content).toContain('CURRENT DRAFT');
        expect(messages[1]!.content).toContain('Greece 26.4');
        return {
          text: JSON.stringify({
            title: 'Why rent eats wages',
            text: text + ' The chart ranks countries.',
            changeNote: 'Added chart.',
          }),
          modelId: 'm1',
        };
      },
    });
    expect(second.drafts!.at(-1)!.datasetId).toBe('d-overburden');
    expect(second.drafts!.at(-1)!.added).toEqual(['The chart ranks countries.']);
  });

  it('refuses an action that does not fit the gap', async () => {
    await expect(
      reviseInvestigation(HOUSING_DEMO, 'chart:d-overburden', 'add_other_side', {
        complete: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(ReviseFailure);
  });
});
