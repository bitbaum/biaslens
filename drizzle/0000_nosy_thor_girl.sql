CREATE TABLE "Article" (
	"id" text PRIMARY KEY NOT NULL,
	"outletId" text NOT NULL,
	"headline" text NOT NULL,
	"author" text,
	"section" text,
	"url" text NOT NULL,
	"body" text NOT NULL,
	"publishedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Claim" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"text" text NOT NULL,
	"speaker" text,
	"verificationStatus" text DEFAULT 'pending' NOT NULL,
	"confidence" double precision,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EditorialDna" (
	"id" text PRIMARY KEY NOT NULL,
	"outletId" text NOT NULL,
	"dimensions" jsonb NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"claimId" text NOT NULL,
	"stance" text NOT NULL,
	"source" text NOT NULL,
	"excerpt" text,
	"url" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "HomepageSnapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"outletId" text NOT NULL,
	"capturedAt" timestamp (3) DEFAULT now() NOT NULL,
	"items" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Narrative" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"frame" text NOT NULL,
	"summary" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Outlet" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"ownership" text,
	"funding" text,
	"isPublic" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Article" ADD CONSTRAINT "Article_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "public"."Outlet"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EditorialDna" ADD CONSTRAINT "EditorialDna_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "public"."Outlet"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."Claim"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HomepageSnapshot" ADD CONSTRAINT "HomepageSnapshot_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "public"."Outlet"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Narrative" ADD CONSTRAINT "Narrative_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Article_url_key" ON "Article" USING btree ("url");--> statement-breakpoint
CREATE INDEX "Article_outletId_idx" ON "Article" USING btree ("outletId");--> statement-breakpoint
CREATE INDEX "Claim_articleId_idx" ON "Claim" USING btree ("articleId");--> statement-breakpoint
CREATE UNIQUE INDEX "EditorialDna_outletId_key" ON "EditorialDna" USING btree ("outletId");--> statement-breakpoint
CREATE INDEX "Evidence_claimId_idx" ON "Evidence" USING btree ("claimId");--> statement-breakpoint
CREATE INDEX "HomepageSnapshot_outletId_capturedAt_idx" ON "HomepageSnapshot" USING btree ("outletId","capturedAt");--> statement-breakpoint
CREATE INDEX "Narrative_articleId_idx" ON "Narrative" USING btree ("articleId");--> statement-breakpoint
CREATE UNIQUE INDEX "Outlet_name_key" ON "Outlet" USING btree ("name");