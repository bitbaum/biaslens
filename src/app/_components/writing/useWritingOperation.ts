'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { WritingSession, type WritingOperation } from '@bitbaum/writingkit';

/** React ownership and notices only; WritingKit decides which proposal may apply. */
export function useWritingOperation(documentId: string, snapshot: string) {
  const owner = useRef<WritingSession | null>(null);
  const revision = useRef(0);
  const previous = useRef(snapshot);
  const notice = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const session = new WritingSession({ documentId, revision: revision.current });
    owner.current = session;
    return () => {
      session.dispose();
      if (owner.current === session) owner.current = null;
    };
  }, [documentId]);

  const invalidate = useCallback(() => {
    revision.current++;
    owner.current?.update({ documentId, revision: revision.current });
  }, [documentId]);

  useLayoutEffect(() => {
    if (previous.current !== snapshot) {
      previous.current = snapshot;
      invalidate();
    }
  }, [snapshot, invalidate]);

  const run = useCallback(
    async <T>(
      work: (operation: WritingOperation) => Promise<T>,
      apply: (value: T) => undefined,
      changed = 'Your writing or options changed while help was working. Your changes were kept. Try again.',
    ) => {
      const session = owner.current;
      if (!session || session.busy) return;
      const request = ++notice.current;
      setBusy(true);
      setError(null);
      const outcome = await session.run(work, apply);
      if (owner.current !== session || notice.current !== request) return;
      if (outcome.status === 'stale') setError(changed);
      if (outcome.status === 'failed')
        setError(
          outcome.error instanceof Error
            ? outcome.error.message
            : 'Writing help could not finish. Try again.',
        );
      setBusy(false);
    },
    [],
  );

  const cancel = useCallback(() => {
    notice.current++;
    owner.current?.cancel();
    setBusy(false);
    setError(null);
  }, []);

  return {
    busy,
    error,
    run,
    cancel,
    invalidate,
    isBusy: useCallback(() => owner.current?.busy ?? false, []),
    isActive: useCallback(() => owner.current !== null, []),
  };
}
