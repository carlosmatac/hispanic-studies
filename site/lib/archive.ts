import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import { and, asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getSession } from '@/lib/admin/session';
import { renderMarkdown } from '@/lib/text';
import { RIGHTS, type CanonRegion, type CanonSection, type CanonWork, type Localised, type Reference, type Rights } from '@/lib/canon';
import type { Lang } from '@/lib/i18n';

/* The archive, read from the database (issue #69). The public pages are
   static: these reads run when a page is built or regenerated, and are cached
   under the tag "archive"; every save in the back office expires that tag and
   the pages (lib/admin/revalidate.ts), so a change shows at once. A signed-in
   editor (Draft Mode on, see app/admin/actions.ts) reads the database directly
   and sees the drafts too. */

export const ARCHIVE_TAG = 'archive';

export type PageCopy = { title: Localised; intro: Localised; notes: Localised; door: Localised };
export type Archive = { page: PageCopy; sections: CanonSection[]; regions: CanonRegion[]; works: CanonWork[] };

const loc = (en: string, es: string): Localised => ({ en, es });

async function load(includeDrafts: boolean): Promise<Archive> {
  const db = getDb();
  const [pageRows, sectionRows, regionRows, workRows, textRows, refRows] = await Promise.all([
    db.select().from(schema.archivePage),
    db.select().from(schema.sections).orderBy(asc(schema.sections.position)),
    db.select().from(schema.regions).orderBy(asc(schema.regions.position)),
    includeDrafts ? db.select().from(schema.works) : db.select().from(schema.works).where(eq(schema.works.status, 'published')),
    db.select({ workId: schema.workTexts.workId, lang: schema.workTexts.lang, minutes: schema.workTexts.minutes }).from(schema.workTexts),
    db.select().from(schema.workReferences).orderBy(asc(schema.workReferences.workId), asc(schema.workReferences.position)),
  ]);
  const p = pageRows[0];
  const page: PageCopy = {
    title: loc(p?.titleEn ?? '', p?.titleEs ?? ''),
    intro: loc(p?.introEn ?? '', p?.introEs ?? ''),
    notes: loc(p?.notesEn ?? '', p?.notesEs ?? ''),
    door: loc(p?.doorEn ?? '', p?.doorEs ?? ''),
  };
  const sections: CanonSection[] = sectionRows.map((s) => ({ id: s.id, position: s.position, name: loc(s.nameEn, s.nameEs), from: s.yearFrom, to: s.yearTo }));
  const regions: CanonRegion[] = regionRows.map((r) => ({ id: r.id, position: r.position, name: loc(r.nameEn, r.nameEs), note: loc(r.noteEn, r.noteEs), swatch: r.swatch }));
  const swatchOf = new Map(regions.map((r) => [r.id, r.swatch]));
  const textsOf = new Map<string, { lang: string; minutes: number }[]>();
  for (const t of textRows) textsOf.set(t.workId, [...(textsOf.get(t.workId) ?? []), { lang: t.lang, minutes: t.minutes }]);
  const refsOf = new Map<string, Reference[]>();
  for (const r of refRows) {
    const ref: Reference = {
      kind: r.kind, author: r.author, title: r.title, container: r.container, edition: r.edition,
      publisher: r.publisher, place: r.place, year: r.year, pages: r.pages, url: r.url, accessed: r.accessed,
    };
    refsOf.set(r.workId, [...(refsOf.get(r.workId) ?? []), ref]);
  }

  const works: CanonWork[] = workRows.map((w) => {
    const texts = textsOf.get(w.id) ?? [];
    const rights: Rights = (RIGHTS as readonly string[]).includes(w.rights) ? w.rights : 'unverified';
    return {
      id: w.id,
      status: w.status,
      title: w.title,
      author: w.author,
      fullName: w.fullName || w.author,
      life: w.life,
      year: w.year,
      period: w.sectionId,
      region: w.regionId,
      swatch: swatchOf.get(w.regionId) ?? 'paper',
      place: w.place,
      code: w.code,
      language: w.language,
      rights,
      counter: w.counter,
      camp: w.camp,
      position: w.stance,
      bueno: { code: w.buenoCode, name: w.buenoName },
      note: loc(w.noteEn, w.noteEs),
      summary: loc(w.summaryEn, w.summaryEs),
      source: { edition: w.sourceEdition, url: w.sourceUrl, revision: w.sourceRevision, licence: w.sourceLicence },
      links: (w.links ?? []).filter((l) => l.url).map((l) => ({ label: l.label || l.url, url: l.url })),
      pdSpainYear: w.pdSpainYear,
      pdUsYear: w.pdUsYear,
      needsTranscription: w.needsTranscription,
      // a text is only ever shown for a public-domain work
      hasText: texts.length > 0 && rights === 'public-domain',
      texts,
      references: refsOf.get(w.id) ?? [],
    };
  });
  // the order of the shelf and of "earlier / later": by year, then by id
  works.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  return { page, sections, regions, works };
}

const loadPublished = unstable_cache(() => load(false), ['archive-v1'], { tags: [ARCHIVE_TAG] });

/** Whether this request comes from a signed-in editor (Draft Mode on and a valid session). */
export const isEditor = cache(async (): Promise<boolean> => {
  try {
    if (!(await draftMode()).isEnabled) return false;
  } catch {
    return false; // outside a request (generateStaticParams)
  }
  return !!(await getSession());
});

/** The whole archive as the pages see it: published works, or every work for an editor. */
export const getArchive = cache(async (): Promise<Archive> => ((await isEditor()) ? load(true) : loadPublished()));

/** Only what is published, for generateStaticParams (no request there). */
export const getPublishedArchive = () => loadPublished();

export const getWorks = async () => (await getArchive()).works;

/** The text the reader shows at /<lang>/archive/<id>: in the page's language when there is one, else in the original. */
export function pickText(work: CanonWork, lang: Lang): string | null {
  const langs = work.texts.map((t) => t.lang);
  if (!work.hasText || !langs.length) return null;
  return langs.includes(lang) ? lang : langs.includes(work.language) ? work.language : langs[0];
}

const loadBody = (id: string, lang: string, fresh: boolean) => {
  const read = async () => {
    const [row] = await getDb().select({ body: schema.workTexts.body, words: schema.workTexts.words, minutes: schema.workTexts.minutes })
      .from(schema.workTexts).where(and(eq(schema.workTexts.workId, id), eq(schema.workTexts.lang, lang)));
    return row ?? null;
  };
  return fresh ? read() : unstable_cache(read, ['work-text-v1', id, lang], { tags: [ARCHIVE_TAG] })();
};

/** The work's text in one language, ready for the reader. */
export const getText = cache(async (id: string, lang: string) => {
  const row = await loadBody(id, lang, await isEditor());
  if (!row || !row.body.trim()) return null;
  const { tree, sections } = renderMarkdown(row.body);
  return { tree, sections, words: row.words, minutes: row.minutes, lang };
});

/** "{works}" and "{sections}" in the page's own copy become the numbers. */
export const fillCounts = (s: string, a: Pick<Archive, 'works' | 'sections'>) =>
  s.replace(/\{(works|obras)\}/g, String(a.works.length)).replace(/\{(sections|secciones)\}/g, String(a.sections.length));
