'use client';

import Link from 'next/link';
import { HeroSection } from '@bitbaum/sitekit/react';

import { useState, useRef, type FormEvent } from 'react';

import { EXAMPLE_ARTICLE } from '@/lib/analysis/example';
import type { ArticleAnalysisResult } from '@/lib/analysis/run';

import styles from './analyze.module.css';

type Mode = 'url' | 'text';

const CLAIM_LABELS = {
  factual: 'Factual assertion',
  normative: 'Value judgement',
  causal: 'Causal hypothesis',
} as const;

const MIN_TEXT_LENGTH = 200;

export function AnalyzeWorkspace() {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [report, setReport] = useState<ArticleAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceFailed, setSourceFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canSubmit = mode === 'url' ? url.trim().length > 0 : text.trim().length >= MIN_TEXT_LENGTH;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    setSourceFailed(false);
    setReport(null);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: mode === 'text' ? text : undefined,
        }),
      });
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object') {
        throw new Error('The service returned an invalid response.');
      }
      const result = payload as {
        ok?: boolean;
        result?: ArticleAnalysisResult;
        error?: { code?: string; message?: string };
      };
      if (!response.ok || !result.ok || !result.result) {
        setSourceFailed(
          ['SOURCE_UNAVAILABLE', 'SOURCE_TOO_SHORT'].includes(result.error?.code || ''),
        );
        throw new Error(result.error?.message || 'The article could not be analysed.');
      }
      setReport(result.result);
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        reportRef.current?.focus({ preventScroll: true });
      }, 50);
    } catch (reason) {
      setError(
        controller.signal.aborted
          ? 'Examination stopped. Your article is still here.'
          : reason instanceof Error
            ? reason.message
            : 'Could not reach the service.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <HeroSection
          appearance="application"
          section={{
            kind: 'hero',
            eyebrow: 'Article examination / Beta',
            statement: 'Read between the lines.',
            lead: [
              'Drop in an article. See its argument, uncover the assumptions, and discover the question that changes how you read it.',
            ],
          }}
        />

        <section className={styles.tool} aria-label="Analyse an article">
          <div
            className={`${styles.modeSwitch} bb-choice-row`}
            role="group"
            aria-label="Choose source format"
          >
            <button
              type="button"
              className={mode === 'url' ? styles.activeMode : styles.modeButton}
              disabled={busy}
              aria-pressed={mode === 'url'}
              onClick={() => {
                setMode('url');
                setError(null);
              }}
            >
              Article URL
            </button>
            <button
              type="button"
              className={mode === 'text' ? styles.activeMode : styles.modeButton}
              disabled={busy}
              aria-pressed={mode === 'text'}
              onClick={() => {
                setMode('text');
                setError(null);
              }}
            >
              Paste article text
            </button>
          </div>
          <div className={styles.exampleRow}>
            <span>Bring your own article, or start with a fictional practice story.</span>
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                setMode('text');
                setUrl('');
                setText(EXAMPLE_ARTICLE);
                setReport(null);
                setError(null);
              }}
              disabled={busy}
            >
              Load practice article →
            </button>
          </div>
          <form onSubmit={submit} className={styles.form}>
            <label className={styles.fieldLabel} htmlFor="article-url">
              {mode === 'url' ? 'Article URL' : 'Source URL (optional, supplied by you)'}
            </label>
            <input
              id="article-url"
              disabled={busy}
              className={`${styles.input} bb-control`}
              type="url"
              placeholder="https://example.com/news/article"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setReport(null);
              }}
              required={mode === 'url'}
              maxLength={2048}
              autoComplete="url"
            />

            {mode === 'text' && (
              <>
                <label className={styles.fieldLabel} htmlFor="article-text">
                  Article body
                </label>
                <textarea
                  id="article-text"
                  disabled={busy}
                  className={`${styles.textarea} bb-control`}
                  placeholder="Paste at least 200 characters. Useful when the publisher requires a login or blocks automated fetching."
                  rows={9}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setReport(null);
                  }}
                  minLength={MIN_TEXT_LENGTH}
                  maxLength={30_000}
                  required
                />
                <p className={styles.hint}>
                  {text.trim().length.toLocaleString()} / 30,000 characters. If you supply a URL, we
                  will not independently check that your pasted text matches it.
                </p>
              </>
            )}

            <div className={`${styles.formBottom} bb-actions`}>
              <button
                className={`${styles.submit} bb-button bb-button--primary`}
                type="submit"
                disabled={!canSubmit || busy}
              >
                {busy ? 'Examining…' : 'Examine article →'}
              </button>
              <p className={styles.hint}>
                This tool analyses arguments; it does not certify their truth or make accusations
                about authors.
              </p>
            </div>
          </form>

          <div role="status" aria-live="polite">
            {busy && (
              <div className={styles.progress}>
                <p>Tracing claims, checking passages, finding the hinge of the argument…</p>
                <p className={styles.hint}>
                  Usually takes 15–60 seconds. Your article is sent to our model provider for
                  analysis.
                </p>
                <button
                  type="button"
                  className={styles.pasteFallback}
                  onClick={() => abortRef.current?.abort()}
                >
                  Stop examination
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className={styles.error}>
                <strong>Analysis unavailable</strong>
                <p>{error}</p>
                {mode === 'url' && sourceFailed && (
                  <button
                    type="button"
                    className={styles.pasteFallback}
                    onClick={() => setMode('text')}
                  >
                    Paste article text instead →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <div ref={reportRef} tabIndex={-1} className={styles.reportTarget}>
          {report ? <AnalysisReport report={report} /> : <AboutAnalysis />}
        </div>
      </main>
    </>
  );
}

function AboutAnalysis() {
  return (
    <section className={styles.about}>
      <h2>A structure to question, not an answer to obey.</h2>
      <div className={styles.aboutGrid}>
        <div>
          <h3>01 · Separate</h3>
          <p>Distinguish empirical assertions, value judgements and alleged causal links.</p>
        </div>
        <div>
          <h3>02 · Challenge</h3>
          <p>Ask which assumptions support the strongest interpretation of the argument.</p>
        </div>
        <div>
          <h3>03 · Investigate</h3>
          <p>
            See what would change the assessment and where independent evidence is still needed.
          </p>
        </div>
      </div>
      <p className={styles.aboutNote}>
        External evidence retrieval, historical corroboration, cross-outlet comparison and
        calibrated verification are separate development stages. This page currently analyses the
        content of one article only.
      </p>
    </section>
  );
}

function AnalysisReport({ report }: { report: ArticleAnalysisResult }) {
  const analysis = report.analysis;

  const saveJson = () => {
    const exported = {
      schema: 'biaslens-analysis@1',
      warning: 'Provisional AI-generated interpretation; not independently fact-checked.',
      ...report,
    };
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const location = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = location;
    link.download = 'biaslens-report-' + report.run.generatedAt.slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(location), 0);
  };

  return (
    <article className={styles.report} aria-label="Provisional article analysis">
      <p className={styles.meta}>
        AI interpretation · Evidence within this article, not independent fact-checking
      </p>

      <header className={styles.reportTitle}>
        <p className={styles.eyebrow}>Article examination</p>
        <h2>{analysis.title}</h2>
        <p className={styles.meta}>
          {[analysis.author, analysis.publication, analysis.publication_date, analysis.language]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={styles.meta}>
          {report.origin.kind === 'retrieved-page'
            ? 'Text retrieved from the linked page'
            : report.origin.url
              ? 'Text pasted by a user; linked source was not checked'
              : 'Text pasted by a user; no source URL was provided'}
        </p>
        {report.origin.url && (
          <a className={styles.source} href={report.origin.url} target="_blank" rel="noreferrer">
            Open supplied source ↗
          </a>
        )}
        {report.origin.truncated && (
          <p className={styles.warning}>
            Only part of this text was available to the model. Unexamined sections may affect the
            interpretation.
          </p>
        )}
      </header>

      {analysis.insight && (
        <section className={styles.insight} aria-label="The key insight">
          <p className={styles.eyebrow}>The hinge of the argument</p>
          <h3>{analysis.insight.headline}</h3>
          <p>{analysis.insight.explanation}</p>
          <div className={styles.insightGrid}>
            <div>
              <h4>The assumption</h4>
              <p>{analysis.insight.assumption}</p>
            </div>
            <div>
              <h4>Put it to the test</h4>
              <p>{analysis.insight.test}</p>
            </div>
          </div>
        </section>
      )}
      <section className={styles.reportSection}>
        <h3>The argument in brief</h3>
        <p>{analysis.summary}</p>
      </section>

      <section className={styles.reportSection}>
        <h3>Core claims</h3>
        <ol className={styles.claims}>
          {analysis.core_claims.map((claim, index) => (
            <li key={index} className={styles.claim}>
              <div className={styles.claimHeader}>
                <span>{CLAIM_LABELS[claim.type]}</span>
                <span>Support in article: {claim.evidence_quality}</span>
              </div>
              <p>{claim.claim}</p>
              {claim.source_quote ? (
                <details className={styles.evidence}>
                  <summary>Inspect the article passage</summary>
                  <blockquote>{claim.source_quote}</blockquote>
                  <p className={styles.hint}>
                    Exact text found in the submitted article. This confirms the attribution, not
                    the truth of the statement.
                  </p>
                </details>
              ) : (
                <p className={styles.hint}>No exact supporting passage identified.</p>
              )}
              <p className={styles.claimHint}>
                {claim.supported_in_article
                  ? 'Some support is presented in the article; not independently checked.'
                  : 'The article does not appear to provide direct support; not externally checked.'}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.reportSection}>
        <h3>First-principles critique</h3>
        <p className={styles.longText}>{analysis.first_principles_critique}</p>
      </section>

      {analysis.named_sources.length > 0 && (
        <section className={styles.reportSection}>
          <h3>Sources named within the article</h3>
          <p className={styles.sectionHint}>
            These are attributions identified in the article, not sources our system independently
            authenticated.
          </p>
          <ul className={styles.namedSources}>
            {analysis.named_sources.map((source, index) => (
              <li key={index}>
                <strong>{source.name}</strong> · {source.role}
                <p>{source.attributed_claim}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.reportSection}>
        <h3>Possible framing and selection bias</h3>
        <p>{analysis.biases_to_consider}</p>
      </section>

      <section className={styles.reportSection}>
        <h3>What could change the assessment?</h3>
        <p>{analysis.what_would_change_assessment}</p>
      </section>

      {report.sourceText && (
        <details className={styles.sourceText}>
          <summary>
            Inspect the full text examined ({report.origin.modelChars.toLocaleString()} characters)
          </summary>
          <pre>{report.sourceText}</pre>
        </details>
      )}
      <div className={styles.reportFooter}>
        <span>
          Analysed {report.origin.modelChars.toLocaleString()} characters ·{' '}
          {(report.durationMs / 1_000).toFixed(1)}s{report.modelId ? ' · ' + report.modelId : ''}
        </span>
        <Link href="/methodology">Question or challenge the methodology ↗</Link>
        <button
          className={`${styles.exportBtn} bb-button bb-button--secondary`}
          type="button"
          onClick={saveJson}
        >
          Save report JSON ↓
        </button>
      </div>
      <p className={styles.exportNote}>
        Method {report.run.methodVersion} · Prompt {report.run.promptVersion} ·{' '}
        {report.run.generatedAt}
      </p>
      <p className={styles.exportNote}>
        SHA-256 of the analysed text: <code>{report.origin.textSha256}</code>
      </p>
      <p className={styles.exportNote}>
        The digest identifies only the text processed, not its author, authenticity or accuracy. The
        examined source text is included in your export. The report is not saved on our server.
      </p>
    </article>
  );
}
