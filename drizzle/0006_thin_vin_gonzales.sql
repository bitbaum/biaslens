CREATE TABLE "GeneratedImage" (
	"id" text PRIMARY KEY NOT NULL,
	"investigationId" text NOT NULL,
	"mimeType" text NOT NULL,
	"dataBase64" text NOT NULL,
	"prompt" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
