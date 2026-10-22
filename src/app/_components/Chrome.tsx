import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/config/brand';

import styles from './Chrome.module.css';

type Section = 'home' | 'analyze' | 'methodology' | 'blog';

export function SiteHeader({ current }: { current: Section }) {
  return (
    <>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`${styles.frame} bb-frame`}>
          <Link aria-label={`${BRAND.name} home`} className={styles.wordmark} href="/">
            {BRAND.logoPath ? (
              <Image
                className={styles.markImage}
                src={BRAND.logoPath}
                width={44}
                height={44}
                alt=""
                unoptimized
              />
            ) : (
              <span className={styles.mark} aria-hidden="true">
                {BRAND.mark}
              </span>
            )}
            <span>{BRAND.name}</span>
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" aria-current={current === 'home' ? 'page' : undefined}>
              Overview
            </Link>
            <Link href="/analyze" aria-current={current === 'analyze' ? 'page' : undefined}>
              Examine
            </Link>
            <Link href="/blog" aria-current={current === 'blog' ? 'page' : undefined}>
              Journal
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
          <strong>{BRAND.name}</strong>
          <p>Evidence before conclusions. An open, revisable methodology.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/analyze">Examine an article</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/blog">Journal</Link>
          <a href="https://github.com/bitbaum/biaslens">GitHub ↗</a>
        </nav>
      </div>
    </footer>
  );
}
