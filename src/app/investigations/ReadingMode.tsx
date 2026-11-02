'use client';

import { useEffect, useState } from 'react';

import type { DraftVersion } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

/**
 * A distraction-free read of the latest version. Tap a source key to open
 * its evidence card in place; a bar shows how far you have read.
 */
export function ReadingMode({ draft }: { draft: DraftVersion | undefined }) {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!draft) return null;
  const byKey = new Map(
    draft.citations.map((c) => [
      c.match(/^\[(E\d{1,2})\]/)?.[1] ?? c,
      c.replace(/^\[E\d{1,2}\]\s*/, ''),
    ]),
  );
  return (
    <>
      <button
        type="button"
        className={`bb-button bb-button--primary ${styles.readButton}`}
        onClick={() => setOpen(true)}
      >
        ▶ Read v{draft.version} in reading mode
      </button>
      {open && (
        <div
          className={styles.readingMode}
          role="dialog"
          aria-modal="true"
          aria-label="Reading mode"
          onScroll={(e) => {
            const el = e.currentTarget;
            setProgress(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
          }}
        >
          <div className={styles.readProgress} style={{ transform: `scaleX(${progress})` }} />
          <button
            type="button"
            className={`bb-button bb-button--secondary ${styles.readClose}`}
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <article className={styles.readArticle}>
            <p className={styles.eyebrow}>
              Version {draft.version} · written by AI from linked sources · tap a key to see its
              evidence
            </p>
            <h1>{draft.title}</h1>
            {draft.text.split(/\n{2,}/).map((p, i) => {
              const heading = p.match(/^##\s+(.+)$/);
              if (heading) return <h2 key={i}>{heading[1]}</h2>;
              return (
                <p key={i}>
                  {p.split(/(\[E\d{1,2}\])/g).map((part, j) => {
                    const key = part.match(/^\[(E\d{1,2})\]$/)?.[1];
                    if (!key) return <span key={j}>{part}</span>;
                    const id = `${i}-${j}`;
                    return (
                      <span key={j}>
                        <button
                          type="button"
                          className={styles.readCite}
                          aria-expanded={card === id}
                          onClick={() => setCard(card === id ? null : id)}
                        >
                          {key}
                        </button>
                        {card === id && (
                          <span className={styles.readCard} role="note">
                            {byKey.get(key) ?? 'This key is not in the version’s source list.'}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              );
            })}
            {draft.flags && draft.flags.length > 0 && (
              <p className={styles.flagBox}>
                Citation check flagged {draft.flags.length} sentence
                {draft.flags.length === 1 ? '' : 's'} in this version; see the version history.
              </p>
            )}
          </article>
        </div>
      )}
    </>
  );
}
