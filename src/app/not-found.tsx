import { HeroSection } from '@bitbaum/sitekit/react';
export default function NotFound() {
  return (
    <main id="main-content" className="bb-frame">
      <HeroSection
        appearance="application"
        section={{
          kind: 'hero',
          eyebrow: 'Page not found',
          statement: 'Let’s find another way in.',
          lead: [
            'That page is unavailable. Start an examination or return to the research workspace.',
          ],
          actions: [
            { href: '/analyze', label: 'Examine an article →' },
            { href: '/explore', label: 'Open the notebook ↗' },
          ],
        }}
      />
    </main>
  );
}
