/**
 * Demo investigation: Euronews on housing cost overburden (31 October 2026)
 * with five studies on supply constraints, upzoning and rent regulation.
 *
 * Every finding below paraphrases a passage that was opened when this file
 * was written (abstracts, the IZA discussion paper text, the Rosario paper's
 * summary). Locators name where to check it. All links are `candidate`: a
 * reader has not yet reviewed them, and the page says so.
 */
import type { Investigation } from '@/lib/domain/investigation';

export const HOUSING_DEMO_ID = 'housing-overburden-demo';

export const HOUSING_DEMO: Investigation = {
  version: 1,
  question:
    'What drives housing cost overburden in Europe, and what does quasi-experimental evidence say about the policies usually proposed?',
  article: {
    title: 'Where in Europe do people spend over 40% of their income on housing?',
    publication: 'Euronews Business',
    url: 'https://www.euronews.com/2026/10/31/where-in-europe-do-households-spend-more-than-40-of-their-income-on-housing',
    inputKind: 'url',
    publishedAt: '2026-10-31',
    reportId: null,
  },
  claims: [
    {
      id: 'c-rate',
      text: 'In 2025, 7.7% of people in the EU lived in households spending more than 40% of disposable income on housing; Greece was highest at 26.4%.',
      kind: 'empirical',
      quote: 'In the EU, it stood at 7.7% on average in 2025.',
      scope: 'EU-27, 2025, Eurostat EU-SILC indicator tespm140 (costs net of housing allowances).',
      disconfirmation:
        'Eurostat table tespm140 showing a different 2025 value for the EU or Greece.',
      lenses: [],
    },
    {
      id: 'c-drivers',
      text: 'The main drivers of overburden are housing costs (rents, prices) rising faster than incomes, especially for lower-income households.',
      kind: 'causal',
      quote:
        'The main drivers of housing cost overburden are rising costs for housing (be it rents or house prices, which are spiking in many cities) in relation to the modest growth in incomes',
      scope: 'Attributed to Dr Hannah Widmer (ETH Zürich); Europe, recent years.',
      disconfirmation:
        'Overburden rising where housing costs relative to low incomes were flat, or falling where they rose; the EU rate fell from 11.5% (2014) to 7.7% (2025), which the claim must be squared with.',
      lenses: ['supply_elasticity', 'binding_constraint', 'time_horizon', 'incidence'],
    },
    {
      id: 'c-contexts',
      text: 'High overburden in Greece, Switzerland and Denmark has different explanations and consequences.',
      kind: 'causal',
      quote:
        'the explanations for the level of the housing cost overburden in Greece, Switzerland and Denmark are not the same',
      scope: 'Attributed to Rikke Skovgaard Nielsen (Aalborg University).',
      disconfirmation: 'A single common driver explaining most of the cross-country difference.',
      lenses: ['incidence'],
    },
    {
      id: 'h-supply',
      text: 'Relaxing binding land-use constraints increases construction and lowers prices relative to the counterfactual.',
      kind: 'causal',
      quote: null,
      scope:
        'Investigation hypothesis, not stated in the article. Evidence from England and Auckland.',
      disconfirmation:
        'Upzoned areas building no more than comparable areas after the reform, or prices unrelated to regulatory restrictiveness once demand is held fixed.',
      lenses: ['supply_elasticity', 'binding_constraint', 'time_horizon', 'identification'],
    },
    {
      id: 'h-rentcontrol',
      text: 'Rent control lowers the housing cost burden.',
      kind: 'causal',
      quote: null,
      scope:
        'Investigation hypothesis, not stated in the article. Separate sitting tenants (short run) from the market as a whole (long run).',
      disconfirmation:
        'Controlled rents not slower than uncontrolled; or decontrol raising supply and lowering market rents.',
      lenses: ['time_horizon', 'incidence', 'identification', 'binding_constraint'],
    },
  ],
  studies: [
    {
      id: 's-eurostat',
      title: 'Housing cost overburden rate (tespm140)',
      authors: 'Eurostat',
      year: 2026,
      venue: 'Eurostat database (EU-SILC, source dataset ilc_lvho07a)',
      doi: null,
      url: 'https://ec.europa.eu/eurostat/databrowser/view/tespm140/default/table',
      design: 'descriptive_statistics',
      review: 'candidate',
      findings: [
        {
          id: 'f-definition',
          statement:
            'Share of the population in households where total housing costs, net of housing allowances, exceed 40% of disposable income (also net of allowances).',
          locator: 'Indicator definition, tespm140',
          outcome: 'Housing cost overburden rate',
          population: 'EU-27',
          horizon: 'unspecified',
        },
      ],
    },
    {
      id: 's-hilber',
      title: 'The Impact of Supply Constraints on House Prices in England',
      authors: 'Hilber & Vermeulen',
      year: 2016,
      venue: 'The Economic Journal 126(591), 358–405',
      doi: '10.1111/ecoj.12213',
      url: 'https://academic.oup.com/ej/article-abstract/126/591/358/5077428',
      design: 'instrumental_variables',
      review: 'candidate',
      findings: [
        {
          id: 'f-35',
          statement:
            'Regulatory constraints (measured by refusal rates of major residential projects) raise the response of house prices to local earnings; the baseline estimate implies English house prices would have been about 35% lower in 2008 without them.',
          locator: 'Abstract and conclusion (LSE working paper version)',
          outcome: 'House prices',
          population: 'England, local planning authorities, 1974–2008',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-auckland',
      title: 'The impact of upzoning on housing construction in Auckland',
      authors: 'Greenaway-McGrevy & Phillips',
      year: 2023,
      venue: 'Journal of Urban Economics 136, 103555',
      doi: '10.1016/j.jue.2023.103555',
      url: 'https://www.sciencedirect.com/science/article/abs/pii/S0094119023000244',
      design: 'difference_in_differences',
      review: 'candidate',
      findings: [
        {
          id: 'f-construction',
          statement:
            'The 2016 upzoning of about three quarters of residential land stimulated construction; effects stay significant under implausibly large displacement from non-upzoned areas.',
          locator: 'Abstract',
          outcome: 'Dwelling consents',
          population: 'Auckland, New Zealand, 2016–2021',
          horizon: 'short_run',
        },
        {
          id: 'f-26903',
          statement:
            'Collapsing the counterfactual set to the extrapolated trend, the policy generated about 26,903 additional consents by 2021, about 5% of the dwelling stock; long-term effects not yet realized.',
          locator: 'Abstract, working paper version (ePrints Soton 476826)',
          outcome: 'Dwelling consents',
          population: 'Auckland, New Zealand, 2016–2021',
          horizon: 'short_run',
        },
      ],
    },
    {
      id: 's-cambridge',
      title:
        'Housing Market Spillovers: Evidence from the End of Rent Control in Cambridge, Massachusetts',
      authors: 'Autor, Palmer & Pathak',
      year: 2014,
      venue: 'Journal of Political Economy 122(3), 661–717',
      doi: '10.1086/675536',
      url: 'https://www.journals.uchicago.edu/doi/full/10.1086/675536',
      design: 'difference_in_differences',
      review: 'candidate',
      findings: [
        {
          id: 'f-spillover',
          statement:
            'Ending rent control in 1995 raised the value of both decontrolled and never-controlled nearby properties; decontrol added about $1.8 billion to Cambridge housing values 1994–2004, about $1.0 billion of it from spillovers to never-controlled properties.',
          locator: 'Abstract',
          outcome: 'Assessed and transacted property values',
          population: 'Cambridge, Massachusetts, 1994–2004',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-kholodilin',
      title:
        'Rent control effects through the lens of empirical research: An almost complete review of the literature',
      authors: 'Kholodilin',
      year: 2024,
      venue: 'Journal of Housing Economics 63, 101983',
      doi: '10.1016/j.jhe.2024.101983',
      url: 'https://ideas.repec.org/a/eee/jhouse/v63y2024ics1051137724000020.html',
      design: 'literature_review',
      review: 'candidate',
      findings: [
        {
          id: 'f-slows',
          statement:
            'Rent controls appear quite effective at slowing the growth of rents for controlled dwellings.',
          locator: 'Abstract',
          outcome: 'Rents of controlled dwellings',
          population: 'Studies across several continents',
          horizon: 'short_run',
        },
        {
          id: 'f-adverse',
          statement:
            'The policy also leads to a wide range of adverse effects; the literature identifies 26 effects, the most studied being controlled rents, mobility, home ownership, construction and housing quality.',
          locator: 'Abstract; section on empirically identified effects (Table 1)',
          outcome: 'Mobility, construction, quality and others',
          population: 'Studies across several continents',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-argentina',
      title: 'The Impact of the Chainsaw-Liberation on the Rental Housing Market in Buenos Aires',
      authors: 'Elfert & Thomsen',
      year: 2025,
      venue: 'IZA Discussion Paper 18107',
      doi: null,
      url: 'https://docs.iza.org/dp18107.pdf',
      design: 'regression_discontinuity',
      review: 'candidate',
      findings: [
        {
          id: 'f-supply46',
          statement:
            'After the December 2023 repeal of the rental law, rental supply rose at the cutoff by roughly 46% (about 2,670 units) in the local linear specification; nominal and real rents declined, though significance varies across specifications.',
          locator: 'Section 5, Table 2 (39-week bandwidth)',
          outcome: 'Rental listings and rent indices',
          population: 'Buenos Aires, 2023–2024',
          horizon: 'short_run',
        },
      ],
    },
    {
      id: 's-rosario',
      title:
        'Desregulación del mercado de alquileres residenciales y acceso a la vivienda en Rosario (2023-2026)',
      authors: 'Lapelle',
      year: 2026,
      venue: 'Jornadas CTEI, Universidad Nacional de Rosario',
      doi: null,
      url: 'https://jornadasctei.unr.edu.ar/wp-content/uploads/2026/10/291-Desregulacion-del-mercado-Hernan-Lapelle.pdf',
      design: 'descriptive_statistics',
      review: 'candidate',
      findings: [
        {
          id: 'f-rosario',
          statement:
            'Listings rose from 687 units (Dec 2023) to 2,616 (May 2026); the rent-to-wage ratio for a two-bedroom flat fell from 55.8% to 41.2% by March 2024 but rose again above 54% in 2026.',
          locator: 'Summary (resumen)',
          outcome: 'Listings; rent-to-wage ratio',
          population: 'Rosario, Argentina, 2023–2026',
          horizon: 'long_run',
        },
      ],
    },
  ],
  links: [
    {
      id: 'l-rate-def',
      claimId: 'c-rate',
      studyId: 's-eurostat',
      findingId: 'f-definition',
      stance: 'supports',
      review: 'candidate',
      rationale: 'The article cites this indicator; the definition fixes what the 7.7% measures.',
      strengthNote: 'Official statistic; a measurement, not an explanation. Survey-based.',
    },
    {
      id: 'l-drivers-hilber',
      claimId: 'c-drivers',
      studyId: 's-hilber',
      findingId: 'f-35',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Gives a mechanism for "rising costs" that the article does not name: binding supply constraints make prices rise with demand.',
      strengthNote:
        'Instrumented panel for England only; transfer to Greece or Denmark is untested.',
    },
    {
      id: 'l-drivers-eurostat',
      claimId: 'c-drivers',
      studyId: 's-eurostat',
      findingId: 'f-definition',
      stance: 'context',
      review: 'candidate',
      rationale:
        'The ratio has a numerator (costs) and a denominator (income); the claim speaks to both.',
      strengthNote: 'Definitional; cannot separate cost growth from income growth.',
    },
    {
      id: 'l-supply-hilber',
      claimId: 'h-supply',
      studyId: 's-hilber',
      findingId: 'f-35',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Regulatory restrictiveness is linked to higher prices holding demand shocks fixed.',
      strengthNote: 'Quasi-causal (instruments for regulation); long run; England.',
    },
    {
      id: 'l-supply-auckland',
      claimId: 'h-supply',
      studyId: 's-auckland',
      findingId: 'f-construction',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Upzoning (relaxing a binding constraint) raised construction against a trend counterfactual.',
      strengthNote:
        'Quasi-experimental, robust to displacement; measures consents, not prices, over five years.',
    },
    {
      id: 'l-supply-auckland-size',
      claimId: 'h-supply',
      studyId: 's-auckland',
      findingId: 'f-26903',
      stance: 'context',
      review: 'candidate',
      rationale: 'Size of the effect relative to the stock.',
      strengthNote: 'Point estimate depends on the extrapolated-trend counterfactual.',
    },
    {
      id: 'l-rc-slows',
      claimId: 'h-rentcontrol',
      studyId: 's-kholodilin',
      findingId: 'f-slows',
      stance: 'supports',
      review: 'candidate',
      rationale: 'For sitting tenants in controlled units, rents grow more slowly.',
      strengthNote:
        'Review of studies of mixed design; supports the short-run, controlled-unit reading only.',
    },
    {
      id: 'l-rc-adverse',
      claimId: 'h-rentcontrol',
      studyId: 's-kholodilin',
      findingId: 'f-adverse',
      stance: 'contradicts',
      review: 'candidate',
      rationale:
        'Effects on construction, quality and mobility work against the market-wide burden.',
      strengthNote: 'Review; counts of studies are not effect sizes.',
    },
    {
      id: 'l-rc-cambridge',
      claimId: 'h-rentcontrol',
      studyId: 's-cambridge',
      findingId: 'f-spillover',
      stance: 'context',
      review: 'candidate',
      rationale:
        'Shows controls had external costs on neighbouring properties; property values, not tenant burden.',
      strengthNote: 'Strong design (decontrol shock, treated vs never-controlled); one US city.',
    },
    {
      id: 'l-rc-argentina',
      claimId: 'h-rentcontrol',
      studyId: 's-argentina',
      findingId: 'f-supply46',
      stance: 'contradicts',
      review: 'candidate',
      rationale: 'Removing regulation released withheld supply and rents fell in the short run.',
      strengthNote:
        'RDD on a date cutoff; local, short-run, high-inflation context; the authors call it preliminary.',
    },
    {
      id: 'l-rc-rosario',
      claimId: 'h-rentcontrol',
      studyId: 's-rosario',
      findingId: 'f-rosario',
      stance: 'context',
      review: 'candidate',
      rationale: 'The early relief in rent-to-wage faded by 2025–2026 as wages lagged rents.',
      strengthNote: 'Descriptive, one city, no counterfactual; separates horizons.',
    },
  ],
  omissions: [
    'Why housing costs rise: the article names prices and rents but not supply, planning or construction constraints.',
    'The EU rate fell from 11.5% (2014) to 7.7% (2025) in the same Eurostat series; the article reports the level, not the trend.',
    'Whether owners and renters are affected differently; tenure is not broken out.',
    'No policy evidence: neither supply reforms nor rent regulation and their measured effects are discussed.',
  ],
  notes:
    'Seeded demo. Every link is an unreviewed lead until a reader checks the locator and marks it reviewed.',
};
