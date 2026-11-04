import { describe, expect, it } from 'vitest';

import { loadWire } from './load';
import { decodeXml, parseFeed } from './parse';

const RSS = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title><![CDATA[Council & the rent vote]]></title>
    <link>https://example.com/rent</link>
    <pubDate>Wed, 04 Nov 2026 06:00:00 GMT</pubDate>
  </item>
  <item>
    <title>No link here</title>
    <description>Skipped</description>
  </item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?>
<feed>
  <entry>
    <title>A later story</title>
    <link href="https://example.com/later" />
    <updated>2026-11-04T08:00:00Z</updated>
  </entry>
</feed>`;

describe('parseFeed', () => {
  it('reads RSS items and drops entries with no link', () => {
    const items = parseFeed(RSS, 'Example');
    expect(items).toEqual([
      {
        title: 'Council & the rent vote',
        link: 'https://example.com/rent',
        source: 'Example',
        published: '2026-11-04T06:00:00.000Z',
      },
    ]);
  });

  it('reads an Atom link href', () => {
    expect(parseFeed(ATOM, 'Atom').map((item) => item.link)).toEqual(['https://example.com/later']);
  });

  it('decodes a numeric entity and strips tags', () => {
    expect(decodeXml('<b>Caf&#233;</b>')).toBe('Café');
  });
});

describe('loadWire', () => {
  it('keeps only headlines the fetcher actually returned, newest first', async () => {
    const fetcher = async (url: string) => {
      if (url.includes('bbci')) {
        return new Response(RSS, { status: 200 });
      }
      if (url.includes('npr')) {
        return new Response(ATOM, { status: 200 });
      }
      if (url.includes('srf')) {
        return new Response('nope', { status: 500 });
      }
      throw new Error('down');
    };
    const wire = await loadWire(fetcher);
    expect(wire.items.map((item) => item.title)).toEqual([
      'A later story',
      'Council & the rent vote',
    ]);
    expect(wire.failed).toContain('SRF News');
    expect(wire.items.some((item) => item.title === 'No link here')).toBe(false);
  });
});
