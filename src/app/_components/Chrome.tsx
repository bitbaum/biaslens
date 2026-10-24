'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SiteMasthead } from '@bitbaum/sitekit/react';
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
const navigation = [
  { path: 'analyze', label: 'Examine' },
  { path: 'explore', label: 'Explore' },
  { path: 'debates', label: 'Debate Arena' },
  { path: 'whitepaper', label: 'White paper' },
  { path: 'development', label: 'Build in public' },
] as const;

/** Product configuration only; sitekit owns all shared shell markup and behavior. */
export function SiteHeader({ current }: { current?: keyof typeof ROUTES }) {
  const pathname = usePathname() || '/';
  return (
    <SiteMasthead
      appearance="application"
      chrome={chrome}
      navItems={[...navigation]}
      currentPath={(current ? ROUTES[current] : pathname).replace(/^\//, '')}
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
  );
}
