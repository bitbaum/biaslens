import Link from 'next/link';

import { DebateArena } from './DebateArena';
import styles from './arena.module.css';

export const metadata = {
  title: 'Analyse a conversation',
  description:
    'Explore airtime from timestamped interviews, earnings calls, debates and public discussions with open, reviewable rules.',
};

export default function DebatePage() {
  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Timed transcripts</p>
          <h1>Conversation analysis.</h1>
          <p className={styles.lead}>
            Measure speaking time and overlap in a debate, interview, panel or earnings call. Start
            with a timestamped transcript.
          </p>
          <p className={styles.note}>
            Transcripts stay in your browser. Audio/video upload and automatic transcription are not
            available yet.
          </p>
        </header>
        <DebateArena />
        <aside className={styles.next}>
          <h2>What this analysis cannot decide</h2>
          <p>
            Equal airtime does not prove equal treatment. Unequal airtime does not prove bias. The
            moderator&apos;s question types, answer opportunities and relevant context require
            independent, timestamped review.
          </p>
          <Link href="/blog/how-to-measure-a-political-debate">
            Read the public methodology for analysing debates →
          </Link>
        </aside>
      </main>
    </>
  );
}
