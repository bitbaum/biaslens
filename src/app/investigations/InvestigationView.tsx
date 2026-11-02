import {
  DESIGN_PROFILE,
  compareClaims,
  studyHref,
  type ComparedEvidence,
  type Investigation,
} from '@/lib/domain/investigation';

import styles from './investigation.module.css';

const TIER_LABEL = {
  causal_design: 'Causal design',
  quasi_causal: 'Quasi-experimental',
  associational: 'Associational',
  descriptive: 'Descriptive',
  synthesis: 'Review / theory',
} as const;

function EvidenceList({ rows }: { rows: ComparedEvidence[] }) {
  if (!rows.length) return <p className={styles.meta}>None linked.</p>;
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.linkId} className={styles.evidence}>
          <span className={styles.tier}>{TIER_LABEL[row.tier]}</span>
          <span className={styles.tier}>{row.finding.horizon.replace('_', '-')}</span>
          {row.review !== 'reviewed' && <span className={styles.tier}>unreviewed lead</span>}
          <br />
          <a href={studyHref(row.study)} rel="noopener noreferrer" target="_blank">
            {row.study.authors}
            {row.study.year ? ` (${row.study.year})` : ''}
          </a>
          : {row.finding.statement}{' '}
          <span className={styles.meta}>
            [{row.finding.locator}; {row.finding.population}]
          </span>
          <br />
          <span className={styles.meta}>Why linked: {row.rationale}</span>
          <br />
          <span className={styles.meta}>Strength: {row.strengthNote || 'not stated'}</span>
        </li>
      ))}
    </ul>
  );
}

/** One investigation: claims compared across sources, studies, omissions. No score anywhere. */
export function InvestigationView({ investigation }: { investigation: Investigation }) {
  const comparison = compareClaims(investigation);
  const { article } = investigation;
  return (
    <>
      <section className={styles.section}>
        <p className={styles.eyebrow}>Article</p>
        <h2>
          {article.url ? (
            <a href={article.url} rel="noopener noreferrer" target="_blank">
              {article.title}
            </a>
          ) : (
            article.title
          )}
        </h2>
        <p className={styles.meta}>
          {[article.publication, article.publishedAt, 'input: ' + article.inputKind]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={styles.callout}>
          Unverified analysis. Each link below is a lead until a reader checks the locator. Sources
          are compared side by side; BiasLens gives no single bias or truth score.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="claims-heading">
        <h2 id="claims-heading">Claims and the evidence on them</h2>
        {comparison.map((row) => (
          <article key={row.claim.id} className={styles.claim} id={'claim-' + row.claim.id}>
            <p className={styles.eyebrow}>
              {row.claim.kind} claim ·{' '}
              {row.claim.quote ? 'in the article' : 'investigation hypothesis'}
            </p>
            <h3>{row.claim.text}</h3>
            {row.claim.quote && <p className={styles.quote}>“{row.claim.quote}”</p>}
            <p className={styles.meta}>Scope: {row.claim.scope || 'not specified'}</p>
            <p>
              <strong>Would be disconfirmed by:</strong>{' '}
              {row.claim.disconfirmation || 'not yet stated'}
            </p>
            <div className={styles.columns}>
              <div>
                <h4>Supports</h4>
                <EvidenceList rows={row.supports} />
              </div>
              <div>
                <h4>Contradicts</h4>
                <EvidenceList rows={row.contradicts} />
              </div>
              <div>
                <h4>Context</h4>
                <EvidenceList rows={row.context} />
              </div>
            </div>
            {row.tensions.length > 0 && (
              <>
                <h4>Why the sources may not actually disagree</h4>
                <ul className={styles.list}>
                  {row.tensions.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}
            {row.scaffold.length > 0 && (
              <>
                <h4>First-principles questions</h4>
                <ul className={styles.list}>
                  {row.scaffold.map((s) => (
                    <li key={s.lens}>
                      <strong>{s.title}.</strong> {s.question}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {row.gaps.length > 0 && (
              <p className={styles.meta}>Still needed: {row.gaps.join(' · ')}</p>
            )}
          </article>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="omitted-heading">
        <h2 id="omitted-heading">What the article leaves out</h2>
        <ul className={styles.list}>
          {investigation.omissions.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="studies-heading">
        <h2 id="studies-heading">Studies</h2>
        <ul className={styles.list}>
          {investigation.studies.map((study) => (
            <li key={study.id}>
              <a href={studyHref(study)} rel="noopener noreferrer" target="_blank">
                {study.authors}
                {study.year ? ` (${study.year})` : ''}, {study.title}
              </a>
              . {study.venue}. <em>{DESIGN_PROFILE[study.design].label}</em>: can support{' '}
              {DESIGN_PROFILE[study.design].canSupport.toLowerCase()} Main threat:{' '}
              {DESIGN_PROFILE[study.design].threats.toLowerCase()}
            </li>
          ))}
        </ul>
      </section>
      {investigation.notes && (
        <section className={styles.section}>
          <h2>Notes</h2>
          <p>{investigation.notes}</p>
        </section>
      )}
    </>
  );
}
