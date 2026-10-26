# Changelog

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
