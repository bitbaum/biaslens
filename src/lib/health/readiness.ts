import { freeChain, usableChain } from '@bitbaum/ai-kit';

import { buildBrand } from '@/lib/config/brand';

type RuntimeEnv = Record<string, string | undefined>;

/**
 * Readiness is not a substitute for a real provider smoke test. A configured
 * key means the backend MAY be able to analyse; reachability is only proved
 * by making a live analysis request. Never return token values or full env.
 */
export function assessBetaReadiness(env: RuntimeEnv) {
  const identity = buildBrand(env);
  const providers = usableChain(freeChain('BIASLENS'), env);
  const aiConfigured = providers.length > 0;
  const publicOriginSet = identity.siteOrigin !== null;

  return {
    service: 'analysis-beta',
    stage: 'beta' as const,
    status: aiConfigured && publicOriginSet ? ('configured' as const) : ('needs-setup' as const),
    checks: {
      http: 'responding' as const,
      ai: aiConfigured ? ('credentials-present' as const) : ('credentials-missing' as const),
      aiProviderVerified: false as const,
      publicUrl: publicOriginSet ? ('configured' as const) : ('not-configured' as const),
    },
    note: aiConfigured
      ? 'An AI provider key is configured. A real article analysis is still required to verify model availability.'
      : 'The public pages work, but analysis requires a server-side Groq or OpenRouter API key.',
  };
}
