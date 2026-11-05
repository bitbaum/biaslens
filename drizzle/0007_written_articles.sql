CREATE TABLE "WrittenArticle" (
	"id" text PRIMARY KEY NOT NULL,
	"authorId" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"excerpt" text NOT NULL,
	"status" text NOT NULL,
	"respondToId" text,
	"sourceUrl" text,
	"sourceTitle" text,
	"reportId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"publishedAt" timestamp (3)
);
--> statement-breakpoint
CREATE INDEX "WrittenArticle_authorId_idx" ON "WrittenArticle" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "WrittenArticle_respondToId_idx" ON "WrittenArticle" USING btree ("respondToId");--> statement-breakpoint
CREATE INDEX "WrittenArticle_status_publishedAt_idx" ON "WrittenArticle" USING btree ("status","publishedAt");