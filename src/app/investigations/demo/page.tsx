import Link from 'next/link';

import { HOUSING_DEMO } from '@/lib/investigations/housing-demo';

import '@bitbaum/chartkit/styles.css';

import { detectGaps } from '@/lib/domain/gaps';

import { EvidenceCharts } from '../EvidenceCharts';
import { GapDesk } from '../GapDesk';
import { InvestigationEditor } from '../InvestigationEditor';
import { VersionHistory } from '../VersionHistory';
import { InvestigationView } from '../InvestigationView';
import styles from '../investigation.module.css';

export const metadata = {
  title: 'Investigation: housing cost overburden',
  description:
    'A Euronews article on housing cost overburden, its claims linked to studies on supply constraints, upzoning and rent control.',
};

export default function HousingDemoPage() {
  return (
    <main id="main-content" className={`${styles.page} bb-frame`}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Multi-source investigation · demo</p>
        <h1>{HOUSING_DEMO.question}</h1>
        <p>
          One article, {HOUSING_DEMO.studies.length} sources from several sides. Each claim is set
          against specific findings, with the study design, the horizon it measures and what would
          prove it wrong. <Link href="/methodology">How the method works</Link>.
        </p>
      </header>
      <GapDesk
        id={null}
        revision={0}
        investigation={HOUSING_DEMO}
        gaps={detectGaps(HOUSING_DEMO)}
      />
      <VersionHistory investigation={HOUSING_DEMO} />
      <EvidenceCharts investigation={HOUSING_DEMO} />
      <InvestigationView investigation={HOUSING_DEMO} />
      <InvestigationEditor id={null} revision={0} investigation={HOUSING_DEMO} />
    </main>
  );
}
