import { describe, expect, it } from 'vitest';

import { assessBetaReadiness } from './readiness';

describe('public beta readiness without secret leakage', () => {
  it('describes public pages as responding even when analysis is unconfigured', () => {
    const report = assessBetaReadiness({});
    expect(report.status).toBe('needs-setup');
    expect(report.checks.http).toBe('responding');
    expect(report.checks.ai).toBe('credentials-missing');
    expect(report.checks.aiProviderVerified).toBe(false);
  });

  it('never prints the key value or claims the external provider was tested', () => {
    const secret = 'test-groq-key-do-not-print';
    const report = assessBetaReadiness({
      GROQ_API_KEY: secret,
      NEXT_PUBLIC_SITE_URL: 'https://example.org',
    });
    expect(report.status).toBe('configured');
    expect(report.checks.ai).toBe('credentials-present');
    expect(report.checks.aiProviderVerified).toBe(false);
    expect(JSON.stringify(report)).not.toContain(secret);
  });
});
