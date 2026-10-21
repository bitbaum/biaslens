# BiasLens interface decisions

This document records **BiasLens-specific** visual decisions, not a second fleet
design-system specification. Canonical cross-product rules live in
[bitbaum/fleet/AGENTS.md](https://github.com/bitbaum/fleet/blob/main/AGENTS.md)
and reusable CSS in
[`@bitbaum/design-tokens`](https://github.com/bitbaum/design-tokens).

## Product character

BiasLens is an *editorial investigation desk*. It should read like a serious
publication that invites inspection, not a brightly scored truth machine.

- **Colour:** warm paper, clear near-black ink and a restrained teal indicating
  investigation. Status must never depend on hue alone.
- **Type:** ordinary sans for input and reading, serif headlines for literary
  editorial character, monospaced micro-labels for identifiers and provenance.
  These are semantic roles in `src/app/globals.css`; no hard-coded face or colour
  in a component.
- **Composition:** large reading measure, hairline divisions, equal tab labels,
  line-based lists, generous but fluid whitespace. No rows of badges, arbitrary
  ornamental icons or nested borders around every finding.
- **Hierarchy:** one primary action per screen. The landing CTA is "Examine an
  article"; the count-only evidence demonstration is subordinate and closed by
  default. Missing evidence remains conspicuously missing.
- **Shared chrome:** all public pages use `src/app/_components/Chrome.tsx`,
  with a keyboard-accessible skip link, nav page indication and one footer.
- **Interaction:** 44px minimum targets, 16px form fields, accessible contrast,
  clear errors and a way forward. A beta report says what it cannot establish.

## Architecture and reuse

The stable **brand-neutral** composition primitives have now been implemented
in `bitbaum/design-tokens/composition.css` as an opt-in subpath. They are
distinct from the fleet's common brand tokens for OrangeCat/Loki/Solon.

**Current adoption:** this redesign uses app-local CSS modules and the
single-root layout tokens to keep its own style. Do not claim the new shared
`composition.css` is installed until the package is tagged/published and the
consumer's dependency and lockfile are updated. When available, migrate the
equivalent shell, controls and choice-row structure to the shared classes,
map `--bb-*` variables to BiasLens's own colours and remove redundant local
declarations. Do not copy the shared stylesheet into this repository.

## Acceptance and iteration

`pnpm run design:check` is part of `pnpm run verify`; it checks the
same-page chrome, AA text/action contrast, focus/motion contracts and component
anatomy. A successful code build is not a substitute for browser testing:
before a beta deployment, visually inspect 390px and desktop, light and dark
*where supported*, keyboard-only flows, and real long-form outputs. Log
findings as scoped tickets and fix the shared grammar where applicable.

We are not replacing evidence quality with visual polish. The report and
illustrative graph must always label uncertainty and provenance honestly.
