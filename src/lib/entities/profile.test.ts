import { describe, expect, it } from 'vitest';

import { resolveProfile } from './profile';
import type { Fetch } from './wikidata';

type Item = {
  id: string;
  label: string;
  description?: string;
  claims?: Record<string, string[]>;
  times?: Record<string, string>;
  wiki?: string;
};

function item({ id, label, description, claims = {}, times = {}, wiki }: Item) {
  return {
    id,
    labels: { en: { value: label } },
    descriptions: description ? { en: { value: description } } : {},
    claims: {
      ...Object.fromEntries(
        Object.entries(claims).map(([property, ids]) => [
          property,
          ids.map((qid) => ({ mainsnak: { datavalue: { value: { id: qid } } }, rank: 'normal' })),
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(times).map(([property, time]) => [
          property,
          [{ mainsnak: { datavalue: { value: { time } } }, rank: 'normal' }],
        ]),
      ),
    },
    sitelinks: wiki ? { enwiki: { title: wiki } } : {},
  };
}

function wiki(items: Item[], search: Record<string, string[]>): Fetch {
  const byId = new Map(items.map((entry) => [entry.id, item(entry)]));
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname.endsWith('wikipedia.org')) {
      return Response.json({ extract: 'Opening paragraph.\nSecond paragraph.' });
    }
    if (url.searchParams.get('action') === 'wbsearchentities') {
      const ids = search[url.searchParams.get('search')!] ?? [];
      return Response.json({
        search: ids.map((id) => ({ id, label: byId.get(id)!.labels.en.value })),
      });
    }
    const ids = url.searchParams.get('ids')!.split('|');
    return Response.json({
      entities: Object.fromEntries(
        ids.filter((id) => byId.has(id)).map((id) => [id, byId.get(id)]),
      ),
    });
  }) as Fetch;
}

const people: Item[] = [
  {
    id: 'Q1',
    label: 'Peter Beispiel',
    description: 'Swiss political scientist',
    claims: { P31: ['Q5'], P106: ['Q1238570'], P108: ['Q50'] },
    wiki: 'Peter Beispiel',
  },
  {
    id: 'Q2',
    label: 'Peter Beispiel',
    description: 'German footballer',
    claims: { P31: ['Q5'], P106: ['Q937857'] },
  },
  { id: 'Q50', label: 'Kompass Research' },
  { id: 'Q1238570', label: 'political scientist' },
  { id: 'Q937857', label: 'association football player' },
];

describe('resolveProfile', () => {
  it('links a name only when the article’s description of the person agrees', async () => {
    const fetchImpl = wiki(people, { 'Peter Beispiel': ['Q1', 'Q2'] });
    const result = await resolveProfile(
      {
        name: 'Peter Beispiel',
        role: 'voice',
        context: 'Political scientist, Kompass Research',
        language: 'en',
      },
      fetchImpl,
    );
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.profile.qid).toBe('Q1');
    expect(result.profile.facts).toEqual([
      {
        property: 'P106',
        values: [{ label: 'political scientist', qid: 'Q1238570' }],
        source: 'https://www.wikidata.org/wiki/Q1#P106',
      },
      {
        property: 'P108',
        values: [{ label: 'Kompass Research', qid: 'Q50' }],
        source: 'https://www.wikidata.org/wiki/Q1#P108',
      },
    ]);
    expect(result.profile.wikipedia?.extract).toBe('Opening paragraph.');
  });

  it('asks the reader to choose when the context does not separate two people', async () => {
    const fetchImpl = wiki(people, { 'Peter Beispiel': ['Q1', 'Q2'] });
    const result = await resolveProfile(
      { name: 'Peter Beispiel', role: 'voice', context: null, language: 'en' },
      fetchImpl,
    );
    expect(result).toMatchObject({ status: 'ambiguous' });
    if (result.status === 'ambiguous')
      expect(result.candidates.map((c) => c.qid).sort()).toEqual(['Q1', 'Q2']);
  });

  it('opens a chosen candidate directly', async () => {
    const result = await resolveProfile(
      { name: 'Peter Beispiel', role: 'voice', context: null, language: 'en', qid: 'Q2' },
      wiki(people, {}),
    );
    expect(result.status === 'found' && result.profile.description).toBe('German footballer');
  });

  it('shows an outlet’s owner, the owner’s owner and its founding year', async () => {
    const outlets: Item[] = [
      {
        id: 'Q10',
        label: 'Seeländer Zeitung',
        description: 'Swiss daily newspaper',
        claims: { P31: ['Q1110794'], P127: ['Q11'], P17: ['Q39'] },
        times: { P571: '+1890-00-00T00:00:00Z' },
      },
      { id: 'Q11', label: 'Seeland Media', claims: { P127: ['Q12'] } },
      { id: 'Q12', label: 'Holding AG' },
      { id: 'Q39', label: 'Switzerland' },
    ];
    const result = await resolveProfile(
      { name: 'Seeländer Zeitung', role: 'outlet', context: null, language: 'en' },
      wiki(outlets, { 'Seeländer Zeitung': ['Q10'] }),
    );
    expect(result.status).toBe('found');
    if (result.status !== 'found') return;
    expect(result.profile.kind).toBe('outlet');
    expect(result.profile.facts.map((fact) => [fact.property, fact.values[0]!.label])).toEqual([
      ['P127', 'Seeland Media'],
      ['P17', 'Switzerland'],
      ['P571', '1890'],
    ]);
    expect(result.profile.ownershipChain).toEqual([{ qid: 'Q12', label: 'Holding AG' }]);
  });

  it('never links a person to something that is not a human', async () => {
    const result = await resolveProfile(
      { name: 'Seeländer Zeitung', role: 'voice', context: null, language: 'en' },
      wiki([{ id: 'Q10', label: 'Seeländer Zeitung', claims: { P31: ['Q11032'] } }], {
        'Seeländer Zeitung': ['Q10'],
      }),
    );
    expect(result).toEqual({ status: 'not_found' });
  });

  it('reports a failed lookup rather than “not found”', async () => {
    const failing = (async () => new Response('', { status: 429 })) as unknown as Fetch;
    expect(
      await resolveProfile(
        { name: 'Anyone', role: 'author', context: null, language: 'en' },
        failing,
      ),
    ).toEqual({ status: 'lookup_failed' });
  });
});
