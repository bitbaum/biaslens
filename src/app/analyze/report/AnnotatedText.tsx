'use client';

import { useMemo } from 'react';

import {
  ANNOTATION_KINDS,
  segmentText,
  type Annotation,
  type AnnotationKind,
} from '@/lib/analysis/annotations';
import type { ReportCopy } from '@/lib/config/report-copy';

import styles from './report.module.css';

const MARK_CLASS: Record<AnnotationKind, string> = {
  detection: styles.markDetection!,
  voice: styles.markVoice!,
  claim: styles.markClaim!,
  figure: styles.markFigure!,
};

export function AnnotatedText({
  text,
  annotations,
  visible,
  onToggle,
  selected,
  onSelect,
  counts,
  copy,
}: {
  text: string;
  annotations: Annotation[];
  visible: Set<AnnotationKind>;
  onToggle(kind: AnnotationKind): void;
  selected: string | null;
  onSelect(annotationIds: string[]): void;
  counts: Record<AnnotationKind, number>;
  copy: ReportCopy;
}) {
  const shown = useMemo(
    () => annotations.filter((annotation) => visible.has(annotation.kind)),
    [annotations, visible],
  );
  const segments = useMemo(() => segmentText(text.length, shown), [text.length, shown]);

  return (
    <div className={styles.annotated}>
      <div className={styles.chipRow} role="group" aria-label={copy.sections.article}>
        {ANNOTATION_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={styles.chip}
            aria-pressed={visible.has(kind)}
            onClick={() => onToggle(kind)}
          >
            <span className={`${styles.chipSwatch} ${MARK_CLASS[kind]}`} aria-hidden="true">
              Aa
            </span>
            {copy.filters[kind]} <span className={styles.count}>{counts[kind]}</span>
          </button>
        ))}
      </div>
      <p className={styles.hint}>{copy.articleHint}</p>
      <div className={styles.articleText}>
        {segments.map((segment) => {
          const content = text.slice(segment.start, segment.end);
          const top = segment.annotations[0];
          if (!top) return <span key={segment.start}>{content}</span>;
          const ids = segment.annotations.map((annotation) => annotation.id);
          return (
            <mark
              key={segment.start}
              data-annotations={ids.join(' ')}
              className={`${styles.mark} ${MARK_CLASS[top.kind]} ${
                selected && ids.includes(selected) ? styles.markSelected : ''
              }`}
              role="button"
              tabIndex={0}
              aria-label={copy.filters[top.kind] + ': ' + content.slice(0, 80)}
              onClick={() => onSelect(ids)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(ids);
                }
              }}
            >
              {content}
            </mark>
          );
        })}
      </div>
    </div>
  );
}
