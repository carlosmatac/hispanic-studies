import fs from 'node:fs';
import path from 'node:path';
import { eq, isNotNull } from 'drizzle-orm';
import { schema } from '@/lib/db';
import { readWork, writeWork, type BackupArticle, type BackupEdition, type BackupWork } from '@/lib/backup';
import { LANGUAGES } from '@/lib/canon';
import { sourceNameFor } from '@/lib/editions';
import { openDb, where } from './env.mts';

/* npm run iberofonia:import — Beltrán's curated 80 (issue #93) into the archive.

     npm run iberofonia:import                      dry run: prints what it would do, writes nothing
     npm run iberofonia:import -- --manifest f.md   …and writes that report as Markdown (for the PR)
     npm run iberofonia:import -- --apply           does it
     add --json <file>                              another version of the JSON
                                                    (default: docs/research/iberofonia/DEI_Iberofonia_Archive_80.json)
     add --overwrite                                take the JSON's curated fields, articles and editions
                                                    over what is in the database (a version is kept in each
                                                    work's history first); approvals to host are never touched

   It upserts by Beltrán's id (canon_id, DEI-C001 …):
   - a work already connected (it has that canon_id) is left as it is, except
     what is missing (an article, an edition) — so running it twice changes nothing
     and never undoes Beltrán's edits;
   - a work that is already in our archive (MERGES below: the same work, decided
     by hand) is connected: it keeps its id, address, record, texts and links,
     and gains the curated fields, the two articles and the editions;
   - anything else is a new work, with Beltrán's slug as its address, as a draft;
   - a work connected before whose canon_id is no longer in the JSON leaves the
     80 (`curated` off): its record, address and sources stay.
   Every article comes in "in review": nothing new is public until it is approved
   at /admin/curated. Hosting is never switched on here (the JSON's
   html_candidate/pdf_candidate are a queue for staff, not permission).
   After --apply, save any work at /admin once to refresh the site's cache. */

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const apply = args.includes('--apply');
const overwrite = args.includes('--overwrite');
const jsonPath = opt('--json') ?? path.resolve('..', 'docs/research/iberofonia/DEI_Iberofonia_Archive_80.json');
const manifestPath = opt('--manifest');
const BY = 'iberofonia:import';

/* ---------------- the JSON ---------------- */

type Loc = { es: string; en: string };
type JEdition = {
  id: string; languages: string[]; extent: string; url: string; citation: string; public_languages: string[];
  publication_year: number | null; scope_check: string; delivery_plan: string; us_hosting_basis: string;
  render_mode: string; rights_approved: boolean; local_asset: unknown;
};
type JCopy = { title: string; about_author: string; work_in_its_time: string; why_read_today: string };
type JWork = {
  canon_id: string; order: number; era_id: string; slug: string; work_title: string; creator: string;
  date: { display: string; kind: string }; original_languages: string[]; scope: string; region_ids: string[];
  geographic_note: string; status: string; copy: { es: JCopy; en: JCopy };
  reading: { language: string; role: string; best_edition_id: string; other_edition_ids: string[]; complete_online: boolean }[];
  editions: JEdition[]; english_state: string; edition_notes: string;
  companion_documents: { title: string; url: string; note: string; relationship: string }[];
};
type JData = {
  schema_version: string; titles: Loc; era_index: Record<string, { title: Loc; first: number; last: number }>;
  region_names: Record<string, Loc>; omitted_from_this_edition: Record<string, { title: string; slug: string; reason: string }>;
  works: JWork[];
};

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as JData;
const problems: string[] = [];
const check = (ok: unknown, msg: string) => { if (!ok) problems.push(msg); };
check(data.schema_version === '3.0', `schema_version is ${data.schema_version}, expected 3.0`);
check(data.works.length === 80, `${data.works.length} works, expected 80`);
check(new Set(data.works.map((w) => w.canon_id)).size === data.works.length, 'canon_id repeated');
check(new Set(data.works.map((w) => w.slug)).size === data.works.length, 'slug repeated');
check(Object.keys(data.era_index).length === 6, 'expected six eras');
for (const w of data.works) {
  check(data.era_index[w.era_id], `${w.canon_id}: unknown era ${w.era_id}`);
  check(w.copy?.es?.about_author && w.copy?.en?.about_author, `${w.canon_id}: an article is missing`);
}
if (problems.length) {
  console.error('The JSON does not look right:\n- ' + problems.join('\n- '));
  process.exit(1);
}

/* ---------------- decided by hand ---------------- */

/**
 * The works of the 80 that are already in our archive (same work, checked by
 * hand on 2026-11-22). They keep their id (and so their address and #T030
 * links), record and texts. Notes go into the manifest.
 */
const MERGES: Record<string, { id: string; note?: string }> = {
  'DEI-C007': { id: 'vitoria-de-indis' },
  'DEI-C022': { id: 'garcilaso-comentarios-reales' },
  'DEI-C024': { id: 'guaman-poma-nueva-coronica' },
  'DEI-C025': { id: 'solorzano-politica-indiana' },
  'DEI-C028': { id: 'clavijero-historia-antigua' },
  'DEI-C030': { id: 'T001' },
  'DEI-C032': { id: 'T002' },
  'DEI-C035': { id: 'T003', note: 'Beltrán\'s scope is the Prólogo (a named section); our hosted text is that Prólogo.' },
  'DEI-C038': { id: 'T005' },
  'DEI-C039': { id: 'T006' },
  'DEI-C042': { id: 'T010' },
  'DEI-C043': { id: 'T012' },
  'DEI-C044': { id: 'T013' },
  'DEI-C083': { id: 'T015', note: 'A new id in Beltrán\'s list (083) for a work we already have, with its hosted text.' },
  'DEI-C084': { id: 'T016', note: 'A new id in Beltrán\'s list (084) for a work we already have.' },
  'DEI-C046': { id: 'T017', note: 'Our record is "El triunfo de Calibán and hemispheric writings"; Beltrán\'s is the essay alone. Same core work: connected, his header shows the essay.' },
  'DEI-C047': { id: 'T018' },
  'DEI-C048': { id: 'T020' },
  'DEI-C049': { id: 'T022' },
  'DEI-C050': { id: 'T024' },
  'DEI-C051': { id: 'T026' },
  'DEI-C052': { id: 'T027' },
  'DEI-C053': { id: 'T028' },
  'DEI-C054': { id: 'T030', note: 'Beltrán\'s scope is the essay "Misión de la raza iberoamericana" inside La raza cósmica (a named section); our record is the book.' },
  'DEI-C055': { id: 'T031' },
  'DEI-C056': { id: 'T032' },
  'DEI-C057': { id: 'T035' },
  'DEI-C058': { id: 'T036' },
  'DEI-C061': { id: 'T039' },
  'DEI-C062': { id: 'T038', note: 'Beltrán\'s scope is one chapter (on transculturation) of Contrapunteo cubano; our record is the book.' },
  'DEI-C069': { id: 'T045' },
  'DEI-C070': { id: 'T046' },
};

/** Same author, different work: not connected (a new record is made; ours stays outside the 80). */
const NOT_THE_SAME: Record<string, string> = {
  'DEI-C040': 'T009 (Hostos, "Antillean federation essays and speeches: new selection") is a selection, not "En el Istmo — Mi viaje al Sur": kept apart.',
  'DEI-C068': 'T044 (Agostinho da Silva, "Um Fernando Pessoa") is another work than "Condições e missão da Comunidade Luso-Brasileira": kept apart.',
  'DEI-C010': 'las-casas-brevisima (the Brevísima relación) is another work than the Tratado comprobatorio: kept apart.',
};

/** Retired from this edition of the 80, with a record of ours (it stays as it is). */
const RETIRED_WITH_RECORD: Record<string, string> = {
  'DEI-C073': 'T049 (Nick Joaquín, Culture and History) stays in the archive, outside the 80.',
};

/** Which of two paired documents an edition is (Isabel's will and codicil, kept apart as the brief asks). */
const SCOPE_NOTES: Record<string, string> = {
  'DEI-C081-SWILL': 'Testamento · 12-X-1504',
  'DEI-C081-SCOD': 'Codicilo · 23-XI-1504',
  'DEI-C081-SMARCH': 'Codicilo · 23-XI-1504',
};

/* ---------------- shaping a work ---------------- */

const yearOf = (display: string) => Number(/\d{4}/.exec(display)?.[0] ?? NaN);

/** The colour region of a new work (our six): the first of Beltrán's regions that has one, else by language. */
function colourRegion(w: JWork): string {
  const pt = w.original_languages[0] === 'pt';
  for (const r of w.region_ids) {
    if (r === 'ip') return pt ? 'lusophone' : 'spain';
    if (r === 'mx') return 'north-america';
    if (r === 'ca') return 'caribbean';
    if (r === 'an' || r === 'sc') return 'south-america';
    if (r === 'br' || r === 'af') return 'lusophone';
    if (r === 'as') return 'ibero-asia';
  }
  return pt ? 'lusophone' : 'spain';
}

/** The edition's name for readers: the first clause of the editor's note, without the instructions to staff. */
function publicLabel(citation: string): string {
  const first = citation.split(/;\s+/)[0];
  const parts = first.split(/(?<=\.)\s+|,\s+/).filter((p) => !/\b(verify|confirm|recheck|check|before reuse|user-supplied|must be supplied|to recheck)\b/i.test(p));
  return parts.join(', ').replace(/,\s*$/, '').trim();
}

function editionsOf(w: JWork): BackupEdition[] {
  const out: BackupEdition[] = [];
  const used = new Set<string>();
  const base = (e: JEdition, id: string, readingLang: string, primary: boolean): BackupEdition => ({
    id, position: 0, readingLang, primary,
    languages: e.languages, extent: e.extent, url: e.url,
    label: publicLabel(e.citation), sourceName: sourceNameFor(e.url), translator: '', scopeNote: SCOPE_NOTES[e.id] ?? '',
    citation: e.citation, publicationYear: e.publication_year, scopeCheck: e.scope_check,
    deliveryPlan: e.delivery_plan, usHostingBasis: e.us_hosting_basis,
    renderMode: e.render_mode === 'bibliographic_link' ? 'bibliographic_link' : 'external_link',
    // never switched on by an import: hosting is approved at /admin with its evidence
    rightsApproved: false, rightsBasis: '', rightsEvidence: '', completeSpan: '', approvedBy: '', approvedOn: '', pdfUrl: '',
  });
  for (const panel of w.reading) {
    for (const id of [panel.best_edition_id, ...panel.other_edition_ids]) {
      const e = w.editions.find((x) => x.id === id);
      if (!e) continue;
      // an edition in two reading languages (e.g. a bilingual declaration) is listed in both
      const rowId = used.has(id) ? `${id}~${panel.language}` : id;
      used.add(id);
      out.push(base(e, rowId, panel.language, id === panel.best_edition_id));
    }
  }
  for (const e of w.editions) if (!used.has(e.id)) out.push(base(e, e.id, '', false));
  return out.map((e, i) => ({ ...e, position: i }));
}

const articlesOf = (w: JWork): BackupArticle[] => (['es', 'en'] as const).map((l) => ({
  locale: l,
  title: w.copy[l].title,
  aboutAuthor: w.copy[l].about_author.trim(),
  workInItsTime: w.copy[l].work_in_its_time.trim(),
  whyReadToday: w.copy[l].why_read_today.trim(),
}));

const curatedFields = (w: JWork) => ({
  canonId: w.canon_id,
  slug: w.slug,
  curated: true,
  curatedOrder: w.order,
  eraId: w.era_id,
  originalTitle: w.work_title,
  creator: w.creator,
  dateDisplay: w.date.display,
  dateKind: w.date.kind,
  scope: w.scope,
  originalLanguages: w.original_languages,
  browseRegionIds: w.region_ids,
  geographicNote: w.geographic_note,
  englishState: w.english_state,
  editionNotes: w.edition_notes,
  companions: (w.companion_documents ?? []).map((c) => ({ title: c.title, url: c.url, note: c.note, relationship: c.relationship })),
});

/* ---------------- plan ---------------- */

const { db, pool } = openDb();
const rows = await db.select({
  id: schema.works.id, canonId: schema.works.canonId, slug: schema.works.slug, title: schema.works.title, author: schema.works.author,
  year: schema.works.year, status: schema.works.status, curated: schema.works.curated, curatedOrder: schema.works.curatedOrder, eraId: schema.works.eraId,
}).from(schema.works);
const texts = await db.select({ workId: schema.workTexts.workId, lang: schema.workTexts.lang }).from(schema.workTexts);
const sections = await db.select().from(schema.sections);
const regions = await db.select({ id: schema.regions.id }).from(schema.regions);
const eraRows = await db.select({ id: schema.eras.id }).from(schema.eras);
const byId = new Map(rows.map((r) => [r.id, r]));
const byCanon = new Map(rows.filter((r) => r.canonId).map((r) => [r.canonId!, r]));
const bySlug = new Map(rows.filter((r) => r.slug).map((r) => [r.slug!, r]));
const textsOf = (id: string) => texts.filter((t) => t.workId === id).map((t) => t.lang);
const sectionFor = (year: number) => [...sections].sort((a, b) => a.position - b.position).filter((s) => s.yearFrom == null || s.yearFrom <= year).pop()?.id ?? sections[0]?.id;

type Plan =
  | { kind: 'connected'; w: JWork; id: string; diffs: string[] }
  | { kind: 'merge'; w: JWork; id: string; note?: string; diffs: string[] }
  | { kind: 'new'; w: JWork; id: string; sectionId: string; regionId: string; year: number }
  | { kind: 'conflict'; w: JWork; why: string };

const plans: Plan[] = [];
for (const w of data.works) {
  const connected = byCanon.get(w.canon_id);
  if (connected) {
    const diffs: string[] = [];
    if (connected.curatedOrder !== w.order) diffs.push(`order ${connected.curatedOrder} → JSON ${w.order}`);
    if (connected.eraId !== w.era_id) diffs.push(`era ${connected.eraId} → JSON ${w.era_id}`);
    if (connected.slug !== w.slug) diffs.push(`slug ${connected.slug} → JSON ${w.slug} (kept: addresses must not change)`);
    if (!connected.curated) diffs.push('back in the 80');
    plans.push({ kind: 'connected', w, id: connected.id, diffs });
    continue;
  }
  const m = MERGES[w.canon_id];
  if (m) {
    const r = byId.get(m.id);
    if (!r) { plans.push({ kind: 'conflict', w, why: `meant to connect to ${m.id}, which is not in the database` }); continue; }
    if (r.canonId) { plans.push({ kind: 'conflict', w, why: `${m.id} is already connected to ${r.canonId}` }); continue; }
    const other = bySlug.get(w.slug);
    if (other && other.id !== r.id) { plans.push({ kind: 'conflict', w, why: `slug ${w.slug} already belongs to ${other.id}` }); continue; }
    const taken = byId.get(w.slug);
    if (taken && taken.id !== r.id) { plans.push({ kind: 'conflict', w, why: `slug ${w.slug} is the id of another work (${taken.id})` }); continue; }
    const diffs: string[] = [];
    const y = yearOf(w.date.display);
    if (r.year !== y) diffs.push(`year: ours ${r.year}, Beltrán's ${w.date.display}`);
    if (r.title.split(':')[0].trim().toLowerCase() !== w.work_title.split(/[:—]/)[0].trim().toLowerCase()) diffs.push(`title: ours "${r.title}", Beltrán's "${w.work_title}"`);
    plans.push({ kind: 'merge', w, id: r.id, note: m.note, diffs });
    continue;
  }
  const clash = byId.get(w.slug) ?? bySlug.get(w.slug);
  if (clash) { plans.push({ kind: 'conflict', w, why: `its slug ${w.slug} is already used by ${clash.id} ("${clash.title}"), which is not listed as the same work` }); continue; }
  const year = yearOf(w.date.display);
  if (Number.isNaN(year)) { plans.push({ kind: 'conflict', w, why: `no year in "${w.date.display}"` }); continue; }
  plans.push({ kind: 'new', w, id: w.slug, sectionId: sectionFor(year)!, regionId: colourRegion(w), year });
}
const inJson = new Set(data.works.map((w) => w.canon_id));
const retire = rows.filter((r) => r.canonId && r.curated && !inJson.has(r.canonId));
const unknownLang = data.works.filter((w) => !LANGUAGES.some((l) => l.id === w.original_languages[0]));
const missingRegion = plans.filter((p) => p.kind === 'new' && !regions.some((r) => r.id === p.regionId));

/* ---------------- the manifest ---------------- */

const count = (k: Plan['kind']) => plans.filter((p) => p.kind === k).length;
const editionsTotal = data.works.reduce((n, w) => n + w.editions.length, 0);
const queue = data.works.flatMap((w) => w.editions.filter((e) => e.delivery_plan === 'html_candidate' || e.delivery_plan === 'pdf_candidate').map((e) => ({ w, e })));
const md: string[] = [];
md.push(`# Iberofonía import: ${apply ? 'applied' : 'dry run'} (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC, ${where()})`, '');
md.push(`JSON: schema ${data.schema_version}, ${data.works.length} works in ${Object.keys(data.era_index).length} eras, ${data.works.length * 2} articles, ${editionsTotal} editions.`, '');
md.push('| | Works |', '| --- | ---: |');
md.push(`| Connected to a record we already have (merge) | ${count('merge')} |`);
md.push(`| New records (drafts) | ${count('new')} |`);
md.push(`| Already connected by an earlier run | ${count('connected')} |`);
md.push(`| Conflicts (not written) | ${count('conflict')} |`);
md.push(`| Leaving the 80 (record kept) | ${retire.length} |`, '');
if (count('conflict')) {
  md.push('## Conflicts', '');
  for (const p of plans) if (p.kind === 'conflict') md.push(`- **${p.w.canon_id}** ${p.w.work_title}: ${p.why}`);
  md.push('');
}
md.push('## Merges: the same work, connected', '', 'They keep their id, address (`/archive/<id>`, `#id` links), record, texts and links; they gain the header, the two articles and the editions.', '');
md.push('| Beltrán | Work | Our record | Hosted text | Notes |', '| --- | --- | --- | --- | --- |');
for (const p of plans) if (p.kind === 'merge') {
  md.push(`| ${p.w.canon_id} (#${p.w.order}) | ${p.w.creator}, *${p.w.work_title}* | \`${p.id}\` | ${textsOf(p.id).join(', ') || '—'} | ${[p.note, ...p.diffs].filter(Boolean).join(' ') || ''} |`);
}
md.push('', '## New records', '', 'Address = Beltrán\'s slug. Draft until approved. Colour region and old section are worked out (editable at /admin).', '');
md.push('| Beltrán | Work | Address | Year | Colour region |', '| --- | --- | --- | ---: | --- |');
for (const p of plans) if (p.kind === 'new') md.push(`| ${p.w.canon_id} (#${p.w.order}) | ${p.w.creator}, *${p.w.work_title}* | \`${p.id}\` | ${p.year} | ${p.regionId} |`);
if (count('connected')) {
  md.push('', '## Already connected', '');
  for (const p of plans) if (p.kind === 'connected') md.push(`- ${p.w.canon_id} → \`${p.id}\`${p.diffs.length ? `: ${p.diffs.join('; ')}${overwrite ? '' : ' (kept; --overwrite to take the JSON)'}` : ': unchanged'}`);
}
md.push('', '## Same author, another work (kept apart)', '');
for (const [k, v] of Object.entries(NOT_THE_SAME)) md.push(`- ${k}: ${v}`);
md.push('', '## Retired from this edition of the 80', '');
for (const [k, v] of Object.entries(data.omitted_from_this_edition)) {
  const ours = byCanon.get(k);
  md.push(`- ${k} *${v.title}*: ${ours ? `our record \`${ours.id}\` leaves the 80, kept.` : RETIRED_WITH_RECORD[k] ?? 'no record of ours.'}`);
}
for (const r of retire) md.push(`- ${r.canonId} → \`${r.id}\` was in the 80 and is not in this JSON: leaves it (record and address kept).`);
md.push('', `## Edition approval queue (${queue.length})`, '', 'The JSON\'s `html_candidate` / `pdf_candidate`: a proofed file and a documented U.S. approval are needed before anything is hosted. Nothing here is hosted by the import.', '');
md.push('| Edition | Work | Lang | Plan | Year | U.S. basis |', '| --- | --- | --- | --- | ---: | --- |');
for (const { w, e } of queue) md.push(`| ${e.id} | ${w.creator}, *${w.work_title}* | ${e.languages.join('+')} | ${e.delivery_plan.replace('_candidate', '')} | ${e.publication_year ?? '—'} | ${e.us_hosting_basis} |`);
if (unknownLang.length) md.push('', `Original languages not in lib/canon.ts LANGUAGES: ${unknownLang.map((w) => `${w.canon_id} ${w.original_languages.join('+')}`).join(', ')}`);
if (missingRegion.length) md.push('', `Colour regions missing in the database: ${missingRegion.map((p) => p.kind === 'new' && p.regionId).join(', ')}`);
const manifest = md.join('\n') + '\n';
if (manifestPath) fs.writeFileSync(manifestPath, manifest);
console.log(manifest);

if (!apply) {
  console.log(`Dry run: nothing written to ${where()}. Add --apply to write.`);
  await pool.end();
  process.exit(count('conflict') ? 2 : 0);
}
if (count('conflict') || missingRegion.length) {
  console.error('Not applied: solve the conflicts above first.');
  await pool.end();
  process.exit(2);
}

/* ---------------- apply ---------------- */

const stats = { eras: 0, regions: 0, merged: 0, created: 0, articles: 0, editions: 0, retired: 0, updated: 0 };
await db.transaction(async (tx) => {
  for (const [i, [id, e]] of Object.entries(data.era_index).entries()) {
    const years = e.title.en.match(/(\d{4})\s*-\s*(\d{4})\s*$/);
    const v = { id, position: i, nameEn: e.title.en, nameEs: e.title.es, yearFrom: years ? Number(years[1]) : null, yearTo: years ? Number(years[2]) : null };
    const q = tx.insert(schema.eras).values(v);
    const r = overwrite ? await q.onConflictDoUpdate({ target: schema.eras.id, set: { ...v, updatedAt: new Date() } }).returning() : await q.onConflictDoNothing().returning();
    if (!eraRows.some((x) => x.id === id)) stats.eras += r.length;
  }
  for (const [i, [id, n]] of Object.entries(data.region_names).entries()) {
    const v = { id, position: i, nameEn: n.en, nameEs: n.es };
    const q = tx.insert(schema.browseRegions).values(v);
    const r = overwrite ? await q.onConflictDoUpdate({ target: schema.browseRegions.id, set: { ...v, updatedAt: new Date() } }).returning() : await q.onConflictDoNothing().returning();
    stats.regions += r.length;
  }

  for (const p of plans) {
    if (p.kind === 'conflict') continue;
    const w = p.w;
    if (p.kind === 'new') {
      const work: BackupWork = {
        id: p.id, status: 'draft', title: w.work_title, author: w.creator, fullName: '', life: '', year: p.year,
        sectionId: p.sectionId, regionId: p.regionId, place: w.geographic_note, code: '',
        language: LANGUAGES.some((l) => l.id === w.original_languages[0]) ? w.original_languages[0] : 'es',
        rights: 'unverified', pdSpainYear: null, pdUsYear: null, needsTranscription: false, counter: false,
        camp: '', stance: '', buenoCode: '', buenoName: '', noteEn: '', noteEs: '', summaryEn: '', summaryEs: '',
        sourceEdition: '', sourceUrl: '', sourceRevision: '', sourceLicence: '', links: [], updatedBy: BY,
        ...curatedFields(w), articleStatus: 'review', legacyRecord: false,
        texts: [], references: [], articles: articlesOf(w), editions: editionsOf(w),
      };
      await writeWork(tx, work);
      stats.created++; stats.articles += 2; stats.editions += work.editions!.length;
      continue;
    }
    const before = await readWork(tx, p.id);
    if (!before) continue;
    if (p.kind === 'merge' || overwrite) {
      // the version before, in the work's history (restorable at /admin)
      await tx.insert(schema.revisions).values({ workId: p.id, action: 'update', title: before.title, snapshot: before, createdBy: BY });
      const keepSlug = p.kind === 'connected' ? { slug: before.slug } : {};
      await writeWork(tx, {
        ...before,
        ...curatedFields(w),
        ...keepSlug,
        ...(p.kind === 'merge' ? { articleStatus: 'review' as const, legacyRecord: before.status === 'published' } : {}),
        updatedBy: BY, createdAt: before.createdAt, updatedAt: undefined,
        texts: [],
        // articles: the JSON's; editions: the JSON's, but an approval made at /admin is kept
        articles: articlesOf(w),
        editions: editionsOf(w).map((e) => {
          const was = before.editions.find((x) => x.id === e.id);
          return was ? { ...e, translator: was.translator || e.translator, scopeNote: was.scopeNote || e.scopeNote,
            renderMode: was.renderMode, rightsApproved: was.rightsApproved, rightsBasis: was.rightsBasis, rightsEvidence: was.rightsEvidence,
            completeSpan: was.completeSpan, approvedBy: was.approvedBy, approvedOn: was.approvedOn, pdfUrl: was.pdfUrl } : e;
        }).concat(before.editions.filter((x) => !editionsOf(w).some((e) => e.id === x.id))),
      }, { replaceTexts: false });
      if (p.kind === 'merge') stats.merged++; else stats.updated++;
      stats.articles += 2; stats.editions += editionsOf(w).length;
      continue;
    }
    // connected, no --overwrite: only what is missing goes in
    const missingArticles = articlesOf(w).filter((a) => !before.articles.some((b) => b.locale === a.locale));
    const missingEditions = editionsOf(w).filter((e) => !before.editions.some((b) => b.id === e.id));
    if (missingArticles.length) await tx.insert(schema.workArticles).values(missingArticles.map((a) => ({ ...a, workId: p.id })));
    if (missingEditions.length) {
      const start = before.editions.length;
      await tx.insert(schema.editions).values(missingEditions.map((e, i) => ({ ...e, workId: p.id, position: start + i })));
    }
    if (!before.curated) await tx.update(schema.works).set({ curated: true, updatedAt: new Date(), updatedBy: BY }).where(eq(schema.works.id, p.id));
    stats.articles += missingArticles.length; stats.editions += missingEditions.length;
  }

  for (const r of retire) {
    const before = await readWork(tx, r.id);
    if (before) await tx.insert(schema.revisions).values({ workId: r.id, action: 'update', title: before.title, snapshot: before, createdBy: BY });
    await tx.update(schema.works).set({ curated: false, updatedAt: new Date(), updatedBy: BY }).where(eq(schema.works.id, r.id));
    stats.retired++;
  }
});

const [{ n }] = await db.select({ n: schema.works.id }).from(schema.works).where(isNotNull(schema.works.canonId)).then((r) => [{ n: r.length }]);
console.log(`Applied to ${where()}: eras ${stats.eras} new, browse regions ${stats.regions} new, ${stats.merged} merged, ${stats.created} new works, ` +
  `${stats.updated} updated (--overwrite), ${stats.articles} articles and ${stats.editions} editions written, ${stats.retired} retired. ` +
  `${n} works now carry a canon id. Save any work at /admin to refresh the site's cache.`);
await pool.end();
