# Handoff — BiasLens investigations and rewrite desk

Last refreshed with the PR that touched it. Read this first, then `AGENTS.md`.

## New direction (read first)

As of 2026-11-03 the product direction is `docs/plans/2026-11-one-loop.md`: collapse Examine/Investigate/Rewrite/notebook into one article page (Read · Talk · Check · Rewrite), add chat, a followed-sources feed and sitekit nav. Its last section is a ready-to-paste build brief for phase 1. The briefs further down are superseded where they conflict.

## WritingKit composer and source rewrite adoption

Implementation branch: `feat/writingkit-biaslens`, starting from navigation release
`91a3819f3dc7799136884ce0809c9c8cfd48a282`. Scope: adopt the verified WritingKit
release in existing composer assistance and source RewriteStudio. Preserve the
current editor/tools, original sources, simulation labels and copied output.
Keep Undo and storage in the composer. Investigation revision writes are a
separate adapter scope: retain their server capability/revision checks and
history; stopping a browser request does not roll back a committed server write.

Acceptance: synchronous overlap prevention, Strict Mode lifecycle, late answers
after manual edit/revert, account/draft/report switches, cancellation followed
by new work, safe Undo after editing and source rewrite option changes. Run the
normal full verify/build/browser gates and existing server conflict/capability
checks, then fleet sweep, deployed receipt and current-artifact journey.
Host adapters are implemented using the verified Git artifact; its compiled
entry matched the tagged source. Full verify passed (211 tests in 42 files plus nine design checks), the
production build passed, and the controlled browser lifecycle suite passed at 320/390/834/1440px, including an abort-ignoring
provider, Strict Mode, edit/revert, safe Undo, account/draft/report switches,
latest anonymous-draft handoff and labelled source-copy preservation. Friendly
network-error/retry and instruction-edit coverage also passed. The screenshot
fixture exposed the existing client-input import of a server store; PUBLIC_ID
now has one client-safe producer and the store preserves its public export.
Full local browser smoke passed: 42 page captures, shared shell, existing
investigation journeys and the four-width WritingKit suite. The fixture uses the
complete product stylesheet stack with controlled auth/model/publishing boundaries.
[PR #194](https://github.com/bitbaum/biaslens/pull/194) owns exact candidate CI,
fleet-sweep merge, deployment and served-receipt/journey evidence; inspect it before
resuming. Concurrent ChatKit 0.23.0 (#193) and generated fleet rules (#195)
were reconciled into this candidate; retain both when refreshing it. Local
checks alone do not establish those later stages. Next after this
bounded adoption: the one-loop workspace and a versioned investigation adapter
that reconciles server writes rather than pretending browser abort rolls them
back. Wider one-loop consolidation, Heidi/Loki and physical keyboard/production
publication acceptance remain open.

## Grouped navigation canary

Current candidate uses published SiteKit 0.7.0, tagged at
`28012464359deaec61deee35b81ba6cabfcc0cfe`.
[Release](https://github.com/bitbaum/sitekit/actions/runs/42132915819),
[exact-commit CI](https://github.com/bitbaum/sitekit/actions/runs/42132997173)
and [npm publication](https://github.com/bitbaum/sitekit/actions/runs/42132997593)
passed. The exact-version npm metadata matched that commit and the locked
integrity. Local online installation hit upstream proxy transport errors and
offline installation failed for missing cached metadata. The candidate's normal
online CI installation and full verification passed; its source tree matched the
locally built and browser-tested implementation.

BiasLens supplies descriptive groups; SiteKit owns the disclosure, layout,
keyboard/focus behavior and dismissal. The phone shortcuts use SiteKit SVG
icons. Keep the masthead `tabBar` shortcut off: hiding the grouped menu would
remove destinations beyond the five shortcuts. The footer labels `/workspace`
as “Workspace tools”, matching its destination.

Screenshot review drove shared corrections in
[SiteKit #47](https://github.com/bitbaum/sitekit/pull/47) and
[#48](https://github.com/bitbaum/sitekit/pull/48): align desktop panels with the
header frame, avoid clipping narrow account popups, and preserve nested host
widget styling. Consumer checks measure actual AccountKit popup bounds and row
anatomy in both account states at 320/390/834/1440px. The signed-in menu fixture
is controlled; it is not a real production sign-in or physical-keyboard test.

Browser screenshots use Playwright against the production build with the same
page list, dimensions and PNG checks after the Chromium CLI capture timed out.
The harness owns its Next process directly so cleanup stops the server.
Generated browser evidence stays out of source formatting and Git.

Source preserves the writing-tools/comments work from #189 and the published
package floors from #190/#191. [PR #192](https://github.com/bitbaum/biaslens/pull/192)
is the authority for current candidate, merge and deployment evidence.
[Candidate CI](https://github.com/bitbaum/biaslens/actions/runs/42134378213)
passed online frozen install, full verify (211 unit tests in 42 files plus nine
design checks) and production build.
[Browser CI](https://github.com/bitbaum/biaslens/actions/runs/42134378714)
passed both screenshots/user flows and the database-backed account lifecycle.
Corrected desktop, phone and 320px account-menu screenshots were inspected;
local production-build browser checks also passed. Later documentation-only
commits retain normal required checks. A source commit or PR merge alone does
not establish deployment: check the PR's served receipt and current-artifact
journey before treating the canary as deployed.
The wider one-loop/WritingKit adoption remains open; follow
[Fleet's content plan](https://github.com/bitbaum/fleet/blob/main/docs/content-workflow-plan-2026-11-05.md)
for Heidi, Loki and cross-product ownership. Private drafts do not synchronize.

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
- Navigation: `Chrome.tsx` configures SiteKit's grouped masthead, tab bar and SVG
  icons. The package owns markup and interaction; the canary checkpoint above
  records verification and deployment state.
- Shared authoring follow-up: follow Fleet's linked content plan and
  [OrangeCat's writing checkpoint](https://github.com/bitbaum/orangecat/blob/main/docs/development/2026-11-05-writing-handoff.md).
  BiasLens's WritingKit adoption and one-loop consolidation remain open. Keep
  evidence policies, simulation labels, capability tokens and server revision
  checks here. Heidi retains its variety-pack boundary and source provenance.
  This navigation change adds no cross-product draft synchronization.
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
