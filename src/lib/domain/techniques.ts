/**
 * The catalogue of writing techniques BiasLens may flag. SSOT: the prompt lists
 * these ids and definitions, the report renders their names, and /methodology
 * publishes every field. A detection is shown only with an exact passage.
 *
 * A technique is an observable feature of a text, not a verdict on its author.
 * Opinion pieces are expected to argue; several techniques are normal there,
 * which is why the report always states the genre next to the flags.
 */
import type { OutputLanguage } from '@/lib/config/languages';

type Localized = Record<'en' | 'de' | 'fr', string>;

export interface Technique {
  id: string;
  name: Localized;
  /** One sentence shown next to a flag, in the report language. */
  short: Localized;
  countsWhen: string;
  doesNotCountWhen: string;
  whyItMatters: string;
}

export const TECHNIQUES = [
  {
    id: 'loaded_term',
    name: { en: 'Loaded word', de: 'Wertendes Wort', fr: 'Terme connoté' },
    short: {
      en: 'An evaluative word where a neutral one would say the same thing.',
      de: 'Ein wertendes Wort, wo ein neutrales dasselbe sagen würde.',
      fr: 'Un mot évaluatif là où un mot neutre dirait la même chose.',
    },
    countsWhen:
      'The author (not a quoted person) uses an emotionally or morally charged word for a person, group, policy or event, and a neutral word with the same factual content exists.',
    doesNotCountWhen:
      'The word appears inside a quotation, is the established technical or legal term, or the piece is labelled opinion and the word states the author’s openly argued position.',
    whyItMatters: 'Charged words carry a judgement into the reader before any evidence does.',
  },
  {
    id: 'unattributed_assertion',
    name: {
      en: 'Claim without a source',
      de: 'Behauptung ohne Quelle',
      fr: 'Affirmation sans source',
    },
    short: {
      en: 'A checkable claim stated in the author’s voice with no source given.',
      de: 'Eine überprüfbare Behauptung in der Stimme des Autors, ohne Quellenangabe.',
      fr: 'Une affirmation vérifiable, dans la voix de l’auteur, sans source.',
    },
    countsWhen:
      'A factual claim that a reader could check is presented as established, and the text names no person, document, data set or link for it.',
    doesNotCountWhen:
      'The fact is common knowledge (a date, an office holder), or the source is given elsewhere in the text for the same claim.',
    whyItMatters: 'Without a source a reader cannot tell reporting from assumption.',
  },
  {
    id: 'anonymous_source',
    name: { en: 'Anonymous source', de: 'Anonyme Quelle', fr: 'Source anonyme' },
    short: {
      en: 'A claim rests on a source the reader cannot identify.',
      de: 'Eine Aussage stützt sich auf eine Quelle, die Leser nicht identifizieren können.',
      fr: 'Une affirmation repose sur une source que le lecteur ne peut pas identifier.',
    },
    countsWhen:
      'A claim is attributed to “insiders”, “experts”, “critics”, “sources close to …” or a similar unnamed group.',
    doesNotCountWhen:
      'The text explains why the source is anonymous and what the publication did to verify it.',
    whyItMatters:
      'Anonymity can protect sources, but the reader then relies entirely on the outlet’s judgement.',
  },
  {
    id: 'missing_response',
    name: {
      en: 'No response from the other side',
      de: 'Keine Stellungnahme der Gegenseite',
      fr: 'Pas de réponse de l’autre partie',
    },
    short: {
      en: 'A person or group is criticised and their response is neither reported nor said to have been sought.',
      de: 'Eine Person oder Gruppe wird kritisiert, ihre Stellungnahme fehlt und wurde auch nicht erwähnt.',
      fr: 'Une personne ou un groupe est critiqué sans que sa réponse soit rapportée ou demandée.',
    },
    countsWhen:
      'An identifiable person or organisation is accused or criticised and the text neither quotes their reply nor says one was requested.',
    doesNotCountWhen:
      'The text reports a reply, a refusal to comment, or an attempt to reach them.',
    whyItMatters: 'Hearing one party only is the most common way a news report takes a side.',
  },
  {
    id: 'number_without_base',
    name: {
      en: 'Number without a comparison',
      de: 'Zahl ohne Vergleichsgrösse',
      fr: 'Chiffre sans point de comparaison',
    },
    short: {
      en: 'A figure is given without the base, trend or comparison needed to judge its size.',
      de: 'Eine Zahl ohne die Basis, den Verlauf oder den Vergleich, die nötig sind, um sie einzuordnen.',
      fr: 'Un chiffre donné sans la base, l’évolution ou la comparaison nécessaires pour le juger.',
    },
    countsWhen:
      'An absolute number or a change is presented as large or small without a denominator, a base rate, a previous value or a comparison group.',
    doesNotCountWhen: 'The comparison is given nearby in the text.',
    whyItMatters:
      '“1,000 cases” means something very different out of 2,000 than out of 2 million.',
  },
  {
    id: 'poll_without_sample',
    name: {
      en: 'Poll without sample size',
      de: 'Umfrage ohne Stichprobengrösse',
      fr: 'Sondage sans taille d’échantillon',
    },
    short: {
      en: 'A poll result is reported without the number of respondents or the margin of error.',
      de: 'Ein Umfrageergebnis ohne Zahl der Befragten oder Fehlerbereich.',
      fr: 'Un résultat de sondage sans nombre de répondants ni marge d’erreur.',
    },
    countsWhen:
      'A survey or poll percentage, especially for a subgroup, is reported with neither the number of respondents nor a margin of error.',
    doesNotCountWhen: 'The sample size or margin of error for that figure is stated.',
    whyItMatters:
      'Subgroups in national polls are often a few hundred people; a difference of a few points may be noise.',
  },
  {
    id: 'inconsistent_figures',
    name: {
      en: 'Figures that do not match',
      de: 'Zahlen, die nicht zusammenpassen',
      fr: 'Chiffres incohérents',
    },
    short: {
      en: 'Two figures in the text appear to describe the same thing but differ.',
      de: 'Zwei Zahlen im Text scheinen dasselbe zu beschreiben, weichen aber voneinander ab.',
      fr: 'Deux chiffres du texte semblent décrire la même chose mais diffèrent.',
    },
    countsWhen:
      'The text gives two different values for what reads as the same population, period and measure, without explaining the difference.',
    doesNotCountWhen: 'The text explains that the figures measure different things.',
    whyItMatters: 'An unexplained difference means at least one figure is being read wrongly.',
  },
  {
    id: 'causal_leap',
    name: { en: 'Causal leap', de: 'Kausaler Sprung', fr: 'Saut causal' },
    short: {
      en: 'A correlation or a sequence of events is presented as a cause.',
      de: 'Ein Zusammenhang oder eine zeitliche Abfolge wird als Ursache dargestellt.',
      fr: 'Une corrélation ou une succession d’événements est présentée comme une cause.',
    },
    countsWhen:
      'The text states or implies that X caused Y on the basis of their co-occurrence or order, without evidence that rules out other causes.',
    doesNotCountWhen:
      'The causal claim is explicitly attributed to a named person as their explanation and the text presents it as such, or the text cites a study designed to test causation.',
    whyItMatters: 'Most disagreements about policy are disagreements about causes.',
  },
  {
    id: 'speculation_as_fact',
    name: {
      en: 'Speculation stated as fact',
      de: 'Vermutung als Tatsache',
      fr: 'Spéculation présentée comme un fait',
    },
    short: {
      en: 'A prediction, motive or inference is stated as if it were established.',
      de: 'Eine Prognose, ein Motiv oder eine Schlussfolgerung wird als feststehend dargestellt.',
      fr: 'Une prévision, un motif ou une déduction est présenté comme établi.',
    },
    countsWhen:
      'Future effects, someone’s intentions or unobserved states are asserted without hedging or evidence.',
    doesNotCountWhen: 'The text marks the statement as an expectation, estimate or opinion.',
    whyItMatters: 'Readers remember the statement, not the missing “probably”.',
  },
  {
    id: 'headline_body_gap',
    name: {
      en: 'Headline claims more',
      de: 'Titel behauptet mehr',
      fr: 'Le titre en dit plus',
    },
    short: {
      en: 'The headline or lead states more than the body of the text supports.',
      de: 'Titel oder Lead behaupten mehr, als der Text belegt.',
      fr: 'Le titre ou le chapeau affirme plus que ce que le texte soutient.',
    },
    countsWhen:
      'The headline or lead generalises, intensifies or drops a qualification that the body keeps.',
    doesNotCountWhen: 'The body supports the headline as written.',
    whyItMatters: 'Many readers see only the headline.',
  },
  {
    id: 'characterisation_of_person',
    name: {
      en: 'Characterising a person',
      de: 'Charakterisierung einer Person',
      fr: 'Caractérisation d’une personne',
    },
    short: {
      en: 'A person is described with an adjective about their character instead of what they did or said.',
      de: 'Eine Person wird mit einer Eigenschaft beschrieben statt mit dem, was sie tat oder sagte.',
      fr: 'Une personne est décrite par un trait de caractère plutôt que par ce qu’elle a fait ou dit.',
    },
    countsWhen:
      'The author attaches a judgement of character or motive to a named person (“the controversial”, “the notorious”, “the visionary”).',
    doesNotCountWhen: 'The description is a verifiable role or fact.',
    whyItMatters: 'A label decides the reader’s view of the person before their argument is heard.',
  },
  {
    id: 'scare_quotes',
    name: {
      en: 'Distancing quotation marks',
      de: 'Distanzierende Anführungszeichen',
      fr: 'Guillemets de distance',
    },
    short: {
      en: 'Quotation marks are used to cast doubt on a term rather than to quote someone.',
      de: 'Anführungszeichen stellen einen Begriff infrage, statt jemanden zu zitieren.',
      fr: 'Des guillemets mettent un terme en doute au lieu de citer quelqu’un.',
    },
    countsWhen: 'A single word or short phrase is placed in quotation marks without attribution.',
    doesNotCountWhen: 'The marks quote a named speaker or a title.',
    whyItMatters: 'Doubt is implied without being argued.',
  },
  {
    id: 'agentless_passive',
    name: {
      en: 'Who acted is left out',
      de: 'Wer handelte, bleibt offen',
      fr: 'L’auteur de l’action est omis',
    },
    short: {
      en: 'A passive or impersonal phrase hides who did something consequential.',
      de: 'Eine Passiv- oder unpersönliche Form verschweigt, wer etwas Folgenreiches tat.',
      fr: 'Une tournure passive ou impersonnelle cache qui a agi.',
    },
    countsWhen:
      'A consequential action (a decision, an injury, a cut) is described without the actor, and the actor is known or knowable.',
    doesNotCountWhen: 'The actor is genuinely unknown or named in the same passage.',
    whyItMatters: 'Responsibility disappears from the sentence.',
  },
  {
    id: 'emotional_appeal',
    name: {
      en: 'Emotion in place of evidence',
      de: 'Emotion statt Beleg',
      fr: 'L’émotion à la place de la preuve',
    },
    short: {
      en: 'A vivid anecdote or image carries the argument where evidence would be needed.',
      de: 'Eine anschauliche Anekdote trägt das Argument, wo ein Beleg nötig wäre.',
      fr: 'Une anecdote frappante porte l’argument là où une preuve serait nécessaire.',
    },
    countsWhen:
      'A single case or emotive description is used to support a general claim that it cannot establish on its own.',
    doesNotCountWhen: 'The anecdote illustrates a claim that is separately supported.',
    whyItMatters: 'One memorable case outweighs a table of numbers in the reader’s mind.',
  },
  {
    id: 'false_dichotomy',
    name: { en: 'Only two options', de: 'Nur zwei Optionen', fr: 'Fausse alternative' },
    short: {
      en: 'The text presents two options as the only ones when others exist.',
      de: 'Der Text stellt zwei Möglichkeiten als die einzigen dar, obwohl es weitere gibt.',
      fr: 'Le texte présente deux options comme les seules possibles alors qu’il en existe d’autres.',
    },
    countsWhen: 'The author frames a choice as either/or while plausible alternatives exist.',
    doesNotCountWhen: 'The options really are exhaustive (a yes/no vote).',
    whyItMatters: 'Rejecting one option is made to look like accepting the other.',
  },
  {
    id: 'omitted_context',
    name: { en: 'Missing context', de: 'Fehlender Kontext', fr: 'Contexte manquant' },
    short: {
      en: 'The text itself points to context that would change the reading but does not give it.',
      de: 'Der Text deutet selbst auf Kontext hin, der die Lesart ändern würde, liefert ihn aber nicht.',
      fr: 'Le texte évoque un contexte qui changerait la lecture sans le fournir.',
    },
    countsWhen:
      'The text mentions or implies a relevant comparison, history or condition and leaves it out where it matters for the conclusion.',
    doesNotCountWhen:
      'The missing context is only known from outside knowledge the text gives no hint of. BiasLens examines the text, not the world.',
    whyItMatters: 'Selection is the quietest form of framing.',
  },
] as const satisfies readonly Technique[];

export type TechniqueId = (typeof TECHNIQUES)[number]['id'];

export const TECHNIQUE_IDS = TECHNIQUES.map((technique) => technique.id) as TechniqueId[];

const byId = new Map<string, Technique>(TECHNIQUES.map((technique) => [technique.id, technique]));

export function isTechniqueId(value: unknown): value is TechniqueId {
  return typeof value === 'string' && byId.has(value);
}

export function technique(id: TechniqueId): Technique {
  return byId.get(id)!;
}

function localeKey(language: OutputLanguage): 'en' | 'de' | 'fr' {
  return language === 'de-CH' ? 'de' : language;
}

export function techniqueName(id: TechniqueId, language: OutputLanguage): string {
  const name = technique(id).name[localeKey(language)];
  return language === 'de-CH' ? name.replace(/ß/g, 'ss') : name;
}

export function techniqueShort(id: TechniqueId, language: OutputLanguage): string {
  const short = technique(id).short[localeKey(language)];
  return language === 'de-CH' ? short.replace(/ß/g, 'ss') : short;
}

/** The catalogue as the model sees it: id, definition, inclusion and exclusion. */
export function techniqueCatalogueForPrompt(): string {
  return TECHNIQUES.map(
    (item) =>
      `- ${item.id}: ${item.short.en} Counts when: ${item.countsWhen} Does not count when: ${item.doesNotCountWhen}`,
  ).join('\n');
}
