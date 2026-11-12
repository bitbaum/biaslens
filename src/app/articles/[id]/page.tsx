import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleBody, ReadingProgress } from '@bitbaum/bip-kit/react';
import { parseContentBlocks } from '@bitbaum/bip-kit';

import { getSession } from '@/lib/auth';
import { BRAND } from '@/lib/config/brand';
import { zurichTime } from '@/lib/format-time';
import { PUBLIC_ID } from '@/lib/reports/store';
import { readingMinutes } from '@/lib/writing/input';
import { listComments } from '@/lib/writing/comments';
import { db } from '@/lib/db/client';
import { loadResponses, loadWrittenArticle } from '@/lib/writing/load';

import { ArticleActions } from './ArticleActions';
import { Comments } from './Comments';
import styles from './article.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = PUBLIC_ID.test(id) ? await loadWrittenArticle(id) : null;
  if (!article) return { title: 'Article not found', robots: { index: false } };
  const published = article.status === 'published';
  return {
    title: article.title,
    description: article.excerpt,
    robots: { index: published && !!BRAND.siteOrigin },
    alternates: BRAND.siteOrigin ? { canonical: `${BRAND.siteOrigin}/articles/${id}` } : undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.authorName],
      siteName: BRAND.name,
    },
    twitter: { card: 'summary', title: article.title, description: article.excerpt },
  };
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export default async function WrittenArticlePage({ params }: Props) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id)) notFound();
  const [article, responses, session] = await Promise.all([
    loadWrittenArticle(id),
    loadResponses(id),
    getSession(),
  ]);
  if (!article) notFound();
  const [parent, comments] = await Promise.all([
    article.respondToId ? loadWrittenArticle(article.respondToId) : null,
    article.status === 'published' && process.env.DATABASE_URL ? listComments(db, article.id) : [],
  ]);
  const blocks = parseContentBlocks(article.body);
  const owner = session?.user.id === article.authorId;
  const url = BRAND.siteOrigin ? `${BRAND.siteOrigin}/articles/${article.id}` : null;

  return (
    <>
      <ReadingProgress />
      <main id="main-content" className={`bb-frame ${styles.page}`}>
        <Link href="/articles" className={styles.back}>
          ← All articles
        </Link>
        <article>
          <header className={styles.head}>
            <p className={styles.kicker}>
              {article.status === 'draft'
                ? 'Draft · only you can see this'
                : parent
                  ? 'Response'
                  : article.sourceTitle
                    ? 'About a headline'
                    : 'Article'}
            </p>
            <h1>{article.title}</h1>
            <p className={styles.byline}>
              <strong>{article.authorName}</strong>
              {article.publishedAt ? ` · ${zurichTime(article.publishedAt.toISOString())}` : ''}
              {` · ${readingMinutes(article.body)} min read`}
              {article.updatedAt.getTime() - (article.publishedAt?.getTime() ?? 0) > 60_000
                ? ` · edited ${zurichTime(article.updatedAt.toISOString())}`
                : ''}
            </p>
            {parent && (
              <p className={styles.context}>
                In response to <Link href={`/articles/${parent.id}`}>{parent.title}</Link> by{' '}
                {parent.authorName}
              </p>
            )}
            {article.sourceUrl && (
              <p className={styles.context}>
                About:{' '}
                <a href={article.sourceUrl} rel="noreferrer">
                  {article.sourceTitle ?? article.sourceUrl}
                </a>{' '}
                <span className={styles.meta}>({hostOf(article.sourceUrl)})</span>
              </p>
            )}
          </header>
          <ArticleActions
            id={article.id}
            title={article.title}
            url={url}
            owner={owner}
            published={article.status === 'published'}
            reportId={article.reportId}
          />
          <div className={`${styles.body} journalTheme`}>
            <ArticleBody blocks={blocks} />
          </div>
        </article>

        <section className={styles.responses} aria-labelledby="responses-heading">
          <h2 id="responses-heading">
            {responses.length === 0
              ? 'No responses yet'
              : `${responses.length} ${responses.length === 1 ? 'response' : 'responses'}`}
          </h2>
          {responses.length > 0 && (
            <ul className="bb-list">
              {responses.map((r) => (
                <li key={r.id} className={styles.response}>
                  <h3>
                    <Link href={`/articles/${r.id}`}>{r.title}</Link>
                  </h3>
                  {r.excerpt && <p>{r.excerpt}</p>}
                  <p className={styles.meta}>
                    {r.authorName}
                    {r.publishedAt ? ` · ${zurichTime(r.publishedAt.toISOString())}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {article.status === 'published' && (
            <div className={styles.actions}>
              <Link
                className="bb-button bb-button--primary"
                href={`/write?respondTo=${article.id}`}
              >
                Write a response
              </Link>
            </div>
          )}
        </section>
        {article.status === 'published' && (
          <Comments
            articleId={article.id}
            articleAuthorId={article.authorId}
            viewer={session ? { id: session.user.id, name: session.user.name } : null}
            initial={comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
          />
        )}
      </main>
    </>
  );
}
