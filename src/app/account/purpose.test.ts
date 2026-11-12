import { describe, expect, it } from 'vitest';

import { authPurpose } from './purpose';

describe('authPurpose', () => {
  it('speaks about publishing when the writer came from the composer', () => {
    expect(authPurpose('/write').signIn).toMatch(/^Sign in to publish your piece/);
    expect(authPurpose('/write?topic=judge').signIn).toMatch(/^Sign in to publish your piece/);
    expect(authPurpose('/articles/abc123/edit').signIn).toMatch(/publish your piece/);
    expect(authPurpose('/write').signUp).toMatch(/draft stays in this browser/);
  });

  it('never tells a writer they are here to manage a profile', () => {
    for (const next of ['/write', '/desk', '/articles/abc123', '/workspace', '/'])
      expect(authPurpose(next).signIn).not.toMatch(/profile/);
  });

  it('keeps profile and security for the account page', () => {
    expect(authPurpose('/account').signIn).toBe('Sign in to manage your profile and security.');
  });

  it('names the conversation when the reader came from an article', () => {
    expect(authPurpose('/articles/abc123').signIn).toMatch(/conversation/);
  });
});
