# BiasLens

Media bias analysis engine. Shows evidence before conclusions, separates fact
from framing, measures uncertainty, and surfaces missing perspectives — every
score explainable, reproducible, and challengeable. The "Bloomberg Terminal for
media analysis."

Bootstrapped by FleetCrown from the BiasLens Product & Engineering Specification.

## Vision

Grow from media into a general-purpose reasoning and narrative-analysis engine —
scientific papers, speeches, parliamentary debates, podcasts, video, books,
campaigns, referendum info, AI-generated content — the foundation of the
Argument Arena vision.

## Product philosophy (guides every decision)

- Never tell the user what to think.
- Show evidence before conclusions.
- Measure uncertainty.
- Separate facts from interpretation, and bias from factual accuracy.
- Every score must be explainable; every conclusion reproducible; every article
  challengeable; competing interpretations coexist.

## Stack

Next.js + TypeScript + Drizzle/Postgres. Multi-agent pipeline for
crawl/extract/score. FleetCrown for orchestration + loops; OrangeCat for funding
+ public transparency.

## Architecture (target)

11 specialized agents — Crawler, Extraction, Claim, Narrative, Bias, Evidence,
Comparison, Visualization, Research, Review, Publishing. Core entities: Outlet,
Article, Claim, Evidence, Narrative, Frame, Homepage Snapshot, Editorial DNA.
Two loops: hourly Homepage Loop (crawl → extract → analyze → compare → publish)
and on-demand Article Loop (extract → analyze → report → feedback).

## Roadmap

1. ~~**Define the core data model** — Outlet, Article, Claim, Evidence, Narrative,
   Editorial DNA as schema definitions (now `src/lib/db/schema.ts`, Drizzle ORM —
   migrated from the original Prisma scaffold with byte-identical tables).~~
   **✅ DONE** (`0d46066`) — App Router root + initial migration applied;
   build, lint, and `tsc` all green.
2. Build the Extraction + Claim agents to parse an article into structured claims.
3. Bias + Evidence scoring engine — every score explainable.
4. Hourly Homepage Loop crawling + comparing outlets.
5. Counterfactual headline generator + Missing Perspectives.
6. Public dashboard + OrangeCat transparency page.

## Getting started

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npm run db:migrate     # drizzle-kit migrate — applies drizzle/*.sql
npm run dev
```

## Definition of done

Every score documents its input, algorithm, evidence, confidence, and failure
modes; every conclusion is reproducible and every article challengeable.
`tsc` + lint + tests pass, and the OrangeCat transparency/funding page is updated
on each release.
