import { parseFeed, type WireItem } from './parse';

/** Public wires read on the server. A follow list is a later step; this is the default paper. */
export const WIRE_SOURCES = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { name: 'SRF News', url: 'https://www.srf.ch/news/bnf/rss/1890' },
  { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-all' },
  { name: 'The Hill', url: 'https://thehill.com/news/feed/' },
] as const;

const PER_SOURCE = 4;
const SHOWN = 12;

export type WireFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type WireLoad = {
  items: WireItem[];
  failed: string[];
};

export async function loadWire(fetcher: WireFetcher = defaultFetcher): Promise<WireLoad> {
  const results = await Promise.all(
    WIRE_SOURCES.map(async (source) => {
      try {
        const response = await fetcher(source.url, {
          headers: {
            accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
            'user-agent': 'BiasLens/1.0 (+https://biaslens.orangecat.ch)',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) return { items: [] as WireItem[], failed: source.name };
        const xml = await response.text();
        return { items: parseFeed(xml, source.name).slice(0, PER_SOURCE), failed: null };
      } catch {
        return { items: [] as WireItem[], failed: source.name };
      }
    }),
  );

  const seen = new Set<string>();
  const items = results
    .flatMap((result) => result.items)
    .filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    })
    .sort((a, b) => stamp(b.published) - stamp(a.published))
    .slice(0, SHOWN);

  return {
    items,
    failed: results.flatMap((result) => (result.failed ? [result.failed] : [])),
  };
}

function stamp(iso: string | null): number {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function defaultFetcher(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, next: { revalidate: 300 } });
}
