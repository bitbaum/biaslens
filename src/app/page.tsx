import Link from 'next/link';

import { BRAND } from '@/lib/config/brand';

import { SiteFooter, SiteHeader } from './_components/Chrome';
import { EvidenceVerifier } from './EvidenceVerifier';

import styles from './home.module.css';

const STEPS = [
  {
    number: '01',
    title: 'Read the actual claim',
    description:
      'Begin with what was said, by whom, and in which context. Separate observation from interpretation.',
  },
  {
    number: '02',
    title: 'Inspect the evidence',
    description:
      'See which sources the text names, what is merely asserted and what still needs independent checking.',
  },
  {
    number: '03',
    title: 'Challenge the reasoning',
    description:
      'Find hidden assumptions, rival explanations, causal leaps and the evidence that would change the result.',
  },
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <main id="main-content">
        <section className={styles.hero}>
          <div className={`${styles.heroInner} bb-frame`}>
            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>
                <span className={styles.dot} aria-hidden="true" />A WORKSPACE FOR UNDERSTANDING THE
                WORLD
              </p>
              <h1>
                Understand the world.
                <span className={styles.line}>One question</span>
                <em>at a time.</em>
              </h1>
              <p className={styles.lead}>
                {BRAND.name} brings questions, evidence, and competing explanations into focus.
                Explore science, history, economics, and public arguments. Follow the sources. Find
                the assumptions. Keep asking what would change your mind.
              </p>
              <div className={`${styles.actions} bb-actions`}>
                <Link href="/explore" className={`${styles.primary} bb-button bb-button--primary`}>
                  Explore a question <span aria-hidden="true">↗</span>
                </Link>
                <Link
                  href="/analyze"
                  className={`${styles.secondary} bb-button bb-button--secondary`}
                >
                  Examine an article <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p className={styles.notice}>
                Beta research tool · AI-generated interpretations are not independent fact-checks
              </p>
            </div>

            <div className={styles.diagram} aria-label="Illustration of the investigation process">
              <div className={styles.diagramTop}>
                <span>ANATOMY OF A CLAIM</span>
                <span>ILLUSTRATIVE / NOT A FINDING</span>
              </div>
              <div className={styles.diagramBody}>
                <div className={styles.diagramQuestion}>
                  <span className={styles.diagramLabel}>QUESTION</span>
                  <strong>Does policy A really cause outcome B?</strong>
                </div>
                <div className={styles.diagramConnector}>
                  <span className={styles.diagramDot} aria-hidden="true" />
                  <span>requires evidence</span>
                </div>
                <div className={styles.diagramRow}>
                  <div>
                    <span className={styles.diagramLabel}>HYPOTHESIS</span>
                    <p>A may affect B</p>
                  </div>
                  <span className={styles.diagramPill}>Provisional</span>
                </div>
                <div className={styles.diagramRow}>
                  <div>
                    <span className={styles.diagramLabel}>CAUSAL LINK</span>
                    <p>Other explanations?</p>
                  </div>
                  <span className={styles.diagramPill}>Unresolved</span>
                </div>
                <div className={styles.diagramRow}>
                  <div>
                    <span className={styles.diagramLabel}>INDEPENDENT SOURCE</span>
                    <p>What would test it?</p>
                  </div>
                  <span className={styles.diagramMissing}>Not yet supplied</span>
                </div>
              </div>
              <div className={styles.diagramFooter}>
                <span>↑</span>A question is the beginning of an investigation, not a verdict.
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.directory} bb-frame`} aria-labelledby="workspace-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionNumber}>ONE OPEN INVESTIGATION WORKSPACE</p>
              <h2 id="workspace-heading">Choose a way in.</h2>
            </div>
            <p>Start with a question or a text. Read the method. Inspect the work behind it.</p>
          </div>
          <div className={styles.directoryRows}>
            {[
              [
                '/explore',
                '01',
                'Explore a question',
                'Keep exact source references, reasoning, and open challenges in a browser-local notebook.',
              ],
              [
                '/analyze',
                '02',
                'Examine an argument',
                'Inspect a supplied article with provisional AI analysis. Requires a configured model provider.',
              ],
              [
                '/debates',
                '03',
                'Measure a debate',
                'Calculate airtime and overlap from user-supplied timed transcripts. No automatic transcription.',
              ],
              [
                '/whitepaper',
                '04',
                'Read the technical paper',
                'Inspect the evidence model, evaluation requirements, implementation boundaries, and failure cases.',
              ],
              [
                '/development',
                '05',
                'Follow the work',
                'Open the canonical project records, reviewed code changes, journal, and challenge channel.',
              ],
            ].map(([href, number, title, description]) => (
              <Link href={href} key={href} className={styles.directoryRow}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.process} bb-frame`} aria-labelledby="process-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionNumber}>THE APPROACH / 01—03</p>
              <h2 id="process-heading">A more careful way to know.</h2>
            </div>
            <p>
              No truth meter. No algorithm asking you to trust it. A transparent account of claims,
              evidence, and uncertainty.
            </p>
          </div>
          <ol className={styles.stepList}>
            {STEPS.map((step) => (
              <li key={step.number}>
                <span className={styles.stepNumber}>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.openSection} aria-labelledby="open-heading">
          <div>
            <p className={styles.sectionNumber}>THE RULES CAN BE WRONG TOO</p>
            <h2 id="open-heading">
              Question <em>the method.</em>
            </h2>
            <p>
              The process is public, versioned and open to criticism. Present counterevidence,
              challenge assumptions or propose a better test. No single model—or institution—gets
              the final word by decree.
            </p>
            <Link href="/methodology" className={styles.textLink}>
              Read and challenge the methodology <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.principles}>
            <div>
              <span>01</span>
              <strong>Traceable origins</strong>
              <p>Know where a proposition or interpretation came from.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Visible uncertainty</strong>
              <p>Missing evidence must remain missing, not be filled with guesses.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Revisable conclusions</strong>
              <p>A strong challenge can change the recorded assessment.</p>
            </div>
          </div>
        </section>

        <section className={`${styles.lab} bb-frame`} aria-labelledby="lab-heading">
          <div className={styles.labHeader}>
            <div>
              <p className={styles.sectionNumber}>IN THE LAB / EDUCATIONAL DEMO</p>
              <h2 id="lab-heading">Why counting evidence is not enough.</h2>
            </div>
            <p>
              Ten copied headlines are not ten independent sources. Explore the failure of a
              count-only system before treating a score as fact.
            </p>
          </div>
          <details className={styles.labDetails}>
            <summary>
              Open the evidence-counting demonstration <span aria-hidden="true">↓</span>
            </summary>
            <div className={styles.labContent}>
              <EvidenceVerifier />
            </div>
          </details>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
