import Link from 'next/link';

import { zurichTime } from '@/lib/format-time';
import { loadFeatured } from '@/lib/investigations/featured';

import styles from './index.module.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Investigations',
  description: 'Questions taken apart claim by claim, with evidence from every side.',
};

export default async function InvestigationsIndex() {
  const featured = await loadFeatured();
  return (
    <main id="main-content" className={`bb-frame ${styles.page}`}>
      <p className={styles.kicker}>Investigate</p>
      <h1>Investigations</h1>
      <p className={styles.dek}>
        Each one links an article’s claims to specific findings from several sides, then rewrites
        the article one step at a time, with every change and source in view.
      </p>
      <div className={styles.actions}>
        <Link className="bb-button bb-button--primary" href="/investigations/demo">
          Start from the housing demo
        </Link>
        <Link className="bb-button bb-button--secondary" href="/analyze">
          Examine your own article
        </Link>
        <Link className="bb-button bb-button--secondary" href="/desk">
          My desk
        </Link>
      </div>
      <ul className={styles.grid}>
        {featured.map((f) => {
          const inv = f.investigation;
          const latest = inv.drafts?.at(-1);
          const image = inv.images?.[0];
          return (
            <li key={f.id} className={styles.card}>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element -- remote, credited source image
                <img src={image.src} alt={image.alt} />
              )}
              <div className={styles.body}>
                <p className={styles.kicker}>
                  {f.id === 'demo' ? 'Demo · start here' : 'Featured'}
                </p>
                <h2>
                  <Link href={f.href}>{inv.question}</Link>
                </h2>
                <p className={styles.meta}>
                  {inv.claims.length} claims · {inv.studies.length} sources · {inv.links.length}{' '}
                  findings linked
                  {latest ? ` · v${latest.version}, ${zurichTime(latest.createdAt)}` : ''}
                </p>
                {image && (
                  <p className={styles.credit}>
                    {image.kind === 'ai' ? 'AI-generated image' : 'Photo: ' + image.credit} ·{' '}
                    {image.license}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
