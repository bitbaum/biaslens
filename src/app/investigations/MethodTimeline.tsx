import type { Investigation } from '@/lib/domain/investigation';
import { DESIGN_PROFILE } from '@/lib/domain/investigation';

import styles from './investigation.module.css';

/** The investigation's history as steps anyone can audit, oldest first. */
export function MethodTimeline({ investigation }: { investigation: Investigation }) {
  const { article, claims, studies, links, drafts = [] } = investigation;
  const tiers = new Map<string, number>();
  for (const s of studies) {
    const tier = String(DESIGN_PROFILE[s.design]?.tier ?? s.design).replace(/_/g, ' ');
    tiers.set(tier, (tiers.get(tier) ?? 0) + 1);
  }
  const reviewed = links.filter((l) => l.review === 'reviewed').length;
  const steps: { title: string; body: string; when?: string }[] = [
    {
      title: 'Article captured',
      body: `${article.publication ?? 'Source article'} — ${article.title}`,
    },
    {
      title: `${claims.length} claims pulled out`,
      body: 'Each with its scope and what would prove it wrong.',
    },
    {
      title: `${studies.length} sources gathered`,
      body: [...tiers].map(([t, n]) => `${n} ${t}`).join(' · '),
    },
    {
      title: `${links.length} findings linked`,
      body: `${reviewed} reviewed by a person, ${links.length - reviewed} still candidate.`,
    },
    ...drafts.map((d) => ({
      title: `Version ${d.version}: ${d.title}`,
      body: `${d.citations.length} sources cited${d.flags ? ` · citation check: ${d.flags.length} flagged` : ''} · ${d.promptVersion}`,
      when: d.createdAt,
    })),
  ];
  return (
    <section className={styles.section} aria-labelledby="timeline-heading">
      <p className={styles.eyebrow}>Methodology</p>
      <h2 id="timeline-heading">How this investigation was built</h2>
      <ol className={styles.timeline}>
        {steps.map((step, i) => (
          <li key={i} style={{ animationDelay: `${i * 90}ms` }}>
            <strong>{step.title}</strong>
            {step.when && (
              <span className={styles.meta}> · {step.when.slice(0, 16).replace('T', ' ')} UTC</span>
            )}
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
