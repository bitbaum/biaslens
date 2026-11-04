export type WireItem = {
  title: string;
  link: string;
  source: string;
  published: string | null;
};

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Text inside an RSS or Atom element, with markup and entities removed. */
export function decodeXml(value: string): string {
  const unwrapped = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return unwrapped
    .replace(/&#(\d+);/g, (_, digits: string) => safeCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED[name.toLowerCase()] ?? entity)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  return String.fromCodePoint(code);
}

function element(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  if (!match?.[1]) return null;
  const text = decodeXml(match[1]);
  return text.length > 0 ? text : null;
}

function atomHref(block: string): string | null {
  const match = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  if (!match?.[1]) return null;
  const href = decodeXml(match[1]);
  return href.length > 0 ? href : null;
}

function publishedIso(raw: string | null): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Headlines actually present in an RSS or Atom document. Nothing is filled in. */
export function parseFeed(xml: string, source: string): WireItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const items: WireItem[] = [];
  for (const block of blocks) {
    const title = element(block, 'title');
    const link = element(block, 'link') ?? atomHref(block);
    if (!title || !link || !/^https?:\/\//i.test(link)) continue;
    items.push({
      title,
      link,
      source,
      published: publishedIso(
        element(block, 'pubDate') ?? element(block, 'updated') ?? element(block, 'published'),
      ),
    });
  }
  return items;
}
