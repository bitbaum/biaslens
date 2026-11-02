/**
 * Candidate sources from several sides of a debate, from OpenAlex (open
 * scholarly index, no key). A candidate is a lead: BiasLens shows its title,
 * venue, year and citation count, never a finding, until a reader opens it
 * and writes down what it says with a locator.
 */
export interface SourceCandidate {
  title: string;
  authors: string;
  year: number | null;
  venue: string;
  doi: string | null;
  url: string;
  citedBy: number;
  side: string;
}

/** Framings that pull the literature from different sides of a claim. */
export function framings(query: string): { side: string; search: string }[] {
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 160);
  return [
    { side: 'Supporting evidence', search: q },
    { side: 'Market and supply view', search: q + ' housing supply regulation elasticity' },
    {
      side: 'Tenant and equity view',
      search: q + ' tenants displacement affordability protection',
    },
    { side: 'Critiques and null results', search: q + ' no effect critique' },
  ];
}

interface OpenAlexWork {
  display_name?: string;
  publication_year?: number;
  doi?: string | null;
  cited_by_count?: number;
  id?: string;
  primary_location?: {
    source?: { display_name?: string } | null;
    landing_page_url?: string | null;
  } | null;
  authorships?: { author?: { display_name?: string } }[];
}

export function toCandidate(work: OpenAlexWork, side: string): SourceCandidate | null {
  if (!work.display_name) return null;
  const doi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//, '') : null;
  const url = doi
    ? 'https://doi.org/' + doi
    : (work.primary_location?.landing_page_url ?? work.id ?? '');
  if (!/^https?:\/\//.test(url)) return null;
  const names = (work.authorships ?? [])
    .map((a) => a.author?.display_name)
    .filter(Boolean) as string[];
  return {
    title: work.display_name,
    authors: names.length > 2 ? names[0] + ' et al.' : names.join(' & '),
    year: work.publication_year ?? null,
    venue: work.primary_location?.source?.display_name ?? '',
    doi,
    url,
    citedBy: work.cited_by_count ?? 0,
    side,
  };
}

interface CrossrefItem {
  title?: string[];
  author?: { family?: string; given?: string }[];
  issued?: { 'date-parts'?: number[][] };
  'container-title'?: string[];
  DOI?: string;
  'is-referenced-by-count'?: number;
}

export function fromCrossref(item: CrossrefItem, side: string): SourceCandidate | null {
  const title = item.title?.[0];
  if (!title || !item.DOI) return null;
  const names = (item.author ?? []).map((a) => a.family).filter(Boolean) as string[];
  return {
    title,
    authors: names.length > 2 ? names[0] + ' et al.' : names.join(' & '),
    year: item.issued?.['date-parts']?.[0]?.[0] ?? null,
    venue: item['container-title']?.[0] ?? '',
    doi: item.DOI,
    url: 'https://doi.org/' + item.DOI,
    citedBy: item['is-referenced-by-count'] ?? 0,
    side,
  };
}

async function crossref(
  search: string,
  side: string,
  fetcher: typeof fetch,
): Promise<SourceCandidate[]> {
  try {
    const response = await fetcher(
      'https://api.crossref.org/works?rows=8&select=title,author,issued,container-title,DOI,is-referenced-by-count&query=' +
        encodeURIComponent(search),
      {
        signal: AbortSignal.timeout(12_000),
        headers: { 'user-agent': 'BiasLens (mailto:biaslens@orangecat.ch)' },
      },
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { message?: { items?: CrossrefItem[] } };
    return (body.message?.items ?? [])
      .map((i) => fromCrossref(i, side))
      .filter((c): c is SourceCandidate => c !== null);
  } catch {
    return [];
  }
}

export async function suggestSources(
  query: string,
  fetcher: typeof fetch = fetch,
  perSide = 3,
): Promise<SourceCandidate[]> {
  const seen = new Set<string>();
  const results = await Promise.all(
    framings(query).map(async ({ side, search }) => {
      const url =
        'https://api.openalex.org/works?per-page=8&sort=relevance_score:desc&filter=type:article|review|report&search=' +
        encodeURIComponent(search) +
        '&mailto=biaslens@orangecat.ch';
      try {
        const response = await fetcher(url, { signal: AbortSignal.timeout(12_000) });
        const body = response.ok ? ((await response.json()) as { results?: OpenAlexWork[] }) : {};
        const found = (body.results ?? [])
          .map((w) => toCandidate(w, side))
          .filter((c): c is SourceCandidate => c !== null);
        return found.length ? found : crossref(search, side, fetcher);
      } catch {
        return crossref(search, side, fetcher);
      }
    }),
  );
  const out: SourceCandidate[] = [];
  for (const list of results) {
    let n = 0;
    for (const candidate of list) {
      const key = (candidate.doi ?? candidate.title).toLowerCase();
      if (seen.has(key) || n >= perSide) continue;
      seen.add(key);
      out.push(candidate);
      n++;
    }
  }
  return out;
}
