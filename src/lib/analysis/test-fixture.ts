/**
 * A fictional article and recorded model answers used by tests and the example
 * button. It reproduces the failures the owner saw on a real poll story:
 * the author listed as a source, a quoted expert's explanation blamed on the
 * article, two figures that do not match and a poll without sample size.
 */
export const FIXTURE_ARTICLE = [
  'Seeländer mit Wurzeln im Norden sind die treuesten Fans der Bürgerpartei',
  'Von Anna Muster',
  'Laut dem neuen Wahlbarometer des Instituts Demoskop wollen 40 Prozent der Wählerinnen und Wähler mit Wurzeln in Nordland die Bürgerpartei wählen – deutlich mehr als jede andere Gruppe mit Migrationshintergrund.',
  'In einer anderen Auswertung derselben Umfrage kommt die Partei bei dieser Gruppe auf 31 Prozent.',
  '«Patriarchale Herkunftskulturen und die Erfahrung mit dem Staatssozialismus erklären diese Nähe», sagt der Politologe Peter Beispiel vom Forschungsbüro Kompass.',
  'Parteipräsident Hans Probe sieht den Grund anderswo: «Unsere harte Linie gegen Kriminalität überzeugt gerade jene, die sich hier etwas aufgebaut haben.»',
  'Kritiker aus der Verwaltung sprechen von einer gefährlichen Entwicklung, wollen aber nicht namentlich genannt werden.',
].join('\n\n');

export const FIXTURE_READING = {
  title: 'Seeländer mit Wurzeln im Norden sind die treuesten Fans der Bürgerpartei',
  byline: { authors: ['Anna Muster'], publication: 'Seeländer Zeitung', date: null },
  genre: 'news_report',
  genre_reason: 'Berichtet über Umfrageergebnisse und zitiert Fachleute und Beteiligte.',
  summary:
    'Laut Wahlbarometer wollen 40 Prozent der Wählenden mit Wurzeln in Nordland die Bürgerpartei wählen. Ein Politologe führt das auf Herkunftskultur zurück, der Parteipräsident auf die Kriminalitätspolitik.',
  central_claim: {
    text: 'Wählende mit Wurzeln in Nordland unterstützen die Bürgerpartei stärker als andere Gruppen.',
    speaker: 'author',
    quote: 'deutlich mehr als jede andere Gruppe mit Migrationshintergrund',
  },
  voices: [
    {
      id: 'v0',
      name: 'Anna Muster',
      kind: 'person',
      affiliation: 'Autorin',
      quotes: [],
      stance: 'supports',
    },
    {
      id: 'v1',
      name: 'Peter Beispiel',
      kind: 'person',
      affiliation: 'Politologe, Forschungsbüro Kompass',
      quotes: [
        '“Patriarchale Herkunftskulturen und die Erfahrung mit dem Staatssozialismus erklären diese Nähe”',
      ],
      stance: 'supports',
    },
    {
      id: 'v2',
      name: 'Hans Probe',
      kind: 'person',
      affiliation: 'Parteipräsident',
      quotes: ['Unsere harte Linie gegen Kriminalität überzeugt gerade jene'],
      stance: 'supports',
    },
    {
      id: 'v3',
      name: 'Kritiker aus der Verwaltung',
      kind: 'anonymous',
      affiliation: null,
      quotes: ['sprechen von einer gefährlichen Entwicklung'],
      stance: 'opposes',
    },
    { id: 'v4', name: '', kind: 'person', affiliation: null, quotes: [], stance: 'unclear' },
  ],
  claims: [
    {
      text: '40 Prozent der Wählenden mit Wurzeln in Nordland wollen die Bürgerpartei wählen.',
      type: 'factual',
      speaker: 'author',
      quote:
        'wollen 40 Prozent der Wählerinnen und Wähler mit Wurzeln in Nordland die Bürgerpartei wählen',
      support: 'data',
    },
    {
      text: 'Herkunftskultur und Sozialismuserfahrung erklären die Unterstützung.',
      type: 'causal',
      speaker: 'v1',
      quote:
        'Patriarchale Herkunftskulturen und die Erfahrung mit dem Staatssozialismus erklären diese Nähe',
      support: 'quoted_view',
    },
    {
      text: 'Die Kriminalitätspolitik überzeugt diese Wählenden.',
      type: 'causal',
      speaker: 'v2',
      quote: 'This quote does not appear anywhere in the article text at all.',
      support: 'quoted_view',
    },
  ],
  numbers: [
    {
      value: '40 Prozent',
      quote: 'wollen 40 Prozent der Wählerinnen und Wähler mit Wurzeln in Nordland',
      kind: 'poll',
      about: 'Wahlabsicht für die Bürgerpartei, Wählende mit Wurzeln in Nordland',
      source: 'Wahlbarometer Demoskop',
      sample_size_stated: false,
      margin_stated: false,
      comparison_given: true,
    },
    {
      value: '31 Prozent',
      quote: 'kommt die Partei bei dieser Gruppe auf 31 Prozent',
      kind: 'poll',
      about: 'Unterstützung für die Bürgerpartei, dieselbe Gruppe',
      source: 'Wahlbarometer Demoskop',
      sample_size_stated: false,
      margin_stated: false,
      comparison_given: false,
    },
  ],
};

export const FIXTURE_ASSESSMENT = {
  detections: [
    {
      technique: 'inconsistent_figures',
      quote: 'kommt die Partei bei dieser Gruppe auf 31 Prozent',
      explanation:
        'Für dieselbe Gruppe nennt der Text 40 und 31 Prozent, ohne den Unterschied zu erklären.',
      alternative: null,
    },
    {
      technique: 'poll_without_sample',
      quote:
        'wollen 40 Prozent der Wählerinnen und Wähler mit Wurzeln in Nordland die Bürgerpartei wählen',
      explanation: 'Wie viele Personen dieser Untergruppe befragt wurden, steht nicht im Text.',
      alternative: null,
    },
    {
      technique: 'anonymous_source',
      quote: 'Kritiker aus der Verwaltung sprechen von einer gefährlichen Entwicklung',
      explanation: 'Die einzige Gegenstimme bleibt anonym.',
      alternative: null,
    },
    {
      technique: 'loaded_term',
      quote: 'A passage that the model invented and that the article does not contain.',
      explanation: 'Should be dropped because the passage is not in the text.',
      alternative: null,
    },
    {
      technique: 'not_a_technique',
      quote: 'treuesten Fans der Bürgerpartei',
      explanation: 'Unknown technique ids are dropped.',
      alternative: null,
    },
  ],
  insight: {
    headline: 'Eine Umfragezahl ist noch keine Erklärung',
    explanation:
      'Der Text zeigt eine Umfragezahl und übernimmt dann die Erklärung eines zitierten Politologen, ohne sie zu prüfen.',
    assumption: 'Die Herkunft erklärt die Wahlabsicht besser als Einkommen oder Bildung.',
    test: 'Die Wahlabsicht bei gleichem Einkommen und gleicher Bildung vergleichen.',
  },
  strongest_case:
    'Die Umfrage zeigt einen deutlichen Unterschied zu anderen Gruppen, und zwei Beteiligte bieten Erklärungen an.',
  strongest_objection:
    'Eine kleine Untergruppe in einer nationalen Umfrage schwankt stark; ohne Stichprobengrösse ist der Unterschied nicht beurteilbar.',
  missing_voices: [
    { who: 'Wählende aus Nordland selbst', why: 'Ihre eigenen Gründe kommen nicht vor.' },
  ],
  questions: [
    'Wie viele Personen mit Wurzeln in Nordland wurden befragt?',
    'Warum nennt der Text 40 und 31 Prozent?',
    'Hat jemand die Erklärung des Politologen mit Daten geprüft?',
  ],
  what_would_change: ['Die Stichprobengrösse und der Fehlerbereich der Untergruppe.'],
};
