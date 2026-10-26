# Truth Seeker → BiasLens: migration handoff

**Decision (20 October 2026):** converge into **one user-facing analysis product**.
**Canonical integration target:** `bitbaum/biaslens`. 
**Donor implementation:** `bitbaum/truthseeker`. 
No new product repository, no second database, no parallel frontend.

This is a **technical integration handoff**, not the canonical project identity,
mission, public roadmap or changelog. Identity remains in Loki's project profile and
Fleet's registers per [fleet/AGENTS.md](https://github.com/bitbaum/fleet/blob/main/AGENTS.md).
If the project key, product name, status, or URL needs changing, update its
canonical producer through the owner-approved Loki/Fleet workflow rather than
making up a second copy here. Until that happens, BiasLens is the repo identifier,
not a final brand decision.

## Donor inventory (original main branches checked 20 October 2026)

- Truth Seeker: `src/lib/analysis.ts` orchestrates URL/body analysis,
  `article-fetch.ts` and `public-url.ts` implement guarded ingestion;
  `llm.ts` uses `@bitbaum/ai-kit` cross-vendor fallback;
  `prompts.ts` contains the first-principles rubric.
  `src/app/api/analyze/route.ts` and `scripts/analyze-cli.ts` are entrypoints.
  Keep its fixtures, URL security tests, rate limiting and attribution behavior.
- BiasLens: Drizzle/PostgreSQL `src/lib/db/schema.ts` holds
  Outlet, Article, Claim, Evidence, Narrative, EditorialDna and HomepageSnapshot;
  `src/lib/domain/claim-verification.ts` provides a deterministic
  evidence-count demonstration (NOT a reliable measure of truth or confidence).
  `src/app/EvidenceVerifier.tsx` is a small demo, not the finished experience.
- On 21 October, PR #49 merged the on-demand URL/text pipeline and first-principles
  contract into BiasLens main, superseding PR #46. Truth Seeker's original
  dependency-maintenance PR #57 was still open at initial inspection.
- Neither product was documented as deployed in Bitbaum's per-project notes;
  **verify current hosting separately** before publishing availability claims.

## Boundaries (non-negotiable)

1. One article → one analysis record with **separate axes**:
   claim extraction and first-principles critique; external fact verification;
   media framing and selection bias; confidence/unknowns; evidence provenance.
2. Extracted claims and an LLM's `supported_in_article` label are **not**
   independent truth verification. Never convert them to `Claim.verificationStatus`.
   No automatic factual accusations against people or outlets.
3. Keep narrative framing and factual correctness distinct. A conclusion
   supported by strong evidence need not receive false balance.
4. User-facing claims must link to precise primary sources where possible;
   screenshots/transcripts need stable offsets and timestamps, model/version,
   ingestion timestamp and source URL/hash. Log corrections without rewriting history.
5. Never conflate quantity of supporting citations with strength of evidence.
   BiasLens's present `evidence-tally@1` is explicitly a demo and must not
   be shown as calibrated confidence or final factual truth.
6. Humans may challenge any claim, cite counterevidence and appeal; preserve
   competing interpretations and their evidence. Moderation governs conduct
   and abuse, not alignment with a viewpoint.
7. Debate metrics (speaking time, interruptions, moderator treatment) need
   speaker diarisation, timestamp provenance, human correction and visible
   measurement error. Do not call an overlap an interruption without a defined method.

## Agent coordination — no competing source of truth

- **One integration handoff:** this document, current BiasLens main and Fleet's
  AGENTS.md. Claude/Codex/Loki should inspect them and open PRs before dispatching
  related work. Do not re-open superseded PR #46.
- Always fetch current remote refs and inspect open PRs first; work on **new
  feature branches**, not concurrently on another agent's branch or main.
- Keep Truth Seeker untouched while migration is incomplete, including its
  dependencies and open PR. Its repository and Git history are a rollback.
- Move one tested vertical slice at a time. Do not copy the entire Next.js app,
  duplicate a database, edit Fleet registers by hand, or invent a new company.
- Reuse shared `@bitbaum/*` packages when they actually cover the behavior;
  consult fleet/AGENTS.md and package registers before installing dependencies.
- Changes touching a project's canonical identity need an explicit Loki/Fleet
  migration and regeneration of Bitbaum catalogue data, not manual site edits.
- Gate every merge on `pnpm run verify` + `pnpm run build`, security cases
  (SSRF/redirects/abuse/PII), and a reviewed, replayable sample analysis.
  A branch/PR is not proof of deployment.

## Migration slices and acceptance

**A. Contract — delivered (PR #49):** first-principles output taxonomy and
runtime validation are a pure, tested module. The initial source is Truth
Seeker's v0.1 JSON format; its model output is labelled as unverified.

**B. Ingestion — delivered first slice (PR #49):** `POST /api/analyze` accepts
an article URL or user-supplied text with bounded input, a per-process rate
limit via `limitkit`, shared `@bitbaum/ai-kit/web` page reading, and multi-model
fallback via `@bitbaum/ai-kit`. HTTP-boundary and injected-reader tests cover
rejections, source attribution, truncation and input handling. Production
security review must still validate redirect/DNS edge cases and deployment
trust boundaries before serving public traffic.

**C. Report & persistence — partially delivered:** `/analyze` now presents a
structured browser report, with source-attribution and unverified-AI notices.
Still required: exact source spans, durable report URLs, provenance hashes,
reproducible run metadata, source/reference DB records and schema migration.
The final verdict cannot be a model's prose. Before any public deploy,
strengthen abuse controls for horizontally scaled workers and finite LLM budgets.

**D. BiasLens layer:** separate source balance, framing, actor visibility,
omissions, tone, expert selection, counterexamples and uncertainty. Include
per-dimension methodology, independent tests and an understandable audit view.

**E. Media:** audio/video transcription, diarisation, speaker time, overlap
and interruption analyses with timestamps and correction controls.

**F. Community:** accounts, moderated evidence submissions, review/rebuttal,
and a transparent challenge/appeal trail; then optional public APIs.

**G. Cutover:** after end-to-end deployment, migration validation and rollback
tests, update Loki canonical profile/Fleet project association and regenerate
Bitbaum portfolio; redirect historical links. Only then archive Truth Seeker
(or delete by a separately verified owner decision). Never delete the donor
merely because an integration PR exists.

## Definition of done for unification

- A user can paste a news URL or full article text and receive an analysis
  in a single working BiasLens interface with clear fact-vs-framing separation.
- Each concrete factual assessment exposes evidence, provenance, method and
  uncertainty; a claim can be challenged and corrected.
- CI and build pass, end-to-end source security tests pass, deployed hostname
  answers smoke tests, and no older Truth Seeker capability is lost.
- Canonical registers reflect one product, historical data and Git history
  are retained, URLs/clients redirect, and the retired repo is read-only.
