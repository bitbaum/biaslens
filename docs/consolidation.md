# Product consolidation implementation ledger

Owner clarification, 23 October 2026: **BiasLens is the sole product name**.
All truth-seeking product development belongs in `bitbaum/biaslens`.
Keep the existing repository, deployment, database and project identifiers.
No repository rename, alternative brand, new hosting stack or domain purchase.

This is an engineering migration record, not a duplicate mission. The canonical
mission remains in the [project profile](https://loki.orangecat.ch/fleet/biaslens);
`ROADMAP.md` and `CHANGELOG.md` in this repository are its development-record
sources and are ingested into that profile.

## Inventory and disposition

| Resource | Observed disposition |
| --- | --- |
| BiasLens main | Canonical product implementation; article analysis, graph protocol, methodology, Arena, publishing and brand seam retained. |
| TruthSeeker | First analysis slice already integrated in PR #49; preserve donor history and rollback until parity and deployment acceptance. No new feature work there. |
| Retired standalone prototype | Superseded, not deployed. Its question/source/notebook concept is integrated into `/explore` using the existing product design and no duplicate frontend stack. Do not publish the old Sites project. |
| Historical July 2026 blueprint | Named in the supplied conversation as `Media_Bias_Analysis_Tool_Blueprint-1.md`; not found in the current repository, local library or connected Drive searches. Original not silently replaced or independently validated. |
| Technical paper | New, explicitly dated working specification in `content/research`; rendered by existing bip-kit on `/whitepaper`. Not represented as the recovered historical document. |
| Publishing | Existing bip-kit Markdown reader/renderer and RSS retained; journal, source, challenges and canonical development records exposed through `/development`. |
| Shared packages | Reuse ai-kit, limitkit, design-tokens and bip-kit. No new dependency or copied package implementation. |
| Hosting | Existing Loki/Fleet registration and `biaslens.orangecat.ch` remain the operational path; do not create a second host. |

## Identity stays unchanged

`src/lib/config/brand.ts` and `.env.example` use BiasLens and B/L.
No product rename or canonical-profile rename is required. Do not apply
alternative-name instructions from superseded PR descriptions or commits.
Continue to use the existing Loki/Fleet project and deployment workflow.
Do not copy, print or replace model credentials, create another profile,
or change `apps.conf` manually.

## Completion evidence

Source changes and a PR are not a deployed product. Require `pnpm run verify`,
production build, browser artifacts at 390/834/1440, existing-host smoke,
correct runtime brand and a real model request before asserting acceptance.
GitHub connector access can publish a review branch even when the local network
proxy prevents dependency installation or deployment. Record each such limit
in the PR instead of weakening checks or reporting fabricated results.
