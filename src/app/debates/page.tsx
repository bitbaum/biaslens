import Link from 'next/link';

import { SiteFooter, SiteHeader } from '@/app/_components/Chrome';

import { DebateArena } from './DebateArena';
import styles from './arena.module.css';

export const metadata = {
  title: 'Debate Arena',
  description:
    'Explore airtime from timestamped political debates and public discussions with open, reviewable rules.',
};

export default function DebatePage() {
  return (
    <>
      <SiteHeader current="arena" />
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Debate Arena / First measurable layer</p>
          <h1>Who actually got the floor?</h1>
          <p className={styles.lead}>
            Begin with timestamped speaker turns. Compare speaking time and overlap without
            pretending a stopwatch proves fairness, intentions or factual truth.
          </p>
          <p className={styles.note}>
            This beta works with a manually timed transcript. Automatic video transcription,
            diarisation, speaker correction and independent source verification are not yet
            available.
          </p>
        </header>
        <DebateArena />
        <aside className={styles.next}>
          <h2>What this analysis cannot decide</h2>
          <p>
            Equal airtime does not prove equal treatment. Unequal airtime does not prove bias. The
            moderator's question types, answer opportunities and relevant context require
            independent, timestamped review.
          </p>
          <Link href="/blog/how-to-measure-a-political-debate">
            Read the public methodology for analysing debates ↗
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
