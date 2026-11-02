import { zurichTime } from '@/lib/format-time';
import { GAP_ACTIONS, isGapAction } from '@/lib/domain/gaps';
import type { Investigation } from '@/lib/domain/investigation';

import { DatasetChart } from './EvidenceCharts';
import styles from './investigation.module.css';

function Cited({ text }: { text: string }) {
  const parts = text.split(/(\[E\d{1,2}\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[E\d{1,2}\]$/.test(part) ? (
          <a key={i} className={styles.cite} href={'#' + part.slice(1, -1)}>
            {part.slice(1, -1)}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Every version, newest first: the text, what changed, what drove it and how it was made. */
export function VersionHistory({ investigation }: { investigation: Investigation }) {
  const drafts = [...(investigation.drafts ?? [])].reverse();
  if (!drafts.length) return null;
  return (
    <section className={styles.section} id="versions" aria-labelledby="versions-heading">
      <p className={styles.eyebrow}>
        Your article · {drafts.length} version{drafts.length === 1 ? '' : 's'}
      </p>
      <h2 id="versions-heading">The article, rewritten step by step</h2>
      <p className={styles.callout}>
        Written by AI from the article&apos;s claims and the linked sources only. Every sentence
        that uses a source carries its key; the sources are listed under each version.
      </p>
      {drafts.map((draft, index) => {
        const dataset = draft.datasetId
          ? investigation.datasets?.find((d) => d.id === draft.datasetId)
          : null;
        return (
          <details key={draft.version} className={styles.version} open={index === 0}>
            <summary>
              <strong>v{draft.version}</strong> ·{' '}
              {isGapAction(draft.action) ? GAP_ACTIONS[draft.action].label : draft.action} ·{' '}
              {zurichTime(draft.createdAt)}
            </summary>
            <article className={styles.reading}>
              <h3>{draft.title}</h3>
              {draft.text
                .split(/\n+/)
                .filter((p, i) => !(i === 0 && p.trim() === draft.title.trim()))
                .map((p, i) => {
                  const heading = p.match(/^(?:##\s+|\*\*)(.+?)(?:\*\*)?$/);
                  return heading && heading[1]!.length < 90 ? (
                    <h4 key={i}>{heading[1]}</h4>
                  ) : (
                    <p key={i}>
                      <Cited text={p.replace(/\*\*(.+?)\*\*/g, '$1')} />
                    </p>
                  );
                })}
              {dataset && <DatasetChart dataset={dataset} />}
            </article>
            {draft.flags && (
              <div className={draft.flags.length ? styles.flagBox : styles.meta}>
                <strong>Citation check:</strong>{' '}
                {draft.flags.length
                  ? `${draft.flags.length} sentence${draft.flags.length === 1 ? '' : 's'} may say more than the cited source.`
                  : 'every cited sentence matched its source.'}
                {draft.flags.length > 0 && (
                  <ul className={styles.list}>
                    {draft.flags.map((f) => (
                      <li key={f.sentence}>
                        “{f.sentence}” — {f.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {draft.changeNote && (
              <p className={styles.meta}>
                <strong>AI change note:</strong> {draft.changeNote}
              </p>
            )}
            <div className={styles.diffGrid}>
              <div>
                <h4>Added ({draft.added.length})</h4>
                <ul className={styles.added}>
                  {draft.added.map((s) => (
                    <li key={s}>
                      <Cited text={s} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Removed ({draft.removed.length})</h4>
                <ul className={styles.removed}>
                  {draft.removed.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h4>Sources that drove this version</h4>
            <ul className={styles.list}>
              {draft.citations.length ? (
                draft.citations.map((c) => (
                  <li key={c} id={c.match(/^\[(E\d+)\]/)?.[1]}>
                    {c}
                  </li>
                ))
              ) : (
                <li>None cited.</li>
              )}
            </ul>
            <p className={styles.meta}>
              Method: {draft.promptVersion}
              {draft.modelId ? ' · model run ' + draft.modelId.slice(0, 24) : ''} · from gap “
              {draft.gapId}”
            </p>
          </details>
        );
      })}
    </section>
  );
}
