import type { Investigation } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

const ROW = 44;
const W = 960;

const short = (text: string, n: number) => (text.length > n ? text.slice(0, n - 1) + '…' : text);

/**
 * Claims in the middle, sources on either side, one line per linked finding.
 * Lines draw themselves in; colour is the stance. No line is a verdict.
 */
export function EpistemicMap({ investigation }: { investigation: Investigation }) {
  const { claims, studies, links } = investigation;
  const leaning = (studyId: string) => {
    const own = links.filter((l) => l.studyId === studyId);
    return own.filter((l) => l.stance === 'contradicts').length >
      own.filter((l) => l.stance === 'supports').length
      ? 'right'
      : 'left';
  };
  const linked = studies.filter((s) => links.some((l) => l.studyId === s.id));
  const left = linked.filter((s) => leaning(s.id) === 'left');
  const right = linked.filter((s) => leaning(s.id) === 'right');
  const rows = Math.max(left.length, right.length, claims.length * 2);
  const height = rows * ROW + 40;
  const claimY = (i: number) => 20 + ((i + 0.5) * (height - 40)) / claims.length;
  const sideY = (i: number, n: number) => 20 + ((i + 0.5) * (height - 40)) / Math.max(n, 1);
  const pos = new Map<string, { x: number; y: number }>();
  left.forEach((s, i) => pos.set(s.id, { x: 250, y: sideY(i, left.length) }));
  right.forEach((s, i) => pos.set(s.id, { x: W - 250, y: sideY(i, right.length) }));
  const claimPos = new Map(claims.map((c, i) => [c.id, { x: W / 2, y: claimY(i) }]));

  return (
    <section className={styles.section} aria-labelledby="map-heading">
      <p className={styles.eyebrow}>Epistemic map</p>
      <h2 id="map-heading">Who says what about which claim</h2>
      <p className={styles.meta}>
        Each line is one finding linked to one claim:{' '}
        <span className={styles.keySupports}>supports</span>,{' '}
        <span className={styles.keyContradicts}>contradicts</span> or{' '}
        <span className={styles.keyContext}>context</span>. Lines are candidate links until
        reviewed; their number is not a score.
      </p>
      <div className={styles.mapScroll}>
        <svg
          className={styles.map}
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          aria-label={`${claims.length} claims linked to ${linked.length} sources by ${links.length} findings`}
        >
          {links.map((link, i) => {
            const a = pos.get(link.studyId);
            const b = claimPos.get(link.claimId);
            if (!a || !b) return null;
            const bx = a.x < b.x ? b.x - 110 : b.x + 110;
            const mid = (a.x + bx) / 2;
            return (
              <path
                key={link.id}
                d={`M${a.x} ${a.y} C${mid} ${a.y}, ${mid} ${b.y}, ${bx} ${b.y}`}
                className={`${styles.edge} ${styles['edge_' + link.stance]}`}
                style={{ animationDelay: `${i * 60}ms` }}
                pathLength={1}
              >
                <title>{link.rationale}</title>
              </path>
            );
          })}
          {claims.map((claim) => {
            const p = claimPos.get(claim.id)!;
            return (
              <g key={claim.id} className={styles.node}>
                <rect
                  x={p.x - 110}
                  y={p.y - 18}
                  width={220}
                  height={36}
                  rx={18}
                  className={styles.claimNode}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle">
                  {short(claim.text, 34)}
                </text>
                <title>{claim.text}</title>
              </g>
            );
          })}
          {linked.map((study) => {
            const p = pos.get(study.id)!;
            const isLeft = p.x < W / 2;
            return (
              <g key={study.id} className={styles.node}>
                <circle cx={p.x} cy={p.y} r={6} className={styles.studyNode} />
                <text
                  x={isLeft ? p.x - 12 : p.x + 12}
                  y={p.y + 4}
                  textAnchor={isLeft ? 'end' : 'start'}
                >
                  {short(`${study.authors.split(/[,&]/)[0]!.trim()} ${study.year ?? ''}`, 30)}
                </text>
                <title>{study.title}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
