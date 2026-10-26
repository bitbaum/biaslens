import { describe, expect, it } from 'vitest';

import { checkPublicFigure, getEntities, type Fetch } from './wikidata';

function fakeFetch(routes: Record<string, unknown>): Fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const action = new URL(url).searchParams.get('action')!;
    const body =
      typeof routes[action] === 'function'
        ? (routes[action] as (u: string) => unknown)(url)
        : routes[action];
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
  }) as Fetch;
}

const journalist = {
  id: 'Q100',
  labels: { de: { value: 'Erika Beispiel' } },
  descriptions: { de: { value: 'Schweizer Journalistin' } },
  claims: {
    P106: [{ mainsnak: { datavalue: { value: { id: 'Q1930187' } } }, rank: 'normal' }],
    P108: [{ mainsnak: { datavalue: { value: { id: 'Q555' } } }, rank: 'normal' }],
    P569: [
      { mainsnak: { datavalue: { value: { time: '+1970-01-01T00:00:00Z' } } }, rank: 'normal' },
    ],
  },
  sitelinks: { dewiki: { title: 'Erika Beispiel' } },
};

describe('checkPublicFigure', () => {
  it('accepts a journalist with a Wikipedia article whose name matches', async () => {
    const result = await checkPublicFigure(
      'erika  beispiel',
      'de-CH',
      fakeFetch({
        wbsearchentities: {
          search: [
            { id: 'Q100', label: 'Erika Beispiel' },
            { id: 'Q101', label: 'Erika Beispielhaft' },
          ],
        },
        wbgetentities: { entities: { Q100: journalist } },
      }),
    );
    expect(result).toMatchObject({ ok: true, qid: 'Q100', occupations: ['journalist'] });
  });

  it('refuses a private person (no public-voice occupation or no Wikipedia article)', async () => {
    const result = await checkPublicFigure(
      'Erika Beispiel',
      'de',
      fakeFetch({
        wbsearchentities: { search: [{ id: 'Q100', label: 'Erika Beispiel' }] },
        wbgetentities: { entities: { Q100: { ...journalist, sitelinks: {} } } },
      }),
    );
    expect(result).toMatchObject({ ok: false, reason: 'not_public_voice' });
  });

  it('asks instead of guessing when two public figures share the name', async () => {
    const result = await checkPublicFigure(
      'Erika Beispiel',
      'de',
      fakeFetch({
        wbsearchentities: {
          search: [
            { id: 'Q100', label: 'Erika Beispiel' },
            { id: 'Q200', label: 'Erika Beispiel' },
          ],
        },
        wbgetentities: { entities: { Q100: journalist, Q200: { ...journalist, id: 'Q200' } } },
      }),
    );
    expect(result).toMatchObject({ ok: false, reason: 'ambiguous' });
  });

  it('reports a failed lookup rather than a negative answer', async () => {
    const failing = (async () => new Response('', { status: 503 })) as unknown as Fetch;
    expect(await checkPublicFigure('Anyone', 'en', failing)).toEqual({
      ok: false,
      reason: 'lookup_failed',
    });
  });
});

describe('getEntities', () => {
  it('reads item claims, times and the Wikipedia article in the reader’s language first', async () => {
    const [entity] = await getEntities(
      ['Q100', 'bad id'],
      'de',
      fakeFetch({ wbgetentities: { entities: { Q100: journalist } } }),
    );
    expect(entity).toMatchObject({
      qid: 'Q100',
      label: 'Erika Beispiel',
      claims: { P106: ['Q1930187'], P108: ['Q555'] },
      times: { P569: ['+1970-01-01T00:00:00Z'] },
      wikipedia: { language: 'de', url: 'https://de.wikipedia.org/wiki/Erika_Beispiel' },
      url: 'https://www.wikidata.org/wiki/Q100',
    });
  });
});
