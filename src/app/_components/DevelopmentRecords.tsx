import { loadDevelopmentProfile } from 'bip-kit';
import { DevelopmentPage } from 'bip-kit/react';
import { PROJECT_LINKS } from '@/lib/config/routes';

export async function DevelopmentRecords({ section }: { section: 'roadmap' | 'changelog' }) {
  const profile = await loadDevelopmentProfile(
    'https://loki.orangecat.ch/api/fleet/map',
    'biaslens',
  );
  return (
    <>
      <main id="main-content" className="journalTheme">
        <DevelopmentPage profile={profile} section={section} profileHref={PROJECT_LINKS.profile} />
      </main>
    </>
  );
}
