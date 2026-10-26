'use client';

import { useState } from 'react';

import type { ReportResult } from '@/lib/analysis/run';
import { replyCopy } from '@/lib/config/reply-copy';

import { ReplyComposer } from './ReplyComposer';
import styles from './replies.module.css';

/** The report's one primary action: reply to whoever sent the article. */
export function ReplyLauncher({
  reportId,
  result,
  parentReplyId = null,
  initiallyOpen = false,
}: {
  reportId: string;
  result: ReportResult;
  parentReplyId?: string | null;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const copy = replyCopy(result.language);
  return (
    <div className={styles.launcher}>
      {!open && (
        <button
          type="button"
          className={`${styles.primary} bb-button bb-button--primary`}
          onClick={() => setOpen(true)}
        >
          {copy.open}
        </button>
      )}
      {open && <ReplyComposer reportId={reportId} result={result} parentReplyId={parentReplyId} />}
    </div>
  );
}
