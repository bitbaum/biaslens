'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SiteMasthead, SiteTabBar, SiteIcon, type SiteNavGroup } from '@bitbaum/sitekit/react';
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
/** Frequent task shortcuts for the phone tab bar and flat-menu fallback. */
const navigation = [
  { path: ROUTES.home.slice(1), label: 'Today', icon: <SiteIcon name="home" /> },
  { path: ROUTES.write.slice(1), label: 'Write', icon: <SiteIcon name="write" /> },
  { path: ROUTES.analyze.slice(1), label: 'Examine', icon: <SiteIcon name="search" /> },
  { path: ROUTES.investigations.slice(1), label: 'Investigate', icon: <SiteIcon name="compass" /> },
  { path: ROUTES.desk.slice(1), label: 'My desk', icon: <SiteIcon name="star" /> },
] as const;

/** Destination descriptions describe the screens that exist today. */
const navigationGroups: SiteNavGroup[] = [
  {
    label: 'Read',
    items: [
      {
        path: ROUTES.home.slice(1),
        label: 'Today',
        description: 'Headlines from the public news wire.',
      },
      {
        path: ROUTES.articles.slice(1),
        label: 'Articles',
        description: 'Read articles and responses published here.',
      },
    ],
  },
  {
    label: 'Work with an article',
    items: [
      {
        path: ROUTES.write.slice(1),
        label: 'Write',
        description: 'Draft an article or respond to a source.',
      },
      {
        path: ROUTES.analyze.slice(1),
        label: 'Examine text',
        description: 'Paste a link or text to inspect its reasoning.',
      },
      {
        path: ROUTES.investigations.slice(1),
        label: 'Investigations',
        description: 'Compare claims with cited findings and versioned drafts.',
      },
      {
        path: ROUTES.explore.slice(1),
        label: 'Research notebook',
        description: 'Keep a question and sources in this browser.',
      },
    ],
  },
  {
    label: 'Your work and the method',
    items: [
      {
        path: ROUTES.desk.slice(1),
        label: 'My desk',
        description: 'Return to your articles and this device’s investigation links.',
      },
      {
        path: ROUTES.methodology.slice(1),
        label: 'Our method',
        description: 'Read how evidence and open challenges are handled.',
      },
    ],
  },
];

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
        navGroups={navigationGroups}
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
