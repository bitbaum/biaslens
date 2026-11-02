import { notFound } from 'next/navigation';

import { db } from '@/lib/db/client';
import { getInvestigation } from '@/lib/investigations/store';
import { PUBLIC_ID } from '@/lib/reports/store';

import '@bitbaum/chartkit/styles.css';

import { detectGaps } from '@/lib/domain/gaps';

import { EvidenceCharts } from '../EvidenceCharts';
import { EpistemicMap } from '../EpistemicMap';
import { EvidenceCards } from '../EvidenceCards';
import { GapDesk } from '../GapDesk';
import { ReadingMode } from '../ReadingMode';
import { InvestigationImages } from '../InvestigationImages';
import { MethodTimeline } from '../MethodTimeline';
import { InvestigationEditor } from '../InvestigationEditor';
import { VersionHistory } from '../VersionHistory';
import { InvestigationView } from '../InvestigationView';
import styles from '../investigation.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Investigation', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function SavedInvestigationPage({ params }: Props) {
  const { id } = await params;
  if (!PUBLIC_ID.test(id) || !process.env.DATABASE_URL) notFound();
  const saved = await getInvestigation(db, id);
  if (!saved) notFound();
  return (
    <main id="main-content" className={`${styles.page} bb-frame`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          Multi-source investigation · revision {saved.revision} · updated{' '}
          {saved.updatedAt.toISOString().slice(0, 10)}
        </p>
        <h1>{saved.investigation.question}</h1>
      </header>
      <InvestigationImages images={saved.investigation.images} />
      <EpistemicMap investigation={saved.investigation} />
      <GapDesk
        id={saved.id}
        revision={saved.revision}
        investigation={saved.investigation}
        gaps={detectGaps(saved.investigation)}
      />
      <ReadingMode draft={saved.investigation.drafts?.at(-1)} />
      <VersionHistory investigation={saved.investigation} />
      <EvidenceCards id={saved.id} revision={saved.revision} investigation={saved.investigation} />
      <MethodTimeline investigation={saved.investigation} />
      <EvidenceCharts investigation={saved.investigation} />
      <InvestigationView investigation={saved.investigation} />
      <InvestigationEditor
        id={saved.id}
        revision={saved.revision}
        investigation={saved.investigation}
      />
    </main>
  );
}
