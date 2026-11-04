# Changelog

## Unreleased — the latest on Today

- Today opens on headlines from public wires (BBC, NPR, Al Jazeera, The Guardian, SRF, DW, The Hill), newest first. Each line links to the publisher and to Examine. A wire that cannot be read is left out; nothing is invented to fill the gap. The lead investigation stays below.

## Unreleased — navigation, desk, settings

- One navigation: Today · Investigate · Examine · Rewrite · My desk, in the masthead on desktop and as a bottom tab bar on phones (`SiteTabBar` from `@bitbaum/sitekit` 0.5).
- `/investigations` lists featured investigations; each investigation can be followed.
- `/desk`: your investigations, links waiting for review, flagged sentences, follows and a visit streak (kept on this device).
- `/settings`: text size, reduced motion, and forgetting this device's edit links. Desk, Settings and Profile & security share one tab row.
## Unreleased — AI illustrations (off by default)

- Investigations can get an AI illustration, always badged "AI-generated", through the shared `@bitbaum/ai-kit/images` transport. Hidden until the server sets `IMAGE_GEN_API` and `IMAGE_GEN_MODEL`. Additive migration: new `GeneratedImage` table.

## Unreleased — Today page

- The home page is now Today: a dated masthead, the lead investigation with its stance balance, what changed since your last visit (with a visit streak kept on this device), evidence of the day, the claims under the most scrutiny, and the tools to start your own.
## Unreleased — fix flagged sentences, better photo results

- Sentences the citation check flags become "Fix this sentence" suggestions that rewrite only that sentence.
- Commons photo results are ranked by caption match; maps, logos and diagrams go last.
- docs/HANDOFF.md for whoever picks this up next.

## Unreleased — fix

- Saving from the editor after another change on the page (a review, a new version) no longer fails with a stale-revision conflict.

## Unreleased — reading mode, evidence cards, photo search

- Reading mode for the latest version: full-screen serif layout, progress bar, tap a source key to open its evidence in place.
- Evidence cards for every linked finding; whoever saved the investigation can mark a link reviewed or disputed.
- Photo search on Wikimedia Commons (open licences only), credit and licence filled in from the file page.
- Citation check splits list items; rewrites keep only [E#] citations (revise@1.2).
- Stance colours on the map and cards; times shown in Europe/Zurich.

## Unreleased — map, timeline, images

- Investigations show an animated epistemic map (claims in the middle, sources by side, one line per linked finding, coloured by stance; not a score).
- A methodology timeline lists capture, claims, sources by design tier, links (reviewed vs candidate) and each version with its citation check.
- Investigations can carry credited, openly licensed photos; AI images are labelled. The demo uses a CC BY 2.0 Wikimedia Commons photo.

## Unreleased — citation check

- Each rewritten version now gets a second pass that flags cited sentences saying more than their source; flags are shown on the version, not silently fixed (prompt revise@1.1).
- Version text renders headings and drops stray markdown asterisks.

## 2026-11-02 — Suggestions you can tap, sources from all sides, charts

### Added

- **What this article doesn't explain yet.** An investigation lists its gaps, found from the evidence map: a cause stated but not explained, only one side, no numbers, something left out, data that a chart would show faster. Each has one-tap actions (Explain it, Dig deeper into the reasons, Add the other side, Add the numbers, Add a chart) that write the next version of your article from the linked sources, every source sentence cited [E1], [E2]…
- **Every version kept.** The article's versions are listed newest first with the sentences added and removed, the sources that drove each version, the AI's change note (labelled) and the method version.
- **Sources from all sides.** Each source carries a tag (official statistics, international organisation, academic, market-urbanist, tenant-protection) and a balance bar shows the mix. The housing demo adds Diamond, McQuade & Qian (San Francisco), Glaeser & Gyourko, the NYU Furman Center, the Urban Institute, the OECD, Statistik Stadt Zürich and the BFS household budget survey.
- **Suggest sources from all sides** on every claim: candidates from OpenAlex (Crossref as fallback) under supporting, market, tenant and critical framings. A candidate is a lead until you read it and write down what it finds.
- **Charts** drawn with the shared chartkit: overburden by country, the EU trend since 2014, Zurich rents for non-profit and for-profit flats.

## 2026-11-02 — Rewrites that cite the evidence

### Added

- **Rewrite with an investigation's evidence.** Paste a saved investigation's link in the rewrite studio and the rewrite may cite its linked study findings, each marked [E1], [E2]… with design, place and horizon. A cited finding is not counted as an added fact; any other new fact still is.
- **What the original leaves out**, listed under every rewrite of the article.
- **First-principles economics** in evidence-backed rewrites: elasticity, the binding rule, short vs long run, identification and who bears the cost.
- **The Economist, Financial Times and Reason** as outlet voices, always labelled as simulations they did not write.

## 2026-11-02 — Multi-source investigations

### Added

- **An article, set against the studies.** A multi-source investigation links each claim in an article to specific findings in external studies, with the study's identification design, the horizon it measures (short or long run), a strength-of-evidence note and what would disconfirm the claim. Supporting, contradicting and context evidence sit side by side; where they seem to disagree, the page says whether they measure different horizons or places. No single bias or truth score.
- **First-principles questions for economic claims**: supply elasticity, the binding constraint, short versus long run, identification and who bears the cost.
- **Saved with its own link.** Save a copy, come back and add studies or notes; the edit key stays in your browser and a newer save is never overwritten silently.
- **A worked example**: Euronews on housing cost overburden (31 October 2026) with Eurostat, Hilber & Vermeulen, Greenaway-McGrevy & Phillips, Autor, Palmer & Pathak, Kholodilin, Elfert & Thomsen and a Rosario follow-up, at `/investigations/demo`.

## 2026-10-26 — One password field

### Changed

- **Signing up asks for the password once.** The repeat field is gone; an eye inside the password field shows what you typed instead (accountkit 0.8.0, the same in every product on it).

## 2026-10-26 — Say it instead of filling it in

### Changed

- **The research notebook is one box.** Say or type what you want to understand, or tap one of three examples, and the notebook sets out the question, its scope, the explanations to keep open and what would change your mind. Talk to the same box to change it ("only Switzerland", "add an economic explanation"), take a suggestion with one tap, or undo. Everything it wrote is marked as a draft and editable with a tap.
- **A source is a link.** Paste it and the page's title fills itself; "supports, challenges or context" is one tap, and where in the source is optional.
- **Speak to the article.** The chat under a report has a microphone that works in every browser, and its first suggestions are the questions the report itself raised.

## 2026-10-26 — shared signup safeguards

- Registration confirms the chosen password before submitting and offers show/hide controls. The shared account forms also include Spanish labels.

What changed for people using BiasLens, newest first.

## 2026-10-26 — Signing up takes an email and a password

### Changed

- **Nothing else is asked.** No display name, and a password needs 8 characters instead of 12, with no other rule. The same change reaches every product on the shared account package (accountkit 0.7.0), so signing up looks and works the same everywhere.

## 2026-10-26 — A neutral version adds nothing

### Fixed

- **No invented figures.** A neutral rewrite of an article that cites a poll without its sample once supplied a sample size and a margin of error the article never gave. A rewrite now says when the article leaves something out instead of filling the gap, and when the facts check finds an added fact the text is sent back once to remove it. The check shown is always the one of the text you read. Suggested rewordings in a report follow the same rule.

## 2026-10-26 — Who is speaking: profiles

### Added

- **Tap a name.** Authors, quoted people and the outlet in a report open a profile: occupation, employer, offices, recorded party membership, owner and the owner’s owner, founding year, and the opening of the Wikipedia article — every line linked to its source on Wikidata.
- **No guessing.** A name is linked only when the article’s own description of the person matches the record; when two people fit, the reader chooses. BiasLens adds no rating or label of its own, and every profile has a way to report a mistake.

## 2026-10-26 — Rewrite studio

### Added

- **The same facts, told another way.** Under every reading: rewrite the article as a neutral report, from one or two stated values (the smartvote dimensions), as a chosen outlet would have written it, or as a public figure might — or write a response to it from BiasLens, as a letter to the editor, or as your own reply.
- **Labels that cannot be lost.** Every text says who wrote it. An outlet or person is always marked “Simulation · not written by …”, and that label is written by BiasLens, not by the model.
- **Only public figures.** A person can be simulated only if Wikidata shows a public figure with a public body of work; private people never are, two people with the same name are not guessed between, and anyone can ask to be left out.
- **What the framing did to the facts.** A rewrite of the article is checked against the original: how many of its facts were kept, which were changed or left out, and any fact that was added.
- **Send it.** A rewrite can go out with a reply, and the person who receives it sees it with its label and the facts check.

## 2026-10-26 — Replies you can send

### Added

- **Every reading has a link.** A finished report is saved, without the article text, so it can be opened again and shared. The same text examined again opens the saved reading at once.
- **Send a reply.** Choose who it is for (a friend, a group chat, the author, a public post, a disagreement, a class), a length and what to include, and see exactly what will be sent before creating the link.
- **A page for the person who receives it.** It opens on their article and the three findings they can check against its own words, with an optional “guess first” question, the sender’s note and a way to reply back.
- **Share images.** Every reading and reply has a link preview image and downloadable square and story images that carry “AI reading · not a fact check” in the picture itself.
- **More ways in.** Put the BiasLens address in front of any article link, open `/analyze?u=` with a link, or install BiasLens and use “Share → BiasLens” from a news app on Android.

## 2026-10-26

### Added

- **Who is speaking.** Every report lists the people and organisations the article quotes or cites, how the article describes them and whether they support its main claim. The author is never listed as a source.
- **The text, marked up.** The article is shown with flagged passages highlighted. Tap one to see which technique it is, why it was flagged and a neutral wording.
- **A published technique catalogue.** Sixteen techniques, from a claim without a source to a poll without a sample size, each with what counts and what does not, on the method page.
- **The numbers.** Figures are listed with whether the article names a source, a sample size or a comparison, and figures that do not match each other are flagged.
- **PDFs.** Paste a link to a PDF, such as a press clipping, or upload one; its text appears in the paste box to check before examining.
- **Report in your language.** Headings and text follow the report language, including Swiss German with Swiss spelling, and the language is preselected from your browser.
- **Progress while it works.** The page says which step the examination is on.

### Changed

- **Claims belong to whoever made them.** An explanation offered by a quoted expert is shown as that expert’s, not the article’s.
- **Quotes survive copy-paste.** A passage is found even when quotation marks, dashes, spaces or line breaks differ; a changed word still fails.
- **No political labels.** BiasLens no longer applies left/right or similar labels in its own voice; the rule and its word list are on the method page.

### Fixed

- **Second sign-in factors apply everywhere.** An account with two-factor sign-in now asks for it whichever way the person signs in.

## 2026-10-25

### Added

- **Ask about the article.** A conversation under the report answers questions from the article's own text and shows the passage behind each answer.
- **Analysis language.** The report can be written in English, German or French, whatever language the article is in.

### Fixed

- **Account recovery.** Resetting a password and recovering an account now complete end to end.

## 2026-10-24

### Changed

- **One visual system.** Every BiasLens page uses the same type, spacing and controls, with clearer paths into examining a source, a question or a conversation.
- **Built on the shared fleet foundation.** Site header, footer, accounts and publishing come from the shared packages used across the fleet.
- **Consistent reports.** Reports follow the same structure whichever model or language produced them.

### Fixed

- **Long articles.** The article body is read before the length limit is applied, so long pages no longer lose their main text to navigation and boilerplate.

## 2026-10-23

### Added

- **Accounts.** Sign up and sign in with a password or a passkey and manage your profile.

### Changed

- **Article examination is easier to use.** Clearer input, progress and error states on the examination page.

## 2026-10-22

### Added

- **The open method, versioned.** The Open Epistemic Method was published with its limits, evidence requirements and a public challenge path.

- **Debate airtime.** Paste a timestamped transcript to see each speaker's speaking time and where speakers overlapped, computed in your browser.
- **Journal.** Essays on the method, with an RSS feed.

## 2026-10-21

### Added

- **Article analysis.** Examine an article from a link or pasted text. The report separates factual, value and causal claims and shows the passage behind each quoted claim.
- **Downloadable report.** Save the report with its method version and a digest of the exact text examined.
- **The open method.** A public description of how claims, evidence and causal links are examined, with a way to challenge it.

### Fixed

- **No false verification.** The evidence-counting demonstration is no longer presented as a fact check.
