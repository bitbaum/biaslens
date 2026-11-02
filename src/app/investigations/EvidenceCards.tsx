'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  DESIGN_PROFILE,
  PERSPECTIVE_LABEL,
  studyHref,
  type Investigation,
} from '@/lib/domain/investigation';

import type { ReviewState } from '@/lib/domain/epistemic-graph';

import styles from './investigation.module.css';
import { useEditToken } from './useEditToken';

type Props = { id: string | null; revision: number; investigation: Investigation };

/**
 * One card per linked finding: what it says, where to check it, how strong
 * the design is, and whether a person has reviewed the link. Reviewing is a
 * human act; the app never marks a link reviewed by itself.
 */
export function EvidenceCards({ id, revision, investigation }: Props) {
  const router = useRouter();
  const token = useEditToken(id);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function setReview(linkId: string, review: ReviewState) {
    if (!id || !token) return;
    setBusy(linkId);
    setStatus('Saving…');
    const next: Investigation = {
      ...investigation,
      links: investigation.links.map((l) => (l.id === linkId ? { ...l, review } : l)),
    };
    const response = await fetch('/api/investigations/' + id, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ editToken: token, revision, investigation: next }),
    });
    const body = await response.json();
    setBusy(null);
    if (!body.ok) return setStatus(body.error?.message ?? 'Could not save.');
    setStatus('Saved. The link is now marked ' + review + '.');
    router.refresh();
  }

  const claimText = new Map(investigation.claims.map((c) => [c.id, c.text]));
  return (
    <section className={styles.section} id="evidence" aria-labelledby="cards-heading">
      <p className={styles.eyebrow}>Evidence cards</p>
      <h2 id="cards-heading">Every finding, on its own card</h2>
      <p className={styles.meta}>
        {token
          ? 'You can edit this investigation: mark a link reviewed once you have opened the source and checked the passage.'
          : 'Only the person who saved this investigation can mark links reviewed. Links stay “candidate” until then.'}
      </p>
      <div className={styles.cardGrid}>
        {investigation.links.map((link) => {
          const study = investigation.studies.find((s) => s.id === link.studyId);
          const finding = study?.findings.find((f) => f.id === link.findingId);
          if (!study || !finding) return null;
          return (
            <article
              key={link.id}
              className={`${styles.evidenceCard} ${styles['card_' + link.stance]}`}
            >
              <header>
                <span className={styles['pill_' + link.stance]}>{link.stance}</span>
                <span className={styles.meta}>
                  {DESIGN_PROFILE[study.design].label} · {finding.horizon.replace('_', ' ')}
                </span>
              </header>
              <p className={styles.cardFinding}>“{finding.statement}”</p>
              <p className={styles.meta}>
                <a href={studyHref(study)}>
                  {study.authors} ({study.year ?? 'n.d.'})
                </a>{' '}
                · {finding.locator}
                {study.perspective ? ' · ' + PERSPECTIVE_LABEL[study.perspective] : ''}
              </p>
              <p className={styles.cardClaim}>
                <strong>On:</strong> {claimText.get(link.claimId)?.slice(0, 140)}
              </p>
              <p className={styles.meta}>{link.rationale}</p>
              <footer>
                <span className={link.review === 'reviewed' ? styles.reviewed : styles.meta}>
                  {link.review === 'reviewed'
                    ? '✓ Reviewed by a person'
                    : link.review === 'disputed'
                      ? '⚑ Disputed'
                      : 'Candidate link'}
                </span>
                {token && (
                  <span className={styles.actions}>
                    {link.review !== 'reviewed' && (
                      <button
                        type="button"
                        className="bb-button bb-button--secondary"
                        disabled={busy !== null}
                        onClick={() => void setReview(link.id, 'reviewed')}
                      >
                        Mark reviewed
                      </button>
                    )}
                    {link.review !== 'disputed' && (
                      <button
                        type="button"
                        className="bb-button bb-button--ghost"
                        disabled={busy !== null}
                        onClick={() => void setReview(link.id, 'disputed')}
                      >
                        Dispute
                      </button>
                    )}
                  </span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
      <p role="status" className={styles.meta}>
        {status}
      </p>
    </section>
  );
}
