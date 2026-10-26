/**
 * Occasions are presets: a length and a set of blocks. The sender picks an
 * occasion first and can still change everything after.
 */
export const REPLY_LENGTHS = ['line', 'brief', 'page'] as const;
export type ReplyLength = (typeof REPLY_LENGTHS)[number];

/** Sections a reply page can show, in the order they appear. */
export const REPLY_BLOCKS = [
  'findings',
  'guess',
  'voices',
  'figures',
  'assumption',
  'arguments',
  'questions',
] as const;
export type ReplyBlock = (typeof REPLY_BLOCKS)[number];

export const OCCASIONS = {
  friend: { length: 'line', blocks: ['findings', 'guess'] },
  group: { length: 'line', blocks: ['findings'] },
  author: { length: 'brief', blocks: ['findings', 'questions'] },
  public: { length: 'brief', blocks: ['findings', 'voices'] },
  disagree: { length: 'brief', blocks: ['findings', 'arguments', 'questions'] },
  teach: { length: 'page', blocks: [...REPLY_BLOCKS] },
} as const satisfies Record<string, { length: ReplyLength; blocks: readonly ReplyBlock[] }>;

export type Occasion = keyof typeof OCCASIONS;
export const OCCASION_IDS = Object.keys(OCCASIONS) as Occasion[];

export function isOccasion(value: unknown): value is Occasion {
  return typeof value === 'string' && Object.hasOwn(OCCASIONS, value);
}

export function isReplyLength(value: unknown): value is ReplyLength {
  return typeof value === 'string' && (REPLY_LENGTHS as readonly string[]).includes(value);
}

export function isReplyBlock(value: unknown): value is ReplyBlock {
  return typeof value === 'string' && (REPLY_BLOCKS as readonly string[]).includes(value);
}
