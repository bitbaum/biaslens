import { SiteFooter, SiteHeader } from '@/app/_components/Chrome';

import {
  METHOD_VERSION,
  auditEpistemicGraph,
  type EpistemicGraph,
} from '@/lib/domain/epistemic-graph';

import styles from './methodology.module.css';

export const metadata = {
  title: 'Open Epistemic Method · BiasLens',
  description:
    'An open, challengeable protocol for investigating claims, evidence, causal links and history.',
};

const example: EpistemicGraph = {
  methodVersion: METHOD_VERSION,
  question: 'Does a flat tax cause faster economic growth?',
  claims: [
    {
      id: 'tax',
      text: 'Flat taxes improve the business environment',
      kind: 'causal',
      scope: 'Jurisdiction and years to be specified',
    },
    {
      id: 'investment',
      text: 'A better business environment increases productive investment',
      kind: 'causal',
    },
    {
      id: 'growth',
      text: 'Higher investment increases long-run real growth',
      kind: 'causal',
    },
  ],
  evidence: [],
  relations: [
    {
      id: 'link-1',
      fromClaimId: 'tax',
      toClaimId: 'investment',
      kind: 'proposed_cause',
      review: 'candidate',
      evidenceIds: [],
      rationale: 'Hypothesis connecting policy to incentives and investment',
    },
    {
      id: 'link-2',
      fromClaimId: 'investment',
      toClaimId: 'growth',
      kind: 'proposed_cause',
      review: 'candidate',
      evidenceIds: [],
      rationale: 'Hypothesis connecting investment and growth',
    },
  ],
  challenges: [],
};

const audit = auditEpistemicGraph(example);

const steps = [
  ['01', 'Capture', 'Preserve what was actually said, by whom, when and where.'],
  ['02', 'Decompose', 'Separate historical, empirical, causal, predictive and value claims.'],
  ['03', 'Test', 'Specify what would disconfirm each proposition or mechanism.'],
  ['04', 'Attribute', 'Trace every source, excerpt, method and relationship.'],
  ['05', 'Compare', 'Examine independent evidence, rival accounts and missing context.'],
  ['06', 'Challenge', 'Invite counterexamples, criticism, corrections and transparent responses.'],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader current="methodology" />
      <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Public method / Version {METHOD_VERSION} / Provisional</p>
        <h1>Truth is not a vote. It is an investigation.</h1>
        <p className={styles.lead}>
          Every claim should be open to inspection. Every piece of evidence should have an origin.
          Every connection should say why it exists. Every conclusion should be challengeable.
        </p>
        <div className={styles.actions}>
          <a
            className={styles.actionPrimary}
            href="https://github.com/bitbaum/biaslens/issues/new?template=methodology-challenge.yml"
          >
            Challenge the method ↗
          </a>
          <a
            className={styles.actionSecondary}
            href="https://github.com/bitbaum/biaslens/blob/main/docs/methodology/open-epistemic-method-v0.1.md"
          >
            Read the complete protocol ↗
          </a>
        </div>
        <p className={styles.caveat}>
          This is an evolving research method, not an automated arbiter of truth. Some linked
          features are proposed and are not yet operational.
        </p>
      </header>

      <section aria-labelledby="method-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>How the method works</p>
          <h2 id="method-heading">Evidence before conclusions.</h2>
          <p>
            A news article, an ancient manuscript and a causal economic theory require different
            kinds of investigation, but share the same standards of provenance and criticism.
          </p>
        </div>
        <ol className={styles.stepGrid}>
          {steps.map(([number, title, description]) => (
            <li className={styles.step} key={number}>
              <span className={styles.stepNumber}>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="graph-heading" className={styles.graphSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>An example, not a finding</p>
          <h2 id="graph-heading">Connect the dots. Audit the connections.</h2>
          <p>
            Here is a possible economic argument. We have deliberately attached no evidence. The
            method shows uncertainty instead of manufacturing an answer.
          </p>
        </div>
        <div className={styles.graphFlow}>
          {example.claims.map((claim, index) => (
            <div className={styles.graphSegment} key={claim.id}>
              <div className={styles.graphCard}>
                <span className={styles.graphLabel}>Hypothesis {index + 1}</span>
                <strong>{claim.text}</strong>
                <p>{audit.claims[index]?.gaps.join(' · ')}</p>
              </div>
              {index < example.claims.length - 1 && (
                <div className={styles.graphArrow} aria-label="Causal relation not demonstrated">
                  ↓ <span>Unverified connection</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className={styles.warning}>
          Two plausible arrows do not establish a causal effect. Missing definitions, confounders
          and unexamined source relationships are research questions, not hidden assumptions.
        </p>
      </section>

      <section aria-labelledby="participate-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Open by design</p>
          <h2 id="participate-heading">The methodology can be wrong too.</h2>
          <p>
            Challenge our rules. Propose counterexamples. Cite original records. We should retain
            dissent and explanations for decisions, including when a conclusion is revised.
          </p>
        </div>
        <div className={styles.principles}>
          <div>
            <h3>Histories are revisable</h3>
            <p>
              Manuscripts, artefacts, later accounts and political incentives must be distinguished.
            </p>
          </div>
          <div>
            <h3>Bias is not falsehood</h3>
            <p>An accurate claim can be selectively presented. Both axes deserve inspection.</p>
          </div>
          <div>
            <h3>People can challenge AI</h3>
            <p>Model responses will be labelled, sourced and subject to human correction.</p>
          </div>
        </div>
        <a className={styles.bottomLink} href="https://github.com/bitbaum/biaslens/issues">
          Browse public discussions and challenges ↗
        </a>
      </section>
      </main>
      <SiteFooter />
    </>
  );
}
