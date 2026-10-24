import Link from 'next/link';
import { SiteFooter as SharedFooter } from '@bitbaum/sitekit/react';
import { BRAND } from '@/lib/config/brand';
import { ROUTES, PROJECT_LINKS } from '@/lib/config/routes';
const chrome = {
  name: BRAND.name,
  tagline: 'Evidence before conclusions',
  footerNote:
    'Explore questions, inspect evidence and challenge explanations. An open, revisable method.',
};
export function SiteFooter() {
  return (
    <SharedFooter
      appearance="application"
      chrome={chrome}
      Link={Link}
      links={[
        { href: ROUTES.workspace, label: 'Workspace' },
        { href: ROUTES.analyze, label: 'Examine a source' },
        { href: ROUTES.explore, label: 'Investigate a question' },
        { href: ROUTES.arena, label: 'Analyse a conversation' },
        { href: ROUTES.methodology, label: 'Methodology' },
        { href: ROUTES.whitepaper, label: 'White paper' },
        { href: ROUTES.roadmap, label: 'Roadmap' },
        { href: ROUTES.changelog, label: 'Changelog' },
        { href: ROUTES.blog, label: 'Journal' },
        { href: ROUTES.account, label: 'Profile & security' },
        { href: ROUTES.development, label: 'Build in public' },
      ]}
      extra={<a href={PROJECT_LINKS.repository}>Source code →</a>}
    />
  );
}
