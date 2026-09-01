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

// ————— Row types, derived from the schema (never defined separately — SSOT) —————

export type Outlet = typeof outlets.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Narrative = typeof narratives.$inferSelect;
export type EditorialDna = typeof editorialDna.$inferSelect;
export type HomepageSnapshot = typeof homepageSnapshots.$inferSelect;
