'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { reportAnnotations, type AnnotationKind } from '@/lib/analysis/annotations';
import { glanceSentences } from '@/lib/analysis/glance';
import type { ArticleAnalysisResult } from '@/lib/analysis/run';
import { OUTPUT_LANGUAGES } from '@/lib/config/languages';
import { reportCopy } from '@/lib/config/report-copy';

import { AnnotatedText } from './AnnotatedText';
import { PassagePanel } from './PassagePanel';
import {
  ArgumentsSection,
  ClaimsSection,
  DetectionsSection,
  FiguresSection,
  VoicesSection,
} from './Sections';
import styles from './report.module.css';

export type ReportResult = Omit<ArticleAnalysisResult, 'sourceText'> & {
  sourceText: string | null;
};

/**
 * One report, rendered the same everywhere it appears: right after an
 * analysis, on its saved page and inside a reply. `actions` is where the page
 * puts its one primary action (Share), `after` holds the conversation.
 */
export function ReportView({
  result,
  actions,
  after,
}: {
  result: ReportResult;
  actions?: ReactNode;
  after?: ReactNode;
}) {
  const { report, language } = result;
  const copy = reportCopy(language);
  const annotations = useMemo(() => reportAnnotations(report), [report]);
  const counts = useMemo(() => {
    const value = { detection: 0, voice: 0, claim: 0, figure: 0 } as Record<AnnotationKind, number>;
    for (const annotation of annotations) value[annotation.kind]++;
    return value;
  }, [annotations]);
  const [visible, setVisible] = useState<Set<AnnotationKind>>(new Set(['detection', 'voice']));
  const [selected, setSelected] = useState<string[]>([]);

  const show = useCallback(
    (annotationId: string) => {
      const annotation = annotations.find((item) => item.id === annotationId);
      if (!annotation) return;
      setVisible((current) => new Set([...current, annotation.kind]));
      setSelected([annotationId]);
      window.setTimeout(() => {
        const element = document.querySelector(`[data-annotations~="${annotationId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 30);
    },
    [annotations],
  );

  const selectedAnnotations = annotations.filter((annotation) => selected.includes(annotation.id));
  const originLine =
    result.origin.kind === 'retrieved-page'
      ? copy.origin.page
      : result.origin.kind === 'retrieved-pdf'
        ? copy.origin.pdf
        : result.origin.url
          ? copy.origin.pastedWithUrl
          : copy.origin.pasted;
  const byline = [
    report.byline.authors.join(', '),
    report.byline.publication,
    formatDate(report.byline.date),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={styles.report}
      lang={OUTPUT_LANGUAGES[language].html}
      aria-label={report.title}
    >
      <header className={styles.masthead}>
        <p className={styles.note}>{copy.aiNote}</p>
        <p className={styles.genre}>{copy.genre[report.genre]}</p>
        <h2 className={styles.title}>{report.title}</h2>
        {byline && <p className={styles.byline}>{byline}</p>}
        <p className={styles.meta}>
          {originLine}
          {report.byline.source === 'page-metadata' && ' · ' + copy.bylineFromPage}
        </p>
        {result.origin.url && (
          <a className={styles.textLink} href={result.origin.url} target="_blank" rel="noreferrer">
            {copy.openSource} →
          </a>
        )}
        {result.origin.truncated && <p className={styles.warning}>{copy.truncated}</p>}
      </header>

      <section className={styles.glance} aria-label={copy.sections.glance}>
        <h3 className={styles.kicker}>{copy.sections.glance}</h3>
        <p>{glanceSentences(report, language).join(' ')}</p>
        <p className={styles.summary}>{report.summary}</p>
      </section>

      {actions && <div className={styles.actions}>{actions}</div>}

      <section className={styles.insight} aria-label={copy.sections.keyAssumption}>
        <p className={styles.kicker}>{copy.sections.keyAssumption}</p>
        <h3>{report.insight.headline}</h3>
        <p>{report.insight.explanation}</p>
        <div className={styles.twoUp}>
          <div>
            <h4>{copy.sections.assumption}</h4>
            <p>{report.insight.assumption}</p>
          </div>
          <div>
            <h4>{copy.sections.test}</h4>
            <p>{report.insight.test}</p>
          </div>
        </div>
      </section>

      <nav className={styles.jump} aria-label={copy.jump}>
        {result.sourceText && <a href="#report-text">{copy.nav.article}</a>}
        <a href="#report-voices">{copy.nav.voices}</a>
        <a href="#report-figures">{copy.nav.figures}</a>
        <a href="#report-claims">{copy.nav.claims}</a>
        <a href="#report-arguments">{copy.nav.arguments}</a>
      </nav>

      {result.sourceText && (
        <section id="report-text" className={styles.section}>
          <h3>{copy.sections.article}</h3>
          <AnnotatedText
            text={result.sourceText}
            annotations={annotations}
            visible={visible}
            onToggle={(kind) =>
              setVisible((current) => {
                const next = new Set(current);
                if (next.has(kind)) next.delete(kind);
                else next.add(kind);
                return next;
              })
            }
            selected={selected[0] ?? null}
            onSelect={setSelected}
            counts={counts}
            copy={copy}
          />
          <PassagePanel
            annotations={selectedAnnotations}
            report={report}
            language={language}
            copy={copy}
            onClose={() => setSelected([])}
          />
        </section>
      )}

      <DetectionsSection report={report} language={language} copy={copy} onShow={show} />
      <VoicesSection report={report} copy={copy} onShow={show} />
      <FiguresSection report={report} copy={copy} onShow={show} />
      <ClaimsSection report={report} copy={copy} onShow={show} />
      <ArgumentsSection report={report} copy={copy} />

      {after}

      <details className={styles.provenance}>
        <summary>{copy.sections.provenance}</summary>
        <p>
          {copy.provenance.grounded(report.quality.groundedQuotes, report.quality.proposedQuotes)}
        </p>
        {report.quality.droppedItems > 0 && (
          <p>{copy.provenance.dropped(report.quality.droppedItems)}</p>
        )}
        <p>
          Method {result.run.methodVersion} · Prompt {result.run.promptVersion} ·{' '}
          {result.run.passes.map((pass) => `${pass.pass}: ${pass.modelId ?? '—'}`).join(' · ')} ·{' '}
          {result.run.generatedAt}
        </p>
        <p>
          {copy.provenance.digest}: <code>{result.origin.textSha256}</code>
        </p>
        <p>{copy.provenance.notStored}</p>
        <Link className={styles.textLink} href="/methodology">
          {copy.provenance.challenge} →
        </Link>
      </details>
    </article>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}
