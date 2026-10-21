import { describe, expect, it } from 'vitest';

import {
  buildFirstPrinciplesUserPrompt,
  parseFirstPrinciplesAnalysis,
  type FirstPrinciplesAnalysis,
} from './first-principles';

const sample: FirstPrinciplesAnalysis = {
  title: 'A policy proposal',
  author: null,
  publication: 'Example publication',
  publication_date: null,
  language: 'en',
  summary: 'The author argues for a proposed policy.',
  core_claims: [
    {
      claim: 'The policy will reduce costs.',
      type: 'causal',
      supported_in_article: true,
      evidence_quality: 'moderate',
    },
  ],
  first_principles_critique: 'The proposed causal mechanism needs an independent test.',
  named_sources: [{ name: 'Researcher', role: 'quoted expert', attributed_claim: 'Costs fell.' }],
  biases_to_consider: 'The article may emphasise one set of consequences.',
  what_would_change_assessment: 'A controlled comparison could change the assessment.',
};

describe('parseFirstPrinciplesAnalysis', () => {
  it('accepts Truth Seeker v0.1 structured JSON without converting it into a truth verdict', () => {
    expect(parseFirstPrinciplesAnalysis(sample)).toEqual({ success: true, data: sample });
  });

  it('rejects a claim of unknown kind rather than silently misrendering it', () => {
    const response = parseFirstPrinciplesAnalysis({
      ...sample,
      core_claims: [{ ...sample.core_claims[0], type: 'opinionated' }],
    });
    expect(response.success).toBe(false);
    if (!response.success) expect(response.error).toContain('core_claims[0].type');
  });

  it('rejects missing arrays and malformed named source attribution', () => {
    expect(parseFirstPrinciplesAnalysis({ ...sample, core_claims: null }).success).toBe(false);
    const response = parseFirstPrinciplesAnalysis({
      ...sample,
      named_sources: [{ name: 'Someone', role: 'expert' }],
    });
    expect(response.success).toBe(false);
    if (!response.success) expect(response.error).toContain('named_sources[0].attributed_claim');
  });

  it('accepts explicit unknown metadata and empty lists', () => {
    expect(
      parseFirstPrinciplesAnalysis({ ...sample, core_claims: [], named_sources: [] }).success,
    ).toBe(true);
  });

  it('does not silently accept claims supported by undefined or string-typed booleans', () => {
    const response = parseFirstPrinciplesAnalysis({
      ...sample,
      core_claims: [{ ...sample.core_claims[0], supported_in_article: 'true' }],
    });
    expect(response.success).toBe(false);
  });
});

describe('buildFirstPrinciplesUserPrompt', () => {
  it('retains source attribution and complete text for the model adapter', () => {
    const prompt = buildFirstPrinciplesUserPrompt({
      url: 'https://example.org/story',
      title: 'An interesting report',
      text: 'Quoted text and article body',
    });
    expect(prompt).toContain('https://example.org/story');
    expect(prompt).toContain('An interesting report');
    expect(prompt).toContain('Quoted text and article body');
  });
});
