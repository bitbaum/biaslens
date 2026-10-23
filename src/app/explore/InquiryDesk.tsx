'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/config/routes';
import {
  EMPTY_INQUIRY,
  isSourceURL,
  parseInquiryRecord,
  type InquiryRecord,
} from '@/lib/domain/inquiry-record';

import styles from './explore.module.css';

const STORAGE_KEY = 'biosense:inquiry:v1';

export function InquiryDesk() {
  const [record, setRecord] = useState<InquiryRecord>(EMPTY_INQUIRY);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading local notes…');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const restored = parseInquiryRecord(JSON.parse(raw));
          if (restored) setRecord(restored);
          else {
            setStatus(
              'Saved data could not be read and has been left untouched. Clear local storage to enable saving a new notebook.',
            );
            return;
          }
        }
        setReady(true);
      } catch {
        setStatus('Browser storage is unavailable. Export your notes before leaving.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setStatus('Saved in this browser only. Export a copy to keep it.');
      } catch {
        setStatus('Could not save. Export your notes before leaving.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [record, ready]);

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
    anchor.download = 'biosense-investigation.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const url = String(data.get('url') || '').trim();
    if (!isSourceURL(url)) {
      setMessage('Use an HTTP or HTTPS URL without embedded credentials.');
      return;
    }
    if (record.sources.length >= 100) {
      setMessage('This notebook holds 100 sources. Export it before starting another.');
      return;
    }
    const title = String(data.get('title') || '').trim();
    const locator = String(data.get('locator') || '').trim();
    if (!title || !locator) {
      setMessage('Add a title and an exact page, table, paragraph or timestamp.');
      return;
    }
    const stance = String(data.get('stance') || 'context');
    if (stance !== 'supports' && stance !== 'contradicts' && stance !== 'context') return;
    setRecord((r) => ({
      ...r,
      sources: [
        ...r.sources,
        {
          id: crypto.randomUUID(),
          title,
          url,
          locator,
          excerpt: String(data.get('excerpt') || '').trim(),
          stance,
          addedAt: new Date().toISOString(),
        },
      ],
    }));
    setMessage(
      'Reference added as an unverified lead. Its relationship to your question is your annotation.',
    );
    form.reset();
  }

  return (
    <>
      <p className={styles.notice}>
        Browser-local research notebook. Sources and excerpts are user supplied; this tool does not
        retrieve, authenticate, or independently verify them. It makes your investigation
        inspectable to you and exportable for others.
      </p>
      <div className={styles.desk}>
        <div>
          <section className={styles.section} aria-labelledby="question-heading">
            <h2 id="question-heading">01 / Define the question</h2>
            <label>
              Question
              <textarea
                rows={3}
                maxLength={2000}
                value={record.question}
                onChange={(e) => setRecord({ ...record, question: e.target.value })}
                placeholder="What would you like to understand?"
              />
            </label>
            <label>
              Scope
              <input
                maxLength={2000}
                value={record.scope}
                onChange={(e) => setRecord({ ...record, scope: e.target.value })}
                placeholder="Place, period, population, definitions…"
              />
            </label>
          </section>
          <section className={styles.section} aria-labelledby="sources-heading">
            <h2 id="sources-heading">02 / Follow the sources</h2>
            <ul className={styles.sources}>
              {record.sources.map((source) => (
                <li key={source.id}>
                  <p>
                    <strong>{source.title}</strong> · Unverified lead
                  </p>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    Open original source ↗
                  </a>
                  <p>
                    {source.locator} · Your annotation: {source.stance}
                  </p>
                  {source.excerpt && <blockquote>{source.excerpt}</blockquote>}
                  <button
                    type="button"
                    onClick={() =>
                      setRecord({
                        ...record,
                        sources: record.sources.filter((s) => s.id !== source.id),
                      })
                    }
                  >
                    Remove reference
                  </button>
                </li>
              ))}
            </ul>
            <details>
              <summary>Add a source reference</summary>
              <form onSubmit={addSource}>
                <label>
                  Document or dataset title
                  <input name="title" maxLength={500} required />
                </label>
                <label>
                  Original URL
                  <input name="url" type="url" maxLength={3000} required />
                </label>
                <label>
                  Exact location
                  <input
                    name="locator"
                    maxLength={2000}
                    placeholder="Page 12, table 3; paragraph 5; 02:14…"
                    required
                  />
                </label>
                <label>
                  Your relationship annotation
                  <select name="stance" defaultValue="context">
                    <option value="context">Context</option>
                    <option value="supports">Supports an explanation</option>
                    <option value="contradicts">Challenges an explanation</option>
                  </select>
                </label>
                <label>
                  Relevant excerpt
                  <textarea name="excerpt" rows={3} maxLength={10000} />
                </label>
                <button className="bb-button bb-button--primary" type="submit">
                  Add reference
                </button>
              </form>
            </details>
            <p role="status">{message}</p>
          </section>
          <section className={styles.section} aria-labelledby="challenge-heading">
            <h2 id="challenge-heading">03 / Keep the question open</h2>
            <label>
              Reasoning & alternative explanations
              <textarea
                rows={5}
                maxLength={20000}
                value={record.notes}
                onChange={(e) => setRecord({ ...record, notes: e.target.value })}
              />
            </label>
            <label>
              Strongest challenge & what would change your mind
              <textarea
                rows={4}
                maxLength={20000}
                value={record.challenge}
                onChange={(e) => setRecord({ ...record, challenge: e.target.value })}
              />
            </label>
          </section>
        </div>
        <aside className={styles.section} aria-labelledby="audit-heading">
          <p className={styles.eyebrow}>Keep the gaps visible</p>
          <h2 id="audit-heading">An honest research record.</h2>
          <ul className={styles.audit}>
            <li>
              {record.question.trim() ? 'Question recorded.' : 'The question is still undefined.'}
            </li>
            <li>
              {record.scope.trim()
                ? 'Scope supplied by you.'
                : 'Place, time, and terms need definition.'}
            </li>
            <li>{record.sources.length} user-supplied references; none independently verified.</li>
            <li>
              {record.challenge.trim()
                ? 'A challenge has been recorded.'
                : 'What would disconfirm your explanation?'}
            </li>
            <li>Source independence and completeness have not been assessed.</li>
          </ul>
          <p className={styles.state} role="status">
            {status}
          </p>
          <div className={`${styles.actions} bb-actions`}>
            <button className="bb-button bb-button--secondary" onClick={exportRecord}>
              Export investigation ↓
            </button>
            <Link className="bb-button bb-button--secondary" href={ROUTES.methodology}>
              Inspect the method →
            </Link>
          </div>
          <details>
            <summary>Local storage controls</summary>
            <p>Export first. Clearing deletes this notebook from this browser.</p>
            <button
              onClick={() => {
                if (
                  !window.confirm('Delete this browser-local notebook? Export first to retain it.')
                )
                  return;
                try {
                  localStorage.removeItem(STORAGE_KEY);
                } catch {
                  /* UI remains usable without storage. */
                }
                setRecord({ ...EMPTY_INQUIRY, sources: [] });
                setReady(true);
              }}
            >
              Clear local notebook
            </button>
          </details>
        </aside>
      </div>
    </>
  );
}
