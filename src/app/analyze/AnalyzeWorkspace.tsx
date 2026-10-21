'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

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
  const [busy, setBusy] = useState(false);

  const canSubmit = mode === 'url' ? url.trim().length > 0 : text.trim().length >= MIN_TEXT_LENGTH;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
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
        error?: { message?: string };
      };
      if (!response.ok || !result.ok || !result.result) {
        throw new Error(result.error?.message || 'The article could not be analysed.');
      }
      setReport(result.result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not reach the service.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Workspace navigation">
        <Link className={styles.brand} href="/">
          BiasLens
        </Link>
        <Link href="/methodology">Open methodology ↗</Link>
      </nav>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>First-principles analysis / Beta</p>
        <h1>What is this article really claiming?</h1>
        <p className={styles.lead}>
          Trace the argument, separate facts from judgements, examine possible framing, and find out
          what evidence would change the assessment.
        </p>
      </header>

      <section className={styles.tool} aria-label="Analyse an article">
        <div className={styles.modeSwitch} role="group" aria-label="Choose source format">
          <button
            type="button"
            className={mode === 'url' ? styles.activeMode : styles.modeButton}
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
            aria-pressed={mode === 'text'}
            onClick={() => {
              setMode('text');
              setError(null);
            }}
          >
            Paste article text
          </button>
        </div>

        <form onSubmit={submit} className={styles.form}>
          <label className={styles.fieldLabel} htmlFor="article-url">
            {mode === 'url' ? 'Article URL' : 'Source URL (optional, supplied by you)'}
          </label>
          <input
            id="article-url"
            className={styles.input}
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
                className={styles.textarea}
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

          <div className={styles.formBottom}>
            <button className={styles.submit} type="submit" disabled={!canSubmit || busy}>
              {busy ? 'Examining…' : 'Examine article →'}
            </button>
            <p className={styles.hint}>
              This tool analyses arguments; it does not certify their truth or make accusations
              about authors.
            </p>
          </div>
        </form>

        <div role="status" aria-live="polite">
          {busy && <p className={styles.progress}>Reading claims and composing an analysis…</p>}
          {error && (
            <div role="alert" className={styles.error}>
              <strong>Analysis unavailable</strong>
              <p>{error}</p>
              {mode === 'url' && (
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

      {report ? <AnalysisReport report={report} /> : <AboutAnalysis />}

      <footer className={styles.footer}>
        <span>BiasLens · Open evidence, contestable conclusions</span>
        <a href="https://github.com/bitbaum/biaslens">View open-source code ↗</a>
      </footer>
    </main>
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

  return (
    <article className={styles.report} aria-label="Provisional article analysis">
      <div className={styles.reportFlag}>
        <strong>AI-generated interpretation · Not independently fact-checked</strong>
        <p>
          Article evidence is not independent verification. Names, affiliations and historical
          patterns require a separate investigation. Treat bias observations as hypotheses.
        </p>
      </div>

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

      <section className={styles.reportSection}>
        <h3>Summary of the argument</h3>
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

      <div className={styles.reportFooter}>
        <span>
          Analysed {report.origin.modelChars.toLocaleString()} characters ·{' '}
          {(report.durationMs / 1_000).toFixed(1)}s{report.modelId ? ' · ' + report.modelId : ''}
        </span>
        <Link href="/methodology">Question or challenge the methodology ↗</Link>
      </div>
    </article>
  );
}
