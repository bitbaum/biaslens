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
  core_claims: [
    {
      claim: 'The reform reduces costs.',
      type: 'causal',
      supported_in_article: true,
      evidence_quality: 'weak',
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
  it('fetches a URL and never reports the analysis as independently verified', async () => {
    const providers = deps();
    const result = await analyzeArticle({ mode: 'url', url: 'https://example.org/a', text: null }, providers);
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
    const result = await analyzeArticle({ mode: 'url', url: 'https://example.org/a', text: null }, providers);
    expect(result.origin.truncated).toBe(true);
    expect(result.origin.modelChars).toBe(18_000);
  });

  it('rejects hallucinated or malformed result shapes at the boundary', async () => {
    const providers = deps();
    providers.complete = vi.fn(async () => ({ text: JSON.stringify({ title: 'Only a title' }), modelId: null }));
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
});
