/** Product paths and canonical development surfaces. Hosting identifiers stay stable. */
export const ROUTES = {
  home: '/',
  explore: '/explore',
  analyze: '/analyze',
  account: '/account',
  methodology: '/methodology',
  whitepaper: '/whitepaper',
  development: '/development',
  blog: '/blog',
  arena: '/debates',
} as const;

export const PROJECT_LINKS = {
  repository: 'https://github.com/bitbaum/biaslens',
  profile: 'https://loki.orangecat.ch/fleet/biaslens',
  changes: 'https://github.com/bitbaum/biaslens/pulls?q=is%3Apr+is%3Amerged',
  challenge: 'https://github.com/bitbaum/biaslens/issues/new?template=methodology-challenge.yml',
} as const;
