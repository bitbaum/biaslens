import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { analyzeArticle, AnalysisFailure, type AnalysisDeps } from './run';

const articleText = 'A factual news report describes a proposed government reform. '.repeat(6);
const response = JSON.stringify({
  title: 'Proposed reforms',
  author: null,
  publication: 'Example publication',
  publication_date: null,
  language: 'en',
  summary: 'A proposal is under discussion.',
  insight: {
    headline: 'A proposal is not an outcome.',
    explanation: 'Predictions need a comparison.',
    assumption: 'Other conditions stay the same.',
    test: 'Compare matched cases.',
  },
  core_claims: [
    {
      claim: 'The reform reduces costs.',
      type: 'causal',
      supported_in_article: true,
      evidence_quality: 'weak',
      source_quote: null,
    },
  ],
  first_principles_critique: 'There are missing controls.',
  named_sources: [],
  biases_to_consider: 'Framing may favor one actor.',
  what_would_change_assessment: 'An independently reviewed experiment.',
});

function deps(): AnalysisDeps {
  return {
    readPage: vi.fn(async (url: string) => ({
      ok: true,
      url,
      title: 'Proposed reforms',
      text: articleText,
    })),
    complete: vi.fn(async () => ({ text: response, modelId: 'mock/test' })),
  };
}

describe('analyzeArticle', () => {
  it('repairs an older-shaped report once rather than silently omitting the insight', async () => {
    const old = JSON.parse(response);
    delete old.insight;
    const providers = deps();
    providers.complete = vi
      .fn()
      .mockResolvedValueOnce({ text: JSON.stringify(old), modelId: 'first' })
      .mockResolvedValueOnce({ text: response, modelId: 'repaired' });
    const result = await analyzeArticle({ mode: 'text', url: null, text: articleText }, providers);
    expect(result.analysis.insight).toBeDefined();
    expect(result.modelId).toBe('repaired');
    expect(result.run.repairAttempts).toBe(1);
    expect(providers.complete).toHaveBeenCalledTimes(2);
  });

  it('stops after one unsuccessful repair and does not present a degraded report', async () => {
    const old = JSON.parse(response);
    delete old.insight;
    const providers = deps();
    providers.complete = vi.fn(async () => ({ text: JSON.stringify(old), modelId: 'incomplete' }));
    await expect(
      analyzeArticle({ mode: 'text', url: null, text: articleText }, providers),
    ).rejects.toMatchObject({ code: 'MODEL_INVALID' });
    expect(providers.complete).toHaveBeenCalledTimes(2);
  });

  it('retains only verbatim quotes found in the exact analysed source', async () => {
    const data = JSON.parse(response);
    data.core_claims[0].source_quote = 'A factual news report';
    const providers = deps();
    providers.complete = vi.fn(async () => ({ text: JSON.stringify(data), modelId: 'mock' }));
    const valid = await analyzeArticle({ mode: 'text', url: null, text: articleText }, providers);
    expect(valid.analysis.core_claims[0].source_quote).toBe('A factual news report');
    expect(valid.sourceText).toBe(articleText);
    data.core_claims[0].source_quote = 'An invented quote that sounds plausible';
    const invented = await analyzeArticle(
      { mode: 'text', url: null, text: articleText },
      providers,
    );
    expect(invented.analysis.core_claims[0].source_quote).toBeNull();
  });

  it('fetches a URL and never reports the analysis as independently verified', async () => {
    const providers = deps();
    const result = await analyzeArticle(
      { mode: 'url', url: 'https://example.org/a', text: null },
      providers,
    );
    expect(result.analysis.core_claims).toHaveLength(1);
    expect(result.independentlyVerified).toBe(false);
    expect(result.origin).toMatchObject({
      kind: 'retrieved-page',
      attribution: 'retrieved',
      url: 'https://example.org/a',
    });
    expect(providers.readPage).toHaveBeenCalledOnce();
    expect(providers.complete).toHaveBeenCalledOnce();
  });

  it('never fetches pasted text and marks a provided URL as unverified attribution', async () => {
    const providers = deps();
    const result = await analyzeArticle(
      { mode: 'text', url: 'https://example.org/claimed', text: articleText },
      providers,
    );
    expect(providers.readPage).not.toHaveBeenCalled();
    expect(result.origin.attribution).toBe('user-asserted');
    expect(result.origin.kind).toBe('user-pasted-text');
  });

  it('accepts pasted text without inventing a source URL', async () => {
    const result = await analyzeArticle({ mode: 'text', url: null, text: articleText }, deps());
    expect(result.origin.url).toBeNull();
    expect(result.origin.attribution).toBe('not-provided');
  });

  it.each([
    ['en', 'English'],
    ['de', 'German'],
    ['fr', 'French'],
  ] as const)('requests reader-facing analysis in %s', async (outputLanguage, expected) => {
    const providers = deps();
    const input = { mode: 'text' as const, url: null, text: articleText, outputLanguage };
    await analyzeArticle(input, providers);
    const complete = vi.mocked(providers.complete);
    expect(complete).toHaveBeenCalledOnce();
    expect(complete.mock.calls[0][0][1].content).toContain(
      `Write every reader-facing value in ${expected}`,
    );
  });

  it('surfaces fetch failure with a paste fallback instead of calling a model', async () => {
    const providers = deps();
    providers.readPage = vi.fn(async () => ({
      ok: false,
      url: 'https://example.org/a',
      failure: { reason: 'The site refused the request (403).' },
    }));
    await expect(
      analyzeArticle({ mode: 'url', url: 'https://example.org/a', text: null }, providers),
    ).rejects.toMatchObject({ code: 'SOURCE_UNAVAILABLE', status: 422 });
    expect(providers.complete).not.toHaveBeenCalled();
  });

  it('reports both model-side and fetch-side truncation', async () => {
    const providers = deps();
    providers.readPage = vi.fn(async (url: string) => ({
      ok: true,
      url,
      text: 'e'.repeat(22_000),
      truncated: false,
    }));
    const result = await analyzeArticle(
      { mode: 'url', url: 'https://example.org/a', text: null },
      providers,
    );
    expect(result.origin.truncated).toBe(true);
    expect(result.origin.modelChars).toBe(18_000);
  });

  it('rejects hallucinated or malformed result shapes at the boundary', async () => {
    const providers = deps();
    providers.complete = vi.fn(async () => ({
      text: JSON.stringify({ title: 'Only a title' }),
      modelId: null,
    }));
    await expect(
      analyzeArticle({ mode: 'text', url: null, text: articleText }, providers),
    ).rejects.toBeInstanceOf(AnalysisFailure);
  });

  it('rejects bot-gated pages returning almost no readable content', async () => {
    const providers = deps();
    providers.readPage = vi.fn(async (url: string) => ({
      ok: true,
      url,
      title: 'Please sign in',
      text: 'Sign in to read.',
    }));
    await expect(
      analyzeArticle({ mode: 'url', url: 'https://example.org/a', text: null }, providers),
    ).rejects.toMatchObject({ code: 'SOURCE_TOO_SHORT' });
    expect(providers.complete).not.toHaveBeenCalled();
  });

  it('records the exact analysed-text digest and version, without claiming authenticity', async () => {
    const result = await analyzeArticle(
      { mode: 'text', url: 'https://example.org/claimed', text: articleText },
      deps(),
    );
    const expected = createHash('sha256').update(articleText, 'utf8').digest('hex');
    expect(result.origin.textSha256).toBe(expected);
    expect(result.origin.textSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.origin.attribution).toBe('user-asserted');
    expect(result.run.methodVersion).toBe('0.1.0');
    expect(result.run.promptVersion).toBe('first-principles@3');
    expect(Number.isNaN(Date.parse(result.run.generatedAt))).toBe(false);
    expect(result.independentlyVerified).toBe(false);
  });

  it('hashes the clipped content that the model received rather than unseen text', async () => {
    const providers = deps();
    providers.readPage = vi.fn(async (url: string) => ({
      ok: true,
      url,
      text: 'X'.repeat(22_000),
      truncated: true,
    }));
    const result = await analyzeArticle(
      { mode: 'url', url: 'https://example.org/long', text: null },
      providers,
    );
    const expected = createHash('sha256').update('X'.repeat(18_000), 'utf8').digest('hex');
    expect(result.origin.textSha256).toBe(expected);
    expect(result.origin.truncated).toBe(true);
  });
});
