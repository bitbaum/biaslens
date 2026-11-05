# Handoff — BiasLens investigations and rewrite desk

Last refreshed with the PR that touched it. Read this first, then `AGENTS.md`.

## New direction (read first)

As of 2026-11-03 the product direction is `docs/plans/2026-11-one-loop.md`: collapse Examine/Investigate/Rewrite/notebook into one article page (Read · Talk · Check · Rewrite), add chat, a followed-sources feed and sitekit nav. Its last section is a ready-to-paste build brief for phase 1. The briefs further down are superseded where they conflict.

## Current state

- Writing tools (`src/app/write/WritingTools.tsx`): Speak (chatkit `useDictation`, server leg
  `/api/transcribe`) → `POST /api/writing/assist` (`src/lib/writing/assist.ts`, ai-kit free
  chain) for draft/improve with Undo; Photo (Commons `PhotoSearch`, inserted as a bip-kit
  figure); Chart (bip-kit `chart` fence); Preview (chatkit `Markdown`). Comments
  (`src/lib/writing/comments.ts`, `Comment` table, migration 0008) under published articles,
  posted through chatkit's `Composer`. Article actions are one shape (`article.module.css`
  `.actionRow`). Browser-tested locally: toolbar, chart render, comments post/remove, phone.
- Writing (`src/lib/writing/`, `src/app/write/`, `src/app/articles/`, `src/app/api/writing/`):
  account-backed written articles (`WrittenArticle`, migration 0007) with drafts, responses
  (`respondToId`), the headline a piece is about (`sourceUrl`/`sourceTitle`) and the author's
  examination (`reportId`). `trendingTopics` (`src/lib/writing/trending.ts`) finds subjects
  shared across wires for Today and the composer. A nameless account sets its byline in the
  composer (`authClient.updateUser`). "Post on OrangeCat" opens
  `orangecat.ch/articles/new?import=<this article's JSON url>`; OrangeCat's composer reads it
  through its own server proxy. Tested end to end in a browser against a local Postgres
  (sign-up → write → publish → share → respond → edit → draft → delete, phone and desktop).

- Responsive rewrite repair: `rewrite.module.css` uses shrinkable grid tracks
  and wraps imported/generated long text; `report.module.css` does the same for
  the annotated source. `scripts/investigation-browser-check.mjs` includes
  long URLs, both phone comparison views, open evidence notes and labelled copy
  output. Run through `pnpm run browser:smoke` against a production build.
  This repair does not complete the one-loop migration or navigation redesign.
- Navigation inspection confirmed `Chrome.tsx` uses sitekit's masthead/tab bar.
  Its current navigation API is a flat list. A grouped, descriptive menu should
  extend sitekit upstream and arrive through a published dependency update,
  not a product-local replacement.
- Shared authoring follow-up: OrangeCat needs one generation/editing lifecycle;
  Heidi adds source-to-language-learning adaptation through its existing
  variety-pack boundary. Share draft identity, revision safety, cancellation,
  proposals/Undo and comparison. Keep evidence policies, simulation labels,
  capability tokens and server revision checks here. Preserve source and
  provenance through adaptation and copy/export. No shared authoring package
  or cross-product draft synchronization is implemented by this repair.
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

- Home is "Today" (`src/app/page.tsx`, `src/lib/investigations/featured.ts`): the page now opens on a public wire (`src/lib/wire/`), then the featured investigation. Featured ids only (`FEATURED_IDS`), never every saved link. Visit streak, follows and edit links live in `src/lib/client/local.ts` (device only).

- Navigation: `src/app/_components/Chrome.tsx` (one list → sitekit `SiteMasthead` + `SiteTabBar`). Pages `/investigations`, `/desk` (`MyDesk`, device-local), `/settings` (`SettingsForm`, `PreferencesApplier` sets `data-text-size`/`data-motion` on `<html>`), `AccountTabs` across desk/settings/account.

- Shared packages extended for this work: `@bitbaum/ai-kit` 1.24 (`/images`, ai-kit PR #108) and `@bitbaum/sitekit` 0.5 (`SiteTabBar`, sitekit PR #41). BiasLens PRs #152–#165.

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

- The sign-in page shows "Continue with OrangeCat" whenever `SIGNIN_*` is set, but Morulia
  (`morulia.orangecat.ch/api/providers`) has no provider switched on yet, so the button dead-ends.
  The fix belongs in `@bitbaum/accountkit` (hide the button when the issuer publishes no
  providers) and in Morulia (paste one provider's keys).
- Writing help answers 503 until the server has an ai-kit key (`GROQ_API_KEY` /
  `OPENROUTER_API_KEY` via `/opt/fleet/env`); the composer says so in words.
- Tab icons are still unicode glyphs; `@bitbaum/sitekit` 0.6 (PR #45) adds `SiteIcon` and the
  masthead `tabBar` prop. Switch `Chrome.tsx` to them when the floor-raise lands.

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
3. "In bitbaum/biaslens, keep the desk (edit links, follows, streak) in the signed-in account so it syncs across devices; additive migration only."
4. "In bitbaum/biaslens, record who reviewed a link and when, show it on the
   evidence card, and add a filter by review state."
