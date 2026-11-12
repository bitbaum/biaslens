import type { Metadata } from 'next';
import Link from 'next/link';

import { PROJECT_LINKS } from '@/lib/config/routes';

import styles from '../_components/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms for using BiasLens: what it is, what it is not, and what you publish.',
};

const CONTACT = 'cato@orangecat.ch';

export default function TermsPage() {
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>BiasLens</p>
      <h1>Terms</h1>
      <p className={styles.meta}>Last changed 12 November 2026</p>
      <p>
        BiasLens is beta research software made by bitbaum and run by Cato. Using it, or signing in,
        means accepting these terms.
      </p>

      <h2>What BiasLens is, and is not</h2>
      <ul>
        <li>
          An examination of an article is unverified AI analysis. It shows who speaks, what is
          claimed and which passages an argument rests on; it is not a fact-check and not a verdict
          on an outlet or a person. Read the source before relying on it.
        </li>
        <li>
          It is a beta. Features change, and saved work may have to move when they do. Keep a copy
          of anything you cannot afford to lose.
        </li>
        <li>
          It is provided as it is, without warranty. The source code is open under the MIT licence:{' '}
          <a href={PROJECT_LINKS.repository}>bitbaum/biaslens</a>.
        </li>
      </ul>

      <h2>What you publish</h2>
      <ul>
        <li>
          You are responsible for the articles and comments you publish. They are public under the
          name you chose, and anyone with the link can read and share them.
        </li>
        <li>
          Do not publish anything unlawful, anyone&apos;s private data, or text you have no right to
          share. Material like that is removed, and an account used for it can be closed.
        </li>
        <li>
          You keep the rights to what you write. You allow BiasLens to show it, to examine it when
          you or a reader asks, and to show responses to it.
        </li>
      </ul>

      <h2>Your data</h2>
      <p>
        What BiasLens keeps and how to have it removed is on the{' '}
        <Link href="/privacy">privacy page</Link>.
      </p>

      <h2>Questions and reports</h2>
      <p>
        To report something published here, or to ask about these terms, write to{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <div className={styles.actions}>
        <a className="bb-button bb-button--secondary" href={`mailto:${CONTACT}`}>
          Report or ask
        </a>
        <Link className="bb-button bb-button--secondary" href="/privacy">
          Privacy
        </Link>
      </div>
    </main>
  );
}
