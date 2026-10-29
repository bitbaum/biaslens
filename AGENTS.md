# AGENTS.md — BiasLens

<!-- fleet:rules:begin — generated from bitbaum/fleet templates/agent-rules.md; edit it there, not here -->

## Org rules

Read `bitbaum/fleet` `AGENTS.md`, `SHARED.md` and the registers it names before
inventing a host, a name, a page or a shared behaviour. Do not copy their facts
into this file.

- **Packages first.** If a `@bitbaum/*` package (or `bip-kit`, `limitkit`,
  `threadkit`, `ai-forms`) already does it, use it and fix a defect in the
  package, not in this app. Every chat is `@bitbaum/chatkit`, every search box
  `@bitbaum/searchkit`, every chart `@bitbaum/chartkit`, accounts
  `@bitbaum/accountkit`, model calls `@bitbaum/ai-kit`. Review this product's
  `package-plan.json` before building anything.
- **One shape per kind.** Things of the same kind look the same and sit in the
  same place (fleet `AGENTS.md`, "One shape per kind").
- **Finished work ships by itself.** Open a non-draft pull request; the fleet
  auto-merge sweep is the only merge path. Never merge by hand, through the
  merge API, with `--auto` or with an admin bypass, and never force-push a
  shared branch.
- **Nothing made up.** A fact on a page or in a doc needs a source that was
  opened; where there is none, the line is removed or softened.
- **Bitcoin orange is for Bitcoin and top-of-funnel actions only.**
- **No model identifier** in anything pushed to a repository.
- Before you finish, run `node <fleet>/scripts/ci/docs-truth-audit.mjs --dir .`:
  the same check the sweep runs on every pull request.

<!-- fleet:rules:end -->

## One product integration target

All truth-seeking product feature work belongs in this repository. Do not
restart the TruthSeeker migration or deploy the superseded standalone
prototype. Read `docs/consolidation.md` for source inventory and
owner-approved public branding; preserve technical repository/hosting keys.
Before editing, inspect current main and open pull requests and use your own
branch. `ROADMAP.md` and `CHANGELOG.md` here are the canonical development
records; Loki ingests them into the fleet profile.

Media bias analysis engine. `README.md` holds the vision and the current
implemented state; this file is the operational guide and product contract for
agents.

## Product contract

Do not create a second product brief, brand, identity register or
shared-package implementation here. Loki's project profile is the source for
mission, vision, problem and solution. Update `ROADMAP.md` and `CHANGELOG.md`
in the same PR as the change they describe. Build plans for agents live in
`docs/plans/`.

The article output is **unverified AI analysis**, not an external fact verdict.
Keep evidence quality, framing, attribution and causal hypotheses visibly
distinct. A claim can be challenged; a human disagreement cannot be closed
merely by generating an AI answer.

References:

- [Public Open Epistemic Method v0.1](docs/methodology/open-epistemic-method-v0.1.md)
- [Truth Seeker → BiasLens migration handoff](docs/convergence-truthseeker.md)
- `src/lib/domain/epistemic-graph.ts` for claim/evidence/causal-link audit types
- `src/lib/analysis/report.ts` (report contract), `prompts.ts` (the two model
  passes) and `src/lib/domain/techniques.ts` (the published technique catalogue)
- `src/lib/analysis/` and `src/app/api/analyze/route.ts` for the URL/paste
  workflow; `src/app/analyze/` for the browser report

The first on-demand slice was integrated in
[PR #49](https://github.com/bitbaum/biaslens/pull/49), superseding the older
integration draft #46. Do **not** redo that migration, and keep historical
Truth Seeker code intact until production parity and rollback checks succeed.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Drizzle ORM / PostgreSQL — `src/lib/db/schema.ts` is the SSOT for domain types
- Vitest for tests
- Node >= 20

## Commands

```bash
pnpm install
cp .env.example .env        # set DATABASE_URL
pnpm run db:generate         # drizzle-kit generate — new migration from schema changes
pnpm run db:migrate          # drizzle-kit migrate (needs a live Postgres)
pnpm run dev                 # local dev server
pnpm run build               # next build (production compile; no live DB needed)
pnpm run verify              # SSOT gate: format:check + lint + typecheck + test
```

## Verify (definition of done)

`pnpm run verify` runs `format:check && lint && typecheck && test` — the single source of truth for
"green". CI calls it verbatim; run it locally before declaring any change done.
`next build` also runs in CI after verify to catch build-only breakage.

Drizzle has no codegen: types derive from `src/lib/db/schema.ts` at typecheck
time, so `pnpm install` is the only prerequisite for `typecheck`/`build`.
`pnpm run db:generate` is only needed after changing the schema (it writes a new
SQL migration into `drizzle/`).

## Layout

```
src/lib/db/schema.ts   SSOT for domain types (Outlet, Article, Claim, Evidence, Narrative, ...)
drizzle/               SQL migrations generated by drizzle-kit
src/app/               App Router pages + API route handlers
src/lib/domain/        pure scoring logic (explainable, reproducible) + tests
src/lib/db/client.ts   the single Drizzle client (SSOT for DB access)
src/lib/api/           HTTP result shape
src/lib/config/        verification config
```

## Principles

Separate facts (`Claim`/`Evidence`) from framing (`Narrative`/`Frame`). Scores are
functions of stored evidence — never hard-coded — so they recompute and stay
auditable. Every score documents its input, algorithm, evidence, confidence, and
failure modes.


## Shared building blocks before implementation

Read the current Fleet [SHARED.md](https://github.com/bitbaum/fleet/blob/main/SHARED.md)
and inspect `package-plan.json` before designing or implementing a feature.
Identify and wire the applicable packages without waiting for the owner to name
them. Extend a shared package when the missing behavior belongs across products;
record a specific incompatibility before implementing a local replacement.

The root layout owns the one shared site shell, so every page inherits header,
footer, navigation and account access. Use sitekit's public entry blocks,
accountkit's runtime/screens/menu, bip-kit's publishing/development renderers,
and the complete design-tokens theme. Product-specific investigation logic and
editorial content stay here. `package-plan.json` maps actual bindings; it is not
a copy of the package registry or a second roadmap.

Shared package composition CI checks adoption, declared product surfaces and
the update path. Dependency updates pass tests and browser checks, merge under
the fleet policy, then deploy
through the existing host. A dependency listed but unused is not adoption.

## Design acceptance

Read `docs/design-contract.md` before interface work. All screens use its theme,
type and spacing roles. Validate input, loading, error and result states and both
account states at phone/tablet/desktop sizes before merging. Public design gates
are part of verify and browser:smoke, not optional screenshot polish.
