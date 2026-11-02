'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SiteMasthead, SiteTabBar } from '@bitbaum/sitekit/react';
import { BRAND } from '@/lib/config/brand';
import { ROUTES } from '@/lib/config/routes';
import { AccountControl } from './AccountControl';
import styles from './Chrome.module.css';

const chrome = {
  name: BRAND.name,
  tagline: 'Evidence before conclusions',
  footerNote:
    'Explore questions, inspect evidence and challenge explanations. An open, revisable method.',
};
/** One list drives the desktop masthead and the mobile tab bar. */
const navigation = [
  { path: '', label: 'Today', icon: '◎' },
  { path: 'investigations', label: 'Investigate', icon: '⇄' },
  { path: 'analyze', label: 'Examine', icon: '⌕' },
  { path: 'workspace', label: 'Rewrite', icon: '✎' },
  { path: 'desk', label: 'My desk', icon: '★' },
] as const;

/** Product configuration only; sitekit owns all shared shell markup and behavior. */
export function SiteHeader({ current }: { current?: keyof typeof ROUTES }) {
  const pathname = usePathname() || '/';
  const currentPath = (current ? ROUTES[current] : pathname).replace(/^\//, '');
  return (
    <>
      <SiteMasthead
        appearance="application"
        chrome={chrome}
        navItems={navigation.map(({ path, label }) => ({ path, label }))}
        currentPath={currentPath}
        mainId="main-content"
        Link={Link}
        brand={
          <>
            {BRAND.logoPath ? (
              <Image src={BRAND.logoPath} width={38} height={38} alt="" unoptimized />
            ) : (
              <span className={styles.mark} aria-hidden="true">
                {BRAND.mark}
              </span>
            )}
            <span>{BRAND.name}</span>
            <span className={styles.beta}>Beta</span>
          </>
        }
        actions={<AccountControl />}
      />
      <SiteTabBar items={[...navigation]} currentPath={currentPath} Link={Link} />
    </>
  );
}
