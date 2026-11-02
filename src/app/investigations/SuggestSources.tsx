'use client';

import { useState } from 'react';

import type { SourceCandidate } from '@/lib/investigations/suggest';

import styles from './investigation.module.css';

export const PREFILL_EVENT = 'biaslens:prefill-study';

/** Leads from several sides for one claim. A lead is not a finding until you read it. */
export function SuggestSources({ claimId, query }: { claimId: string; query: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [items, setItems] = useState<SourceCandidate[]>([]);
  async function load() {
    setState('loading');
    try {
      const body = await fetch('/api/sources/suggest?q=' + encodeURIComponent(query)).then((r) =>
        r.json(),
      );
      setItems(body.candidates ?? []);
      setState('done');
    } catch {
      setState('error');
    }
  }
  if (state === 'idle')
    return (
      <button type="button" className="bb-button bb-button--secondary" onClick={load}>
        Suggest sources from all sides
      </button>
    );
  if (state === 'loading') return <p className={styles.meta}>Searching OpenAlex and Crossref…</p>;
  if (state === 'error' || !items.length)
    return <p className={styles.meta}>No candidates found right now. Try again later.</p>;
  const sides = [...new Set(items.map((i) => i.side))];
  return (
    <div className={styles.suggest}>
      <p className={styles.meta}>
        Candidates from OpenAlex/Crossref. Leads only: open one, then add what it actually says.
      </p>
      {sides.map((side) => (
        <div key={side}>
          <h4>{side}</h4>
          <ul className={styles.list}>
            {items
              .filter((i) => i.side === side)
              .map((i) => (
                <li key={i.url}>
                  <a href={i.url} rel="noopener noreferrer" target="_blank">
                    {i.title}
                  </a>{' '}
                  <span className={styles.meta}>
                    {[i.authors, i.year, i.venue, i.citedBy ? i.citedBy + ' citations' : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent(PREFILL_EVENT, { detail: { ...i, claimId } }),
                      )
                    }
                  >
                    Use as a lead
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
