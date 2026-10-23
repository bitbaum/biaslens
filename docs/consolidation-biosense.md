# Product consolidation implementation ledger

Owner direction, 22 October 2026: use **Biosense** as the public product name
and concentrate all truth-seeking product development in the existing
`bitbaum/biaslens` repository. The technical slug is retained to preserve
deployment, database and historical links. No repository rename or new domain
purchase is part of this change.

This is an engineering migration record, not a duplicate mission, roadmap or
changelog. Those remain in the [canonical project profile](https://loki.orangecat.ch/fleet/biaslens).

## Inventory and disposition

| Resource | Observed disposition |
| --- | --- |
| BiasLens main | Canonical product implementation; article analysis, graph protocol, methodology, Arena, publishing and brand seam retained. |
| TruthSeeker | First analysis slice already integrated in PR #49; preserve donor history and rollback until parity and deployment acceptance. No new feature work there. |
| World Unfold local prototype | Superseded, not deployed. Its question/source/notebook concept is integrated into `/explore` using the existing product design and no duplicate frontend stack. Do not publish the old Sites project. |
| Historical July 2026 blueprint | Named in the supplied conversation as `Media_Bias_Analysis_Tool_Blueprint-1.md`; not found in the current repository, local library or connected Drive searches. Original not silently replaced or independently validated. |
| Technical paper | New, explicitly dated working specification in `content/research`; rendered by existing bip-kit on `/whitepaper`. Not represented as the recovered historical document. |
| Publishing | Existing bip-kit Markdown reader/renderer and RSS retained; journal, source, challenges and canonical development records exposed through `/development`. |
| Shared packages | Reuse ai-kit, limitkit, design-tokens and bip-kit. No new dependency or copied package implementation. |
| Hosting | Existing Loki/Fleet registration and `biaslens.orangecat.ch` remain the operational path; do not create a second host. |

## Coordinated identity application

The owner authorized the public name here. `src/lib/config/brand.ts` and
`.env.example` now default to Biosense. On the existing box, update only the
public values `NEXT_PUBLIC_PRODUCT_NAME=Biosense` and
`NEXT_PUBLIC_PRODUCT_MARK=BS`, then rebuild using the existing deployment
process. Do not copy, print or replace model credentials. An existing
`NEXT_PUBLIC_PRODUCT_NAME=BiasLens` overrides the source default until changed.

Apply the owner-approved name to the **existing** Loki project Context, then
regenerate its derived public profile through the normal Loki/Fleet workflow.
The runtime project profile is not writable through this checkout. Do not
invent another profile, change `apps.conf` manually or claim synchronization
before that operation is verified. Retain the stable `biaslens` project join.

## Completion evidence

Source changes and a PR are not a deployed product. Require `pnpm run verify`,
production build, browser artifacts at 390/834/1440, existing-host smoke,
correct runtime brand and a real model request before asserting acceptance.
GitHub connector access can publish a review branch even when the local network
proxy prevents dependency installation or deployment. Record each such limit
in the PR instead of weakening checks or reporting fabricated results.
