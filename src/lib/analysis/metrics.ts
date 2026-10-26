/**
 * Measurements computed in code from a grounded report. Each is a pure
 * function documented on /methodology, so a reader can recompute it.
 */
import type { Detection, Figure, Metrics, Stance, Voice } from './report';

/** One-sidedness: at least `minKnown` voices with a known stance, `share` on one side. */
export const ONE_SIDED = { minKnown: 3, share: 0.8 } as const;

const STANCE_KEYS: Stance[] = ['supports', 'opposes', 'mixed', 'neutral', 'unclear'];

function zero(): Record<Stance, number> {
  return { supports: 0, opposes: 0, mixed: 0, neutral: 0, unclear: 0 };
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Characters inside quotation marks, as a share of the whole text. */
export function quotedShare(text: string): number {
  if (!text.length) return 0;
  let inside = 0;
  for (const match of text.matchAll(/[„“"«‹]([^„“”"«»‹›]{3,1200})[“”"»›]/gu)) {
    inside += match[1]!.length;
  }
  return Math.min(1, inside / text.length);
}

export function computeMetrics(input: {
  text: string;
  voices: Voice[];
  figures: Figure[];
  detections: Detection[];
}): Metrics {
  const stanceCounts = zero();
  const quotedWordsByStance = zero();
  for (const voice of input.voices) {
    stanceCounts[voice.stance]++;
    quotedWordsByStance[voice.stance] += voice.quotes.reduce(
      (sum, quote) => sum + words(quote.text),
      0,
    );
  }
  const known = stanceCounts.supports + stanceCounts.opposes;
  let oneSided: Metrics['oneSided'] = null;
  if (known >= ONE_SIDED.minKnown) {
    if (stanceCounts.supports / known >= ONE_SIDED.share) oneSided = 'supports';
    else if (stanceCounts.opposes / known >= ONE_SIDED.share) oneSided = 'opposes';
  }
  const detectionCounts: Metrics['detectionCounts'] = {};
  for (const detection of input.detections) {
    detectionCounts[detection.technique] = (detectionCounts[detection.technique] ?? 0) + 1;
  }
  return {
    voices: input.voices.length,
    stanceCounts,
    quotedWordsByStance,
    quotedShare: Math.round(quotedShare(input.text) * 100) / 100,
    anonymousVoices: input.voices.filter((voice) => voice.kind === 'anonymous').length,
    figures: input.figures.length,
    figuresWithoutSource: input.figures.filter((figure) => !figure.source).length,
    pollsWithoutSample: input.figures.filter(
      (figure) => figure.kind === 'poll' && !figure.sampleSizeStated && !figure.marginStated,
    ).length,
    detectionCounts,
    oneSided,
    missingResponse: input.detections.some(
      (detection) => detection.technique === 'missing_response',
    ),
  };
}

export { STANCE_KEYS };
