import type { Metadata } from 'next';
import Link from 'next/link';

import { db } from '@/lib/db/client';
import { zurichTime } from '@/lib/format-time';
import { listPublishedArticles } from '@/lib/writing/store';

import styles from './articles.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Articles',
  description:
    'Articles readers wrote here — from scratch, about a headline, or in answer to each other.',
};

export default async function ArticlesIndex() {
  const articles = process.env.DATABASE_URL ? await listPublishedArticles(db) : [];
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>Written here</p>
      <h1>Articles</h1>
      <p className={styles.dek}>
        What readers wrote: their own pieces, answers to the news and answers to each other. Every
        one can be examined, answered and shared.
      </p>
      <div className={styles.actions}>
        <Link className="bb-button bb-button--primary" href="/write">
          Write an article
        </Link>
      </div>
      {articles.length === 0 ? (
        <div className={styles.empty}>
          <p>Nothing written yet. The first article here could be yours.</p>
          <Link className="bb-button bb-button--secondary" href="/write">
            Write the first one
          </Link>
        </div>
      ) : (
        <ul className={`${styles.list} bb-list`}>
          {articles.map((a) => (
            <li key={a.id} className={styles.item}>
              <p className={styles.kicker}>
                {a.respondToId ? 'Response' : a.sourceTitle ? 'About a headline' : 'Article'}
              </p>
              <h2>
                <Link href={`/articles/${a.id}`}>{a.title}</Link>
              </h2>
              {a.excerpt && <p className={styles.excerpt}>{a.excerpt}</p>}
              <p className={styles.meta}>
                {a.authorName}
                {a.publishedAt ? ` · ${zurichTime(a.publishedAt.toISOString())}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
