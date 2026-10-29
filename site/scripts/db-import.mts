import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { BACKUP_FORMAT, BACKUP_VERSION, importArchive, type Backup, type BackupWork } from '@/lib/backup';
import { dict } from '@/lib/i18n';
import { openDb, where } from './env.mts';

/* npm run db:import — fills the database.
     npm run db:import                         the 59 works as they were in the Markdown files
                                               (read from git: commit 246fe7e, the last with
                                               site/content/archive/), with the six periods,
                                               the six regions and the page's copy
     npm run db:import -- --markdown <dir>     the same from a folder of .md files
     npm run db:import -- --backup <file>      a backup made by /admin or `npm run db:export`
     add --overwrite                           to replace rows that already exist
   Without --overwrite only what is missing goes in, so running it again never
   undoes Beltrán's edits. */

const LAST_MARKDOWN = '246fe7e';
const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const overwrite = args.includes('--overwrite');

/* the periods and regions as they were in lib/canon.ts before the move (#68) */
const SECTIONS = [
  { id: 'prelude', yearFrom: 1492, yearTo: 1799, nameEn: 'Prelude: the Empire’s own thought', nameEs: 'Preludio: el pensamiento del Imperio' },
  { id: 'independence', yearFrom: 1800, yearTo: 1870, nameEn: 'Independence and the first unions', nameEs: 'La independencia y las primeras uniones' },
  { id: 'ninety-eight', yearFrom: 1871, yearTo: 1900, nameEn: 'From Iberism to 1898', nameEs: 'Del iberismo al 98' },
  { id: 'continent', yearFrom: 1901, yearTo: 1930, nameEn: 'Ariel and the continent', nameEs: 'Ariel y el continente' },
  { id: 'hispanidad', yearFrom: 1931, yearTo: 1960, nameEn: 'Hispanidad, Indo-America, the Lusophone world', nameEs: 'Hispanidad, Indoamérica, el mundo lusófono' },
  { id: 'after-empire', yearFrom: 1961, yearTo: 2000, nameEn: 'After empire', nameEs: 'Después del imperio' },
].map((s, position) => ({ ...s, position }));

const REGIONS = [
  { id: 'spain', swatch: 'burgundy', nameEn: 'Spain', nameEs: 'España', noteEn: 'and its exiles', noteEs: 'y su exilio' },
  { id: 'south-america', swatch: 'leather', nameEn: 'South America', nameEs: 'Sudamérica', noteEn: 'Spanish-speaking', noteEs: 'hispanohablante' },
  { id: 'north-america', swatch: 'ink', nameEn: 'North America', nameEs: 'Norteamérica', noteEn: 'Mexico and Central America', noteEs: 'México y Centroamérica' },
  { id: 'caribbean', swatch: 'sea', nameEn: 'Caribbean', nameEs: 'Caribe', noteEn: 'Cuba, Puerto Rico, Santo Domingo', noteEs: 'Cuba, Puerto Rico, Santo Domingo' },
  { id: 'lusophone', swatch: 'olive', nameEn: 'Lusophone world', nameEs: 'Mundo lusófono', noteEn: 'Portugal, Brazil, Lusophone Africa', noteEs: 'Portugal, Brasil, África lusófona' },
  { id: 'ibero-asia', swatch: 'paper', nameEn: 'Ibero-Asia', nameEs: 'Iberoasia', noteEn: 'the Philippines, Goa', noteEs: 'Filipinas, Goa' },
].map((r, position) => ({ ...r, position }));

function page(): Backup['page'] {
  const [en, es] = [dict('en').canon, dict('es').canon];
  return {
    titleEn: en.h, titleEs: es.h, introEn: en.sub, introEs: es.sub, notesEn: en.disclaimer, notesEs: es.disclaimer,
    doorEn: en.door(0).replace(/^0 /, '{works} '), doorEs: es.door(0).replace(/^0 /, '{works} '),
  };
}

/** The .md files: from a folder, or from git at a commit. */
function readMarkdown(source: string): [string, string][] {
  if (!source.startsWith('git:')) {
    return fs.readdirSync(source).filter((f) => f.endsWith('.md')).map((f) => [f, fs.readFileSync(path.join(source, f), 'utf8')]);
  }
  const ref = source.slice(4);
  const dir = 'site/content/archive';
  const git = (...a: string[]) => execFileSync('git', a, { cwd: path.resolve('..'), encoding: 'utf8', maxBuffer: 64 << 20 });
  return git('ls-tree', '--name-only', `${ref}:${dir}`).split('\n').filter((f) => f.endsWith('.md')).map((f) => [f, git('show', `${ref}:${dir}/${f}`)]);
}

const str = (v: unknown) => (v == null ? '' : String(v));
const num = (v: unknown) => (v == null || v === '' ? null : Number(v));

function toWork(file: string, raw: string): BackupWork {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: no frontmatter`);
  const f = parseYaml(m[1]) as Record<string, unknown>;
  const body = m[2].trim();
  const language = str(f.language) || 'es';
  return {
    id: file.replace(/\.md$/, ''),
    status: 'published',
    title: str(f.title),
    author: str(f.author),
    fullName: str(f.fullName),
    life: str(f.life),
    year: Number(f.year) || 0,
    sectionId: str(f.period) || 'continent',
    regionId: str(f.region) || 'south-america',
    place: str(f.place),
    code: str(f.code),
    language,
    rights: (str(f.rights) || 'unverified') as BackupWork['rights'],
    pdSpainYear: num(f.pdSpainYear),
    pdUsYear: num(f.pdUsYear),
    needsTranscription: !!f.needsTranscription,
    counter: !!f.counter,
    camp: str(f.camp),
    stance: str(f.position),
    buenoCode: str(f.buenoCode),
    buenoName: str(f.buenoName),
    noteEn: str(f.noteEn),
    noteEs: str(f.noteEs),
    summaryEn: str(f.summaryEn),
    summaryEs: str(f.summaryEs),
    sourceEdition: str(f.sourceEdition),
    sourceUrl: str(f.sourceUrl),
    sourceRevision: str(f.sourceRevision),
    sourceLicence: str(f.sourceLicence),
    links: ((f.links as { label?: string; url?: string }[] | undefined) ?? []).filter((l) => l?.url).map((l) => ({ label: str(l.label), url: str(l.url) })),
    updatedBy: 'import',
    texts: body ? [{ lang: language, body: body + '\n' }] : [],
    references: [],
  };
}

let data: Backup;
const backup = opt('--backup');
if (backup) {
  data = JSON.parse(fs.readFileSync(backup, 'utf8'));
} else {
  const source = opt('--markdown') ?? `git:${LAST_MARKDOWN}`;
  const works = readMarkdown(source).map(([f, raw]) => toWork(f, raw));
  data = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), page: page(), sections: SECTIONS, regions: REGIONS, works };
  console.log(`Read ${works.length} works from ${source}.`);
}

const { db, pool } = openDb();
console.log(`Importing into ${where()}${overwrite ? ' (overwriting)' : ''}…`);
const t0 = Date.now();
const r = await importArchive(db, data, { overwrite });
console.log(`page copy: ${r.page ? 'written' : 'kept'}; sections: ${r.sections} written; regions: ${r.regions} written; works: ${r.works} written` +
  (r.skipped.length ? `, ${r.skipped.length} already there (kept; --overwrite to replace)` : '') + ` (${((Date.now() - t0) / 1000).toFixed(1)} s).`);
await pool.end();
