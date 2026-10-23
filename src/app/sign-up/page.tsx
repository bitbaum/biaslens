import { AccountScreen } from '@/app/account/AccountScreen';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AccountScreen mode="sign-up" next={(await searchParams).next} />;
}
