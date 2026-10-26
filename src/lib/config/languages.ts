/**
 * Languages a report can be written in. SSOT for the input boundary, the
 * prompts and the report copy. `de-CH` is Swiss Standard German: the model is
 * told to write "ss", and generated text is post-processed so a stray "ß"
 * cannot reach a Swiss reader.
 */
export const OUTPUT_LANGUAGES = {
  en: { label: 'English', model: 'English', html: 'en' },
  de: { label: 'Deutsch', model: 'German', html: 'de' },
  'de-CH': {
    label: 'Deutsch (Schweiz)',
    model: 'Swiss Standard German (Schweizer Hochdeutsch): never use the letter ß, always write ss',
    html: 'de-CH',
  },
  fr: { label: 'Français', model: 'French', html: 'fr' },
} as const;

export type OutputLanguage = keyof typeof OUTPUT_LANGUAGES;

export const OUTPUT_LANGUAGE_CODES = Object.keys(OUTPUT_LANGUAGES) as OutputLanguage[];

export function isOutputLanguage(value: unknown): value is OutputLanguage {
  return typeof value === 'string' && Object.hasOwn(OUTPUT_LANGUAGES, value);
}

/** Best guess from a browser locale list; Swiss German readers get Swiss spelling. */
export function languageFromLocales(locales: readonly string[]): OutputLanguage {
  for (const locale of locales) {
    const lower = locale.toLowerCase();
    if (lower === 'de-ch' || lower === 'gsw' || lower.startsWith('gsw-')) return 'de-CH';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

/** Swiss orthography for generated (never quoted) text. */
export function localizeSpelling(text: string, language: OutputLanguage): string {
  return language === 'de-CH' ? text.replace(/ß/g, 'ss') : text;
}
