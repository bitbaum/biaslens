/**
 * What the wires are talking about. A topic is a word or a pair of words that
 * more than one source put in a headline in the same hour-ish window. Nothing
 * is inferred: a topic lists the exact headlines that carry it, so a writer
 * can open each one. No model call, no popularity count from elsewhere.
 */
import type { WireItem } from '@/lib/wire/parse';

export interface Topic {
  /** The words as they appeared most often, e.g. "Supreme Court". */
  label: string;
  /** How many distinct sources mention it. */
  sources: number;
  items: WireItem[];
}

const STOP = new Set(
  (
    'a an the and or but of in on at to for from by with as is are was were be been being it its this that these those ' +
    'he she they them his her their we you your our i me my who whom whose what which when where why how not no yes ' +
    'into over under after before during while up down out off than then there here also just only more most very ' +
    'can could may might will would shall should must do does did done have has had having say says said about against ' +
    'new news live latest update updates says tells told amid among across between around because so if though although ' +
    'per cent percent one two three four five six seven eight nine ten first last next year years day days week weeks ' +
    'month months today tonight yesterday tomorrow man woman men women people world us uk eu u.s. mr ms mrs dr st ' +
    'der die das und oder ein eine einer eines einem einen den dem des ist sind war waren wird werden mit von zu für ' +
    'auf im in am an bei nach vor über unter aus bis um durch wie was wer wo wann warum nicht kein keine auch noch ' +
    'le la les un une des du de et ou mais dans sur pour par avec sans que qui quoi est sont été être'
  ).split(/\s+/),
);

const tokens = (title: string): string[] =>
  title
    .replace(/[’']s\b/g, '')
    .split(/[^\p{L}\p{N}.\-]+/u)
    .map((word) => word.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((word) => word.length > 2 && !/^\d+$/.test(word) && !STOP.has(word.toLowerCase()));

/** Topics shared by at least `minSources` sources, strongest first. */
export function trendingTopics(items: WireItem[], limit = 6, minSources = 2): Topic[] {
  const seen = new Map<string, { labels: Map<string, number>; items: Set<WireItem> }>();
  for (const item of items) {
    const words = tokens(item.title);
    const candidates = new Set<string>();
    words.forEach((word, i) => {
      candidates.add(word);
      if (i + 1 < words.length) candidates.add(word + ' ' + words[i + 1]);
    });
    for (const candidate of candidates) {
      const key = candidate.toLowerCase();
      const entry = seen.get(key) ?? { labels: new Map(), items: new Set() };
      entry.labels.set(candidate, (entry.labels.get(candidate) ?? 0) + 1);
      entry.items.add(item);
      seen.set(key, entry);
    }
  }
  const topics: Topic[] = [];
  for (const entry of seen.values()) {
    const list = [...entry.items];
    const sources = new Set(list.map((item) => item.source)).size;
    if (sources < minSources) continue;
    const label = [...entry.labels.entries()].sort((a, b) => b[1] - a[1])[0][0];
    topics.push({ label, sources, items: list });
  }
  topics.sort(
    (a, b) =>
      b.sources - a.sources ||
      b.items.length - a.items.length ||
      b.label.length - a.label.length ||
      a.label.localeCompare(b.label),
  );
  // A pair beats the single words inside it when it covers the same headlines.
  const kept: Topic[] = [];
  for (const topic of topics) {
    const redundant = kept.some(
      (k) =>
        (k.label.toLowerCase().includes(topic.label.toLowerCase()) ||
          topic.label.toLowerCase().includes(k.label.toLowerCase())) &&
        topic.items.every((item) => k.items.includes(item)),
    );
    if (!redundant) kept.push(topic);
    if (kept.length === limit) break;
  }
  return kept;
}
