'use client';

import { useState, type RefObject } from 'react';
import { useDictation } from '@bitbaum/chatkit/react';

import type { InvestigationImage } from '@/lib/domain/investigation';
import { PhotoSearch } from '@/app/investigations/PhotoSearch';

import styles from './write.module.css';

export type Panel = 'speak' | 'improve' | 'photo' | 'chart' | null;

/** Insert text at the caret of a textarea, through its React state. */
export function insertAt(
  ref: RefObject<HTMLTextAreaElement | null>,
  body: string,
  snippet: string,
  setBody: (next: string) => void,
) {
  const el = ref.current;
  const start = el?.selectionStart ?? body.length;
  const end = el?.selectionEnd ?? body.length;
  const before = body.slice(0, start);
  const after = body.slice(end);
  const pad = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const next = before + pad + snippet + (after.startsWith('\n') ? '' : '\n\n') + after;
  setBody(next);
  window.requestAnimationFrame(() => {
    el?.focus();
    const at = (before + pad + snippet).length;
    el?.setSelectionRange(at, at);
  });
}

/** Wrap the selection, or insert a placeholder, for the formatting buttons. */
export function wrapSelection(
  ref: RefObject<HTMLTextAreaElement | null>,
  body: string,
  before: string,
  after: string,
  placeholder: string,
  setBody: (next: string) => void,
) {
  const el = ref.current;
  const start = el?.selectionStart ?? body.length;
  const end = el?.selectionEnd ?? body.length;
  const chosen = body.slice(start, end) || placeholder;
  const next = body.slice(0, start) + before + chosen + after + body.slice(end);
  setBody(next);
  window.requestAnimationFrame(() => {
    el?.focus();
    el?.setSelectionRange(start + before.length, start + before.length + chosen.length);
  });
}

const CHART_TEMPLATE = `\`\`\`chart
{ "kind": "bar", "title": "Say what the numbers show", "series": [{ "name": "Series", "points": [["2024", 10], ["2025", 14], ["2026", 9]] }] }
\`\`\``;

const PROBLEM_TEXT = {
  mic: 'The microphone could not be used. Check the browser’s permission and try again.',
  silence: 'Nothing was heard. Try again, a little closer to the microphone.',
  unavailable: 'Speaking is not available here just now. You can still type.',
  fileTooLarge: 'That recording is too long to send.',
} as const;

/**
 * Speaking to the composer. One microphone, two outcomes: the words become a
 * brief the writing help turns into an article, or they go straight into the
 * text. Chatkit's dictation does the listening — the same microphone as in
 * every chat on the site, with the server leg at /api/transcribe.
 */
export function SpeakPanel({
  onBrief,
  onDictate,
  onEdit,
  busy,
  canDraft,
}: {
  onBrief: (brief: string) => void;
  onDictate: (text: string) => void;
  onEdit: () => void;
  busy: boolean;
  canDraft: boolean;
}) {
  const [heard, setHeard] = useState('');
  const dictation = useDictation({
    onText: (text) => {
      onEdit();
      setHeard((current) => (current ? current + ' ' + text : text).trim());
    },
    transcribeUrl: '/api/transcribe',
    rememberKey: 'biaslens:dictation',
    maxRecordingMs: 180_000,
  });
  if (!dictation.supported)
    return (
      <div className={styles.panel}>
        <p className={styles.meta}>
          Speaking is not available in this browser. Type instead, or paste a transcript below.
        </p>
      </div>
    );
  const listening = dictation.status === 'listening';
  return (
    <div className={styles.panel} aria-live="polite">
      <div className={styles.panelHead}>
        <h2>Say it</h2>
        <p className={styles.meta}>
          Tell us what to write and how (“an angry piece, 400 words, about…”), or dictate the text
          itself. Press done when you finish.
        </p>
      </div>
      <div className={styles.panelActions}>
        <button
          type="button"
          className={`bb-button ${listening ? 'bb-button--secondary' : 'bb-button--primary'}`}
          onClick={() => (listening ? dictation.stop() : dictation.start())}
          disabled={dictation.status === 'transcribing' || busy}
        >
          {listening
            ? 'Done'
            : dictation.status === 'transcribing'
              ? 'Writing it down…'
              : heard
                ? 'Say more'
                : 'Start speaking'}
        </button>
        {listening && (
          <button
            type="button"
            className="bb-button bb-button--secondary"
            onClick={dictation.cancel}
          >
            Cancel
          </button>
        )}
      </div>
      {listening && <p className={styles.live}>{dictation.liveText || 'Listening…'}</p>}
      {dictation.problem && (
        <p role="alert" className={styles.problemLine}>
          {PROBLEM_TEXT[dictation.problem]}
          {dictation.problemDetail ? ` ${dictation.problemDetail}` : ''}
          {dictation.canRetry && (
            <>
              {' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => void dictation.retry()}
              >
                Try that take again
              </button>
            </>
          )}
        </p>
      )}
      <label className={styles.label} htmlFor="write-heard">
        What was heard (edit it if you like)
      </label>
      <textarea
        id="write-heard"
        className={`${styles.heard} bb-control`}
        value={heard}
        onChange={(event) => {
          onEdit();
          setHeard(event.target.value);
        }}
        placeholder="Your words appear here…"
        rows={4}
      />
      <div className={styles.panelActions}>
        <button
          type="button"
          className="bb-button bb-button--primary"
          disabled={!heard.trim() || busy || !canDraft}
          onClick={() => onBrief(heard.trim())}
        >
          {busy ? 'Writing…' : 'Write the article from this'}
        </button>
        <button
          type="button"
          className="bb-button bb-button--secondary"
          disabled={!heard.trim() || busy}
          onClick={() => {
            onDictate(heard.trim());
            setHeard('');
          }}
        >
          Put these words in the text
        </button>
      </div>
      {!canDraft && (
        <p className={styles.meta}>
          Sign in to have the article written for you; dictation works without.
        </p>
      )}
    </div>
  );
}

/** "Make it tighter", "fix the grammar", "add the other side": one instruction, spoken or typed. */
export function ImprovePanel({
  onImprove,
  onEdit,
  busy,
  canUndo,
  onUndo,
}: {
  onImprove: (instruction: string) => void;
  onEdit: () => void;
  busy: boolean;
  canUndo: boolean;
  onUndo: () => void;
}) {
  const [instruction, setInstruction] = useState('');
  const dictation = useDictation({
    onText: (text) => {
      onEdit();
      setInstruction((current) => (current ? current + ' ' + text : text).trim());
    },
    transcribeUrl: '/api/transcribe',
    rememberKey: 'biaslens:dictation',
    maxRecordingMs: 60_000,
  });
  const suggestions = [
    'Fix spelling and grammar, change nothing else',
    'Make it tighter',
    'Give it a sharper title',
    'Add a short counter-argument and answer it',
  ];
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Improve it</h2>
        <p className={styles.meta}>
          Your points and your voice stay; only what you ask for changes. Undo brings the previous
          text back.
        </p>
      </div>
      <div className={styles.chips}>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className={styles.chip}
            onClick={() => {
              onEdit();
              setInstruction(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className={styles.improveRow}>
        <input
          className={`${styles.instruction} bb-control`}
          aria-label="What to change"
          value={instruction}
          onChange={(event) => {
            onEdit();
            setInstruction(event.target.value);
          }}
          placeholder="What should change?"
          maxLength={1000}
        />
        {dictation.supported && (
          <button
            type="button"
            className="bb-button bb-button--secondary"
            onClick={() =>
              dictation.status === 'listening' ? dictation.stop() : dictation.start()
            }
            disabled={busy}
            aria-pressed={dictation.status === 'listening'}
          >
            {dictation.status === 'listening'
              ? 'Done'
              : dictation.status === 'transcribing'
                ? '…'
                : 'Say it'}
          </button>
        )}
      </div>
      {dictation.problem && (
        <p role="alert" className={styles.problemLine}>
          {PROBLEM_TEXT[dictation.problem]}
        </p>
      )}
      <div className={styles.panelActions}>
        <button
          type="button"
          className="bb-button bb-button--primary"
          disabled={!instruction.trim() || busy}
          onClick={() => onImprove(instruction.trim())}
        >
          {busy ? 'Working…' : 'Improve'}
        </button>
        {canUndo && (
          <button type="button" className="bb-button bb-button--secondary" onClick={onUndo}>
            Undo last change
          </button>
        )}
      </div>
    </div>
  );
}

/** An openly licensed photo from Wikimedia Commons, dropped in as a figure with its credit. */
export function PhotoPanel({ onPick }: { onPick: (markdown: string) => void }) {
  const pick = (image: InvestigationImage) => {
    const caption = `${image.caption || image.alt} — ${image.credit}, ${image.license}`.replace(
      /"/g,
      '”',
    );
    onPick(`![${image.alt.replace(/[[\]]/g, '')}](${image.src} "${caption}")`);
  };
  return (
    <div className={styles.panel}>
      <PhotoSearch onPick={pick} />
    </div>
  );
}

/** A chart block bip-kit draws from the numbers; the writer edits the numbers in the text. */
export function ChartPanel({ onInsert }: { onInsert: (markdown: string) => void }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Add a chart</h2>
        <p className={styles.meta}>
          A small bar, line or area chart drawn from numbers you type. The block lands in the text;
          change the title, the names and the points. Kinds: bar, line, area.
        </p>
      </div>
      <pre className={styles.code}>{CHART_TEMPLATE}</pre>
      <div className={styles.panelActions}>
        <button
          type="button"
          className="bb-button bb-button--primary"
          onClick={() => onInsert(CHART_TEMPLATE)}
        >
          Insert the chart block
        </button>
      </div>
    </div>
  );
}
