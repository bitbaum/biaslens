import { describe, expect, it } from 'vitest';

import {
  METHOD_VERSION,
  auditEpistemicGraph,
  traceDependencies,
  validateEpistemicGraph,
  type EpistemicGraph,
} from './epistemic-graph';

const taxGraph: EpistemicGraph = {
  methodVersion: METHOD_VERSION,
  question: 'Does a flat tax cause faster long-term economic growth?',
  claims: [
    {
      id: 'c1',
      text: 'A flat tax improves the business environment.',
      kind: 'causal',
      operationalDefinition: 'New business registrations per 1,000 residents',
      scope: 'Swiss cantons, 2000–2025',
      proposedTest: 'Compare treated and matched untreated jurisdictions.',
    },
    {
      id: 'c2',
      text: 'A better business environment increases private investment.',
      kind: 'causal',
      scope: 'Switzerland',
    },
    {
      id: 'c3',
      text: 'Higher investment increases long-run growth.',
      kind: 'causal',
    },
    {
      id: 'c4',
      text: 'A flat tax increases long-run growth.',
      kind: 'causal',
    },
  ],
  evidence: [
    {
      id: 'e1',
      claimId: 'c1',
      stance: 'supports',
      review: 'candidate',
      sourceKind: 'secondary',
      title: 'Hypothetical economic report',
    },
    {
      id: 'e2',
      claimId: 'c2',
      stance: 'contradicts',
      review: 'reviewed',
      sourceKind: 'dataset',
      title: 'Hypothetical audited dataset',
      url: 'https://example.org/source',
      locator: 'Table 2, rows 12–35',
    },
  ],
  relations: [
    {
      id: 'r1',
      fromClaimId: 'c4',
      toClaimId: 'c1',
      kind: 'depends_on',
      review: 'candidate',
      evidenceIds: [],
      rationale: 'Proposed intermediate mechanism.',
    },
    {
      id: 'r2',
      fromClaimId: 'c1',
      toClaimId: 'c2',
      kind: 'proposed_cause',
      review: 'candidate',
      evidenceIds: [],
      rationale: 'Hypothesised relationship, not tested.',
    },
    {
      id: 'r3',
      fromClaimId: 'c4',
      toClaimId: 'c3',
      kind: 'depends_on',
      review: 'candidate',
      evidenceIds: [],
      rationale: 'Growth mechanism also requires investment effects.',
    },
  ],
  challenges: [
    {
      id: 'ch1',
      targetKind: 'claim',
      targetId: 'c1',
      criticism: 'The chosen business metric may miss informal or relocated firms.',
      status: 'open',
    },
  ],
};

describe('open epistemic methodology', () => {
  it('validates referential integrity of claims, evidence, edges and challenges', () => {
    expect(validateEpistemicGraph(taxGraph)).toEqual([]);
  });

  it('does not turn a candidate search result into verified truth', () => {
    const audit = auditEpistemicGraph({ ...taxGraph, challenges: [] });
    expect(audit.claims.find((claim) => claim.claimId === 'c1')?.evidenceStage).toBe('leads_only');
    expect(audit.claims.find((claim) => claim.claimId === 'c1')?.gaps).toContain(
      'All sources are unreviewed leads',
    );
  });

  it('records dissent and missing causal identification', () => {
    const audit = auditEpistemicGraph(taxGraph);
    const claim = audit.claims.find((item) => item.claimId === 'c1');
    expect(claim?.evidenceStage).toBe('challenged');
    expect(claim?.openChallenges).toEqual(['ch1']);
    const c2 = audit.claims.find((item) => item.claimId === 'c2');
    expect(c2?.gaps).toContain('Causal identification or counterfactual test missing');
  });

  it('does not infer a cause from an unreviewed series of connections', () => {
    const audit = auditEpistemicGraph(taxGraph);
    expect(audit.relations.find((item) => item.relationId === 'r2')?.gaps).toContain(
      'A causal edge requires separate identification; no transitive proof',
    );
    expect(traceDependencies(taxGraph, 'c4')).toEqual(['c4', 'c1', 'c3']);
  });

  it('never loops on a circular dependency, and refuses absent roots', () => {
    const graph: EpistemicGraph = {
      ...taxGraph,
      relations: [
        ...taxGraph.relations,
        {
          id: 'r4',
          fromClaimId: 'c1',
          toClaimId: 'c4',
          kind: 'depends_on',
          review: 'candidate',
          evidenceIds: [],
          rationale: 'Circular supporting assumption.',
        },
      ],
    };
    expect(traceDependencies(graph, 'c4')).toEqual(['c4', 'c1', 'c3']);
    expect(traceDependencies(graph, 'missing')).toEqual([]);
  });

  it('rejects dangling sources, unsupported targets and silent challenge closure', () => {
    const graph: EpistemicGraph = {
      ...taxGraph,
      relations: [{ ...taxGraph.relations[0], evidenceIds: ['does-not-exist'] }],
      challenges: [
        {
          id: 'ch1',
          targetKind: 'method',
          targetId: METHOD_VERSION,
          criticism: 'The rubric may underweight dependent datasets.',
          status: 'resolved',
        },
      ],
    };
    const problems = validateEpistemicGraph(graph);
    expect(problems).toContain('Relation r1 has unknown evidence');
    expect(problems).toContain('Resolved challenge ch1 needs a resolution record');
  });

  it('requires a page, table or timestamp for reviewed evidence', () => {
    const graph: EpistemicGraph = {
      ...taxGraph,
      evidence: [{ ...taxGraph.evidence[1], locator: undefined }],
    };
    expect(validateEpistemicGraph(graph)).toContain(
      'Reviewed evidence e2 needs a URL and a precise locator',
    );
  });
});
