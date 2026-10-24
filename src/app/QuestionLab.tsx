'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './home.module.css';
const examples = [
  {
    topic: 'Science',
    question: 'Does this study show what the headline claims?',
    claim: 'A link between two things',
    alternative: 'A common cause could explain both',
    test: 'Study design, effect size and replication',
  },
  {
    topic: 'Finance',
    question: 'Is a record profit the same as a stronger business?',
    claim: 'Profit rose this quarter',
    alternative: 'A one-off sale could explain the rise',
    test: 'Cash flow, recurring earnings and debt',
  },
  {
    topic: 'Health',
    question: 'Does a lower relative risk mean a big benefit?',
    claim: 'A reported reduction in risk',
    alternative: 'The baseline risk may be very small',
    test: 'Absolute risk, harms and trial population',
  },
  {
    topic: 'Policy',
    question: 'Did the policy cause the change?',
    claim: 'A change followed a new policy',
    alternative: 'Other conditions changed at the same time',
    test: 'A credible comparison and alternative causes',
  },
];
export function QuestionLab() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <div className={styles.diagram} aria-label="Try an illustrative investigation">
      <div className={styles.diagramTop}>
        <span>CHANGE THE QUESTION</span>
        <span>ILLUSTRATIVE / NOT A FINDING</span>
      </div>
      <div className={styles.labTopics} role="group" aria-label="Example subject">
        {examples.map((item, index) => (
          <button
            key={item.topic}
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {item.topic}
          </button>
        ))}
      </div>
      <div className={styles.diagramBody} aria-live="polite">
        <div className={styles.diagramQuestion}>
          <span className={styles.diagramLabel}>QUESTION</span>
          <strong>{example.question}</strong>
        </div>
        <div className={styles.diagramConnector}>
          <span className={styles.diagramDot} aria-hidden="true" />
          <span>look beneath the first explanation</span>
        </div>
        <div className={styles.diagramRow}>
          <div>
            <span className={styles.diagramLabel}>THE FIRST IMPRESSION</span>
            <p>{example.claim}</p>
          </div>
        </div>
        <div className={styles.diagramRow}>
          <div>
            <span className={styles.diagramLabel}>AN ALTERNATIVE TO TEST</span>
            <p>{example.alternative}</p>
          </div>
        </div>
        <div className={styles.diagramRow}>
          <div>
            <span className={styles.diagramLabel}>WHAT WOULD HELP US KNOW?</span>
            <p>{example.test}</p>
          </div>
        </div>
      </div>
      <div className={styles.diagramFooter}>
        <Link href="/workspace">Bring your own question →</Link>
      </div>
    </div>
  );
}
