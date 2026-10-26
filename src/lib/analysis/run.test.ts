import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { analyzeArticle, AnalysisFailure, type AnalysisDeps } from './run';
import { FIXTURE_ARTICLE, FIXTURE_ASSESSMENT, FIXTURE_READING } from './test-fixture';

function deps(overrides: Partial<AnalysisDeps> = {}): AnalysisDeps {
  return {
    readSource: vi.fn(async (url: string) => ({
      ok: true as const,
      url,
      kind: 'html' as const,
      title: 'Seeländer Zeitung',
      text: FIXTURE_ARTICLE,
      truncated: false,
      metadata: {
        authors: ['Anna Muster'],
        publication: 'Seeländer Zeitung',
        date: '2026-10-26',
        headline: null,
      },
    })),
    complete: vi.fn(async (_messages, pass) => ({
      text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : FIXTURE_ASSESSMENT),
      modelId: 'mock/' + pass,
    })),
    ...overrides,
  };
}

const pasted = {
  mode: 'text' as const,
  url: null,
  text: FIXTURE_ARTICLE,
  outputLanguage: 'de-CH' as const,
};

describe('analyzeArticle (report v4)', () => {
  it('never lists the author as a voice and attributes the expert’s explanation to the expert', async () => {
    const { report } = await analyzeArticle(pasted, deps());
    expect(report.voices.map((voice) => voice.name)).toEqual([
      'Peter Beispiel',
      'Hans Probe',
      'Kritiker aus der Verwaltung',
    ]);
    const causal = report.claims.find((claim) => claim.type === 'causal');
    expect(causal?.speaker).toBe('v1');
  });

  it('grounds quotes despite typographic differences and drops invented passages', async () => {
    const { report, sourceText } = await analyzeArticle(pasted, deps());
    const expert = report.voices.find((voice) => voice.id === 'v1')!;
    expect(expert.quotes).toHaveLength(1);
    expect(sourceText.slice(expert.quotes[0]!.start, expert.quotes[0]!.end)).toBe(
      expert.quotes[0]!.text,
    );
    expect(report.claims[2]!.quote).toBeNull();
    expect(report.detections.map((detection) => detection.technique)).toEqual([
      'inconsistent_figures',
      'poll_without_sample',
      'anonymous_source',
    ]);
    expect(report.quality.groundedQuotes).toBeLessThan(report.quality.proposedQuotes);
    expect(report.quality.droppedItems).toBeGreaterThanOrEqual(3);
  });

  it('computes measurements in code', async () => {
    const { report } = await analyzeArticle(pasted, deps());
    expect(report.metrics.stanceCounts.supports).toBe(2);
    expect(report.metrics.stanceCounts.opposes).toBe(1);
    expect(report.metrics.anonymousVoices).toBe(1);
    expect(report.metrics.pollsWithoutSample).toBe(2);
    expect(report.metrics.oneSided).toBeNull();
    expect(report.metrics.quotedShare).toBeGreaterThan(0);
  });

  it('prefers the publisher’s byline metadata and records where it came from', async () => {
    const result = await analyzeArticle(
      { mode: 'url', url: 'https://example.org/a', text: null, outputLanguage: 'en' },
      deps(),
    );
    expect(result.report.byline).toMatchObject({
      authors: ['Anna Muster'],
      date: '2026-10-26',
      source: 'page-metadata',
    });
    expect(result.origin.kind).toBe('retrieved-page');
  });

  it('writes Swiss spelling for de-CH and keeps quotes untouched', async () => {
    const reading = {
      ...FIXTURE_READING,
      summary: 'Der Text schließt aus der Umfrage auf die Ursache. Das ist ein großer Schritt.',
    };
    const { report } = await analyzeArticle(
      pasted,
      deps({
        complete: vi.fn(async (_messages, pass) => ({
          text: JSON.stringify(pass === 'reading' ? reading : FIXTURE_ASSESSMENT),
          modelId: 'mock',
        })),
      }),
    );
    expect(report.summary).toBe(
      'Der Text schliesst aus der Umfrage auf die Ursache. Das ist ein grosser Schritt.',
    );
  });

  it('asks again once when a pass uses a forbidden label, then removes the sentence', async () => {
    const labelled = {
      ...FIXTURE_ASSESSMENT,
      strongest_case: 'Die Zahl ist auffällig. Die Zeitung ist rechtsgerichtet.',
    };
    const complete = vi.fn(async (_messages: unknown, pass: 'reading' | 'assessment') => ({
      text: JSON.stringify(pass === 'reading' ? FIXTURE_READING : labelled),
      modelId: 'mock',
    }));
    const result = await analyzeArticle(pasted, deps({ complete }));
    expect(complete).toHaveBeenCalledTimes(3);
    expect(result.report.strongestCase).toBe('Die Zahl ist auffällig.');
    expect(result.run.passes[1]!.repairAttempts).toBe(1);
  });

  it('repairs a malformed pass once and fails clearly after that', async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce({ text: '{"title": ""}', modelId: 'a' })
      .mockResolvedValueOnce({ text: JSON.stringify(FIXTURE_READING), modelId: 'b' })
      .mockResolvedValue({ text: 'no json here', modelId: 'c' });
    await expect(analyzeArticle(pasted, deps({ complete }))).rejects.toMatchObject({
      code: 'MODEL_INVALID',
    });
    expect(complete).toHaveBeenCalledTimes(4);
  });

  it('accepts a fenced or prose-wrapped JSON answer', async () => {
    const complete = vi.fn(async (_messages: unknown, pass: 'reading' | 'assessment') => ({
      text:
        pass === 'reading'
          ? '```json\n' + JSON.stringify(FIXTURE_READING) + '\n```'
          : 'Here it is: ' + JSON.stringify(FIXTURE_ASSESSMENT),
      modelId: 'mock',
    }));
    const { report } = await analyzeArticle(pasted, deps({ complete }));
    expect(report.insight.headline).toBe('Eine Umfragezahl ist noch keine Erklärung');
  });

  it('reports an unreadable source before spending a model call', async () => {
    const complete = vi.fn();
    const failing = deps({
      complete,
      readSource: vi.fn(async (url: string) => ({
        ok: false as const,
        url,
        reason: 'The site refused automated reading (403).',
      })),
    });
    const error = await analyzeArticle(
      { mode: 'url', url: 'https://example.org/a', text: null },
      failing,
    ).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(AnalysisFailure);
    expect((error as AnalysisFailure).message).toMatch(/Paste the article text instead/);
    expect(complete).not.toHaveBeenCalled();
  });

  it('hashes exactly the text the model saw', async () => {
    const result = await analyzeArticle(pasted, deps());
    expect(result.origin.textSha256).toBe(
      createHash('sha256').update(result.sourceText, 'utf8').digest('hex'),
    );
    expect(result.independentlyVerified).toBe(false);
  });
});
