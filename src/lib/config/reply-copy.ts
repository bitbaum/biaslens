/**
 * Words for replies: the composer, the page the receiver opens, and the text
 * that travels in a message. In the report's language, like the report.
 */
import { localizeSpelling, type OutputLanguage } from '@/lib/config/languages';

import type { Occasion, ReplyBlock, ReplyLength } from './reply-occasions';

export interface ReplyCopy {
  composerTitle: string;
  composerIntro: string;
  occasionLabel: string;
  occasions: Record<Occasion, { label: string; hint: string }>;
  lengthLabel: string;
  lengths: Record<ReplyLength, string>;
  blocksLabel: string;
  blocks: Record<ReplyBlock, string>;
  nameLabel: string;
  namePlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  preview: string;
  create: string;
  creating: string;
  share: string;
  copyText: string;
  copyLink: string;
  copied: string;
  downloadImage: string;
  openPage: string;
  sendVia: string;
  failed: string;
  open: string;
  // Finding sentences
  attribution: (claim: string, voice: string) => string;
  figureNoSample: (value: string, about: string) => string;
  figureNoSource: (value: string, about: string) => string;
  oneSided: (supports: number, known: number) => string;
  notHeard: (who: string, why: string) => string;
  // Message text
  readingOf: (title: string, publication: string | null) => string;
  questionForAuthor: string;
  // Receiver page
  sentBy: (name: string | null) => string;
  sentNote: string;
  cardSent: (name: string | null) => string;
  threeThings: string;
  guessTitle: string;
  guessQuestion: (claim: string) => string;
  guessRight: string;
  guessWrong: (answer: string) => string;
  guessSkip: string;
  disagree: string;
  fullReading: string;
  replyBack: (name: string | null) => string;
  examineAny: string;
  author: string;
  aiNote: string;
}

const en: ReplyCopy = {
  composerTitle: 'Send a reply',
  composerIntro:
    'Choose who it is for. BiasLens picks the three findings someone can check in seconds; you choose what else to include.',
  occasionLabel: 'Who is it for?',
  occasions: {
    friend: { label: 'A friend sent it', hint: 'Short and curious. Starts with a guess.' },
    group: { label: 'A group chat', hint: 'The findings only, no verdict.' },
    author: { label: 'The author or paper', hint: 'Specific questions, politely put.' },
    public: { label: 'A public post', hint: 'An image and the findings.' },
    disagree: { label: 'I disagree with it', hint: 'The strongest objection, fairly stated.' },
    teach: { label: 'A class', hint: 'Everything, with a guess for each finding.' },
  },
  lengthLabel: 'Length',
  lengths: { line: 'One line', brief: 'Short brief', page: 'Full page' },
  blocksLabel: 'Include',
  blocks: {
    findings: 'Three findings',
    guess: 'Guess first',
    voices: 'Who is speaking',
    figures: 'The numbers',
    assumption: 'The step it rests on',
    arguments: 'Strongest case and objection',
    questions: 'Questions for the author',
  },
  nameLabel: 'Your name (optional)',
  namePlaceholder: 'Shown as the sender',
  noteLabel: 'A note (optional)',
  notePlaceholder: 'Your own words, sent with the reply',
  preview: 'What they will receive',
  create: 'Create the reply link',
  creating: 'Creating…',
  share: 'Share',
  copyText: 'Copy the text',
  copyLink: 'Copy the link',
  copied: 'Copied',
  downloadImage: 'Download the image',
  openPage: 'Open the reply page',
  sendVia: 'Send with',
  failed: 'The reply could not be created. Try again.',
  open: 'Send a reply',
  attribution: (claim, voice) =>
    `“${claim}” is the explanation of ${voice}, quoted in the text, not something the article’s own evidence shows.`,
  figureNoSample: (value, about) =>
    `The figure ${value}${about ? ` (${about})` : ''} is reported without a sample size or margin of error.`,
  figureNoSource: (value, about) =>
    `The figure ${value}${about ? ` (${about})` : ''} is given without a named source.`,
  oneSided: (supports, known) =>
    `${supports} of ${known} voices that take a position support the article’s central claim.`,
  notHeard: (who, why) => `Not heard: ${who}${why ? ` — ${why}` : ''}`,
  readingOf: (title, publication) =>
    `A BiasLens reading of “${title}”${publication ? ` (${publication})` : ''}:`,
  questionForAuthor: 'A question for the author:',
  sentBy: (name) => (name ? `${name} sent you a reading of` : 'Someone sent you a reading of'),
  sentNote: 'Their note',
  cardSent: (name) => (name ? `${name} sent you this` : 'Shared with you'),
  threeThings: 'Three things in this text',
  guessTitle: 'Guess first',
  guessQuestion: (claim) => `Who in the text says this: “${claim}”?`,
  guessRight: 'Right.',
  guessWrong: (answer) => `Not quite: it is ${answer}.`,
  guessSkip: 'Skip',
  disagree: 'Disagree with this',
  fullReading: 'See the full reading',
  replyBack: (name) => (name ? `Reply to ${name}` : 'Reply'),
  examineAny: 'Examine any article',
  author: 'the author',
  aiNote: 'AI reading of the text · not a fact check',
};

const de: ReplyCopy = {
  composerTitle: 'Eine Antwort senden',
  composerIntro:
    'Wählen Sie, für wen sie ist. BiasLens wählt die drei Befunde, die sich in Sekunden prüfen lassen; Sie wählen, was dazukommt.',
  occasionLabel: 'Für wen ist sie?',
  occasions: {
    friend: {
      label: 'Jemand hat ihn mir geschickt',
      hint: 'Kurz und neugierig. Beginnt mit einer Frage.',
    },
    group: { label: 'Ein Gruppenchat', hint: 'Nur die Befunde, kein Urteil.' },
    author: { label: 'Autor oder Zeitung', hint: 'Konkrete Fragen, höflich gestellt.' },
    public: { label: 'Ein öffentlicher Post', hint: 'Ein Bild und die Befunde.' },
    disagree: { label: 'Ich widerspreche', hint: 'Der stärkste Einwand, fair formuliert.' },
    teach: { label: 'Eine Klasse', hint: 'Alles, mit einer Frage zu jedem Befund.' },
  },
  lengthLabel: 'Länge',
  lengths: { line: 'Eine Zeile', brief: 'Kurzfassung', page: 'Ganze Seite' },
  blocksLabel: 'Mitsenden',
  blocks: {
    findings: 'Drei Befunde',
    guess: 'Erst raten',
    voices: 'Wer spricht',
    figures: 'Die Zahlen',
    assumption: 'Der tragende Schritt',
    arguments: 'Stärkstes Argument und Einwand',
    questions: 'Fragen an die Autorin oder den Autor',
  },
  nameLabel: 'Ihr Name (freiwillig)',
  namePlaceholder: 'Wird als Absender gezeigt',
  noteLabel: 'Eine Notiz (freiwillig)',
  notePlaceholder: 'Ihre eigenen Worte, mit der Antwort gesendet',
  preview: 'Was ankommt',
  create: 'Antwort-Link erstellen',
  creating: 'Wird erstellt…',
  share: 'Teilen',
  copyText: 'Text kopieren',
  copyLink: 'Link kopieren',
  copied: 'Kopiert',
  downloadImage: 'Bild herunterladen',
  openPage: 'Antwortseite öffnen',
  sendVia: 'Senden mit',
  failed: 'Die Antwort konnte nicht erstellt werden. Bitte erneut versuchen.',
  open: 'Antwort senden',
  attribution: (claim, voice) =>
    `«${claim}» ist die Erklärung von ${voice}, im Text zitiert – nicht etwas, das die Belege des Artikels selbst zeigen.`,
  figureNoSample: (value, about) =>
    `Die Zahl ${value}${about ? ` (${about})` : ''} steht ohne Stichprobengrösse oder Fehlerbereich da.`,
  figureNoSource: (value, about) =>
    `Die Zahl ${value}${about ? ` (${about})` : ''} steht ohne genannte Quelle da.`,
  oneSided: (supports, known) =>
    `${supports} von ${known} Stimmen mit einer Haltung stützen die Kernaussage des Artikels.`,
  notHeard: (who, why) => `Nicht zu Wort kommt: ${who}${why ? ` – ${why}` : ''}`,
  readingOf: (title, publication) =>
    `Eine BiasLens-Lesart von «${title}»${publication ? ` (${publication})` : ''}:`,
  questionForAuthor: 'Eine Frage an die Autorin oder den Autor:',
  sentBy: (name) =>
    name
      ? `${name} hat Ihnen eine Lesart geschickt von`
      : 'Jemand hat Ihnen eine Lesart geschickt von',
  sentNote: 'Die Notiz dazu',
  cardSent: (name) => (name ? `${name} hat Ihnen das geschickt` : 'Mit Ihnen geteilt'),
  threeThings: 'Drei Dinge in diesem Text',
  guessTitle: 'Erst raten',
  guessQuestion: (claim) => `Wer sagt im Text: «${claim}»?`,
  guessRight: 'Richtig.',
  guessWrong: (answer) => `Nicht ganz: Es ist ${answer}.`,
  guessSkip: 'Überspringen',
  disagree: 'Widersprechen',
  fullReading: 'Die ganze Lesart ansehen',
  replyBack: (name) => (name ? `${name} antworten` : 'Antworten'),
  examineAny: 'Einen beliebigen Artikel prüfen',
  author: 'die Autorin oder der Autor',
  aiNote: 'KI-Lesart des Textes · kein Faktencheck',
};

const fr: ReplyCopy = {
  composerTitle: 'Envoyer une réponse',
  composerIntro:
    'Choisissez à qui elle s’adresse. BiasLens retient les trois constats vérifiables en quelques secondes ; vous choisissez le reste.',
  occasionLabel: 'Pour qui ?',
  occasions: {
    friend: {
      label: 'Un ami me l’a envoyé',
      hint: 'Court et curieux. Commence par une devinette.',
    },
    group: { label: 'Un groupe de discussion', hint: 'Les constats seulement, sans verdict.' },
    author: { label: 'L’auteur ou le journal', hint: 'Des questions précises, posées poliment.' },
    public: { label: 'Une publication', hint: 'Une image et les constats.' },
    disagree: {
      label: 'Je ne suis pas d’accord',
      hint: 'La meilleure objection, exposée loyalement.',
    },
    teach: { label: 'Une classe', hint: 'Tout, avec une devinette par constat.' },
  },
  lengthLabel: 'Longueur',
  lengths: { line: 'Une ligne', brief: 'Résumé', page: 'Page complète' },
  blocksLabel: 'Inclure',
  blocks: {
    findings: 'Trois constats',
    guess: 'Deviner d’abord',
    voices: 'Qui parle',
    figures: 'Les chiffres',
    assumption: 'L’étape porteuse',
    arguments: 'Meilleur argument et objection',
    questions: 'Questions à l’auteur',
  },
  nameLabel: 'Votre nom (facultatif)',
  namePlaceholder: 'Affiché comme expéditeur',
  noteLabel: 'Un mot (facultatif)',
  notePlaceholder: 'Vos propres mots, envoyés avec la réponse',
  preview: 'Ce qu’ils recevront',
  create: 'Créer le lien de réponse',
  creating: 'Création…',
  share: 'Partager',
  copyText: 'Copier le texte',
  copyLink: 'Copier le lien',
  copied: 'Copié',
  downloadImage: 'Télécharger l’image',
  openPage: 'Ouvrir la page de réponse',
  sendVia: 'Envoyer avec',
  failed: 'La réponse n’a pas pu être créée. Réessayez.',
  open: 'Envoyer une réponse',
  attribution: (claim, voice) =>
    `« ${claim} » est l’explication de ${voice}, cité dans le texte, et non ce que montrent les éléments du texte lui-même.`,
  figureNoSample: (value, about) =>
    `Le chiffre ${value}${about ? ` (${about})` : ''} est donné sans taille d’échantillon ni marge d’erreur.`,
  figureNoSource: (value, about) =>
    `Le chiffre ${value}${about ? ` (${about})` : ''} est donné sans source nommée.`,
  oneSided: (supports, known) =>
    `${supports} des ${known} voix qui prennent position soutiennent l’affirmation centrale.`,
  notHeard: (who, why) => `Absent du texte : ${who}${why ? ` — ${why}` : ''}`,
  readingOf: (title, publication) =>
    `Une lecture BiasLens de « ${title} »${publication ? ` (${publication})` : ''} :`,
  questionForAuthor: 'Une question à l’auteur :',
  sentBy: (name) =>
    name ? `${name} vous a envoyé une lecture de` : 'Quelqu’un vous a envoyé une lecture de',
  sentNote: 'Son mot',
  cardSent: (name) => (name ? `${name} vous l’a envoyé` : 'Partagé avec vous'),
  threeThings: 'Trois choses dans ce texte',
  guessTitle: 'Devinez d’abord',
  guessQuestion: (claim) => `Qui dit ceci dans le texte : « ${claim} » ?`,
  guessRight: 'Exact.',
  guessWrong: (answer) => `Pas tout à fait : c’est ${answer}.`,
  guessSkip: 'Passer',
  disagree: 'Contester',
  fullReading: 'Voir la lecture complète',
  replyBack: (name) => (name ? `Répondre à ${name}` : 'Répondre'),
  examineAny: 'Examiner un autre article',
  author: 'l’auteur',
  aiNote: 'Lecture du texte par IA · pas une vérification des faits',
};

function swiss(copy: ReplyCopy): ReplyCopy {
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
  return walk(copy) as ReplyCopy;
}

const COPY: Record<OutputLanguage, ReplyCopy> = { en, de, 'de-CH': swiss(de), fr };

export function replyCopy(language: OutputLanguage): ReplyCopy {
  return COPY[language];
}
