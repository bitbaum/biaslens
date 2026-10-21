import type { Metadata } from 'next';
import '@bitbaum/design-tokens/composition.css';
import './globals.css';

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
