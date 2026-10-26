/**
 * Outlets a reader can ask "how would they have written this?". Only facts
 * about the outlet are stored here (name, country, language, format, site).
 * BiasLens does not write its own characterisation of an outlet's politics:
 * the style comes from the model's knowledge of the outlet's published work,
 * and every result is labelled a simulation that the outlet did not write.
 */
export interface StylePreset {
  id: string;
  name: string;
  country: string;
  language: 'de' | 'fr' | 'en';
  format: string;
  url: string;
}

export const STYLE_PRESETS = [
  {
    id: 'weltwoche',
    name: 'Die Weltwoche',
    country: 'CH',
    language: 'de',
    format: 'weekly news magazine',
    url: 'https://weltwoche.ch',
  },
  {
    id: 'republik',
    name: 'Republik',
    country: 'CH',
    language: 'de',
    format: 'reader-funded online magazine',
    url: 'https://www.republik.ch',
  },
  {
    id: 'nzz',
    name: 'Neue Zürcher Zeitung',
    country: 'CH',
    language: 'de',
    format: 'daily newspaper',
    url: 'https://www.nzz.ch',
  },
  {
    id: 'woz',
    name: 'WOZ Die Wochenzeitung',
    country: 'CH',
    language: 'de',
    format: 'weekly newspaper',
    url: 'https://www.woz.ch',
  },
  {
    id: 'tagesanzeiger',
    name: 'Tages-Anzeiger',
    country: 'CH',
    language: 'de',
    format: 'daily newspaper',
    url: 'https://www.tagesanzeiger.ch',
  },
  {
    id: 'blick',
    name: 'Blick',
    country: 'CH',
    language: 'de',
    format: 'daily tabloid',
    url: 'https://www.blick.ch',
  },
  {
    id: 'srf',
    name: 'SRF News',
    country: 'CH',
    language: 'de',
    format: 'public broadcaster news',
    url: 'https://www.srf.ch/news',
  },
  {
    id: 'letemps',
    name: 'Le Temps',
    country: 'CH',
    language: 'fr',
    format: 'daily newspaper',
    url: 'https://www.letemps.ch',
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    country: 'GB',
    language: 'en',
    format: 'daily newspaper',
    url: 'https://www.theguardian.com',
  },
  {
    id: 'telegraph',
    name: 'The Daily Telegraph',
    country: 'GB',
    language: 'en',
    format: 'daily newspaper',
    url: 'https://www.telegraph.co.uk',
  },
  {
    id: 'nytimes',
    name: 'The New York Times',
    country: 'US',
    language: 'en',
    format: 'daily newspaper',
    url: 'https://www.nytimes.com',
  },
  {
    id: 'wsj',
    name: 'The Wall Street Journal',
    country: 'US',
    language: 'en',
    format: 'daily newspaper',
    url: 'https://www.wsj.com',
  },
] as const satisfies readonly StylePreset[];

export type StylePresetId = (typeof STYLE_PRESETS)[number]['id'];

export function stylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((item) => item.id === id);
}

/**
 * People who asked not to be simulated. Matched by Wikidata id and by name.
 * Honoured without questions: add the entry and ship it.
 */
export const SIMULATION_OPT_OUTS: readonly { qid: string | null; name: string }[] = [];
