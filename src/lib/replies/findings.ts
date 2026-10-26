/**
 * The three findings a reply leads with, chosen in code by how surprising and
 * how checkable they are, not by the model's order. A receiver gives a link
 * about ten seconds; the first finding has to be one they did not notice and
 * can verify against a passage.
 *
 * Order of preference (higher first):
 *   an opinion presented as the article's finding (attribution),
 *   figures that disagree, polls without a sample, a party not heard,
 *   anonymous sources and one-sided voices, other techniques, the insight.
 */
import type { LocatedQuote } from '@/lib/analysis/quote-locate';
import { AUTHOR, type Report } from '@/lib/analysis/report';
import type { OutputLanguage } from '@/lib/config/languages';
import { replyCopy } from '@/lib/config/reply-copy';
import { techniqueName, type TechniqueId } from '@/lib/domain/techniques';

export interface Finding {
  id: string;
  kind: 'attribution' | 'detection' | 'figure' | 'balance' | 'missing' | 'insight';
  text: string;
  passage: LocatedQuote | null;
  weight: number;
  /** For attribution findings: the claim and who made it, used by "guess first". */
  attribution?: { claim: string; voiceId: string };
}

const TECHNIQUE_WEIGHT: Partial<Record<TechniqueId, number>> = {
  inconsistent_figures: 9,
  poll_without_sample: 8,
  missing_response: 8,
  anonymous_source: 7,
  headline_body_gap: 7,
  causal_leap: 6,
  number_without_base: 5,
  unattributed_assertion: 5,
  speculation_as_fact: 5,
};

function overlaps(a: LocatedQuote | null, b: LocatedQuote | null): boolean {
  return !!a && !!b && a.start < b.end && b.start < a.end;
}

export function rankFindings(report: Report, language: OutputLanguage): Finding[] {
  const copy = replyCopy(language);
  const candidates: Finding[] = [];

  for (const claim of report.claims) {
    if (
      claim.speaker === AUTHOR ||
      claim.support !== 'quoted_view' ||
      claim.type === 'factual' ||
      !claim.quote
    ) {
      continue;
    }
    const voice = report.voices.find((item) => item.id === claim.speaker);
    if (!voice) continue;
    const who = voice.affiliation ? `${voice.name} (${voice.affiliation})` : voice.name;
    // Strongest when the quoted view is the article's central claim.
    const central = report.centralClaim.speaker === voice.id;
    candidates.push({
      id: 'f-' + claim.id,
      kind: 'attribution',
      text: copy.attribution(claim.text, who),
      passage: claim.quote,
      weight: central ? 10 : 9.5,
      attribution: { claim: claim.text, voiceId: voice.id },
    });
  }

  for (const detection of report.detections) {
    candidates.push({
      id: 'f-' + detection.id,
      kind: 'detection',
      text: `${techniqueName(detection.technique, language)}: ${detection.explanation}`,
      passage: detection.quote,
      weight: TECHNIQUE_WEIGHT[detection.technique] ?? 4,
    });
  }

  for (const figure of report.figures) {
    const noSample = figure.kind === 'poll' && !figure.sampleSizeStated && !figure.marginStated;
    if (!noSample && figure.source) continue;
    candidates.push({
      id: 'f-' + figure.id,
      kind: 'figure',
      text: noSample
        ? copy.figureNoSample(figure.value, figure.about)
        : copy.figureNoSource(figure.value, figure.about),
      passage: figure.quote,
      weight: noSample ? 7.5 : 4.5,
    });
  }

  const { supports, opposes } = report.metrics.stanceCounts;
  if (report.metrics.oneSided) {
    const side = report.metrics.oneSided === 'supports' ? supports : opposes;
    candidates.push({
      id: 'f-balance',
      kind: 'balance',
      text: copy.oneSided(side, supports + opposes),
      passage: null,
      weight: 7,
    });
  }

  const missing = report.missingVoices[0];
  if (missing) {
    candidates.push({
      id: 'f-missing',
      kind: 'missing',
      text: copy.notHeard(missing.who, missing.why),
      passage: null,
      weight: 3,
    });
  }

  candidates.push({
    id: 'f-insight',
    kind: 'insight',
    text: report.insight.headline + ' ' + report.insight.explanation,
    passage: null,
    weight: 1,
  });

  // Highest weight first; a later finding about the same passage is dropped.
  const unique: Finding[] = [];
  for (const candidate of candidates.sort((a, b) => b.weight - a.weight)) {
    if (unique.some((item) => overlaps(item.passage, candidate.passage))) continue;
    unique.push(candidate);
  }
  // The three that lead are three different kinds of observation; the rest follow.
  const lead: Finding[] = [];
  const kinds = new Set<string>();
  for (const finding of unique) {
    const kind = finding.kind === 'detection' ? finding.text.split(':')[0]! : finding.kind;
    if (lead.length < 3 && !kinds.has(kind)) {
      lead.push(finding);
      kinds.add(kind);
    }
  }
  return [...lead, ...unique.filter((finding) => !lead.includes(finding))];
}

export interface Guess {
  question: string;
  options: { id: string; label: string }[];
  answerId: string;
  answerLabel: string;
}

/** "Who in the text says this?" from the first attribution finding, if any. */
export function guessFor(
  report: Report,
  findings: Finding[],
  language: OutputLanguage,
): Guess | null {
  const copy = replyCopy(language);
  const target = findings.find((finding) => finding.attribution);
  if (!target?.attribution) return null;
  const answer = report.voices.find((voice) => voice.id === target.attribution!.voiceId);
  if (!answer) return null;
  const authorLabel = report.byline.authors.length ? report.byline.authors.join(', ') : copy.author;
  const others = report.voices
    .filter((voice) => voice.id !== answer.id && voice.kind !== 'anonymous')
    .slice(0, 2);
  const options = [
    { id: AUTHOR, label: authorLabel },
    { id: answer.id, label: answer.name },
    ...others.map((voice) => ({ id: voice.id, label: voice.name })),
  ].sort((a, b) => a.label.localeCompare(b.label));
  return {
    question: copy.guessQuestion(target.attribution.claim),
    options,
    answerId: answer.id,
    answerLabel: answer.name,
  };
}
