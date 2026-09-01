import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

/**
 * The single Drizzle client for the whole app — the one door to stored state.
 *
 * Lazy initialization: the pool is created on first use, not at import time, so
 * `next build` (which prerenders without a database) and CI (which has none)
 * never open a connection — the error only fires when a route actually handles
 * a request without DATABASE_URL.
 *
 * Next.js re-evaluates server modules on every hot reload in development; a
 * fresh pool per reload would leak connections until Postgres refuses new ones.
 * We therefore cache the instance on `globalThis` in dev. In production the
 * module is evaluated once, so a plain singleton suffices. Every server module
 * imports this rather than constructing its own client (SSOT for DB access).
 */
type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db?: Db };

function getDb(): Db {
  if (!globalForDb.db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Required for database operations.');
    }
    globalForDb.db = drizzle(new Pool({ connectionString: url }), { schema });
  }
  return globalForDb.db;
}

/** Proxy that lazily initializes the DB on first property access. */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    return typeof value === 'function' ? value.bind(realDb) : value;
  },
});

export type Database = typeof db;
