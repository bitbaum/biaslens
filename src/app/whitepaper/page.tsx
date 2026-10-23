import Link from 'next/link';
import { ArticleBody } from 'bip-kit/react';

import { SiteFooter, SiteHeader } from '@/app/_components/Chrome';
import { PROJECT_LINKS, ROUTES } from '@/lib/config/routes';
import { getWhitepaper } from '@/lib/content/whitepaper';

import styles from '../blog/blog.module.css';

export const metadata = {
  title: 'Technical white paper',
  description:
    'The evidence model, review protocol, evaluation requirements and limits of open investigation.',
};

export default function WhitepaperPage() {
  const paper = getWhitepaper();
  if (!paper) throw new Error('The reviewed technical white paper is missing.');
  return (
    <>
      <SiteHeader current="whitepaper" />
      <main id="main-content" className={`${styles.article} bb-frame`}>
        <Link className={styles.back} href={ROUTES.methodology}>
          ← Explore the method
        </Link>
        <article>
          <header className={styles.articleHead}>
            <p className={styles.eyebrow}>
              Technical white paper / Working draft 0.1 / {paper.date}
            </p>
            <h1>{paper.title}</h1>
            <p>{paper.summary}</p>
            <a
              className={styles.back}
              href={`${PROJECT_LINKS.repository}/blob/main/content/research/2026-10-22-open-investigation.md`}
            >
              Inspect the versioned source ↗
            </a>
          </header>
          <div className={`${styles.articleBody} journalTheme`}>
            <ArticleBody blocks={paper.blocks} />
          </div>
        </article>
        <footer className={styles.articleFooter}>
          <a href={PROJECT_LINKS.challenge}>Challenge this specification ↗</a>
          <Link href={ROUTES.development}>Follow the development →</Link>
        </footer>
      </main>
      <SiteFooter />
    </>
  );
}
