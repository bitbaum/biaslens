import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/config/brand';
import { PROJECT_LINKS, ROUTES } from '@/lib/config/routes';

import styles from './Chrome.module.css';

type Section = keyof typeof ROUTES;

const NAVIGATION = [
  ['explore', 'Explore'],
  ['analyze', 'Examine'],
  ['arena', 'Arena'],
  ['whitepaper', 'White paper'],
  ['development', 'Build in public'],
  ['methodology', 'Method'],
] as const;

export function SiteHeader({ current }: { current: Section }) {
  return (
    <>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`${styles.frame} bb-frame`}>
          <Link aria-label={`${BRAND.name} home`} className={styles.wordmark} href={ROUTES.home}>
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
            {NAVIGATION.map(([section, label]) => (
              <Link
                key={section}
                href={ROUTES[section]}
                aria-current={current === section ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <a
            className={styles.repository}
            href={PROJECT_LINKS.repository}
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
          <Link href={ROUTES.explore}>Explore a question</Link>
          <Link href={ROUTES.analyze}>Examine an article</Link>
          <Link href={ROUTES.methodology}>Methodology</Link>
          <Link href={ROUTES.whitepaper}>White paper</Link>
          <Link href={ROUTES.development}>Build in public</Link>
          <Link href={ROUTES.blog}>Journal</Link>
          <Link href={ROUTES.arena}>Debate Arena</Link>
          <a href={PROJECT_LINKS.repository}>GitHub ↗</a>
        </nav>
      </div>
    </footer>
  );
}
