/** Words of the profile sheet, in the report's language. */
import type { ProfileProperty } from '@/lib/entities/profile';

import { localizeSpelling, type OutputLanguage } from './languages';

export interface ProfileCopy {
  open: (name: string) => string;
  loading: string;
  intro: string;
  properties: Record<ProfileProperty, string>;
  ownedVia: string;
  fromWikipedia: string;
  source: string;
  wikidata: string;
  notFound: string;
  ambiguous: string;
  failed: string;
  wrong: string;
  close: string;
  retry: string;
}

const en: ProfileCopy = {
  open: (name) => `About ${name}`,
  loading: 'Looking up public records…',
  intro:
    'Public facts from Wikidata and Wikipedia, each with its source. BiasLens adds no rating of its own.',
  properties: {
    P106: 'Occupation',
    P108: 'Employer',
    P39: 'Position held',
    P102: 'Member of political party',
    P463: 'Member of',
    P27: 'Citizenship',
    P127: 'Owned by',
    P123: 'Publisher',
    P5769: 'Editor-in-chief',
    P17: 'Country',
    P407: 'Language',
    P159: 'Headquarters',
    P571: 'Founded',
  },
  ownedVia: 'Which is owned by',
  fromWikipedia: 'From Wikipedia',
  source: 'source',
  wikidata: 'All facts on Wikidata',
  notFound:
    'No public record matching this name and description was found. BiasLens shows only facts it can source.',
  ambiguous: 'Several people or organisations match. Which one is meant?',
  failed: 'Public records could not be reached right now.',
  wrong: 'Is something wrong here? Tell us',
  close: 'Close',
  retry: 'Try again',
};

const de: ProfileCopy = {
  open: (name) => `Über ${name}`,
  loading: 'Öffentliche Einträge werden gesucht…',
  intro:
    'Öffentliche Fakten aus Wikidata und Wikipedia, jeweils mit Quelle. BiasLens fügt keine eigene Bewertung hinzu.',
  properties: {
    P106: 'Beruf',
    P108: 'Arbeitgeber',
    P39: 'Amt',
    P102: 'Mitglied der Partei',
    P463: 'Mitglied von',
    P27: 'Staatsangehörigkeit',
    P127: 'Eigentümer',
    P123: 'Verlag',
    P5769: 'Chefredaktion',
    P17: 'Land',
    P407: 'Sprache',
    P159: 'Sitz',
    P571: 'Gegründet',
  },
  ownedVia: 'Dieser wiederum gehört',
  fromWikipedia: 'Aus Wikipedia',
  source: 'Quelle',
  wikidata: 'Alle Fakten auf Wikidata',
  notFound:
    'Kein öffentlicher Eintrag passt zu diesem Namen und dieser Beschreibung. BiasLens zeigt nur Fakten mit Quelle.',
  ambiguous: 'Mehrere Personen oder Organisationen passen. Welche ist gemeint?',
  failed: 'Öffentliche Einträge sind gerade nicht erreichbar.',
  wrong: 'Stimmt hier etwas nicht? Sagen Sie es uns',
  close: 'Schliessen',
  retry: 'Erneut versuchen',
};

const fr: ProfileCopy = {
  open: (name) => `À propos de ${name}`,
  loading: 'Recherche dans les registres publics…',
  intro:
    'Faits publics tirés de Wikidata et Wikipédia, chacun avec sa source. BiasLens n’ajoute aucune évaluation.',
  properties: {
    P106: 'Profession',
    P108: 'Employeur',
    P39: 'Fonction',
    P102: 'Membre du parti',
    P463: 'Membre de',
    P27: 'Nationalité',
    P127: 'Propriétaire',
    P123: 'Éditeur',
    P5769: 'Rédaction en chef',
    P17: 'Pays',
    P407: 'Langue',
    P159: 'Siège',
    P571: 'Fondé en',
  },
  ownedVia: 'Lui-même détenu par',
  fromWikipedia: 'Selon Wikipédia',
  source: 'source',
  wikidata: 'Tous les faits sur Wikidata',
  notFound:
    'Aucun registre public ne correspond à ce nom et à cette description. BiasLens ne montre que des faits sourcés.',
  ambiguous: 'Plusieurs personnes ou organisations correspondent. Laquelle ?',
  failed: 'Les registres publics sont injoignables pour le moment.',
  wrong: 'Une erreur ? Signalez-la',
  close: 'Fermer',
  retry: 'Réessayer',
};

function swiss(copy: ProfileCopy): ProfileCopy {
  return {
    ...copy,
    open: (name) => localizeSpelling(copy.open(name), 'de-CH'),
    properties: Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [
        key,
        localizeSpelling(value, 'de-CH'),
      ]),
    ) as ProfileCopy['properties'],
    ...Object.fromEntries(
      Object.entries(copy)
        .filter(([, value]) => typeof value === 'string')
        .map(([key, value]) => [key, localizeSpelling(value as string, 'de-CH')]),
    ),
  };
}

const COPY: Record<OutputLanguage, ProfileCopy> = { en, de, 'de-CH': swiss(de), fr };

export function profileCopy(language: OutputLanguage): ProfileCopy {
  return COPY[language];
}
