import type { ReportResult } from '@/lib/analysis/run';
import { reportCopy } from '@/lib/config/report-copy';
import { replyCopy } from '@/lib/config/reply-copy';

import type { CardContent } from './card';
import { rankFindings } from './findings';

/** The card for a report or a reply: the strongest finding and its passage. */
export function cardContent(
  result: ReportResult,
  url: string,
  sender: { name: string | null } | null = null,
): CardContent {
  const { report, language } = result;
  const findings = rankFindings(report, language);
  const top = findings[0];
  const copy = replyCopy(language);
  return {
    kicker: sender ? copy.cardSent(sender.name) : reportCopy(language).genre[report.genre],
    title: report.title,
    source: [report.byline.publication, report.byline.authors.join(', ')]
      .filter(Boolean)
      .join(' · '),
    finding: top?.text ?? report.insight.headline,
    passage: top?.passage?.text ?? null,
    more: findings.slice(1, 3).map((finding) => finding.text),
    note: copy.aiNote,
    url,
  };
}
