'use client';

import { useState } from 'react';

import type { ApiResult } from '@/lib/api/result';
import type { ClaimVerification } from '@/lib/domain/claim-verification';
import {
  EVIDENCE_STANCE,
  MIN_AGREEMENT_TO_CONCLUDE,
  STANCE_DISPLAY,
  VERIFICATION_DISPLAY,
  type EvidenceStance,
  type VerdictTone,
} from '@/lib/config/verification';

import styles from './EvidenceVerifier.module.css';

const TONE_CLASS: Record<VerdictTone, string> = {
  positive: styles.tonePositive,
  negative: styles.toneNegative,
  neutral: styles.toneNeutral,
};

/** Counter state keyed by stance — the only input the tally algorithm consumes. */
type Counts = Record<EvidenceStance, number>;

/**
 * EvidenceVerifier — an educational count-only demo, NOT a fact-check.
 *
 * The legacy API field called "confidence" is only the majority's share of
 * synthetic entries. The UI must never present it as a truth probability.
 */
export function EvidenceVerifier() {
  const [counts, setCounts] = useState<Counts>({
    [EVIDENCE_STANCE.SUPPORTS]: 0,
    [EVIDENCE_STANCE.CONTRADICTS]: 0,
  });
  const [result, setResult] = useState<ClaimVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = (stance: EvidenceStance, delta: number) => {
    setCounts((c) => ({ ...c, [stance]: Math.max(0, c[stance] + delta) }));
    setResult(null);
    setError(null);
  };

  const verify = async () => {
    setLoading(true);
    setError(null);
    const evidence = (Object.keys(counts) as EvidenceStance[]).flatMap((stance) =>
      Array.from({ length: counts[stance] }, () => ({ stance })),
    );
    try {
      const res = await fetch('/api/claims/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ evidence }),
      });
      const json: ApiResult<ClaimVerification> = await res.json();
      if (!json.success) {
        setError(json.error);
        setResult(null);
      } else {
        setResult(json.data);
      }
    } catch {
      setError('Could not reach the verification service. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const display = result ? VERIFICATION_DISPLAY[result.status] : null;

  return (
    <section className={styles.panel} aria-label="Evidence counting demonstration">
      <div>
        <div className={styles.heading}>Evidence-counting demonstration</div>
        <p className={styles.sub}>
          Add hypothetical supporting and contradicting entries to explore how a simple count behaves.
          This does not read sources or verify a claim. Repeated or weak sources count just as much as
          strong, independent evidence.
        </p>
      </div>

      <div className={styles.counters}>
        {(Object.keys(counts) as EvidenceStance[]).map((stance) => (
          <div key={stance} className={styles.counter}>
            <span className={styles.counterLabel}>{STANCE_DISPLAY[stance].label}</span>
            <span className={styles.stepper}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => step(stance, -1)}
                disabled={counts[stance] === 0}
                aria-label={`Remove one ${STANCE_DISPLAY[stance].label.toLowerCase()} item`}
              >
                −
              </button>
              <span className={styles.count} aria-live="polite">
                {counts[stance]}
              </span>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => step(stance, 1)}
                aria-label={`Add one ${STANCE_DISPLAY[stance].label.toLowerCase()} item`}
              >
                +
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.verifyBtn} onClick={verify} disabled={loading}>
          {loading ? 'Counting…' : 'Compare counts'}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>

      {result && display && (
        <div className={styles.result}>
          <div className={styles.verdictRow}>
            <span className={`${styles.verdict} ${TONE_CLASS[display.tone]}`}>{display.label}</span>
            {result.confidence !== null && (
              <span className={styles.confidence}>
                {Math.round(result.confidence * 100)}% share of counted entries — not confidence
              </span>
            )}
          </div>
          <div className={styles.tally}>
            <span>Supporting: {result.inputs.supports}</span>
            <span>Contradicting: {result.inputs.contradicts}</span>
            <span>Total: {result.inputs.total}</span>
          </div>
          <p className={styles.explain}>
            The demo highlights whichever side has at least{' '}
            {Math.round(MIN_AGREEMENT_TO_CONCLUDE * 100)}% of the entries. This threshold has no
            statistical calibration and does not establish factual correctness, independence or
            source quality. For actual research, review the open methodology and original records.
          </p>
          <span className={styles.algo}>algorithm: {result.algorithm}</span>
        </div>
      )}
    </section>
  );
}
