import { cache } from 'react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db/client';

import { getWrittenArticle, listResponses } from './store';

/** Page-level loaders, memoised per request. Without a database there is nothing written. */
export const loadWrittenArticle = cache(async (id: string) => {
  if (!process.env.DATABASE_URL) return null;
  const session = await getSession();
  return getWrittenArticle(db, id, session?.user.id ?? null);
});

export const loadResponses = cache(async (id: string) =>
  process.env.DATABASE_URL ? listResponses(db, id) : [],
);

/** The public JSON another product (OrangeCat's composer) imports. */
export function articleExport(
  article: NonNullable<Awaited<ReturnType<typeof loadWrittenArticle>>>,
  origin: string | null,
) {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    author: article.authorName,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    canonical: origin ? `${origin}/articles/${article.id}` : null,
  };
}
