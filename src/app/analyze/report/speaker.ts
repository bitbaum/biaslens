import { AUTHOR, type Report } from '@/lib/analysis/report';
import type { ReportCopy } from '@/lib/config/report-copy';

/** "The author" or "Peter Beispiel (quoted)": who a claim belongs to. */
export function speakerName(speaker: string, report: Report, copy: ReportCopy): string {
  if (speaker === AUTHOR) {
    return report.byline.authors.length ? report.byline.authors.join(', ') : copy.author;
  }
  const voice = report.voices.find((item) => item.id === speaker);
  return voice ? `${voice.name} (${copy.quoted})` : copy.author;
}
