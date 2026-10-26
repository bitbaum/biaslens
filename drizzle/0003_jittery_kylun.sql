CREATE TABLE "Rewrite" (
	"id" text PRIMARY KEY NOT NULL,
	"reportId" text NOT NULL,
	"form" text NOT NULL,
	"voice" jsonb NOT NULL,
	"length" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"label" text NOT NULL,
	"simulated" boolean NOT NULL,
	"factDiff" jsonb,
	"modelId" text,
	"promptVersion" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Reply" ADD COLUMN "rewriteId" text;--> statement-breakpoint
ALTER TABLE "Rewrite" ADD CONSTRAINT "Rewrite_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."SavedReport"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Rewrite_reportId_idx" ON "Rewrite" USING btree ("reportId");