import { getSession } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { listArticlesByAuthor } from '@/lib/writing/store';

import { AccountTabs } from '../_components/AccountTabs';
import { MyDesk, type WrittenState } from './MyDesk';
import styles from './desk.module.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My desk',
  description: 'Your investigations, review queue and follows.',
};

/**
 * What you wrote is read here, on the server, with the session the request
 * carries: the page arrives with the answer (signed out, nothing yet, or the
 * list) instead of waiting on a browser request that may never finish.
 */
async function loadWritten(): Promise<WrittenState> {
  const session = await getSession();
  if (!session) return { kind: 'signed-out' };
  if (!process.env.DATABASE_URL) return { kind: 'unavailable' };
  try {
    const list = await listArticlesByAuthor(db, session.user.id);
    return {
      kind: 'ok',
      list: list.map((a) => ({
        id: a.id,
        authorId: a.authorId,
        authorName: a.authorName,
        title: a.title,
        excerpt: a.excerpt,
        status: a.status,
        respondToId: a.respondToId,
        sourceUrl: a.sourceUrl,
        sourceTitle: a.sourceTitle,
        reportId: a.reportId,
        updatedAt: a.updatedAt.toISOString(),
        publishedAt: a.publishedAt?.toISOString() ?? null,
      })),
    };
  } catch (error) {
    console.error('BiasLens desk articles failed', error instanceof Error ? error.name : '');
    return { kind: 'unavailable' };
  }
}

export default async function DeskPage() {
  const written = await loadWritten();
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>Your BiasLens</p>
      <h1>My desk</h1>
      <AccountTabs current="/desk" />
      <MyDesk written={written} />
    </main>
  );
}
