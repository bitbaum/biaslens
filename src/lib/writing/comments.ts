/**
 * Comments under a written article. Readable with the article; written by a
 * signed-in person; deletable by its author. Every function takes the
 * database, so the same code runs on Postgres and on PGlite in tests.
 */
import { and, asc, eq } from 'drizzle-orm';

import { user as users } from '@bitbaum/accountkit/auth/schema';
import { comments } from '@/lib/db/schema';
import { newPublicId, type Db } from '@/lib/reports/store';

export const COMMENT_MAX = 2_000;

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
}

const shape = (row: {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  createdAt: Date;
}): Comment => ({ ...row, authorName: row.authorName?.trim() || 'A reader' });

const columns = {
  id: comments.id,
  articleId: comments.articleId,
  authorId: comments.authorId,
  authorName: users.name,
  body: comments.body,
  createdAt: comments.createdAt,
};

export type ParsedComment = { ok: true; body: string } | { ok: false; problem: string };

export function parseCommentInput(input: unknown): ParsedComment {
  const raw = (input as { body?: unknown } | null)?.body;
  if (typeof raw !== 'string') return { ok: false, problem: 'Send the comment text.' };
  const body = raw.trim();
  if (!body) return { ok: false, problem: 'Say something first.' };
  if (body.length > COMMENT_MAX)
    return {
      ok: false,
      problem: `A comment is ${COMMENT_MAX.toLocaleString('en')} characters at most.`,
    };
  return { ok: true, body };
}

export async function listComments(db: Db, articleId: string, limit = 500): Promise<Comment[]> {
  const rows = await db
    .select(columns)
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.articleId, articleId))
    .orderBy(asc(comments.createdAt))
    .limit(limit);
  return rows.map(shape);
}

export async function addComment(
  db: Db,
  articleId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  const id = newPublicId();
  await db.insert(comments).values({ id, articleId, authorId, body });
  const [row] = await db
    .select(columns)
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.id, id))
    .limit(1);
  return shape(row);
}

/** Deletes the comment when it is the person's own, or the article is theirs. */
export async function deleteComment(
  db: Db,
  id: string,
  actorId: string,
  articleAuthorId: string | null,
): Promise<boolean> {
  const [row] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  if (!row) return false;
  if (row.authorId !== actorId && articleAuthorId !== actorId) return false;
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.authorId, row.authorId)));
  return true;
}
