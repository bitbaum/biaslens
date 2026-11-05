'use client';

import Link from 'next/link';
import { useState } from 'react';

import styles from './analyze.module.css';

/**
 * Every reading is kept at its own address. Say so, right where the reading
 * is, and put the link one tap away — otherwise nobody knows it exists.
 */
export function SavedLink({ id, cached }: { id: string; cached: boolean }) {
  const [copied, setCopied] = useState(false);
  const path = `/r/${id}`;
  const copy = async () => {
    const link = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', link);
    }
  };
  return (
    <p className={styles.savedLink} role="status">
      <span>
        {cached ? 'This text was examined before; ' : 'Saved. '}
        This reading has its own link:{' '}
        <Link href={path}>
          {typeof window === 'undefined' ? path : new URL(path, window.location.origin).host + path}
        </Link>
      </span>
      <button type="button" className="bb-button bb-button--secondary" onClick={copy}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </p>
  );
}
