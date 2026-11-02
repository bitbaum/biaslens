import { describe, expect, it } from 'vitest';

import { illustrationPrompt, imageGenConfig } from './ai-image';

describe('imageGenConfig', () => {
  it('is off unless api, model and that vendor key are all present', () => {
    expect(imageGenConfig({})).toBeNull();
    expect(imageGenConfig({ IMAGE_GEN_API: 'gemini', IMAGE_GEN_MODEL: 'm' })).toBeNull();
    expect(
      imageGenConfig({ IMAGE_GEN_API: 'nope', IMAGE_GEN_MODEL: 'm', GEMINI_API_KEY: 'k' }),
    ).toBeNull();
    expect(
      imageGenConfig({ IMAGE_GEN_API: 'gemini', IMAGE_GEN_MODEL: 'm', GEMINI_API_KEY: 'k' }),
    ).toEqual({ api: 'gemini', model: 'm', apiKey: 'k' });
  });
  it('asks for an illustration, not a fake photo', () => {
    expect(illustrationPrompt('rents  in Athens')).toMatch(
      /not photorealistic.*Subject: rents in Athens/,
    );
  });
});
