import { describe, expect, it } from 'vitest';

import { searchCommons } from './commons';

const page = (title: string, license: string, artist: string) => ({
  title,
  imageinfo: [
    {
      thumburl: 'https://upload.wikimedia.org/x/' + title,
      descriptionurl: 'https://commons.wikimedia.org/wiki/' + title,
      mime: 'image/jpeg',
      extmetadata: {
        LicenseShortName: { value: license },
        Artist: { value: `<a href="x">${artist}</a>` },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by/2.0/' },
        ImageDescription: { value: 'Flats in <b>Athens</b>' },
      },
    },
  ],
});

describe('searchCommons', () => {
  it('keeps open licences with credit and drops the rest', async () => {
    const fetcher = (async () =>
      Response.json({
        query: {
          pages: {
            1: page('File:A.jpg', 'CC BY 2.0', 'Dimitris'),
            2: page('File:B.jpg', 'All rights reserved', 'X'),
            3: page('File:C.jpg', 'CC BY-SA 4.0', ''),
          },
        },
      })) as unknown as typeof fetch;
    const images = await searchCommons('athens', fetcher);
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
      credit: 'Dimitris',
      license: 'CC BY 2.0',
      caption: 'Flats in Athens',
    });
  });
});

describe('rankPhotos', () => {
  it('puts the best caption match first and maps last', async () => {
    const { rankPhotos } = await import('./commons');
    const mk = (caption: string) => ({
      kind: 'photo' as const,
      src: 'https://x/' + caption,
      alt: caption,
      caption,
      credit: 'c',
      license: 'CC0',
      licenseUrl: null,
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:' + caption,
    });
    const ranked = rankPhotos('Zurich apartment building', [
      mk('Railway depot Zurich'),
      mk('Map of Zurich apartment building zones'),
      mk('Apartment building in Zurich Wiedikon'),
    ]);
    expect(ranked.map((r) => r.caption)).toEqual([
      'Apartment building in Zurich Wiedikon',
      'Railway depot Zurich',
      'Map of Zurich apartment building zones',
    ]);
  });
});
