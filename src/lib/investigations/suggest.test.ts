import { describe, expect, it } from 'vitest';

import { framings, suggestSources } from './suggest';

describe('suggestSources', () => {
  it('searches several sides and dedupes, falling back to Crossref', async () => {
    expect(framings('rent control').map((f) => f.side)).toHaveLength(4);
    let call = 0;
    const fetcher = (async (url: string) => {
      call++;
      if (String(url).includes('openalex') && call === 1)
        return new Response(
          JSON.stringify({
            results: [
              {
                display_name: 'A study',
                publication_year: 2020,
                doi: 'https://doi.org/10.1/x',
                cited_by_count: 5,
                authorships: [{ author: { display_name: 'Ann' } }],
              },
            ],
          }),
        );
      if (String(url).includes('openalex')) return new Response('{}', { status: 429 });
      return new Response(
        JSON.stringify({
          message: {
            items: [
              {
                title: ['Crossref paper'],
                DOI: '10.2/y',
                author: [{ family: 'Bo' }],
                issued: { 'date-parts': [[2019]] },
              },
            ],
          },
        }),
      );
    }) as unknown as typeof fetch;
    const out = await suggestSources('rent control', fetcher);
    expect(out[0]).toMatchObject({
      title: 'A study',
      doi: '10.1/x',
      url: 'https://doi.org/10.1/x',
      side: 'Supporting evidence',
    });
    expect(out.filter((c) => c.title === 'Crossref paper')).toHaveLength(1);
  });
});
