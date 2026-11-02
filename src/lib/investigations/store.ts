/**
 * Saved investigations. Readable by link; writable with the edit token that
 * creation returns once. Only the token's SHA-256 is stored, and the
 * comparison is constant-time. Every write is validated as untrusted input.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { Investigation } from '@/lib/domain/investigation';
import { validateInvestigation } from '@/lib/domain/investigation';
import { investigations } from '@/lib/db/schema';
import { newPublicId, type Db } from '@/lib/reports/store';

export interface SavedInvestigation {
  id: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  investigation: Investigation;
}

export class InvestigationInvalid extends Error {
  constructor(public problems: string[]) {
    super('Investigation is invalid');
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function newEditToken(): string {
  return randomBytes(24).toString('base64url');
}

function toSaved(row: typeof investigations.$inferSelect): SavedInvestigation {
  return {
    id: row.id,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    investigation: row.data as Investigation,
  };
}

function check(investigation: Investigation) {
  const problems = validateInvestigation(investigation);
  if (problems.length) throw new InvestigationInvalid(problems);
}

export async function createInvestigation(
  db: Db,
  investigation: Investigation,
): Promise<{ id: string; editToken: string; revision: number }> {
  check(investigation);
  const id = newPublicId();
  const editToken = newEditToken();
  await db.insert(investigations).values({
    id,
    editTokenSha256: sha256(editToken),
    title: investigation.question.slice(0, 300),
    data: investigation,
  });
  return { id, editToken, revision: 1 };
}

export async function getInvestigation(db: Db, id: string): Promise<SavedInvestigation | null> {
  const [row] = await db.select().from(investigations).where(eq(investigations.id, id)).limit(1);
  return row ? toSaved(row) : null;
}

export type UpdateOutcome =
  | { ok: true; revision: number }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'conflict'; revision?: number };

/** Replace the investigation if the token matches and nobody saved in between. */
export async function updateInvestigation(
  db: Db,
  id: string,
  editToken: string,
  baseRevision: number,
  investigation: Investigation,
): Promise<UpdateOutcome> {
  check(investigation);
  const [row] = await db.select().from(investigations).where(eq(investigations.id, id)).limit(1);
  if (!row) return { ok: false, reason: 'not_found' };
  const given = Buffer.from(sha256(editToken), 'hex');
  const stored = Buffer.from(row.editTokenSha256, 'hex');
  if (given.length !== stored.length || !timingSafeEqual(given, stored))
    return { ok: false, reason: 'forbidden' };
  const updated = await db
    .update(investigations)
    .set({
      data: investigation,
      title: investigation.question.slice(0, 300),
      revision: baseRevision + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(investigations.id, id), eq(investigations.revision, baseRevision)))
    .returning({ revision: investigations.revision });
  if (!updated.length) return { ok: false, reason: 'conflict', revision: row.revision };
  return { ok: true, revision: updated[0].revision };
}
