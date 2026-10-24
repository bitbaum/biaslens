import Link from 'next/link';
import { HeroSection } from '@bitbaum/sitekit/react';
import { QuestionLab } from './QuestionLab';
import { EvidenceVerifier } from './EvidenceVerifier';
import styles from './home.module.css';
const tools = [
  {
    number: '01',
    title: 'Examine text',
    description:
      'Bring an article or a passage. Find the claims, supporting quotes and assumptions.',
    href: '/analyze',
    input: 'URL or pasted text',
  },
  {
    number: '02',
    title: 'Build an investigation',
    description:
      'Keep a question, its sources and competing explanations together in your notebook.',
    href: '/explore',
    input: 'Your question and sources',
  },
  {
    number: '03',
    title: 'Analyse a conversation',
    description: 'Measure speaking time and overlap in an interview, debate or earnings call.',
    href: '/debates',
    input: 'Timestamped transcript',
  },
];
export default function Home() {
  return (
    <main id="main-content">
      <section className={`bb-frame ${styles.hero}`}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>
            <span aria-hidden="true" />A clearer view of the world
          </p>
          <HeroSection
            appearance="application"
            section={{
              kind: 'hero',
              statement: 'Look closer.\nThink further.',
              lead: [
                'Turn a source into a better question. Examine the claims, follow the evidence and see what could change your mind.',
              ],
              actions: [
                { href: '/analyze', label: 'Examine an article' },
                { href: '/workspace', label: 'Open workspace' },
              ],
            }}
          />
          <p className={styles.notice}>
            No account needed to start. AI interpretations are provisional.
          </p>
          <div className={styles.subjects}>
            <span>Science</span>
            <span>Finance</span>
            <span>Health</span>
            <span>Public life</span>
            <span>And your questions</span>
          </div>
        </div>
        <QuestionLab />
      </section>
      <section className={`bb-frame ${styles.paths}`} aria-labelledby="tools-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>THE WORKSPACE</p>
            <h2 id="tools-title">Three ways to look closer.</h2>
          </div>
          <p>
            Start with what you have.
            <br />
            Keep the reasoning open to challenge.
          </p>
        </div>
        <div className={styles.toolGrid}>
          {tools.map((tool) => (
            <Link href={tool.href} className={styles.toolCard} key={tool.href}>
              <span className={styles.toolNumber}>
                {tool.number}
                <span aria-hidden="true">→</span>
              </span>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <small>{tool.input}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className={`bb-frame ${styles.method}`} aria-labelledby="method-title">
        <div>
          <p className={styles.kicker}>A METHOD YOU CAN INSPECT</p>
          <h2 id="method-title">The evidence stays in view.</h2>
          <p>
            See the passage behind a claim. Separate an observation from an interpretation. Ask what
            a conclusion depends on.
          </p>
          <Link href="/methodology">Read our method →</Link>
        </div>
        <ol>
          {[
            { title: 'Trace the source', text: 'Inspect the exact text behind an assessment.' },
            { title: 'Test the explanation', text: 'Look for assumptions and alternative causes.' },
            {
              title: 'Keep uncertainty visible',
              text: 'Distinguish what is supported from what still needs checking.',
            },
          ].map((item, index) => (
            <li key={item.title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className={`bb-frame ${styles.lab}`} aria-labelledby="lab-title">
        <div>
          <p className={styles.kicker}>A SMALL EXPERIMENT</p>
          <h2 id="lab-title">Ten headlines. One source?</h2>
          <p>Explore why repeated claims are not independent evidence.</p>
        </div>
        <details className={styles.labDetails}>
          <summary>
            Try the evidence-counting demonstration <span aria-hidden="true">+</span>
          </summary>
          <div className={styles.labContent}>
            <EvidenceVerifier />
          </div>
        </details>
      </section>
    </main>
  );
}
