# Handoff — BiasLens investigations and rewrite desk

Last refreshed with the PR that touched it. Read this first, then `AGENTS.md`.

## Current state

- Live: https://biaslens.orangecat.ch — demo investigation at
  https://biaslens.orangecat.ch/investigations/demo; a saved test investigation
  with five model-written versions at
  https://biaslens.orangecat.ch/investigations/3iqMy8Z5ro.
- Investigations: claims → study findings (stance, design tier, horizon,
  perspective tag), `compareClaims` (no score), gap suggestions
  (`src/lib/domain/gaps.ts`), one-tap rewrites (`src/lib/investigations/revise.ts`,
  prompt `revise@1.x`) saved as `DraftVersion`s with [E#] citations, a sentence
  diff and a second-pass citation check (`flags`). Flags become "Fix this
  sentence" suggestions.
- UI (`src/app/investigations/`): GapDesk, VersionHistory, ReadingMode,
  EvidenceCards (mark reviewed / dispute, edit token only), EpistemicMap (SVG,
  animated, reduced-motion aware), MethodTimeline, EvidenceCharts (chartkit),
  InvestigationImages + PhotoSearch (Wikimedia Commons, open licences only),
  SuggestSources (OpenAlex/Crossref leads), InvestigationEditor.
- Rewrite studio (`src/lib/rewrite/`): neutral and labelled simulations
  (Economist / FT / Reason voices among presets), fact diff, "what the original
  omitted", optional evidence from an investigation.

- Home is "Today" (`src/app/page.tsx`, `src/lib/investigations/featured.ts`): featured ids only (`FEATURED_IDS`), never every saved link. Visit streak, follows and edit links live in `src/lib/client/local.ts` (device only).

## Architecture and packages

Next.js App Router, TypeScript strict, Drizzle/Postgres (PGlite in tests),
Vitest. Packages: `@bitbaum/ai-kit` (model calls via `freeChain('BIASLENS')`;
images via `@bitbaum/ai-kit/images` once released), `@bitbaum/chartkit`,
`@bitbaum/design-tokens`, `@bitbaum/accountkit`, `@bitbaum/chatkit`,
`@bitbaum/sitekit`, `@bitbaum/mail-kit`, `limitkit`. Investigations are one
jsonb row (`Investigation` table, migration 0004) with an edit-token hash and
an optimistic `revision` (409 on conflict). Shared provider keys come from the
fleet's `/opt/fleet/env` (Loki `scripts/hetzner/fleet-keys.conf`); never put a
key or a model id in the repo.

## Run and test

`pnpm install`, `pnpm dev`, `pnpm run verify` (format, lint, typecheck,
design check — no raw colours outside `src/app/theme.css` — and tests).
Screenshots: a Playwright helper outside the repo; any headless Chromium at
1366 and 390 px works. PRs auto-merge through the fleet sweep
(`gh workflow run auto-merge.yml` if it stalls); deploy follows on main.

## Known issues

- The citation check is a model pass: it can miss or over-flag (it flags
  numbers cited to an indicator *definition* finding; the fix is to cite the
  dataset).
- Commons search can return off-topic files; ranking only reorders.
- AI illustrations are built (`@bitbaum/ai-kit/images`, `src/lib/investigations/ai-image.ts`, `POST /api/investigations/<id>/images`, bytes in the `GeneratedImage` table, served at `/api/images/generated/<id>`) but stay hidden until the server sets `IMAGE_GEN_API` and `IMAGE_GEN_MODEL`.
- Version pages show the model run id; times are shown in Europe/Zurich.

## Unverified

Colour-blind contrast of the stance colours; screen-reader pass of reading
mode; the citation check's precision across many articles.

## Next briefs (paste as-is)

1. "Switch on BiasLens AI illustrations: on the Hetzner box add to
   `/opt/biaslens/shared/.env` the lines `IMAGE_GEN_API=gemini` (or
   `openrouter-chat`) and `IMAGE_GEN_MODEL=<an image-output model that key can
   use>`; the key itself (`GEMINI_API_KEY` / `OPENROUTER_API_KEY`) already comes
   from `/opt/fleet/env`. Restart the app, open
   /investigations/3iqMy8Z5ro with its edit link, generate one illustration,
   confirm the AI-generated badge, screenshot desktop and mobile."
2. "In bitbaum/orangecat, replace src/services/images/generate.ts with
   `@bitbaum/ai-kit/images` (same behaviour, BYOK unchanged); keep the tests."
3. "In bitbaum/biaslens, record who reviewed a link and when, show it on the
   evidence card, and add a filter by review state."
