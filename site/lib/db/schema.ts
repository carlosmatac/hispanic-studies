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

export type Link = { label: string; url: string };

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
  ...stamps,
  updatedBy: text('updated_by'),
}, (t) => [index('works_section').on(t.sectionId), index('works_region').on(t.regionId)]);

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
