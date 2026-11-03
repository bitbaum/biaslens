# BiasLens: one loop (direction from Nov 2026)

Status: concept approved for building. Nothing here is built yet. Owner: G.

## Problem

BiasLens grew four doors to the same thing: Examine, Investigate, Rewrite and the
notebook. They sound alike, there is no chat, no obvious "paste an article" call
to action, and the navigation is not on the shared `@bitbaum` packages. It reads
like a media site, not a tool.

## The loop

1. **Home feed**: articles from sources the reader follows (CNN, Fox News,
   Weltwoche, Republik, NZZ, Guardian, ...). Paywalled items show headline and
   metadata only; BiasLens can write its own article from the headline plus
   gathered evidence, clearly labelled as such.
2. **One paste box** at the top of every screen: URL or text.
3. **One article page** with four modes (tabs, same evidence underneath):
   - **Read**: the original (or what is legally available), with highlights.
   - **Talk**: AI chat with the article. Chips: Explain it, Dig deeper, What's
     missing?, Who disagrees?, Show the data.
   - **Check**: claims and gaps from first principles. Each claim: what is
     asserted, what evidence would settle it, what evidence exists (study design
     tier), what the article left out. Example: "accidents in Zurich up X%":
     base rates, exposure (more traffic? more cyclists?), reporting changes,
     alternative causes, then fill the gap with sources. Example: masks and
     lockdowns, where outlets called "reliable" repeated claims that lacked
     high-quality trials.
   - **Rewrite**: in a chosen style, perspective or depth (neutral, Economist,
     FT, Reason, Weltwoche, Republik, explain-like-I'm-new, ...). Every
     rewrite labelled as a simulation, with a fact diff and citations.
4. **Chosen bias, made visible**: a reader may set preferences (tone,
   perspective, depth). Tailored output always says which lens it uses and can
   be flipped to neutral or the opposite view in one tap.
5. **Source track records**: outlets are compared by how their articles fare
   under the Open Epistemic Method over time (claims supported, gaps left,
   corrections), never one bias score per article. This may overturn
   establishment reliability rankings; that is the point, and the method is
   public so anyone can audit it.

## Why people would come back daily

Your sources in one feed; every story one tap from "what's missing" and "who
disagrees"; you can talk to the news; you know which lens you're reading through
instead of trusting it isn't there; the outlet scoreboard changes as evidence
does. Fun but rigorous: chips, charts, maps, before/after diffs.

## Technology

- Feeds: RSS/Atom + sitemaps per source; source registry table (name, country,
  feed URLs, paywall flag, follow count). Scheduled fetch job; dedupe by URL
  and title similarity.
- Extraction: existing reader/PDF pipeline; headline+metadata only when paywalled.
- AI: `@bitbaum/ai-kit` (models, images), `chatkit` for Talk, `searchkit` for
  evidence (OpenAlex/Crossref/web), `chartkit` for charts.
- UI: `@bitbaum/sitekit` nav/tab bar only; no local nav components.
- Reuse: investigations, claims, gaps, revise, citation check become the engine
  behind Check/Rewrite; their separate pages are retired into the one article page.

## Prompt outlines

- `claims@2`: extract checkable claims, attribute speaker, state what evidence would settle each.
- `gaps@2`: for each claim list base rates, confounders, alternative causes, missing voices; propose searches.
- `evidence@2`: rank found studies by design tier; summarise for/against; no verdict without evidence.
- `talk@1`: answer only from article + evidence; cite [E#]; say "unknown" when unknown.
- `rewrite@2`: style/perspective parameters; keep facts fixed; label output; emit fact diff.
- `headline-article@1`: from a paywalled headline + evidence, write a labelled independent article.
- `source-score@1`: aggregate per-outlet method results; explainable, no single per-article number.

## Information architecture

Top nav (sitekit): Today (feed) · Sources · My desk · Method · Blog. Paste box
always visible. Article page = Read | Talk | Check | Rewrite. Settings: followed
sources, preferred lens, language.

## Phases

1. Collapse: one article page with four modes; paste box; retire duplicate entry
   points; sitekit nav. Redirect old URLs.
2. Talk: chatkit chat with chips, grounded in article + evidence.
3. Feeds: source registry, follow sources, Today feed, paywall headline mode.
4. Preferences: chosen lens, tailored rewrites, always labelled.
5. Source track records page, method changelog visible.
6. Profiles: update Loki (`loki.orangecat.ch/fleet/biaslens`, drop stale
   "bias scores" text), create BiasLens profiles on OrangeCat and Solon
   (`bitbaum/solon`).
7. Blog page polish (blog exists at `/blog` from `content/blog/`).

## Anti-goals

- No truth percentage or single bias score per article.
- No unlabelled simulations or tailored text.
- No republishing paywalled text.
- No new local copies of shared package components.
- No more parallel entry points that do the same thing.

## Build brief (paste into the builder)

> Read `docs/plans/2026-11-one-loop.md`, `docs/HANDOFF.md`, `AGENTS.md`. Implement
> phase 1 only: a single article page with Read/Talk/Check/Rewrite tabs reusing
> the existing investigations, gaps, revise and citation-check engines; a global
> paste box; sitekit navigation; retire Examine/Investigate/notebook as separate
> doors with redirects. Tests for redirects and each mode. Update HANDOFF.md and
> ROADMAP.md in the same PR. Then propose phase 2.
