CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"authorId" text NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."WrittenArticle"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment" USING btree ("articleId","createdAt");