'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './article.module.css';

/** Where OrangeCat's composer lives; it imports the article's JSON by URL. */
const ORANGECAT_COMPOSER = 'https://orangecat.ch/articles/new';

/**
 * Everything a reader can do with the article, in one row: share it, examine
 * it, answer it, post it on OrangeCat; and, for the author, change or delete it.
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

  const importUrl = url ? `${url.replace('/articles/', '/api/writing/')}` : null;
  const x = url
    ? `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    : null;

  return (
    <div className={styles.toolbar}>
      {published && (
        <>
          <button type="button" className="bb-button bb-button--primary" onClick={share}>
            {copied ? 'Link copied' : 'Share'}
          </button>
          <Link className="bb-button bb-button--secondary" href={`/write?respondTo=${id}`}>
            Write a response
          </Link>
          <Link
            className="bb-button bb-button--secondary"
            href={reportId ? `/r/${reportId}` : `/analyze?article=${id}`}
          >
            {reportId ? 'See the examination' : 'Examine it'}
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
        </>
      )}
      {owner && (
        <>
          <Link className="bb-button bb-button--secondary" href={`/articles/${id}/edit`}>
            Edit
          </Link>
          {!confirming ? (
            <button
              type="button"
              className="bb-button bb-button--secondary"
              onClick={() => setConfirming(true)}
            >
              Delete
            </button>
          ) : (
            <span className={styles.confirm}>
              <span>Delete this article? This cannot be undone.</span>
              <button
                type="button"
                className={`bb-button bb-button--secondary ${styles.danger}`}
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                className="bb-button bb-button--secondary"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              >
                Keep it
              </button>
            </span>
          )}
        </>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
