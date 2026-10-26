/**
 * What the rewrite studio can write. Two forms (the same story told
 * differently, or a response to it) and the voices each form allows.
 * Simulated voices (an outlet, a named person) always carry a label that the
 * code, not the model, writes.
 */
import { isOutputLanguage } from './languages';
import { perspective, type PerspectiveId } from './perspectives';
import { stylePreset, type StylePresetId } from './style-presets';

export const REWRITE_FORMS = ['rewrite', 'response'] as const;
export type RewriteForm = (typeof REWRITE_FORMS)[number];

export const REWRITE_LENGTHS = ['short', 'full'] as const;
export type RewriteLength = (typeof REWRITE_LENGTHS)[number];

export type Voice =
  | { kind: 'neutral' }
  | { kind: 'perspective'; axes: PerspectiveId[] }
  | { kind: 'outlet'; outlet: StylePresetId }
  | { kind: 'person'; name: string; qid: string | null }
  | { kind: 'biaslens' }
  | { kind: 'letter' }
  | { kind: 'me' };

export type VoiceKind = Voice['kind'];

/** Which voices each form offers, in the order the studio shows them. */
export const VOICES_FOR: Record<RewriteForm, VoiceKind[]> = {
  rewrite: ['neutral', 'perspective', 'outlet', 'person'],
  response: ['biaslens', 'letter', 'me', 'perspective', 'outlet', 'person'],
};

export const SIMULATED: ReadonlySet<VoiceKind> = new Set(['outlet', 'person']);

export const WORDS: Record<RewriteLength, string> = {
  short: 'about 150 words',
  full: '450 to 600 words',
};

export type ParsedRewriteRequest = {
  reportId: string;
  form: RewriteForm;
  voice: Voice;
  length: RewriteLength;
  text: string | null;
  language: string | null;
};

/** Validate a studio request at the boundary. */
export function parseRewriteRequest(
  value: unknown,
): { ok: true; data: ParsedRewriteRequest } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Send a JSON object.' };
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.reportId !== 'string' || !/^[a-zA-Z0-9]{8,16}$/.test(raw.reportId)) {
    return { ok: false, error: 'Unknown reading.' };
  }
  if (!REWRITE_FORMS.includes(raw.form as RewriteForm))
    return { ok: false, error: 'Choose what to write.' };
  if (!REWRITE_LENGTHS.includes(raw.length as RewriteLength))
    return { ok: false, error: 'Choose a length.' };
  const form = raw.form as RewriteForm;
  const v = raw.voice as Record<string, unknown> | null;
  if (!v || typeof v !== 'object' || typeof v.kind !== 'string')
    return { ok: false, error: 'Choose a voice.' };
  if (!VOICES_FOR[form].includes(v.kind as VoiceKind)) {
    return { ok: false, error: 'That voice is not available for this form.' };
  }
  let voice: Voice;
  switch (v.kind) {
    case 'perspective': {
      const axes = Array.isArray(v.axes) ? [...new Set(v.axes)] : [];
      if (
        axes.length < 1 ||
        axes.length > 2 ||
        !axes.every((axis) => typeof axis === 'string' && perspective(axis))
      ) {
        return { ok: false, error: 'Choose one or two value premises.' };
      }
      voice = { kind: 'perspective', axes: axes as PerspectiveId[] };
      break;
    }
    case 'outlet':
      if (typeof v.outlet !== 'string' || !stylePreset(v.outlet))
        return { ok: false, error: 'Unknown outlet.' };
      voice = { kind: 'outlet', outlet: v.outlet as StylePresetId };
      break;
    case 'person': {
      const name = typeof v.name === 'string' ? v.name.trim().replace(/\s+/g, ' ') : '';
      if (name.length < 3 || name.length > 80)
        return { ok: false, error: 'Enter the person’s full name.' };
      const qid = typeof v.qid === 'string' && /^Q\d+$/.test(v.qid) ? v.qid : null;
      voice = { kind: 'person', name, qid };
      break;
    }
    default:
      voice = { kind: v.kind } as Voice;
  }
  let text: string | null = null;
  if (raw.text !== undefined && raw.text !== null) {
    if (typeof raw.text !== 'string' || raw.text.length > 30_000)
      return { ok: false, error: 'The article text is too long.' };
    text = raw.text;
  }
  return {
    ok: true,
    data: {
      reportId: raw.reportId,
      form,
      voice,
      length: raw.length as RewriteLength,
      text,
      language: isOutputLanguage(raw.language) ? raw.language : null,
    },
  };
}
