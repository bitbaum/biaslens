import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArgumentsSection, FiguresSection, VoicesSection } from '@/app/analyze/report/Sections';
import { OUTPUT_LANGUAGES } from '@/lib/config/languages';
import { reportCopy } from '@/lib/config/report-copy';
import { replyCopy } from '@/lib/config/reply-copy';
import { PROJECT_LINKS } from '@/lib/config/routes';
import { guessFor, rankFindings } from '@/lib/replies/findings';
import { loadReply } from '@/lib/reports/load';

import { GuessFirst } from './GuessFirst';
import styles from './receiver.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const loaded = await loadReply(id);
  if (!loaded) return { title: 'Reply not found' };
  const { report, language } = loaded.report.result;
  const finding = rankFindings(report, language)[0]?.text ?? report.insight.headline;
  const title = replyCopy(language).cardSent(loaded.reply.senderName) + ': ' + report.title;
  return {
    title,
    description: finding,
    openGraph: { title, description: finding, type: 'article' },
    twitter: { card: 'summary_large_image' },
    robots: { index: false },
  };
}

/**
 * What the person who receives a reply sees. Built for ten seconds of
 * attention: their article, three findings they can check against its own
 * words, and a way to answer back.
 */
export default async function ReplyPage({ params }: Props) {
  const { id } = await params;
  const loaded = await loadReply(id);
  if (!loaded) notFound();
  const { reply, report: saved } = loaded;
  const { report, language, origin } = saved.result;
  const copy = replyCopy(language);
  const rcopy = reportCopy(language);
  const findings = rankFindings(report, language).slice(0, 3);
  const guess = reply.blocks.includes('guess') ? guessFor(report, findings, language) : null;
  const blocks = new Set(reply.blocks);
  const challenge = (text: string) =>
    PROJECT_LINKS.challenge + '&title=' + encodeURIComponent('Disagree: ' + text.slice(0, 120));

  const findingsList = (
    <section aria-labelledby="findings-heading" className={styles.findings}>
      <h2 id="findings-heading">{copy.threeThings}</h2>
      <ol>
        {findings.map((finding) => (
          <li key={finding.id} className={styles.finding}>
            <p>{finding.text}</p>
            {finding.passage && (
              <blockquote className={styles.passage}>{finding.passage.text}</blockquote>
            )}
            <a className={styles.disagree} href={challenge(finding.text)}>
              {copy.disagree}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );

  return (
    <main
      id="main-content"
      className={`${styles.page} bb-frame`}
      lang={OUTPUT_LANGUAGES[language].html}
    >
      <article className={styles.card}>
        <header className={styles.header}>
          <p className={styles.note}>{copy.aiNote}</p>
          <p className={styles.sentBy}>{copy.sentBy(reply.senderName)}</p>
          <h1 className={styles.title}>{report.title}</h1>
          <p className={styles.meta}>
            {[report.byline.publication, report.byline.authors.join(', ')]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {origin.url && (
            <a className={styles.textLink} href={origin.url} target="_blank" rel="noreferrer">
              {rcopy.openSource} →
            </a>
          )}
          {reply.note && (
            <blockquote className={styles.senderNote}>
              <p className={styles.kicker}>{copy.sentNote}</p>
              <p>{reply.note}</p>
            </blockquote>
          )}
        </header>

        {guess ? (
          <GuessFirst
            guess={guess}
            copy={{
              title: copy.guessTitle,
              right: copy.guessRight,
              wrong: copy.guessWrong(guess.answerLabel),
              skip: copy.guessSkip,
            }}
          >
            {findingsList}
          </GuessFirst>
        ) : (
          findingsList
        )}

        {blocks.has('assumption') && (
          <section className={styles.block}>
            <p className={styles.kicker}>{rcopy.sections.keyAssumption}</p>
            <h2>{report.insight.headline}</h2>
            <p>{report.insight.explanation}</p>
            <p>
              <strong>{rcopy.sections.test}: </strong>
              {report.insight.test}
            </p>
          </section>
        )}
        {blocks.has('voices') && (
          <VoicesSection report={report} language={language} onShow={undefined} />
        )}
        {blocks.has('figures') && (
          <FiguresSection report={report} language={language} onShow={undefined} />
        )}
        {blocks.has('arguments') && <ArgumentsSection report={report} language={language} />}
        {blocks.has('questions') && !blocks.has('arguments') && report.questions.length > 0 && (
          <section className={styles.block}>
            <h2>{rcopy.sections.questions}</h2>
            <ol className={styles.list}>
              {report.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </section>
        )}

        <footer className={styles.actions}>
          <Link
            className={`${styles.primary} bb-button bb-button--primary`}
            href={`/r/${saved.id}?reply=${reply.id}`}
          >
            {copy.replyBack(reply.senderName)}
          </Link>
          <div className={styles.twoCells}>
            <Link className="bb-button bb-button--secondary" href={`/r/${saved.id}`}>
              {copy.fullReading}
            </Link>
            <Link className="bb-button bb-button--secondary" href="/analyze">
              {copy.examineAny}
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
