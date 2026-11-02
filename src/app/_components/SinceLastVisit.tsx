'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { recordVisit } from '@/lib/client/local';
import { zurichTime } from '@/lib/format-time';
import type { Change } from '@/lib/investigations/featured';

import styles from '../today.module.css';

/** New versions since this browser's previous visit, plus the visit streak. */
export function SinceLastVisit({ changes }: { changes: Change[] }) {
  const [state, setState] = useState<{ previous: string | null; streak: number } | null>(null);
  useEffect(() => {
    queueMicrotask(() => setState(recordVisit()));
  }, []);
  const fresh = state?.previous
    ? changes.filter((c) => c.at > state.previous!)
    : changes.slice(0, 4);
  return (
    <section className={styles.panel} aria-labelledby="since-heading">
      <div className={styles.panelHead}>
        <h2 id="since-heading">{state?.previous ? 'Since your last visit' : 'Latest changes'}</h2>
        {state && state.streak > 0 && (
          <span className={styles.streak} title="Days in a row you opened BiasLens">
            🔥 {state.streak}-day streak
          </span>
        )}
      </div>
      {state?.previous && <p className={styles.meta}>Last visit {zurichTime(state.previous)}.</p>}
      {fresh.length ? (
        <ul className={styles.changes}>
          {fresh.slice(0, 5).map((c) => (
            <li key={c.href + c.at}>
              <Link href={c.href}>{c.title}</Link>
              <span className={styles.meta}>
                {zurichTime(c.at)} · {c.investigation.slice(0, 70)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.meta}>Nothing new since then. Start a question of your own below.</p>
      )}
    </section>
  );
}
