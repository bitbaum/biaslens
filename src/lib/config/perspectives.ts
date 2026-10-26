/**
 * Value premises for "the same facts, written from these values". They replace
 * a left/right axis with the eight dimensions of the smartvote "smartspider"
 * (smartvote.ch, Politools), which Swiss readers already know from elections.
 * Each premise is a plain sentence a reader can accept or reject; BiasLens
 * states it at the top of every perspective rewrite.
 */
import type { OutputLanguage } from './languages';

type Localized = Record<'en' | 'de' | 'fr', string>;

export interface Perspective {
  id: string;
  label: Localized;
  premise: Localized;
}

export const PERSPECTIVE_SOURCE = {
  name: 'smartvote smartspider (Politools)',
  url: 'https://www.smartvote.ch',
} as const;

export const PERSPECTIVES = [
  {
    id: 'open_foreign_policy',
    label: {
      en: 'Open foreign policy',
      de: 'Offene Aussenpolitik',
      fr: 'Politique extérieure ouverte',
    },
    premise: {
      en: 'Close cooperation with other countries and international institutions serves the country best.',
      de: 'Enge Zusammenarbeit mit anderen Ländern und internationalen Institutionen dient dem Land am besten.',
      fr: 'Une coopération étroite avec les autres pays et les institutions internationales sert le mieux le pays.',
    },
  },
  {
    id: 'liberal_economy',
    label: {
      en: 'Liberal economic policy',
      de: 'Liberale Wirtschaftspolitik',
      fr: 'Politique économique libérale',
    },
    premise: {
      en: 'Markets with few rules and low state involvement produce the most prosperity.',
      de: 'Märkte mit wenigen Regeln und geringer Staatsbeteiligung schaffen am meisten Wohlstand.',
      fr: 'Des marchés peu réglementés et un État discret produisent le plus de prospérité.',
    },
  },
  {
    id: 'restrictive_fiscal',
    label: {
      en: 'Restrictive fiscal policy',
      de: 'Restriktive Finanzpolitik',
      fr: 'Politique budgétaire restrictive',
    },
    premise: {
      en: 'Public spending and taxes should be kept low and budgets balanced.',
      de: 'Staatsausgaben und Steuern sollen tief und die Haushalte ausgeglichen bleiben.',
      fr: 'Les dépenses publiques et les impôts doivent rester bas et les budgets équilibrés.',
    },
  },
  {
    id: 'law_and_order',
    label: { en: 'Law & order', de: 'Law & Order', fr: 'Ordre et sécurité' },
    premise: {
      en: 'Public safety comes first, with firm policing and consistent punishment.',
      de: 'Öffentliche Sicherheit hat Vorrang, mit konsequenter Polizeiarbeit und Strafverfolgung.',
      fr: 'La sécurité publique passe d’abord, avec une police ferme et des sanctions cohérentes.',
    },
  },
  {
    id: 'restrictive_migration',
    label: {
      en: 'Restrictive migration policy',
      de: 'Restriktive Migrationspolitik',
      fr: 'Politique migratoire restrictive',
    },
    premise: {
      en: 'Immigration should be limited and tied to clear conditions.',
      de: 'Zuwanderung soll begrenzt und an klare Bedingungen geknüpft sein.',
      fr: 'L’immigration doit être limitée et liée à des conditions claires.',
    },
  },
  {
    id: 'environment',
    label: {
      en: 'Expanded environmental protection',
      de: 'Ausgebauter Umweltschutz',
      fr: 'Protection de l’environnement étendue',
    },
    premise: {
      en: 'Protecting climate and nature justifies costs and limits on economic activity.',
      de: 'Der Schutz von Klima und Natur rechtfertigt Kosten und Grenzen für die Wirtschaft.',
      fr: 'Protéger le climat et la nature justifie des coûts et des limites à l’activité économique.',
    },
  },
  {
    id: 'welfare_state',
    label: {
      en: 'Expanded welfare state',
      de: 'Ausgebauter Sozialstaat',
      fr: 'État social étendu',
    },
    premise: {
      en: 'A strong welfare state should protect people against poverty and life’s risks.',
      de: 'Ein starker Sozialstaat soll vor Armut und Lebensrisiken schützen.',
      fr: 'Un État social fort doit protéger contre la pauvreté et les risques de la vie.',
    },
  },
  {
    id: 'liberal_society',
    label: { en: 'Liberal society', de: 'Liberale Gesellschaft', fr: 'Société libérale' },
    premise: {
      en: 'Individuals should be free to choose how they live, with the state staying out of private life.',
      de: 'Menschen sollen frei wählen, wie sie leben; der Staat hält sich aus dem Privatleben heraus.',
      fr: 'Chacun doit pouvoir choisir comment vivre, l’État restant hors de la vie privée.',
    },
  },
] as const satisfies readonly Perspective[];

export type PerspectiveId = (typeof PERSPECTIVES)[number]['id'];

export function perspective(id: string): Perspective | undefined {
  return PERSPECTIVES.find((item) => item.id === id);
}

export function localized(value: Localized, language: OutputLanguage): string {
  const text = value[language === 'de-CH' ? 'de' : language];
  return language === 'de-CH' ? text.replace(/ß/g, 'ss') : text;
}
