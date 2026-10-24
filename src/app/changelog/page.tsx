import { DevelopmentRecords } from '@/app/_components/DevelopmentRecords';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Changelog' };
export default function Page() {
  return <DevelopmentRecords section="changelog" />;
}
