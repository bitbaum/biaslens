/**
 * Written articles. Every function takes the database so the same code runs
 * against Postgres in production and PGlite in tests. Reads of published
 * articles are public; drafts are the author's alone; every write checks the
 * author id the session supplied.
 */
import { and, desc, eq } from 'drizzle-orm';

import { user as users } from '@bitbaum/accountkit/auth/schema';
import { writtenArticles } from '@/lib/db/schema';
import { newPublicId, type Db } from '@/lib/reports/store';

import { excerptOf, type WritingInput, type WritingStatus } from './input';

export interface WrittenArticle {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  excerpt: string;
  status: WritingStatus;
  respondToId: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  reportId: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/** A list entry: everything but the body. */
export type WrittenArticleSummary = Omit<WrittenArticle, 'body'>;

const columns = {
  id: writtenArticles.id,
  authorId: writtenArticles.authorId,
  authorName: users.name,
  title: writtenArticles.title,
  excerpt: writtenArticles.excerpt,
  status: writtenArticles.status,
  respondToId: writtenArticles.respondToId,
  sourceUrl: writtenArticles.sourceUrl,
  sourceTitle: writtenArticles.sourceTitle,
  reportId: writtenArticles.reportId,
  createdAt: writtenArticles.createdAt,
  updatedAt: writtenArticles.updatedAt,
  publishedAt: writtenArticles.publishedAt,
};

type Joined = Omit<WrittenArticleSummary, 'status' | 'authorName'> & {
  status: string;
  authorName: string | null;
};

const summarise = (row: Joined): WrittenArticleSummary => ({
  ...row,
  authorName: row.authorName?.trim() || 'A reader',
  status: row.status as WritingStatus,
});

export async function createWrittenArticle(
  db: Db,
  authorId: string,
  input: WritingInput,
): Promise<{ id: string }> {
  const id = newPublicId();
  const now = new Date();
  await db.insert(writtenArticles).values({
    id,
    authorId,
    title: input.title,
    body: input.body,
    excerpt: excerptOf(input.body),
    status: input.status,
    respondToId: input.respondToId,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === 'published' ? now : null,
  });
  return { id };
}

/** The article with its body, or null. A draft is returned only to its author. */
export async function getWrittenArticle(
  db: Db,
  id: string,
  viewerId: string | null = null,
): Promise<WrittenArticle | null> {
  const [row] = await db
    .select({ ...columns, body: writtenArticles.body })
    .from(writtenArticles)
    .leftJoin(users, eq(users.id, writtenArticles.authorId))
    .where(eq(writtenArticles.id, id))
    .limit(1);
  if (!row) return null;
  if (row.status !== 'published' && row.authorId !== viewerId) return null;
  return { ...summarise(row), body: row.body };
}

export type UpdateOutcome = { ok: true } | { ok: false; reason: 'not_found' | 'forbidden' };

export async function updateWrittenArticle(
  db: Db,
  id: string,
  authorId: string,
  input: WritingInput,
): Promise<UpdateOutcome> {
  const [row] = await db
    .select({ authorId: writtenArticles.authorId, publishedAt: writtenArticles.publishedAt })
    .from(writtenArticles)
    .where(eq(writtenArticles.id, id))
    .limit(1);
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.authorId !== authorId) return { ok: false, reason: 'forbidden' };
  const now = new Date();
  await db
    .update(writtenArticles)
    .set({
      title: input.title,
      body: input.body,
      excerpt: excerptOf(input.body),
      status: input.status,
      sourceUrl: input.sourceUrl,
      sourceTitle: input.sourceTitle,
      updatedAt: now,
      // The first publication keeps its date through later edits.
      publishedAt: input.status === 'published' ? (row.publishedAt ?? now) : row.publishedAt,
    })
    .where(eq(writtenArticles.id, id));
  return { ok: true };
}

export async function deleteWrittenArticle(
  db: Db,
  id: string,
  authorId: string,
): Promise<UpdateOutcome> {
  const deleted = await db
    .delete(writtenArticles)
    .where(and(eq(writtenArticles.id, id), eq(writtenArticles.authorId, authorId)))
    .returning({ id: writtenArticles.id });
  if (deleted.length) return { ok: true };
  const [row] = await db
    .select({ id: writtenArticles.id })
    .from(writtenArticles)
    .where(eq(writtenArticles.id, id))
    .limit(1);
  return { ok: false, reason: row ? 'forbidden' : 'not_found' };
}

/** Record the examination of this text; only the author's examination counts. */
export async function setWrittenArticleReport(
  db: Db,
  id: string,
  authorId: string,
  reportId: string,
): Promise<void> {
  await db
    .update(writtenArticles)
    .set({ reportId })
    .where(and(eq(writtenArticles.id, id), eq(writtenArticles.authorId, authorId)));
}

/** Published articles, newest first. */
export async function listPublishedArticles(db: Db, limit = 50): Promise<WrittenArticleSummary[]> {
  const rows = await db
    .select(columns)
    .from(writtenArticles)
    .leftJoin(users, eq(users.id, writtenArticles.authorId))
    .where(eq(writtenArticles.status, 'published'))
    .orderBy(desc(writtenArticles.publishedAt))
    .limit(limit);
  return rows.map(summarise);
}

/** Everything one person wrote, drafts included, newest change first. */
export async function listArticlesByAuthor(
  db: Db,
  authorId: string,
  limit = 100,
): Promise<WrittenArticleSummary[]> {
  const rows = await db
    .select(columns)
    .from(writtenArticles)
    .leftJoin(users, eq(users.id, writtenArticles.authorId))
    .where(eq(writtenArticles.authorId, authorId))
    .orderBy(desc(writtenArticles.updatedAt))
    .limit(limit);
  return rows.map(summarise);
}

/** Published responses to one article, oldest first (a conversation reads down). */
export async function listResponses(
  db: Db,
  id: string,
  limit = 100,
): Promise<WrittenArticleSummary[]> {
  const rows = await db
    .select(columns)
    .from(writtenArticles)
    .leftJoin(users, eq(users.id, writtenArticles.authorId))
    .where(and(eq(writtenArticles.respondToId, id), eq(writtenArticles.status, 'published')))
    .orderBy(writtenArticles.publishedAt)
    .limit(limit);
  return rows.map(summarise);
}
