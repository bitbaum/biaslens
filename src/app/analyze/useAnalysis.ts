'use client';

import { useRef, useState } from 'react';

import type { Stage } from '@/lib/analysis/run';
import type { OutputLanguage } from '@/lib/config/languages';

import type { ReportResult } from './report/ReportView';

export interface AnalysisRequest {
  url?: string;
  text?: string;
  outputLanguage: OutputLanguage;
}

type ApiError = { code?: string; message?: string };

/**
 * Runs an analysis and reports progress. The server streams NDJSON events
 * (stage, result, error); a plain JSON answer (early refusals, older servers,
 * test fixtures) is handled the same way.
 */
export function useAnalysis() {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run(request: AnalysisRequest): Promise<ReportResult | null> {
    setBusy(true);
    setStage(null);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
        body: JSON.stringify(request),
      });
      const type = response.headers.get('content-type') ?? '';
      let final: { result?: ReportResult; error?: ApiError } = {};
      if (type.includes('ndjson') && response.body) {
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (value) buffer += value;
          const lines = buffer.split('\n');
          buffer = done ? '' : lines.pop()!;
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as {
              type: string;
              stage?: Stage;
              result?: ReportResult;
              error?: ApiError;
            };
            if (event.type === 'stage' && event.stage) setStage(event.stage);
            if (event.type === 'result') final = { result: event.result };
            if (event.type === 'error') final = { error: event.error };
          }
          if (done) break;
        }
      } else {
        const payload = (await response.json()) as {
          ok?: boolean;
          result?: ReportResult;
          error?: ApiError;
        };
        final =
          payload.ok && payload.result ? { result: payload.result } : { error: payload.error };
      }
      if (!final.result) {
        setError(final.error ?? { message: 'The text could not be examined.' });
        return null;
      }
      setResult(final.result);
      return final.result;
    } catch {
      setError({
        message: controller.signal.aborted
          ? 'Examination stopped. Your text is still here.'
          : 'Could not reach the service. Check your connection and try again.',
      });
      return null;
    } finally {
      setBusy(false);
      setStage(null);
    }
  }

  return {
    run,
    stop: () => abortRef.current?.abort(),
    busy,
    stage,
    error,
    result,
    setResult,
    clearError: () => setError(null),
  };
}
