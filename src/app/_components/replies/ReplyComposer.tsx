'use client';

import { useMemo, useState } from 'react';

import type { ReportResult } from '@/lib/analysis/run';
import { replyCopy } from '@/lib/config/reply-copy';
import {
  OCCASION_IDS,
  OCCASIONS,
  REPLY_BLOCKS,
  REPLY_LENGTHS,
  type Occasion,
  type ReplyBlock,
  type ReplyLength,
} from '@/lib/config/reply-occasions';
import { rankFindings } from '@/lib/replies/findings';
import { replyText } from '@/lib/replies/render';

import { SharePanel } from './SharePanel';
import styles from './replies.module.css';

/**
 * Compose a reply to the person who sent the article. The occasion sets
 * sensible defaults; everything stays changeable; the preview is exactly
 * the text that will be sent.
 */
export function ReplyComposer({
  reportId,
  result,
  parentReplyId = null,
  rewrite = null,
}: {
  reportId: string;
  result: ReportResult;
  parentReplyId?: string | null;
  /** A studio text sent along with the reply. */
  rewrite?: { id: string; label: string; title: string } | null;
}) {
  const copy = replyCopy(result.language);
  const [occasion, setOccasion] = useState<Occasion>('friend');
  const [length, setLength] = useState<ReplyLength>(OCCASIONS.friend.length);
  const [blocks, setBlocks] = useState<Set<ReplyBlock>>(new Set(OCCASIONS.friend.blocks));
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; url: string } | null>(null);
  const findings = useMemo(() => rankFindings(result.report, result.language), [result]);

  const url = created?.url ?? '…/a/…';
  const text = replyText({
    report: result.report,
    findings,
    language: result.language,
    length,
    blocks: [...blocks],
    note: note || null,
    url,
    rewrite,
  });

  const choose = (next: Occasion) => {
    setOccasion(next);
    setLength(OCCASIONS[next].length);
    setBlocks(new Set(OCCASIONS[next].blocks));
    setCreated(null);
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reportId,
          parentReplyId,
          occasion,
          length,
          blocks: [...blocks],
          senderName: name || null,
          note: note || null,
          rewriteId: rewrite?.id ?? null,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        id?: string;
        path?: string;
        error?: { message?: string };
      };
      if (!payload.ok || !payload.id || !payload.path) {
        setError(payload.error?.message ?? copy.failed);
        return;
      }
      setCreated({ id: payload.id, url: window.location.origin + payload.path });
    } catch {
      setError(copy.failed);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <SharePanel
        language={result.language}
        replyId={created.id}
        url={created.url}
        text={replyText({
          report: result.report,
          findings,
          language: result.language,
          length,
          blocks: [...blocks],
          note: note || null,
          url: created.url,
          rewrite,
        })}
        title={result.report.title}
        onEdit={() => setCreated(null)}
      />
    );
  }

  return (
    <section className={styles.composer} aria-labelledby="reply-composer-heading">
      <h3 id="reply-composer-heading">{copy.composerTitle}</h3>
      <p className={styles.muted}>{copy.composerIntro}</p>
      {rewrite && (
        <p className={styles.attached}>
          {rewrite.label}
          {rewrite.title && <strong> {rewrite.title}</strong>}
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend>{copy.occasionLabel}</legend>
        <div className={styles.occasions}>
          {OCCASION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={styles.occasion}
              aria-pressed={occasion === id}
              onClick={() => choose(id)}
            >
              <strong>{copy.occasions[id].label}</strong>
              <span>{copy.occasions[id].hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>{copy.lengthLabel}</legend>
        <div className={styles.segmented} role="group">
          {REPLY_LENGTHS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={length === item}
              onClick={() => setLength(item)}
            >
              {copy.lengths[item]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>{copy.blocksLabel}</legend>
        <div className={styles.switches}>
          {REPLY_BLOCKS.map((block) => (
            <label key={block} className={styles.switchRow}>
              <input
                type="checkbox"
                checked={blocks.has(block)}
                disabled={block === 'findings'}
                onChange={(event) =>
                  setBlocks((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(block);
                    else next.delete(block);
                    return next;
                  })
                }
              />
              {copy.blocks[block]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.fields}>
        <label>
          <span>{copy.nameLabel}</span>
          <input
            className="bb-control"
            value={name}
            maxLength={60}
            placeholder={copy.namePlaceholder}
            autoComplete="nickname"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          <span>{copy.noteLabel}</span>
          <textarea
            className="bb-control"
            value={note}
            maxLength={500}
            rows={3}
            placeholder={copy.notePlaceholder}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.preview}>
        <p className={styles.kicker}>{copy.preview}</p>
        <pre>{text}</pre>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <button
        type="button"
        className={`${styles.primary} bb-button bb-button--primary`}
        disabled={busy}
        onClick={create}
      >
        {busy ? copy.creating : copy.create}
      </button>
    </section>
  );
}
