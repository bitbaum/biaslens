import { AccountScreen } from '@/app/account/AccountScreen';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AccountScreen mode="sign-in" next={(await searchParams).next} />;
}
