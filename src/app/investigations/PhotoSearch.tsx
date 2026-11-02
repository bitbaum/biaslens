'use client';

import { useState } from 'react';

import type { InvestigationImage } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

/** Finds openly licensed Commons photos; credit and licence come from the file page. */
export function PhotoSearch({ onPick }: { onPick: (image: InvestigationImage) => void }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [images, setImages] = useState<InvestigationImage[]>([]);
  async function search() {
    setStatus('Searching Wikimedia Commons…');
    const response = await fetch('/api/images/search?q=' + encodeURIComponent(q));
    const body = await response.json();
    if (!body.ok) return setStatus(body.error?.message ?? 'Search failed.');
    setImages(body.images);
    setStatus(
      body.images.length
        ? `${body.images.length} openly licensed photos.`
        : 'No openly licensed photos found.',
    );
  }
  return (
    <div className={styles.photoSearch}>
      <h3>Add a photo</h3>
      <p className={styles.meta}>
        From Wikimedia Commons, openly licensed only. The credit and licence are filled in from the
        file page.
      </p>
      <form
        className={styles.actions}
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          aria-label="Photo search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Zurich apartment buildings"
        />
        <button
          type="submit"
          className="bb-button bb-button--secondary"
          disabled={q.trim().length < 3}
        >
          Search
        </button>
      </form>
      <p role="status" className={styles.meta}>
        {status}
      </p>
      <div className={styles.photoGrid}>
        {images.map((image) => (
          <figure key={image.src} className={styles.photoPick}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote, credited source image */}
            <img src={image.src} alt={image.alt} loading="lazy" />
            <figcaption className={styles.meta}>
              {image.credit} · {image.license}
            </figcaption>
            <button
              type="button"
              className="bb-button bb-button--secondary"
              onClick={() => onPick(image)}
            >
              Use this photo
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
