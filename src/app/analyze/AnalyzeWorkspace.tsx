'use client';

import Link from 'next/link';
import { HeroSection } from '@bitbaum/sitekit/react';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import { EXAMPLE_ARTICLE } from '@/lib/analysis/example';
import {
  languageFromLocales,
  OUTPUT_LANGUAGE_CODES,
  OUTPUT_LANGUAGES,
  type OutputLanguage,
} from '@/lib/config/languages';
import { reportCopy } from '@/lib/config/report-copy';

import { ReplyLauncher } from '@/app/_components/replies/ReplyLauncher';
import { RewriteStudio } from '@/app/_components/rewrite/RewriteStudio';

import { ArticleConversation } from './ArticleConversation';
import { ReportView, type ReportResult } from './report/ReportView';
import { useAnalysis } from './useAnalysis';
import styles from './analyze.module.css';

type Mode = 'url' | 'text' | 'pdf';

const MIN_TEXT_LENGTH = 200;

const noSubscription = () => () => undefined;

const STAGE_TEXT = {
  'reading-source': 'Reading the source…',
  reading: 'Listing who speaks, what is claimed and which figures appear…',
  assessing: 'Checking techniques, the key assumption and the strongest objection…',
  checking: 'Matching every cited passage against the text…',
} as const;

export function AnalyzeWorkspace({ incoming }: { incoming: string | null }) {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState(incoming ?? '');
  const [text, setText] = useState('');
  const [chosenLanguage, setChosenLanguage] = useState<OutputLanguage | null>(null);
  // A Swiss reader gets a Swiss German report unless they choose otherwise.
  const browserLanguage = useSyncExternalStore(
    noSubscription,
    () => languageFromLocales(navigator.languages ?? []),
    () => 'en' as OutputLanguage,
  );
  const language = chosenLanguage ?? browserLanguage;
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const analysis = useAnalysis();
  const reportRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // /analyze?u=<link>, the address prefix and the phone's share menu all land
  // here: fill the form and start, exactly as if the reader had pressed Examine.
  useEffect(() => {
    if (!incoming || startedRef.current) return;
    startedRef.current = true;
    void analysis.run({ url: incoming, outputLanguage: language }).then((result) => {
      if (result) reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [incoming, analysis, language]);

  const busy = analysis.busy || pdfBusy;
  const canSubmit =
    mode === 'url'
      ? url.trim().length > 0
      : mode === 'text' && text.trim().length >= MIN_TEXT_LENGTH;
  const sourceFailed = ['SOURCE_UNAVAILABLE', 'SOURCE_TOO_SHORT'].includes(
    analysis.error?.code ?? '',
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !canSubmit) return;
    const result = await analysis.run({
      url: url.trim() || undefined,
      text: mode === 'text' ? text : undefined,
      outputLanguage: language,
    });
    if (result) {
      window.setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        reportRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  };

  const choose = (next: Mode) => {
    setMode(next);
    analysis.clearError();
  };

  const uploadPdf = async (file: File) => {
    setPdfBusy(true);
    setPdfNote(null);
    analysis.clearError();
    try {
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/pdf' },
        body: file,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        text?: string;
        pages?: number;
        truncated?: boolean;
        error?: { message?: string };
      };
      if (!payload.ok || !payload.text) {
        setPdfNote(payload.error?.message ?? 'The PDF could not be read.');
        return;
      }
      setText(payload.text);
      setMode('text');
      setPdfNote(
        `Text read from ${file.name} (${payload.pages} ${payload.pages === 1 ? 'page' : 'pages'}${
          payload.truncated ? ', shortened to 30,000 characters' : ''
        }). Check it, then examine it.`,
      );
    } catch {
      setPdfNote('The PDF could not be uploaded. Check your connection and try again.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <main id="main-content" className={`${styles.page} bb-frame`}>
      <HeroSection
        appearance="application"
        section={{
          kind: 'hero',
          eyebrow: 'Source examination',
          statement: 'Examine text.',
          lead: [
            'See who speaks, which claims rest on what, and which passages shape your conclusion.',
          ],
        }}
      />

      <div className={styles.inputGrid}>
        <section className={styles.tool} aria-label="Examine a source">
          <div
            className={`${styles.modeSwitch} bb-choice-row`}
            role="group"
            aria-label="Choose source format"
          >
            {(
              [
                ['url', 'From a URL'],
                ['text', 'Paste text'],
                ['pdf', 'Upload PDF'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={mode === value ? styles.activeMode : styles.modeButton}
                disabled={busy}
                aria-pressed={mode === value}
                onClick={() => choose(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.exampleRow}>
            <span>Start with your own source, or try a fictional example.</span>
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                setMode('text');
                setUrl('');
                setText(EXAMPLE_ARTICLE);
                analysis.setResult(null);
              }}
              disabled={busy}
            >
              Try an example
            </button>
          </div>
          <form onSubmit={submit} className={styles.form}>
            <label className={styles.fieldLabel} htmlFor="analysis-language">
              Report language
            </label>
            <select
              id="analysis-language"
              disabled={busy}
              className={`${styles.input} bb-control`}
              value={language}
              onChange={(event) => {
                setChosenLanguage(event.target.value as OutputLanguage);
              }}
            >
              {OUTPUT_LANGUAGE_CODES.map((code) => (
                <option key={code} value={code}>
                  {OUTPUT_LANGUAGES[code].label}
                </option>
              ))}
            </select>

            {mode === 'pdf' ? (
              <>
                <label className={styles.fieldLabel} htmlFor="article-pdf">
                  PDF file
                </label>
                <input
                  id="article-pdf"
                  className={`${styles.input} bb-control`}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPdf(file);
                  }}
                />
                <p className={styles.hint}>
                  A press clipping or a saved article, up to 10 MB. The text appears in the paste
                  box for you to check; the file is not stored.
                </p>
              </>
            ) : (
              <>
                <label className={styles.fieldLabel} htmlFor="article-url">
                  {mode === 'url' ? 'Source URL' : 'Source URL (optional)'}
                </label>
                <input
                  id="article-url"
                  disabled={busy}
                  className={`${styles.input} bb-control`}
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com/news/article"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required={mode === 'url'}
                  maxLength={2048}
                  autoComplete="url"
                />
                {mode === 'url' && (
                  <p className={styles.hint}>Web pages and PDF links, including press clippings.</p>
                )}
              </>
            )}

            {mode === 'text' && (
              <>
                <label className={styles.fieldLabel} htmlFor="article-text">
                  Text to examine
                </label>
                <textarea
                  id="article-text"
                  disabled={busy}
                  className={`${styles.textarea} bb-control`}
                  placeholder="Paste at least 200 characters. Useful when the publisher requires a login or blocks automated reading."
                  rows={9}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  minLength={MIN_TEXT_LENGTH}
                  maxLength={30_000}
                  required
                />
                <p className={styles.hint}>
                  {text.trim().length.toLocaleString()} / 30,000 characters. If you supply a URL, we
                  do not check that your pasted text matches it.
                </p>
              </>
            )}
            {pdfNote && (
              <p className={styles.notice} role="status">
                {pdfNote}
              </p>
            )}

            {mode !== 'pdf' && (
              <div className={`${styles.formBottom} bb-actions`}>
                <button
                  className={`${styles.submit} bb-button bb-button--primary`}
                  type="submit"
                  disabled={!canSubmit || busy}
                >
                  {analysis.busy ? 'Examining…' : 'Examine text'}
                </button>
                <p className={styles.hint}>
                  AI-generated reading. Every marked passage is the text’s own words; the judgements
                  are not a fact check.
                </p>
              </div>
            )}
          </form>

          <div role="status" aria-live="polite">
            {(analysis.busy || pdfBusy) && (
              <div className={styles.progress}>
                <p>{pdfBusy ? 'Reading the PDF…' : STAGE_TEXT[analysis.stage ?? 'reading']}</p>
                {analysis.busy && (
                  <>
                    <p className={styles.hint}>
                      Usually 20–90 seconds. Your text is sent to our model provider for analysis.
                    </p>
                    <button type="button" className={styles.pasteFallback} onClick={analysis.stop}>
                      Stop examination
                    </button>
                  </>
                )}
              </div>
            )}
            {analysis.error && (
              <div role="alert" className={styles.error}>
                <strong>Analysis unavailable</strong>
                <p>{analysis.error.message}</p>
                {mode === 'url' && sourceFailed && (
                  <button
                    type="button"
                    className={styles.pasteFallback}
                    onClick={() => choose('text')}
                  >
                    Paste article text instead →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
        <AboutAnalysis />
      </div>
      <div ref={reportRef} tabIndex={-1} className={styles.reportTarget}>
        {analysis.result && <AnalysisResult result={analysis.result} />}
      </div>
    </main>
  );
}

/** A link handed to the page by ?u=, or by a share sheet as ?url= / ?text=. */
function AnalysisResult({ result }: { result: ReportResult }) {
  const copy = reportCopy(result.language);
  const saveJson = () => {
    const exported = {
      schema: 'biaslens-analysis@2',
      warning: 'Provisional AI-generated reading; not independently fact-checked.',
      ...result,
    };
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const location = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = location;
    link.download = 'biaslens-report-' + result.run.generatedAt.slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(location), 0);
  };
  return (
    <ReportView
      result={result}
      actions={
        result.saved ? <ReplyLauncher reportId={result.saved.id} result={result} /> : undefined
      }
      after={
        <>
          {result.saved && <RewriteStudio reportId={result.saved.id} result={result} />}
          {result.sourceText && (
            <ArticleConversation
              sourceText={result.sourceText}
              sourceDigest={result.origin.textSha256}
              title={result.report.title}
              outputLanguage={result.language}
              heading={copy.sections.ask}
            />
          )}
          <div className={styles.reportFooter}>
            <button
              className={`${styles.exportBtn} bb-button bb-button--secondary`}
              type="button"
              onClick={saveJson}
            >
              {copy.provenance.download}
            </button>
          </div>
        </>
      }
    />
  );
}

function AboutAnalysis() {
  return (
    <aside className={styles.about}>
      <h2>What you’ll get</h2>
      <div className={styles.aboutGrid}>
        <div>
          <span>01</span>
          <div>
            <h3>Who is speaking</h3>
            <p>
              Every quoted voice, how the text describes them and whether they back its main claim.
            </p>
          </div>
        </div>
        <div>
          <span>02</span>
          <div>
            <h3>The text, marked up</h3>
            <p>Passages that use a known technique, each with the reason and a neutral wording.</p>
          </div>
        </div>
        <div>
          <span>03</span>
          <div>
            <h3>The numbers and the hinge</h3>
            <p>Figures without a source or sample, and the one step the argument rests on.</p>
          </div>
        </div>
      </div>
      <p className={styles.aboutNote}>
        This examines one text. It does not retrieve or verify outside evidence.
      </p>
      <Link href="/methodology">How the analysis works →</Link>
    </aside>
  );
}
