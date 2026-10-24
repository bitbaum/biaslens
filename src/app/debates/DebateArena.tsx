'use client';

import { useState, type FormEvent } from 'react';

import {
  formatAirtime,
  measureAirtime,
  parseTimedTranscript,
  type DebateAirtime,
} from '@/lib/debates/airtime';

import styles from './arena.module.css';

const FICTIONAL_SAMPLE = [
  '00:00-00:25 | Moderator | Opening question for both speakers.',
  '00:25-01:10 | Speaker A | First response about a proposed policy.',
  '01:05-01:40 | Speaker B | Different response. These five seconds overlap.',
  '01:40-02:05 | Moderator | Follow-up question.',
  '02:05-03:20 | Speaker A | Second response about the proposed policy.',
  '03:20-04:10 | Speaker B | Reply with a different perspective.',
].join('\n');

export function DebateArena() {
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState<DebateAirtime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFictional, setFictional] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseTimedTranscript(transcript);
    if (!parsed.ok) {
      setError(parsed.error);
      setReport(null);
      return;
    }
    setReport(measureAirtime(parsed.turns));
    setError(null);
  };

  const change = (value: string) => {
    setTranscript(value);
    setReport(null);
    setError(null);
    setFictional(false);
  };

  return (
    <>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.formHeader}>
          <label htmlFor="timed-transcript">Timestamped speaker turns</label>
          <button
            type="button"
            onClick={() => {
              setTranscript(FICTIONAL_SAMPLE);
              setReport(null);
              setError(null);
              setFictional(true);
            }}
          >
            Load fictional example ↗
          </button>
        </div>
        <textarea
          id="timed-transcript"
          className="bb-control"
          rows={10}
          maxLength={65_000}
          value={transcript}
          onChange={(event) => change(event.target.value)}
          placeholder={
            '00:00-00:15 | Speaker A | Opening statement.\n00:15-00:34 | Speaker B | Response.'
          }
          spellCheck={false}
          required
        />
        <p className={styles.hint}>
          One line per turn: <code>00:00-00:15 | Speaker | Speech text</code>. Use MM:SS or HH:MM:SS
          timestamps. The text stays in your browser and is not submitted to a server.
        </p>
        <div className="bb-actions">
          <button
            type="submit"
            className="bb-button bb-button--primary"
            disabled={!transcript.trim()}
          >
            Measure speaker airtime →
          </button>
          <button
            type="button"
            className="bb-button bb-button--secondary"
            onClick={() => change('')}
            disabled={!transcript}
          >
            Clear
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>

      {report && (
        <section
          className={styles.results}
          aria-label="Transcript airtime results"
          aria-live="polite"
        >
          <p className={styles.eyebrow}>
            {isFictional ? 'Fictional illustration' : 'User-supplied transcript'} / Unverified
          </p>
          <h2>Who spoke, according to these timestamps?</h2>
          <p className={styles.warning}>
            Speaker names and timestamps were provided by the user. This is a deterministic
            calculation, not an authentication of the recording or a finding of moderator bias.
          </p>
          <div className={styles.totals}>
            <div>
              <strong>{formatAirtime(report.recordedWindowSeconds)}</strong>
              <span>Window covered by first and last timestamps</span>
            </div>
            <div>
              <strong>{formatAirtime(report.simultaneousSpeakerSeconds)}</strong>
              <span>Simultaneous speaker-seconds, not proven interruptions</span>
            </div>
            <div>
              <strong>{formatAirtime(report.unattributedSeconds)}</strong>
              <span>Unattributed time, not necessarily silence</span>
            </div>
          </div>

          <ol className={styles.speakers}>
            {report.speakers.map((person) => (
              <li key={person.speaker}>
                <div className={styles.speakerHeader}>
                  <strong>{person.speaker}</strong>
                  <span>
                    {formatAirtime(person.airtimeSeconds)} · {person.turns}{' '}
                    {person.turns === 1 ? 'turn' : 'turns'} ·{' '}
                    {person.shareOfSpeakerSeconds.toFixed(1)}% of speaker-seconds
                  </span>
                </div>
                <div className={styles.track} aria-hidden="true">
                  <span style={{ width: `${person.shareOfSpeakerSeconds}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.footnote}>
            Shares total 100% of summed speaker airtime, including cross-speaker overlap. Individual
            speakers&apos; overlapping turns are counted only once. Overlapping speech must be
            manually reviewed before labelling it an interruption.
          </p>
        </section>
      )}
    </>
  );
}
