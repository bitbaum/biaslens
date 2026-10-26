'use client';

import { useRef, useState } from 'react';

import type { OutputLanguage } from '@/lib/config/languages';
import { profileCopy } from '@/lib/config/profile-copy';
import { PROJECT_LINKS } from '@/lib/config/routes';
import type { ProfileResult, ProfileRole } from '@/lib/entities/profile';

import styles from './profile.module.css';

/**
 * A name that opens the person's or outlet's public record. The sheet is a
 * native <dialog>, so focus, Escape and the backdrop behave as expected.
 */
export function ProfileName({
  name,
  role,
  context,
  language,
}: {
  name: string;
  role: ProfileRole;
  context: string | null;
  language: OutputLanguage;
}) {
  const copy = profileCopy(language);
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ProfileResult | null>(null);

  const load = async (qid?: string) => {
    setState('loading');
    try {
      const params = new URLSearchParams({ name, role, lang: language });
      if (context) params.set('context', context);
      if (qid) params.set('qid', qid);
      const response = await fetch('/api/profile?' + params.toString());
      const payload = (await response.json()) as { ok?: boolean; result?: ProfileResult };
      if (!payload.ok || !payload.result) throw new Error('profile');
      setResult(payload.result);
      setState('done');
    } catch {
      setState('error');
    }
  };

  const open = () => {
    dialog.current?.showModal();
    if (state === 'idle' || state === 'error') void load();
  };

  const report =
    PROJECT_LINKS.challenge +
    '&title=' +
    encodeURIComponent(
      'Profile: ' + name + (result?.status === 'found' ? ' (' + result.profile.qid + ')' : ''),
    );

  return (
    <>
      <button type="button" className={styles.name} onClick={open} aria-haspopup="dialog">
        {name}
      </button>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-label={copy.open(name)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className={styles.body}>
          <header className={styles.header}>
            <h2>{result?.status === 'found' ? result.profile.label : name}</h2>
            <button type="button" className={styles.close} onClick={() => dialog.current?.close()}>
              {copy.close}
            </button>
          </header>
          {state === 'loading' && <p className={styles.muted}>{copy.loading}</p>}
          {state === 'error' && (
            <p>
              {copy.failed}{' '}
              <button type="button" className={styles.link} onClick={() => void load()}>
                {copy.retry}
              </button>
            </p>
          )}
          {state === 'done' && result && (
            <ProfileBody result={result} language={language} onPick={(qid) => void load(qid)} />
          )}
          <p className={styles.muted}>{copy.intro}</p>
          <a className={styles.link} href={report} target="_blank" rel="noreferrer">
            {copy.wrong}
          </a>
        </div>
      </dialog>
    </>
  );
}

function ProfileBody({
  result,
  language,
  onPick,
}: {
  result: ProfileResult;
  language: OutputLanguage;
  onPick(qid: string): void;
}) {
  const copy = profileCopy(language);
  if (result.status === 'not_found') return <p>{copy.notFound}</p>;
  if (result.status === 'lookup_failed') return <p>{copy.failed}</p>;
  if (result.status === 'ambiguous') {
    return (
      <div className={styles.candidates}>
        <p>{copy.ambiguous}</p>
        {result.candidates.map((candidate) => (
          <button key={candidate.qid} type="button" onClick={() => onPick(candidate.qid)}>
            <strong>{candidate.label}</strong>
            {candidate.description && <span>{candidate.description}</span>}
          </button>
        ))}
      </div>
    );
  }
  const { profile } = result;
  return (
    <div className={styles.profile}>
      {profile.description && <p className={styles.description}>{profile.description}</p>}
      <dl className={styles.facts}>
        {profile.facts.map((fact) => (
          <div key={fact.property}>
            <dt>{copy.properties[fact.property]}</dt>
            <dd>
              {fact.values.map((value) => value.label).join(', ')}{' '}
              <a href={fact.source} target="_blank" rel="noreferrer">
                ({copy.source})
              </a>
            </dd>
          </div>
        ))}
        {profile.ownershipChain.length > 0 && (
          <div>
            <dt>{copy.ownedVia}</dt>
            <dd>
              {profile.ownershipChain.map((owner, index) => (
                <span key={owner.qid}>
                  {index > 0 && ' → '}
                  <a
                    href={'https://www.wikidata.org/wiki/' + owner.qid}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {owner.label}
                  </a>
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
      {profile.wikipedia?.extract && (
        <blockquote className={styles.wikipedia}>
          <p>{profile.wikipedia.extract}</p>
          <a href={profile.wikipedia.url} target="_blank" rel="noreferrer">
            {copy.fromWikipedia}
          </a>
        </blockquote>
      )}
      <a className={styles.link} href={profile.wikidataUrl} target="_blank" rel="noreferrer">
        {copy.wikidata} →
      </a>
    </div>
  );
}
