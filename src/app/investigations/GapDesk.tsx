'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GAP_ACTIONS, type Gap, type GapAction } from '@/lib/domain/gaps';
import type { Investigation } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

export const tokenKey = (id: string) => 'biaslens:investigation-token:' + id;

const KIND_ICON: Record<Gap['kind'], string> = {
  cause_unexplained: '?',
  reasons_missing: '…',
  no_counter_evidence: '⇄',
  no_numbers: '#',
  no_chart: '▮',
  flagged: '⚑',
};

type Props = { id: string | null; revision: number; investigation: Investigation; gaps: Gap[] };

/**
 * The suggestions desk: what the article leaves unexplained, each with
 * one-tap actions. A tap writes the next version (saving a copy first on the
 * demo) and the page shows what changed and which sources drove it.
 */
export function GapDesk({ id, revision, investigation, gaps }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    queueMicrotask(() => {
      try {
        setToken(localStorage.getItem(tokenKey(id)));
      } catch {
        /* Storage blocked: actions save a fresh copy instead. */
      }
    });
  }, [id]);

  async function run(gap: Gap, action: GapAction) {
    setBusy(gap.id + action);
    setStatus('Saving your copy…');
    try {
      let targetId = id;
      let editToken = token;
      let rev = revision;
      if (!targetId || !editToken) {
        const created = await fetch('/api/investigations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(investigation),
        }).then((r) => r.json());
        if (!created.ok) throw new Error(created.error?.message ?? 'Could not save a copy.');
        targetId = created.id as string;
        editToken = created.editToken as string;
        rev = created.revision as number;
        localStorage.setItem(tokenKey(targetId), editToken);
      }
      setStatus(`${GAP_ACTIONS[action].label}: writing the next version with the linked evidence…`);
      const result = await fetch(`/api/investigations/${targetId}/revise`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editToken, revision: rev, gapId: gap.id, action }),
      }).then((r) => r.json());
      if (!result.ok) throw new Error(result.error?.message ?? 'Could not write this version.');
      router.push(`/investigations/${targetId}#versions`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="gaps-heading">
      <p className={styles.eyebrow}>Suggestions · found from the evidence map, not guessed</p>
      <h2 id="gaps-heading">What this article doesn’t explain yet</h2>
      <p className={styles.meta}>
        Tap an action. BiasLens writes a new version of the article that fills that gap with the
        linked sources, each cited as [E1], [E2]…, and shows exactly what changed.
      </p>
      <div className={styles.gaps}>
        {gaps.map((gap) => (
          <article key={gap.id} className={styles.gap} data-kind={gap.kind}>
            <span className={styles.gapIcon} aria-hidden="true">
              {KIND_ICON[gap.kind]}
            </span>
            <div>
              <h3>{gap.title}</h3>
              <p>{gap.why}</p>
              <div className={styles.actions}>
                {gap.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="bb-button bb-button--secondary"
                    disabled={busy !== null}
                    onClick={() => run(gap, action)}
                  >
                    {busy === gap.id + action ? 'Writing…' : GAP_ACTIONS[action].label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p role="status" aria-live="polite" className={styles.meta}>
        {status}
      </p>
    </section>
  );
}
