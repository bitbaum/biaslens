import { readdir, readFile } from 'node:fs/promises';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { analyzeArticle } from '@/lib/analysis/run';
import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from '@/lib/analysis/test-fixture';
import * as schema from '@/lib/db/schema';

import {
  createReply,
  findCachedReport,
  getReply,
  getReport,
  newPublicId,
  saveReport,
  type Db,
} from './store';

const pg = new PGlite();
const db = drizzle(pg, { schema }) as unknown as Db;

beforeAll(async () => {
  // The committed migrations, in order: the schema production actually runs.
  const directory = new URL('../../../drizzle/', import.meta.url);
  for (const name of (await readdir(directory))
    .filter((file) => /^\d{4}_.*\.sql$/.test(file))
    .sort()) {
    await pg.exec(await readFile(new URL(name, directory), 'utf8'));
  }
}, 30_000);
afterAll(() => pg.close());

let modelCalls = 0;
const deps = () => ({
  readSource: async () => ({ ok: false as const, url: '', reason: 'unused' }),
  complete: async (_messages: unknown, pass: 'reading' | 'assessment') => {
    modelCalls++;
    return {
      text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : FIXTURE_ASSESSMENT),
      modelId: 'mock',
    };
  },
  cache: {
    find: async (key: Parameters<typeof findCachedReport>[1]) => {
      const saved = await findCachedReport(db, key);
      return saved && { id: saved.id, result: saved.result };
    },
    save: (result: Parameters<typeof saveReport>[1]) => saveReport(db, result),
  },
});
const input = {
  mode: 'text' as const,
  url: null,
  text: FIXTURE_ARTICLE,
  outputLanguage: 'de' as const,
};

describe('saved reports', () => {
  it('saves a report without the article text and serves the same text from the cache', async () => {
    const first = await analyzeArticle(input, deps());
    expect(first.saved).toMatchObject({ cached: false });
    const callsAfterFirst = modelCalls;

    const second = await analyzeArticle(input, deps());
    expect(modelCalls).toBe(callsAfterFirst);
    expect(second.saved).toEqual({ id: first.saved!.id, cached: true });
    expect(second.sourceText).toBe(first.sourceText);

    const stored = await getReport(db, first.saved!.id);
    expect(stored?.result.sourceText).toBeNull();
    expect(JSON.stringify(stored?.result)).not.toContain(
      'Kritiker aus der Verwaltung sprechen von einer gefährlichen Entwicklung, wollen',
    );
    expect(stored?.result.report.detections).toHaveLength(3);
  });

  it('keeps languages apart and refuses malformed ids', async () => {
    const english = await analyzeArticle({ ...input, outputLanguage: 'en' }, deps());
    const german = await analyzeArticle(input, deps());
    expect(english.saved!.id).not.toBe(german.saved!.id);
    expect(await getReport(db, "x'; drop table")).toBeNull();
    expect(await getReport(db, newPublicId())).toBeNull();
  });

  it('creates a reply and reads it back with its report', async () => {
    const result = await analyzeArticle(input, deps());
    const id = await createReply(db, {
      reportId: result.saved!.id,
      parentReplyId: null,
      occasion: 'friend',
      length: 'line',
      blocks: ['findings', 'voices'],
      senderName: 'Anna',
      note: 'Schau dir die Zahlen an.',
    });
    const loaded = await getReply(db, id);
    expect(loaded?.reply).toMatchObject({ blocks: ['findings', 'voices'], senderName: 'Anna' });
    expect(loaded?.report.id).toBe(result.saved!.id);
  });
});
