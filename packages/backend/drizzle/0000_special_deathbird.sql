DO $$ BEGIN
 CREATE TYPE "public"."asset_type" AS ENUM('residential', 'commercial', 'mixed', 'industrial', 'land');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."distribution_status" AS ENUM('deposit_pending', 'deposited', 'verified', 'distributing', 'distributed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_type" AS ENUM('title_deed', 'valuation_report', 'legal_clearance', 'identity_proof', 'tax_certificate', 'building_permit', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."kyc_status" AS ENUM('none', 'pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."property_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'active', 'investment_closed', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reward_status" AS ENUM('pending', 'issued', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reward_type" AS ENUM('listing', 'investment', 'rent', 'holding', 'manual', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('investor', 'property_owner', 'moderator', 'admin', 'tenant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_wallet" varchar(42),
	"action" varchar(255) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" uuid,
	"metadata" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cbld_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"reward_type" "reward_type" NOT NULL,
	"reference_id" uuid,
	"tx_hash" varchar(66),
	"status" "reward_status" DEFAULT 'pending',
	"issued_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"investor_id" uuid NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"usdc_amount" numeric(30, 6) NOT NULL,
	"shares_allocated" numeric(20, 0) NOT NULL,
	"share_pct_bps" numeric(10, 4),
	"tx_hash" varchar(66) NOT NULL,
	"block_number" numeric,
	"block_timestamp" timestamp,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "investments_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profit_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"deposited_by_id" uuid,
	"total_amount_usdc" numeric(30, 6) NOT NULL,
	"description" text,
	"deposit_tx_hash" varchar(66),
	"distribution_tx_hash" varchar(66),
	"status" "distribution_status" DEFAULT 'deposit_pending',
	"verified_by_id" uuid,
	"verified_at" timestamp,
	"distributed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"short_description" varchar(300),
	"location_country" varchar(100) NOT NULL,
	"location_city" varchar(100) NOT NULL,
	"location_address" varchar(500),
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"asset_type" "asset_type",
	"total_valuation_usdc" numeric(30, 6) NOT NULL,
	"min_investment_usdc" numeric(30, 6) DEFAULT '100000000',
	"expected_roi_annual" numeric(6, 2),
	"expected_monthly_yield" numeric(30, 6),
	"investment_term_months" integer,
	"status" "property_status" DEFAULT 'draft',
	"contract_address" varchar(42),
	"chain_id" integer DEFAULT 1,
	"total_shares" integer DEFAULT 10000,
	"moderator_id" uuid,
	"review_notes" text,
	"rejection_reason" text,
	"reviewed_at" timestamp,
	"deployed_at" timestamp,
	"activated_at" timestamp,
	"featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"ipfs_metadata_cid" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"display_name" varchar(255),
	"file_url" varchar(1000) NOT NULL,
	"file_size" numeric,
	"mime_type" varchar(100),
	"is_public" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"verified_by" uuid,
	"verified_at" timestamp,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"image_url" varchar(1000) NOT NULL,
	"thumbnail_url" varchar(1000),
	"is_primary" boolean DEFAULT false,
	"caption" varchar(500),
	"sort_order" integer DEFAULT 0,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"email" varchar(255),
	"display_name" varchar(255),
	"kyc_status" "kyc_status" DEFAULT 'none',
	"kyc_provider" varchar(100),
	"kyc_reference_id" varchar(255),
	"role" "user_role" DEFAULT 'investor',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cbld_rewards" ADD CONSTRAINT "cbld_rewards_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_users_id_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_deposited_by_id_users_id_fk" FOREIGN KEY ("deposited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_recipient_idx" ON "cbld_rewards" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "investments_investor_idx" ON "investments" USING btree ("investor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "investments_property_idx" ON "investments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "investments_tx_idx" ON "investments" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distributions_property_idx" ON "profit_distributions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distributions_status_idx" ON "profit_distributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_contract_idx" ON "properties" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "properties_owner_idx" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_wallet_idx" ON "users" USING btree ("wallet_address");