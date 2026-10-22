import type { Metadata } from 'next';

import { BRAND } from '@/lib/config/brand';
import './globals.css';
// Opt-in shared geometry comes after the app reset; local CSS modules own the brand.
import '@bitbaum/design-tokens/composition.css';

export const metadata: Metadata = {
  ...(BRAND.siteOrigin ? { metadataBase: new URL(BRAND.siteOrigin) } : {}),
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description:
    'Examine claims, evidence, historical narratives and media framing with an open, challengeable method.',
  openGraph: {
    siteName: BRAND.name,
    title: BRAND.name,
    description: 'An open, challengeable method for investigating claims and media framing.',
    type: 'website',
  },
  robots: { index: !!BRAND.siteOrigin, follow: !!BRAND.siteOrigin },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
