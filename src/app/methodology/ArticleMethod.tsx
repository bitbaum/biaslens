import { ONE_SIDED } from '@/lib/analysis/metrics';
import { REPORT_PROMPT_VERSION } from '@/lib/analysis/prompts';
import { SYSTEM_FORBIDDEN_LABELS } from '@/lib/config/vocabulary';
import { TECHNIQUES } from '@/lib/domain/techniques';

import styles from './methodology.module.css';

/**
 * The article report's rules, rendered from the same config the pipeline
 * runs on, so the published method cannot drift from the code.
 */
export function ArticleMethod() {
  return (
    <>
      <section aria-labelledby="article-method-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Article reports · {REPORT_PROMPT_VERSION}</p>
          <h2 id="article-method-heading">How an article is read.</h2>
          <p>
            A report is made in two model passes and one check in code. Nothing in it is a verdict
            on whether the article is true.
          </p>
        </div>
        <ol className={styles.ruleList}>
          <li>
            <h3>1. Inventory</h3>
            <p>
              A first pass lists who is quoted or cited (never the author), how the text describes
              them, what the text claims and who claims it, and every figure that carries the
              argument. An explanation offered by a quoted expert belongs to the expert.
            </p>
          </li>
          <li>
            <h3>2. Assessment</h3>
            <p>
              A second pass receives the checked inventory and marks passages that match a technique
              in the catalogue below, names the step the argument rests on, and states the strongest
              case for it and the strongest objection to it.
            </p>
          </li>
          <li>
            <h3>3. Grounding</h3>
            <p>
              Every passage the model cites is searched for in the text. Differences in quotation
              marks, dashes, spaces and line breaks are ignored; a changed word is not. A passage
              that is not found is discarded, and the report says how many were.
            </p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="measures-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Computed in code, not by the model</p>
          <h2 id="measures-heading">The measurements.</h2>
        </div>
        <dl className={styles.definitions}>
          <dt>Voices and positions</dt>
          <dd>
            Each voice is counted once with its position on the article’s central claim: supports,
            opposes, mixed, neutral or unclear.
          </dd>
          <dt>Nearly every voice on one side</dt>
          <dd>
            Shown when at least {ONE_SIDED.minKnown} voices take a position and at least{' '}
            {Math.round(ONE_SIDED.share * 100)}% of them take the same one.
          </dd>
          <dt>Quoted share</dt>
          <dd>The share of characters inside quotation marks.</dd>
          <dt>Figures without a source</dt>
          <dd>Figures for which the text names no person, document, data set or link.</dd>
          <dt>Poll results without a sample size</dt>
          <dd>Poll figures reported with neither a number of respondents nor a margin of error.</dd>
        </dl>
      </section>

      <section aria-labelledby="vocabulary-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Words we do not use</p>
          <h2 id="vocabulary-heading">No political labels.</h2>
          <p>
            BiasLens never places an article, an outlet or a person on a political axis, and never
            hands down a bias verdict. It describes what a text does and lets readers draw their own
            conclusions. These words are refused in BiasLens’s own voice; they can appear only
            inside a quotation from the text:
          </p>
        </div>
        <p className={styles.vocabulary}>
          {Object.values(SYSTEM_FORBIDDEN_LABELS).flat().join(' · ')}
        </p>
      </section>

      <section aria-labelledby="techniques-heading" className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>The catalogue · {TECHNIQUES.length} techniques</p>
          <h2 id="techniques-heading">What a passage can be marked for.</h2>
          <p>
            A technique is an observable feature of a text, not a judgement of its author. Opinion
            pieces are expected to argue, which is why every report states the text’s genre.
          </p>
        </div>
        <ul className={styles.techniques}>
          {TECHNIQUES.map((item) => (
            <li key={item.id} id={'t-' + item.id} className={styles.technique}>
              <h3>{item.name.en}</h3>
              <p>{item.short.en}</p>
              <dl>
                <dt>Counts when</dt>
                <dd>{item.countsWhen}</dd>
                <dt>Does not count when</dt>
                <dd>{item.doesNotCountWhen}</dd>
                <dt>Why it matters</dt>
                <dd>{item.whyItMatters}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
