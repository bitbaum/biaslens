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
          background: 'var(--color-action)',
          borderRadius: '8px',
          color: 'white',
          display: 'inline-block',
          fontWeight: 700,
          padding: '0.95rem 1.4rem',
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        Examine an article →
      </Link>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Analyse a published article or pasted text. View its claims, possible framing and unresolved
        questions. Results are AI-generated and not independently verified.
      </p>
      <section aria-label="Evidence counting demonstration" style={{ marginTop: '2rem' }}>
        <EvidenceVerifier />
      </section>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
        <Link href="/methodology" style={{ color: 'var(--color-brand)' }}>
          Explore the open truth-seeking method and challenge its rules →
        </Link>
      </p>
    </main>
  );
}
