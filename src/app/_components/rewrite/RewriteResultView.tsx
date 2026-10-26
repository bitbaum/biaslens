'use client';

import { useState } from 'react';

import type { OutputLanguage } from '@/lib/config/languages';
import { rewriteCopy } from '@/lib/config/rewrite-copy';
import type { RewriteResult } from '@/lib/rewrite/run';

import styles from './rewrite.module.css';

export type StudioRewrite = RewriteResult & { id: string };

/**
 * A rewrite with its label on top and, for a rewrite of the article, which
 * facts survived. Beside the original on a wide screen; one tap between them
 * on a phone.
 */
export function RewriteResultView({
  rewrite,
  original,
  language,
}: {
  rewrite: Pick<StudioRewrite, 'title' | 'text' | 'label' | 'simulated' | 'factDiff'>;
  original: string | null;
  language: OutputLanguage;
}) {
  const copy = rewriteCopy(language);
  const [view, setView] = useState<'result' | 'original'>('result');
  const [copied, setCopied] = useState(false);
  const diff = rewrite.factDiff;

  const body = (
    <div className={styles.result}>
      <p className={rewrite.simulated ? styles.simulationLabel : styles.label}>{rewrite.label}</p>
      {rewrite.title && <h4>{rewrite.title}</h4>}
      {rewrite.text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <button
        type="button"
        className={styles.textButton}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              `${rewrite.label}\n\n${rewrite.title ? rewrite.title + '\n\n' : ''}${rewrite.text}`,
            );
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? copy.copied : copy.copy}
      </button>
    </div>
  );

  return (
    <div className={styles.compare}>
      {original && (
        <div className={`${styles.segmented} ${styles.phoneOnly}`} role="group">
          <button type="button" aria-pressed={view === 'result'} onClick={() => setView('result')}>
            {copy.result}
          </button>
          <button
            type="button"
            aria-pressed={view === 'original'}
            onClick={() => setView('original')}
          >
            {copy.original}
          </button>
        </div>
      )}
      <div className={original ? styles.columns : undefined}>
        <div className={original && view === 'original' ? styles.hideOnPhone : undefined}>
          {body}
        </div>
        {original && (
          <div className={`${styles.original} ${view === 'result' ? styles.hideOnPhone : ''}`}>
            <p className={styles.label}>{copy.original}</p>
            <div className={styles.originalText}>{original}</div>
          </div>
        )}
      </div>
      {diff && (
        <div className={styles.diff}>
          <p>
            <strong>{copy.facts(diff.kept, diff.total)}</strong>
          </p>
          {diff.changed.length > 0 && (
            <p>
              {copy.changed}: {diff.changed.join(' · ')}
            </p>
          )}
          {diff.dropped.length > 0 && (
            <p>
              {copy.dropped}: {diff.dropped.join(' · ')}
            </p>
          )}
          {diff.added.length > 0 ? (
            <div>
              <p>
                <strong>{copy.added}</strong>
              </p>
              <ul>
                {diff.added.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>{copy.noAdded}</p>
          )}
        </div>
      )}
    </div>
  );
}
