CREATE TABLE "Reply" (
	"id" text PRIMARY KEY NOT NULL,
	"reportId" text NOT NULL,
	"parentReplyId" text,
	"occasion" text NOT NULL,
	"length" text NOT NULL,
	"blocks" jsonb NOT NULL,
	"senderName" text,
	"note" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SavedReport" (
	"id" text PRIMARY KEY NOT NULL,
	"textSha256" text NOT NULL,
	"promptVersion" text NOT NULL,
	"language" text NOT NULL,
	"url" text,
	"title" text NOT NULL,
	"visibility" text NOT NULL,
	"result" jsonb NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."SavedReport"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Reply_reportId_idx" ON "Reply" USING btree ("reportId");--> statement-breakpoint
CREATE UNIQUE INDEX "SavedReport_text_prompt_language_key" ON "SavedReport" USING btree ("textSha256","promptVersion","language");