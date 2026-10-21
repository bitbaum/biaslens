import type { Metadata } from 'next';

import { AnalyzeWorkspace } from './AnalyzeWorkspace';

export const metadata: Metadata = {
  title: 'Examine an article · BiasLens',
  description:
    'Extract claims, examine framing and apply first-principles criticism to an article URL or pasted text.',
};

export default function AnalyzePage() {
  return <AnalyzeWorkspace />;
}
