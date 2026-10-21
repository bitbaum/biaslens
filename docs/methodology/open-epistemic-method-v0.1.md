# Open Epistemic Method 0.1 — how to investigate a claim

**Status:** public, provisional methodology; not a certification of factual truth.
**Scope:** a reusable evidence and reasoning protocol. This is *not* a second
product vision, mission, roadmap or changelog: those live in the canonical
Loki project profile and Fleet register.

The objective is to help people investigate and challenge claims about the
present, past and possible future, without replacing one authority with
another. This is a public invitation to improve the method. Published material
should link to the version of the method actually used to produce it.

The [tested TypeScript contract](../../src/lib/domain/epistemic-graph.ts)
represents claims, evidence, individual relationships and challenges; it
deliberately **cannot calculate a universal "truth %"**.

## 1. What "truth" means here

- Reality is not defined by a vote, institution, publication, model or fact-checker.
- A **claim** is a precise, contextual assertion that may be true or false, or
  a normative judgement that cannot be settled with empirical evidence alone.
- **Evidence** is a record bearing on a claim: a primary document, measurement,
  experiment, recording, testimony or an analysis. It can be fabricated,
  partial, biased, erroneous, or incorrectly interpreted.
- **Confidence** is an estimate about uncertainty, not the number of links
  found. Do not emit a numerical probability without a documented and
  empirically tested calibration method.
- A **historical claim** depends on source provenance, dating, material record,
  authorship, independent corroboration and comparison of alternative accounts.
  Contemporary publicity and elite sponsorship are hypotheses to investigate,
  not presumptions that a text is false.
- A **normative claim** (what should be) must state its values and trade-offs,
  while factual premises may still be tested.
- A **causal claim** requires a counterfactual or identification strategy.
  Correlation, temporal succession, consensus and narrative coherence do not
  prove causation.
- **Unknown** and **could not investigate** are distinct states. No search
  results, model failure, paywall or absent source is not evidence of falsity.

## 2. The method (an open protocol, not a final arbiter)

1. **Capture.** Save canonical URL, title, author, date, context, language,
   relevant quotes and, where lawful, an immutable digest of the source.
   Differentiate event time, publication time, retrieval time and review time.
2. **Disambiguate.** Separate factual, historical, causal, predictive and
   normative components; specify terms, scope, affected population, place and
   period. Split composite assertions into atomic propositions.
3. **Seek disconfirmation.** Record what observations *would make the claim
   false*, which measurements would distinguish competing theories, and what
   evidence would change each side's mind.
4. **Retrieve & attribute.** Prefer primary records where they actually
   establish the event/measurement. Secondary analysis can add context.
   Check whether multiple articles are copying one underlying source.
5. **Evaluate evidence.** Examine authenticity, chain of custody, methods,
   sample selection, missing data, incentives, alternative explanations and
   conflicts of interest. Do not rank claims merely by the prestige of their
   authors or the unpopularity of their conclusions.
6. **Make edges explicit.** In a claim graph, every relationship is an
   independent assertion. "A affects B" and "B affects C" do not by themselves
   establish an identified causal effect of A on C. Show unreviewed edges
   differently from reviewed source-backed edges.
7. **Separate fact from framing.** Truth checking asks whether a proposition
   matches evidence; BiasLens additionally examines omissions, salience,
   editorial selection, rhetoric, speaker time, interruption patterns and
   conflicting framing. A factually correct piece can be selective; an
   opinionated piece may still contain sound factual claims.
8. **Conclude modestly.** Show exact support, contradictions, competing
   interpretations, sensitivity to assumptions, unresolved questions and
   method limitations. Reserve "supported" for claims whose verification rule
   actually qualifies them. Never label a person a liar based only on an
   incorrect claim, inferred motive or ideological history.
9. **Invite challenge.** Anyone able to post through the current public issue
   channel can propose counterevidence, a different interpretation, a missing
   causal variable or a change to the protocol. Publish the original objection,
   any AI-generated response labelled as AI, the human disposition and a
   correction history. Do not delete valid dissent merely because the author
   disagrees with the official assessment.
10. **Version & replay.** Preserve sources, claim graph, review events,
    algorithm version, prompts, model versions, timestamps and human decisions
    sufficient to reproduce or explain differences. Link earlier assessments
    instead of silently replacing them.

## 3. Worked economic example — a claim is a network

Question: **Does a flat tax cause faster long-term economic growth?**

Potential hypothesis chain:

- Flat tax → lower tax-administration complexity / changed marginal incentives.
- These changes → improved business environment, suitably defined
  (e.g. incorporation rates, compliance cost, permitting time).
- Better business environment → higher productive investment.
- Higher investment → higher real GDP growth over a defined horizon.

Every arrow is a distinct *causal hypothesis*. Each needs its own evidence
and identification, including the possibility of confounders (trade, monetary
conditions, prior growth, institutional reform, demography and tax-base changes).

Competing paths must also be retained, e.g. flat tax → changes in fiscal
revenue → changes in infrastructure provision → possible changes in growth.
"Business environment" may not be the same construct in two datasets.
A jurisdiction selecting a flat tax may already have different institutions.

Do **not** infer a proven policy effect by multiplying unsupported arrows,
drawing a beautiful graph, or finding more articles repeating the same claim.
Substrata's existing evidence-labelled *entity relations* are a useful design
precedent; epistemic **claim relations** add method-specific tests and dissent.

## 4. Historical inquiry

Historical sources are not automatically true because they survive in an
archive, nor automatically false because they were preserved by an institution.
For a disputed event, track original manuscripts or inscriptions, copies and
translations, archaeological evidence, provenance, date ranges, contemporary
sources, later narratives and what each account could have known.

Separate: (a) whether an individual existed, (b) what they plausibly did,
(c) whether attributed texts were contemporaneous, and (d) the theological,
political or moral interpretations built around them. These are different
questions with different kinds of evidence.

Absence of surviving records can leave a question unsettled; it does not
justify inventing a convenient counter-history. Likewise, historical
correction should preserve the previous claim and the reasons for revising it.

## 5. Public challenges, moderation and AI participation

- Method changes follow **proposal → criticism → counterexamples/tests →
  response → accepted/rejected/unresolved decision → versioned release**.
- Publish challenges and responses by default *where the contributor chooses
  public publication*; private requests and personal information are redacted.
  No automatic AI response may impersonate the submitter or a qualified reviewer.
- AI may propose decompositions, identify missing evidence and draft an answer;
  it must label uncertainty, disclose its model/prompt version and cite reviewed
  records. An AI response is **not** a resolution of the objection.
- Do not permit coordinated brigading, threats, doxxing or repeated spam.
  Moderation rules address abuse and privacy, not ideological disagreement.
- Every factual report includes a **"Challenge this claim"** path and, later,
  immutable correction/appeal events. GitHub issues are the initial
  contribution channel, not a substitute for an eventual account-based
  review system using the Fleet's accountkit/threadkit/chatkit.

## 6. Explicit limitations of v0.1

- The implementation only validates graph structure and reports review-state
  gaps. It does **not** browse sources, validate authenticity, estimate
  independent causal effects, calibrate probabilities or determine historical
  truth automatically.
- A reviewed input means a source locator was reviewed; it does not mean the
  underlying proposition is true.
- Source review can contain error or bias. Method and reviewer assessments
  must therefore remain challengeable.
- A copy of an article stored without consent could create copyright, privacy
  or database-rights concerns. Keep minimal excerpts, metadata and lawful
  snapshots as appropriate.
- Historical accounts can conflict for legitimate reasons and remain
  unresolved. True neutrality is applying the same standards, not allocating
  equal weight to weak and strong evidence.

## 7. How to propose improvements

Use the public GitHub [methodology challenge template](../../.github/ISSUE_TEMPLATE/methodology-challenge.yml)
to describe the claim or rule in question, an observed failure mode, the
strongest counterexample, and an empirical acceptance test. Link primary
sources where possible. The method's files, tests, future AI evaluations
and version history are open for inspection and pull requests.

The intended licensing direction is openly reusable implementation code,
compatible with the existing MIT-licensed repository. Names and marks can be
protected separately; a patent should not be presumed necessary or obtainable
for an abstract epistemic protocol.

## 8. Fleet architecture boundaries

- **BiasLens**: the one public product; fact analysis, framing and narrative
  analysis, historical review, debates, challenges.
- **Truth Seeker**: the earlier analysis implementation being integrated, not
  a competing public application once migration parity is achieved.
- **Substrata**: owns its geoeconomic corpus and entity relationships; it may
  consume a reusable claim/evidence contract without moving its database
  into BiasLens. Never replace Substrata's existing evidence vocabulary by
  copying a second schema into its repo.
- **Loki**: owns work orchestration and the canonical product identity,
  six identity fields, roadmap and changelog. **Bitbaum** renders the reviewed
  catalogue from canonical Fleet sources. **OrangeCat** supports public
  funding and disclosure as appropriate.
- **Existing packages**: use `@bitbaum/ai-kit` for models/search/grounding,
  `@bitbaum/accountkit` for accounts, `@bitbaum/chatkit` for AI conversations,
  `threadkit` for moderated human/AI threads, `bip-kit` for public
  development entries, `@bitbaum/searchkit` for discovery, `limitkit` for
  rate limiting, and shared design tokens where branding requires them.
  Do not install a package before the feature needing it is present.
- **Future package**: after two real consumers have validated this contract,
  extract the stable pure claim-graph protocol into one independently versioned
  Fleet package through the canonical `registers/package-repos.json` path.
  Avoid creating another half-maintained repository prematurely.
