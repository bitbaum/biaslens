/**
 * What this browser remembers for its reader: edit links, follows, visit
 * days and preferences. Nothing here leaves the device.
 */
const TOKEN_PREFIX = 'biaslens:investigation-token:';
const FOLLOWS = 'biaslens:follows';
const VISITS = 'biaslens:visit-days';
const LAST = 'biaslens:last-visit';
const PREV = 'biaslens:previous-visit';
export const PREFS = 'biaslens:prefs';

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const myInvestigationIds = (): string[] =>
  safe(
    () =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith(TOKEN_PREFIX))
        .map((k) => k.slice(TOKEN_PREFIX.length)),
    [],
  );

export const forgetEditLinks = () =>
  safe(
    () => myInvestigationIds().forEach((id) => localStorage.removeItem(TOKEN_PREFIX + id)),
    undefined,
  );

export const follows = (): string[] =>
  safe(() => JSON.parse(localStorage.getItem(FOLLOWS) ?? '[]'), []);
export const setFollow = (id: string, on: boolean) =>
  safe(() => {
    const next = new Set(follows());
    if (on) next.add(id);
    else next.delete(id);
    localStorage.setItem(FOLLOWS, JSON.stringify([...next]));
  }, undefined);

const zurichDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(d);

/**
 * Records today's visit once per session and returns the previous visit time
 * (for "since your last visit") and the current streak of consecutive days.
 */
export function recordVisit(now = new Date()): {
  previous: string | null;
  streak: number;
  days: number;
} {
  return safe(
    () => {
      if (!sessionStorage.getItem(PREV)) {
        sessionStorage.setItem(PREV, localStorage.getItem(LAST) ?? 'none');
        localStorage.setItem(LAST, now.toISOString());
      }
      const previous = sessionStorage.getItem(PREV);
      const days = new Set<string>(JSON.parse(localStorage.getItem(VISITS) ?? '[]'));
      days.add(zurichDay(now));
      const list = [...days].sort().slice(-120);
      localStorage.setItem(VISITS, JSON.stringify(list));
      let streak = 0;
      for (let d = new Date(now); days.has(zurichDay(d)); d = new Date(d.getTime() - 86_400_000))
        streak++;
      return { previous: previous === 'none' ? null : previous, streak, days: list.length };
    },
    { previous: null, streak: 0, days: 0 },
  );
}
