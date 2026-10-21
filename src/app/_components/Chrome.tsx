import Link from 'next/link';

import styles from './Chrome.module.css';

type Section = 'home' | 'analyze' | 'methodology';

export function SiteHeader({ current }: { current: Section }) {
  return (
    <>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`${styles.frame} bb-frame`}>
          <Link aria-label="BiasLens home" className={styles.wordmark} href="/">
            <span className={styles.mark} aria-hidden="true">
              B<span className={styles.markDivider}>/</span>L
            </span>
            <span>BiasLens</span>
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" aria-current={current === 'home' ? 'page' : undefined}>
              Overview
            </Link>
            <Link href="/analyze" aria-current={current === 'analyze' ? 'page' : undefined}>
              Examine
            </Link>
            <Link href="/methodology" aria-current={current === 'methodology' ? 'page' : undefined}>
              Method
            </Link>
          </nav>
          <a
            className={styles.repository}
            href="https://github.com/bitbaum/biaslens"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source code <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.footerFrame} bb-frame`}>
        <div>
          <strong>BiasLens</strong>
          <p>Evidence before conclusions. An open, revisable methodology.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/analyze">Examine an article</Link>
          <Link href="/methodology">Methodology</Link>
          <a href="https://github.com/bitbaum/biaslens">GitHub ↗</a>
        </nav>
      </div>
    </footer>
  );
}
