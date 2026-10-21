/**
 * Open epistemic method v0.1 — a portable, pure TypeScript contract.
 *
 * Important: this is NOT a truth-scoring algorithm. It records what was
 * asserted, what sources bear on each assertion, why two assertions were
 * connected, and what remains open to challenge.
 *
 * A search result is a lead, not a finding. A citation count is never
 * calibrated confidence. A hypothetical causal path is not causal proof.
 */

export const METHOD_VERSION = '0.1.0' as const;

export type ClaimKind = 'empirical' | 'historical' | 'causal' | 'normative' | 'predictive';
export type EvidenceStance = 'supports' | 'contradicts' | 'context';
export type SourceKind = 'primary' | 'secondary' | 'testimony' | 'dataset' | 'other';
export type ReviewState = 'candidate' | 'reviewed' | 'disputed';
export type RelationKind =
  | 'depends_on'
  | 'proposed_cause'
  | 'alternative_explanation'
  | 'in_tension_with';

export interface EpistemicClaim {
  id: string;
  text: string;
  kind: ClaimKind;
  /** Population, jurisdiction, period, counterfactual, or other limitations. */
  scope?: string;
  /** What observable variables or records would count as a test? */
  operationalDefinition?: string;
  /** An experiment, identification strategy, archival test, or disconfirmation. */
  proposedTest?: string;
}

export interface EvidenceRecord {
  id: string;
  claimId: string;
  stance: EvidenceStance;
  review: ReviewState;
  sourceKind: SourceKind;
  title: string;
  url?: string;
  /** Specific document page, quotation, table, timestamp, or archival locator. */
  locator?: string;
  /** Source data snapshot identifier; does not certify accuracy or authenticity. */
  contentDigest?: string;
  /** When the source was actually retrieved, not when the asserted event occurred. */
  retrievedAt?: string;
  note?: string;
}

export interface ClaimRelation {
  id: string;
  /** For depends_on, fromClaimId requires toClaimId to hold as a premise. */
  fromClaimId: string;
  toClaimId: string;
  kind: RelationKind;
  review: ReviewState;
  /** Evidence for this specific edge, not merely evidence for its two endpoints. */
  evidenceIds: string[];
  rationale: string;
}

export interface MethodChallenge {
  id: string;
  targetKind: 'method' | 'claim' | 'evidence' | 'relation';
  /** METHOD_VERSION for challenges targeting the method. */
  targetId: string;
  status: 'open' | 'answered' | 'resolved';
  criticism: string;
  /** What would resolve the challenge, if known. */
  requestedChange?: string;
  response?: string;
  /** Required to close as resolved; answering alone does not resolve dissent. */
  resolution?: string;
}

export interface EpistemicGraph {
  methodVersion: typeof METHOD_VERSION;
  question: string;
  claims: EpistemicClaim[];
  evidence: EvidenceRecord[];
  relations: ClaimRelation[];
  challenges: MethodChallenge[];
}

function uniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function nonempty(value: string): boolean {
  return value.trim().length > 0;
}

/** Structural problems must be corrected before the graph is published. */
export function validateEpistemicGraph(graph: EpistemicGraph): string[] {
  const problems: string[] = [];
  if (graph.methodVersion !== METHOD_VERSION) problems.push('Unsupported method version');
  if (!nonempty(graph.question)) problems.push('Question must not be empty');
  for (const [kind, ids] of [
    ['claim', graph.claims.map((item) => item.id)],
    ['evidence', graph.evidence.map((item) => item.id)],
    ['relation', graph.relations.map((item) => item.id)],
    ['challenge', graph.challenges.map((item) => item.id)],
  ] as const) {
    if (ids.some((id) => !nonempty(id))) problems.push('Empty ' + kind + ' identifier');
    if (!uniqueValues(ids)) problems.push('Duplicate ' + kind + ' identifier');
  }

  const claimIds = new Set(graph.claims.map((item) => item.id));
  const evidenceIds = new Set(graph.evidence.map((item) => item.id));
  const relationIds = new Set(graph.relations.map((item) => item.id));
  for (const claim of graph.claims) {
    if (!nonempty(claim.text)) problems.push('Claim ' + claim.id + ' has no assertion');
  }
  for (const record of graph.evidence) {
    if (!claimIds.has(record.claimId))
      problems.push('Evidence ' + record.id + ' references an unknown claim');
    if (!nonempty(record.title))
      problems.push('Evidence ' + record.id + ' has no source title');
    if (record.review === 'reviewed' && (!record.url || !record.locator))
      problems.push('Reviewed evidence ' + record.id + ' needs a URL and a precise locator');
  }
  for (const relation of graph.relations) {
    if (!claimIds.has(relation.fromClaimId) || !claimIds.has(relation.toClaimId))
      problems.push('Relation ' + relation.id + ' references an unknown claim');
    if (relation.fromClaimId === relation.toClaimId)
      problems.push('Relation ' + relation.id + ' cannot point to itself');
    if (!nonempty(relation.rationale))
      problems.push('Relation ' + relation.id + ' requires an explanation');
    for (const id of relation.evidenceIds) {
      if (!evidenceIds.has(id)) problems.push('Relation ' + relation.id + ' has unknown evidence');
    }
  }
  for (const challenge of graph.challenges) {
    const exists =
      challenge.targetKind === 'method'
        ? challenge.targetId === METHOD_VERSION
        : challenge.targetKind === 'claim'
          ? claimIds.has(challenge.targetId)
          : challenge.targetKind === 'evidence'
            ? evidenceIds.has(challenge.targetId)
            : relationIds.has(challenge.targetId);
    if (!exists) problems.push('Challenge ' + challenge.id + ' has unknown target');
    if (!nonempty(challenge.criticism))
      problems.push('Challenge ' + challenge.id + ' needs a specific criticism');
    if (challenge.status === 'resolved' && !challenge.resolution?.trim())
      problems.push('Resolved challenge ' + challenge.id + ' needs a resolution record');
  }
  return problems;
}

export interface ClaimAudit {
  claimId: string;
  /** Evidence workflow stage, NOT a true/false verdict or numerical confidence. */
  evidenceStage: 'unexamined' | 'leads_only' | 'reviewed_inputs' | 'challenged';
  sourceIds: string[];
  openChallenges: string[];
  gaps: string[];
}

export interface RelationAudit {
  relationId: string;
  /** A reviewed edge is still not necessarily a causal proof. */
  evidenceStage: 'unexamined' | 'leads_only' | 'reviewed_inputs' | 'challenged';
  gaps: string[];
}

/**
 * Source counts are deliberately not converted to probabilities. Even
 * multiple reviewed citations can be dependent copies of the same source.
 */
export function auditEpistemicGraph(graph: EpistemicGraph): {
  structuralProblems: string[];
  claims: ClaimAudit[];
  relations: RelationAudit[];
} {
  const challengesFor = (kind: MethodChallenge['targetKind'], id: string) =>
    graph.challenges.filter(
      (challenge) =>
        challenge.targetKind === kind && challenge.targetId === id && challenge.status === 'open',
    );
  const stageFor = (
    records: EvidenceRecord[],
    challenged: boolean,
  ): ClaimAudit['evidenceStage'] => {
    if (challenged || records.some((record) => record.review === 'disputed')) return 'challenged';
    if (records.some((record) => record.review === 'reviewed')) return 'reviewed_inputs';
    if (records.length > 0) return 'leads_only';
    return 'unexamined';
  };

  const claims = graph.claims.map((claim): ClaimAudit => {
    const records = graph.evidence.filter((record) => record.claimId === claim.id);
    const challenges = challengesFor('claim', claim.id);
    const gaps: string[] = [];
    if (records.length === 0) gaps.push('No evidence attached');
    if (records.length > 0 && records.every((record) => record.review === 'candidate')) {
      gaps.push('All sources are unreviewed leads');
    }
    if (!claim.scope?.trim()) gaps.push('Scope not specified');
    if (
      (claim.kind === 'empirical' || claim.kind === 'causal' || claim.kind === 'predictive') &&
      !claim.operationalDefinition?.trim()
    ) {
      gaps.push('Operational definition missing');
    }
    if (claim.kind === 'causal' && !claim.proposedTest?.trim()) {
      gaps.push('Causal identification or counterfactual test missing');
    }
    if (challenges.length > 0) gaps.push('Open challenges require consideration');
    return {
      claimId: claim.id,
      evidenceStage: stageFor(records, challenges.length > 0),
      sourceIds: records.map((record) => record.id),
      openChallenges: challenges.map((challenge) => challenge.id),
      gaps,
    };
  });

  const relations = graph.relations.map((relation): RelationAudit => {
    const records = graph.evidence.filter((item) => relation.evidenceIds.includes(item.id));
    const challenged = challengesFor('relation', relation.id).length > 0;
    const gaps: string[] = [];
    if (records.length === 0) gaps.push('Relationship has no direct supporting evidence');
    if (relation.review !== 'reviewed')
      gaps.push('Relationship is a hypothesis or disputed');
    if (relation.kind === 'proposed_cause')
      gaps.push('A causal edge requires separate identification; no transitive proof');
    return {
      relationId: relation.id,
      evidenceStage: stageFor(records, challenged || relation.review === 'disputed'),
      gaps,
    };
  });
  return { structuralProblems: validateEpistemicGraph(graph), claims, relations };
}

/** Reach the premises of a claim without inventing missing or transitive causal edges. */
export function traceDependencies(graph: EpistemicGraph, rootClaimId: string): string[] {
  const known = new Set(graph.claims.map((claim) => claim.id));
  if (!known.has(rootClaimId)) return [];
  const output: string[] = [];
  const queue = [rootClaimId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    output.push(current);
    for (const edge of graph.relations) {
      if (edge.kind === 'depends_on' && edge.fromClaimId === current) {
        if (known.has(edge.toClaimId) && !visited.has(edge.toClaimId)) {
          queue.push(edge.toClaimId);
        }
      }
    }
  }
  return output;
}
