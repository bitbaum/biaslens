// BiasLens core data model — Milestone 1.
// The ubiquitous language from the spec, as the single source of truth for types.
// Principle: separate facts (Claim/Evidence) from interpretation (Narrative/Frame);
// every score is explainable (carries its inputs), reproducible, and challengeable.
//
// PARITY NOTE — this schema describes the tables Prisma's initial migration
// (`20260714233936_init`) already created. Every table, column, index, and FK
// name below matches that migration byte-for-byte ("Outlet", "outletId",
// "Article_outletId_idx", "Article_outletId_fkey", …), so Drizzle's fresh-DB
// migration produces the same physical schema and an existing DB needs only a
// baseline mark, never a structural change. Ids are cuids minted client-side
// (Prisma `@default(cuid())` was also client-side — the columns carry no DB
// default), and `EditorialDna.updatedAt` is likewise set by the client, exactly
// as Prisma's `@updatedAt` was.

import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Client-minted cuid primary key — mirrors Prisma's `@id @default(cuid())`. */
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => createId());

/** `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` — mirrors `@default(now())`. */
const createdAt = () =>
  timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow();

/// A news outlet — the publisher whose editorial DNA we characterize over time.
export const outlets = pgTable(
  'Outlet',
  {
    id: id(),
    name: text('name').notNull(),
    country: text('country'),
    ownership: text('ownership'),
    funding: text('funding'),
    isPublic: boolean('isPublic').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex('Outlet_name_key').on(table.name)],
);

/// A single published article — the unit of analysis.
export const articles = pgTable(
  'Article',
  {
    id: id(),
    outletId: text('outletId').notNull(),
    headline: text('headline').notNull(),
    author: text('author'),
    section: text('section'),
    url: text('url').notNull(),
    body: text('body').notNull(),
    publishedAt: timestamp('publishedAt', { precision: 3, mode: 'date' }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('Article_url_key').on(table.url),
    index('Article_outletId_idx').on(table.outletId),
    foreignKey({
      columns: [table.outletId],
      foreignColumns: [outlets.id],
      name: 'Article_outletId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// A checkable factual assertion extracted from an article. Facts, not framing.
export const claims = pgTable(
  'Claim',
  {
    id: id(),
    articleId: text('articleId').notNull(),
    text: text('text').notNull(),
    speaker: text('speaker'),
    /** pending | supported | contradicted | unverifiable — SSOT in `config/verification.ts`. */
    verificationStatus: text('verificationStatus').notNull().default('pending'),
    /** 0..1 — model confidence in the verification, always recorded (explainability). */
    confidence: doublePrecision('confidence'),
    createdAt: createdAt(),
  },
  (table) => [
    index('Claim_articleId_idx').on(table.articleId),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: 'Claim_articleId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// A piece of evidence for or against a claim — the substrate of every score.
export const evidence = pgTable(
  'Evidence',
  {
    id: id(),
    claimId: text('claimId').notNull(),
    /** supports | contradicts — SSOT in `config/verification.ts`. */
    stance: text('stance').notNull(),
    source: text('source').notNull(),
    excerpt: text('excerpt'),
    url: text('url'),
    createdAt: createdAt(),
  },
  (table) => [
    index('Evidence_claimId_idx').on(table.claimId),
    foreignKey({
      columns: [table.claimId],
      foreignColumns: [claims.id],
      name: 'Evidence_claimId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// An interpretation/framing of an event — kept separate from Claims (facts).
/// Competing narratives coexist by design.
export const narratives = pgTable(
  'Narrative',
  {
    id: id(),
    articleId: text('articleId').notNull(),
    frame: text('frame').notNull(),
    summary: text('summary'),
    createdAt: createdAt(),
  },
  (table) => [
    index('Narrative_articleId_idx').on(table.articleId),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: 'Narrative_articleId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// An outlet's characterized editorial leaning across dimensions, tracked over time.
export const editorialDna = pgTable(
  'EditorialDna',
  {
    id: id(),
    outletId: text('outletId').notNull(),
    /** dimension -> score (-1..1); explainable, recomputed from evidence. */
    dimensions: jsonb('dimensions').notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('EditorialDna_outletId_key').on(table.outletId),
    foreignKey({
      columns: [table.outletId],
      foreignColumns: [outlets.id],
      name: 'EditorialDna_outletId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// A point-in-time capture of an outlet's homepage — for placement/visibility analysis.
export const homepageSnapshots = pgTable(
  'HomepageSnapshot',
  {
    id: id(),
    outletId: text('outletId').notNull(),
    capturedAt: timestamp('capturedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    /** ordered list of {articleUrl, position, headline} as captured. */
    items: jsonb('items').notNull(),
  },
  (table) => [
    index('HomepageSnapshot_outletId_capturedAt_idx').on(table.outletId, table.capturedAt),
    foreignKey({
      columns: [table.outletId],
      foreignColumns: [outlets.id],
      name: 'HomepageSnapshot_outletId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

// ————— Relations (for `db.query.*` relational reads; mirror Prisma's relation fields) —————

export const outletsRelations = relations(outlets, ({ many, one }) => ({
  articles: many(articles),
  homepageSnapshots: many(homepageSnapshots),
  editorialDna: one(editorialDna),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  outlet: one(outlets, { fields: [articles.outletId], references: [outlets.id] }),
  claims: many(claims),
  narratives: many(narratives),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  article: one(articles, { fields: [claims.articleId], references: [articles.id] }),
  evidence: many(evidence),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  claim: one(claims, { fields: [evidence.claimId], references: [claims.id] }),
}));

export const narrativesRelations = relations(narratives, ({ one }) => ({
  article: one(articles, { fields: [narratives.articleId], references: [articles.id] }),
}));

export const editorialDnaRelations = relations(editorialDna, ({ one }) => ({
  outlet: one(outlets, { fields: [editorialDna.outletId], references: [outlets.id] }),
}));

export const homepageSnapshotsRelations = relations(homepageSnapshots, ({ one }) => ({
  outlet: one(outlets, { fields: [homepageSnapshots.outletId], references: [outlets.id] }),
}));

/// A finished article report, saved so it has a link and is not paid for twice.
/// Stores the report and its located passages, never the full article text:
/// a public page may quote, not republish. The cache key is the exact text the
/// model saw plus the prompt version and report language.
export const savedReports = pgTable(
  'SavedReport',
  {
    id: text('id').primaryKey(),
    textSha256: text('textSha256').notNull(),
    promptVersion: text('promptVersion').notNull(),
    language: text('language').notNull(),
    url: text('url'),
    title: text('title').notNull(),
    /** public | unlisted — SSOT in `lib/reports/store.ts`. */
    visibility: text('visibility').notNull(),
    /** The report without `sourceText` (ReportResult with sourceText null). */
    result: jsonb('result').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('SavedReport_text_prompt_language_key').on(
      table.textSha256,
      table.promptVersion,
      table.language,
    ),
  ],
);

/// A reply: one reader's choice of findings and sections from a report, sent
/// to one person for one occasion. Every format (line, brief, card, page) is
/// rendered from this row, so the short and long versions cannot disagree.
export const replies = pgTable(
  'Reply',
  {
    id: text('id').primaryKey(),
    reportId: text('reportId').notNull(),
    parentReplyId: text('parentReplyId'),
    occasion: text('occasion').notNull(),
    length: text('length').notNull(),
    blocks: jsonb('blocks').notNull(),
    senderName: text('senderName'),
    note: text('note'),
    /** A rewrite sent with the reply (the studio's "send this"), or null. */
    rewriteId: text('rewriteId'),
    createdAt: createdAt(),
  },
  (table) => [
    index('Reply_reportId_idx').on(table.reportId),
    foreignKey({
      columns: [table.reportId],
      foreignColumns: [savedReports.id],
      name: 'Reply_reportId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/// A text from the rewrite studio: the article retold in another voice, or a
/// response to it. `label` is written by code and says who wrote it (AI) and,
/// for a simulated outlet or person, that they did not.
export const rewrites = pgTable(
  'Rewrite',
  {
    id: text('id').primaryKey(),
    reportId: text('reportId').notNull(),
    form: text('form').notNull(),
    voice: jsonb('voice').notNull(),
    length: text('length').notNull(),
    title: text('title').notNull(),
    text: text('text').notNull(),
    label: text('label').notNull(),
    simulated: boolean('simulated').notNull(),
    factDiff: jsonb('factDiff'),
    /** RewriteEvidence: findings it could cite from an investigation, and what the original omitted. */
    evidence: jsonb('evidence'),
    modelId: text('modelId'),
    promptVersion: text('promptVersion').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('Rewrite_reportId_idx').on(table.reportId),
    foreignKey({
      columns: [table.reportId],
      foreignColumns: [savedReports.id],
      name: 'Rewrite_reportId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

// ————— Row types, derived from the schema (never defined separately — SSOT) —————

export type Outlet = typeof outlets.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Narrative = typeof narratives.$inferSelect;
export type EditorialDna = typeof editorialDna.$inferSelect;
export type HomepageSnapshot = typeof homepageSnapshots.$inferSelect;
export type SavedReportRow = typeof savedReports.$inferSelect;
export type ReplyRow = typeof replies.$inferSelect;
export type RewriteRow = typeof rewrites.$inferSelect;

// Shared account schema owns credentials, sessions, passkeys and second factors.
export * from '@bitbaum/accountkit/auth/schema';

/// A multi-source investigation: an article, the studies linked to its claims
/// and the reader's notes. Anyone with the link can read it; only the holder
/// of the edit token (kept in their browser, stored here as a SHA-256) can
/// change it. `revision` guards against two tabs overwriting each other.
export const investigations = pgTable('Investigation', {
  id: text('id').primaryKey(),
  editTokenSha256: text('editTokenSha256').notNull(),
  title: text('title').notNull(),
  /** `Investigation` from `lib/domain/investigation.ts`, validated on write. */
  data: jsonb('data').notNull(),
  revision: integer('revision').notNull().default(1),
  createdAt: createdAt(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
});

export type InvestigationRow = typeof investigations.$inferSelect;

/// An AI-generated image made for an investigation. Bytes are stored as
/// base64 so no blob store is needed; the investigation's `images` entry
/// points here and is always labelled as AI-generated.
export const generatedImages = pgTable('GeneratedImage', {
  id: text('id').primaryKey(),
  investigationId: text('investigationId').notNull(),
  mimeType: text('mimeType').notNull(),
  dataBase64: text('dataBase64').notNull(),
  prompt: text('prompt').notNull(),
  createdAt: createdAt(),
});

/// An article a signed-in person wrote here, from scratch or in response to a
/// headline or to another written article. Public once published; the
/// author alone can change or delete it. The body is markdown rendered through
/// bip-kit's typed blocks, so no HTML ever passes through.
export const writtenArticles = pgTable(
  'WrittenArticle',
  {
    id: text('id').primaryKey(),
    /** accountkit user id (no FK: the account tables are the package's). */
    authorId: text('authorId').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** First sentences of the body, for lists and previews. */
    excerpt: text('excerpt').notNull(),
    /** draft | published — SSOT in `lib/writing/store.ts`. */
    status: text('status').notNull(),
    /** The written article this one answers, or null. */
    respondToId: text('respondToId'),
    /** The headline (from the wire or elsewhere) the piece is about, or null. */
    sourceUrl: text('sourceUrl'),
    sourceTitle: text('sourceTitle'),
    /** The saved examination of this text, once the author ran one. */
    reportId: text('reportId'),
    createdAt: createdAt(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    publishedAt: timestamp('publishedAt', { precision: 3, mode: 'date' }),
  },
  (table) => [
    index('WrittenArticle_authorId_idx').on(table.authorId),
    index('WrittenArticle_respondToId_idx').on(table.respondToId),
    index('WrittenArticle_status_publishedAt_idx').on(table.status, table.publishedAt),
  ],
);

export type WrittenArticleRow = typeof writtenArticles.$inferSelect;

/// A comment under a written article: one signed-in person's short say.
/// Public with the article; the author may delete their own. Not a
/// participation-gated thread (threadkit's model), because everyone can read
/// a public article's comments — the article page is the room.
export const comments = pgTable(
  'Comment',
  {
    id: text('id').primaryKey(),
    articleId: text('articleId').notNull(),
    authorId: text('authorId').notNull(),
    body: text('body').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('Comment_articleId_createdAt_idx').on(table.articleId, table.createdAt),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [writtenArticles.id],
      name: 'Comment_articleId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type CommentRow = typeof comments.$inferSelect;
