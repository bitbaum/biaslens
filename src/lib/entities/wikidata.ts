/**
 * Wikidata: public, structured, CC0 facts about people and organisations,
 * each traceable to an item page. Used to check that a person may be
 * simulated (a public figure with a public body of work) and for profiles.
 *
 * Every function takes `fetch` so tests run without the network. Requests
 * carry a descriptive User-Agent, as the Wikimedia API policy asks.
 */
const API = 'https://www.wikidata.org/w/api.php';
const USER_AGENT = 'BiasLens/1.0 (https://biaslens.orangecat.ch; open-source media analysis)';

export type Fetch = typeof globalThis.fetch;

/** Occupations that make someone's public writing or speech fair game for a labelled simulation. */
export const PUBLIC_VOICE_OCCUPATIONS: Record<string, string> = {
  Q1930187: 'journalist',
  Q36180: 'writer',
  Q82955: 'politician',
  Q1086863: 'columnist',
  Q1607826: 'editor',
  Q589298: 'editor-in-chief',
  Q2516866: 'publisher',
  Q11774202: 'essayist',
  Q1238570: 'political scientist',
  Q188094: 'economist',
  Q4964182: 'philosopher',
  Q201788: 'historian',
  Q131524: 'entrepreneur',
  Q2526255: 'film director',
  Q947873: 'television presenter',
};

export interface WikidataCandidate {
  qid: string;
  label: string;
  description: string | null;
  /** The text the search matched (a label or an alias). */
  matched?: string;
}

export interface WikidataEntity {
  qid: string;
  label: string;
  description: string | null;
  /** Item ids per property, e.g. { P106: ['Q1930187'] }. */
  claims: Record<string, string[]>;
  /** Time values per property (P569 born, P571 founded), as ISO-like strings. */
  times: Record<string, string[]>;
  wikipedia: { language: string; title: string; url: string } | null;
  sitelinkCount: number;
  url: string;
}

async function getJson(url: string, fetchImpl: Fetch): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('Wikidata answered ' + response.status);
  return response.json();
}

function wikiLanguages(language: string): string[] {
  const base = language.slice(0, 2);
  return [...new Set([base, 'en', 'de', 'fr'])];
}

export async function searchEntities(
  name: string,
  language: string,
  fetchImpl: Fetch = globalThis.fetch,
): Promise<WikidataCandidate[]> {
  const url =
    API +
    '?action=wbsearchentities&format=json&type=item&limit=7&origin=*' +
    '&language=' +
    encodeURIComponent(language.slice(0, 2)) +
    '&uselang=' +
    encodeURIComponent(language.slice(0, 2)) +
    '&search=' +
    encodeURIComponent(name);
  const data = (await getJson(url, fetchImpl)) as {
    search?: { id: string; label?: string; description?: string; match?: { text?: string } }[];
  };
  return (data.search ?? []).map((item) => ({
    qid: item.id,
    label: item.label ?? item.id,
    description: item.description ?? null,
    matched: item.match?.text,
  }));
}

type RawClaim = {
  mainsnak?: { datavalue?: { value?: { id?: string; time?: string } | string } };
  rank?: string;
};

export async function getEntities(
  qids: string[],
  language: string,
  fetchImpl: Fetch = globalThis.fetch,
): Promise<WikidataEntity[]> {
  const ids = qids.filter((qid) => /^Q\d+$/.test(qid)).slice(0, 50);
  if (!ids.length) return [];
  const languages = wikiLanguages(language);
  const url =
    API +
    '?action=wbgetentities&format=json&origin=*&props=labels|descriptions|claims|sitelinks/urls' +
    '&languages=' +
    languages.join('|') +
    '&ids=' +
    ids.join('|');
  const data = (await getJson(url, fetchImpl)) as {
    entities?: Record<
      string,
      {
        id: string;
        labels?: Record<string, { value: string }>;
        descriptions?: Record<string, { value: string }>;
        claims?: Record<string, RawClaim[]>;
        sitelinks?: Record<string, { title: string; url?: string }>;
      }
    >;
  };
  return Object.values(data.entities ?? {})
    .filter((entity) => entity.id)
    .map((entity) => {
      const pick = (map?: Record<string, { value: string }>) =>
        languages.map((code) => map?.[code]?.value).find(Boolean) ?? null;
      const claims: Record<string, string[]> = {};
      const times: Record<string, string[]> = {};
      for (const [property, list] of Object.entries(entity.claims ?? {})) {
        for (const claim of list) {
          if (claim.rank === 'deprecated') continue;
          const value = claim.mainsnak?.datavalue?.value;
          if (value && typeof value === 'object' && value.id)
            (claims[property] ??= []).push(value.id);
          if (value && typeof value === 'object' && value.time)
            (times[property] ??= []).push(value.time);
        }
      }
      const sitelinks = entity.sitelinks ?? {};
      const wiki = languages
        .map((code) => ({ code, link: sitelinks[code + 'wiki'] }))
        .find((item) => item.link);
      return {
        qid: entity.id,
        label: pick(entity.labels) ?? entity.id,
        description: pick(entity.descriptions),
        claims,
        times,
        wikipedia: wiki
          ? {
              language: wiki.code,
              title: wiki.link!.title,
              url:
                wiki.link!.url ??
                `https://${wiki.code}.wikipedia.org/wiki/${encodeURIComponent(wiki.link!.title.replace(/ /g, '_'))}`,
            }
          : null,
        sitelinkCount: Object.keys(sitelinks).filter((key) => key.endsWith('wiki')).length,
        url: 'https://www.wikidata.org/wiki/' + entity.id,
      };
    });
}

export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type PublicFigureCheck =
  | {
      ok: true;
      qid: string;
      label: string;
      description: string | null;
      url: string;
      occupations: string[];
    }
  | {
      ok: false;
      reason: 'not_found' | 'not_public_voice' | 'ambiguous' | 'lookup_failed';
      candidates?: WikidataCandidate[];
    };

/**
 * Is this name a public figure whose public work may be simulated? Requires a
 * Wikidata item whose label matches the name, a Wikipedia article, and an
 * occupation with a public voice. Two matching people → ambiguous: ask, never guess.
 */
export async function checkPublicFigure(
  name: string,
  language: string,
  fetchImpl: Fetch = globalThis.fetch,
): Promise<PublicFigureCheck> {
  try {
    const wanted = normalizeName(name);
    const candidates = (await searchEntities(name, language, fetchImpl)).filter(
      (candidate) =>
        normalizeName(candidate.label) === wanted ||
        (candidate.matched !== undefined && normalizeName(candidate.matched) === wanted),
    );
    if (!candidates.length) return { ok: false, reason: 'not_found' };
    const entities = await getEntities(
      candidates.map((candidate) => candidate.qid),
      language,
      fetchImpl,
    );
    const qualifying = entities.filter(
      (entity) =>
        entity.wikipedia &&
        (entity.claims.P106 ?? []).some((occupation) => occupation in PUBLIC_VOICE_OCCUPATIONS),
    );
    if (!qualifying.length) return { ok: false, reason: 'not_public_voice', candidates };
    if (qualifying.length > 1) {
      return {
        ok: false,
        reason: 'ambiguous',
        candidates: qualifying.map((entity) => ({
          qid: entity.qid,
          label: entity.label,
          description: entity.description,
        })),
      };
    }
    const entity = qualifying[0]!;
    return {
      ok: true,
      qid: entity.qid,
      label: entity.label,
      description: entity.description,
      url: entity.url,
      occupations: (entity.claims.P106 ?? [])
        .map((occupation) => PUBLIC_VOICE_OCCUPATIONS[occupation])
        .filter((occupation): occupation is string => !!occupation),
    };
  } catch {
    return { ok: false, reason: 'lookup_failed' };
  }
}
