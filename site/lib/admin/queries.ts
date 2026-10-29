import { and, asc, count, desc, eq, notInArray, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

/* What the back office's pages read (never cached: it always shows the database as it is). */

export async function listWorks() {
  const db = getDb();
  const [works, texts] = await Promise.all([
    db.select({
      id: schema.works.id, title: schema.works.title, author: schema.works.author, year: schema.works.year,
      sectionId: schema.works.sectionId, regionId: schema.works.regionId, status: schema.works.status, rights: schema.works.rights,
      updatedAt: schema.works.updatedAt, updatedBy: schema.works.updatedBy,
    }).from(schema.works).orderBy(asc(schema.works.year), asc(schema.works.id)),
    db.select({ workId: schema.workTexts.workId, lang: schema.workTexts.lang }).from(schema.workTexts),
  ]);
  return works.map((w) => ({ ...w, updatedAt: w.updatedAt.toISOString(), texts: texts.filter((t) => t.workId === w.id).map((t) => t.lang) }));
}
export type WorkRow = Awaited<ReturnType<typeof listWorks>>[number];

export async function listSections() {
  const db = getDb();
  const rows = await db.select().from(schema.sections).orderBy(asc(schema.sections.position));
  const counts = await db.select({ id: schema.works.sectionId, k: count() }).from(schema.works).groupBy(schema.works.sectionId);
  return rows.map((r) => ({ id: r.id, nameEn: r.nameEn, nameEs: r.nameEs, yearFrom: r.yearFrom, yearTo: r.yearTo, works: counts.find((c) => c.id === r.id)?.k ?? 0 }));
}
export type SectionRow = Awaited<ReturnType<typeof listSections>>[number];

export async function listRegions() {
  const db = getDb();
  const rows = await db.select().from(schema.regions).orderBy(asc(schema.regions.position));
  const counts = await db.select({ id: schema.works.regionId, k: count() }).from(schema.works).groupBy(schema.works.regionId);
  return rows.map((r) => ({ id: r.id, nameEn: r.nameEn, nameEs: r.nameEs, noteEn: r.noteEn, noteEs: r.noteEs, swatch: r.swatch, works: counts.find((c) => c.id === r.id)?.k ?? 0 }));
}
export type RegionRow = Awaited<ReturnType<typeof listRegions>>[number];

/** Works deleted and not brought back: the last "delete" revision of each. */
export async function listDeleted() {
  const db = getDb();
  const live = db.select({ id: schema.works.id }).from(schema.works);
  const rows = await db.select({ id: schema.revisions.id, workId: schema.revisions.workId, title: schema.revisions.title, createdAt: schema.revisions.createdAt, createdBy: schema.revisions.createdBy })
    .from(schema.revisions)
    .where(and(eq(schema.revisions.action, 'delete'), notInArray(schema.revisions.workId, live)))
    .orderBy(desc(schema.revisions.createdAt));
  const seen = new Set<string>();
  return rows.filter((r) => !seen.has(r.workId) && seen.add(r.workId)).slice(0, 30)
    .map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function listRevisions(workId: string) {
  return (await getDb().select({
    id: schema.revisions.id, action: schema.revisions.action, title: schema.revisions.title, createdAt: schema.revisions.createdAt, createdBy: schema.revisions.createdBy,
    langs: sql<string[]>`coalesce((select array_agg(t->>'lang') from jsonb_array_elements(${schema.revisions.snapshot}->'texts') t), '{}')`,
    status: sql<string>`${schema.revisions.snapshot}->>'status'`,
  }).from(schema.revisions).where(eq(schema.revisions.workId, workId)).orderBy(desc(schema.revisions.createdAt)))
    .map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getPageCopy() {
  const [p] = await getDb().select().from(schema.archivePage);
  return p ?? null;
}
