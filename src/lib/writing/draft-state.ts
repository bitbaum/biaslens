/**
 * The one line under the composer that says where the text is kept. It never
 * claims the account has what only this browser holds: a draft is on
 * BiasLens only after a signed-in save, and says so with the time.
 */
import type { WritingStatus } from './input';

export interface ServerCopy {
  /** When the account copy was last written (ISO). */
  at: string;
  title: string;
  body: string;
  status: WritingStatus;
}

export interface DraftStateInput {
  signedIn: boolean;
  title: string;
  body: string;
  /** What the account holds for this piece, if anything. */
  server: ServerCopy | null;
  /** Whether the last write to this browser's storage worked. */
  browserKept: boolean;
  /** Formats an ISO time for the reader (Europe/Zurich). */
  time: (iso: string) => string;
}

export function draftState({
  signedIn,
  title,
  body,
  server,
  browserKept,
  time,
}: DraftStateInput): string | null {
  const empty = !title.trim() && !body.trim();
  const changed = !server || server.title !== title || server.body !== body;
  if (server && !changed)
    return server.status === 'draft'
      ? `Draft saved to your account · ${time(server.at)}`
      : `Published · last saved ${time(server.at)}`;
  if (empty) return null;
  if (!signedIn)
    return browserKept
      ? 'Kept in this browser only, not saved to BiasLens. Sign in to save it as a draft on your account.'
      : 'Not saved anywhere yet: this browser blocks storage. Sign in to save it as a draft on your account.';
  const where = browserKept
    ? 'kept in this browser until you save'
    : 'not kept anywhere until you save';
  return server
    ? `Changes not saved to your account yet, ${where}.`
    : `Not saved to your account yet, ${where}.`;
}
