# The back office: how Beltrán edits the archive (issue #69)

The archive of Hispanic thought lives in a **Postgres database** (Neon, on
Vercel). Beltrán edits it in the **back office at `/admin`**: he signs in with a
user name and a password and changes the works, their texts, the sections, the
regions and the archive page's own words. Every save shows on the site at once;
nothing needs a deploy, and nobody needs GitHub.

(Until 2026-10-29 the works were Markdown files edited with Keystatic. Those
files are in git history, last at commit `246fe7e`; `npm run db:import` reads
them from there.)

## For Beltrán

1. Open `https://<the site>/admin` and sign in. (On the private preview the
   browser first asks for the preview password, as for every page.)
2. **Obras** lists every work; search by title, author or year, filter by
   section, region or state. Open one to edit it, or press **Añadir una obra**.
3. A work's page has, in order: the essentials (title, author, year, section,
   region, original language), the rights, **the text** (Spanish, English, and
   the original language when it is another; write or paste from Word or Google
   Docs; *Capítulo* headings become the reader's contents; *Vista previa* shows
   it as the reader will), where the text comes from, links to legitimate
   copies, **references** (fill the fields; the citation writes itself), notes
   and summary, and the compiler's record (folded).
4. At the foot, choose **Borrador** (only you see it, on the site too, marked
   "Borrador") or **Publicada**, and press **Guardar**. The reading time is
   worked out from the length when you save.
5. **Historial** (top of a work) keeps the version before every save: restore
   any of them to undo a mistake. A deleted work can be brought back from
   **Obras eliminadas** at the foot of the list.
6. **Secciones** and **Regiones**: rename, reorder (↑ ↓), add, delete (only when
   no work is in them). A region's colour is chosen from the palette; colours
   already used are not offered.
7. **Página del archivo**: the title and introduction of the 80 texts (the
   archive's landing; empty = the copy of your brief), the introduction of
   "More from the archive", the note at the foot and the line on the home page.
   `{obras}` / `{works}`, `{secciones}` / `{sections}`, `{curados}` / `{curated}`
   (the 80 shown) and `{resto}` / `{rest}` (the works outside them) become the
   numbers.
8. **Mi cuenta**: change your password; **download a backup** of everything.

### The 80 texts (issue #93)

Your curated archive, "De la Monarquía Universal a la iberofonía", is the
archive's landing. Every article came in **in review**: nobody but you (signed
in) sees it.

1. **80 textos** lists them by era, in your order, each marked **En revisión**
   or **Publicado**. **Ver en la web** opens the work's page as readers will see
   it (marked "En revisión" while it is).
2. Happy with it? **Aprobar y publicar**. Or a whole era at once with **Aprobar
   y publicar los N en revisión** at the top of the era. **Volver a revisión**
   undoes it. Every change is kept in the work's **Historial**.
3. To correct something, **Editar** opens the work. Its part **Los 80 textos**
   has the era and order, the header (original title, author or institution,
   date and its kind, scope, original languages, regions to browse by), the
   **English translation** state (it decides the call for translators), then
   **the article in Spanish and in English** (three sections each; a blank line
   starts a paragraph, `*word*` is italics), **the editions** and the related
   documents. At the foot, **En revisión** or **Publicado**, and **Guardar**.
4. **The editions**: for each, the reading language it is shown under (Spanish,
   Portuguese, English; or "Sources" for originals in Latin, Italian… and
   references), whether it is the main one of its language, its **access**
   (complete text online, facsimile, publisher edition, catalogue record…),
   the address, how readers see it ("Charles Derbyshire, The Philippines a
   Century Hence"), where it is ("Project Gutenberg": the button says "Read at
   Project Gutenberg"), the translator and what it covers. The button follows
   the access; a site never gets a "full text" or "PDF" button it has not got.
5. **Hosting an edition here** (the text in the reader, or a PDF): only with an
   approval under U.S. law. Under **Alojarla aquí** choose the text or a PDF,
   tick the approval and fill in the basis, the evidence, what was checked, who
   approved it and when (and, under the 1930 rule, the year of the edition).
   Saving refuses anything missing. A PDF must first be uploaded to Vercel Blob
   (Carlos, below); paste its address.
6. **Épocas**: rename the six eras (Spanish and English).

The edition approval queue (the editions your list marks as candidates to host
here) is at the foot of **80 textos**: they stay links until approved.

### The rule on texts: U.S. law

Since 2026-11-22 (your brief) the site follows **U.S. copyright law**, where it
is served: a full text is shown when the work, in that edition, is in the U.S.
public domain. In 2026 that means **published in 1930 or earlier** (the 95-year
term), or another documented U.S. basis. Not the author's death, nor when it was
written, nor a manuscript's age, nor a scan being free online; each translation,
introduction and annotation is judged on its own (a 1946 translation of an 1897
book is not free). Every other work gets its record and links to legitimate
copies. (Before, a text also had to be free in Spain and in its own country.)
Sources of hosted texts are logged in `docs/archive-sources.md`.

## For Carlos: setting it up

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | What | Where |
| --- | --- | --- |
| `DATABASE_URL` | Neon's pooled address (set by the Neon integration) | all environments |
| `DATABASE_URL_UNPOOLED` | Neon's direct address, for migrations (Neon integration) | all |
| `ADMIN_SESSION_SECRET` | signs the session cookie; at least 32 random characters | **Production and Preview (add it)** |
| `SITE_PASSWORD` | the preview's password gate (`site/proxy.ts`), unchanged | while the site is private |

Make the secret without ever seeing it: `openssl rand -base64 48 | vercel env add ADMIN_SESSION_SECRET production`
(and again for `preview`). Changing it signs everybody out. Locally it is
optional: without it a secret is made once in `site/.data/` (git-ignored). On
Vercel the back office refuses to work without it.

For local work, `vercel env pull .env.local` (in `site/`) brings the Neon
variables. **The same Neon database serves the preview and your laptop**: what
you change locally is live. For experiments use a local database (below) or a
Neon branch.

### Accounts

Accounts are made from the command line only (there is no sign-up page). The
password is typed, never written in a command or a file:

```bash
cd site
npm run user:create -- carlos      # asks for a name to show and the password, twice
npm run user:create -- beltran     # run it again later to set a new password (signs that user out everywhere)
npm run user:list
npm run user:delete -- someone
```

In Git Bash the hidden prompt needs `winpty npm.cmd run user:create -- beltran`;
PowerShell and Windows Terminal work as they are. Passwords: at least 10
characters, stored as scrypt hashes. Beltrán can change his own at **Mi cuenta**.

Sign-in allows 5 failed tries per user name and 30 per address every 15
minutes. Sessions last two weeks (httpOnly, signed cookie).

### The database

```bash
cd site
npm run db:migrate        # apply db/migrations (safe to repeat)
npm run db:import         # the 59 works, 6 sections, 6 regions and the page's words, from git (246fe7e);
                          # only what is missing goes in, so it never undoes Beltrán's edits (--overwrite to force)
npm run db:import -- --backup backups/archive-2026-10-29.json   # from a backup
npm run db:export         # everything as JSON in site/backups/ (git-ignored); the same file as "Download backup"
npm run db:size           # database and table sizes (see Capacity)
npm run palette:check     # the region palette's rule (below)
```

Changing the schema (`site/lib/db/schema.ts`): `npm run db:generate` writes a
new SQL file in `site/db/migrations/`; commit it; `npm run db:migrate` applies
it (against Neon, before deploying the code that needs it).

**A local database without Neon** (PGlite, Postgres in WebAssembly, kept in
`site/.data/pglite`):

```bash
npm run db:local                              # leaves a Postgres on 127.0.0.1:5488 running
export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5488/postgres   # PowerShell: $env:DATABASE_URL = "…"
npm run db:migrate && npm run db:import
npm run dev                                   # the shell's DATABASE_URL wins over .env.local
```

**Without any `DATABASE_URL`** the archive pages, the home's archive plate and
`/admin` cannot render: `next dev` shows, and `next build` fails with, a message
saying to set it or run `npm run db:local`. That is on purpose: a build must
never publish an empty archive.

### Texts from Wikisource, Gutenberg or TEI

`tools/ingest-text.py <id> …` (see `tools/README.md`) fetches and cleans a text
and hands it over in `site/.data/ingest/<id>.json`; `npm run text:import -- <id>`
puts it in the work (the version before stays in its history). Save the work
once in `/admin` to refresh the site's cache.

### The 80 texts: the import (issue #93)

Beltrán's package is in `docs/research/iberofonia/` (the brief, the JSON, the
edition inventory, the drafts). `npm run iberofonia:import` reads the JSON:

```bash
cd site
npm run db:export                                        # a backup first, always
npm run iberofonia:import -- --manifest manifest.md      # dry run: what it would do (merges, new, retired, conflicts, the hosting queue)
npm run iberofonia:import -- --apply                     # do it (refuses while there are conflicts)
npm run iberofonia:import -- --apply --json <v4.json>    # a later version of his list
npm run iberofonia:import -- --apply --overwrite         # take the JSON's curated fields, articles and editions over edits made at /admin
```

It upserts by Beltrán's id (`canon_id`, DEI-C001…). The works of the 80 we
already had are connected by hand (`MERGES` in `site/scripts/iberofonia-import.mts`;
same author but another work is listed in `NOT_THE_SAME`): they keep their id,
address, record, texts and links, and gain the header, the two articles and the
editions. The others become new works, as drafts, with Beltrán's `slug` as their
id; the colour region and the old section are worked out from his regions and
the year (editable). Run again, it changes nothing and never undoes edits made
at `/admin` (only what is missing goes in); `--overwrite` takes the JSON (each
work's version before is kept in its history; approvals to host are never
touched). A work whose id leaves the JSON leaves the 80 (`curated` off) and
keeps its record and address. The import never turns hosting on. Save any work
at `/admin` afterwards to refresh the site's cache.

Develop and test it against a local PGlite first (`npm run db:local`), then
apply it to Neon: `npm run db:export`, `npm run db:migrate`, the dry run, `--apply`.

**Publishing the 80 from the command line** (issue #97): `npm run
curated:publish -- --as <name>` lists, era by era, the works still in review;
add `--apply` to approve and publish them (`--era era-03` for one era). It runs
the same code as **Aprobar y publicar** at `/admin/curated`
(`site/lib/admin/article-status.ts`): the version before goes into each work's
history, `<name>` is kept as the reviewer, and editions and their approvals to
be hosted are never touched. Take a backup first. The deployed site shows the
change once its cache is refreshed: save any work at `/admin`, or deploy. (On
2026-11-22 all 80 were published this way, `--as carlos`, for Beltrán to see
them on the preview.)

**How readers see the editions' labels.** Beltrán's JSON gave each edition a
note in English written for staff; the import kept its first clause as the
label ("Spanish reading copy"), and the companion documents' notes and the
dates ("4 May 1493") came in English too. The database keeps them as they came;
`ARCHIVE_WORDING` at the end of `site/lib/i18n.ts` is how they read on the site
in each language, without the instructions to staff, and `archiveDate` puts the
months in Spanish. A label edited at `/admin` no longer matches the table and
shows exactly as typed; when you change one there, write it as readers should
read it.

### PDFs of approved editions (Vercel Blob)

The package ships no files. When an edition is approved to be hosted as a PDF
(U.S. basis, evidence, checked span, approver and date: see "The 80 texts"
above), upload the checked PDF to **Vercel Blob** (Vercel → Storage → Blob:
create a store for the project once, then upload; or `vercel blob put file.pdf`)
and paste its public `https://….blob.vercel-storage.com/….pdf` address into the
edition at `/admin`. The work's page then shows it in the PDF viewer
(`components/archive/PdfViewer.tsx`: the browser's own viewer, keyboard-usable,
with a separate download link). Only the address is in the database. For a
proofed HTML text, paste it into the work's text in that language and approve
the edition as "the text, in the reader". The brief's
`DEI_Iberofonia_Apply_Approved_Assets.mjs` is not used: the same checks run when
the edition is saved (`hostingProblems` in `site/lib/editions.ts`).

### Backups

- **Download backup** (Mi cuenta, and at the foot of Obras) or `npm run db:export`:
  one JSON file with the page's words, sections, regions, eras, the regions to
  browse by, and every work with its texts, references, articles and editions
  (format version 2; version 1 files still load). Not included: users (their
  password hashes) and the revision history.
- Neon keeps its own history too (point-in-time restore; a few hours on the free plan).
- A good habit: download a backup after a long editing session and keep a copy
  off the computer.

## How it works

- **Stack**: Drizzle ORM (`site/lib/db/`) over `pg`; Neon in production, PGlite
  locally. Migrations are SQL files (`site/db/migrations/`).
- **Tables**: `works` (the record; since #93 also its place in the curated 80:
  `canon_id`, `slug`, `curated`, `curated_order`, `era_id`, the header,
  `english_state`, companions, `article_status`), `work_texts` (one per work and
  language: Markdown, words, minutes), `work_references`, `work_articles` (the
  80's articles, one per work and locale es/en, three sections), `editions` (one
  per edition: reading language, main, access state, address, label, source,
  translator, scope note, delivery plan, U.S. hosting note and the approval to
  host it), `eras`, `browse_regions`, `sections`, `regions`, `archive_page` (one
  row), `revisions` (a JSON snapshot of the whole work, articles and editions
  included, before every save, restore and delete; the last 50 per work are
  kept), `users`, `login_attempts`.
- **Which works show as the 80**: `curated` and `article_status = published`
  (and the record published); signed-in editors see all of them, marked "in
  review". The rest of the archive (the works outside the 80, and those of the
  80 we had before, until approved) follows as the shelf of cards.
- **Editions and buttons**: `site/lib/editions.ts` maps each access state to the
  brief's button and decides hosting (`hostedMode`: only with a complete U.S.
  approval). The work's page is `components/archive/CuratedWork.tsx`.
- **Texts are Markdown**. The editor (TipTap, `components/admin/TextEditor.tsx`)
  loads it as HTML through Markdoc and writes it back with `lib/markdown.ts`;
  the reader renders it with Markdoc (`lib/text.ts`), exactly as when the texts
  were files. Allowed: chapters (`##`), headings (`###`), quotations, lists, a
  separator, line breaks, bold, italics, links. No footnotes (none of the hosted
  texts uses them). Saving each of the nine hosted texts through the editor
  unchanged gives back the same HTML on the site (tested).
- **Reading time** = words ÷ 230, rounded, at least 1; counted on save from the
  same render tree the reader uses.
- **Which text the reader shows**: on `/en/…` the English text if there is one,
  else the original; on `/es/…` the Spanish, else the original. When both site
  languages have a text, each page links to the other.
- **References** become a Chicago-style bibliography entry (`lib/cite.ts`): book,
  chapter, article or web page; "accessed" in the reader's language.
- **Caching**: the public pages are static (built from the database); the
  archive's data is cached under the tag `archive`. Every save in `/admin`
  expires that tag and revalidates every page (`lib/admin/revalidate.ts`), so
  the change shows on the next visit, at once. A work added later is rendered
  on its first visit.
- **Drafts**: signing in turns on Next's Draft Mode; then the site itself shows
  drafts (marked) to that browser, read straight from the database. "Ver en la
  web" goes through `/admin/view`, which turns it on again if needed.
- **Security**: every Server Action and admin route checks the session first;
  `/admin` is never indexed (`noindex`, robots.txt) and sits behind the preview
  password like the rest of the site.

## The region palette

The colours a region may wear are fixed, in `site/lib/palette.ts`: the brand's
burgundy, leather, ink and paper; four mixes of them (**brick** = burgundy 55% +
leather; **tan** = leather 75% + paper; **sand** = leather 25% + paper; **stone**
= ink 35% + paper); and the two muted hues the archive already wore before this
change (**sea**, **olive**, kept so the Caribbean and the Lusophone world look as
Beltrán approved them in #68). The rule, checked by `npm run palette:check`:

- every pair of swatches is at least **0.08 apart in OKLab** (ΔE_ok; about four
  times the smallest difference the eye notices); the closest pairs today are
  burgundy–ink and sea–olive (0.082);
- the card's text has a contrast of at least **4.5:1** with its ground (paper text
  on the dark swatches, ink on the light ones; the lowest is tan, 4.54:1).

Ten swatches: six in use, four free. A region's form offers only the free ones
and the database refuses a colour twice (a unique column). To add a swatch, add
it to `SWATCHES` and run the check.

## Capacity (measured on Neon, 2026-10-29, after the import)

| | |
| --- | --- |
| Whole database | **9.3 MB**, of which ~7.5 MB is Postgres's own catalogue (an empty database weighs that) |
| `work_texts` | 1.06 MB: 9 texts, 1.82 MB of Markdown stored as 0.96 MB (Postgres compresses long text) |
| `works` | 144 kB for 59 records, with indexes |
| Every other table | 24–48 kB each (a page or two plus indexes) |
| A record (no text) | ~1.0 kB of data, ~2.5 kB with its share of indexes |
| A full text | ~2.9 bytes stored per word: median 37 kB (11,000 words), average 107 kB, largest 487 kB (Acosta, 171,000 words) |

Neon's free plan allows **0.5 GB** per project. Leaving 100 MB aside for
Postgres's own files, its write-ahead log and growth, about **400 MB** are for
the archive:

- **Records only** (works in copyright, links only): ~2.5 kB each → room for
  **~150,000** more.
- **Works with a full text of average length** (~107 kB) → **~3,700** more; with
  the history counted (each save keeps a full copy; say three saves per work,
  ~430 kB) → **~900** more. Texts of median length (~37 kB, ~150 kB with
  history) → **~2,600** more.
- History is capped at 50 versions per work. If space ever gets tight, lower
  `KEEP_REVISIONS` in `site/lib/admin/article-status.ts` or prune old versions; `npm run
  db:size` shows where the space goes.

**Compute**: Neon's free plan gives 100 CU-hours a month and the database
sleeps after 5 minutes idle (the first request after that waits about half a
second). Visitors never wake it: the archive's pages are static and cached; the
database is read only when a page is rebuilt after a save, and by `/admin`. An
hour of editing costs about 0.25 CU-hours, so the allowance covers hundreds of
hours of editing a month.

**Images and uploads** are out of scope for now. When they come (a cover per
work, scans, the approved PDFs of the 80), the files go in **Vercel Blob** and
only their addresses in the database. (The Patreon PDFs of #72 are cancelled:
the archive is free and without registration; paid content goes on Substack.)

## Where things are

- Back office: `site/app/admin/` (pages; `actions.ts` = every change),
  `site/components/admin/`, `site/lib/admin/` (session, password, queries, types)
- Database: `site/lib/db/` (schema, connection), `site/db/migrations/`,
  `site/drizzle.config.ts`, scripts in `site/scripts/`
- How the site reads it: `site/lib/archive.ts`; texts: `site/lib/text.ts`,
  `site/lib/markdown.ts`; citations: `site/lib/cite.ts`; palette: `site/lib/palette.ts`;
  backup and import: `site/lib/backup.ts`
- The 80 texts: the landing `site/app/[lang]/archive/page.tsx` and
  `site/components/archive/`, the rules `site/lib/editions.ts`, the import
  `site/scripts/iberofonia-import.mts`, the review page `site/app/admin/(panel)/curated/`,
  the form's part `site/components/admin/CuratedFields.tsx`; the Collaborate page
  `site/app/[lang]/work-with-us/` (served at `/es/colabora` too, `next.config.ts`)
- Words of the back office (ES + EN): `adminDict` at the end of `site/lib/i18n.ts`
