import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { signInMethods } from '@bitbaum/accountkit/auth';
import { returnPath } from '@bitbaum/accountkit/orangecat';
import { account } from '@bitbaum/accountkit/auth/schema';
import { authStatus, getSession, mailConfigured } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { AccountForms } from './AccountForms';
import './account.css';

export async function AccountScreen({
  mode,
  next: requested,
}: {
  mode: 'sign-in' | 'sign-up' | 'account';
  next?: string;
}) {
  const safeNext = returnPath(requested, '/workspace');
  const next = /^\/(?:sign-in|sign-up)(?:[/?#]|$)/.test(safeNext) ? '/workspace' : safeNext;
  const status = authStatus();
  const session = await getSession();
  if (session && mode !== 'account') redirect(next);
  if (!session && mode === 'account' && status.ready) redirect('/sign-in?next=/account');
  const linked = session
    ? (
        await db
          .select({ provider: account.providerId })
          .from(account)
          .where(eq(account.userId, session.user.id))
      ).map((row) => row.provider)
    : [];
  return (
    <>
      <main id="main-content" className="bb-frame account-screen">
        <header>
          <p>YOUR BIASLENS ACCOUNT</p>
          <h1>
            {mode === 'account'
              ? 'Profile & security'
              : mode === 'sign-up'
                ? 'Keep asking better questions.'
                : 'Welcome back.'}
          </h1>
          <p>Choose a display name. Manage your identity and sign-in methods.</p>
        </header>
        <p className="account-storage-note">
          Article examination and investigations work without an account. Your current notebook is
          saved in this browser, not synced to your account. Export a copy before changing devices.
        </p>
        <div className="account-card">
          {status.ready ? (
            <AccountForms
              mode={mode}
              methods={signInMethods(process.env, mailConfigured())}
              next={next}
              user={session?.user}
              linked={linked}
            />
          ) : (
            <div role="status">
              <h2>Accounts are being configured</h2>
              <p>You can examine articles without signing in.</p>
              <Link className="bb-button bb-button--secondary" href="/analyze">
                Examine an article →
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
