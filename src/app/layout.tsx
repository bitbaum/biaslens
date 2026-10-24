import { SiteHeader } from './_components/Chrome';
import { SiteFooter } from './_components/Footer';
import type { Metadata } from 'next';

import { BRAND } from '@/lib/config/brand';
import '@bitbaum/design-tokens/tokens.css';
import './globals.css';
// Opt-in shared geometry comes after the app reset; local CSS modules own the brand.
import '@bitbaum/design-tokens/composition.css';
import '@bitbaum/sitekit/styles.css';
import 'bip-kit/styles.css';
import '@bitbaum/accountkit/styles.css';
// Package defaults load first; the product theme is the final role producer.
import './theme.css';
import './blog/journal.css';

export const metadata: Metadata = {
  ...(BRAND.siteOrigin ? { metadataBase: new URL(BRAND.siteOrigin) } : {}),
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description:
    'Explore the world through questions, source evidence, competing explanations and an open, challengeable method.',
  openGraph: {
    siteName: BRAND.name,
    title: BRAND.name,
    description: 'Explore questions. Inspect evidence. Challenge explanations.',
    type: 'website',
  },
  robots: { index: !!BRAND.siteOrigin, follow: !!BRAND.siteOrigin },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
