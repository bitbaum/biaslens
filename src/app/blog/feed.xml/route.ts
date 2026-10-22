import { BRAND } from '@/lib/config/brand';
import { listPublishedPosts } from '@/lib/content/blog';

export const dynamic = 'force-static';

function xmlEscape(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return escaped[char] ?? char;
  });
}

export function GET() {
  const posts = listPublishedPosts();
  // No fake domain: a valid, explicit SITE_URL is required to publish an
  // absolute RSS feed. Once the fleet assigns a host, rebuild with that URL.
  if (!BRAND.siteOrigin) {
    return new Response('Journal feed is available after a public site URL is configured.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const base = BRAND.siteOrigin;
  const items = posts
    .map(
      (post) => `<item>
<title>${xmlEscape(post.title)}</title>
<link>${xmlEscape(base + '/blog/' + post.slug)}</link>
<guid isPermaLink="true">${xmlEscape(base + '/blog/' + post.slug)}</guid>
<pubDate>${post.date ? new Date(post.date + 'T12:00:00Z').toUTCString() : ''}</pubDate>
<description>${xmlEscape(post.summary)}</description>
</item>`,
    )
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${xmlEscape(BRAND.name + ' Journal')}</title>
<link>${xmlEscape(base + '/blog')}</link>
<description>Investigations, methodology and the practice of public reasoning.</description>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
