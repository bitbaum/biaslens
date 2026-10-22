/**
 * Deterministic airtime metrics for manually supplied timestamped transcripts.
 * No transcription, diarisation, political classification or AI calls here.
 *
 * Overlap is NOT proof of interruption. All conclusions must preserve the
 * fact that the speaker labels and timestamps were supplied by a user.
 */
export interface SpeakerTurn {
  startSeconds: number;
  endSeconds: number;
  speaker: string;
  text: string;
  line: number;
}

export interface SpeakerAirtime {
  speaker: string;
  airtimeSeconds: number;
  turns: number;
  shareOfSpeakerSeconds: number;
}

export interface DebateAirtime {
  speakers: SpeakerAirtime[];
  recordedWindowSeconds: number;
  coveredSeconds: number;
  /** Sum across speakers minus covered time. Does not imply interruption. */
  simultaneousSpeakerSeconds: number;
  unattributedSeconds: number;
  sourceVerified: false;
}

export type ParseResult = { ok: true; turns: SpeakerTurn[] } | { ok: false; error: string };

const MAX_TURNS = 600;
const MAX_INPUT_CHARS = 65_000;
const MAX_RECORDING_SECONDS = 8 * 3600;

export function parseTimestamp(token: string): number | null {
  const parts = token.split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;
  if (!parts.every((piece) => /^\d{1,3}$/.test(piece))) return null;
  const values = parts.map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = values;
    if (seconds >= 60) return null;
    const result = minutes * 60 + seconds;
    return result <= MAX_RECORDING_SECONDS ? result : null;
  }
  const [hours, minutes, seconds] = values;
  if (minutes >= 60 || seconds >= 60) return null;
  const result = hours * 3600 + minutes * 60 + seconds;
  return result <= MAX_RECORDING_SECONDS ? result : null;
}

export function parseTimedTranscript(input: string): ParseResult {
  if (input.length > MAX_INPUT_CHARS) {
    return { ok: false, error: 'Transcript is too long (65,000 characters maximum).' };
  }
  const lines = input.split(/\r?\n/);
  const turns: SpeakerTurn[] = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    if (turns.length >= MAX_TURNS) {
      return { ok: false, error: 'Too many turns (600 maximum).' };
    }
    const match =
      /^\s*(\d{1,3}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,3}:\d{2}(?::\d{2})?)\s*\|\s*([^|]+)\s*\|\s*(.+?)\s*$/.exec(
        line,
      );
    if (!match) {
      return {
        ok: false,
        error: 'Line ' + (index + 1) + ': use 00:01-00:15 | Speaker | Spoken text.',
      };
    }
    const start = parseTimestamp(match[1]);
    const end = parseTimestamp(match[2]);
    if (start === null || end === null || end <= start) {
      return {
        ok: false,
        error: 'Line ' + (index + 1) + ': timestamps must increase and be valid.',
      };
    }
    const speaker = match[3].trim();
    const text = match[4].trim();
    if (speaker.length > 64 || !speaker || text.length > 2000 || !text) {
      return { ok: false, error: 'Line ' + (index + 1) + ': speaker or text is too long.' };
    }
    turns.push({ startSeconds: start, endSeconds: end, speaker, text, line: index + 1 });
  }
  if (!turns.length) {
    return { ok: false, error: 'Add at least one timed speaker turn.' };
  }
  return { ok: true, turns };
}

function secondsInUnion(intervals: Array<{ startSeconds: number; endSeconds: number }>): number {
  const sorted = [...intervals].sort((a, b) => a.startSeconds - b.startSeconds);
  let sum = 0;
  let start = -1;
  let end = -1;
  for (const span of sorted) {
    if (start < 0) {
      start = span.startSeconds;
      end = span.endSeconds;
    } else if (span.startSeconds <= end) {
      end = Math.max(end, span.endSeconds);
    } else {
      sum += end - start;
      start = span.startSeconds;
      end = span.endSeconds;
    }
  }
  if (start >= 0) sum += end - start;
  return sum;
}

export function measureAirtime(turns: readonly SpeakerTurn[]): DebateAirtime {
  if (!turns.length) {
    return {
      speakers: [],
      recordedWindowSeconds: 0,
      coveredSeconds: 0,
      simultaneousSpeakerSeconds: 0,
      unattributedSeconds: 0,
      sourceVerified: false,
    };
  }
  const speakerGroups = new Map<string, SpeakerTurn[]>();
  for (const turn of turns) {
    const group = speakerGroups.get(turn.speaker) ?? [];
    group.push(turn);
    speakerGroups.set(turn.speaker, group);
  }
  const sums = [...speakerGroups.entries()].map(([speaker, spans]) => ({
    speaker,
    airtimeSeconds: secondsInUnion(spans),
    turns: spans.length,
  }));
  const allSpeakerSeconds = sums.reduce((sum, s) => sum + s.airtimeSeconds, 0);
  const coveredSeconds = secondsInUnion([...turns]);
  const earliest = Math.min(...turns.map((t) => t.startSeconds));
  const latest = Math.max(...turns.map((t) => t.endSeconds));
  const speakers = sums
    .map((speaker) => ({
      ...speaker,
      shareOfSpeakerSeconds:
        allSpeakerSeconds > 0 ? (speaker.airtimeSeconds / allSpeakerSeconds) * 100 : 0,
    }))
    .sort((a, b) => b.airtimeSeconds - a.airtimeSeconds || a.speaker.localeCompare(b.speaker));

  return {
    speakers,
    recordedWindowSeconds: latest - earliest,
    coveredSeconds,
    simultaneousSpeakerSeconds: Math.max(0, allSpeakerSeconds - coveredSeconds),
    unattributedSeconds: Math.max(0, latest - earliest - coveredSeconds),
    sourceVerified: false,
  };
}

export function formatAirtime(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return minutes + ':' + String(whole % 60).padStart(2, '0');
}
