import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReplyLauncher } from '@/app/_components/replies/ReplyLauncher';
import { ReportView } from '@/app/analyze/report/ReportView';
import { PUBLIC_ID } from '@/lib/reports/store';
import { loadReport } from '@/lib/reports/load';

import styles from './saved.module.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reply?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const saved = await loadReport(id);
  if (!saved) return { title: 'Reading not found' };
  const { report } = saved.result;
  return {
    title: report.title,
    description: report.insight.headline,
    openGraph: { title: report.title, description: report.insight.headline, type: 'article' },
    twitter: { card: 'summary_large_image' },
    robots: { index: false },
  };
}

export default async function SavedReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { reply } = await searchParams;
  const saved = await loadReport(id);
  if (!saved) notFound();
  const parent = reply && PUBLIC_ID.test(reply) ? reply : null;
  return (
    <main id="main-content" className={`${styles.page} bb-frame`}>
      <ReportView
        result={saved.result}
        actions={
          <ReplyLauncher
            reportId={saved.id}
            result={saved.result}
            parentReplyId={parent}
            initiallyOpen={!!parent}
          />
        }
        after={
          <aside className={styles.funnel}>
            <p>See who speaks and which passages carry the argument in any article you read.</p>
            <Link className="bb-button bb-button--secondary" href="/analyze">
              Examine any article
            </Link>
          </aside>
        }
      />
    </main>
  );
}
