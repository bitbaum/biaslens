'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AccountMenu } from '@bitbaum/accountkit';
import { authClient } from '@/lib/auth-client';

export function AccountControl() {
  const { data: session } = authClient.useSession();
  const path = usePathname();
  const router = useRouter();
  if (!session)
    return (
      <Link
        href={
          '/sign-in?next=' +
          encodeURIComponent(
            ['/sign-in', '/sign-up', '/account'].includes(path) ? '/workspace' : path,
          )
        }
      >
        Sign in
      </Link>
    );
  return (
    <AccountMenu
      user={session.user}
      groups={[
        {
          id: 'account',
          items: [
            { id: 'settings', label: 'Profile & security', href: '/account' },
            { id: 'research', label: 'Your notebook', href: '/explore' },
          ],
        },
      ]}
      renderLink={(props) => <Link {...props} />}
      onSignOut={async () => {
        const result = await authClient.signOut();
        if (result.error) throw new Error('Sign-out could not be completed');
        router.replace('/workspace');
        router.refresh();
      }}
    />
  );
}
