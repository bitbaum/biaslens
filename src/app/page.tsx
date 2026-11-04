import Link from 'next/link';
import { HeroSection } from '@bitbaum/sitekit/react';

import { zurichTime } from '@/lib/format-time';
import {
  claimsUnderScrutiny,
  evidenceOfTheDay,
  loadFeatured,
  recentChanges,
} from '@/lib/investigations/featured';
import { loadWire } from '@/lib/wire/load';

import { SinceLastVisit } from './_components/SinceLastVisit';
import { EvidenceVerifier } from './EvidenceVerifier';
import { QuestionLab } from './QuestionLab';
import styles from './today.module.css';

export const dynamic = 'force-dynamic';

const TOOLS = [
  {
    href: '/analyze',
    icon: '⌕',
    title: 'Examine an article',
    text: 'Claims, quotes and assumptions, passage by passage.',
  },
  {
    href: '/investigations/demo',
    icon: '⇄',
    title: 'Investigate a question',
    text: 'Link claims to studies from all sides.',
  },
  {
    href: '/workspace',
    icon: '✎',
    title: 'Rewrite studio',
    text: 'Neutral and labelled simulated voices, with a fact diff.',
  },
  {
    href: '/debates',
    icon: '◷',
    title: 'Analyse a conversation',
    text: 'Speaking time and overlaps from a transcript.',
  },
];

export default async function Today() {
  const featured = await loadFeatured();
  const wire = await loadWire();
  const lead = featured[0]!;
  const inv = lead.investigation;
  const latest = inv.drafts?.at(-1);
  const counts = ['supports', 'contradicts', 'context'].map(
    (s) => inv.links.filter((l) => l.stance === s).length,
  );
  const total = Math.max(
    1,
    counts.reduce((a, b) => a + b, 0),
  );
  const claims = claimsUnderScrutiny(featured);
  const evidence = evidenceOfTheDay(featured);
  const changes = recentChanges(featured);
  const today = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const image = inv.images?.[0];

  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <header className={styles.masthead}>
        <p className={styles.date}>{today}</p>
        <HeroSection
          appearance="application"
          section={{
            kind: 'hero',
            statement: 'Today on BiasLens',
            lead: ['The latest headlines first. Below them, stories taken apart claim by claim.'],
          }}
        />
      </header>

      <section className={styles.wireSection} aria-labelledby="wire-heading">
        <div className={styles.sectionHead}>
          <h2 id="wire-heading">The latest</h2>
          <p className={styles.meta}>
            Headlines from public wires, newest first. Examine opens the article here. The original
            stays at the publisher.
          </p>
        </div>
        {wire.items.length === 0 ? (
          <p className={styles.meta}>
            The wires could not be read just now. The investigations below are unchanged.
          </p>
        ) : (
          <ol className={styles.wire}>
            {wire.items.map((item) => (
              <li key={item.link}>
                <div>
                  <a href={item.link} rel="noreferrer">
                    {item.title}
                  </a>
                  <p className={styles.meta}>
                    {item.source}
                    {item.published ? ` · ${zurichTime(item.published)}` : ''}
                    {' · '}
                    <Link href={`/analyze?u=${encodeURIComponent(item.link)}`}>Examine</Link>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className={styles.grid}>
        <article className={styles.lead}>
          {image && (
            <figure className={styles.leadFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element -- remote, credited source image */}
              <img src={image.src} alt={image.alt} />
              {image.kind === 'ai' && <span className={styles.aiBadge}>AI-generated image</span>}
              <figcaption className={styles.meta}>
                {image.kind === 'ai' ? 'AI image' : 'Photo'}: {image.credit} · {image.license}
              </figcaption>
            </figure>
          )}
          <p className={styles.kicker}>Lead investigation</p>
          <h2>
            <Link href={lead.href}>{inv.question}</Link>
          </h2>
          <p className={styles.meta}>
            From {inv.article.publication ?? 'an article'}: “{inv.article.title}”
          </p>
          <div className={styles.stanceBar} aria-label="Linked findings by stance">
            {counts.map((n, i) => (
              <span
                key={i}
                className={styles['stance' + i]}
                style={{ flexGrow: n }}
                title={`${n} ${['supporting', 'contradicting', 'context'][i]}`}
              />
            ))}
          </div>
          <p className={styles.stanceKey}>
            <span className={styles.k0}>{counts[0]} support</span> ·{' '}
            <span className={styles.k1}>{counts[1]} contradict</span> ·{' '}
            <span className={styles.k2}>{counts[2]} context</span> · {inv.studies.length} sources ·{' '}
            {Math.round((counts[1] / total) * 100)}% of findings cut against a claim
          </p>
          {latest && (
            <p className={styles.meta}>
              Latest version v{latest.version}, {zurichTime(latest.createdAt)}
            </p>
          )}
          <div className={styles.actions}>
            <Link
              className="bb-button bb-button--primary"
              href={lead.href + (latest ? '#versions' : '')}
            >
              {latest ? 'Read the rewritten article' : 'Open the investigation'}
            </Link>
            <Link className="bb-button bb-button--secondary" href={lead.href + '#gaps-heading'}>
              See what it doesn’t explain yet
            </Link>
          </div>
        </article>

        <aside className={styles.side}>
          <SinceLastVisit changes={changes} />
          {evidence && (
            <section
              className={`${styles.panel} ${styles.evidence}`}
              aria-labelledby="eotd-heading"
            >
              <p className={styles.kicker}>Evidence of the day</p>
              <h2 id="eotd-heading" className={styles.quote}>
                “{evidence.statement}”
              </h2>
              <p className={styles.meta}>
                <a href={evidence.studyUrl}>{evidence.study}</a> · {evidence.locator}
              </p>
              <p className={styles.meta}>
                <span className={styles['pill_' + evidence.stance]}>{evidence.stance}</span> on:{' '}
                {evidence.claim}
              </p>
              <Link href={evidence.href}>See all the evidence cards →</Link>
            </section>
          )}
        </aside>
      </div>

      <section className={styles.section} aria-labelledby="claims-heading">
        <div className={styles.sectionHead}>
          <h2 id="claims-heading">Claims under the most scrutiny</h2>
          <p className={styles.meta}>
            Ranked by linked findings, contested first. Not a popularity count.
          </p>
        </div>
        <ol className={styles.claims}>
          {claims.map((c, i) => (
            <li key={c.text}>
              <span className={styles.rank}>{i + 1}</span>
              <div>
                <Link href={c.href}>{c.text}</Link>
                <p className={styles.meta}>
                  {c.contested && <strong className={styles.contested}>Contested · </strong>}
                  {c.supports} support · {c.contradicts} contradict · {c.context} context
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="tools-heading">
        <div className={styles.sectionHead}>
          <h2 id="tools-heading">Start your own</h2>
          <p className={styles.meta}>
            No account needed. AI interpretations are labelled and provisional.
          </p>
        </div>
        <div className={styles.tools}>
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className={styles.tool}>
              <span className={styles.toolIcon} aria-hidden="true">
                {t.icon}
              </span>
              <strong>{t.title}</strong>
              <span className={styles.meta}>{t.text}</span>
            </Link>
          ))}
        </div>
        <QuestionLab />
        <details className={styles.labDetails}>
          <summary>
            Ten headlines, one source? Try the evidence-counting demonstration{' '}
            <span aria-hidden="true">+</span>
          </summary>
          <EvidenceVerifier />
        </details>
      </section>
    </main>
  );
}
