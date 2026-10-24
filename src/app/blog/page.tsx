import Link from 'next/link';

import { BRAND } from '@/lib/config/brand';
import { listPublishedPosts } from '@/lib/content/blog';

import styles from './blog.module.css';

export const metadata = {
  title: 'Journal',
  description:
    'Notes on journalism, evidence, public reasoning, debates and methodological corrections.',
};

export default function JournalPage() {
  const posts = listPublishedPosts();

  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{BRAND.name} / Journal</p>
          <h1>Arguments deserve better questions.</h1>
          <p className={styles.lead}>
            Essays, investigations and research notes. We will challenge public claims, including
            our own, while distinguishing documented findings from hypotheses and opinion.
          </p>
        </header>
        {posts.length === 0 ? (
          <p>No articles have been published yet.</p>
        ) : (
          <ol className={styles.list}>
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`}>
                  <span className={styles.meta}>
                    {post.date} · {post.readingMinutes} min · {post.tags.join(' / ')}
                  </span>
                  <h2>{post.title}</h2>
                  <p>{post.summary}</p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
