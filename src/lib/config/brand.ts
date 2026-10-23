/**
 * One small, replaceable presentation seam.
 *
 * Repository paths, hostnames, database names and package names are technical
 * identifiers, NOT public product identity. Changing the public brand should
 * never require editing routes, data models, prompts or content records.
 * The canonical venture profile/roadmap remains in Loki/Fleet.
 */
export interface ProductBrand {
  name: string;
  mark: string;
  /** Optional root-relative logo; omission renders a typographic fallback. */
  logoPath: string | null;
  /** Optional canonical hosting origin; do not invent a production URL. */
  siteOrigin: string | null;
}

type PublicEnv = Record<string, string | undefined>;

function validOrigin(raw?: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function validLogoPath(path?: string): string | null {
  if (!path) return null;
  // Only first-party static assets; reject protocol-relative URLs, dot segments
  // and query strings so this cannot unexpectedly leak visits to another host.
  if (!/^\/(?!\/)[a-zA-Z0-9/_-]+\.(?:svg|png|webp)$/.test(path)) return null;
  if (path.split('/').includes('..')) return null;
  return path;
}

export function buildBrand(env: PublicEnv): ProductBrand {
  return {
    name: env.NEXT_PUBLIC_PRODUCT_NAME?.trim().slice(0, 60) || 'Biosense',
    mark: env.NEXT_PUBLIC_PRODUCT_MARK?.trim().slice(0, 9) || 'BS',
    logoPath: validLogoPath(env.NEXT_PUBLIC_PRODUCT_LOGO),
    siteOrigin: validOrigin(env.NEXT_PUBLIC_SITE_URL),
  };
}

export const BRAND: Readonly<ProductBrand> = Object.freeze(buildBrand(process.env));

