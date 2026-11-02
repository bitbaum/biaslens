import { BarChart, LineChart, ShareBars } from '@bitbaum/chartkit/react';

import {
  PERSPECTIVE_LABEL,
  PERSPECTIVES,
  type Dataset,
  type Investigation,
} from '@/lib/domain/investigation';

import styles from './investigation.module.css';

/** One published table drawn as a chart, with its source under it. */
export function DatasetChart({ dataset }: { dataset: Dataset }) {
  const caption = `${dataset.title}. Source: ${dataset.sourceTitle}.`;
  return (
    <figure className={styles.chart}>
      {dataset.kind === 'series' ? (
        <LineChart
          series={[
            {
              id: dataset.id,
              label: dataset.title,
              points: dataset.rows.map((r) => ({ x: r.label, y: r.value })),
            },
          ]}
          unit={dataset.unit}
          caption={caption}
          yFrom="zero"
          area
        />
      ) : (
        <BarChart
          rows={dataset.rows.map((r) => ({ label: r.label, value: r.value }))}
          unit={dataset.unit}
          caption={caption}
          highlight={dataset.highlight}
        />
      )}
      <figcaption className={styles.meta}>
        Source:{' '}
        <a href={dataset.sourceUrl} rel="noopener noreferrer" target="_blank">
          {dataset.sourceTitle}
        </a>
      </figcaption>
    </figure>
  );
}

/** Which sides the linked sources come from: a balance check, not a verdict. */
export function SourceBalance({ investigation }: { investigation: Investigation }) {
  const total = investigation.studies.length || 1;
  const rows = PERSPECTIVES.map((p) => ({
    label: PERSPECTIVE_LABEL[p],
    share: investigation.studies.filter((s) => s.perspective === p).length / total,
  })).filter((r) => r.share > 0);
  const tagged = rows.reduce((sum, r) => sum + r.share, 0);
  return (
    <ShareBars
      rows={rows}
      other={Math.max(0, 1 - tagged)}
      otherLabel="Not yet tagged"
      caption={`Where the ${investigation.studies.length} sources come from in the debate.`}
    />
  );
}

export function EvidenceCharts({ investigation }: { investigation: Investigation }) {
  if (!investigation.datasets?.length) return null;
  return (
    <section className={styles.section} aria-labelledby="charts-heading">
      <p className={styles.eyebrow}>The numbers</p>
      <h2 id="charts-heading">What the data shows</h2>
      <div className={styles.charts}>
        {investigation.datasets.map((d) => (
          <DatasetChart key={d.id} dataset={d} />
        ))}
      </div>
    </section>
  );
}
