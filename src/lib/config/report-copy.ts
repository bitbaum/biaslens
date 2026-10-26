/**
 * Every word a report screen (and a reply) shows, in the report's language.
 * The owner saw German analysis under English headings; the language of the
 * analysis now decides the language of the page around it. `de-CH` is the
 * German copy with Swiss spelling applied.
 */
import type { ClaimSupport, ClaimType, Genre, Stance } from '@/lib/analysis/report';
import { localizeSpelling, type OutputLanguage } from '@/lib/config/languages';

export interface ReportCopy {
  aiNote: string;
  genre: Record<Genre, string>;
  origin: { page: string; pdf: string; pastedWithUrl: string; pasted: string };
  openSource: string;
  truncated: string;
  bylineFromPage: string;
  jump: string;
  sections: {
    glance: string;
    keyAssumption: string;
    assumption: string;
    test: string;
    article: string;
    techniques: string;
    voices: string;
    figures: string;
    claims: string;
    strongestCase: string;
    strongestObjection: string;
    missingVoices: string;
    questions: string;
    whatWouldChange: string;
    ask: string;
    provenance: string;
  };
  nav: { article: string; voices: string; figures: string; claims: string; arguments: string };
  filters: { detection: string; voice: string; claim: string; figure: string };
  articleHint: string;
  claimType: Record<ClaimType, string>;
  support: Record<ClaimSupport, string>;
  stance: Record<Stance, string>;
  stanceToClaim: string;
  author: string;
  quoted: string;
  anonymous: string;
  noPassage: string;
  showInText: string;
  close: string;
  why: string;
  neutralWording: string;
  definition: string;
  figureFlags: { noSource: string; noSample: string; noComparison: string; source: string };
  empty: { detections: string; voices: string; figures: string };
  quotedWords: (words: number) => string;
  glance: {
    genre: (genre: string) => string;
    noVoices: string;
    voices: (total: number, supports: number, opposes: number, other: number) => string;
    oneSided: string;
    anonymous: (count: number) => string;
    figures: (total: number, unsourced: number) => string;
    polls: (count: number) => string;
    missingResponse: string;
    detections: (count: number) => string;
    noDetections: string;
  };
  provenance: {
    grounded: (found: number, proposed: number) => string;
    dropped: (count: number) => string;
    digest: string;
    notStored: string;
    download: string;
    challenge: string;
  };
}

/** Join the non-empty parts of a count sentence; zero counts are left out. */
function parts(items: (string | 0)[]): string {
  return items.filter(Boolean).join(', ');
}

const en: ReportCopy = {
  aiNote: 'AI reading of the text · not a fact check',
  genre: {
    news_report: 'News report',
    opinion: 'Opinion',
    analysis: 'Analysis',
    interview: 'Interview',
    press_release: 'Press release',
    feature: 'Feature',
    other: 'Text',
  },
  origin: {
    page: 'Text read from the linked page',
    pdf: 'Text read from the linked PDF',
    pastedWithUrl: 'Text pasted by a reader; the link was not checked against it',
    pasted: 'Text pasted by a reader; no source link given',
  },
  openSource: 'Open the original',
  truncated: 'Only the first part of the text was examined. The rest may change the reading.',
  bylineFromPage: 'Byline from the publisher’s page',
  jump: 'Jump to',
  sections: {
    glance: 'At a glance',
    keyAssumption: 'The step the argument rests on',
    assumption: 'Unstated premise',
    test: 'How to test it',
    article: 'The text, marked up',
    techniques: 'Flagged passages',
    voices: 'Who is speaking',
    figures: 'The numbers',
    claims: 'What is claimed, and by whom',
    strongestCase: 'The strongest case for it',
    strongestObjection: 'The strongest objection',
    missingVoices: 'Who is not heard',
    questions: 'Questions for the author',
    whatWouldChange: 'What would change the picture',
    ask: 'Ask about this text',
    provenance: 'How this reading was made',
  },
  nav: {
    article: 'Text',
    voices: 'Voices',
    figures: 'Numbers',
    claims: 'Claims',
    arguments: 'Arguments',
  },
  filters: { detection: 'Techniques', voice: 'Voices', claim: 'Claims', figure: 'Numbers' },
  articleHint: 'Tap a marked passage to see why it is marked.',
  claimType: {
    factual: 'Checkable fact',
    normative: 'Value judgement',
    causal: 'Cause and effect',
  },
  support: {
    data: 'Backed by figures in the text',
    citation: 'Backed by a named source',
    quoted_view: 'Someone’s view',
    none: 'No support given',
  },
  stance: {
    supports: 'Supports',
    opposes: 'Opposes',
    mixed: 'Mixed',
    neutral: 'Neutral',
    unclear: 'Unclear',
  },
  stanceToClaim: 'Position on the central claim',
  author: 'The author',
  quoted: 'quoted',
  anonymous: 'anonymous',
  noPassage: 'No exact passage found in the text.',
  showInText: 'Show in text',
  close: 'Close',
  why: 'Why it is marked',
  neutralWording: 'A neutral wording',
  definition: 'Definition',
  figureFlags: {
    noSource: 'No source named',
    noSample: 'No sample size',
    noComparison: 'No comparison',
    source: 'Source',
  },
  empty: {
    detections: 'No techniques from the catalogue were found in this text.',
    voices: 'No one else is quoted or cited.',
    figures: 'No figures carry the argument.',
  },
  quotedWords: (words) => `${words} words quoted`,
  glance: {
    genre: (genre) => `${genre}.`,
    noVoices: 'No one else is quoted; the text speaks in the author’s voice.',
    voices: (total, supports, opposes, other) =>
      `${total} ${total === 1 ? 'voice' : 'voices'} heard: ` +
      parts([
        supports && `${supports} ${supports === 1 ? 'supports' : 'support'} the central claim`,
        opposes && `${opposes} ${opposes === 1 ? 'opposes' : 'oppose'} it`,
        other && `${other} ${other === 1 ? 'takes' : 'take'} neither side`,
      ]) +
      '.',
    oneSided: 'Nearly every voice with a position is on one side.',
    anonymous: (count) => `${count} ${count === 1 ? 'voice is' : 'voices are'} anonymous.`,
    figures: (total, unsourced) =>
      `${total} ${total === 1 ? 'figure' : 'figures'}, ` +
      (unsourced ? `${unsourced} without a named source.` : 'each with a named source.'),
    polls: (count) => `${count} poll ${count === 1 ? 'result' : 'results'} without a sample size.`,
    missingResponse: 'A criticised party’s response is not reported.',
    detections: (count) => `${count} ${count === 1 ? 'passage' : 'passages'} flagged.`,
    noDetections: 'No passages flagged.',
  },
  provenance: {
    grounded: (found, proposed) =>
      `${found} of ${proposed} passages the model cited were found word for word in the text; the rest were discarded.`,
    dropped: (count) => `${count} incomplete items were discarded.`,
    digest: 'SHA-256 of the examined text',
    notStored: 'The digest identifies the text examined, not its authenticity.',
    download: 'Download the report (JSON)',
    challenge: 'Challenge the method',
  },
};

const de: ReportCopy = {
  aiNote: 'KI-Lesart des Textes · kein Faktencheck',
  genre: {
    news_report: 'Nachricht',
    opinion: 'Meinung',
    analysis: 'Analyse',
    interview: 'Interview',
    press_release: 'Medienmitteilung',
    feature: 'Reportage',
    other: 'Text',
  },
  origin: {
    page: 'Text von der verlinkten Seite gelesen',
    pdf: 'Text aus dem verlinkten PDF gelesen',
    pastedWithUrl: 'Text eingefügt; der Link wurde nicht damit abgeglichen',
    pasted: 'Text eingefügt; kein Quelllink angegeben',
  },
  openSource: 'Original öffnen',
  truncated: 'Nur der erste Teil des Textes wurde geprüft. Der Rest kann die Lesart ändern.',
  bylineFromPage: 'Autorenzeile von der Seite des Verlags',
  jump: 'Springen zu',
  sections: {
    glance: 'Auf einen Blick',
    keyAssumption: 'Der Schritt, auf dem das Argument ruht',
    assumption: 'Unausgesprochene Annahme',
    test: 'So lässt es sich prüfen',
    article: 'Der Text, markiert',
    techniques: 'Markierte Stellen',
    voices: 'Wer spricht',
    figures: 'Die Zahlen',
    claims: 'Was behauptet wird, und von wem',
    strongestCase: 'Das stärkste Argument dafür',
    strongestObjection: 'Der stärkste Einwand',
    missingVoices: 'Wer nicht zu Wort kommt',
    questions: 'Fragen an die Autorin oder den Autor',
    whatWouldChange: 'Was das Bild ändern würde',
    ask: 'Fragen zu diesem Text',
    provenance: 'Wie diese Lesart entstand',
  },
  nav: {
    article: 'Text',
    voices: 'Stimmen',
    figures: 'Zahlen',
    claims: 'Aussagen',
    arguments: 'Argumente',
  },
  filters: { detection: 'Techniken', voice: 'Stimmen', claim: 'Aussagen', figure: 'Zahlen' },
  articleHint: 'Tippen Sie auf eine markierte Stelle, um zu sehen, warum sie markiert ist.',
  claimType: {
    factual: 'Prüfbare Tatsache',
    normative: 'Werturteil',
    causal: 'Ursache und Wirkung',
  },
  support: {
    data: 'Mit Zahlen im Text belegt',
    citation: 'Mit benannter Quelle belegt',
    quoted_view: 'Eine Meinung',
    none: 'Ohne Beleg',
  },
  stance: {
    supports: 'Stützt',
    opposes: 'Widerspricht',
    mixed: 'Gemischt',
    neutral: 'Neutral',
    unclear: 'Unklar',
  },
  stanceToClaim: 'Haltung zur Kernaussage',
  author: 'Autor/in',
  quoted: 'zitiert',
  anonymous: 'anonym',
  noPassage: 'Keine wörtliche Stelle im Text gefunden.',
  showInText: 'Im Text zeigen',
  close: 'Schliessen',
  why: 'Warum markiert',
  neutralWording: 'Eine neutrale Formulierung',
  definition: 'Definition',
  figureFlags: {
    noSource: 'Keine Quelle genannt',
    noSample: 'Keine Stichprobengrösse',
    noComparison: 'Kein Vergleich',
    source: 'Quelle',
  },
  empty: {
    detections: 'Im Text wurden keine Techniken aus dem Katalog gefunden.',
    voices: 'Niemand sonst wird zitiert oder genannt.',
    figures: 'Keine Zahlen tragen das Argument.',
  },
  quotedWords: (words) => `${words} Wörter zitiert`,
  glance: {
    genre: (genre) => `${genre}.`,
    noVoices: 'Niemand sonst kommt zu Wort; der Text spricht mit der Stimme des Autors.',
    voices: (total, supports, opposes, other) =>
      `${total} ${total === 1 ? 'Stimme' : 'Stimmen'}: ` +
      parts([
        supports && `${supports} ${supports === 1 ? 'stützt' : 'stützen'} die Kernaussage`,
        opposes && `${opposes} ${opposes === 1 ? 'widerspricht' : 'widersprechen'}`,
        other && `${other} ${other === 1 ? 'bezieht' : 'beziehen'} keine Seite`,
      ]) +
      '.',
    oneSided: 'Fast alle Stimmen mit einer Haltung stehen auf einer Seite.',
    anonymous: (count) => `${count} ${count === 1 ? 'Stimme ist' : 'Stimmen sind'} anonym.`,
    figures: (total, unsourced) =>
      `${total} ${total === 1 ? 'Zahl' : 'Zahlen'}, ` +
      (unsourced ? `${unsourced} ohne genannte Quelle.` : 'jede mit genannter Quelle.'),
    polls: (count) =>
      `${count} ${count === 1 ? 'Umfrageergebnis' : 'Umfrageergebnisse'} ohne Stichprobengrösse.`,
    missingResponse: 'Die Stellungnahme einer kritisierten Seite fehlt.',
    detections: (count) => `${count} ${count === 1 ? 'Stelle' : 'Stellen'} markiert.`,
    noDetections: 'Keine Stellen markiert.',
  },
  provenance: {
    grounded: (found, proposed) =>
      `${found} von ${proposed} Stellen, die das Modell zitierte, stehen wörtlich im Text; die übrigen wurden verworfen.`,
    dropped: (count) => `${count} unvollständige Einträge wurden verworfen.`,
    digest: 'SHA-256 des geprüften Textes',
    notStored: 'Der Hashwert bezeichnet den geprüften Text, nicht seine Echtheit.',
    download: 'Bericht herunterladen (JSON)',
    challenge: 'Die Methode anfechten',
  },
};

const fr: ReportCopy = {
  aiNote: 'Lecture du texte par IA · pas une vérification des faits',
  genre: {
    news_report: 'Information',
    opinion: 'Opinion',
    analysis: 'Analyse',
    interview: 'Entretien',
    press_release: 'Communiqué',
    feature: 'Reportage',
    other: 'Texte',
  },
  origin: {
    page: 'Texte lu sur la page liée',
    pdf: 'Texte lu dans le PDF lié',
    pastedWithUrl: 'Texte collé par un lecteur ; le lien n’a pas été comparé',
    pasted: 'Texte collé par un lecteur ; aucun lien source',
  },
  openSource: 'Ouvrir l’original',
  truncated: 'Seule la première partie du texte a été examinée. La suite peut changer la lecture.',
  bylineFromPage: 'Signature lue sur la page de l’éditeur',
  jump: 'Aller à',
  sections: {
    glance: 'En bref',
    keyAssumption: 'L’étape sur laquelle repose l’argument',
    assumption: 'Prémisse implicite',
    test: 'Comment la vérifier',
    article: 'Le texte, annoté',
    techniques: 'Passages signalés',
    voices: 'Qui parle',
    figures: 'Les chiffres',
    claims: 'Ce qui est affirmé, et par qui',
    strongestCase: 'Le meilleur argument en sa faveur',
    strongestObjection: 'La meilleure objection',
    missingVoices: 'Qui n’est pas entendu',
    questions: 'Questions à l’auteur',
    whatWouldChange: 'Ce qui changerait le tableau',
    ask: 'Poser une question sur ce texte',
    provenance: 'Comment cette lecture a été faite',
  },
  nav: {
    article: 'Texte',
    voices: 'Voix',
    figures: 'Chiffres',
    claims: 'Affirmations',
    arguments: 'Arguments',
  },
  filters: { detection: 'Techniques', voice: 'Voix', claim: 'Affirmations', figure: 'Chiffres' },
  articleHint: 'Touchez un passage marqué pour voir pourquoi il l’est.',
  claimType: {
    factual: 'Fait vérifiable',
    normative: 'Jugement de valeur',
    causal: 'Cause et effet',
  },
  support: {
    data: 'Appuyé par des chiffres du texte',
    citation: 'Appuyé par une source nommée',
    quoted_view: 'Un avis',
    none: 'Sans appui',
  },
  stance: {
    supports: 'Soutient',
    opposes: 'S’oppose',
    mixed: 'Nuancé',
    neutral: 'Neutre',
    unclear: 'Incertain',
  },
  stanceToClaim: 'Position sur l’affirmation centrale',
  author: 'L’auteur',
  quoted: 'cité',
  anonymous: 'anonyme',
  noPassage: 'Aucun passage exact trouvé dans le texte.',
  showInText: 'Voir dans le texte',
  close: 'Fermer',
  why: 'Pourquoi c’est signalé',
  neutralWording: 'Une formulation neutre',
  definition: 'Définition',
  figureFlags: {
    noSource: 'Aucune source',
    noSample: 'Pas de taille d’échantillon',
    noComparison: 'Pas de comparaison',
    source: 'Source',
  },
  empty: {
    detections: 'Aucune technique du catalogue n’a été trouvée dans ce texte.',
    voices: 'Personne d’autre n’est cité.',
    figures: 'Aucun chiffre ne porte l’argument.',
  },
  quotedWords: (words) => `${words} mots cités`,
  glance: {
    genre: (genre) => `${genre}.`,
    noVoices: 'Personne d’autre n’est cité ; le texte parle avec la voix de l’auteur.',
    voices: (total, supports, opposes, other) =>
      `${total} voix : ` +
      parts([
        supports &&
          `${supports} ${supports > 1 ? 'soutiennent' : 'soutient'} l’affirmation centrale`,
        opposes && `${opposes} ${opposes > 1 ? 's’y opposent' : 's’y oppose'}`,
        other && `${other} ${other > 1 ? 'ne prennent' : 'ne prend'} pas parti`,
      ]) +
      '.',
    oneSided: 'Presque toutes les voix qui prennent position sont du même côté.',
    anonymous: (count) => `${count} ${count === 1 ? 'voix est anonyme' : 'voix sont anonymes'}.`,
    figures: (total, unsourced) =>
      `${total} ${total === 1 ? 'chiffre' : 'chiffres'}, ` +
      (unsourced ? `dont ${unsourced} sans source nommée.` : 'chacun avec une source nommée.'),
    polls: (count) =>
      `${count} ${count === 1 ? 'résultat de sondage' : 'résultats de sondage'} sans taille d’échantillon.`,
    missingResponse: 'La réponse d’une partie critiquée n’est pas rapportée.',
    detections: (count) => `${count} ${count === 1 ? 'passage signalé' : 'passages signalés'}.`,
    noDetections: 'Aucun passage signalé.',
  },
  provenance: {
    grounded: (found, proposed) =>
      `${found} des ${proposed} passages cités par le modèle figurent mot pour mot dans le texte ; les autres ont été écartés.`,
    dropped: (count) => `${count} éléments incomplets ont été écartés.`,
    digest: 'SHA-256 du texte examiné',
    notStored: 'Cette empreinte identifie le texte examiné, pas son authenticité.',
    download: 'Télécharger le rapport (JSON)',
    challenge: 'Contester la méthode',
  },
};

function swiss(copy: ReportCopy): ReportCopy {
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
  return walk(copy) as ReportCopy;
}

const COPY: Record<OutputLanguage, ReportCopy> = { en, de, 'de-CH': swiss(de), fr };

export function reportCopy(language: OutputLanguage): ReportCopy {
  return COPY[language];
}
