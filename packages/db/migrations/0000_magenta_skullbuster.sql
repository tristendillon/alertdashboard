CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"full_address" text NOT NULL,
	"units" text[],
	"incident_type" text NOT NULL,
	"dispatch_id" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_created_at_idx" ON "alerts" USING btree ("source","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_id_idx" ON "alerts" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dispatch_id_idx" ON "alerts" USING btree ("dispatch_id");