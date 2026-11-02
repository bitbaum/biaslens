'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './investigation.module.css';

type Props = { id: string; revision: number; token: string | null; defaultSubject: string };

/** One AI illustration per tap, always labelled "AI-generated" where it appears. */
export function AiIllustration({ id, revision, token, defaultSubject }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(defaultSubject);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  if (!token) return null;
  async function run() {
    setBusy(true);
    setStatus('Drawing an illustration… this can take up to a minute.');
    const body = await fetch(`/api/investigations/${id}/images`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ editToken: token, revision, subject }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    setBusy(false);
    if (!body.ok) return setStatus(body.error?.message ?? 'Could not make the illustration.');
    setStatus('Added. It is labelled as AI-generated wherever it is shown.');
    router.refresh();
  }
  return (
    <div className={styles.photoSearch}>
      <h3>Or generate an AI illustration</h3>
      <p className={styles.meta}>
        An illustration, not a photo: no real people, no text. It is labelled “AI-generated” on
        every page.
      </p>
      <div className={styles.actions}>
        <input
          aria-label="What the illustration should show"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <button
          type="button"
          className="bb-button bb-button--secondary"
          disabled={busy || subject.trim().length < 4}
          onClick={() => void run()}
        >
          {busy ? 'Drawing…' : 'Generate'}
        </button>
      </div>
      <p role="status" className={styles.meta}>
        {status}
      </p>
    </div>
  );
}
