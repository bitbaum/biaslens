/**
 * Multi-source investigation — Open Epistemic Method v0.1 applied to one
 * article and the studies a reader attaches to it.
 *
 * An investigation links each claim the article makes to specific findings in
 * external studies. Every link carries a stance, a strength-of-evidence note
 * and the reason it was drawn; every claim carries what would disconfirm it.
 * Nothing here computes a truth or bias score: the comparison keeps sources
 * side by side so disagreement stays visible.
 */
import {
  METHOD_VERSION,
  validateEpistemicGraph,
  type ClaimKind,
  type EpistemicGraph,
  type EvidenceStance,
  type ReviewState,
} from './epistemic-graph';

export const INVESTIGATION_VERSION = 1 as const;

export type ArticleInputKind = 'url' | 'pdf' | 'paste';

/** How a study identifies its effect, from most to least able to support a causal claim. */
export const IDENTIFICATION_DESIGNS = [
  'randomized',
  'natural_experiment',
  'regression_discontinuity',
  'difference_in_differences',
  'instrumental_variables',
  'panel_fixed_effects',
  'cross_section',
  'descriptive_statistics',
  'literature_review',
  'theory',
] as const;
export type IdentificationDesign = (typeof IDENTIFICATION_DESIGNS)[number];

export type EvidenceTier =
  'causal_design' | 'quasi_causal' | 'associational' | 'descriptive' | 'synthesis';

/**
 * A qualitative tier and what it allows, never a number. The note tells the
 * reader what the design cannot rule out.
 */
export const DESIGN_PROFILE: Record<
  IdentificationDesign,
  { label: string; tier: EvidenceTier; canSupport: string; threats: string }
> = {
  randomized: {
    label: 'Randomized experiment',
    tier: 'causal_design',
    canSupport: 'A causal effect in the studied population.',
    threats: 'External validity: the population, scale and period may not transfer.',
  },
  natural_experiment: {
    label: 'Natural experiment',
    tier: 'quasi_causal',
    canSupport: 'A causal effect if assignment was as good as random.',
    threats: 'Whether the policy change coincided with other shocks.',
  },
  regression_discontinuity: {
    label: 'Regression discontinuity',
    tier: 'quasi_causal',
    canSupport: 'A local effect at the cutoff (date or threshold).',
    threats:
      'Anticipation, coinciding shocks at the cutoff, and a local estimate read as a long-run one.',
  },
  difference_in_differences: {
    label: 'Difference-in-differences',
    tier: 'quasi_causal',
    canSupport: 'A causal effect if treated and control areas would have trended alike.',
    threats: 'Diverging pre-trends and spillovers between treated and control units.',
  },
  instrumental_variables: {
    label: 'Instrumental variables',
    tier: 'quasi_causal',
    canSupport: 'A causal effect for units the instrument moves.',
    threats: 'An instrument that affects the outcome through another channel.',
  },
  panel_fixed_effects: {
    label: 'Panel with fixed effects',
    tier: 'associational',
    canSupport: 'An association net of fixed differences between units.',
    threats: 'Time-varying confounders and reverse causation.',
  },
  cross_section: {
    label: 'Cross-sectional comparison',
    tier: 'associational',
    canSupport: 'A correlation between places or groups.',
    threats: 'Confounding: places differ in many ways at once.',
  },
  descriptive_statistics: {
    label: 'Descriptive statistics',
    tier: 'descriptive',
    canSupport: 'What the level or trend of a measure is.',
    threats: 'Definitions and survey coverage; it does not say why.',
  },
  literature_review: {
    label: 'Literature review',
    tier: 'synthesis',
    canSupport: 'Where a body of studies agrees and disagrees.',
    threats: 'Selection of studies and studies of uneven quality counted alike.',
  },
  theory: {
    label: 'Theory or model',
    tier: 'synthesis',
    canSupport: 'A mechanism to test, not a measured effect.',
    threats: 'Assumptions that may not hold in the market studied.',
  },
};

export const HORIZONS = ['short_run', 'long_run', 'unspecified'] as const;
export type Horizon = (typeof HORIZONS)[number];

/** First-principles questions for economic claims about housing and regulation. */
export const ECONOMIC_LENSES = [
  'supply_elasticity',
  'binding_constraint',
  'time_horizon',
  'identification',
  'incidence',
] as const;
export type EconomicLens = (typeof ECONOMIC_LENSES)[number];

export const ECONOMIC_SCAFFOLD: Record<EconomicLens, { title: string; question: string }> = {
  supply_elasticity: {
    title: 'Supply elasticity',
    question:
      'How much can the quantity of housing respond to price here, and what limits it (land, planning, construction capacity)?',
  },
  binding_constraint: {
    title: 'Binding regulatory constraint',
    question:
      'Which rule actually binds (zoning, permits, rent caps, tenancy law)? A rule that does not bind cannot explain the outcome.',
  },
  time_horizon: {
    title: 'Short run vs long run',
    question:
      'Is the effect claimed immediate (existing stock, prices) or long-run (construction, quality, mobility)? The sign can differ.',
  },
  identification: {
    title: 'Identification strategy',
    question:
      'What is the counterfactual? Which design separates the policy from coinciding shocks, and what does it fail to rule out?',
  },
  incidence: {
    title: 'Who bears it',
    question:
      'Who gains and who pays: sitting tenants, newcomers, owners, low-income households? An average can hide opposite effects.',
  },
};

export interface ArticleSource {
  title: string;
  publication: string | null;
  url: string | null;
  inputKind: ArticleInputKind;
  publishedAt: string | null;
  /** A saved BiasLens reading of the article, if one exists. */
  reportId: string | null;
}

export interface StudyFinding {
  id: string;
  /** What the study reports, in close paraphrase of a passage that was opened. */
  statement: string;
  /** Abstract, table, page or section where the statement can be checked. */
  locator: string;
  outcome: string;
  population: string;
  horizon: Horizon;
}

/** Where a source stands in the debate. A tag for balance, not a credibility score. */
export const PERSPECTIVES = [
  'official_statistics',
  'international_org',
  'academic',
  'market_urbanist',
  'tenant_advocate',
] as const;
export type SourcePerspective = (typeof PERSPECTIVES)[number];

export const PERSPECTIVE_LABEL: Record<SourcePerspective, string> = {
  official_statistics: 'Official statistics',
  international_org: 'International organisation',
  academic: 'Academic research',
  market_urbanist: 'Market-urbanist / pro-supply',
  tenant_advocate: 'Tenant-protection / pro-regulation',
};

/** A small table of published figures, drawn as a chart. Every row comes from `source`. */
export interface Dataset {
  id: string;
  title: string;
  unit: string;
  sourceTitle: string;
  sourceUrl: string;
  kind: 'ranking' | 'series';
  rows: { label: string; value: number }[];
  highlight?: string;
}

/** One version of the reader's article, written in response to a gap action. */
export interface DraftVersion {
  version: number;
  createdAt: string;
  action: string;
  gapId: string | null;
  title: string;
  text: string;
  /** Why this version exists, in one sentence (model-written, labelled as such). */
  changeNote: string;
  /** Evidence keys ([E#]) the text cites, resolved to their findings. */
  citations: string[];
  datasetId: string | null;
  added: string[];
  removed: string[];
  promptVersion: string;
  modelId: string | null;
  /** Cited sentences a second model pass found not supported by the cited finding. */
  flags?: { sentence: string; reason: string }[];
}

export interface Study {
  id: string;
  perspective?: SourcePerspective;
  title: string;
  authors: string;
  year: number | null;
  venue: string;
  doi: string | null;
  url: string;
  design: IdentificationDesign;
  findings: StudyFinding[];
  review: ReviewState;
}

export interface InvestigationClaim {
  id: string;
  text: string;
  kind: ClaimKind;
  /** The passage in the article, verbatim when known. */
  quote: string | null;
  scope: string;
  /** What observation would show the claim to be wrong. */
  disconfirmation: string;
  lenses: EconomicLens[];
}

export interface ClaimFindingLink {
  id: string;
  claimId: string;
  studyId: string;
  findingId: string;
  stance: EvidenceStance;
  review: ReviewState;
  /** Why this finding bears on this claim, and how far it transfers. */
  rationale: string;
  /** Plain-language strength note: design, population match, horizon match. */
  strengthNote: string;
}

export interface Investigation {
  version: typeof INVESTIGATION_VERSION;
  question: string;
  article: ArticleSource;
  claims: InvestigationClaim[];
  studies: Study[];
  links: ClaimFindingLink[];
  /** Things the article leaves out that the studies or the method raise. */
  omissions: string[];
  notes: string;
  datasets?: Dataset[];
  drafts?: DraftVersion[];
  images?: InvestigationImage[];
}

/**
 * A picture shown with the investigation. Photos must be openly licensed
 * and credited; AI images are always labelled as such.
 */
export interface InvestigationImage {
  kind: 'photo' | 'ai';
  src: string;
  alt: string;
  caption: string;
  /** Photographer or, for AI images, the tool run that made it. */
  credit: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string | null;
}

const LIMITS = { claims: 60, studies: 40, findings: 20, links: 200, text: 4000, omissions: 40 };

const isString = (value: unknown, max = LIMITS.text): value is string =>
  typeof value === 'string' && value.length <= max;
const nonempty = (value: unknown): value is string => isString(value) && value.trim().length > 0;
const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);
const httpUrl = (value: unknown): value is string => {
  if (!isString(value, 2000)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
    );
  } catch {
    return false;
  }
};

const CLAIM_KINDS: readonly ClaimKind[] = [
  'empirical',
  'historical',
  'causal',
  'normative',
  'predictive',
];
const STANCES: readonly EvidenceStance[] = ['supports', 'contradicts', 'context'];
const REVIEWS: readonly ReviewState[] = ['candidate', 'reviewed', 'disputed'];

/**
 * Validate untrusted input (a request body or stored JSON). Returns the
 * problems; an empty list means the investigation can be stored.
 */
export function investigationProblems(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['Send a JSON object.'];
  const r = input as Record<string, unknown>;
  const problems: string[] = [];
  if (r.version !== INVESTIGATION_VERSION) problems.push('Unsupported investigation version');
  if (!nonempty(r.question)) problems.push('Question must not be empty');
  if (!isString(r.notes, 20000)) problems.push('Notes must be text');
  const a = r.article as Record<string, unknown> | undefined;
  if (!a || typeof a !== 'object') problems.push('Article is missing');
  else {
    if (!nonempty(a.title)) problems.push('Article needs a title');
    if (!oneOf(['url', 'pdf', 'paste'] as const, a.inputKind))
      problems.push('Unknown article input');
    if (a.url !== null && !httpUrl(a.url)) problems.push('Article URL must be http(s)');
    for (const key of ['publication', 'publishedAt', 'reportId'])
      if (a[key] !== null && !isString(a[key], 200))
        problems.push('Article ' + key + ' must be text');
  }
  const claims = Array.isArray(r.claims) ? r.claims : null;
  const studies = Array.isArray(r.studies) ? r.studies : null;
  const links = Array.isArray(r.links) ? r.links : null;
  const omissions = Array.isArray(r.omissions) ? r.omissions : null;
  if (!claims || claims.length > LIMITS.claims) problems.push('Claims must be a list (max 60)');
  if (!studies || studies.length > LIMITS.studies) problems.push('Studies must be a list (max 40)');
  if (!links || links.length > LIMITS.links) problems.push('Links must be a list (max 200)');
  if (!omissions || omissions.length > LIMITS.omissions || !omissions.every((o) => nonempty(o)))
    problems.push('Omissions must be a list of text');
  if (problems.length) return problems;

  const claimIds = new Set<string>();
  for (const raw of claims!) {
    const c = raw as Record<string, unknown>;
    if (!nonempty(c?.id) || claimIds.has(c.id)) {
      problems.push('Claim ids must be unique and non-empty');
      continue;
    }
    claimIds.add(c.id);
    if (!nonempty(c.text)) problems.push('Claim ' + c.id + ' has no assertion');
    if (!oneOf(CLAIM_KINDS, c.kind)) problems.push('Claim ' + c.id + ' has an unknown kind');
    if (c.quote !== null && !isString(c.quote))
      problems.push('Claim ' + c.id + ' quote must be text');
    if (!isString(c.scope) || !isString(c.disconfirmation))
      problems.push('Claim ' + c.id + ' scope and disconfirmation must be text');
    if (!Array.isArray(c.lenses) || !c.lenses.every((l) => oneOf(ECONOMIC_LENSES, l)))
      problems.push('Claim ' + c.id + ' has an unknown lens');
  }
  const findingsByStudy = new Map<string, Set<string>>();
  for (const raw of studies!) {
    const s = raw as Record<string, unknown>;
    if (!nonempty(s?.id) || findingsByStudy.has(s.id)) {
      problems.push('Study ids must be unique and non-empty');
      continue;
    }
    if (!nonempty(s.title) || !isString(s.authors) || !isString(s.venue))
      problems.push('Study ' + s.id + ' needs a title, authors and venue');
    if (!httpUrl(s.url)) problems.push('Study ' + s.id + ' needs an http(s) URL');
    if (s.doi !== null && !(isString(s.doi, 200) && /^10\.\d{4,9}\/\S+$/.test(s.doi)))
      problems.push('Study ' + s.id + ' DOI is malformed');
    if (s.year !== null && !(Number.isInteger(s.year) && (s.year as number) > 1800))
      problems.push('Study ' + s.id + ' year is invalid');
    if (!oneOf(IDENTIFICATION_DESIGNS, s.design))
      problems.push('Study ' + s.id + ' design is unknown');
    if (!oneOf(REVIEWS, s.review)) problems.push('Study ' + s.id + ' review state is unknown');
    if (s.perspective !== undefined && !oneOf(PERSPECTIVES, s.perspective))
      problems.push('Study ' + s.id + ' perspective is unknown');
    const ids = new Set<string>();
    const findings = Array.isArray(s.findings) ? s.findings : [];
    if (!Array.isArray(s.findings) || findings.length > LIMITS.findings)
      problems.push('Study ' + s.id + ' findings must be a list (max 20)');
    for (const fr of findings) {
      const f = fr as Record<string, unknown>;
      if (!nonempty(f?.id) || ids.has(f.id)) {
        problems.push('Finding ids in study ' + s.id + ' must be unique');
        continue;
      }
      ids.add(f.id);
      if (!nonempty(f.statement) || !nonempty(f.locator))
        problems.push('Finding ' + f.id + ' needs a statement and a locator');
      if (!isString(f.outcome) || !isString(f.population))
        problems.push('Finding ' + f.id + ' fields must be text');
      if (!oneOf(HORIZONS, f.horizon)) problems.push('Finding ' + f.id + ' horizon is unknown');
    }
    findingsByStudy.set(s.id, ids);
  }
  if (r.datasets !== undefined) {
    if (!Array.isArray(r.datasets) || r.datasets.length > 12)
      problems.push('Datasets must be a list');
    else
      for (const raw of r.datasets) {
        const d = raw as Record<string, unknown>;
        const rows = Array.isArray(d?.rows) ? d.rows : null;
        if (
          !nonempty(d?.id) ||
          !nonempty(d.title) ||
          !isString(d.unit, 40) ||
          !nonempty(d.sourceTitle) ||
          !httpUrl(d.sourceUrl) ||
          !oneOf(['ranking', 'series'] as const, d.kind) ||
          !rows ||
          rows.length > 60 ||
          !rows.every(
            (row) =>
              nonempty((row as Record<string, unknown>)?.label) &&
              Number.isFinite((row as Record<string, unknown>).value),
          )
        )
          problems.push('Dataset ' + String(d?.id) + ' is malformed');
      }
  }
  if (r.images !== undefined) {
    if (!Array.isArray(r.images) || r.images.length > 6)
      problems.push('Images must be a list of up to 6');
    else
      for (const raw of r.images) {
        const im = (raw ?? {}) as Record<string, unknown>;
        if (
          !oneOf(['photo', 'ai'] as const, im.kind) ||
          !httpUrl(im.src) ||
          !(im.src as string).startsWith('https://') ||
          !nonempty(im.alt) ||
          !isString(im.caption, 600) ||
          !nonempty(im.credit) ||
          !nonempty(im.license) ||
          (im.kind === 'photo' && !httpUrl(im.sourceUrl))
        ) {
          problems.push(
            'Each image needs https src, alt text, credit and licence; photos need a source page',
          );
          break;
        }
      }
  }
  if (r.drafts !== undefined) {
    if (!Array.isArray(r.drafts) || r.drafts.length > 40)
      problems.push('Drafts must be a list (max 40)');
    else
      for (const raw of r.drafts) {
        const d = raw as Record<string, unknown>;
        if (
          !Number.isInteger(d?.version) ||
          !isString(d.createdAt, 40) ||
          !isString(d.action, 40) ||
          !nonempty(d.title) ||
          !isString(d.text, 20000) ||
          !isString(d.changeNote) ||
          !Array.isArray(d.citations) ||
          !Array.isArray(d.added) ||
          !Array.isArray(d.removed) ||
          !isString(d.promptVersion, 40) ||
          (d.flags !== undefined && (!Array.isArray(d.flags) || d.flags.length > 20))
        )
          problems.push('Draft ' + String(d?.version) + ' is malformed');
      }
  }
  const linkIds = new Set<string>();
  for (const raw of links!) {
    const l = raw as Record<string, unknown>;
    if (!nonempty(l?.id) || linkIds.has(l.id)) {
      problems.push('Link ids must be unique and non-empty');
      continue;
    }
    linkIds.add(l.id);
    if (!claimIds.has(l.claimId as string))
      problems.push('Link ' + l.id + ' references an unknown claim');
    if (!findingsByStudy.get(l.studyId as string)?.has(l.findingId as string))
      problems.push('Link ' + l.id + ' references an unknown finding');
    if (!oneOf(STANCES, l.stance) || !oneOf(REVIEWS, l.review))
      problems.push('Link ' + l.id + ' has an unknown stance or review state');
    if (!nonempty(l.rationale)) problems.push('Link ' + l.id + ' needs a rationale');
    if (!isString(l.strengthNote)) problems.push('Link ' + l.id + ' strength note must be text');
  }
  return problems;
}

export function parseInvestigation(input: unknown): Investigation | null {
  return investigationProblems(input).length ? null : (input as Investigation);
}

/** Every DOI is shown as its resolver link. */
export function studyHref(study: Study): string {
  return study.doi ? 'https://doi.org/' + study.doi : study.url;
}

/**
 * The investigation as an Open Epistemic Method graph: one evidence record per
 * claim–finding link, with the finding's locator, so the method's audit
 * (stages and gaps) applies unchanged.
 */
export function toEpistemicGraph(investigation: Investigation): EpistemicGraph {
  const studies = new Map(investigation.studies.map((study) => [study.id, study]));
  return {
    methodVersion: METHOD_VERSION,
    question: investigation.question,
    claims: investigation.claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      kind: claim.kind,
      scope: claim.scope || undefined,
      operationalDefinition: claim.quote ?? undefined,
      proposedTest: claim.disconfirmation || undefined,
    })),
    evidence: investigation.links.map((link) => {
      const study = studies.get(link.studyId)!;
      const finding = study.findings.find((item) => item.id === link.findingId)!;
      return {
        id: link.id,
        claimId: link.claimId,
        stance: link.stance,
        review: link.review,
        sourceKind: study.design === 'literature_review' ? 'secondary' : 'primary',
        title: study.title,
        url: studyHref(study),
        locator: finding.locator,
        note: finding.statement,
      };
    }),
    relations: [],
    challenges: [],
  };
}

export function validateInvestigation(investigation: Investigation): string[] {
  return [
    ...investigationProblems(investigation),
    ...validateEpistemicGraph(toEpistemicGraph(investigation)),
  ];
}

export interface ComparedEvidence {
  linkId: string;
  study: Study;
  finding: StudyFinding;
  stance: EvidenceStance;
  review: ReviewState;
  tier: EvidenceTier;
  rationale: string;
  strengthNote: string;
}

export interface ClaimComparison {
  claim: InvestigationClaim;
  supports: ComparedEvidence[];
  contradicts: ComparedEvidence[];
  context: ComparedEvidence[];
  /** Why the sources may not actually disagree, or why they cannot settle it. */
  tensions: string[];
  /** What the method still asks for before the claim can be weighed. */
  gaps: string[];
  /** Scaffold questions the claim's lenses raise. */
  scaffold: { lens: EconomicLens; title: string; question: string }[];
}

/**
 * Side-by-side comparison per claim. Deliberately returns lists, never a
 * score: two quasi-experiments that disagree stay two quasi-experiments.
 */
export function compareClaims(investigation: Investigation): ClaimComparison[] {
  const studies = new Map(investigation.studies.map((study) => [study.id, study]));
  return investigation.claims.map((claim) => {
    const rows: ComparedEvidence[] = investigation.links
      .filter((link) => link.claimId === claim.id)
      .flatMap((link) => {
        const study = studies.get(link.studyId);
        const finding = study?.findings.find((item) => item.id === link.findingId);
        if (!study || !finding) return [];
        return [
          {
            linkId: link.id,
            study,
            finding,
            stance: link.stance,
            review: link.review,
            tier: DESIGN_PROFILE[study.design].tier,
            rationale: link.rationale,
            strengthNote: link.strengthNote,
          },
        ];
      });
    const supports = rows.filter((row) => row.stance === 'supports');
    const contradicts = rows.filter((row) => row.stance === 'contradicts');
    const context = rows.filter((row) => row.stance === 'context');
    const tensions: string[] = [];
    for (const pro of supports) {
      for (const con of contradicts) {
        const a = pro.finding;
        const b = con.finding;
        let note: string;
        if (pro.study.id === con.study.id)
          note = `${pro.study.authors} report both: the answer depends on the outcome measured (${a.outcome} vs ${b.outcome}).`;
        else if (
          a.horizon !== b.horizon &&
          a.horizon !== 'unspecified' &&
          b.horizon !== 'unspecified'
        )
          note = `${pro.study.authors} (${a.horizon.replace('_', '-')}) and ${con.study.authors} (${b.horizon.replace('_', '-')}) measure different horizons; both can hold.`;
        else if (a.population !== b.population)
          note = `${pro.study.authors} (${a.population}) and ${con.study.authors} (${b.population}) study different places or populations.`;
        else
          note = `${pro.study.authors} and ${con.study.authors} disagree on the same horizon and population; this is open.`;
        if (!tensions.includes(note)) tensions.push(note);
      }
    }
    const causalRows = rows.filter(
      (row) => row.tier === 'causal_design' || row.tier === 'quasi_causal',
    );
    const gaps: string[] = [];
    if (!rows.length) gaps.push('No study linked yet');
    if (claim.kind === 'causal' && rows.length && !causalRows.length)
      gaps.push('Causal claim rests only on associational, descriptive or review evidence');
    if (!claim.disconfirmation.trim()) gaps.push('Disconfirmation criterion missing');
    if (!claim.scope.trim()) gaps.push('Scope not specified');
    if (rows.length && rows.every((row) => row.review === 'candidate'))
      gaps.push('Every link is an unreviewed lead');
    if (rows.some((row) => row.strengthNote.trim() === ''))
      gaps.push('A link has no strength-of-evidence note');
    return {
      claim,
      supports,
      contradicts,
      context,
      tensions,
      gaps,
      scaffold: claim.lenses.map((lens) => ({ lens, ...ECONOMIC_SCAFFOLD[lens] })),
    };
  });
}

/** Evidence the rewrite studio may cite, in the format it states it. */
export function citableFindings(investigation: Investigation): string[] {
  const studies = new Map(investigation.studies.map((study) => [study.id, study]));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const link of investigation.links) {
    const key = link.studyId + '/' + link.findingId;
    if (seen.has(key)) continue;
    seen.add(key);
    const study = studies.get(link.studyId);
    const finding = study?.findings.find((item) => item.id === link.findingId);
    if (!study || !finding) continue;
    out.push(
      `[${study.authors}${study.year ? ' ' + study.year : ''}; ${DESIGN_PROFILE[study.design].label}; ${finding.horizon.replace('_', '-')}; ${finding.population}] ${finding.statement} (${studyHref(study)}, ${finding.locator})`,
    );
  }
  return out;
}
