'use client';

import { useRef } from 'react';
import { CommentThread, type CommentItem } from '@bitbaum/chatkit/react';

import { zurichTime } from '@/lib/format-time';
import type { Comment } from '@/lib/writing/comments';

import styles from './article.module.css';

type Wire = Omit<Comment, 'createdAt'> & { createdAt: string };

const toItem = (c: Wire): CommentItem => ({
  id: c.id,
  author: c.authorName,
  body: c.body,
  createdAt: c.createdAt,
});

/**
 * The conversation under an article: chatkit's `CommentThread`. This file is
 * only the two routes it talks to and who may remove what.
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
  const url = `/api/writing/${articleId}/comments`;
  const authors = useRef(new Map(initial.map((c) => [c.id, c.authorId])));
  return (
    <div className={styles.comments}>
      <CommentThread
        comments={initial.map(toItem)}
        viewer={viewer ? { name: viewer.name.trim() || 'you' } : null}
        signInHref={`/sign-in?next=%2Farticles%2F${articleId}`}
        voice={{ transcribeUrl: '/api/transcribe', rememberKey: 'biaslens:dictation' }}
        formatTime={(at) => zurichTime(at.toISOString())}
        canRemove={(c) =>
          !!viewer && (viewer.id === articleAuthorId || viewer.id === authors.current.get(c.id))
        }
        transport={{
          post: async (text) => {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ body: text }),
            });
            const payload = (await response.json()) as { ok?: boolean; comment?: Wire };
            if (!payload.ok || !payload.comment) throw new Error('refused');
            authors.current.set(payload.comment.id, payload.comment.authorId);
            return toItem(payload.comment);
          },
          remove: async (commentId) => {
            const response = await fetch(url, {
              method: 'DELETE',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ commentId }),
            });
            if (!response.ok) throw new Error('refused');
          },
        }}
      />
    </div>
  );
}
