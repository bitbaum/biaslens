/** Words of the rewrite studio and the labels every rewrite carries. */
import { localizeSpelling, type OutputLanguage } from './languages';
import type { RewriteForm, RewriteLength, VoiceKind } from './rewrite-modes';

export interface RewriteCopy {
  title: string;
  intro: string;
  formLabel: string;
  forms: Record<RewriteForm, string>;
  voiceLabel: string;
  voices: Record<VoiceKind, string>;
  lengthLabel: string;
  lengths: Record<RewriteLength, string>;
  axesLabel: string;
  outletLabel: string;
  personLabel: string;
  personPlaceholder: string;
  personHint: string;
  write: string;
  writing: string;
  original: string;
  result: string;
  copy: string;
  copied: string;
  send: string;
  again: string;
  facts: (kept: number, total: number) => string;
  changed: string;
  dropped: string;
  added: string;
  noAdded: string;
  pickPerson: string;
  personErrors: Record<
    'not_found' | 'not_public_voice' | 'ambiguous' | 'lookup_failed' | 'opted_out',
    string
  >;
  labels: {
    neutral: string;
    perspective: (premises: string) => string;
    outlet: (name: string) => string;
    person: (name: string) => string;
    biaslens: string;
    letter: string;
    me: string;
  };
}

const en: RewriteCopy = {
  title: 'Rewrite studio',
  intro:
    'The same facts, told another way — or an answer to the article. Every result says who wrote it: AI, from this article’s facts.',
  formLabel: 'What to write',
  forms: { rewrite: 'Rewrite the article', response: 'Write a response' },
  voiceLabel: 'In which voice',
  voices: {
    neutral: 'Neutral',
    perspective: 'From stated values',
    outlet: 'As an outlet',
    person: 'As a public figure',
    biaslens: 'BiasLens',
    letter: 'Letter to the editor',
    me: 'My reply',
  },
  lengthLabel: 'Length',
  lengths: { short: 'Short', full: 'Full' },
  axesLabel: 'Choose one or two value premises',
  outletLabel: 'Outlet',
  personLabel: 'Public figure',
  personPlaceholder: 'Full name, e.g. a columnist or politician',
  personHint:
    'Only people with a public body of work (checked on Wikidata). The text is labelled as a simulation they did not write.',
  write: 'Write it',
  writing: 'Writing…',
  original: 'Original',
  result: 'Rewrite',
  copy: 'Copy the text',
  copied: 'Copied',
  send: 'Send this with a reply',
  again: 'Write another',
  facts: (kept, total) => `${kept} of ${total} facts from the original kept.`,
  changed: 'Changed',
  dropped: 'Left out',
  added: 'Added — not in the original',
  noAdded: 'No facts were added that the original does not contain.',
  pickPerson: 'Which one do you mean?',
  personErrors: {
    not_found: 'No public figure with that name was found on Wikidata.',
    not_public_voice:
      'This person has no public body of work that BiasLens can simulate. Private people are never simulated.',
    ambiguous: 'Several public figures share that name.',
    lookup_failed: 'Wikidata could not be reached to check the name. Try again shortly.',
    opted_out: 'This person asked not to be simulated.',
  },
  labels: {
    neutral: 'Neutral version, written by AI from the same facts',
    perspective: (premises) => `Written by AI from these value premises: ${premises}`,
    outlet: (name) =>
      `Simulation · not written by ${name}. Written by AI from this article’s facts.`,
    person: (name) =>
      `Simulation · not written or approved by ${name}. Written by AI in the style of their public work, from this article’s facts.`,
    biaslens: 'Response written by BiasLens AI',
    letter: 'Draft letter to the editor, written by AI',
    me: 'Draft reply written with BiasLens — edit it before you send it',
  },
};

const de: RewriteCopy = {
  title: 'Umschreib-Studio',
  intro:
    'Dieselben Fakten, anders erzählt – oder eine Antwort auf den Artikel. Jedes Ergebnis sagt, wer es schrieb: KI, aus den Fakten dieses Artikels.',
  formLabel: 'Was schreiben',
  forms: { rewrite: 'Artikel umschreiben', response: 'Antwort schreiben' },
  voiceLabel: 'In welcher Stimme',
  voices: {
    neutral: 'Neutral',
    perspective: 'Aus genannten Werten',
    outlet: 'Wie ein Medium',
    person: 'Wie eine öffentliche Person',
    biaslens: 'BiasLens',
    letter: 'Leserbrief',
    me: 'Meine Antwort',
  },
  lengthLabel: 'Länge',
  lengths: { short: 'Kurz', full: 'Lang' },
  axesLabel: 'Eine oder zwei Wertehaltungen wählen',
  outletLabel: 'Medium',
  personLabel: 'Öffentliche Person',
  personPlaceholder: 'Voller Name, z. B. eine Kolumnistin oder ein Politiker',
  personHint:
    'Nur Personen mit öffentlichem Werk (auf Wikidata geprüft). Der Text ist als Simulation gekennzeichnet, die sie nicht geschrieben haben.',
  write: 'Schreiben',
  writing: 'Wird geschrieben…',
  original: 'Original',
  result: 'Umschrieben',
  copy: 'Text kopieren',
  copied: 'Kopiert',
  send: 'Mit einer Antwort senden',
  again: 'Noch eine Version',
  facts: (kept, total) => `${kept} von ${total} Fakten aus dem Original übernommen.`,
  changed: 'Verändert',
  dropped: 'Weggelassen',
  added: 'Hinzugefügt – nicht im Original',
  noAdded: 'Es wurden keine Fakten hinzugefügt, die das Original nicht enthält.',
  pickPerson: 'Welche Person meinen Sie?',
  personErrors: {
    not_found: 'Auf Wikidata wurde keine öffentliche Person mit diesem Namen gefunden.',
    not_public_voice:
      'Diese Person hat kein öffentliches Werk, das BiasLens simulieren kann. Privatpersonen werden nie simuliert.',
    ambiguous: 'Mehrere öffentliche Personen tragen diesen Namen.',
    lookup_failed:
      'Wikidata war nicht erreichbar, um den Namen zu prüfen. Bitte gleich nochmals versuchen.',
    opted_out: 'Diese Person hat gebeten, nicht simuliert zu werden.',
  },
  labels: {
    neutral: 'Neutrale Fassung, von KI aus denselben Fakten geschrieben',
    perspective: (premises) => `Von KI aus diesen Wertehaltungen geschrieben: ${premises}`,
    outlet: (name) =>
      `Simulation · nicht von ${name} geschrieben. Von KI aus den Fakten dieses Artikels verfasst.`,
    person: (name) =>
      `Simulation · nicht von ${name} geschrieben oder freigegeben. Von KI im Stil des öffentlichen Werks verfasst, aus den Fakten dieses Artikels.`,
    biaslens: 'Antwort von BiasLens-KI',
    letter: 'Entwurf eines Leserbriefs, von KI geschrieben',
    me: 'Entwurf mit BiasLens geschrieben – vor dem Senden bearbeiten',
  },
};

const fr: RewriteCopy = {
  title: 'Atelier de réécriture',
  intro:
    'Les mêmes faits, racontés autrement — ou une réponse à l’article. Chaque résultat dit qui l’a écrit : une IA, à partir des faits de cet article.',
  formLabel: 'Quoi écrire',
  forms: { rewrite: 'Réécrire l’article', response: 'Écrire une réponse' },
  voiceLabel: 'Dans quelle voix',
  voices: {
    neutral: 'Neutre',
    perspective: 'À partir de valeurs',
    outlet: 'Comme un média',
    person: 'Comme une personnalité',
    biaslens: 'BiasLens',
    letter: 'Courrier des lecteurs',
    me: 'Ma réponse',
  },
  lengthLabel: 'Longueur',
  lengths: { short: 'Court', full: 'Long' },
  axesLabel: 'Choisissez une ou deux prémisses de valeur',
  outletLabel: 'Média',
  personLabel: 'Personnalité publique',
  personPlaceholder: 'Nom complet, p. ex. un chroniqueur ou une politicienne',
  personHint:
    'Seulement des personnes ayant une œuvre publique (vérifié sur Wikidata). Le texte est marqué comme une simulation qu’elles n’ont pas écrite.',
  write: 'Écrire',
  writing: 'Rédaction…',
  original: 'Original',
  result: 'Réécriture',
  copy: 'Copier le texte',
  copied: 'Copié',
  send: 'Envoyer avec une réponse',
  again: 'Une autre version',
  facts: (kept, total) => `${kept} faits sur ${total} de l’original conservés.`,
  changed: 'Modifiés',
  dropped: 'Omis',
  added: 'Ajoutés — absents de l’original',
  noAdded: 'Aucun fait absent de l’original n’a été ajouté.',
  pickPerson: 'De qui parlez-vous ?',
  personErrors: {
    not_found: 'Aucune personnalité publique de ce nom n’a été trouvée sur Wikidata.',
    not_public_voice:
      'Cette personne n’a pas d’œuvre publique que BiasLens puisse simuler. Les particuliers ne sont jamais simulés.',
    ambiguous: 'Plusieurs personnalités portent ce nom.',
    lookup_failed:
      'Wikidata n’a pas pu être joint pour vérifier le nom. Réessayez dans un instant.',
    opted_out: 'Cette personne a demandé à ne pas être simulée.',
  },
  labels: {
    neutral: 'Version neutre, écrite par une IA à partir des mêmes faits',
    perspective: (premises) => `Écrit par une IA à partir de ces prémisses : ${premises}`,
    outlet: (name) =>
      `Simulation · non écrit par ${name}. Rédigé par une IA à partir des faits de cet article.`,
    person: (name) =>
      `Simulation · ni écrit ni approuvé par ${name}. Rédigé par une IA dans le style de son œuvre publique, à partir des faits de cet article.`,
    biaslens: 'Réponse rédigée par l’IA de BiasLens',
    letter: 'Projet de courrier des lecteurs, rédigé par une IA',
    me: 'Brouillon rédigé avec BiasLens — à relire avant envoi',
  },
};

function swiss(copy: RewriteCopy): RewriteCopy {
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return localizeSpelling(value, 'de-CH');
    if (typeof value === 'function') {
      const fn = value as (...args: unknown[]) => unknown;
      return (...args: unknown[]) => walk(fn(...args));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
    }
    return value;
  };
  return walk(copy) as RewriteCopy;
}

const COPY: Record<OutputLanguage, RewriteCopy> = { en, de, 'de-CH': swiss(de), fr };

export function rewriteCopy(language: OutputLanguage): RewriteCopy {
  return COPY[language];
}
