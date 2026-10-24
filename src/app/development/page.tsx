import Link from 'next/link';

import { PROJECT_LINKS, ROUTES } from '@/lib/config/routes';

import styles from '../blog/blog.module.css';

export const metadata = {
  title: 'Build in public',
  description: 'Inspect the code, follow canonical development records and challenge the method.',
};

const records = [
  {
    title: 'Roadmap',
    detail: 'Read planned work from the canonical project profile.',
    href: ROUTES.roadmap,
  },
  {
    title: 'Changelog',
    detail: 'Inspect the recorded development history.',
    href: ROUTES.changelog,
  },
  {
    title: 'Project context & development record',
    detail:
      'Problem, solution, mission, vision, roadmap and changelog live in the canonical Loki project profile. This site links to that producer rather than keeping another copy.',
    href: PROJECT_LINKS.profile,
  },
  {
    title: 'Code & reviewed changes',
    detail:
      'Inspect implementation, tests, open pull requests and merged changes in the one product repository. A merged change is not proof of deployment.',
    href: PROJECT_LINKS.changes,
  },
  {
    title: 'Technical white paper',
    detail:
      'Read the investigation model, provenance requirements, evaluation protocol and explicit implementation boundaries.',
    href: ROUTES.whitepaper,
  },
  {
    title: 'Research journal',
    detail:
      'Read source-controlled essays about the method and its limitations, rendered with the existing bip-kit publishing package.',
    href: ROUTES.blog,
  },
  {
    title: 'Challenges & corrections',
    detail:
      'Identify the exact proposition or method, supply counterevidence and describe the correction you are requesting. GitHub sign-in is required to submit an issue.',
    href: PROJECT_LINKS.challenge,
  },
];

export default function DevelopmentPage() {
  return (
    <>
      <main id="main-content" className={`${styles.page} bb-frame`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Open work / Inspectable decisions</p>
          <h1>Building BiasLens.</h1>
          <p className={styles.lead}>
            The code, the method, the changes, and the unresolved questions belong in the open.
            Follow the original records and help improve them.
          </p>
        </header>
        <ol className={styles.list}>
          {records.map((record, index) => (
            <li key={record.title}>
              <Link href={record.href}>
                <span className={styles.meta}>0{index + 1} / OPEN RECORD</span>
                <h2>{record.title} →</h2>
                <p>{record.detail}</p>
              </Link>
            </li>
          ))}
        </ol>
        <p className={styles.lead}>
          Shared infrastructure stays shared: ai-kit for model access, design-tokens for
          composition, bip-kit for publishing, and Loki/Fleet for project records and hosting. No
          second product, roadmap, or deployment stack.
        </p>
      </main>
    </>
  );
}
