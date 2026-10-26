import type { Metadata } from 'next';

import { AnalyzeWorkspace } from './AnalyzeWorkspace';

export const metadata: Metadata = {
  title: 'Examine an article',
  description:
    'See who speaks, which claims rest on what, and which passages shape the conclusion of an article, a PDF or pasted text.',
};

export default function AnalyzePage() {
  return <AnalyzeWorkspace />;
}
