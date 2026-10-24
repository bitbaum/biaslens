import Link from 'next/link';
import { HeroSection } from '@bitbaum/sitekit/react';
import { NotebookResume } from './NotebookResume';
import styles from './workspace.module.css';

export const metadata = { title: 'Your investigation workspace' };
const tools = [
  {
    number: '01',
    href: '/analyze',
    title: 'Examine a source',
    description:
      'Unpack an argument. Trace the quotes, assumptions and evidence that could change your mind.',
    input: 'Article URL or pasted text',
    status: 'AI-assisted · provisional interpretation',
  },
  {
    number: '02',
    href: '/explore',
    title: 'Investigate a question',
    description:
      'Keep sources, competing explanations and open challenges beside the question you are exploring.',
    input: 'A question in any field',
    status: 'Your notebook · saved in this browser',
  },
  {
    number: '03',
    href: '/debates',
    title: 'Analyse a conversation',
    description:
      'See who spoke, for how long, and where speakers overlapped. Inspect the timeline behind the numbers.',
    input: 'Timestamped transcript',
    status: 'Measured airtime & overlap · no automatic transcription',
  },
];
export default function Workspace() {
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <HeroSection
        appearance="application"
        section={{
          kind: 'hero',
          eyebrow: 'Your investigation workspace',
          statement: 'Follow a question.',
          lead: [
            'A scientific finding. A financial forecast. A conversation that left you wondering. Start with what you want to understand.',
          ],
        }}
      />
      <NotebookResume />
      <section className={styles.tools} aria-label="Choose an investigation tool">
        {tools.map((tool) => (
          <Link className={styles.tool} key={tool.href} href={tool.href}>
            <span className={styles.number}>
              {tool.number} / {tool.input}
            </span>
            <h2>
              {tool.title}
              <span aria-hidden="true">→</span>
            </h2>
            <p>{tool.description}</p>
            <small>{tool.status}</small>
          </Link>
        ))}
      </section>
      <section className={styles.context}>
        <div>
          <h2>One workspace. Any subject.</h2>
          <p>
            Science, markets, history, health, policy or everyday decisions. The tools examine
            reasoning and evidence; a familiar source or a confident answer is never a substitute
            for checking.
          </p>
        </div>
        <div>
          <h2>Know what is saved.</h2>
          <p>
            Your notebook stays in this browser. Accounts manage identity and security; cloud
            history and cross-device sync are not available yet. Export notes to keep a copy.
          </p>
          <Link href="/account">Profile & security →</Link>
        </div>
      </section>
      <p className={styles.method}>
        Curious about how it works? <Link href="/methodology">Read the method</Link> ·{' '}
        <Link href="/development">Follow development</Link>
      </p>
    </main>
  );
}
