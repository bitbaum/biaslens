import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createAuthInstance } from '@bitbaum/accountkit/auth/server';
import { authSchema } from '@bitbaum/accountkit/auth/schema';
import { afterAll, beforeAll, expect, it } from 'vitest';

const pg = new PGlite();
const origin = 'https://biaslens.example.ch';
let auth: ReturnType<typeof createAuthInstance>;

beforeAll(async () => {
  await pg.exec(
    `CREATE TABLE "Article" (id text PRIMARY KEY, url text UNIQUE, "createdAt" timestamp); INSERT INTO "Article" VALUES ('legacy-1', 'https://example.org/old', now());`,
  );
  await pg.exec(
    await readFile(new URL('../../scripts/reconcile-legacy-article.sql', import.meta.url), 'utf8'),
  );
  // Execute the app's committed migrations, not an independently generated
  // test schema: this catches a package/schema/deployment mismatch.
  for (const name of ['0000_nosy_thor_girl', '0001_tan_luminals']) {
    await pg.exec(await readFile(new URL(`../../drizzle/${name}.sql`, import.meta.url), 'utf8'));
  }
  auth = createAuthInstance({
    site: { url: origin, title: 'BiasLens', slug: 'biaslens' },
    database: drizzle(pg, { schema: authSchema }),
    mail: { configured: false, send: async () => undefined },
    env: {
      NODE_ENV: 'test',
      BETTER_AUTH_SECRET: 'integration-only-secret-0000000000000000000000000000000',
    },
  });
}, 30_000);
afterAll(() => pg.close());

function post(path: string, body: unknown, cookie = '') {
  return auth.handler(
    new Request(origin + '/api/auth' + path, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    }),
  );
}
function cookieOf(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}
async function session(cookie: string) {
  return (
    await auth.handler(new Request(origin + '/api/auth/get-session', { headers: { cookie } }))
  ).json();
}

it('preserves legacy article rows while creating the current schema, and is safe to rerun', async () => {
  expect((await pg.query('SELECT id FROM "Article_prisma_legacy_20261023"')).rows).toEqual([
    { id: 'legacy-1' },
  ]);
  expect((await pg.query('SELECT id FROM "Article"')).rows).toEqual([]);
  await pg.exec(
    await readFile(new URL('../../scripts/reconcile-legacy-article.sql', import.meta.url), 'utf8'),
  );
  expect((await pg.query('SELECT id FROM "Article_prisma_legacy_20261023"')).rows).toHaveLength(1);
});

it('registers, persists a session, rejects a wrong password, signs out and signs back in using the committed schema', async () => {
  const credentials = {
    email: 'researcher@example.ch',
    password: 'a long test passphrase',
    name: 'Researcher',
  };
  const registered = await post('/sign-up/email', { ...credentials, role: 'admin' });
  expect(registered.status).toBe(200);
  const cookie = cookieOf(registered);
  const signedIn = await session(cookie);
  expect(signedIn.user.email).toBe(credentials.email);
  expect(signedIn.user.role).not.toBe('admin');
  expect(
    (await post('/sign-in/email', { email: credentials.email, password: 'the wrong password' }))
      .status,
  ).toBe(401);
  expect((await post('/sign-out', {}, cookie)).status).toBe(200);
  expect(await session(cookie)).toBeNull();
  const restored = await post('/sign-in/email', credentials);
  expect(restored.status).toBe(200);
  expect((await session(cookieOf(restored))).user.id).toBe(signedIn.user.id);
}, 20_000);
