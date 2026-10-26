'use client';

import type { Report, Stance } from '@/lib/analysis/report';
import type { OutputLanguage } from '@/lib/config/languages';
import { reportCopy, type ReportCopy } from '@/lib/config/report-copy';
import { techniqueName } from '@/lib/domain/techniques';

import { FigureFlags } from './PassagePanel';
import { speakerName } from './speaker';
import styles from './report.module.css';

type Show = ((annotationId: string) => void) | undefined;

function ShowButton({ id, onShow, copy }: { id: string; onShow: Show; copy: ReportCopy }) {
  // Without the examined text (a saved or shared report) there is nothing to show.
  if (!onShow) return null;
  return (
    <button type="button" className={styles.showButton} onClick={() => onShow(id)}>
      {copy.showInText}
    </button>
  );
}

const BAR_ORDER: Stance[] = ['supports', 'mixed', 'neutral', 'unclear', 'opposes'];

export function VoicesSection({
  report,
  language,
  onShow,
}: {
  report: Report;
  language: OutputLanguage;
  onShow: Show;
}) {
  const copy = reportCopy(language);
  const total = report.voices.length;
  return (
    <section id="report-voices" className={styles.section}>
      <h3>{copy.sections.voices}</h3>
      {total === 0 ? (
        <p className={styles.muted}>{copy.empty.voices}</p>
      ) : (
        <>
          <div className={styles.stanceBar} aria-hidden="true">
            {BAR_ORDER.filter((stance) => report.metrics.stanceCounts[stance] > 0).map((stance) => (
              <span
                key={stance}
                className={styles['stance_' + stance]}
                style={{ flexGrow: report.metrics.stanceCounts[stance] }}
              >
                {report.metrics.stanceCounts[stance]}
              </span>
            ))}
          </div>
          <p className={styles.stanceLegend}>
            {BAR_ORDER.filter((stance) => report.metrics.stanceCounts[stance] > 0)
              .map((stance) => `${copy.stance[stance]}: ${report.metrics.stanceCounts[stance]}`)
              .join(' · ')}
          </p>
          <ul className={styles.rows}>
            {report.voices.map((voice) => {
              const words = voice.quotes.reduce(
                (sum, quote) => sum + quote.text.split(/\s+/).length,
                0,
              );
              return (
                <li key={voice.id} className={styles.row}>
                  <div>
                    <p className={styles.rowTitle}>
                      {voice.name}
                      {voice.kind === 'anonymous' && (
                        <span className={styles.muted}> · {copy.anonymous}</span>
                      )}
                    </p>
                    {voice.affiliation && <p className={styles.muted}>{voice.affiliation}</p>}
                    <p className={styles.meta}>
                      {copy.stance[voice.stance]}
                      {words > 0 && ' · ' + copy.quotedWords(words)}
                    </p>
                  </div>
                  {voice.quotes.length > 0 && (
                    <ShowButton id={`a-${voice.id}-0`} onShow={onShow} copy={copy} />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export function DetectionsSection({
  report,
  language,
  onShow,
}: {
  report: Report;
  language: OutputLanguage;
  onShow: Show;
}) {
  const copy = reportCopy(language);
  return (
    <section id="report-techniques" className={styles.section}>
      <h3>{copy.sections.techniques}</h3>
      {report.detections.length === 0 ? (
        <p className={styles.muted}>{copy.empty.detections}</p>
      ) : (
        <ol className={styles.rows}>
          {report.detections.map((detection) => (
            <li key={detection.id} id={'d-' + detection.id} className={styles.rowStack}>
              <p className={styles.kicker}>{techniqueName(detection.technique, language)}</p>
              <blockquote className={styles.quote}>{detection.quote.text}</blockquote>
              <p>{detection.explanation}</p>
              {detection.alternative && (
                <p className={styles.muted}>
                  {copy.neutralWording}: {detection.alternative}
                </p>
              )}
              <ShowButton id={'a-' + detection.id} onShow={onShow} copy={copy} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function FiguresSection({
  report,
  language,
  onShow,
}: {
  report: Report;
  language: OutputLanguage;
  onShow: Show;
}) {
  const copy = reportCopy(language);
  return (
    <section id="report-figures" className={styles.section}>
      <h3>{copy.sections.figures}</h3>
      {report.figures.length === 0 ? (
        <p className={styles.muted}>{copy.empty.figures}</p>
      ) : (
        <ul className={styles.rows}>
          {report.figures.map((figure) => (
            <li key={figure.id} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{figure.value}</p>
                {figure.about && <p className={styles.muted}>{figure.about}</p>}
                <FigureFlags figure={figure} copy={copy} />
              </div>
              {figure.quote && <ShowButton id={'a-' + figure.id} onShow={onShow} copy={copy} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ClaimsSection({
  report,
  language,
  onShow,
}: {
  report: Report;
  language: OutputLanguage;
  onShow: Show;
}) {
  const copy = reportCopy(language);
  return (
    <section id="report-claims" className={styles.section}>
      <h3>{copy.sections.claims}</h3>
      <ol className={styles.rows}>
        {report.claims.map((claim) => (
          <li key={claim.id} className={styles.rowStack}>
            <p className={styles.kicker}>
              {copy.claimType[claim.type]} · {speakerName(claim.speaker, report, copy)}
            </p>
            <p>{claim.text}</p>
            <p className={styles.meta}>{copy.support[claim.support]}</p>
            {claim.quote ? (
              <ShowButton id={'a-' + claim.id} onShow={onShow} copy={copy} />
            ) : (
              <p className={styles.meta}>{copy.noPassage}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ArgumentsSection({
  report,
  language,
}: {
  report: Report;
  language: OutputLanguage;
}) {
  const copy = reportCopy(language);
  return (
    <section id="report-arguments" className={styles.section}>
      <div className={styles.twoUp}>
        <div>
          <h3>{copy.sections.strongestCase}</h3>
          <p>{report.strongestCase}</p>
        </div>
        <div>
          <h3>{copy.sections.strongestObjection}</h3>
          <p>{report.strongestObjection}</p>
        </div>
      </div>
      {report.missingVoices.length > 0 && (
        <div className={styles.subsection}>
          <h3>{copy.sections.missingVoices}</h3>
          <ul className={styles.plainList}>
            {report.missingVoices.map((item) => (
              <li key={item.who}>
                <strong>{item.who}</strong>
                {item.why && ' — ' + item.why}
              </li>
            ))}
          </ul>
        </div>
      )}
      {report.questions.length > 0 && (
        <div className={styles.subsection}>
          <h3>{copy.sections.questions}</h3>
          <ol className={styles.plainList}>
            {report.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </div>
      )}
      {report.whatWouldChange.length > 0 && (
        <div className={styles.subsection}>
          <h3>{copy.sections.whatWouldChange}</h3>
          <ul className={styles.plainList}>
            {report.whatWouldChange.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
