/**
 * Labels BiasLens never applies in its own voice. A model may describe what
 * a text does; it may not classify an article, outlet or person on a political
 * axis or as "biased" / "propaganda". These words may still appear inside an
 * exact quotation, or inside quotation marks when a source's own words are
 * reported. Published on /methodology.
 */
export const SYSTEM_FORBIDDEN_LABELS = {
  en: [
    'left-wing',
    'right-wing',
    'far-left',
    'far-right',
    'leftist',
    'rightist',
    'left-leaning',
    'right-leaning',
    'centre-left',
    'center-left',
    'centre-right',
    'center-right',
    'propaganda',
    'mainstream media',
    'fake news',
    'biased',
  ],
  de: [
    'linksgerichtet',
    'rechtsgerichtet',
    'linksradikal',
    'rechtsradikal',
    'linksextrem',
    'rechtsextrem',
    'linkspopulistisch',
    'rechtspopulistisch',
    'rechtskonservativ',
    'linksliberal',
    'linkslastig',
    'rechtslastig',
    'politisch links',
    'politisch rechts',
    'Propaganda',
    'Lügenpresse',
    'Systemmedien',
    'Mainstreammedien',
    'Mainstream-Medien',
  ],
  fr: [
    'de gauche',
    'de droite',
    'extrême droite',
    'extrême gauche',
    'gauchiste',
    'droitier',
    'propagande',
  ],
} as const;

const ALL_LABELS = Object.values(SYSTEM_FORBIDDEN_LABELS).flat();

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole words only, case-insensitive, any inflection that keeps the stem
// (rechtspopulistische, linksgerichteten, biased → not "biases").
const PATTERN = new RegExp(
  '(?<![\\p{L}-])(?:' + ALL_LABELS.map(escape).join('|') + ')\\p{L}{0,3}(?![\\p{L}])',
  'giu',
);

/** Remove spans already inside quotation marks: reported words are allowed. */
function withoutQuotedSpans(text: string): string {
  return text.replace(/["“„«‹][^"“”„«»‹›]{1,200}["”“»›]/gu, ' ');
}

export function forbiddenLabelsIn(text: string): string[] {
  const found = withoutQuotedSpans(text).match(PATTERN) ?? [];
  return [...new Set(found.map((word) => word.toLowerCase()))].filter(
    (word) => word !== 'biases' && word !== 'biasedness',
  );
}

/**
 * Last resort after one repair attempt: drop the sentences that apply a
 * forbidden label. Deterministic, and it never edits quoted article text.
 */
export function stripForbiddenSentences(text: string): string {
  if (forbiddenLabelsIn(text).length === 0) return text;
  const sentences = text.match(/[^.!?]+[.!?]*\s*/gu) ?? [text];
  return sentences
    .filter((sentence) => forbiddenLabelsIn(sentence).length === 0)
    .join('')
    .trim();
}
