import Link from 'next/link';
import { SiteFooter as SharedFooter } from '@bitbaum/sitekit/react';
import { BRAND } from '@/lib/config/brand';
import { ROUTES, PROJECT_LINKS } from '@/lib/config/routes';
const chrome = {
  name: BRAND.name,
  tagline: 'A clearer view.',
  footerNote: 'Tools for examining sources, testing explanations and understanding the world.',
};
export function SiteFooter() {
  return (
    <SharedFooter
      appearance="application"
      chrome={chrome}
      Link={Link}
      groups={[
        {
          label: 'Tools',
          links: [
            { href: ROUTES.workspace, label: 'Workspace' },
            { href: ROUTES.analyze, label: 'Examine text' },
            { href: ROUTES.explore, label: 'Research notebook' },
            { href: ROUTES.arena, label: 'Conversations' },
          ],
        },
        {
          label: 'Resources',
          links: [
            { href: ROUTES.methodology, label: 'Our method' },
            { href: ROUTES.whitepaper, label: 'White paper' },
            { href: ROUTES.blog, label: 'Journal' },
            { href: ROUTES.development, label: 'Development' },
          ],
        },
      ]}
      extra={
        <>
          <span>Beta research software</span>
          <a href={PROJECT_LINKS.repository}>Source code</a>
        </>
      }
    />
  );
}
