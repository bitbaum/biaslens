/**
 * Turn a report's located passages into marks on the examined text. Pure, so
 * the overlapping-range logic is tested without a browser.
 */
import type { Report } from './report';

export type AnnotationKind = 'detection' | 'voice' | 'claim' | 'figure';

export const ANNOTATION_KINDS: AnnotationKind[] = ['detection', 'voice', 'claim', 'figure'];

/** When marks overlap, the flag a reader most needs to see wins the colour. */
const PRIORITY: Record<AnnotationKind, number> = { detection: 0, figure: 1, claim: 2, voice: 3 };

export interface Annotation {
  id: string;
  kind: AnnotationKind;
  /** Id of the report item this mark belongs to. */
  itemId: string;
  start: number;
  end: number;
}

export function reportAnnotations(report: Report): Annotation[] {
  const annotations: Annotation[] = [];
  for (const detection of report.detections) {
    annotations.push({
      id: 'a-' + detection.id,
      kind: 'detection',
      itemId: detection.id,
      ...span(detection.quote),
    });
  }
  for (const voice of report.voices) {
    voice.quotes.forEach((quote, index) =>
      annotations.push({
        id: `a-${voice.id}-${index}`,
        kind: 'voice',
        itemId: voice.id,
        ...span(quote),
      }),
    );
  }
  for (const claim of report.claims) {
    if (claim.quote)
      annotations.push({
        id: 'a-' + claim.id,
        kind: 'claim',
        itemId: claim.id,
        ...span(claim.quote),
      });
  }
  for (const figure of report.figures) {
    if (figure.quote)
      annotations.push({
        id: 'a-' + figure.id,
        kind: 'figure',
        itemId: figure.id,
        ...span(figure.quote),
      });
  }
  return annotations;
}

function span(quote: { start: number; end: number }) {
  return { start: quote.start, end: quote.end };
}

export interface Segment {
  start: number;
  end: number;
  /** Covering annotations, highest priority first. Empty for plain text. */
  annotations: Annotation[];
}

export function segmentText(length: number, annotations: Annotation[]): Segment[] {
  const valid = annotations.filter((a) => a.start >= 0 && a.end <= length && a.end > a.start);
  const cuts = new Set<number>([0, length]);
  for (const annotation of valid) {
    cuts.add(annotation.start);
    cuts.add(annotation.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const covering = valid
      .filter((annotation) => annotation.start <= start && annotation.end >= end)
      .sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]);
    const previous = segments.at(-1);
    // Merge neighbours with the same cover so one passage is one mark.
    if (previous && sameCover(previous.annotations, covering)) previous.end = end;
    else segments.push({ start, end, annotations: covering });
  }
  return segments;
}

function sameCover(a: Annotation[], b: Annotation[]): boolean {
  return a.length === b.length && a.every((item, index) => item.id === b[index]!.id);
}
