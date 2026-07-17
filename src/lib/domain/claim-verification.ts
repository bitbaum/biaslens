import type { Evidence } from '@prisma/client';
import {
  CLAIM_VERIFICATION_ALGORITHM,
  EVIDENCE_STANCE,
  MIN_AGREEMENT_TO_CONCLUDE,
  VERIFICATION_STATUS,
  type VerificationStatus,
} from '../config/verification';

/**
 * Claim verification — the project's first explainable score.
 *
 * INPUT      An article's stored `Evidence` rows for one claim (stance only).
 * ALGORITHM  `evidence-tally@1`: tally supporting vs. contradicting evidence; if
 *            the majority share reaches {@link MIN_AGREEMENT_TO_CONCLUDE} the claim
 *            is SUPPORTED / CONTRADICTED, otherwise UNVERIFIABLE; no evidence ⇒
 *            PENDING. Confidence = majority share of the evidence.
 * EVIDENCE   Every input row and the derived tally are returned in `inputs`, so
 *            the verdict is fully reproducible from what is stored — never
 *            hard-coded.
 * CONFIDENCE 0..1 share of evidence agreeing with the verdict; `null` when there
 *            is no evidence to be confident about.
 *
 * FAILURE MODES (known limitations of v1, to be addressed in later versions):
 *  - Unweighted: every evidence row counts equally; source credibility and
 *    recency are ignored. A pile of weak sources outvotes one strong one.
 *  - Sample-size blind: confidence is a proportion, not a statistical power. 3-vs-2
 *    (0.6) and 300-vs-200 report the same confidence despite very different rigor.
 *  - No de-duplication: correlated or duplicated evidence inflates its side.
 *  - Stance is trusted as given; mislabeled stance flips the verdict.
 */
export interface ClaimVerification {
  status: VerificationStatus;
  /** 0..1 share of evidence agreeing with the verdict; null when no evidence exists. */
  confidence: number | null;
  /** The exact tally the verdict was derived from — makes the score reproducible. */
  inputs: { supports: number; contradicts: number; total: number };
  /** Algorithm id + version, so a stored score can always be recomputed. */
  algorithm: string;
}

/**
 * Compute an explainable verification verdict for a claim from its evidence.
 * Pure and deterministic: same evidence in ⇒ same verdict out.
 */
export function scoreClaimVerification(
  evidence: ReadonlyArray<Pick<Evidence, 'stance'>>,
): ClaimVerification {
  let supports = 0;
  let contradicts = 0;
  for (const { stance } of evidence) {
    if (stance === EVIDENCE_STANCE.SUPPORTS) supports += 1;
    else if (stance === EVIDENCE_STANCE.CONTRADICTS) contradicts += 1;
    // Unknown stance values are ignored rather than trusted — fail closed.
  }

  const total = supports + contradicts;
  const inputs = { supports, contradicts, total };

  if (total === 0) {
    return {
      status: VERIFICATION_STATUS.PENDING,
      confidence: null,
      inputs,
      algorithm: CLAIM_VERIFICATION_ALGORITHM,
    };
  }

  const majority = Math.max(supports, contradicts);
  const confidence = majority / total;

  let status: VerificationStatus;
  if (supports / total >= MIN_AGREEMENT_TO_CONCLUDE) {
    status = VERIFICATION_STATUS.SUPPORTED;
  } else if (contradicts / total >= MIN_AGREEMENT_TO_CONCLUDE) {
    status = VERIFICATION_STATUS.CONTRADICTED;
  } else {
    status = VERIFICATION_STATUS.UNVERIFIABLE;
  }

  return { status, confidence, inputs, algorithm: CLAIM_VERIFICATION_ALGORITHM };
}
