/**
 * Gaps: what an article (or the reader's current draft of it) leaves
 * unexplained, found from the investigation's own structure, never guessed.
 * Each gap offers actions; an action asks the writer to fill that one gap
 * with the linked evidence, and the result is a new, diffed version.
 */
import { compareClaims, type Investigation } from './investigation';

export const GAP_ACTIONS = {
  explain: {
    label: 'Explain it',
    instruction:
      'Explain the mechanism behind this point in plain words, step by step, using only the article and the EVIDENCE.',
  },
  dig_reasons: {
    label: 'Dig deeper into the reasons',
    instruction:
      'Set out the competing reasons for this outcome (supply constraints, incomes, interest rates, regulation, demand), and say which the EVIDENCE supports, for which place and horizon.',
  },
  add_other_side: {
    label: 'Add the other side',
    instruction:
      'Add the strongest evidence that cuts the other way, with its limits, so a reader sees both sides fairly.',
  },
  add_numbers: {
    label: 'Add the numbers',
    instruction:
      'Add the relevant figures from the article and EVIDENCE, each with its source and what it measures.',
  },
  add_chart: {
    label: 'Add a chart',
    instruction:
      'Write one short paragraph that introduces the chart named below and says what a reader should notice in it, citing its source.',
  },
} as const;
export type GapAction = keyof typeof GAP_ACTIONS;
export const isGapAction = (value: unknown): value is GapAction =>
  typeof value === 'string' && value in GAP_ACTIONS;

export type GapKind =
  'cause_unexplained' | 'reasons_missing' | 'no_counter_evidence' | 'no_numbers' | 'no_chart';

export interface Gap {
  id: string;
  kind: GapKind;
  claimId: string | null;
  datasetId: string | null;
  title: string;
  why: string;
  actions: GapAction[];
}

const hasNumber = (text: string) => /\d/.test(text);

export function detectGaps(investigation: Investigation): Gap[] {
  const gaps: Gap[] = [];
  const done = new Set((investigation.drafts ?? []).map((d) => d.gapId));
  for (const row of compareClaims(investigation)) {
    const { claim } = row;
    const evidence = [...row.supports, ...row.contradicts, ...row.context];
    const causal = evidence.filter((e) => e.tier === 'causal_design' || e.tier === 'quasi_causal');
    if (claim.kind === 'causal' && claim.quote && causal.length === 0) {
      gaps.push({
        id: 'cause:' + claim.id,
        kind: 'cause_unexplained',
        claimId: claim.id,
        datasetId: null,
        title: 'Cause stated, not explained',
        why: `“${claim.text}” is a causal claim, but nothing linked to it can tell cause from correlation.`,
        actions: ['explain', 'dig_reasons'],
      });
    }
    if (
      claim.kind !== 'empirical' &&
      claim.kind !== 'historical' &&
      row.supports.length > 0 &&
      row.contradicts.length === 0
    ) {
      gaps.push({
        id: 'other:' + claim.id,
        kind: 'no_counter_evidence',
        claimId: claim.id,
        datasetId: null,
        title: 'Only one side',
        why: `Every source linked to “${claim.text}” points the same way. What would a critic cite?`,
        actions: ['add_other_side'],
      });
    }
    if (
      (claim.kind === 'empirical' || claim.kind === 'causal') &&
      !hasNumber(claim.text) &&
      evidence.some((e) => hasNumber(e.finding.statement))
    ) {
      gaps.push({
        id: 'numbers:' + claim.id,
        kind: 'no_numbers',
        claimId: claim.id,
        datasetId: null,
        title: 'No numbers',
        why: `“${claim.text}” has no size attached, though the linked studies give figures.`,
        actions: ['add_numbers'],
      });
    }
  }
  investigation.omissions.forEach((omission, index) => {
    gaps.push({
      id: 'omitted:' + index,
      kind: 'reasons_missing',
      claimId: null,
      datasetId: null,
      title: 'Left out',
      why: omission,
      actions: ['explain', 'dig_reasons'],
    });
  });
  for (const dataset of investigation.datasets ?? []) {
    gaps.push({
      id: 'chart:' + dataset.id,
      kind: 'no_chart',
      claimId: null,
      datasetId: dataset.id,
      title: 'A chart would say it faster',
      why: `${dataset.title} (${dataset.sourceTitle}).`,
      actions: ['add_chart'],
    });
  }
  return gaps.map((gap) =>
    done.has(gap.id) ? { ...gap, title: gap.title + ' · addressed' } : gap,
  );
}

/** Split into sentences for a readable diff. */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ“"(\[])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sentences added and removed between two versions (order-insensitive, exact match). */
export function sentenceDiff(
  before: string,
  after: string,
): { added: string[]; removed: string[] } {
  const a = sentences(before);
  const b = sentences(after);
  const inA = new Set(a);
  const inB = new Set(b);
  return { added: b.filter((s) => !inA.has(s)), removed: a.filter((s) => !inB.has(s)) };
}
