import { readdir, readFile } from 'node:fs/promises';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { user as users } from '@bitbaum/accountkit/auth/schema';
import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/reports/store';

import {
  createWrittenArticle,
  deleteWrittenArticle,
  getWrittenArticle,
  listArticlesByAuthor,
  listPublishedArticles,
  listResponses,
  setWrittenArticleReport,
  updateWrittenArticle,
} from './store';

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
    { id: 'ben', name: '  ', email: 'ben@example.org', emailVerified: true },
  ]);
}, 30_000);
afterAll(() => pg.close());

const input = (over: Partial<Parameters<typeof createWrittenArticle>[2]> = {}) => ({
  title: 'Why the city flooded',
  body: 'The river rose.\n\nNobody cleared the drains.',
  status: 'published' as const,
  respondToId: null,
  sourceUrl: null,
  sourceTitle: null,
  ...over,
});

describe('written articles', () => {
  it('publishes, reads with the author name and an excerpt, and lists newest first', async () => {
    const { id } = await createWrittenArticle(db, 'anna', input());
    const read = await getWrittenArticle(db, id);
    expect(read).toMatchObject({
      id,
      authorName: 'Anna',
      title: 'Why the city flooded',
      excerpt: 'The river rose.',
      status: 'published',
    });
    expect(read?.publishedAt).toBeInstanceOf(Date);
    const second = await createWrittenArticle(db, 'anna', input({ title: 'Second' }));
    expect((await listPublishedArticles(db)).map((a) => a.id)).toEqual([second.id, id]);
  });

  it('shows a draft to its author only and names a nameless author "A reader"', async () => {
    const { id } = await createWrittenArticle(db, 'ben', input({ status: 'draft' }));
    expect(await getWrittenArticle(db, id)).toBeNull();
    expect(await getWrittenArticle(db, id, 'anna')).toBeNull();
    expect((await getWrittenArticle(db, id, 'ben'))?.authorName).toBe('A reader');
    expect((await listPublishedArticles(db)).some((a) => a.id === id)).toBe(false);
    expect((await listArticlesByAuthor(db, 'ben')).map((a) => a.id)).toContain(id);
  });

  it('lets only the author change or delete, and keeps the first publication date', async () => {
    const { id } = await createWrittenArticle(db, 'anna', input());
    const first = (await getWrittenArticle(db, id))?.publishedAt;
    expect(await updateWrittenArticle(db, id, 'ben', input({ title: 'Hijacked' }))).toEqual({
      ok: false,
      reason: 'forbidden',
    });
    expect(await updateWrittenArticle(db, id, 'anna', input({ title: 'Edited' }))).toEqual({
      ok: true,
    });
    const edited = await getWrittenArticle(db, id);
    expect(edited?.title).toBe('Edited');
    expect(edited?.publishedAt?.getTime()).toBe(first?.getTime());
    expect(await updateWrittenArticle(db, 'nope123456', 'anna', input())).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await deleteWrittenArticle(db, id, 'ben')).toEqual({ ok: false, reason: 'forbidden' });
    expect(await deleteWrittenArticle(db, id, 'anna')).toEqual({ ok: true });
    expect(await deleteWrittenArticle(db, id, 'anna')).toEqual({ ok: false, reason: 'not_found' });
  });

  it('threads published responses under the article they answer, oldest first', async () => {
    const { id } = await createWrittenArticle(db, 'anna', input());
    const a = await createWrittenArticle(db, 'ben', input({ title: 'Reply A', respondToId: id }));
    const b = await createWrittenArticle(db, 'anna', input({ title: 'Reply B', respondToId: id }));
    await createWrittenArticle(
      db,
      'ben',
      input({ title: 'Draft', respondToId: id, status: 'draft' }),
    );
    expect((await listResponses(db, id)).map((r) => r.id)).toEqual([a.id, b.id]);
  });

  it('records the author’s examination of the text', async () => {
    const { id } = await createWrittenArticle(db, 'anna', input());
    await setWrittenArticleReport(db, id, 'ben', 'notTheAuthor');
    expect((await getWrittenArticle(db, id))?.reportId).toBeNull();
    await setWrittenArticleReport(db, id, 'anna', 'abcDEF2345');
    expect((await getWrittenArticle(db, id))?.reportId).toBe('abcDEF2345');
  });
});
