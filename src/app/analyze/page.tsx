import type { Metadata } from 'next';

import { incomingSource } from '@/lib/analysis/incoming';

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
  return <AnalyzeWorkspace incoming={incomingSource(await searchParams)} />;
}
