import { asc, inArray, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { countWords, readingMinutes } from '@/lib/text';

/* The archive as one JSON file: the "Download backup" button in /admin, `npm
   run db:export`, and what `npm run db:import -- --backup <file>` reads back.
   Everything Beltrán edits is in it (the page's copy, sections, regions, works
   with their texts and references); not the users (their password hashes stay
   in the database) nor the revision history. */

export const BACKUP_FORMAT = 'ihs-archive-backup';
export const BACKUP_VERSION = 1;

type WorkRow = typeof schema.works.$inferSelect;
type RefRow = typeof schema.workReferences.$inferSelect;

export type BackupWork = Omit<WorkRow, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
  texts: { lang: string; body: string }[];
  references: Omit<RefRow, 'id' | 'workId' | 'position'>[];
};

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  page: Omit<typeof schema.archivePage.$inferSelect, 'id' | 'updatedAt' | 'updatedBy'> | null;
  sections: Omit<typeof schema.sections.$inferSelect, 'createdAt' | 'updatedAt'>[];
  regions: Omit<typeof schema.regions.$inferSelect, 'createdAt' | 'updatedAt'>[];
  works: BackupWork[];
};

const strip = <T extends Record<string, unknown>, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> => {
  const c = { ...o };
  for (const k of keys) delete c[k];
  return c;
};

export async function exportArchive(db: DB): Promise<Backup> {
  const [page] = await db.select().from(schema.archivePage);
  const sections = await db.select().from(schema.sections).orderBy(asc(schema.sections.position));
  const regions = await db.select().from(schema.regions).orderBy(asc(schema.regions.position));
  const works = await db.select().from(schema.works).orderBy(asc(schema.works.year), asc(schema.works.id));
  const texts = await db.select().from(schema.workTexts);
  const refs = await db.select().from(schema.workReferences).orderBy(asc(schema.workReferences.position));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    page: page ? strip(page, 'id', 'updatedAt', 'updatedBy') : null,
    sections: sections.map((s) => strip(s, 'createdAt', 'updatedAt')),
    regions: regions.map((r) => strip(r, 'createdAt', 'updatedAt')),
    works: works.map((w) => ({
      ...strip(w, 'createdAt', 'updatedAt'),
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      texts: texts.filter((t) => t.workId === w.id).map((t) => ({ lang: t.lang, body: t.body })),
      references: refs.filter((r) => r.workId === w.id).map((r) => strip(r, 'id', 'workId', 'position')),
    })),
  };
}

export type ImportReport = { page: boolean; sections: number; regions: number; works: number; skipped: string[] };

/**
 * Loads a backup into the database. Without `overwrite`, only what is missing
 * goes in (rows with the same id are left as they are), so it is safe to run
 * again on a database Beltrán has been editing.
 */
export async function importArchive(db: DB, data: Backup, { overwrite = false } = {}): Promise<ImportReport> {
  if (data.format !== BACKUP_FORMAT) throw new Error('Not an archive backup (format).');
  const report: ImportReport = { page: false, sections: 0, regions: 0, works: 0, skipped: [] };
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
    const existing = new Set(
      data.works.length
        ? (await tx.select({ id: schema.works.id }).from(schema.works).where(inArray(schema.works.id, data.works.map((w) => w.id)))).map((r) => r.id)
        : [],
    );
    for (const w of data.works) {
      if (existing.has(w.id) && !overwrite) { report.skipped.push(w.id); continue; }
      const { texts, references, createdAt, updatedAt, ...row } = w;
      const values = { ...row, createdAt: createdAt ? new Date(createdAt) : undefined, updatedAt: updatedAt ? new Date(updatedAt) : undefined };
      await tx.insert(schema.works).values(values).onConflictDoUpdate({ target: schema.works.id, set: { ...values, updatedAt: sql`now()` } });
      await tx.delete(schema.workTexts).where(sql`${schema.workTexts.workId} = ${w.id}`);
      for (const t of texts.filter((t) => t.body.trim())) {
        const words = countWords(t.body);
        await tx.insert(schema.workTexts).values({ workId: w.id, lang: t.lang, body: t.body, words, minutes: readingMinutes(words) });
      }
      await tx.delete(schema.workReferences).where(sql`${schema.workReferences.workId} = ${w.id}`);
      if (references.length) await tx.insert(schema.workReferences).values(references.map((r, i) => ({ ...r, workId: w.id, position: i })));
      report.works++;
    }
  });
  return report;
}
