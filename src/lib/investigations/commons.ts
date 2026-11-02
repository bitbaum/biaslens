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
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=12' +
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
  return out.slice(0, 8);
}
