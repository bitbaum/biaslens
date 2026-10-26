'use client';

import { useAiForm } from '@fleet/ai-forms/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { INQUIRY_FIELDS, INQUIRY_FORM } from '@/lib/config/ai-forms';
import { ROUTES } from '@/lib/config/routes';
import {
  EMPTY_INQUIRY,
  INQUIRY_STORAGE_KEY,
  parseInquiryRecord,
  type InquiryRecord,
  type InquirySource,
} from '@/lib/domain/inquiry-record';

import { NotebookAssistant } from './NotebookAssistant';
import { explanationList, NotebookFields } from './NotebookFields';
import { SourceAdder } from './SourceAdder';
import styles from './explore.module.css';

const TEXT_FIELDS = ['question', 'scope', 'notes', 'challenge'] as const;

/**
 * The research notebook. One box to say what you want to understand; the
 * notebook fills itself and changes when you talk to it. Everything stays in
 * this browser (the same record and storage key as before, so earlier
 * notebooks open unchanged) until you export it.
 */
export function InquiryDesk() {
  const form = useAiForm({ target: INQUIRY_FORM.key, fields: INQUIRY_FIELDS });
  const [sources, setSources] = useState<InquirySource[]>([]);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('');
  const loaded = useRef(false);
  const { setValues } = form;

  // Restore once. setValues may change identity; the guard keeps this a load.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || loaded.current) return;
      loaded.current = true;
      try {
        const raw = localStorage.getItem(INQUIRY_STORAGE_KEY);
        const restored = raw ? parseInquiryRecord(JSON.parse(raw)) : null;
        if (raw && !restored) {
          setStatus('A saved notebook could not be read and was left untouched.');
          return;
        }
        if (restored) {
          setValues(Object.fromEntries(TEXT_FIELDS.map((k) => [k, restored[k]])));
          setSources(restored.sources);
        }
        setReady(true);
      } catch {
        setStatus('This browser cannot save. Export your notebook before leaving.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setValues]);

  const record: InquiryRecord = {
    ...EMPTY_INQUIRY,
    ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, form.text(k)])),
    sources,
  };
  const serialized = JSON.stringify(record);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(INQUIRY_STORAGE_KEY, serialized);
        setStatus('Saved in this browser.');
      } catch {
        setStatus('Could not save. Export your notebook before leaving.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serialized, ready]);

  function exportRecord() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...record,
            exportedAt: new Date().toISOString(),
            sourceStatus: 'User-supplied, not independently verified',
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'biaslens-investigation.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const started = !form.isEmpty || sources.length > 0;
  const open = explanationList(record.notes).length;

  return (
    <>
      <NotebookAssistant form={form} />
      {started && (
        <div className={styles.desk}>
          <div>
            <NotebookFields form={form} />
            <SourceAdder sources={sources} onChange={setSources} />
          </div>
          <aside className={styles.section} aria-labelledby="audit-heading">
            <h2 id="audit-heading">Where you are</h2>
            <ul className={styles.audit}>
              <li>{open === 1 ? '1 explanation kept open.' : `${open} explanations kept open.`}</li>
              <li>
                {sources.length === 1 ? '1 source' : `${sources.length} sources`} added by you, none
                checked by BiasLens.
              </li>
              <li>
                {record.challenge.trim()
                  ? 'You know what would change your mind.'
                  : 'Not yet written: what would change your mind.'}
              </li>
            </ul>
            <p className={styles.state} role="status">
              {status}
            </p>
            <div className={`${styles.actions} bb-actions`}>
              <button className="bb-button bb-button--primary" onClick={exportRecord}>
                Export notebook ↓
              </button>
              <Link className={styles.methodLink} href={ROUTES.methodology}>
                How BiasLens works →
              </Link>
            </div>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                if (!window.confirm('Start over? This notebook is deleted from this browser.'))
                  return;
                try {
                  localStorage.removeItem(INQUIRY_STORAGE_KEY);
                } catch {
                  /* the page works without storage */
                }
                form.reset();
                setSources([]);
              }}
            >
              Start over
            </button>
          </aside>
        </div>
      )}
      {!started && status && <p className={styles.state}>{status}</p>}
    </>
  );
}
