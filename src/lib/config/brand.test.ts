import { describe, expect, it } from 'vitest';

import { buildBrand } from './brand';

describe('buildBrand: public identity can change without a repo rename', () => {
  it('uses temporary defaults when no public identity has been set', () => {
    expect(buildBrand({})).toEqual({
      name: 'BiasLens',
      mark: 'B/L',
      logoPath: null,
      siteOrigin: null,
    });
  });

  it('changes name, mark, logo and domain through one seam', () => {
    expect(
      buildBrand({
        NEXT_PUBLIC_PRODUCT_NAME: 'The Inquiry',
        NEXT_PUBLIC_PRODUCT_MARK: 'TI',
        NEXT_PUBLIC_PRODUCT_LOGO: '/brand/new-mark.svg',
        NEXT_PUBLIC_SITE_URL: 'https://example.org',
      }),
    ).toEqual({
      name: 'The Inquiry',
      mark: 'TI',
      logoPath: '/brand/new-mark.svg',
      siteOrigin: 'https://example.org',
    });
  });

  it('never imports an arbitrary external logo or accepts a fake canonical domain', () => {
    const brand = buildBrand({
      NEXT_PUBLIC_PRODUCT_LOGO: 'https://tracker.example/icon.svg',
      NEXT_PUBLIC_SITE_URL: 'https://name:password@example.org/path',
    });
    expect(brand.logoPath).toBeNull();
    expect(brand.siteOrigin).toBeNull();
  });

  it('preserves local development and bounds unexpectedly large labels', () => {
    const brand = buildBrand({
      NEXT_PUBLIC_PRODUCT_NAME: 'X'.repeat(500),
      NEXT_PUBLIC_PRODUCT_MARK: 'ABCDEFGHIJK',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    });
    expect(brand.name).toHaveLength(60);
    expect(brand.mark).toHaveLength(9);
    expect(brand.siteOrigin).toBe('http://localhost:3000');
  });
});
