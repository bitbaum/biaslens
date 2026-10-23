-- The deployed Prisma stub predates the current domain schema: Article has
-- only id, url and createdAt. Preserve it and every row under a history name;
-- do not invent outlet/headline/body values to make it look like a full article.
-- This is intentionally limited to the exact legacy shape observed on the box.
DO $$
DECLARE
  columns text[];
  idx record;
BEGIN
  SELECT array_agg(column_name::text ORDER BY ordinal_position) INTO columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Article';
  IF columns = ARRAY['id', 'url', 'createdAt']::text[] THEN
    IF to_regclass('public."Article_prisma_legacy_20261023"') IS NOT NULL THEN
      RAISE EXCEPTION 'Legacy archive already exists; refusing to overwrite it';
    END IF;
    -- Index names share a schema namespace: leave the canonical names free
    -- for the new table, preserving all legacy constraints and indexes.
    FOR idx IN SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Article'
    LOOP
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', idx.indexname,
        'legacy_article_' || substr(md5(idx.indexname), 1, 16));
    END LOOP;
    ALTER TABLE public."Article" RENAME TO "Article_prisma_legacy_20261023";
    COMMENT ON TABLE public."Article_prisma_legacy_20261023" IS
      'Preserved three-column Prisma Article stub, before the Drizzle domain schema; rows are not migrated or presented as analysed articles.';
  END IF;
END $$;
