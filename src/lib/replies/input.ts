import {
  isOccasion,
  isReplyBlock,
  isReplyLength,
  REPLY_BLOCKS,
} from '@/lib/config/reply-occasions';
import { PUBLIC_ID, type ReplyInput } from '@/lib/reports/store';

export const MAX_NAME = 60;
export const MAX_NOTE = 500;

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().replace(/\s+\n/g, '\n');
  if (trimmed.length > max) return undefined;
  return trimmed || null;
}

/** Validate a reply request. Pure, so the boundary is tested without a database. */
export function parseReplyInput(
  value: unknown,
): { ok: true; data: ReplyInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Send a JSON object.' };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.reportId !== 'string' || !PUBLIC_ID.test(raw.reportId)) {
    return { ok: false, error: 'Unknown report.' };
  }
  if (raw.parentReplyId !== undefined && raw.parentReplyId !== null) {
    if (typeof raw.parentReplyId !== 'string' || !PUBLIC_ID.test(raw.parentReplyId)) {
      return { ok: false, error: 'Unknown reply.' };
    }
  }
  if (!isOccasion(raw.occasion)) return { ok: false, error: 'Choose who the reply is for.' };
  if (!isReplyLength(raw.length)) return { ok: false, error: 'Choose a length.' };
  if (!Array.isArray(raw.blocks) || !raw.blocks.every(isReplyBlock)) {
    return { ok: false, error: 'Unknown section in the reply.' };
  }
  const blocks = REPLY_BLOCKS.filter((block) => (raw.blocks as unknown[]).includes(block));
  if (!blocks.includes('findings')) blocks.unshift('findings');
  const senderName = optionalText(raw.senderName, MAX_NAME);
  const note = optionalText(raw.note, MAX_NOTE);
  if (senderName === undefined)
    return { ok: false, error: `Names are at most ${MAX_NAME} characters.` };
  if (note === undefined) return { ok: false, error: `Notes are at most ${MAX_NOTE} characters.` };
  return {
    ok: true,
    data: {
      reportId: raw.reportId,
      parentReplyId: (raw.parentReplyId as string | undefined) ?? null,
      occasion: raw.occasion,
      length: raw.length,
      blocks,
      senderName,
      note,
    },
  };
}
