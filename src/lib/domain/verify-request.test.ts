import { describe, expect, it } from 'vitest';

import { EVIDENCE_STANCE } from '../config/verification';
import { parseVerifyRequest } from './verify-request';

describe('parseVerifyRequest', () => {
  it('accepts a well-formed evidence array', () => {
    const result = parseVerifyRequest({
      evidence: [{ stance: EVIDENCE_STANCE.SUPPORTS }, { stance: EVIDENCE_STANCE.CONTRADICTS }],
    });
    expect(result).toEqual({
      success: true,
      data: {
        evidence: [{ stance: EVIDENCE_STANCE.SUPPORTS }, { stance: EVIDENCE_STANCE.CONTRADICTS }],
      },
    });
  });

  it('accepts an empty evidence array (scorer maps it to PENDING)', () => {
    const result = parseVerifyRequest({ evidence: [] });
    expect(result).toEqual({ success: true, data: { evidence: [] } });
  });

  it('rejects a non-object body', () => {
    expect(parseVerifyRequest(null).success).toBe(false);
    expect(parseVerifyRequest([]).success).toBe(false);
    expect(parseVerifyRequest('nope').success).toBe(false);
  });

  it('rejects a missing or non-array evidence field', () => {
    const result = parseVerifyRequest({});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('evidence');
  });

  it('rejects an unknown stance with a helpful message listing allowed values', () => {
    const result = parseVerifyRequest({ evidence: [{ stance: 'maybe' }] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('evidence[0].stance');
      expect(result.error).toContain(EVIDENCE_STANCE.SUPPORTS);
      expect(result.error).toContain(EVIDENCE_STANCE.CONTRADICTS);
    }
  });

  it('reports the index of the first malformed evidence row', () => {
    const result = parseVerifyRequest({
      evidence: [{ stance: EVIDENCE_STANCE.SUPPORTS }, { stance: 'bogus' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('evidence[1]');
  });
});
