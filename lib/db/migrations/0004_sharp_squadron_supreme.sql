ALTER TABLE "prompts" ADD COLUMN "skip_archived" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "skip_read" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "skip_labeled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "skip_starred" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "skip_important" boolean DEFAULT false;