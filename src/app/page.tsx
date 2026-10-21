import Link from 'next/link';

import { EvidenceVerifier } from './EvidenceVerifier';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: '42rem',
        marginInline: 'auto',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h1 style={{ color: 'var(--color-brand)', fontSize: '2rem' }}>BiasLens</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Media bias analysis engine. Evidence before conclusions; facts separated from framing;
          every score explainable and reproducible.
        </p>
      </header>
      <Link
        href="/analyze"
        style={{
          alignSelf: 'flex-start',
          padding: '0.9rem 1.2rem',
          borderRadius: '8px',
          background: 'var(--color-action)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 700,
        }}
      >
        Examine an article →
      </Link>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
        Paste an article URL or its text for a provisional, first-principles analysis.
      </p>
      <Link href="/methodology" style={{ color: 'var(--color-brand)', fontSize: '0.9rem' }}>
        Read and challenge the open methodology ↗
      </Link>
      <EvidenceVerifier />
    </main>
  );
}
