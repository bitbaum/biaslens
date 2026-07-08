# BiasLens — agent brief

You are building BiasLens, a media bias analysis engine. This file is the
contract every change follows. It mirrors the FleetCrown project brief.

## Product philosophy — non-negotiable

- **Never tell the user what to think.** Show evidence before conclusions.
- **Separate facts from interpretation**, and **bias from factual accuracy**.
- **Measure uncertainty** — every score carries a confidence and its inputs.
- **Every score is explainable, reproducible, and challengeable.** Competing
  interpretations coexist.

## Conventions

- Next.js (App Router) + TypeScript strict + Prisma/Postgres.
- `prisma/schema.prisma` is the SSOT for domain types — derive TS types from it,
  never redefine them.
- Facts live in `Claim`/`Evidence`; framing lives in `Narrative`/`Frame`. Do not
  collapse the two.
- Scores are functions of stored evidence — never hard-coded — so they recompute
  and stay auditable.

## Definition of done

A change is done only when: every new score documents input, algorithm, evidence,
confidence, and failure modes; conclusions are reproducible; `tsc` + lint + tests
pass. (FleetCrown's DoD gate judges against this.)

## Roadmap (current milestone first)

1. **Core data model** — seeded in `prisma/schema.prisma` (Outlet, Article, Claim,
   Evidence, Narrative, EditorialDna, HomepageSnapshot). Acceptance: `prisma
   migrate dev` runs clean and the client generates.
2. Extraction + Claim agents: parse an article into structured claims with sources.
3. Bias + Evidence scoring engine — explainable scores.
4. Hourly Homepage Loop: crawl + compare outlets.
5. Counterfactual headline generator + Missing Perspectives.
6. Public dashboard + OrangeCat transparency page.
