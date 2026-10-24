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
        { href: ROUTES.analyze, label: 'Examine an article' },
        { href: ROUTES.explore, label: 'Explore a question' },
        { href: ROUTES.methodology, label: 'Methodology' },
        { href: ROUTES.whitepaper, label: 'White paper' },
        { href: ROUTES.roadmap, label: 'Roadmap' },
        { href: ROUTES.changelog, label: 'Changelog' },
        { href: ROUTES.blog, label: 'Journal' },
        { href: ROUTES.account, label: 'Your account' },
      ]}
      extra={<a href={PROJECT_LINKS.repository}>Source code ↗</a>}
    />
  );
}
