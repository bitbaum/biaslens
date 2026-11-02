import type { ImageApi } from '@bitbaum/ai-kit/images';

/**
 * Server configuration for AI images. Off unless the server names an API and
 * a model; the key is the fleet's shared one for that vendor (see
 * docs/HANDOFF.md). No model is named in the repository.
 */
export interface ImageGenConfig {
  api: ImageApi;
  model: string;
  apiKey: string;
}

const KEY_FOR: Record<ImageApi, string> = {
  gemini: 'GEMINI_API_KEY',
  'openrouter-chat': 'OPENROUTER_API_KEY',
  images: 'IMAGE_GEN_API_KEY',
};

export function imageGenConfig(
  env: Record<string, string | undefined> = process.env,
): ImageGenConfig | null {
  const api = env.IMAGE_GEN_API as ImageApi | undefined;
  const model = env.IMAGE_GEN_MODEL?.trim();
  if (!api || !(api in KEY_FOR) || !model) return null;
  const apiKey = env[KEY_FOR[api]]?.trim();
  return apiKey ? { api, model, apiKey } : null;
}

/** The prompt sent to the image model: an editorial illustration, never a fake photo of real people or events. */
export function illustrationPrompt(subject: string): string {
  return [
    'Editorial illustration for a news explainer. Flat, clearly illustrated style, not photorealistic.',
    'No text, no logos, no recognisable real people, no depiction presented as a real event.',
    'Subject: ' + subject.replace(/\s+/g, ' ').trim().slice(0, 400),
  ].join(' ');
}
