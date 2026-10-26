'use client';

import { useState, type FormEvent } from 'react';

import type { EvidenceStance } from '@/lib/domain/epistemic-graph';
import { isSourceURL, type InquirySource } from '@/lib/domain/inquiry-record';

import styles from './explore.module.css';

const STANCES: { id: EvidenceStance; label: string }[] = [
  { id: 'supports', label: 'Supports' },
  { id: 'contradicts', label: 'Challenges' },
  { id: 'context', label: 'Context' },
];

/** One source: its title, a one-tap stance, and optional detail behind a button. */
function SourceRow({
  source,
  onChange,
  onRemove,
}: {
  source: InquirySource;
  onChange: (next: InquirySource) => void;
  onRemove: () => void;
}) {
  const [details, setDetails] = useState(Boolean(source.locator || source.excerpt));
  return (
    <li>
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        {source.title}
      </a>
      <div className={styles.segmented} role="group" aria-label={`What ${source.title} does`}>
        {STANCES.map((stance) => (
          <button
            key={stance.id}
            type="button"
            aria-pressed={source.stance === stance.id}
            onClick={() => onChange({ ...source, stance: stance.id })}
          >
            {stance.label}
          </button>
        ))}
      </div>
      {details && (
        <div className={styles.sourceDetails}>
          <input
            aria-label="Where in the source"
            placeholder="Where: page 12, table 3, 02:14…"
            maxLength={2000}
            value={source.locator}
            onChange={(e) => onChange({ ...source, locator: e.target.value })}
          />
          <textarea
            aria-label="The passage that matters"
            placeholder="Paste the passage that matters (optional)"
            rows={3}
            maxLength={10000}
            value={source.excerpt}
            onChange={(e) => onChange({ ...source, excerpt: e.target.value })}
          />
        </div>
      )}
      <div className={styles.rowActions}>
        {!details && (
          <button type="button" className={styles.textButton} onClick={() => setDetails(true)}>
            Add where in the source
          </button>
        )}
        <button type="button" className={styles.textButton} onClick={onRemove}>
          Remove
        </button>
      </div>
    </li>
  );
}

export function SourceAdder({
  sources,
  onChange,
}: {
  sources: InquirySource[];
  onChange: (next: InquirySource[]) => void;
}) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function add(event: FormEvent) {
    event.preventDefault();
    const link = url.trim();
    if (!isSourceURL(link)) return setMessage('Paste a web address that starts with https://');
    if (sources.length >= 100)
      return setMessage('This notebook holds 100 sources. Export it first.');
    setBusy(true);
    setMessage('');
    // The title comes from the page itself; when it cannot be read, the address stands in.
    let title = new URL(link).hostname.replace(/^www\./, '');
    try {
      const response = await fetch('/api/source-preview?url=' + encodeURIComponent(link));
      const preview = (await response.json()) as {
        ok?: boolean;
        title?: string | null;
        publication?: string | null;
      };
      if (preview.ok && preview.title)
        title = preview.publication ? `${preview.title} — ${preview.publication}` : preview.title;
    } catch {
      /* the hostname is a fine title */
    }
    onChange([
      ...sources,
      {
        id: crypto.randomUUID(),
        title,
        url: link,
        locator: '',
        excerpt: '',
        stance: 'context',
        addedAt: new Date().toISOString(),
      },
    ]);
    setUrl('');
    setBusy(false);
  }

  return (
    <section className={styles.section} aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources</h2>
      {sources.length > 0 && (
        <ul className={styles.sources}>
          {sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              onChange={(next) => onChange(sources.map((s) => (s.id === next.id ? next : s)))}
              onRemove={() => onChange(sources.filter((s) => s.id !== source.id))}
            />
          ))}
        </ul>
      )}
      <form className={styles.addSource} onSubmit={add}>
        <input
          type="url"
          inputMode="url"
          aria-label="Paste a link to a source"
          placeholder="Paste a link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={3000}
        />
        <button className="bb-button bb-button--secondary" type="submit" disabled={busy || !url}>
          {busy ? 'Reading…' : 'Add'}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      <p className={styles.state}>Sources you add are your notes, not checked evidence.</p>
    </section>
  );
}
