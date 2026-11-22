import { asc, inArray, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';

type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
import * as schema from '@/lib/db/schema';
import { countWords, readingMinutes } from '@/lib/text';

/* The archive as one JSON file: the "Download backup" button in /admin, `npm
   run db:export`, and what `npm run db:import -- --backup <file>` reads back.
   Everything Beltrán edits is in it (the page's copy, sections, regions, eras,
   works with their texts, references, articles and editions); not the users
   (their password hashes stay in the database) nor the revision history.
   Version 2 (issue #93) added the curated 80: eras, browse regions, and per
   work its articles and editions. Version 1 files still load. */

export const BACKUP_FORMAT = 'ihs-archive-backup';
export const BACKUP_VERSION = 2;

type WorkRow = typeof schema.works.$inferSelect;
type RefRow = typeof schema.workReferences.$inferSelect;
type ArticleRow = typeof schema.workArticles.$inferSelect;
type EditionRow = typeof schema.editions.$inferSelect;

/** The curated-80 columns of a work (issue #93): optional in a backup, so older files and the Markdown import still fit. */
const CURATED_KEYS = [
  'canonId', 'slug', 'curated', 'curatedOrder', 'eraId', 'originalTitle', 'creator', 'dateDisplay', 'dateKind', 'scope',
  'originalLanguages', 'browseRegionIds', 'geographicNote', 'englishState', 'editionNotes', 'companions',
  'articleStatus', 'legacyRecord', 'reviewedBy', 'reviewedAt',
] as const;
type CuratedKey = (typeof CURATED_KEYS)[number];

export type BackupArticle = Omit<ArticleRow, 'workId' | 'updatedAt'>;
export type BackupEdition = Omit<EditionRow, 'workId' | 'createdAt' | 'updatedAt'>;

export type BackupWork = Omit<WorkRow, 'createdAt' | 'updatedAt' | CuratedKey> &
  Partial<Omit<Pick<WorkRow, CuratedKey>, 'reviewedAt'>> & {
    reviewedAt?: string | Date | null;
    createdAt?: string;
    updatedAt?: string;
    texts: { lang: string; body: string }[];
    references: Omit<RefRow, 'id' | 'workId' | 'position'>[];
    /** the curated work's article per language; absent = leave them as they are */
    articles?: BackupArticle[];
    /** its editions; absent = leave them as they are */
    editions?: BackupEdition[];
  };

/** A work as it is in the database now (every column present). */
export type StoredWork = BackupWork & Pick<WorkRow, Exclude<CuratedKey, 'reviewedAt'>> & {
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  articles: BackupArticle[];
  editions: BackupEdition[];
};

type EraRow = Omit<typeof schema.eras.$inferSelect, 'createdAt' | 'updatedAt'>;
type BrowseRegionRow = Omit<typeof schema.browseRegions.$inferSelect, 'createdAt' | 'updatedAt'>;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  page: Partial<Omit<typeof schema.archivePage.$inferSelect, 'id' | 'updatedAt' | 'updatedBy'>> | null;
  sections: Omit<typeof schema.sections.$inferSelect, 'createdAt' | 'updatedAt'>[];
  regions: Omit<typeof schema.regions.$inferSelect, 'createdAt' | 'updatedAt'>[];
  eras?: EraRow[];
  browseRegions?: BrowseRegionRow[];
  works: BackupWork[];
};

const strip = <T extends Record<string, unknown>, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> => {
  const c = { ...o };
  for (const k of keys) delete c[k];
  return c;
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function toStored(w: WorkRow, texts: (typeof schema.workTexts.$inferSelect)[], refs: RefRow[], articles: ArticleRow[], editions: EditionRow[]): StoredWork {
  return {
    ...strip(w, 'createdAt', 'updatedAt', 'reviewedAt'),
    reviewedAt: iso(w.reviewedAt),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    texts: texts.map((t) => ({ lang: t.lang, body: t.body })),
    references: refs.map((r) => strip(r, 'id', 'workId', 'position')),
    articles: articles.map((a) => strip(a, 'workId', 'updatedAt')),
    editions: editions.map((e) => strip(e, 'workId', 'createdAt', 'updatedAt')),
  };
}

export async function exportArchive(db: DB): Promise<Backup> {
  const [page] = await db.select().from(schema.archivePage);
  const sections = await db.select().from(schema.sections).orderBy(asc(schema.sections.position));
  const regions = await db.select().from(schema.regions).orderBy(asc(schema.regions.position));
  const eras = await db.select().from(schema.eras).orderBy(asc(schema.eras.position));
  const browseRegions = await db.select().from(schema.browseRegions).orderBy(asc(schema.browseRegions.position));
  const works = await db.select().from(schema.works).orderBy(asc(schema.works.year), asc(schema.works.id));
  const texts = await db.select().from(schema.workTexts);
  const refs = await db.select().from(schema.workReferences).orderBy(asc(schema.workReferences.position));
  const articles = await db.select().from(schema.workArticles);
  const editions = await db.select().from(schema.editions).orderBy(asc(schema.editions.position));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    page: page ? strip(page, 'id', 'updatedAt', 'updatedBy') : null,
    sections: sections.map((s) => strip(s, 'createdAt', 'updatedAt')),
    regions: regions.map((r) => strip(r, 'createdAt', 'updatedAt')),
    eras: eras.map((e) => strip(e, 'createdAt', 'updatedAt')),
    browseRegions: browseRegions.map((r) => strip(r, 'createdAt', 'updatedAt')),
    works: works.map((w) => toStored(
      w,
      texts.filter((t) => t.workId === w.id),
      refs.filter((r) => r.workId === w.id),
      articles.filter((a) => a.workId === w.id),
      editions.filter((e) => e.workId === w.id),
    )),
  };
}

export type ImportReport = { page: boolean; sections: number; regions: number; eras: number; works: number; skipped: string[] };

/**
 * Loads a backup into the database. Without `overwrite`, only what is missing
 * goes in (rows with the same id are left as they are), so it is safe to run
 * again on a database Beltrán has been editing.
 */
export async function importArchive(db: DB, data: Backup, { overwrite = false } = {}): Promise<ImportReport> {
  if (data.format !== BACKUP_FORMAT) throw new Error('Not an archive backup (format).');
  const report: ImportReport = { page: false, sections: 0, regions: 0, eras: 0, works: 0, skipped: [] };
  await db.transaction(async (tx) => {
    if (data.page) {
      const q = tx.insert(schema.archivePage).values({ id: 1, ...data.page });
      const r = overwrite ? await q.onConflictDoUpdate({ target: schema.archivePage.id, set: data.page }).returning() : await q.onConflictDoNothing().returning();
      report.page = r.length > 0;
    }
    for (const s of data.sections) {
      const q = tx.insert(schema.sections).values(s);
      const r = overwrite ? await q.onConflictDoUpdate({ target: schema.sections.id, set: s }).returning() : await q.onConflictDoNothing().returning();
      report.sections += r.length;
    }
    for (const g of data.regions) {
      const q = tx.insert(schema.regions).values(g);
      const r = overwrite ? await q.onConflictDoUpdate({ target: schema.regions.id, set: g }).returning() : await q.onConflictDoNothing().returning();
      report.regions += r.length;
    }
    for (const e of data.eras ?? []) {
      const q = tx.insert(schema.eras).values(e);
      const r = overwrite ? await q.onConflictDoUpdate({ target: schema.eras.id, set: e }).returning() : await q.onConflictDoNothing().returning();
      report.eras += r.length;
    }
    for (const g of data.browseRegions ?? []) {
      const q = tx.insert(schema.browseRegions).values(g);
      if (overwrite) await q.onConflictDoUpdate({ target: schema.browseRegions.id, set: g });
      else await q.onConflictDoNothing();
    }
    const existing = new Set(
      data.works.length
        ? (await tx.select({ id: schema.works.id }).from(schema.works).where(inArray(schema.works.id, data.works.map((w) => w.id)))).map((r) => r.id)
        : [],
    );
    for (const w of data.works) {
      if (existing.has(w.id) && !overwrite) { report.skipped.push(w.id); continue; }
      await writeWork(tx, w, { keepDates: true });
      report.works++;
    }
  });
  return report;
}

/** One work as a snapshot (the same shape as in a backup): kept in the revisions. */
export async function readWork(db: DB | Tx, id: string): Promise<StoredWork | null> {
  const [w] = await db.select().from(schema.works).where(sql`${schema.works.id} = ${id}`);
  if (!w) return null;
  const texts = await db.select().from(schema.workTexts).where(sql`${schema.workTexts.workId} = ${id}`);
  const refs = await db.select().from(schema.workReferences).where(sql`${schema.workReferences.workId} = ${id}`).orderBy(asc(schema.workReferences.position));
  const articles = await db.select().from(schema.workArticles).where(sql`${schema.workArticles.workId} = ${id}`);
  const editions = await db.select().from(schema.editions).where(sql`${schema.editions.workId} = ${id}`).orderBy(asc(schema.editions.position));
  return toStored(w, texts, refs, articles, editions);
}

/**
 * Writes a whole work (record, texts, references, and its articles and
 * editions when given), replacing what was there. Reading time is worked out
 * here from each text's length. With `replaceTexts: false` only the texts
 * given are written (an empty body removes that language).
 */
export async function writeWork(
  tx: DB | Tx,
  w: Omit<BackupWork, 'texts'> & { texts: BackupWork['texts'] | { lang: string; body: string | null }[] },
  { keepDates = false, replaceTexts = true } = {},
) {
  const { texts, references, articles, editions, createdAt, updatedAt, reviewedAt, ...row } = w;
  const values = {
    ...row,
    // a snapshot keeps dates as text
    ...(reviewedAt !== undefined ? { reviewedAt: reviewedAt ? new Date(reviewedAt) : null } : {}),
    createdAt: keepDates && createdAt ? new Date(createdAt) : undefined,
    updatedAt: keepDates && updatedAt ? new Date(updatedAt) : new Date(),
  };
  const { createdAt: _c, ...update } = values;
  await tx.insert(schema.works).values(values).onConflictDoUpdate({ target: schema.works.id, set: update });
  if (replaceTexts) await tx.delete(schema.workTexts).where(sql`${schema.workTexts.workId} = ${w.id}`);
  for (const t of texts) {
    if (t.body == null || !t.body.trim()) {
      if (!replaceTexts) await tx.delete(schema.workTexts).where(sql`${schema.workTexts.workId} = ${w.id} and ${schema.workTexts.lang} = ${t.lang}`);
      continue;
    }
    const words = countWords(t.body);
    const v = { workId: w.id, lang: t.lang, body: t.body, words, minutes: readingMinutes(words), updatedAt: new Date() };
    await tx.insert(schema.workTexts).values(v).onConflictDoUpdate({ target: [schema.workTexts.workId, schema.workTexts.lang], set: v });
  }
  await tx.delete(schema.workReferences).where(sql`${schema.workReferences.workId} = ${w.id}`);
  if (references.length) await tx.insert(schema.workReferences).values(references.map((r, i) => ({ ...r, workId: w.id, position: i })));
  if (articles) {
    await tx.delete(schema.workArticles).where(sql`${schema.workArticles.workId} = ${w.id}`);
    if (articles.length) await tx.insert(schema.workArticles).values(articles.map((a) => ({ ...a, workId: w.id, updatedAt: new Date() })));
  }
  if (editions) {
    await tx.delete(schema.editions).where(sql`${schema.editions.workId} = ${w.id}`);
    if (editions.length) await tx.insert(schema.editions).values(editions.map((e, i) => ({ ...e, workId: w.id, position: i, updatedAt: new Date() })));
  }
}
