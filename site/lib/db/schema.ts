import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';

/* The archive's database (issue #69): Neon Postgres on Vercel, PGlite locally.
   Changing this file means a new migration: `npm run db:generate`, then
   `npm run db:migrate` (docs/cms.md). */

const stamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/** People who may sign in to /admin (Carlos and Beltrán). Created with `npm run user:create`. */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull().default(''),
  /** scrypt$N$r$p$salt$hash (lib/admin/password.ts) */
  passwordHash: text('password_hash').notNull(),
  /** bumped when the password changes, so every older session cookie stops working */
  sessionVersion: integer('session_version').notNull().default(1),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...stamps,
});

/** Failed sign-ins, for the rate limit (by user name and by address). Old rows are pruned. */
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  key: text('key').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('login_attempts_key_at').on(t.key, t.at)]);

/** The archive page's own words (one row, id 1). Empty fields fall back to the site's defaults (lib/i18n.ts). */
export const archivePage = pgTable('archive_page', {
  id: integer('id').primaryKey().default(1),
  titleEn: text('title_en').notNull().default(''),
  titleEs: text('title_es').notNull().default(''),
  introEn: text('intro_en').notNull().default(''),
  introEs: text('intro_es').notNull().default(''),
  notesEn: text('notes_en').notNull().default(''),
  notesEs: text('notes_es').notNull().default(''),
  doorEn: text('door_en').notNull().default(''),
  doorEs: text('door_es').notNull().default(''),
  /** the curated 80's landing (issue #93): its title and paragraphs; empty = the brief's copy in lib/i18n.ts */
  landingTitleEn: text('landing_title_en').notNull().default(''),
  landingTitleEs: text('landing_title_es').notNull().default(''),
  landingIntroEn: text('landing_intro_en').notNull().default(''),
  landingIntroEs: text('landing_intro_es').notNull().default(''),
  updatedAt: stamps.updatedAt,
  updatedBy: text('updated_by'),
}, (t) => [check('archive_page_one_row', sql`${t.id} = 1`)]);

/** The archive's boxes (periods). Their dates are ours and carry no claims. */
export const sections = pgTable('sections', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  nameEn: text('name_en').notNull(),
  nameEs: text('name_es').notNull(),
  yearFrom: integer('year_from'),
  yearTo: integer('year_to'),
  ...stamps,
});

/** Regions colour the cards. `swatch` is one of lib/palette.ts SWATCHES, never used twice. */
export const regions = pgTable('regions', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  nameEn: text('name_en').notNull(),
  nameEs: text('name_es').notNull(),
  noteEn: text('note_en').notNull().default(''),
  noteEs: text('note_es').notNull().default(''),
  swatch: text('swatch').notNull().unique(),
  ...stamps,
});

/** The eras of the curated 80 (issue #93: "De la Monarquía Universal a la iberofonía"). Ids from Beltrán's JSON (era-01 …). */
export const eras = pgTable('eras', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  nameEn: text('name_en').notNull(),
  nameEs: text('name_es').notNull(),
  yearFrom: integer('year_from'),
  yearTo: integer('year_to'),
  ...stamps,
});

/** The regions the curated 80 can be browsed by (Beltrán's ten, several per work). They colour nothing: a card's colour is its work's `region`. */
export const browseRegions = pgTable('browse_regions', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  nameEn: text('name_en').notNull(),
  nameEs: text('name_es').notNull(),
  ...stamps,
});

export type Link = { label: string; url: string };
/** A document shown beside a work but not an edition of it (e.g. a later law). */
export type Companion = { title: string; url: string; note: string; relationship: string };

/** The review state of a curated work's article: only `published` is shown to readers. */
export const ARTICLE_STATUS = ['review', 'published'] as const;

/** One work of the archive: its record. Its texts and references are in the tables below. */
export const works = pgTable('works', {
  id: text('id').primaryKey(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  fullName: text('full_name').notNull().default(''),
  life: text('life').notNull().default(''),
  year: integer('year').notNull(),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  regionId: text('region_id').notNull().references(() => regions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  place: text('place').notNull().default(''),
  code: text('code').notNull().default(''),
  /** the language the work was written in (lib/canon.ts LANGUAGES) */
  language: text('language').notNull().default('es'),
  rights: text('rights', { enum: ['public-domain', 'pd-us-only', 'pd-outside-us', 'in-copyright', 'unverified'] }).notNull().default('unverified'),
  pdSpainYear: integer('pd_spain_year'),
  pdUsYear: integer('pd_us_year'),
  needsTranscription: boolean('needs_transcription').notNull().default(false),
  counter: boolean('counter').notNull().default(false),
  camp: text('camp').notNull().default(''),
  /** the compiler's note on the author's position (English) */
  stance: text('stance').notNull().default(''),
  buenoCode: text('bueno_code').notNull().default(''),
  buenoName: text('bueno_name').notNull().default(''),
  noteEn: text('note_en').notNull().default(''),
  noteEs: text('note_es').notNull().default(''),
  summaryEn: text('summary_en').notNull().default(''),
  summaryEs: text('summary_es').notNull().default(''),
  sourceEdition: text('source_edition').notNull().default(''),
  sourceUrl: text('source_url').notNull().default(''),
  sourceRevision: text('source_revision').notNull().default(''),
  sourceLicence: text('source_licence').notNull().default(''),
  links: jsonb('links').$type<Link[]>().notNull().default([]),

  /* ---- the curated 80 (issue #93). Empty for the works outside it. ---- */
  /** Beltrán's id (DEI-C001 …): the import upserts by it. Kept when a work leaves the 80. */
  canonId: text('canon_id').unique(),
  /** Beltrán's stable slug; /archive/<slug> redirects to /archive/<id> when they differ */
  slug: text('slug').unique(),
  /** in the curated 80 now (a work retired from it keeps its canon id, record and address) */
  curated: boolean('curated').notNull().default(false),
  /** display order among the 80 (chronological), not the old number */
  curatedOrder: integer('curated_order'),
  eraId: text('era_id').references(() => eras.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  /* the work header: original title, author or issuing institution, the date as shown and its kind, the scope */
  originalTitle: text('original_title').notNull().default(''),
  creator: text('creator').notNull().default(''),
  dateDisplay: text('date_display').notNull().default(''),
  /** publication | composition | delivery | enactment | manuscript | signature | document_date */
  dateKind: text('date_kind').notNull().default(''),
  /** work | document | paired_documents | bounded_section | chapter */
  scope: text('scope').notNull().default(''),
  originalLanguages: jsonb('original_languages').$type<string[]>().notNull().default([]),
  browseRegionIds: jsonb('browse_region_ids').$type<string[]>().notNull().default([]),
  geographicNote: text('geographic_note').notNull().default(''),
  /** known_edition | not_found | partial_only | suppressed_by_editor: drives the translation appeal */
  englishState: text('english_state').notNull().default(''),
  /** the editor's notes on the editions (staff only) */
  editionNotes: text('edition_notes').notNull().default(''),
  companions: jsonb('companions').$type<Companion[]>().notNull().default([]),
  articleStatus: text('article_status', { enum: ARTICLE_STATUS }).notNull().default('review'),
  /** the work had a public record before it joined the 80: sending its article back to review leaves that record published */
  legacyRecord: boolean('legacy_record').notNull().default(false),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ...stamps,
  updatedBy: text('updated_by'),
}, (t) => [index('works_section').on(t.sectionId), index('works_region').on(t.regionId), index('works_era').on(t.eraId, t.curatedOrder)]);

/** A curated work's article in one language (es, en): its three sections, in Markdown. Independent of the reading editions' languages. */
export const workArticles = pgTable('work_articles', {
  workId: text('work_id').notNull().references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull().default(''),
  aboutAuthor: text('about_author').notNull().default(''),
  workInItsTime: text('work_in_its_time').notNull().default(''),
  whyReadToday: text('why_read_today').notNull().default(''),
  updatedAt: stamps.updatedAt,
}, (t) => [primaryKey({ columns: [t.workId, t.locale] })]);

/** How an edition is reached: a link (almost all), a bibliographic link, or hosted here once approved under U.S. law. */
export const RENDER_MODES = ['external_link', 'bibliographic_link', 'inline_html', 'local_pdf'] as const;

/**
 * An edition of a work: where to read it (or find it), and in which reading
 * language. `readingLang` is the group it is shown in (es, pt, en); empty =
 * listed under the sources (originals in other languages, locators). Hosting it
 * here needs an approval with a documented U.S. rights basis (checked when it is
 * saved, app/admin/actions.ts, and again when it is shown, lib/editions.ts).
 */
export const editions = pgTable('editions', {
  /** Beltrán's edition id (DEI-C001-S1) for imported ones; <work>-e<random> for new ones */
  id: text('id').primaryKey(),
  workId: text('work_id').notNull().references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  position: integer('position').notNull(),
  readingLang: text('reading_lang').notNull().default(''),
  /** the edition shown first in its language */
  primary: boolean('primary').notNull().default(false),
  languages: jsonb('languages').$type<string[]>().notNull().default([]),
  /** the access state (lib/editions.ts EXTENTS): complete_html, facsimile, commercial, edition_record … */
  extent: text('extent').notNull(),
  url: text('url').notNull().default(''),
  /** the edition as readers see it ("Charles Derbyshire, The Philippines a Century Hence") */
  label: text('label').notNull().default(''),
  /** where it is ("Project Gutenberg"): the button says "Read at <source>" */
  sourceName: text('source_name').notNull().default(''),
  translator: text('translator').notNull().default(''),
  /** what it covers when that is not everything, or which of two paired documents it is */
  scopeNote: text('scope_note').notNull().default(''),
  /** the editor's full note on the edition (staff only) */
  citation: text('citation').notNull().default(''),
  publicationYear: integer('publication_year'),
  scopeCheck: text('scope_check').notNull().default(''),
  /** external_link | html_candidate | pdf_candidate | reference_only: a queue for staff, never permission to host */
  deliveryPlan: text('delivery_plan').notNull().default('external_link'),
  usHostingBasis: text('us_hosting_basis').notNull().default(''),
  renderMode: text('render_mode', { enum: RENDER_MODES }).notNull().default('external_link'),
  /* the approval to host it here (U.S. law; docs/cms.md) */
  rightsApproved: boolean('rights_approved').notNull().default(false),
  /** US_PUBLIC_DOMAIN_95 | US_PUBLIC_DOMAIN_OTHER_DOCUMENTED | PERMISSION_DOCUMENTED */
  rightsBasis: text('rights_basis').notNull().default(''),
  rightsEvidence: text('rights_evidence').notNull().default(''),
  completeSpan: text('complete_span').notNull().default(''),
  approvedBy: text('approved_by').notNull().default(''),
  /** YYYY-MM-DD */
  approvedOn: text('approved_on').notNull().default(''),
  /** the approved PDF (a Vercel Blob address) for render_mode local_pdf */
  pdfUrl: text('pdf_url').notNull().default(''),
  ...stamps,
}, (t) => [index('editions_work').on(t.workId, t.position)]);

/** A work's text in one language (Markdown, written by the editor). Reading time is computed on save. */
export const workTexts = pgTable('work_texts', {
  workId: text('work_id').notNull().references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  lang: text('lang').notNull(),
  body: text('body').notNull(),
  words: integer('words').notNull(),
  minutes: integer('minutes').notNull(),
  updatedAt: stamps.updatedAt,
}, (t) => [primaryKey({ columns: [t.workId, t.lang] })]);

/** A reference (bibliography entry) of a work; the citation is formatted from these fields (lib/cite.ts). */
export const workReferences = pgTable('work_references', {
  id: serial('id').primaryKey(),
  workId: text('work_id').notNull().references(() => works.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  position: integer('position').notNull(),
  kind: text('kind', { enum: ['book', 'chapter', 'article', 'web'] }).notNull().default('book'),
  author: text('author').notNull().default(''),
  title: text('title').notNull().default(''),
  /** the book a chapter is in, the journal an article is in, the website */
  container: text('container').notNull().default(''),
  /** "ed. by …", "trans. by …", "2nd ed." */
  edition: text('edition').notNull().default(''),
  publisher: text('publisher').notNull().default(''),
  place: text('place').notNull().default(''),
  year: text('year').notNull().default(''),
  pages: text('pages').notNull().default(''),
  url: text('url').notNull().default(''),
  /** YYYY-MM-DD */
  accessed: text('accessed').notNull().default(''),
}, (t) => [index('work_references_work').on(t.workId, t.position)]);

/** Earlier versions of each work (its record, texts and references), saved before every change and on delete. */
export const revisions = pgTable('revisions', {
  id: serial('id').primaryKey(),
  /** no foreign key: the history of a deleted work is kept, so it can be restored */
  workId: text('work_id').notNull(),
  /** what was done next to the version kept here */
  action: text('action', { enum: ['update', 'delete', 'restore'] }).notNull(),
  title: text('title').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: stamps.createdAt,
  createdBy: text('created_by'),
}, (t) => [index('revisions_work').on(t.workId, t.createdAt)]);
