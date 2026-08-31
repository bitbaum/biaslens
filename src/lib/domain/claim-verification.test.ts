import { describe, expect, it } from 'vitest';
import {
  CLAIM_VERIFICATION_ALGORITHM,
  EVIDENCE_STANCE,
  VERIFICATION_STATUS,
} from '../config/verification';
import { scoreClaimVerification } from './claim-verification';

const supports = { stance: EVIDENCE_STANCE.SUPPORTS };
const contradicts = { stance: EVIDENCE_STANCE.CONTRADICTS };

describe('scoreClaimVerification', () => {
  it('is PENDING with null confidence when there is no evidence', () => {
    const result = scoreClaimVerification([]);
    expect(result.status).toBe(VERIFICATION_STATUS.PENDING);
    expect(result.confidence).toBeNull();
    expect(result.inputs).toEqual({ supports: 0, contradicts: 0, total: 0 });
  });

  it('is SUPPORTED when the supporting majority meets the threshold', () => {
    // 3/5 = 0.6 ≥ MIN_AGREEMENT_TO_CONCLUDE
    const result = scoreClaimVerification([supports, supports, supports, contradicts, contradicts]);
    expect(result.status).toBe(VERIFICATION_STATUS.SUPPORTED);
    expect(result.confidence).toBeCloseTo(0.6);
    expect(result.inputs).toEqual({ supports: 3, contradicts: 2, total: 5 });
  });

  it('is CONTRADICTED when the contradicting majority meets the threshold', () => {
    const result = scoreClaimVerification([contradicts, contradicts, supports]);
    expect(result.status).toBe(VERIFICATION_STATUS.CONTRADICTED);
    expect(result.confidence).toBeCloseTo(2 / 3);
  });

  it('is UNVERIFIABLE when evidence is evenly split (no majority)', () => {
    const result = scoreClaimVerification([supports, contradicts]);
    expect(result.status).toBe(VERIFICATION_STATUS.UNVERIFIABLE);
    expect(result.confidence).toBeCloseTo(0.5);
  });

  it('is UNVERIFIABLE when the majority is below the threshold', () => {
    // 3/5 supports is exactly at threshold; 3/6 = 0.5 is below it.
    const result = scoreClaimVerification([
      supports,
      supports,
      supports,
      contradicts,
      contradicts,
      contradicts,
    ]);
    expect(result.status).toBe(VERIFICATION_STATUS.UNVERIFIABLE);
  });

  it('ignores unknown stance values rather than trusting them', () => {
    const result = scoreClaimVerification([supports, supports, { stance: 'garbage' }]);
    expect(result.inputs).toEqual({ supports: 2, contradicts: 0, total: 2 });
    expect(result.status).toBe(VERIFICATION_STATUS.SUPPORTED);
    expect(result.confidence).toBe(1);
  });

  it('stamps the algorithm version for reproducibility', () => {
    expect(scoreClaimVerification([]).algorithm).toBe(CLAIM_VERIFICATION_ALGORITHM);
  });

  it('is deterministic — identical input yields identical output', () => {
    const input = [supports, contradicts, supports];
    expect(scoreClaimVerification(input)).toEqual(scoreClaimVerification(input));
  });
});
