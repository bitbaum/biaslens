import { DevelopmentRecords } from '@/app/_components/DevelopmentRecords';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Roadmap' };
export default function Page() {
  return <DevelopmentRecords section="roadmap" />;
}
