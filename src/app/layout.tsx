import type { Metadata } from 'next';
import './globals.css';
// Opt-in shared geometry comes after the app reset; local CSS modules own the brand.
import '@bitbaum/design-tokens/composition.css';

export const metadata: Metadata = {
  title: 'BiasLens',
  description:
    'Media bias analysis engine — evidence before conclusions, facts separated from framing.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
