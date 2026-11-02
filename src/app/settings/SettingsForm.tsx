'use client';

import { useEffect, useState } from 'react';

import { forgetEditLinks, myInvestigationIds, PREFS } from '@/lib/client/local';

import { applyPrefs, DEFAULT_PREFS, readPrefs, type Prefs } from '../_components/Preferences';
import styles from './settings.module.css';

const SIZES = [
  ['normal', 'Normal'],
  ['large', 'Large'],
  ['x-large', 'Extra large'],
] as const;

export function SettingsForm() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [links, setLinks] = useState(0);
  const [status, setStatus] = useState('');
  useEffect(() => {
    queueMicrotask(() => {
      setPrefs(readPrefs());
      setLinks(myInvestigationIds().length);
    });
  }, []);
  const save = (next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    applyPrefs(next);
    setStatus('Saved on this device.');
  };
  return (
    <div className={styles.groups}>
      <section className={styles.group} aria-labelledby="reading-heading">
        <h2 id="reading-heading">Reading</h2>
        <fieldset className={styles.field}>
          <legend>Text size</legend>
          {SIZES.map(([size, label]) => (
            <label key={size} className={styles.choice}>
              <input
                type="radio"
                name="size"
                checked={prefs.textSize === size}
                onChange={() => save({ ...prefs, textSize: size })}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className={styles.field}>
          <legend>Animation</legend>
          <label className={styles.choice}>
            <input
              type="radio"
              name="motion"
              checked={prefs.motion === 'system'}
              onChange={() => save({ ...prefs, motion: 'system' })}
            />
            Follow my device
          </label>
          <label className={styles.choice}>
            <input
              type="radio"
              name="motion"
              checked={prefs.motion === 'reduce'}
              onChange={() => save({ ...prefs, motion: 'reduce' })}
            />
            Reduce motion
          </label>
        </fieldset>
      </section>
      <section className={styles.group} aria-labelledby="data-heading">
        <h2 id="data-heading">This device</h2>
        <p className={styles.meta}>
          Edit links for {links} investigation{links === 1 ? '' : 's'}, your follows, visit streak
          and these settings are kept in this browser only.
        </p>
        <button
          type="button"
          className="bb-button bb-button--secondary"
          disabled={links === 0}
          onClick={() => {
            if (
              !window.confirm(
                'Forget the edit links on this device? You can still read those investigations, but not change them from here.',
              )
            )
              return;
            forgetEditLinks();
            setLinks(0);
            setStatus('Edit links removed from this device.');
          }}
        >
          Forget edit links on this device
        </button>
      </section>
      <p role="status" className={styles.meta}>
        {status}
      </p>
    </div>
  );
}
