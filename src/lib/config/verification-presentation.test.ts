import { describe, expect, it } from 'vitest';

import { VERIFICATION_DISPLAY, VERIFICATION_STATUS } from './verification';

describe('evidence-tally presentation', () => {
  it('labels counts without asserting that a factual claim was verified', () => {
    expect(VERIFICATION_DISPLAY[VERIFICATION_STATUS.SUPPORTED].label).toMatch(/entries/i);
    expect(VERIFICATION_DISPLAY[VERIFICATION_STATUS.CONTRADICTED].label).toMatch(/entries/i);
    expect(VERIFICATION_DISPLAY[VERIFICATION_STATUS.UNVERIFIABLE].label).toMatch(/majority/i);
  });

  it('does not call an empty count an absence of evidence in the world', () => {
    expect(VERIFICATION_DISPLAY[VERIFICATION_STATUS.PENDING].label).toBe('No entries');
  });
});
