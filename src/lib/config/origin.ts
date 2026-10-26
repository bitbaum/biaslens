import { headers } from 'next/headers';

import { BRAND } from './brand';

/**
 * The public origin for links that leave the site (share text, images).
 * The configured origin wins; the Host header is only a fallback for
 * development and previews, never trusted for security decisions.
 */
export async function publicOrigin(): Promise<string> {
  if (BRAND.siteOrigin) return BRAND.siteOrigin;
  const host = (await headers()).get('host') ?? 'localhost:3000';
  return (host.startsWith('localhost') || host.startsWith('127.') ? 'http://' : 'https://') + host;
}
