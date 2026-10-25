import { AccountScreen } from '@/app/account/AccountScreen';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; token?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <AccountScreen
      mode="sign-in"
      next={query.next}
      recovering={Boolean(query.token) || query.error === 'INVALID_TOKEN'}
    />
  );
}
