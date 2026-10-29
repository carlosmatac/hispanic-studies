CREATE TABLE "archive_page" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"title_en" text DEFAULT '' NOT NULL,
	"title_es" text DEFAULT '' NOT NULL,
	"intro_en" text DEFAULT '' NOT NULL,
	"intro_es" text DEFAULT '' NOT NULL,
	"notes_en" text DEFAULT '' NOT NULL,
	"notes_es" text DEFAULT '' NOT NULL,
	"door_en" text DEFAULT '' NOT NULL,
	"door_es" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "archive_page_one_row" CHECK ("archive_page"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"note_es" text DEFAULT '' NOT NULL,
	"swatch" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_swatch_unique" UNIQUE("swatch")
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"action" text NOT NULL,
	"title" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "work_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'book' NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"container" text DEFAULT '' NOT NULL,
	"edition" text DEFAULT '' NOT NULL,
	"publisher" text DEFAULT '' NOT NULL,
	"place" text DEFAULT '' NOT NULL,
	"year" text DEFAULT '' NOT NULL,
	"pages" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"accessed" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_texts" (
	"work_id" text NOT NULL,
	"lang" text NOT NULL,
	"body" text NOT NULL,
	"words" integer NOT NULL,
	"minutes" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_texts_work_id_lang_pk" PRIMARY KEY("work_id","lang")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"life" text DEFAULT '' NOT NULL,
	"year" integer NOT NULL,
	"section_id" text NOT NULL,
	"region_id" text NOT NULL,
	"place" text DEFAULT '' NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'es' NOT NULL,
	"rights" text DEFAULT 'unverified' NOT NULL,
	"pd_spain_year" integer,
	"pd_us_year" integer,
	"needs_transcription" boolean DEFAULT false NOT NULL,
	"counter" boolean DEFAULT false NOT NULL,
	"camp" text DEFAULT '' NOT NULL,
	"stance" text DEFAULT '' NOT NULL,
	"bueno_code" text DEFAULT '' NOT NULL,
	"bueno_name" text DEFAULT '' NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"note_es" text DEFAULT '' NOT NULL,
	"summary_en" text DEFAULT '' NOT NULL,
	"summary_es" text DEFAULT '' NOT NULL,
	"source_edition" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"source_revision" text DEFAULT '' NOT NULL,
	"source_licence" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "work_references" ADD CONSTRAINT "work_references_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_texts" ADD CONSTRAINT "work_texts_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "login_attempts_key_at" ON "login_attempts" USING btree ("key","at");--> statement-breakpoint
CREATE INDEX "revisions_work" ON "revisions" USING btree ("work_id","created_at");--> statement-breakpoint
CREATE INDEX "work_references_work" ON "work_references" USING btree ("work_id","position");--> statement-breakpoint
CREATE INDEX "works_section" ON "works" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "works_region" ON "works" USING btree ("region_id");