import { EvidenceVerifier } from "./EvidenceVerifier";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        maxWidth: "42rem",
        marginInline: "auto",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h1 style={{ color: "var(--color-brand)", fontSize: "2rem" }}>BiasLens</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Media bias analysis engine. Evidence before conclusions; facts separated
          from framing; every score explainable and reproducible.
        </p>
      </header>
      <EvidenceVerifier />
    </main>
  );
}
