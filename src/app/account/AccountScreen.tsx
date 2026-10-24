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
  const next = returnPath(requested, '/analyze');
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
              ? 'Your account'
              : mode === 'sign-up'
                ? 'Keep asking better questions.'
                : 'Welcome back.'}
          </h1>
          <p>Use a display name. Your research stays yours.</p>
        </header>
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
