/**
 * Saved reports and replies. Every function takes the database as an argument
 * so the same code runs against Postgres in production and PGlite in tests.
 *
 * What is stored: the report (claims, voices, located passages, judgements),
 * never the full article text. A public page may quote a passage; it must not
 * republish an article. The examined text is re-read from its source whenever
 * a reader needs it, and its SHA-256 proves it is the same text.
 */
import { randomBytes } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import type { ArticleAnalysisResult, ReportResult } from '@/lib/analysis/run';
import * as schema from '@/lib/db/schema';
import { replies, savedReports } from '@/lib/db/schema';
import { isOutputLanguage } from '@/lib/config/languages';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const VISIBILITIES = ['public', 'unlisted'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A short, unguessable public id (10 characters, ~57 bits). */
export function newPublicId(length = 10): string {
  const bytes = randomBytes(length * 2);
  let id = '';
  for (const byte of bytes) {
    // Rejection sampling keeps the alphabet uniform.
    if (byte >= 256 - (256 % ALPHABET.length)) continue;
    id += ALPHABET[byte % ALPHABET.length];
    if (id.length === length) break;
  }
  return id.length === length ? id : newPublicId(length);
}

export const PUBLIC_ID = /^[a-zA-Z0-9]{8,16}$/;

export interface SavedReport {
  id: string;
  createdAt: Date;
  result: ReportResult;
}

function toSaved(row: typeof savedReports.$inferSelect): SavedReport {
  return { id: row.id, createdAt: row.createdAt, result: row.result as ReportResult };
}

export async function findCachedReport(
  db: Db,
  key: { textSha256: string; promptVersion: string; language: string },
): Promise<SavedReport | null> {
  const [row] = await db
    .select()
    .from(savedReports)
    .where(
      and(
        eq(savedReports.textSha256, key.textSha256),
        eq(savedReports.promptVersion, key.promptVersion),
        eq(savedReports.language, key.language),
      ),
    )
    .limit(1);
  return row ? toSaved(row) : null;
}

export async function saveReport(db: Db, result: ArticleAnalysisResult): Promise<string> {
  const stored: ReportResult = { ...result, sourceText: null };
  const visibility: Visibility = result.origin.kind === 'user-pasted-text' ? 'unlisted' : 'public';
  const id = newPublicId();
  const inserted = await db
    .insert(savedReports)
    .values({
      id,
      textSha256: result.origin.textSha256,
      promptVersion: result.run.promptVersion,
      language: result.language,
      url: result.origin.url,
      title: result.report.title,
      visibility,
      result: stored,
    })
    .onConflictDoNothing()
    .returning({ id: savedReports.id });
  if (inserted[0]) return inserted[0].id;
  // Another request saved the same text first: its link is the link.
  const existing = await findCachedReport(db, {
    textSha256: result.origin.textSha256,
    promptVersion: result.run.promptVersion,
    language: result.language,
  });
  if (!existing) throw new Error('Report could not be saved.');
  return existing.id;
}

export async function getReport(db: Db, id: string): Promise<SavedReport | null> {
  if (!PUBLIC_ID.test(id)) return null;
  const [row] = await db.select().from(savedReports).where(eq(savedReports.id, id)).limit(1);
  if (!row || !isOutputLanguage((row.result as ReportResult).language)) return null;
  return toSaved(row);
}

// ————— Replies —————

export interface ReplyInput {
  reportId: string;
  parentReplyId: string | null;
  occasion: string;
  length: string;
  blocks: string[];
  senderName: string | null;
  note: string | null;
}

export interface SavedReply extends ReplyInput {
  id: string;
  createdAt: Date;
}

export async function createReply(db: Db, input: ReplyInput): Promise<string> {
  const id = newPublicId();
  await db.insert(replies).values({ id, ...input });
  return id;
}

export async function getReply(
  db: Db,
  id: string,
): Promise<{ reply: SavedReply; report: SavedReport } | null> {
  if (!PUBLIC_ID.test(id)) return null;
  const [row] = await db
    .select({ reply: replies, report: savedReports })
    .from(replies)
    .innerJoin(savedReports, eq(replies.reportId, savedReports.id))
    .where(eq(replies.id, id))
    .limit(1);
  if (!row) return null;
  return {
    reply: { ...row.reply, blocks: row.reply.blocks as string[] },
    report: toSaved(row.report),
  };
}
