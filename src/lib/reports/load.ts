import { cache } from 'react';

import { db } from '@/lib/db/client';

import { getReply, getReport } from './store';

/**
 * Page-level loaders, memoised per request so the page, its metadata and its
 * image read the database once. Without a database there are no saved pages.
 */
export const loadReport = cache(async (id: string) =>
  process.env.DATABASE_URL ? getReport(db, id) : null,
);

export const loadReply = cache(async (id: string) =>
  process.env.DATABASE_URL ? getReply(db, id) : null,
);
