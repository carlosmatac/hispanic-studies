import { config, collection, fields } from '@keystatic/core';
import { LANGUAGES, PERIODS, REGIONS } from './lib/canon';

/* The CMS (issue #69): Keystatic, at /keystatic. It edits the archive's files
   in content/archive/ — one Markdown file per work, its record in the
   frontmatter and, when the work is in the public domain, its full text as
   the body. Locally it writes to the disk; on the deployed site it commits to
   GitHub (set NEXT_PUBLIC_KEYSTATIC_STORAGE=github and the four KEYSTATIC_*
   variables, see docs/cms.md). The site reads the same files at build time
   (lib/archive.ts), so a saved change is live after the next deploy. */

const github = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github';
const [owner, name] = (process.env.NEXT_PUBLIC_KEYSTATIC_REPO || 'carlosmatac/hispanic-studies').split('/');

const text = (label: string, description?: string, multiline = false) =>
  fields.text({ label, description, multiline });

export default config({
  storage: github
    // the site lives in site/ inside the repository; new branches made from the editor start with content/
    ? { kind: 'github', repo: { owner, name }, pathPrefix: 'site', branchPrefix: 'content/' }
    : { kind: 'local' },
  ui: { brand: { name: 'IHS · Archive' } },
  collections: {
    archive: collection({
      label: 'Archive of Hispanic thought',
      path: 'content/archive/*',
      slugField: 'title',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'author', 'year'],
      previewUrl: '/en/archive/{slug}',
      schema: {
        title: fields.slug({
          name: { label: 'Title', description: 'As the work was published. "Title: subtitle" shows the subtitle on its own line.', validation: { isRequired: true } },
          slug: {
            label: 'Address (id)',
            description: 'The last part of the web address: /archive/<id>. The fifty works from the compiler keep their ids (T001…T050); do not change an existing one, links point at it.',
          },
        }),
        author: text('Author', 'The name the author is known by, e.g. "Miguel de Unamuno".'),
        fullName: text('Author’s full name'),
        life: text('Author’s dates', 'e.g. 1853–1895'),
        year: fields.integer({ label: 'Year', description: 'Year the text was written or first published; it decides the period.', validation: { isRequired: true } }),
        period: fields.select({
          label: 'Period',
          options: PERIODS.map((p) => ({ label: `${p.name.en} (${p.from}–${p.to})`, value: p.id })),
          defaultValue: 'continent',
        }),
        region: fields.select({
          label: 'Region (the colour of the card)',
          description: 'Where the author worked or what the text is about.',
          options: REGIONS.map((r) => ({ label: `${r.name.en} — ${r.note.en}`, value: r.id })),
          defaultValue: 'south-america',
        }),
        place: text('Places', 'Countries tied to the author, e.g. "Cuba; Mexico; United States".'),
        code: text('Country code', 'Two or three letters shown on the card, e.g. CU.'),
        language: fields.select({
          label: 'Language of the text',
          options: LANGUAGES.map((l) => ({ label: l.name.en, value: l.id })),
          defaultValue: 'es',
        }),
        rights: fields.select({
          label: 'Rights',
          description: 'Only works in the public domain in the US, in Spain and in their own country may have their full text below. Every other work gets links to legitimate copies instead.',
          options: [
            { label: 'Public domain everywhere (the text can be hosted)', value: 'public-domain' },
            { label: 'Public domain in the US only, not yet in Spain (record and links)', value: 'pd-us-only' },
            { label: 'Public domain in Spain, not yet in the US (record and links)', value: 'pd-outside-us' },
            { label: 'In copyright (record and links only)', value: 'in-copyright' },
            { label: 'Not yet checked', value: 'unverified' },
          ],
          defaultValue: 'unverified',
        }),
        pdSpainYear: fields.integer({ label: 'Public domain in Spain from (year)', description: 'Optional: the year (1 January) the work enters the public domain in Spain, e.g. 2027.' }),
        pdUsYear: fields.integer({ label: 'Public domain in the US from (year)', description: 'Optional: the year (1 January) the work enters the public domain in the US.' }),
        needsTranscription: fields.checkbox({ label: 'Needs a transcription', description: 'Public domain, but only scans exist: someone has to transcribe and proofread it before the text can go in.' }),
        counter: fields.checkbox({ label: 'Argued against Hispanic unity', description: 'Marks the card with a dashed frame.' }),
        camp: text('Camp (compiler, English)'),
        position: text('Position (compiler, English)', 'The author’s position, from the compiler’s record.', true),
        buenoCode: text('Bueno class code', 'e.g. B1'),
        buenoName: text('Bueno class name'),
        noteEn: text('Note on the text (English)', 'Optional: dates, editions, anything a reader should know first.', true),
        noteEs: text('Note on the text (Spanish)', undefined, true),
        summaryEn: text('Summary (English)', 'Optional.', true),
        summaryEs: text('Summary (Spanish)', 'Optional.', true),
        sourceEdition: text('Source: edition', 'The edition the text below was transcribed from, e.g. "Caracas: Devisme, 1833".'),
        sourceUrl: fields.url({ label: 'Source: address', description: 'Where the text was taken from (e.g. the Wikisource page).' }),
        sourceRevision: text('Source: revision', 'For Wikisource, the page revision id the text was copied from.'),
        sourceLicence: text('Source: licence', 'e.g. "Public domain; transcription CC BY-SA 4.0 (Wikisource)".'),
        links: fields.array(
          fields.object({
            label: text('Label', 'e.g. "First edition, Seville 1552 (John Carter Brown Library)"'),
            url: fields.url({ label: 'Address' }),
          }),
          {
            label: 'Links to legitimate copies',
            description: 'Scans of early editions, libraries, publishers, Internet Archive lending. Never unlicensed PDFs.',
            itemLabel: (p) => p.fields.label.value || 'Link',
          },
        ),
        body: fields.markdoc({
          label: 'Full text',
          description: 'Only for public-domain works, in the original language. Use "Heading 2" for chapters: they become the contents.',
          extension: 'md',
          options: { image: false },
        }),
      },
    }),
  },
});
