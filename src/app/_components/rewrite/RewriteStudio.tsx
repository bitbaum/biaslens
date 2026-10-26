'use client';

import { useState } from 'react';

import { ReplyComposer } from '@/app/_components/replies/ReplyComposer';
import type { ReportResult } from '@/lib/analysis/run';
import { localized, PERSPECTIVES, type PerspectiveId } from '@/lib/config/perspectives';
import { rewriteCopy } from '@/lib/config/rewrite-copy';
import {
  REWRITE_LENGTHS,
  VOICES_FOR,
  type RewriteForm,
  type RewriteLength,
  type Voice,
  type VoiceKind,
} from '@/lib/config/rewrite-modes';
import { STYLE_PRESETS, type StylePresetId } from '@/lib/config/style-presets';

import { RewriteResultView, type StudioRewrite } from './RewriteResultView';
import styles from './rewrite.module.css';

type Candidate = { qid: string; label: string; description: string | null };

/**
 * The same facts, told another way — or an answer to the article. Every result
 * carries a label written by code, and a rewrite of the article comes with a
 * check of which facts it kept, changed, dropped or added.
 */
export function RewriteStudio({ reportId, result }: { reportId: string; result: ReportResult }) {
  const copy = rewriteCopy(result.language);
  const [form, setForm] = useState<RewriteForm>(
    result.sourceText || result.origin.url ? 'rewrite' : 'response',
  );
  const [kind, setKind] = useState<VoiceKind>(form === 'rewrite' ? 'neutral' : 'biaslens');
  const [axes, setAxes] = useState<PerspectiveId[]>([]);
  const [outlet, setOutlet] = useState<StylePresetId>('weltwoche');
  const [person, setPerson] = useState('');
  const [personQid, setPersonQid] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [length, setLength] = useState<RewriteLength>('short');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewrite, setRewrite] = useState<StudioRewrite | null>(null);
  const [sending, setSending] = useState(false);

  const voice = (): Voice | null => {
    if (kind === 'perspective') return axes.length ? { kind, axes } : null;
    if (kind === 'outlet') return { kind, outlet };
    if (kind === 'person')
      return person.trim().length >= 3 ? { kind, name: person.trim(), qid: personQid } : null;
    return { kind } as Voice;
  };

  const chooseForm = (next: RewriteForm) => {
    setForm(next);
    if (!VOICES_FOR[next].includes(kind)) setKind(VOICES_FOR[next][0]!);
  };

  const write = async () => {
    const chosen = voice();
    if (!chosen) return;
    setBusy(true);
    setError(null);
    setCandidates([]);
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reportId, form, voice: chosen, length, text: result.sourceText }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        rewrite?: StudioRewrite;
        error?: {
          message?: string;
          reason?: keyof typeof copy.personErrors;
          candidates?: Candidate[];
        };
      };
      if (!payload.ok || !payload.rewrite) {
        const reason = payload.error?.reason;
        if (reason === 'ambiguous') setCandidates(payload.error?.candidates ?? []);
        setError(
          reason
            ? copy.personErrors[reason]
            : (payload.error?.message ?? copy.personErrors.lookup_failed),
        );
        return;
      }
      setRewrite(payload.rewrite);
      setSending(false);
    } catch {
      setError('The rewrite could not be written. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="report-studio" className={styles.studio} aria-labelledby="studio-heading">
      <h3 id="studio-heading">{copy.title}</h3>
      <p className={styles.muted}>{copy.intro}</p>

      {!rewrite && (
        <>
          <div className={styles.segmented} role="group" aria-label={copy.formLabel}>
            {(['rewrite', 'response'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={form === item}
                onClick={() => chooseForm(item)}
              >
                {copy.forms[item]}
              </button>
            ))}
          </div>

          <fieldset className={styles.fieldset}>
            <legend>{copy.voiceLabel}</legend>
            <div className={styles.voices}>
              {VOICES_FOR[form].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.voice}
                  aria-pressed={kind === item}
                  onClick={() => setKind(item)}
                >
                  {copy.voices[item]}
                </button>
              ))}
            </div>
          </fieldset>

          {kind === 'perspective' && (
            <fieldset className={styles.fieldset}>
              <legend>{copy.axesLabel}</legend>
              <div className={styles.axes}>
                {PERSPECTIVES.map((item) => (
                  <label key={item.id} className={styles.axis}>
                    <input
                      type="checkbox"
                      checked={axes.includes(item.id)}
                      disabled={!axes.includes(item.id) && axes.length >= 2}
                      onChange={(event) =>
                        setAxes((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((axis) => axis !== item.id),
                        )
                      }
                    />
                    <span>
                      <strong>{localized(item.label, result.language)}</strong>
                      <span>{localized(item.premise, result.language)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {kind === 'outlet' && (
            <label className={styles.field}>
              <span>{copy.outletLabel}</span>
              <select
                className="bb-control"
                value={outlet}
                onChange={(event) => setOutlet(event.target.value as StylePresetId)}
              >
                {STYLE_PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === 'person' && (
            <div className={styles.field}>
              <label htmlFor="studio-person">{copy.personLabel}</label>
              <input
                id="studio-person"
                className="bb-control"
                value={person}
                maxLength={80}
                placeholder={copy.personPlaceholder}
                onChange={(event) => {
                  setPerson(event.target.value);
                  setPersonQid(null);
                }}
              />
              <p className={styles.hint}>{copy.personHint}</p>
              {candidates.length > 0 && (
                <div className={styles.candidates} role="group" aria-label={copy.pickPerson}>
                  <p>{copy.pickPerson}</p>
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.qid}
                      type="button"
                      aria-pressed={personQid === candidate.qid}
                      onClick={() => {
                        setPersonQid(candidate.qid);
                        setPerson(candidate.label);
                        setError(null);
                      }}
                    >
                      <strong>{candidate.label}</strong>
                      {candidate.description && <span>{candidate.description}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.segmented} role="group" aria-label={copy.lengthLabel}>
            {REWRITE_LENGTHS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={length === item}
                onClick={() => setLength(item)}
              >
                {copy.lengths[item]}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <button
            type="button"
            className="bb-button bb-button--secondary"
            disabled={busy || !voice()}
            onClick={write}
          >
            {busy ? copy.writing : copy.write}
          </button>
        </>
      )}

      {rewrite && (
        <>
          <RewriteResultView
            rewrite={rewrite}
            original={result.sourceText}
            language={result.language}
          />
          <div className={styles.twoCells}>
            <button
              type="button"
              className="bb-button bb-button--secondary"
              onClick={() => setSending(true)}
            >
              {copy.send}
            </button>
            <button
              type="button"
              className="bb-button bb-button--secondary"
              onClick={() => setRewrite(null)}
            >
              {copy.again}
            </button>
          </div>
          {sending && (
            <ReplyComposer
              reportId={reportId}
              result={result}
              rewrite={{ id: rewrite.id, label: rewrite.label, title: rewrite.title }}
            />
          )}
        </>
      )}
    </section>
  );
}
