'use client';

import Link from 'next/link';

import type { Annotation } from '@/lib/analysis/annotations';
import type { Report } from '@/lib/analysis/report';
import type { OutputLanguage } from '@/lib/config/languages';
import type { ReportCopy } from '@/lib/config/report-copy';
import { techniqueName, techniqueShort } from '@/lib/domain/techniques';

import { speakerName } from './speaker';
import styles from './report.module.css';

/**
 * What a marked passage means. Pinned to the bottom of the screen while the
 * marked text is in view, so a reader on a phone never loses their place.
 */
export function PassagePanel({
  annotations,
  report,
  language,
  copy,
  onClose,
}: {
  annotations: Annotation[];
  report: Report;
  language: OutputLanguage;
  copy: ReportCopy;
  onClose(): void;
}) {
  if (!annotations.length) return null;
  return (
    <aside className={styles.panel} aria-live="polite" aria-label={copy.why}>
      <div className={styles.panelBody}>
        {annotations.map((annotation) => (
          <PanelItem
            key={annotation.id}
            annotation={annotation}
            report={report}
            language={language}
            copy={copy}
          />
        ))}
      </div>
      <button type="button" className={styles.panelClose} onClick={onClose}>
        {copy.close}
      </button>
    </aside>
  );
}

function PanelItem({
  annotation,
  report,
  language,
  copy,
}: {
  annotation: Annotation;
  report: Report;
  language: OutputLanguage;
  copy: ReportCopy;
}) {
  if (annotation.kind === 'detection') {
    const detection = report.detections.find((item) => item.id === annotation.itemId);
    if (!detection) return null;
    return (
      <section className={styles.panelItem}>
        <p className={styles.kicker}>{copy.filters.detection}</p>
        <h4>{techniqueName(detection.technique, language)}</h4>
        <p className={styles.muted}>{techniqueShort(detection.technique, language)}</p>
        <p>{detection.explanation}</p>
        {detection.alternative && (
          <p>
            <strong>{copy.neutralWording}: </strong>
            {detection.alternative}
          </p>
        )}
        <Link className={styles.textLink} href={'/methodology#t-' + detection.technique}>
          {copy.definition} →
        </Link>
      </section>
    );
  }
  if (annotation.kind === 'voice') {
    const voice = report.voices.find((item) => item.id === annotation.itemId);
    if (!voice) return null;
    return (
      <section className={styles.panelItem}>
        <p className={styles.kicker}>{copy.filters.voice}</p>
        <h4>{voice.name}</h4>
        {voice.affiliation && <p className={styles.muted}>{voice.affiliation}</p>}
        <p>
          {copy.stanceToClaim}: <strong>{copy.stance[voice.stance]}</strong>
        </p>
      </section>
    );
  }
  if (annotation.kind === 'claim') {
    const claim = report.claims.find((item) => item.id === annotation.itemId);
    if (!claim) return null;
    return (
      <section className={styles.panelItem}>
        <p className={styles.kicker}>
          {copy.claimType[claim.type]} · {speakerName(claim.speaker, report, copy)}
        </p>
        <p>{claim.text}</p>
        <p className={styles.muted}>{copy.support[claim.support]}</p>
      </section>
    );
  }
  const figure = report.figures.find((item) => item.id === annotation.itemId);
  if (!figure) return null;
  return (
    <section className={styles.panelItem}>
      <p className={styles.kicker}>{copy.filters.figure}</p>
      <h4>{figure.value}</h4>
      {figure.about && <p className={styles.muted}>{figure.about}</p>}
      <FigureFlags figure={figure} copy={copy} />
    </section>
  );
}

export function FigureFlags({
  figure,
  copy,
}: {
  figure: Report['figures'][number];
  copy: ReportCopy;
}) {
  const flags = [
    !figure.source && copy.figureFlags.noSource,
    figure.kind === 'poll' &&
      !figure.sampleSizeStated &&
      !figure.marginStated &&
      copy.figureFlags.noSample,
    !figure.comparisonGiven && copy.figureFlags.noComparison,
  ].filter(Boolean) as string[];
  return (
    <p className={styles.flags}>
      {figure.source && (
        <span>
          {copy.figureFlags.source}: {figure.source}
        </span>
      )}
      {flags.map((flag) => (
        <span key={flag} className={styles.flag}>
          {flag}
        </span>
      ))}
    </p>
  );
}
