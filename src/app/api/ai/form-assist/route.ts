import { complete, freeChain, usableChain } from '@bitbaum/ai-kit';
import { createFormAssistHandler } from '@fleet/ai-forms/server';
import { clientIp, slidingWindow } from 'limitkit';

import { originAllowed } from '@/lib/api/guard';
import { AI_FORMS } from '@/lib/config/ai-forms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// No account needed to research a question; a person talking to a form is
// a few turns, not a pipeline.
const limiter = slidingWindow({ limit: 40, windowMs: 60 * 60_000 });

export const POST = createFormAssistHandler({
  targets: AI_FORMS,
  authorize: (request) => {
    if (!originAllowed(request))
      return { ok: false, status: 403, error: 'Request origin is not allowed.' };
    if (usableChain(freeChain('BIASLENS'), process.env).length === 0)
      return {
        ok: false,
        status: 503,
        error: 'The assistant is not configured on this server yet.',
      };
    if (!limiter.check('form-assist:' + clientIp(request.headers)).allowed)
      return {
        ok: false,
        status: 429,
        error: 'That is a lot of changes for one hour. Try again later.',
      };
    return { ok: true };
  },
  complete: async ({ system, prompt, maxTokens, temperature }) => {
    const response = await complete({
      chain: usableChain(freeChain('BIASLENS'), process.env),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      maxTokens,
      temperature,
      timeoutMs: 30_000,
      reasoning: 'light',
    });
    return response.text;
  },
});
