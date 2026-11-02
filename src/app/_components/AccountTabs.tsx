import Link from 'next/link';

import styles from './AccountTabs.module.css';

const TABS = [
  { href: '/desk', label: 'My desk' },
  { href: '/settings', label: 'Settings' },
  { href: '/account', label: 'Profile & security' },
] as const;

/** One place for everything that is yours: desk, settings, account. */
export function AccountTabs({ current }: { current: (typeof TABS)[number]['href'] }) {
  return (
    <nav className={styles.tabs} aria-label="Your BiasLens">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.href === current ? 'page' : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
