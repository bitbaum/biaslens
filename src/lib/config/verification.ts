// SSOT for claim-verification vocabulary and thresholds.
//
// The Prisma schema stores `Claim.verificationStatus` and `Evidence.stance` as
// free-form strings (documented there by comment); this module is the single
// source of truth the application layer validates and computes against. Keep the
// literal values here in sync with prisma/schema.prisma — nothing else may
// redefine them.

/** How a piece of evidence relates to its claim. Mirrors `Evidence.stance`. */
export const EVIDENCE_STANCE = {
  SUPPORTS: 'supports',
  CONTRADICTS: 'contradicts',
} as const;
export type EvidenceStance = (typeof EVIDENCE_STANCE)[keyof typeof EVIDENCE_STANCE];

/** Verdict on a claim. Mirrors `Claim.verificationStatus`. */
export const VERIFICATION_STATUS = {
  /** No evidence gathered yet — not assessable. */
  PENDING: 'pending',
  /** Evidence agrees, by at least the required margin, that the claim holds. */
  SUPPORTED: 'supported',
  /** Evidence agrees, by at least the required margin, that the claim is false. */
  CONTRADICTED: 'contradicted',
  /** Evidence exists but is too balanced to conclude either way. */
  UNVERIFIABLE: 'unverifiable',
} as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

/**
 * How each verdict is presented to a human: its label and a semantic *tone*
 * (not a colour — the CSS layer maps tone → `--color-tone-*`, keeping presentation
 * out of config). Deriving the UI from this map means a new status is labelled in
 * exactly one place. `tone` is intentionally decoupled from status so several
 * statuses can share a colour without repeating hex anywhere.
 */
export type VerdictTone = 'positive' | 'negative' | 'neutral';
export const VERIFICATION_DISPLAY: Record<
  VerificationStatus,
  { label: string; tone: VerdictTone }
> = {
  [VERIFICATION_STATUS.SUPPORTED]: { label: 'Supported', tone: 'positive' },
  [VERIFICATION_STATUS.CONTRADICTED]: { label: 'Contradicted', tone: 'negative' },
  [VERIFICATION_STATUS.UNVERIFIABLE]: { label: 'Unverifiable', tone: 'neutral' },
  [VERIFICATION_STATUS.PENDING]: { label: 'Pending — no evidence yet', tone: 'neutral' },
};

/** Human labels for each evidence stance, so the UI never hard-codes them. */
export const STANCE_DISPLAY: Record<EvidenceStance, { label: string }> = {
  [EVIDENCE_STANCE.SUPPORTS]: { label: 'Supporting' },
  [EVIDENCE_STANCE.CONTRADICTS]: { label: 'Contradicting' },
};

/**
 * Minimum share of evidence (0..1) that must agree before a claim is called
 * SUPPORTED or CONTRADICTED. Below this the majority is too thin to conclude, so
 * the claim stays UNVERIFIABLE — we would rather withhold a verdict than assert a
 * weakly-backed one (product philosophy: never tell the user what to think).
 */
export const MIN_AGREEMENT_TO_CONCLUDE = 0.6;

/**
 * Identifier for the scoring algorithm, stored alongside every score so results
 * stay reproducible and auditable. Bump the version when the logic changes.
 */
export const CLAIM_VERIFICATION_ALGORITHM = 'evidence-tally@1';
