import { readdir, readFile } from 'node:fs/promises';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as schema from '@/lib/db/schema';
import type { Db } from '@/lib/reports/store';

import { HOUSING_DEMO } from './housing-demo';
import {
  createInvestigation,
  getInvestigation,
  InvestigationInvalid,
  updateInvestigation,
} from './store';

const pg = new PGlite();
const db = drizzle(pg, { schema }) as unknown as Db;

beforeAll(async () => {
  const directory = new URL('../../../drizzle/', import.meta.url);
  for (const name of (await readdir(directory)).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
    await pg.exec(await readFile(new URL(name, directory), 'utf8'));
  }
}, 30_000);
afterAll(() => pg.close());

describe('investigation store', () => {
  it('saves the housing investigation, reads it back and updates it with the token', async () => {
    const created = await createInvestigation(db, HOUSING_DEMO);
    const saved = await getInvestigation(db, created.id);
    expect(saved?.investigation.studies).toHaveLength(HOUSING_DEMO.studies.length);

    const next = structuredClone(HOUSING_DEMO);
    next.links[0].review = 'reviewed';
    next.notes = 'Checked the Eurostat definition.';
    const outcome = await updateInvestigation(db, created.id, created.editToken, 1, next);
    expect(outcome).toEqual({ ok: true, revision: 2 });
    expect((await getInvestigation(db, created.id))?.investigation.notes).toBe(
      'Checked the Eurostat definition.',
    );
  });

  it('refuses a wrong token and a stale revision', async () => {
    const created = await createInvestigation(db, HOUSING_DEMO);
    expect(await updateInvestigation(db, created.id, 'wrong', 1, HOUSING_DEMO)).toEqual({
      ok: false,
      reason: 'forbidden',
    });
    await updateInvestigation(db, created.id, created.editToken, 1, HOUSING_DEMO);
    expect(await updateInvestigation(db, created.id, created.editToken, 1, HOUSING_DEMO)).toEqual({
      ok: false,
      reason: 'conflict',
      revision: 2,
    });
  });

  it('refuses an invalid investigation before writing', async () => {
    const broken = structuredClone(HOUSING_DEMO);
    broken.links[0].claimId = 'missing';
    await expect(createInvestigation(db, broken)).rejects.toBeInstanceOf(InvestigationInvalid);
  });
});
