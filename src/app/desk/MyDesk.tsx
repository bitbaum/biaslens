'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { follows, myInvestigationIds, recordVisit } from '@/lib/client/local';
import type { Investigation } from '@/lib/domain/investigation';
import { zurichTime } from '@/lib/format-time';
import type { WrittenArticleSummary } from '@/lib/writing/store';

import styles from './desk.module.css';

interface Row {
  id: string;
  mine: boolean;
  question: string;
  updatedAt: string;
  versions: number;
  candidate: number;
  reviewed: number;
  flags: number;
}

const summarise = (
  id: string,
  mine: boolean,
  data: { updatedAt: string; investigation: Investigation },
): Row => {
  const inv = data.investigation;
  return {
    id,
    mine,
    question: inv.question,
    updatedAt: data.updatedAt,
    versions: inv.drafts?.length ?? 0,
    candidate: inv.links.filter((l) => l.review === 'candidate').length,
    reviewed: inv.links.filter((l) => l.review === 'reviewed').length,
    flags: inv.drafts?.at(-1)?.flags?.length ?? 0,
  };
};

type Written = Omit<WrittenArticleSummary, 'createdAt' | 'updatedAt' | 'publishedAt'> & {
  updatedAt: string;
  publishedAt: string | null;
};
type WrittenState = { kind: 'loading' } | { kind: 'signed-out' } | { kind: 'ok'; list: Written[] };

/** Your desk: what you wrote (your account), and what this browser holds — edit links, follows, visit days. */
export function MyDesk() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [visit, setVisit] = useState({ streak: 0, days: 0 });
  const [written, setWritten] = useState<WrittenState>({ kind: 'loading' });
  useEffect(() => {
    queueMicrotask(async () => {
      const r = await fetch('/api/writing').catch(() => null);
      if (r?.status === 401 || r?.status === 503 || !r) setWritten({ kind: 'signed-out' });
      else {
        const body = (await r.json().catch(() => null)) as { articles?: Written[] } | null;
        setWritten({ kind: 'ok', list: body?.articles ?? [] });
      }
    });
    queueMicrotask(async () => {
      const v = recordVisit();
      setVisit({ streak: v.streak, days: v.days });
      const mine = myInvestigationIds();
      const followed = follows().filter((id) => !mine.includes(id));
      const pairs = [
        ...mine.map((id) => [id, true] as const),
        ...followed.map((id) => [id, false] as const),
      ];
      const all = await Promise.all(
        pairs.map(async ([id, isMine]) => {
          const r = await fetch('/api/investigations/' + id).catch(() => null);
          const body = r && r.ok ? await r.json() : null;
          return body?.ok ? summarise(id, isMine, body) : null;
        }),
      );
      setRows(
        all
          .filter((x): x is Row => x !== null)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    });
  }, []);
  const mine = rows?.filter((r) => r.mine) ?? [];
  const followed = rows?.filter((r) => !r.mine) ?? [];
  const queue = mine.reduce((n, r) => n + r.candidate, 0);
  const flags = mine.reduce((n, r) => n + r.flags, 0);
  const reviewed = mine.reduce((n, r) => n + r.reviewed, 0);
  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>🔥 {visit.streak}</strong>
          <span>day streak</span>
        </div>
        <div className={styles.stat}>
          <strong>{mine.length}</strong>
          <span>your investigations</span>
        </div>
        <div className={styles.stat}>
          <strong>{queue}</strong>
          <span>links to review</span>
        </div>
        <div className={styles.stat}>
          <strong>{flags}</strong>
          <span>flagged sentences</span>
        </div>
      </div>
      {mine.length > 0 && (
        <div className={styles.progress}>
          <span
            style={{ width: `${Math.round((reviewed / Math.max(1, reviewed + queue)) * 100)}%` }}
          />
          <p className={styles.meta}>
            {reviewed} of {reviewed + queue} links reviewed. Reviewing means opening the source and
            checking the passage.
          </p>
        </div>
      )}
      <section className={styles.section} aria-labelledby="written-heading">
        <h2 id="written-heading">Your articles</h2>
        {written.kind === 'loading' ? (
          <p className={styles.meta}>Loading what you wrote…</p>
        ) : written.kind === 'signed-out' ? (
          <div className={styles.empty}>
            <p>Sign in to see what you wrote here and to write more.</p>
            <Link className="bb-button bb-button--primary" href="/sign-in?next=%2Fdesk">
              Sign in
            </Link>
          </div>
        ) : written.list.length ? (
          <>
            <ul className={styles.list}>
              {written.list.map((a) => (
                <li key={a.id} className={styles.item}>
                  <Link href={'/articles/' + a.id}>{a.title}</Link>
                  <p className={styles.meta}>
                    {a.status === 'draft' ? 'Draft' : 'Published'} · updated{' '}
                    {zurichTime(a.updatedAt)}
                    {a.respondToId ? ' · a response' : ''}
                  </p>
                  <div className={styles.chips}>
                    <Link className={styles.chip} href={'/articles/' + a.id + '/edit'}>
                      Edit
                    </Link>
                    {a.status === 'published' && (
                      <Link className={styles.chip} href={'/analyze?article=' + a.id}>
                        Examine it
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.chips}>
              <Link className="bb-button bb-button--primary" href="/write">
                Write another
              </Link>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>Nothing written yet. Say something; the evidence can check it afterwards.</p>
            <Link className="bb-button bb-button--primary" href="/write">
              Write an article
            </Link>
          </div>
        )}
      </section>
      <section className={styles.section} aria-labelledby="mine-heading">
        <h2 id="mine-heading">Your investigations</h2>
        {rows === null ? (
          <p className={styles.meta}>Loading what this browser saved…</p>
        ) : mine.length ? (
          <ul className={styles.list}>
            {mine.map((r) => (
              <li key={r.id} className={styles.item}>
                <Link href={'/investigations/' + r.id}>{r.question}</Link>
                <p className={styles.meta}>
                  {r.versions} version{r.versions === 1 ? '' : 's'} · updated{' '}
                  {zurichTime(r.updatedAt)}
                </p>
                <div className={styles.chips}>
                  {r.candidate > 0 && (
                    <Link className={styles.chip} href={'/investigations/' + r.id + '#evidence'}>
                      Review {r.candidate} link{r.candidate === 1 ? '' : 's'}
                    </Link>
                  )}
                  {r.flags > 0 && (
                    <Link
                      className={`${styles.chip} ${styles.chipWarn}`}
                      href={'/investigations/' + r.id + '#gaps-heading'}
                    >
                      Fix {r.flags} flagged sentence{r.flags === 1 ? '' : 's'}
                    </Link>
                  )}
                  <Link className={styles.chip} href={'/investigations/' + r.id + '#gaps-heading'}>
                    Next suggestion →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p>
              Nothing saved in this browser yet. Tap any suggestion on an investigation and your
              copy lands here.
            </p>
            <Link className="bb-button bb-button--primary" href="/investigations/demo">
              Try the housing investigation
            </Link>
          </div>
        )}
      </section>
      <section className={styles.section} aria-labelledby="follow-heading">
        <h2 id="follow-heading">Following</h2>
        {followed.length ? (
          <ul className={styles.list}>
            {followed.map((r) => (
              <li key={r.id} className={styles.item}>
                <Link href={'/investigations/' + r.id}>{r.question}</Link>
                <p className={styles.meta}>
                  {r.versions} versions · updated {zurichTime(r.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.meta}>Follow an investigation to see its new versions here.</p>
        )}
      </section>
      <p className={styles.meta}>
        Your articles follow your account. Investigations, follows and the streak are kept in this
        browser; keeping them across devices is next.
      </p>
    </>
  );
}
