import type { Metadata } from 'next';

import { incomingSource } from '@/lib/analysis/incoming';
import { PUBLIC_ID } from '@/lib/reports/store';
import { loadWrittenArticle } from '@/lib/writing/load';

import { AnalyzeWorkspace } from './AnalyzeWorkspace';

export const metadata: Metadata = {
  title: 'Examine an article',
  description:
    'See who speaks, which claims rest on what, and which passages shape the conclusion of an article, a PDF or pasted text.',
};

// The link is read here, on the server, so the form is in the first HTML —
// a client-side useSearchParams would leave the page empty until it hydrates.
export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // /analyze?article=<id>: a piece written here, examined as pasted text.
  const articleId = Array.isArray(params.article) ? params.article[0] : params.article;
  const article =
    articleId && PUBLIC_ID.test(articleId) ? await loadWrittenArticle(articleId) : null;
  return (
    <AnalyzeWorkspace
      incoming={article ? null : incomingSource(params)}
      incomingArticle={
        article ? { id: article.id, title: article.title, text: article.body } : null
      }
    />
  );
}
