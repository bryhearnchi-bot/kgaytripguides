CREATE TABLE "ai_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"cruise_id" integer NOT NULL,
	"draft_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_from_job_id" integer,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cruise_id" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_ref" text NOT NULL,
	"task" text NOT NULL,
	"status" text DEFAULT 'queued',
	"result" jsonb,
	"error" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "trip_info_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"cruise_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"order_index" integer NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cruise_talent" (
	"cruise_id" integer NOT NULL,
	"talent_id" integer NOT NULL,
	"role" text,
	"performance_count" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cruise_talent_cruise_id_talent_id_pk" PRIMARY KEY("cruise_id","talent_id")
);
--> statement-breakpoint
CREATE TABLE "cruises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"ship_name" text NOT NULL,
	"cruise_line" text,
	"trip_type" text DEFAULT 'cruise' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'upcoming',
	"hero_image_url" text,
	"description" text,
	"highlights" jsonb,
	"includes_info" jsonb,
	"pricing" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cruises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"cruise_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"time" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"venue" text NOT NULL,
	"deck" text,
	"description" text,
	"short_description" text,
	"image_url" text,
	"theme_description" text,
	"dress_code" text,
	"capacity" integer,
	"requires_reservation" boolean DEFAULT false,
	"talent_ids" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "itinerary" (
	"id" serial PRIMARY KEY NOT NULL,
	"cruise_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"day" integer NOT NULL,
	"port_name" text NOT NULL,
	"country" text,
	"arrival_time" text,
	"departure_time" text,
	"all_aboard_time" text,
	"port_image_url" text,
	"description" text,
	"highlights" jsonb,
	"order_index" integer NOT NULL,
	"segment" text DEFAULT 'main'
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"type" text NOT NULL,
	"associated_type" text,
	"associated_id" integer,
	"caption" text,
	"alt_text" text,
	"credits" text,
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "party_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"theme_description" text,
	"dress_code" text,
	"default_image_url" text,
	"tags" jsonb,
	"defaults" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"value" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_category_key_unique" UNIQUE("category","key")
);
--> statement-breakpoint
CREATE TABLE "talent" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"bio" text,
	"known_for" text,
	"profile_image_url" text,
	"social_links" jsonb,
	"website" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_cruises" (
	"user_id" varchar NOT NULL,
	"cruise_id" integer NOT NULL,
	"permission_level" text NOT NULL,
	"assigned_by" varchar,
	"assigned_at" timestamp DEFAULT now(),
	CONSTRAINT "user_cruises_user_id_cruise_id_pk" PRIMARY KEY("user_id","cruise_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"full_name" text,
	"role" text DEFAULT 'viewer',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_created_from_job_id_ai_jobs_id_fk" FOREIGN KEY ("created_from_job_id") REFERENCES "public"."ai_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_info_sections" ADD CONSTRAINT "trip_info_sections_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_info_sections" ADD CONSTRAINT "trip_info_sections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cruise_talent" ADD CONSTRAINT "cruise_talent_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cruise_talent" ADD CONSTRAINT "cruise_talent_talent_id_talent_id_fk" FOREIGN KEY ("talent_id") REFERENCES "public"."talent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cruises" ADD CONSTRAINT "cruises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_templates" ADD CONSTRAINT "party_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cruises" ADD CONSTRAINT "user_cruises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cruises" ADD CONSTRAINT "user_cruises_cruise_id_cruises_id_fk" FOREIGN KEY ("cruise_id") REFERENCES "public"."cruises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cruises" ADD CONSTRAINT "user_cruises_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_drafts_cruise_idx" ON "ai_drafts" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "ai_drafts_type_idx" ON "ai_drafts" USING btree ("draft_type");--> statement-breakpoint
CREATE INDEX "ai_jobs_cruise_idx" ON "ai_jobs" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "ai_jobs_status_idx" ON "ai_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "cruise_info_cruise_idx" ON "trip_info_sections" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "trip_info_order_idx" ON "trip_info_sections" USING btree ("cruise_id","order_index");--> statement-breakpoint
CREATE INDEX "cruise_talent_cruise_idx" ON "cruise_talent" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "cruise_talent_talent_idx" ON "cruise_talent" USING btree ("talent_id");--> statement-breakpoint
CREATE INDEX "trip_status_idx" ON "cruises" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trip_slug_idx" ON "cruises" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "trip_trip_type_idx" ON "cruises" USING btree ("trip_type");--> statement-breakpoint
CREATE INDEX "events_cruise_idx" ON "events" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "itinerary_cruise_idx" ON "itinerary" USING btree ("cruise_id");--> statement-breakpoint
CREATE INDEX "itinerary_date_idx" ON "itinerary" USING btree ("date");--> statement-breakpoint
CREATE INDEX "media_type_idx" ON "media" USING btree ("type");--> statement-breakpoint
CREATE INDEX "media_associated_idx" ON "media" USING btree ("associated_type","associated_id");--> statement-breakpoint
CREATE INDEX "party_templates_name_idx" ON "party_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_expires_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "settings_category_key_idx" ON "settings" USING btree ("category","key");--> statement-breakpoint
CREATE INDEX "settings_category_idx" ON "settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "settings_active_idx" ON "settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "talent_name_idx" ON "talent" USING btree ("name");--> statement-breakpoint
CREATE INDEX "talent_category_idx" ON "talent" USING btree ("category");--> statement-breakpoint
CREATE INDEX "user_cruises_user_idx" ON "user_cruises" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_cruises_cruise_idx" ON "user_cruises" USING btree ("cruise_id");