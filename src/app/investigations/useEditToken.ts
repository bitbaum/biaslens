'use client';

import { useEffect, useState } from 'react';

import { tokenKey } from './GapDesk';

/** The edit token saved in this browser for an investigation, read after mount. */
export function useEditToken(id: string | null): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    queueMicrotask(() => {
      try {
        setToken(localStorage.getItem(tokenKey(id)));
      } catch {
        /* Storage blocked: read-only. */
      }
    });
  }, [id]);
  return token;
}
