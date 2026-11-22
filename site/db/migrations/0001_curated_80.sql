CREATE TABLE "browse_regions" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name_en" text NOT NULL,
	"name_es" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"position" integer NOT NULL,
	"reading_lang" text DEFAULT '' NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extent" text NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"source_name" text DEFAULT '' NOT NULL,
	"translator" text DEFAULT '' NOT NULL,
	"scope_note" text DEFAULT '' NOT NULL,
	"citation" text DEFAULT '' NOT NULL,
	"publication_year" integer,
	"scope_check" text DEFAULT '' NOT NULL,
	"delivery_plan" text DEFAULT 'external_link' NOT NULL,
	"us_hosting_basis" text DEFAULT '' NOT NULL,
	"render_mode" text DEFAULT 'external_link' NOT NULL,
	"rights_approved" boolean DEFAULT false NOT NULL,
	"rights_basis" text DEFAULT '' NOT NULL,
	"rights_evidence" text DEFAULT '' NOT NULL,
	"complete_span" text DEFAULT '' NOT NULL,
	"approved_by" text DEFAULT '' NOT NULL,
	"approved_on" text DEFAULT '' NOT NULL,
	"pdf_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eras" (
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
CREATE TABLE "work_articles" (
	"work_id" text NOT NULL,
	"locale" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"about_author" text DEFAULT '' NOT NULL,
	"work_in_its_time" text DEFAULT '' NOT NULL,
	"why_read_today" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_articles_work_id_locale_pk" PRIMARY KEY("work_id","locale")
);
--> statement-breakpoint
ALTER TABLE "archive_page" ADD COLUMN "landing_title_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "archive_page" ADD COLUMN "landing_title_es" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "archive_page" ADD COLUMN "landing_intro_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "archive_page" ADD COLUMN "landing_intro_es" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "canon_id" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "curated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "curated_order" integer;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "era_id" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "original_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "creator" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "date_display" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "date_kind" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "scope" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "original_languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "browse_region_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "geographic_note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "english_state" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "edition_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "companions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "article_status" text DEFAULT 'review' NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "legacy_record" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "editions" ADD CONSTRAINT "editions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "work_articles" ADD CONSTRAINT "work_articles_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "editions_work" ON "editions" USING btree ("work_id","position");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "works_era" ON "works" USING btree ("era_id","curated_order");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_canon_id_unique" UNIQUE("canon_id");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_slug_unique" UNIQUE("slug");