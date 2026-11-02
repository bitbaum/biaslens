import type { InvestigationImage } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

/** Credited, licensed pictures. AI images carry a visible label. */
export function InvestigationImages({ images }: { images: InvestigationImage[] | undefined }) {
  if (!images?.length) return null;
  return (
    <div className={styles.images}>
      {images.map((image) => (
        <figure key={image.src} className={styles.figure}>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote, credited source image */}
          <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
          {image.kind === 'ai' && <span className={styles.aiBadge}>AI-generated image</span>}
          <figcaption>
            {image.caption}{' '}
            <span className={styles.meta}>
              {image.kind === 'ai' ? 'AI image · ' : 'Photo: '}
              {image.sourceUrl ? <a href={image.sourceUrl}>{image.credit}</a> : image.credit} ·{' '}
              {image.licenseUrl ? <a href={image.licenseUrl}>{image.license}</a> : image.license}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
