'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { parseInquiryRecord, INQUIRY_STORAGE_KEY } from '@/lib/domain/inquiry-record';
import styles from './workspace.module.css';
export function NotebookResume() {
  const [question, setQuestion] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INQUIRY_STORAGE_KEY);
      const record = raw ? parseInquiryRecord(JSON.parse(raw)) : null;
      if (record?.question.trim()) queueMicrotask(() => setQuestion(record.question));
    } catch {
      /* The notebook remains available even if browser storage is blocked. */
    }
  }, []);
  if (!question) return null;
  return (
    <aside className={styles.resume}>
      <div>
        <span className={styles.number}>Continue your notebook · this browser</span>
        <h2>{question}</h2>
      </div>
      <Link className="bb-button bb-button--secondary" href="/explore">
        Continue investigating →
      </Link>
    </aside>
  );
}
