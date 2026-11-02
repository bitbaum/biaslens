'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  DESIGN_PROFILE,
  HORIZONS,
  IDENTIFICATION_DESIGNS,
  type Horizon,
  type IdentificationDesign,
  type Investigation,
} from '@/lib/domain/investigation';

import styles from './investigation.module.css';

import { tokenKey } from './GapDesk';
import { PhotoSearch } from './PhotoSearch';
import { PREFILL_EVENT } from './SuggestSources';

type Props = { id: string | null; revision: number; investigation: Investigation };

/**
 * Save a copy (anyone) or update (holder of the edit token, kept in this
 * browser). Adds a study finding linked to a claim and edits the notes.
 */
export function InvestigationEditor({ id, revision: initialRevision, investigation }: Props) {
  const router = useRouter();
  const [revision, setRevision] = useState(initialRevision);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState(investigation.notes);
  const [draft, setDraft] = useState({
    claimId: investigation.claims[0]?.id ?? '',
    title: '',
    authors: '',
    year: '',
    url: '',
    doi: '',
    design: 'difference_in_differences' as IdentificationDesign,
    statement: '',
    locator: '',
    population: '',
    horizon: 'short_run' as Horizon,
    stance: 'context' as 'supports' | 'contradicts' | 'context',
    rationale: '',
    strengthNote: '',
  });
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    queueMicrotask(() => {
      try {
        setToken(localStorage.getItem(tokenKey(id)));
      } catch {
        /* Storage blocked: the page stays readable and can be saved as a copy. */
      }
    });
  }, [id]);
  useEffect(() => {
    const onPrefill = (event: Event) => {
      const c = (event as CustomEvent).detail as {
        title: string;
        authors: string;
        year: number | null;
        url: string;
        doi: string | null;
        claimId: string;
      };
      setDraft((d) => ({
        ...d,
        claimId: c.claimId,
        title: c.title,
        authors: c.authors,
        year: c.year ? String(c.year) : '',
        url: c.url,
        doi: c.doi ?? '',
        statement: '',
        locator: '',
      }));
      setStatus('Lead copied below. Open it, then write what it actually finds and where.');
      document.getElementById('edit-heading')?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  async function saveCopy(data: Investigation) {
    setStatus('Saving…');
    const response = await fetch('/api/investigations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!body.ok) return setStatus(body.error?.message ?? 'Could not save.');
    localStorage.setItem(tokenKey(body.id), body.editToken);
    router.push('/investigations/' + body.id);
  }

  async function update(data: Investigation) {
    if (!id || !token) return saveCopy(data);
    setStatus('Saving…');
    const response = await fetch('/api/investigations/' + id, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ editToken: token, revision, investigation: data }),
    });
    const body = await response.json();
    if (!body.ok) return setStatus(body.error?.message ?? 'Could not save.');
    setRevision(body.revision);
    setStatus('Saved.');
    router.refresh();
  }

  function withStudy(): Investigation | null {
    if (!draft.title || !draft.url || !draft.statement || !draft.locator || !draft.rationale) {
      setStatus('A study needs a title, link, finding, locator and why it bears on the claim.');
      return null;
    }
    const n = investigation.studies.length + 1;
    const studyId = 's-' + n + '-' + Date.now().toString(36);
    return {
      ...investigation,
      notes,
      studies: [
        ...investigation.studies,
        {
          id: studyId,
          title: draft.title,
          authors: draft.authors,
          year: draft.year ? Number(draft.year) : null,
          venue: '',
          doi: draft.doi.trim() || null,
          url: draft.url,
          design: draft.design,
          review: 'candidate',
          findings: [
            {
              id: 'f-1',
              statement: draft.statement,
              locator: draft.locator,
              outcome: '',
              population: draft.population,
              horizon: draft.horizon,
            },
          ],
        },
      ],
      links: [
        ...investigation.links,
        {
          id: 'l-' + studyId,
          claimId: draft.claimId,
          studyId,
          findingId: 'f-1',
          stance: draft.stance,
          review: 'candidate',
          rationale: draft.rationale,
          strengthNote: draft.strengthNote,
        },
      ],
    };
  }

  const set = (key: keyof typeof draft) => (event: { target: { value: string } }) =>
    setDraft({ ...draft, [key]: event.target.value });

  return (
    <section className={styles.section} aria-labelledby="edit-heading">
      <h2 id="edit-heading">{id && token ? 'Update this investigation' : 'Make it yours'}</h2>
      {!(id && token) && (
        <p className={styles.meta}>
          Saving creates your own copy with its own link. The edit key stays in this browser.
        </p>
      )}
      <div className={styles.form}>
        <label>
          Notes
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className="bb-button bb-button--primary"
            onClick={() => update({ ...investigation, notes })}
          >
            {id && token ? 'Save notes' : 'Save a copy'}
          </button>
        </div>
        <PhotoSearch
          onPick={(image) =>
            void update({
              ...investigation,
              notes,
              images: [
                image,
                ...(investigation.images ?? []).filter((i) => i.src !== image.src),
              ].slice(0, 6),
            })
          }
        />
        <h3>Link a study to a claim</h3>
        <label>
          Claim
          <select value={draft.claimId} onChange={set('claimId')}>
            {investigation.claims.map((c) => (
              <option key={c.id} value={c.id}>
                {c.text.slice(0, 90)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Study title
          <input value={draft.title} onChange={set('title')} />
        </label>
        <label>
          Authors
          <input value={draft.authors} onChange={set('authors')} />
        </label>
        <label>
          Year
          <input inputMode="numeric" value={draft.year} onChange={set('year')} />
        </label>
        <label>
          Link (https)
          <input type="url" value={draft.url} onChange={set('url')} />
        </label>
        <label>
          DOI (optional, 10.xxxx/…)
          <input value={draft.doi} onChange={set('doi')} />
        </label>
        <label>
          Identification design
          <select value={draft.design} onChange={set('design')}>
            {IDENTIFICATION_DESIGNS.map((d) => (
              <option key={d} value={d}>
                {DESIGN_PROFILE[d].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          The finding, as the study states it
          <textarea rows={3} value={draft.statement} onChange={set('statement')} />
        </label>
        <label>
          Where to check it (page, table, section)
          <input value={draft.locator} onChange={set('locator')} />
        </label>
        <label>
          Place and period studied
          <input value={draft.population} onChange={set('population')} />
        </label>
        <label>
          Horizon
          <select value={draft.horizon} onChange={set('horizon')}>
            {HORIZONS.map((h) => (
              <option key={h} value={h}>
                {h.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bearing on the claim
          <select value={draft.stance} onChange={set('stance')}>
            <option value="supports">Supports</option>
            <option value="contradicts">Contradicts</option>
            <option value="context">Context</option>
          </select>
        </label>
        <label>
          Why it bears on the claim
          <textarea rows={2} value={draft.rationale} onChange={set('rationale')} />
        </label>
        <label>
          Strength of evidence note
          <textarea rows={2} value={draft.strengthNote} onChange={set('strengthNote')} />
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className="bb-button bb-button--secondary"
            onClick={() => {
              const next = withStudy();
              if (next) void update(next);
            }}
          >
            Add study and save
          </button>
        </div>
        <p role="status" className={styles.meta}>
          {status}
        </p>
      </div>
    </section>
  );
}
