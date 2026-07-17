-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "ownership" TEXT,
    "funding" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "author" TEXT,
    "section" TEXT,
    "url" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speaker" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "stance" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "excerpt" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Narrative" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "frame" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Narrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialDna" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialDna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSnapshot" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB NOT NULL,

    CONSTRAINT "HomepageSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_name_key" ON "Outlet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE INDEX "Article_outletId_idx" ON "Article"("outletId");

-- CreateIndex
CREATE INDEX "Claim_articleId_idx" ON "Claim"("articleId");

-- CreateIndex
CREATE INDEX "Evidence_claimId_idx" ON "Evidence"("claimId");

-- CreateIndex
CREATE INDEX "Narrative_articleId_idx" ON "Narrative"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialDna_outletId_key" ON "EditorialDna"("outletId");

-- CreateIndex
CREATE INDEX "HomepageSnapshot_outletId_capturedAt_idx" ON "HomepageSnapshot"("outletId", "capturedAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Narrative" ADD CONSTRAINT "Narrative_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialDna" ADD CONSTRAINT "EditorialDna_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSnapshot" ADD CONSTRAINT "HomepageSnapshot_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
