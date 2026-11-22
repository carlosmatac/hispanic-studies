import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import { and, asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getSession } from '@/lib/admin/session';
import { renderMarkdown } from '@/lib/text';
import { isHostable, RIGHTS, type Article, type BrowseRegion, type CanonRegion, type CanonSection, type CanonWork, type Edition, type Era, type Localised, type Reference, type Rights } from '@/lib/canon';
import { hostedMode } from '@/lib/editions';
import type { Lang } from '@/lib/i18n';

/* The archive, read from the database (issue #69). The public pages are
   static: these reads run when a page is built or regenerated, and are cached
   under the tag "archive"; every save in the back office expires that tag and
   the pages (lib/admin/revalidate.ts), so a change shows at once. A signed-in
   editor (Draft Mode on, see app/admin/actions.ts) reads the database directly
   and sees the drafts too. */

export const ARCHIVE_TAG = 'archive';

export type PageCopy = { title: Localised; intro: Localised; notes: Localised; door: Localised; landingTitle: Localised; landingIntro: Localised };
export type Archive = {
  page: PageCopy;
  sections: CanonSection[];
  regions: CanonRegion[];
  /** the curated 80's eras and the regions it is browsed by (issue #93) */
  eras: Era[];
  browseRegions: BrowseRegion[];
  works: CanonWork[];
};

const loc = (en: string, es: string): Localised => ({ en, es });

async function load(includeDrafts: boolean): Promise<Archive> {
  const db = getDb();
  const [pageRows, sectionRows, regionRows, eraRows, browseRows, workRows, textRows, refRows, editionRows, titleRows] = await Promise.all([
    db.select().from(schema.archivePage),
    db.select().from(schema.sections).orderBy(asc(schema.sections.position)),
    db.select().from(schema.regions).orderBy(asc(schema.regions.position)),
    db.select().from(schema.eras).orderBy(asc(schema.eras.position)),
    db.select().from(schema.browseRegions).orderBy(asc(schema.browseRegions.position)),
    includeDrafts ? db.select().from(schema.works) : db.select().from(schema.works).where(eq(schema.works.status, 'published')),
    db.select({ workId: schema.workTexts.workId, lang: schema.workTexts.lang, minutes: schema.workTexts.minutes }).from(schema.workTexts),
    db.select().from(schema.workReferences).orderBy(asc(schema.workReferences.workId), asc(schema.workReferences.position)),
    db.select().from(schema.editions).orderBy(asc(schema.editions.workId), asc(schema.editions.position)),
    db.select({ workId: schema.workArticles.workId, locale: schema.workArticles.locale, title: schema.workArticles.title }).from(schema.workArticles),
  ]);
  const p = pageRows[0];
  const page: PageCopy = {
    title: loc(p?.titleEn ?? '', p?.titleEs ?? ''),
    intro: loc(p?.introEn ?? '', p?.introEs ?? ''),
    notes: loc(p?.notesEn ?? '', p?.notesEs ?? ''),
    door: loc(p?.doorEn ?? '', p?.doorEs ?? ''),
    landingTitle: loc(p?.landingTitleEn ?? '', p?.landingTitleEs ?? ''),
    landingIntro: loc(p?.landingIntroEn ?? '', p?.landingIntroEs ?? ''),
  };
  const sections: CanonSection[] = sectionRows.map((s) => ({ id: s.id, position: s.position, name: loc(s.nameEn, s.nameEs), from: s.yearFrom, to: s.yearTo }));
  const regions: CanonRegion[] = regionRows.map((r) => ({ id: r.id, position: r.position, name: loc(r.nameEn, r.nameEs), note: loc(r.noteEn, r.noteEs), swatch: r.swatch }));
  const eras: Era[] = eraRows.map((e) => ({ id: e.id, position: e.position, name: loc(e.nameEn, e.nameEs), from: e.yearFrom, to: e.yearTo }));
  const browseRegions: BrowseRegion[] = browseRows.map((r) => ({ id: r.id, position: r.position, name: loc(r.nameEn, r.nameEs) }));
  const swatchOf = new Map(regions.map((r) => [r.id, r.swatch]));
  const editionsOf = new Map<string, Edition[]>();
  for (const e of editionRows) {
    // hosted only when its approval passes every check, whatever the row says
    const hosted = hostedMode(e);
    const ed: Edition = {
      id: e.id, readingLang: e.readingLang, primary: e.primary, languages: e.languages ?? [], extent: e.extent, url: e.url,
      label: e.label, sourceName: e.sourceName, translator: e.translator, scopeNote: e.scopeNote, publicationYear: e.publicationYear,
      hosted, pdfUrl: hosted === 'local_pdf' ? e.pdfUrl : '',
    };
    editionsOf.set(e.workId, [...(editionsOf.get(e.workId) ?? []), ed]);
  }
  const titlesOf = new Map<string, Localised>();
  for (const a of titleRows) titlesOf.set(a.workId, { ...(titlesOf.get(a.workId) ?? { en: '', es: '' }), [a.locale]: a.title });
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
    const rights: Rights = (RIGHTS as readonly string[]).includes(w.rights) ? w.rights : 'unverified';
    const editions = editionsOf.get(w.id) ?? [];
    // a text is shown when the work is in the U.S. public domain, or an edition in that language is approved to be hosted as HTML
    const approvedHtml = new Set(editions.filter((e) => e.hosted === 'inline_html').map((e) => e.readingLang));
    const texts = (textsOf.get(w.id) ?? []).filter((t) => isHostable(rights) || approvedHtml.has(t.lang));
    const curated = w.canonId && w.eraId ? {
      canonId: w.canonId,
      slug: w.slug ?? w.id,
      current: w.curated,
      order: w.curatedOrder ?? 0,
      era: w.eraId,
      originalTitle: w.originalTitle || w.title,
      creator: w.creator || w.author,
      dateDisplay: w.dateDisplay || String(w.year),
      dateKind: w.dateKind,
      scope: w.scope,
      originalLanguages: w.originalLanguages ?? [],
      browseRegions: w.browseRegionIds ?? [],
      geographicNote: w.geographicNote,
      englishState: w.englishState,
      articleStatus: w.articleStatus,
      titles: titlesOf.get(w.id) ?? { en: '', es: '' },
      editions,
      companions: w.companions ?? [],
    } : null;
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
      hasText: texts.length > 0,
      texts,
      references: refsOf.get(w.id) ?? [],
      curated,
    };
  });
  // the order of the shelf and of "earlier / later": by year, then by id
  works.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  return { page, sections, regions, eras, browseRegions, works };
}

/** The curated 80 in their order (era, then Beltrán's order), as this reader may see them. */
export function curatedWorks(a: Pick<Archive, 'eras' | 'works'>, editor: boolean): CanonWork[] {
  const eraPos = new Map(a.eras.map((e) => [e.id, e.position]));
  return a.works
    .filter((w) => w.curated?.current && (editor || (w.status === 'published' && w.curated.articleStatus === 'published')))
    .sort((x, y) => (eraPos.get(x.curated!.era) ?? 99) - (eraPos.get(y.curated!.era) ?? 99) || x.curated!.order - y.curated!.order);
}

const loadArticles = (id: string, fresh: boolean) => {
  const read = async (): Promise<Article[]> => (await getDb().select().from(schema.workArticles).where(eq(schema.workArticles.workId, id)))
    .map((a) => ({ locale: a.locale, title: a.title, aboutAuthor: a.aboutAuthor, workInItsTime: a.workInItsTime, whyReadToday: a.whyReadToday }));
  return fresh ? read() : unstable_cache(read, ['work-articles-v1', id], { tags: [ARCHIVE_TAG] })();
};

/** A curated work's articles (ES and EN). */
export const getArticles = cache(async (id: string) => loadArticles(id, await isEditor()));

const loadPublished = unstable_cache(() => load(false), ['archive-v2'], { tags: [ARCHIVE_TAG] });

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
