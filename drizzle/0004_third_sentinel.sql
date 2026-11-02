CREATE TABLE "Investigation" (
	"id" text PRIMARY KEY NOT NULL,
	"editTokenSha256" text NOT NULL,
	"title" text NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
