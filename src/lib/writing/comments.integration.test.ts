import { readdir, readFile } from 'node:fs/promises';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { user as users } from '@bitbaum/accountkit/auth/schema';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/reports/store';

import { addComment, deleteComment, listComments, parseCommentInput } from './comments';
import { createWrittenArticle, deleteWrittenArticle } from './store';

const pg = new PGlite();
const db = drizzle(pg, { schema }) as unknown as Db;

beforeAll(async () => {
  const directory = new URL('../../../drizzle/', import.meta.url);
  for (const name of (await readdir(directory))
    .filter((file) => /^\d{4}_.*\.sql$/.test(file))
    .sort()) {
    await pg.exec(await readFile(new URL(name, directory), 'utf8'));
  }
  await db.insert(users).values([
    { id: 'anna', name: 'Anna', email: 'anna@example.org', emailVerified: true },
    { id: 'ben', name: 'Ben', email: 'ben@example.org', emailVerified: true },
    { id: 'cy', name: 'Cy', email: 'cy@example.org', emailVerified: true },
  ]);
}, 30_000);
afterAll(() => pg.close());

const article = () =>
  createWrittenArticle(db, 'anna', {
    title: 'T',
    body: 'B',
    status: 'published',
    respondToId: null,
    sourceUrl: null,
    sourceTitle: null,
  });

describe('comments', () => {
  it('lists oldest first with the author’s name', async () => {
    const { id } = await article();
    await addComment(db, id, 'ben', 'First');
    await addComment(db, id, 'cy', 'Second');
    expect((await listComments(db, id)).map((c) => [c.authorName, c.body])).toEqual([
      ['Ben', 'First'],
      ['Cy', 'Second'],
    ]);
  });

  it('is removed by its author or the article’s author, nobody else', async () => {
    const { id } = await article();
    const c = await addComment(db, id, 'ben', 'Hm');
    expect(await deleteComment(db, c.id, 'cy', 'anna')).toBe(false);
    expect(await deleteComment(db, c.id, 'anna', 'anna')).toBe(true);
    const d = await addComment(db, id, 'ben', 'Again');
    expect(await deleteComment(db, d.id, 'ben', 'anna')).toBe(true);
    expect(await listComments(db, id)).toEqual([]);
  });

  it('goes with the article when the article is deleted', async () => {
    const { id } = await article();
    await addComment(db, id, 'ben', 'Gone soon');
    await deleteWrittenArticle(db, id, 'anna');
    expect(await listComments(db, id)).toEqual([]);
  });

  it('checks the text', () => {
    expect(parseCommentInput({ body: '  ' }).ok).toBe(false);
    expect(parseCommentInput({ body: 'x'.repeat(2001) }).ok).toBe(false);
    expect(parseCommentInput({ body: ' ok ' })).toEqual({ ok: true, body: 'ok' });
  });
});
