'use client';
import Link from 'next/link';
import { SignInForm, SignUpForm, AccountPanel } from '@bitbaum/accountkit/auth/react';
import type { SignInMethods } from '@bitbaum/accountkit/auth';
import type { AuthSession } from '@bitbaum/accountkit/auth/next';
import { authClient } from '@/lib/auth-client';

export function AccountForms({
  mode,
  methods,
  next,
  user,
  linked = [],
}: {
  mode: 'sign-in' | 'sign-up' | 'account';
  methods: SignInMethods;
  next: string;
  user?: AuthSession['user'];
  linked?: string[];
}) {
  if (mode === 'account' && user)
    return (
      <AccountPanel
        client={authClient}
        methods={methods}
        user={{ ...user, role: user.role || 'member', twoFactorEnabled: !!user.twoFactorEnabled }}
        linked={linked}
        accountPath="/account"
        homePath="/workspace"
      />
    );
  if (mode === 'sign-up')
    return (
      <SignUpForm
        client={authClient}
        methods={methods}
        next={next}
        signUpPath="/sign-up"
        signInLink={<Link href={'/sign-in?next=' + encodeURIComponent(next)}>Sign in</Link>}
      />
    );
  return (
    <SignInForm
      client={authClient}
      methods={methods}
      next={next}
      signInPath="/sign-in"
      signUpLink={<Link href={'/sign-up?next=' + encodeURIComponent(next)}>Create an account</Link>}
    />
  );
}
