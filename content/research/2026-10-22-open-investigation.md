---
title: Open investigation, inspectable evidence
date: 2026-10-22
summary: A technical specification for investigating the world through traceable sources, explicit reasoning, visible uncertainty and accountable correction. Working draft 0.2; implementation and proposed capabilities are distinguished throughout.
tags: [whitepaper, epistemology, evidence, provenance]
author: Product research desk
---

## 1. Scope and reading this document

This is a technical working paper, not a certification that a system can determine truth. It describes how an investigation can be represented, inspected, tested and corrected. It covers public arguments, scientific explanations, historical narratives, economic hypotheses, media coverage and debates. It does not claim that every question is empirically decidable or that every disagreement can be resolved by software.

The product's canonical problem, solution, mission and vision remain in its [Loki project profile](https://loki.orangecat.ch/fleet/biaslens). The repository's `ROADMAP.md` and `CHANGELOG.md` are the source for planned work and shipped changes; Loki ingests them into that profile. This paper specifies methods and engineering requirements; it does not establish a second project registry. Public display names can change without replacing the existing repository or historical records.

Implementation statements below refer to source code, not observed production behavior. A passing test, a merged pull request and a reachable service are different facts. [Source](https://github.com/bitbaum/biaslens), [development records](/development), and [the public method](/methodology) should be read together.

Implementation update, 23 October 2026: article reports now lead with an explicit assumption and a test that could challenge it. Claim quotations are displayed only after an exact match against the input text. The examined text is included in the user's export, not retained server-side. Native account screens and account persistence use `@bitbaum/accountkit`; mail-dependent methods and external sign-in providers appear only when configured. These changes do not implement independent verification.

## 2. Epistemic boundaries

An assertion is not its support. A source is not automatically reliable because it is prestigious or contrarian. An original record can be mistaken, forged, incomplete or misunderstood. A model can help identify structure without establishing whether a proposition corresponds to reality.

Keep at least five distinct questions visible:

- What exactly is being asserted, within what scope?
- What does the supplied material present as support?
- What independent evidence bears on that assertion?
- What inference connects the evidence to the conclusion?
- What objections, limitations or missing observations remain?

A user must be able to disagree with the system's selection, representation, method and interpretation. Inspectability makes criticism more specific; it does not immunize a platform against bias. This standard applies to the platform's own claims as much as to an article it examines.

## 3. Units of investigation

The existing epistemic graph contract distinguishes empirical, historical, causal, normative and predictive claims. The initial article-analysis contract has a narrower factual, normative and causal taxonomy. These are separate implementation layers; automatic conversion between them is not claimed.

An empirical assertion needs operational definitions, units, population and period. A historical assertion needs source dating, provenance and a distinction between contemporaneous records and later testimony. A causal assertion needs a proposed mechanism and an identification strategy or counterfactual test. A prediction needs an outcome definition, horizon and a way to evaluate it after resolution. A normative statement needs explicit values and premises; data alone does not decide what ought to be done.

A question is not a claim. The browser-local inquiry notebook therefore stores questions and source references without silently turning the question into an empirical assertion. A source's user-selected relationship is an annotation, not an assessed evidentiary stance.

Compound statements should be decomposed where their premises require different tests. For example, a policy recommendation can depend on both an empirical cost estimate and a value judgment about who should bear that cost. A single true/false label would conceal that structure.

## 4. Sources and provenance

A publishable evidence record should identify the original object, retrieval time, author or institution when known, exact location, relevant excerpt and relation to a specific assertion. For tables, preserve units and denominators. For recordings, preserve time intervals and speaker-attribution uncertainty. For historical records, preserve archive or edition identifiers and distinguish the date of the object from the date of the event it describes.

The current article exporter records a SHA-256 digest of the exact text sent to the model, along with model, prompt and method versions and analysis time. It does not persist the full source text server-side. The digest identifies bytes; it does not prove authorship, accuracy, legal reuse rights, source authenticity or the reproducibility of an unavailable model.

Durable source snapshots, independent authentication, licensed content storage and public replay are requirements for stronger historical reproducibility; they are not implemented by adding a hash. Pasted text has a user-asserted origin. A reachable URL does not establish that the supplied text came from it.

The local inquiry notebook requires a source URL and exact locator and exports its annotations as JSON. References remain explicitly unverified. Excerpts are user supplied, not fetched or authenticated. Storage is browser-local rather than a public evidence archive.

## 5. Source independence and quality

Ten publications repeating one press release are not ten independent observations. Evidence assessment should retain relationships among originating datasets, authors, funding, samples and repeated reports. A quality assessment should explain relevance, directness, completeness, measurement limitations, incentives and possible conflicts without reducing them to institutional reputation.

The current implementation does not automatically establish source independence or compute a quality-adjusted probability. A legacy count-based demonstration exists for educational use. Its majority fraction is not calibrated confidence and must not be presented as a probability of truth.

Missing evidence, inaccessible evidence and contradictory evidence are different conditions. A source that cannot be retrieved is not thereby false. Lack of a decisive answer is not proof that a question is inherently unanswerable. The interface should expose the specific limitation and the next useful action.

## 6. Reasoning and causal connections

The graph protocol represents dependencies, proposed causes, alternative explanations and tensions. A relationship has its own rationale, review state and evidence identifiers. Evidence for two endpoints does not automatically support a relationship between them. Two proposed causal arrows do not establish a transitive causal effect.

Before making a causal assessment, specify exposure, outcome, population, timing, mechanism and plausible confounders. Distinguish randomized experiments, observational comparisons, natural experiments, mechanisms and anecdotes. Report which assumptions are needed and what could challenge them. The appropriate method depends on the question; there is no universal prompt that substitutes for identification.

The pure graph audit currently identifies structural defects and gaps such as absent operational definitions, missing evidence, unreviewed leads and unsupported relationships. It does not calculate truth. A reviewed input means a workflow step has occurred, not that the final interpretation is infallible.

## 7. Framing and editorial influence

Media analysis must be separate from factual assessment. A statement may be accurate and selectively presented; an openly opinionated article may contain well-supported factual assertions. Political balance is neither necessary nor sufficient for accuracy.

The six dimensions carried forward from the supplied project reconstruction are source balance, tonality, framing and language, actor visibility, omissions and context, and expert selection. Full operational scoring for these dimensions is not implemented. The historical July blueprint has not been recovered into this checkout; this paper does not pretend to reproduce or validate it.

Before scoring a dimension, publish its unit of analysis, coding instructions, supporting passage, topic-specific comparison basis, uncertainty and failure modes. An omission finding requires an explicit reason why the omitted material is relevant. Lack of equal airtime is not itself evidence of improper balance. Ideological direction is context-dependent and should not be confused with the severity of distortion.

The proposed Bias Dial would require tests showing that rewrites preserve factual propositions, attribution and uncertainty while changing presentation. Such a rewrite engine is not currently available. Entity and funding histories likewise need dated sources and a correction mechanism; affiliation is context, not automatic evidence of wrongdoing.

## 8. Debate and audiovisual measurement

The implemented Debate Arena accepts user-supplied timed speaker turns. It calculates speaker airtime, share of speaker-seconds, cross-speaker overlap and intervals with no assigned speaker. Computation runs in the browser. The example speakers are fictional.

Speaker labels, timing and transcript content remain unverified. Overlap is not automatically an interruption; unattributed time is not necessarily silence. Cross-speaker overlap affects the denominator for speaker shares, while self-overlapping intervals should be counted once for that speaker. These choices must be stated alongside results.

Automatic transcription, diarisation, interruption classification and audiovisual authentication are separate proposed layers. Evaluation would need language and accent coverage, timestamps, attribution error, correction tools and comparisons against reviewed recordings. Speaking time alone does not establish fair moderation or political bias.

## 9. Challenges, corrections and governance

The method contains explicit challenge records targeting a claim, source, relationship or method version. An answer is distinct from resolution. A human disagreement should not disappear because a model produces a reply. A resolved record needs a stated resolution, not just a closed status.

The current public submission channel is a GitHub issue template. It requires a GitHub account. A native multi-user review system, appeals process and append-only public correction history have not yet been implemented. The local notebook can record a challenge for export; it does not publish that challenge or notify a reviewer.

A future public review service needs abuse controls, conflict disclosures, review provenance, permissions and an appeal route. Moderation should distinguish conduct from viewpoint, document its decisions and retain a privacy-respecting account of corrections. Participation volume must not become an automatic truth vote. Reviewers and system owners should remain open to the same scrutiny as other sources.

## 10. Architecture and shared components

One product repository contains the Next.js interface, request handlers, pure domain modules, source-controlled research content and Drizzle/PostgreSQL schema. The original TruthSeeker repository is retained as historical donor code. It is not a second destination for new feature work. The separate standalone prototype experiment is superseded; useful ideas are integrated into this product rather than deploying its duplicate frontend.

The existing shared packages have distinct responsibilities: ai-kit provides model access and page-reading behavior; limitkit supplies request throttling; design-tokens supplies optional composition primitives; bip-kit reads and renders publishing content. Product-specific visual identity, interpretation and schema stay within the product. Loki/Fleet owns canonical project records and hosting orchestration.

The article workflow currently produces provisional AI analysis from a URL or pasted text. Model credentials are required for that route; without them the service returns an explicit unavailable response. The schema is a persistence foundation, not evidence that reports or challenges are being durably stored. Account persistence uses the shared accountkit schema and its own Postgres tables. A deployment must validate provider access separately from credential presence.

## 11. Evaluation before stronger claims

Evaluation needs a frozen task definition, documented sample selection, independent annotation and held-out cases. Begin with a bounded multilingual corpus and publish where it fails. Do not infer scientific validity from a few attractive examples or passing software tests.

Measure extraction fidelity against exact source passages; attribution precision and recall; factual versus normative versus causal classification; citation entailment; source independence errors; unsupported assessments; and the rate at which the system correctly declines to decide. Compare reviewers' disagreements rather than concealing them behind a single reference label.

For framing dimensions, publish coding rules and inter-rater agreement with its assumptions and uncertainty. For causal analysis, evaluate whether confounding and alternative explanations are surfaced without inventing evidence. For forecasts, use prospective resolution rules and appropriate scoring only when probabilities are actually calibrated.

Measure usefulness separately: time to reach an original source, ability to identify a missing premise, success correcting a wrong attribution, accessibility and completion on a phone. Popularity, user satisfaction and model agreement are not substitutes for validity. No benchmark scores or user adoption figures are claimed in this draft.

## 12. Threats and operational limits

Important failure cases include prompt injection in retrieved material, SSRF and redirect abuse, manipulated excerpts, fabricated citations, repeated-source laundering, coordinated submissions, misleading translations, truncated context and model outages. Expensive automated requests can exhaust a free tier even without financial billing. Existing input bounds and rate limiting are a starting point; production behavior needs its own acceptance tests.

Persist only what is justified. The local notebook is not encrypted by this application and should not hold secrets or sensitive personal data. Exports can contain the text a user entered. Future source storage must handle copyright, deletion requests, retention, access control and personal information explicitly.

No new paid domain, hosted database or model subscription is a prerequisite of this consolidation. Existing infrastructure and browser-local features are preferred. Free services have quotas and can change terms; a cost boundary and a visible unavailable state are more honest than promising unlimited free analysis.

## 13. Implementation boundary and acceptance

Source-implemented components include URL/pasted-text argument analysis, explicit unverified-output notices, versioned JSON analysis export, the graph protocol and gap audit, timed-transcript calculations, a journal, and the source-controlled technical paper. This consolidation adds a browser-local question notebook and a development index that points to canonical records.

Independent verification, complete six-dimensional media scoring, automatic audio/video processing, community review, authenticated evidence snapshots, persistent public report URLs, and calibrated confidence remain unimplemented. They must not be advertised as working simply because their contracts or documentation exist.

For a public beta, require strict formatting, lint, type checking, domain tests and a production build; render every public page at phone, tablet and desktop widths; inspect keyboard navigation and the visual artifacts; confirm the existing host is reachable; and run a real provider request with a non-sensitive sample. A successful environment-variable check alone is insufficient. Publish failures as failures. The canonical project profile carries prioritization and progress; the source and tests carry the implementation evidence.

## 14. Reproduction and criticism

The [repository](https://github.com/bitbaum/biaslens) contains the contracts, implementation, tests and this paper. The [Open Epistemic Method](/methodology) is versioned separately from this document. The [journal](/blog) explains selected design decisions. The [development index](/development) links original progress records and reviewed code changes.

To challenge a passage, identify its section and version, quote the disputed statement, supply a precise source or counterexample, explain the inference, and state what correction would address it. Useful criticism can also identify missing context or an unsuitable evaluation method. No institution, model, contributor or product name is exempt.

The practical standard is simple: readers should be able to inspect what supports an assessment, what does not, and why it might change. Where the evidence is unavailable, the interface must preserve that gap rather than manufacture certainty.
