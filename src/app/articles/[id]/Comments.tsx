'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Composer } from '@bitbaum/chatkit/react';

import { zurichTime } from '@/lib/format-time';
import type { Comment } from '@/lib/writing/comments';

import styles from './article.module.css';

type Wire = Omit<Comment, 'createdAt'> & { createdAt: string };

/**
 * The conversation under an article. Reading needs nothing; a comment needs
 * an account. The box is chatkit's composer, so the microphone works here
 * exactly as it does in every chat on the site.
 */
export function Comments({
  articleId,
  articleAuthorId,
  viewer,
  initial,
}: {
  articleId: string;
  articleAuthorId: string;
  viewer: { id: string; name: string } | null;
  initial: Wire[];
}) {
  const [list, setList] = useState<Wire[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  const send = async (text: string) => {
    setError(null);
    setSending(true);
    try {
      const response = await fetch(`/api/writing/${articleId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        comment?: Wire;
        error?: { message?: string };
      };
      if (!payload.ok || !payload.comment) {
        setError(payload.error?.message ?? 'The comment could not be posted. Try again.');
        return false;
      }
      setList((current) => [...current, payload.comment!]);
      return true;
    } catch {
      setError('The comment could not be sent. Check your connection and try again.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId: string) => {
    const before = list;
    setList((current) => current.filter((c) => c.id !== commentId));
    const response = await fetch(`/api/writing/${articleId}/comments`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ commentId }),
    }).catch(() => null);
    if (!response?.ok) {
      setList(before);
      setError('The comment could not be removed.');
    }
  };

  return (
    <section className={styles.comments} aria-labelledby="comments-heading">
      <h2 id="comments-heading">
        {list.length === 0
          ? 'No comments yet'
          : `${list.length} ${list.length === 1 ? 'comment' : 'comments'}`}
      </h2>
      {list.length > 0 && (
        <ol className={`${styles.commentList} bb-list`}>
          {list.map((c) => (
            <li key={c.id} className={styles.comment}>
              <p className={styles.commentMeta}>
                <strong>{c.authorName}</strong> · {zurichTime(c.createdAt)}
                {viewer && (viewer.id === c.authorId || viewer.id === articleAuthorId) && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => remove(c.id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </p>
              <p className={styles.commentBody}>{c.body}</p>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {viewer ? (
        <div className={styles.commentBox}>
          <Composer
            onSend={(text) => send(text)}
            placeholder="Say something about this article…"
            ariaLabel="Write a comment"
            sending={sending}
            value={draft}
            onValueChange={setDraft}
            attach={false}
            voice={{ transcribeUrl: '/api/transcribe' }}
            labels={{ send: 'Comment' }}
            hint={`Posted as ${viewer.name.trim() || 'you'}.`}
          />
        </div>
      ) : (
        <p className={styles.commentSignIn}>
          <Link
            className="bb-button bb-button--secondary"
            href={`/sign-in?next=%2Farticles%2F${articleId}`}
          >
            Sign in to comment
          </Link>
        </p>
      )}
    </section>
  );
}
