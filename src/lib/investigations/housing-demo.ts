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
      perspective: 'official_statistics',
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
      perspective: 'market_urbanist',
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
      perspective: 'market_urbanist',
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
      perspective: 'academic',
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
      perspective: 'academic',
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
      perspective: 'market_urbanist',
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
      perspective: 'tenant_advocate',
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
    {
      id: 's-sf',
      perspective: 'academic',
      title:
        'The Effects of Rent Control Expansion on Tenants, Landlords, and Inequality: Evidence from San Francisco',
      authors: 'Diamond, McQuade & Qian',
      year: 2019,
      venue: 'American Economic Review 109(9)',
      doi: '10.1257/aer.20181289',
      url: 'https://www.aeaweb.org/articles?id=10.1257%2Faer.20181289',
      design: 'difference_in_differences',
      review: 'candidate',
      findings: [
        {
          id: 'f-stay',
          statement:
            'Rent control increased renters’ probability of staying at their address by nearly 20% and lowered displacement from San Francisco.',
          locator: 'Abstract (AER and NBER w24181)',
          outcome: 'Tenant mobility and displacement',
          population: 'San Francisco, 1994 expansion',
          horizon: 'short_run',
        },
        {
          id: 'f-supply15',
          statement:
            'Landlords treated by rent control reduced rental housing supply by 15% (selling to owner-occupants, redeveloping), causing a 5.1% citywide rent increase.',
          locator: 'Abstract (NBER w24181)',
          outcome: 'Rental supply; citywide rents',
          population: 'San Francisco, 1994 expansion',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-glaeser',
      perspective: 'market_urbanist',
      title: 'The Economic Implications of Housing Supply',
      authors: 'Glaeser & Gyourko',
      year: 2018,
      venue: 'Journal of Economic Perspectives 32(1), 3–30',
      doi: '10.1257/jep.32.1.3',
      url: 'https://www.aeaweb.org/articles?id=10.1257%2Fjep.32.1.3',
      design: 'literature_review',
      review: 'candidate',
      findings: [
        {
          id: 'f-regtax',
          statement:
            'The gap between house prices and production cost can be read as a regulatory tax; the evidence suggests, but does not definitively prove, that this implicit tax is higher in many US areas than any reasonable negative externality of new construction.',
          locator: 'Abstract',
          outcome: 'Price–cost gap',
          population: 'US housing markets',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-furman',
      perspective: 'academic',
      title: 'Supply Skepticism: Housing Supply and Affordability',
      authors: 'Been, Ellen & O’Regan (NYU Furman Center)',
      year: 2019,
      venue: 'Housing Policy Debate 29(1), 25–40',
      doi: '10.1080/10511482.2018.1476899',
      url: 'https://www.furmancenter.org/wp-content/uploads/2018/11/Supply_Skepticism_-_Final.pdf',
      design: 'literature_review',
      review: 'candidate',
      findings: [
        {
          id: 'f-necessary',
          statement:
            'Adding new homes moderates price increases and so makes housing more affordable to low- and moderate-income families, but new market-rate housing is necessary, not sufficient: government intervention is critical to add supply at prices affordable to a range of incomes.',
          locator: 'Abstract',
          outcome: 'Prices and affordability',
          population: 'US research literature',
          horizon: 'long_run',
        },
      ],
    },
    {
      id: 's-urban',
      perspective: 'tenant_advocate',
      title:
        'Rent Control: What Does the Research Tell Us about the Effectiveness of Local Action?',
      authors: 'Urban Institute',
      year: 2019,
      venue: 'Urban Institute research brief',
      doi: null,
      url: 'https://www.urban.org/sites/default/files/publication/99646/rent_control._what_does_the_research_tell_us_about_the_effectiveness_of_local_action_1.pdf',
      design: 'literature_review',
      review: 'candidate',
      findings: [
        {
          id: 'f-stability',
          statement:
            'Recent research suggests rent control reduces rents for the tenants it targets and adds residential stability and protection from eviction; it may constrain supply, but policies can be tailored to avoid this; evidence that it meets broader goals (limiting gentrification, mixed-income neighbourhoods) is limited.',
          locator: 'Summary, p. 1',
          outcome: 'Rents, stability, eviction',
          population: 'US cities (review)',
          horizon: 'short_run',
        },
      ],
    },
    {
      id: 's-oecd',
      perspective: 'international_org',
      title: 'Brick by Brick: Building Better Housing Policies',
      authors: 'OECD',
      year: 2021,
      venue: 'OECD Publishing',
      doi: '10.1787/b453b043-en',
      url: 'https://www.oecd.org/en/publications/brick-by-brick_b453b043-en.html',
      design: 'literature_review',
      review: 'candidate',
      findings: [
        {
          id: 'f-oecd-share',
          statement:
            'During 2005–15 the share of income spent on housing rose by five percentage points on average, to 31% for middle-income households across most OECD countries; to a large extent this reflects supply failing to meet demand in job-rich urban areas, with land-use and zoning rules among the constraints.',
          locator: 'Executive summary, paras 1–2',
          outcome: 'Housing cost share of income',
          population: 'OECD countries',
          horizon: 'long_run',
        },
        {
          id: 'f-oecd-tradeoff',
          statement:
            'More flexible landlord–tenant regulation, including rent control, can encourage investment and mobility, but reforms could penalise vulnerable incumbent tenants in the short term, calling for compensation such as more social housing.',
          locator: 'Executive summary, para 5',
          outcome: 'Investment, mobility, incumbent tenants',
          population: 'OECD countries',
          horizon: 'short_run',
        },
      ],
    },
    {
      id: 's-zurich',
      perspective: 'official_statistics',
      title: 'Mietpreise steigen in der Stadt Zürich um rund drei Prozent (Mietpreiserhebung 2026)',
      authors: 'Statistik Stadt Zürich',
      year: 2026,
      venue: 'Stadt Zürich',
      doi: null,
      url: 'https://www.stadt-zuerich.ch/artikel/de/statistik-und-daten/mietpreise-2026-in-der-stadt-zuerich.html',
      design: 'descriptive_statistics',
      review: 'candidate',
      findings: [
        {
          id: 'f-coop',
          statement:
            'A typical 75 m² flat rents for a median CHF 1,149 a month from non-profit owners (cooperatives, foundations; cost rent) versus CHF 1,987 from for-profit owners, a gap of CHF 838 a month; the two price ranges barely overlap.',
          locator: 'Section “Gemeinnützige Durchschnittswohnung pro Monat 840 Franken günstiger”',
          outcome: 'Net rents, existing contracts',
          population: 'City of Zurich, 2–4 room flats, 1 April 2026',
          horizon: 'long_run',
        },
        {
          id: 'f-newbuild',
          statement:
            'For-profit new builds cost a median CHF 2,907 a month for the typical flat; housing construction prices rose about 17% in six years against about 7% general city inflation.',
          locator: 'Section “Je älter der Mietvertrag, desto günstiger die Miete”',
          outcome: 'New-build rents; construction prices',
          population: 'City of Zurich, 2026',
          horizon: 'short_run',
        },
      ],
    },
    {
      id: 's-bfs',
      perspective: 'official_statistics',
      title:
        'Quelle est la part du revenu que les locataires consacrent aujourd’hui au loyer? (Federal Council answer, 24.7715)',
      authors: 'Swiss Federal Council (BFS household budget survey)',
      year: 2024,
      venue: 'Swiss Parliament',
      doi: null,
      url: 'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20247715',
      design: 'descriptive_statistics',
      review: 'candidate',
      findings: [
        {
          id: 'f-ch-burden',
          statement:
            'In the 2021 household budget survey, average rent burden was 21.7% of gross income for all households, 25.7% for incomes of CHF 4,000–6,000 and 35.2% below CHF 4,000 a month.',
          locator: 'Answer text',
          outcome: 'Rent share of gross income',
          population: 'Switzerland, 2021',
          horizon: 'unspecified',
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
    {
      id: 'l-rc-sf-stay',
      claimId: 'h-rentcontrol',
      studyId: 's-sf',
      findingId: 'f-stay',
      stance: 'supports',
      review: 'candidate',
      rationale: 'For covered tenants, rent control buys stability: fewer forced moves.',
      strengthNote: 'Quasi-experimental (1994 age-of-building cutoff); San Francisco only.',
    },
    {
      id: 'l-rc-sf-supply',
      claimId: 'h-rentcontrol',
      studyId: 's-sf',
      findingId: 'f-supply15',
      stance: 'contradicts',
      review: 'candidate',
      rationale: 'Lost rental supply raised rents citywide, shifting the burden to future renters.',
      strengthNote: 'Same design and city as the stability finding: both effects hold at once.',
    },
    {
      id: 'l-rc-urban',
      claimId: 'h-rentcontrol',
      studyId: 's-urban',
      findingId: 'f-stability',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Tenant-protection reading of the evidence: lower rents and stability for covered tenants.',
      strengthNote: 'Review brief; argues supply effects can be designed around.',
    },
    {
      id: 'l-rc-oecd',
      claimId: 'h-rentcontrol',
      studyId: 's-oecd',
      findingId: 'f-oecd-tradeoff',
      stance: 'context',
      review: 'candidate',
      rationale: 'Frames the trade-off: investment and mobility versus incumbent tenants.',
      strengthNote: 'Policy synthesis, not a new estimate.',
    },
    {
      id: 'l-rc-zurich',
      claimId: 'h-rentcontrol',
      studyId: 's-zurich',
      findingId: 'f-coop',
      stance: 'context',
      review: 'candidate',
      rationale:
        'Non-profit cost rent is a different tool from a rent cap: much lower rents for those inside.',
      strengthNote:
        'Descriptive; units differ in age and location, and allocation is not by need alone.',
    },
    {
      id: 'l-supply-glaeser',
      claimId: 'h-supply',
      studyId: 's-glaeser',
      findingId: 'f-regtax',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Prices far above construction cost point to regulation as the binding constraint.',
      strengthNote: 'Review; the authors say it suggests, not proves.',
    },
    {
      id: 'l-supply-furman',
      claimId: 'h-supply',
      studyId: 's-furman',
      findingId: 'f-necessary',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Supply moderates prices, with the caveat that market supply alone does not reach low incomes.',
      strengthNote: 'Review answering supply sceptics; US evidence.',
    },
    {
      id: 'l-supply-zurich-cost',
      claimId: 'h-supply',
      studyId: 's-zurich',
      findingId: 'f-newbuild',
      stance: 'context',
      review: 'candidate',
      rationale:
        'New supply is expensive when construction costs rise; new builds rent far above the stock.',
      strengthNote:
        'Descriptive, one city; does not test what more supply would do to the whole market.',
    },
    {
      id: 'l-drivers-oecd',
      claimId: 'c-drivers',
      studyId: 's-oecd',
      findingId: 'f-oecd-share',
      stance: 'supports',
      review: 'candidate',
      rationale:
        'Housing costs rose faster than other spending, and the OECD ties it to supply in job-rich cities.',
      strengthNote: 'Cross-country synthesis; associational for the cause.',
    },
    {
      id: 'l-contexts-ch',
      claimId: 'c-contexts',
      studyId: 's-bfs',
      findingId: 'f-ch-burden',
      stance: 'context',
      review: 'candidate',
      rationale:
        'Swiss burden is concentrated in low incomes, a different picture from the average.',
      strengthNote:
        'Swiss survey uses gross income and a different threshold than Eurostat; not comparable one-to-one.',
    },
  ],
  omissions: [
    'Why housing costs rise: the article names prices and rents but not supply, planning or construction constraints.',
    'The EU rate fell from 11.5% (2014) to 7.7% (2025) in the same Eurostat series; the article reports the level, not the trend.',
    'Whether owners and renters are affected differently; tenure is not broken out.',
    'No policy evidence: neither supply reforms nor rent regulation and their measured effects are discussed.',
  ],
  datasets: [
    {
      id: 'd-overburden',
      title: 'Housing cost overburden rate, 2025',
      unit: '% of population',
      sourceTitle: 'Eurostat tespm140, as reported by Euronews (31 Oct 2026)',
      sourceUrl:
        'https://www.euronews.com/2026/10/31/where-in-europe-do-households-spend-more-than-40-of-their-income-on-housing',
      kind: 'ranking',
      highlight: 'EU average',
      rows: [
        { label: 'Greece', value: 26.4 },
        { label: 'Switzerland', value: 15.3 },
        { label: 'Denmark', value: 14.7 },
        { label: 'Norway', value: 13.5 },
        { label: 'Germany', value: 11.2 },
        { label: 'Sweden', value: 10.8 },
        { label: 'Turkey', value: 10 },
        { label: 'Estonia', value: 8.8 },
        { label: 'Czechia', value: 8.2 },
        { label: 'Luxembourg', value: 8.1 },
        { label: 'EU average', value: 7.7 },
        { label: 'Spain', value: 7.2 },
        { label: 'France', value: 6.4 },
        { label: 'Italy', value: 5 },
        { label: 'Slovenia', value: 3.5 },
        { label: 'Slovakia', value: 3.5 },
        { label: 'Croatia', value: 3.2 },
        { label: 'Cyprus', value: 2.4 },
      ],
    },
    {
      id: 'd-eu-trend',
      title: 'EU housing cost overburden rate, 2014–2025',
      unit: '% of population',
      sourceTitle: 'Eurostat tespm140 (series as published, via eupublicdata.eu)',
      sourceUrl: 'https://eupublicdata.eu/data/countries/european-union/tespm140/',
      kind: 'series',
      rows: [
        { label: '2014', value: 11.5 },
        { label: '2015', value: 11.2 },
        { label: '2016', value: 10.9 },
        { label: '2017', value: 10.1 },
        { label: '2018', value: 9.6 },
        { label: '2019', value: 9.4 },
        { label: '2020', value: 7.8 },
        { label: '2021', value: 8.7 },
        { label: '2022', value: 8.7 },
        { label: '2023', value: 8.8 },
        { label: '2024', value: 8.2 },
        { label: '2025', value: 7.7 },
      ],
    },
    {
      id: 'd-zurich',
      title: 'Zurich: median monthly net rent of a typical 75 m² flat, 2026',
      unit: 'CHF',
      sourceTitle: 'Statistik Stadt Zürich, Mietpreiserhebung 2026',
      sourceUrl:
        'https://www.stadt-zuerich.ch/artikel/de/statistik-und-daten/mietpreise-2026-in-der-stadt-zuerich.html',
      kind: 'ranking',
      rows: [
        { label: 'Profit · new build', value: 2907 },
        { label: 'Profit · new lease', value: 2287 },
        { label: 'Profit · all leases', value: 1987 },
        { label: 'Non-profit · new build', value: 1487 },
        { label: 'Non-profit · all leases', value: 1149 },
      ],
    },
  ],
  notes:
    'Seeded demo. Every link is an unreviewed lead until a reader checks the locator and marks it reviewed.',
};
