/**
 * The text versions of a reply, rendered from the same findings as the page
 * and the image, so the short and long versions cannot disagree.
 */
import type { Report } from '@/lib/analysis/report';
import type { OutputLanguage } from '@/lib/config/languages';
import { replyCopy } from '@/lib/config/reply-copy';
import type { ReplyBlock, ReplyLength } from '@/lib/config/reply-occasions';

import type { Finding } from './findings';

const LINE_LIMIT = 240;

function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), limit - 20)).trimEnd() + '…';
}

export function replyText(input: {
  report: Report;
  findings: Finding[];
  language: OutputLanguage;
  length: ReplyLength;
  blocks: readonly ReplyBlock[];
  note: string | null;
  url: string;
}): string {
  const copy = replyCopy(language(input));
  const note = input.note?.trim();
  const top = input.findings.slice(0, 3);
  if (input.length === 'line') {
    return [note, clip(top[0]?.text ?? input.report.insight.headline, LINE_LIMIT), input.url]
      .filter(Boolean)
      .join('\n');
  }
  const lines = [
    note,
    note ? '' : null,
    copy.readingOf(input.report.title, input.report.byline.publication),
    ...top.map((finding) => '• ' + clip(finding.text, 280)),
  ];
  if (input.blocks.includes('questions') && input.report.questions[0]) {
    lines.push('', copy.questionForAuthor + ' ' + input.report.questions[0]);
  }
  lines.push('', input.url);
  return lines.filter((line) => line !== null && line !== undefined).join('\n');
}

function language(input: { language: OutputLanguage }) {
  return input.language;
}
