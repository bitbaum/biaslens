'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './article.module.css';

/** Where OrangeCat's composer lives; it imports the article's JSON by URL. */
const ORANGECAT_COMPOSER = 'https://orangecat.ch/articles/new';

/**
 * What a reader does with an article, in one shape: a primary action and a
 * row of equal secondary ones (a two-column grid on a phone, one row on a
 * desk). The author's own controls sit apart, as quiet links, so they never
 * compete with the reader's row.
 */
export function ArticleActions({
  id,
  title,
  url,
  owner,
  published,
  reportId,
}: {
  id: string;
  title: string;
  url: string | null;
  owner: boolean;
  published: boolean;
  reportId: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = async () => {
    const link = url ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch {
        /* dismissed: fall through to the clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', link);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/writing/${id}`, { method: 'DELETE' });
      const payload = (await response.json()) as { ok?: boolean; error?: { message?: string } };
      if (!payload.ok) {
        setError(payload.error?.message ?? 'The article could not be deleted.');
        setDeleting(false);
        setConfirming(false);
        return;
      }
      router.push('/desk');
      router.refresh();
    } catch {
      setError('The article could not be deleted. Check your connection and try again.');
      setDeleting(false);
    }
  };

  const importUrl = url ? url.replace('/articles/', '/api/writing/') : null;
  const x = url
    ? `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    : null;

  return (
    <div className={styles.toolbar}>
      {published && (
        <div className={styles.actionRow}>
          <button type="button" className="bb-button bb-button--primary" onClick={share}>
            {copied ? 'Link copied' : 'Share'}
          </button>
          <Link className="bb-button bb-button--secondary" href={`/write?respondTo=${id}`}>
            Respond
          </Link>
          <Link
            className="bb-button bb-button--secondary"
            href={reportId ? `/r/${reportId}` : `/analyze?article=${id}`}
          >
            {reportId ? 'Examination' : 'Examine'}
          </Link>
          {x && (
            <a className="bb-button bb-button--secondary" href={x} rel="noreferrer">
              Post on X
            </a>
          )}
          {importUrl && (
            <a
              className="bb-button bb-button--secondary"
              href={`${ORANGECAT_COMPOSER}?import=${encodeURIComponent(importUrl)}`}
              rel="noreferrer"
            >
              Post on OrangeCat
            </a>
          )}
        </div>
      )}
      {owner && (
        <p className={styles.ownerRow}>
          <span className={styles.meta}>Yours ·</span>
          <Link href={`/articles/${id}/edit`}>Edit</Link>
          {!confirming ? (
            <button type="button" className={styles.linkButton} onClick={() => setConfirming(true)}>
              Delete
            </button>
          ) : (
            <span className={styles.confirm}>
              <span>Delete this article? This cannot be undone.</span>
              <button
                type="button"
                className={`${styles.linkButton} ${styles.danger}`}
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                className={styles.linkButton}
                disabled={deleting}
                onClick={() => setConfirming(false)}
              >
                Keep it
              </button>
            </span>
          )}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
