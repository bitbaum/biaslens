# AGENTS.md — BiasLens

Media bias analysis engine. See `CLAUDE.md` for the product contract and
`README.md` for the vision; this file is the short operational guide for agents.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Prisma / PostgreSQL — `prisma/schema.prisma` is the SSOT for domain types
- Vitest for tests
- Node >= 20

## Commands

```bash
npm install
cp .env.example .env        # set DATABASE_URL
npm run db:generate         # prisma generate — run before typecheck/build
npm run db:migrate          # prisma migrate dev (needs a live Postgres)
npm run dev                 # local dev server
npm run build               # next build (production compile; no live DB needed)
npm run verify              # SSOT gate: lint + typecheck + test
```

## Verify (definition of done)

`npm run verify` runs `lint && typecheck && test` — the single source of truth for
"green". CI calls it verbatim; run it locally before declaring any change done.
`next build` also runs in CI after verify to catch build-only breakage.

Prisma has no `postinstall`, so run `npm run db:generate` (or `npx prisma
generate`) before `typecheck`/`build` — the generated client provides the types.

## Layout

```
prisma/schema.prisma   SSOT for domain types (Outlet, Article, Claim, Evidence, Narrative, ...)
src/app/               App Router pages + API route handlers
src/lib/domain/        pure scoring logic (explainable, reproducible) + tests
src/lib/db/prisma.ts   the single PrismaClient (SSOT for DB access)
src/lib/api/           HTTP result shape
src/lib/config/        verification config
```

## Principles (from CLAUDE.md)

Separate facts (`Claim`/`Evidence`) from framing (`Narrative`/`Frame`). Scores are
functions of stored evidence — never hard-coded — so they recompute and stay
auditable. Every score documents its input, algorithm, evidence, confidence, and
failure modes.
