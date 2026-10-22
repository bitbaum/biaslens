import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleBody } from 'bip-kit/react';

import { SiteHeader, SiteFooter } from '@/app/_components/Chrome';
import { BRAND } from '@/lib/config/brand';
import { getPublishedPost, listPublishedPosts } from '@/lib/content/blog';

import styles from '../blog.module.css';

export function generateStaticParams() {
  return listPublishedPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) return { title: 'Article not found', robots: { index: false, follow: false } };
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date ? `${post.date}T00:00:00Z` : undefined,
      siteName: BRAND.name,
    },
  };
}

export default async function JournalPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) notFound();

  return (
    <>
      <SiteHeader current="blog" />
      <main id="main-content" className={`${styles.article} bb-frame`}>
        <Link href="/blog" className={styles.back}>
          ← All articles
        </Link>
        <article>
          <header className={styles.articleHead}>
            <p className={styles.eyebrow}>
              {post.tags.join(' / ') || 'Journal'} · {post.date} · {post.readingMinutes} min
            </p>
            <h1>{post.title}</h1>
            <p>{post.summary}</p>
            <p className={styles.meta}>
              {post.author || 'Editorial desk'} · {BRAND.name}
            </p>
          </header>
          <div className={`${styles.articleBody} journalTheme`}>
            <ArticleBody blocks={post.blocks} />
          </div>
        </article>
        <footer className={styles.articleFooter}>
          <Link href="/methodology">Read and challenge our method ↗</Link>
          <Link href="/blog">Back to the journal →</Link>
        </footer>
      </main>
      <SiteFooter />
    </>
  );
}
