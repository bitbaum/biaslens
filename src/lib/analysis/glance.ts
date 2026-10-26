/**
 * The "at a glance" sentences, built in code from measured values rather than
 * written by a model, so the numbers in them are the numbers in the report.
 */
import type { OutputLanguage } from '@/lib/config/languages';
import { reportCopy } from '@/lib/config/report-copy';

import type { Report } from './report';

export function glanceSentences(report: Report, language: OutputLanguage): string[] {
  const copy = reportCopy(language);
  const { metrics } = report;
  const sentences = [copy.glance.genre(copy.genre[report.genre])];
  if (metrics.voices === 0) {
    sentences.push(copy.glance.noVoices);
  } else {
    const { supports, opposes } = metrics.stanceCounts;
    sentences.push(
      copy.glance.voices(metrics.voices, supports, opposes, metrics.voices - supports - opposes),
    );
    if (metrics.oneSided) sentences.push(copy.glance.oneSided);
    if (metrics.anonymousVoices) sentences.push(copy.glance.anonymous(metrics.anonymousVoices));
  }
  if (metrics.figures) {
    sentences.push(copy.glance.figures(metrics.figures, metrics.figuresWithoutSource));
    if (metrics.pollsWithoutSample) sentences.push(copy.glance.polls(metrics.pollsWithoutSample));
    const pair = metrics.sameSourceFigures?.[0];
    const flagged = report.detections.some((d) => d.technique === 'inconsistent_figures');
    if (pair && !flagged) {
      const [a, b] = pair.map((id) => report.figures.find((figure) => figure.id === id)!.value);
      sentences.push(copy.glance.sameSource(a!, b!));
    }
  }
  if (metrics.missingResponse) sentences.push(copy.glance.missingResponse);
  sentences.push(
    report.detections.length
      ? copy.glance.detections(report.detections.length)
      : copy.glance.noDetections,
  );
  return sentences;
}
