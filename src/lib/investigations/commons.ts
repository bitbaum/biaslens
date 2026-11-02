import type { InvestigationImage } from '@/lib/domain/investigation';

/** Licences we can show with attribution. Anything else is dropped. */
const OPEN = /^(cc0|public domain|pd|cc by(-sa)?( \d(\.\d)?)?)/i;

const strip = (html: unknown) =>
  typeof html === 'string'
    ? html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z#0-9]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

/**
 * Searches Wikimedia Commons for openly licensed photos and returns them with
 * credit, licence and source page filled in from the file's own metadata.
 */
export async function searchCommons(
  query: string,
  fetcher: typeof fetch = fetch,
): Promise<InvestigationImage[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=24' +
    '&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1280&gsrsearch=' +
    encodeURIComponent(query + ' filetype:bitmap');
  const response = await fetcher(url, {
    signal: AbortSignal.timeout(12_000),
    headers: { 'user-agent': 'BiasLens/1.0 (https://biaslens.orangecat.ch)' },
  });
  if (!response.ok) return [];
  const body = (await response.json()) as {
    query?: { pages?: Record<string, { title: string; imageinfo?: Record<string, unknown>[] }> };
  };
  const out: InvestigationImage[] = [];
  for (const page of Object.values(body.query?.pages ?? {})) {
    const info = page.imageinfo?.[0] as
      | {
          thumburl?: string;
          descriptionurl?: string;
          mime?: string;
          extmetadata?: Record<string, { value?: unknown }>;
        }
      | undefined;
    const meta = info?.extmetadata ?? {};
    const license = strip(meta.LicenseShortName?.value);
    const credit = strip(meta.Artist?.value) || strip(meta.Credit?.value);
    if (
      !info?.thumburl?.startsWith('https://') ||
      !info.descriptionurl ||
      !/^image\/(jpeg|png|webp)/.test(info.mime ?? '')
    )
      continue;
    if (!OPEN.test(license) || !credit) continue;
    const description = strip(meta.ImageDescription?.value).slice(0, 300);
    const title = page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
    out.push({
      kind: 'photo',
      src: info.thumburl,
      alt: (description || title).slice(0, 200),
      caption: description || title,
      credit: credit.slice(0, 120),
      license,
      licenseUrl: strip(meta.LicenseUrl?.value) || null,
      sourceUrl: info.descriptionurl,
    });
  }
  return rankPhotos(query, out).slice(0, 8);
}

const NOT_PHOTO = /\b(map|logo|diagram|chart|plan|coat of arms|flag|svg|icon|drawing|scan)\b/i;

/**
 * Orders results by how well their own title and description match the
 * query, and pushes maps, logos and diagrams down. Commons' own search order
 * is by text relevance across the whole file page, which surfaces off-topic
 * files whose categories happen to match.
 */
export function rankPhotos(query: string, images: InvestigationImage[]): InvestigationImage[] {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2);
  const score = (image: InvestigationImage) => {
    const hay = (image.caption + ' ' + image.sourceUrl).toLowerCase();
    const hits = terms.filter((t) => hay.includes(t) || hay.includes(t.replace(/s$/, ''))).length;
    return hits / Math.max(terms.length, 1) - (NOT_PHOTO.test(hay) ? 1 : 0);
  };
  return images
    .map((image, i) => ({ image, s: score(image), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.image);
}
