/**
 * Profiles of the people and outlets in a report: facts from Wikidata and the
 * opening of their Wikipedia article, every line with its source. BiasLens
 * adds no rating, score or label of its own — a party membership appears only
 * because Wikidata records it, and it is shown as that record.
 *
 * Linking a name to the wrong person is the worst failure this feature can
 * have, so resolution is conservative: the name must match, the context
 * (the article's description of the person, or the outlet) must agree, and
 * two plausible matches are shown to the reader to choose, never guessed.
 */
import {
  getEntities,
  normalizeName,
  searchEntities,
  type Fetch,
  type WikidataCandidate,
  type WikidataEntity,
} from './wikidata';

export type ProfileRole = 'author' | 'voice' | 'outlet';

/** The properties shown, in order, per kind of profile. */
export const PERSON_PROPERTIES = ['P106', 'P108', 'P39', 'P102', 'P463', 'P27'] as const;
export const OUTLET_PROPERTIES = ['P127', 'P123', 'P5769', 'P17', 'P407', 'P159', 'P571'] as const;
export type ProfileProperty =
  (typeof PERSON_PROPERTIES)[number] | (typeof OUTLET_PROPERTIES)[number];

const HUMAN = 'Q5';
const MEDIA_TYPES = new Set([
  'Q11032', // newspaper
  'Q41298', // magazine
  'Q1110794', // daily newspaper
  'Q1153191', // online newspaper
  'Q1002697', // periodical
  'Q15265344', // broadcaster
  'Q2085381', // publisher
  'Q14350', // radio station
  'Q1616075', // television station
  'Q35127', // website
]);
/** When an outlet's item has an unusual type, its description still says what it is. */
const MEDIA_WORDS =
  /newspaper|magazine|news|broadcast|publisher|zeitung|magazin|nachrichten|verlag|sender|rundfunk|wochenblatt|journal|quotidien|hebdomadaire|média|radio|télévision|television/i;
const JOURNALISTIC = new Set([
  'Q1930187',
  'Q36180',
  'Q1086863',
  'Q1607826',
  'Q589298',
  'Q11774202',
]);

export interface ProfileFact {
  property: ProfileProperty;
  values: { label: string; qid: string | null }[];
  source: string;
}

export interface Profile {
  qid: string;
  label: string;
  description: string | null;
  kind: 'person' | 'outlet';
  facts: ProfileFact[];
  /** Ownership above the outlet's direct owner, up to two more levels. */
  ownershipChain: { label: string; qid: string }[];
  wikidataUrl: string;
  wikipedia: { url: string; extract: string | null } | null;
}

export type ProfileResult =
  | { status: 'found'; profile: Profile }
  | { status: 'ambiguous'; candidates: WikidataCandidate[] }
  | { status: 'not_found' }
  | { status: 'lookup_failed' };

function tokens(text: string | null | undefined): Set<string> {
  return new Set(
    normalizeName(text ?? '')
      .split(' ')
      .filter((token) => token.length >= 4),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const token of a) if (b.has(token)) count++;
  return count;
}

/** Score a candidate against what the article says; higher is more certain. */
function score(
  entity: WikidataEntity,
  role: ProfileRole,
  context: string | null,
  related: Map<string, string>,
): number {
  const types = entity.claims.P31 ?? [];
  if (role === 'outlet') {
    if (types.some((type) => MEDIA_TYPES.has(type))) return 2;
    return MEDIA_WORDS.test(entity.description ?? '') ? 1.5 : -5;
  }
  if (!types.includes(HUMAN)) return -5;
  let points = 1;
  const occupations = entity.claims.P106 ?? [];
  if (role === 'author' && occupations.some((occupation) => JOURNALISTIC.has(occupation)))
    points += 1;
  const contextTokens = tokens(context);
  if (contextTokens.size) {
    const known = [
      entity.description,
      ...['P108', 'P39', 'P102', 'P463', 'P106'].flatMap((property) =>
        (entity.claims[property] ?? []).map((qid) => related.get(qid) ?? ''),
      ),
    ].join(' ');
    points += Math.min(3, overlap(contextTokens, tokens(known)) * 1.5);
  }
  return points;
}

const WIKI_SUMMARY = (language: string, title: string) =>
  `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;

async function wikipediaExtract(
  entity: WikidataEntity,
  fetchImpl: Fetch,
): Promise<{ url: string; extract: string | null } | null> {
  if (!entity.wikipedia) return null;
  try {
    const response = await fetchImpl(
      WIKI_SUMMARY(entity.wikipedia.language, entity.wikipedia.title),
      {
        headers: {
          accept: 'application/json',
          'user-agent': 'BiasLens/1.0 (https://biaslens.orangecat.ch)',
        },
        signal: AbortSignal.timeout(6_000),
      },
    );
    if (!response.ok) return { url: entity.wikipedia.url, extract: null };
    const data = (await response.json()) as { extract?: string };
    const extract = data.extract?.trim() ?? null;
    // The opening paragraph only, so the profile stays a profile.
    return {
      url: entity.wikipedia.url,
      extract: extract ? extract.split(/\n/)[0]!.slice(0, 600) : null,
    };
  } catch {
    return { url: entity.wikipedia.url, extract: null };
  }
}

async function labelsFor(
  qids: string[],
  language: string,
  fetchImpl: Fetch,
): Promise<Map<string, string>> {
  const unique = [...new Set(qids)].slice(0, 50);
  if (!unique.length) return new Map();
  const entities = await getEntities(unique, language, fetchImpl);
  return new Map(entities.map((entity) => [entity.qid, entity.label]));
}

export async function resolveProfile(
  input: {
    name: string;
    role: ProfileRole;
    context: string | null;
    language: string;
    qid?: string | null;
  },
  fetchImpl: Fetch = globalThis.fetch,
): Promise<ProfileResult> {
  try {
    let entity: WikidataEntity | undefined;
    if (input.qid) {
      [entity] = await getEntities([input.qid], input.language, fetchImpl);
      if (!entity) return { status: 'not_found' };
    } else {
      const wanted = normalizeName(input.name);
      const matches = (await searchEntities(input.name, input.language, fetchImpl)).filter(
        (candidate) =>
          normalizeName(candidate.label) === wanted ||
          (candidate.matched !== undefined && normalizeName(candidate.matched) === wanted),
      );
      if (!matches.length) return { status: 'not_found' };
      const entities = await getEntities(
        matches.map((match) => match.qid),
        input.language,
        fetchImpl,
      );
      const related = await labelsFor(
        entities.flatMap((item) =>
          ['P108', 'P39', 'P102', 'P463', 'P106'].flatMap((p) => item.claims[p] ?? []),
        ),
        input.language,
        fetchImpl,
      );
      const scored = entities
        .map((item) => ({ item, points: score(item, input.role, input.context, related) }))
        .filter((entry) => entry.points > 0)
        .sort((a, b) => b.points - a.points);
      if (!scored.length) return { status: 'not_found' };
      const [best, second] = scored;
      // A name alone links only when it is unique; otherwise the context must
      // clearly separate the best match from the next.
      const clear = !second || best!.points - second.points >= 1.5;
      if (!clear) {
        return {
          status: 'ambiguous',
          candidates: scored.slice(0, 4).map(({ item }) => ({
            qid: item.qid,
            label: item.label,
            description: item.description,
          })),
        };
      }
      entity = best!.item;
    }

    const kind: Profile['kind'] = (entity.claims.P31 ?? []).includes(HUMAN) ? 'person' : 'outlet';
    const properties = kind === 'person' ? PERSON_PROPERTIES : OUTLET_PROPERTIES;
    const valueIds = properties.flatMap((property) => entity!.claims[property] ?? []);
    const labels = await labelsFor(valueIds, input.language, fetchImpl);

    const facts: ProfileFact[] = [];
    for (const property of properties) {
      const source = `${entity.url}#${property}`;
      if (property === 'P571') {
        const year = entity.times.P571?.[0]?.match(/^[+-]?(\d{1,4})/)?.[1];
        if (year) facts.push({ property, values: [{ label: year, qid: null }], source });
        continue;
      }
      const ids = [...new Set(entity.claims[property] ?? [])].slice(0, 6);
      const values = ids.map((qid) => ({ label: labels.get(qid) ?? qid, qid }));
      if (values.length) facts.push({ property, values, source });
    }

    // Who owns the owner: two more levels, each step a Wikidata statement.
    const ownershipChain: Profile['ownershipChain'] = [];
    let owner = kind === 'outlet' ? entity.claims.P127?.[0] : undefined;
    for (let depth = 0; owner && depth < 2; depth++) {
      const [ownerEntity] = await getEntities([owner], input.language, fetchImpl);
      const next = ownerEntity?.claims.P127?.[0];
      if (!next || ownershipChain.some((item) => item.qid === next) || next === entity.qid) break;
      const [nextEntity] = await getEntities([next], input.language, fetchImpl);
      ownershipChain.push({ qid: next, label: nextEntity?.label ?? next });
      owner = next;
    }

    return {
      status: 'found',
      profile: {
        qid: entity.qid,
        label: entity.label,
        description: entity.description,
        kind,
        facts,
        ownershipChain,
        wikidataUrl: entity.url,
        wikipedia: await wikipediaExtract(entity, fetchImpl),
      },
    };
  } catch {
    return { status: 'lookup_failed' };
  }
}
