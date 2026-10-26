import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AnalyzeWorkspace } from './AnalyzeWorkspace';

export const metadata: Metadata = {
  title: 'Examine an article',
  description:
    'See who speaks, which claims rest on what, and which passages shape the conclusion of an article, a PDF or pasted text.',
};

export default function AnalyzePage() {
  // The form reads ?u= (a shared link); Suspense lets the page prerender without it.
  return (
    <Suspense>
      <AnalyzeWorkspace />
    </Suspense>
  );
}
