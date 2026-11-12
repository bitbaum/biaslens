/**
 * The line under "Sign in" says why this person is signing in, read from
 * where they came from (`next`). Someone sent here by the Publish button is
 * signing in to publish, not to manage a profile.
 */
export interface AuthPurpose {
  signIn: string;
  signUp: string;
}

const SIGN_UP = 'An email and a password — that’s all.';
const DRAFT_KEPT =
  'Your draft stays in this browser while you do, and is waiting when you come back.';

export function authPurpose(next: string): AuthPurpose {
  const path = next.split(/[?#]/)[0] ?? '';
  if (path === '/write' || /^\/articles\/[^/]+\/edit$/.test(path))
    return {
      signIn: `Sign in to publish your piece or save it as a draft on your account. ${DRAFT_KEPT}`,
      signUp: `${SIGN_UP} Then publish your piece or save it as a draft. ${DRAFT_KEPT}`,
    };
  if (/^\/articles\/[^/]+$/.test(path))
    return {
      signIn: 'Sign in to join the conversation on this article.',
      signUp: `${SIGN_UP} Then join the conversation on this article.`,
    };
  if (path === '/desk')
    return {
      signIn: 'Sign in to see the articles and drafts on your account.',
      signUp: SIGN_UP,
    };
  if (path === '/account' || path === '/settings')
    return { signIn: 'Sign in to manage your profile and security.', signUp: SIGN_UP };
  return {
    signIn: 'Sign in to publish what you write and keep your drafts on your account.',
    signUp: SIGN_UP,
  };
}
