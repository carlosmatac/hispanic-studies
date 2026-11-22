import { getDb, schema } from '@/lib/db';
import { readWork } from '@/lib/backup';
import { eq } from 'drizzle-orm';
import type { WorkInitial } from '@/components/admin/WorkForm';
import { blankCurated, type CuratedPayload } from '@/lib/admin/types';
import type { StoredWork } from '@/lib/backup';

/* The curated-80 part of a work, as the form edits it (issue #93). */
function curatedOf(w: StoredWork): CuratedPayload {
  return {
    curated: w.curated, canonId: w.canonId ?? '', slug: w.slug ?? '', curatedOrder: w.curatedOrder == null ? '' : String(w.curatedOrder), eraId: w.eraId ?? '',
    originalTitle: w.originalTitle, creator: w.creator, dateDisplay: w.dateDisplay, dateKind: w.dateKind, scope: w.scope,
    originalLanguages: w.originalLanguages ?? [], browseRegionIds: w.browseRegionIds ?? [], geographicNote: w.geographicNote,
    englishState: w.englishState, editionNotes: w.editionNotes, companions: w.companions ?? [], articleStatus: w.articleStatus, legacyRecord: w.legacyRecord,
    articles: ['es', 'en'].map((l) => {
      const a = w.articles.find((x) => x.locale === l);
      return { locale: l, title: a?.title ?? '', aboutAuthor: a?.aboutAuthor ?? '', workInItsTime: a?.workInItsTime ?? '', whyReadToday: a?.whyReadToday ?? '' };
    }),
    editions: w.editions.map((e) => ({
      ...e, languages: (e.languages ?? []).join(', '), publicationYear: e.publicationYear == null ? '' : String(e.publicationYear),
    })),
  };
}

/* A work as the form wants it (strings for the number fields), or a blank one. */
export async function loadWork(id: string): Promise<WorkInitial | null> {
  const w = await readWork(getDb(), id);
  if (!w) return null;
  const stats = await getDb().select({ lang: schema.workTexts.lang, words: schema.workTexts.words, minutes: schema.workTexts.minutes })
    .from(schema.workTexts).where(eq(schema.workTexts.workId, id));
  return {
    isNew: false,
    work: {
      id: w.id, status: w.status, title: w.title, author: w.author, fullName: w.fullName, life: w.life, year: String(w.year),
      sectionId: w.sectionId, regionId: w.regionId, place: w.place, code: w.code, language: w.language, rights: w.rights,
      pdSpainYear: w.pdSpainYear == null ? '' : String(w.pdSpainYear), pdUsYear: w.pdUsYear == null ? '' : String(w.pdUsYear),
      needsTranscription: w.needsTranscription, counter: w.counter, camp: w.camp, stance: w.stance, buenoCode: w.buenoCode, buenoName: w.buenoName,
      noteEn: w.noteEn, noteEs: w.noteEs, summaryEn: w.summaryEn, summaryEs: w.summaryEs,
      sourceEdition: w.sourceEdition, sourceUrl: w.sourceUrl, sourceRevision: w.sourceRevision, sourceLicence: w.sourceLicence,
      links: w.links, references: w.references, c: curatedOf(w),
    },
    texts: w.texts,
    stats,
    updatedAt: w.updatedAt,
    updatedBy: w.updatedBy,
  };
}

export function blankWork(sectionId: string, regionId: string): WorkInitial {
  return {
    isNew: true,
    work: {
      id: '', status: 'draft', title: '', author: '', fullName: '', life: '', year: '', sectionId, regionId, place: '', code: '', language: 'es',
      rights: 'unverified', pdSpainYear: '', pdUsYear: '', needsTranscription: false, counter: false, camp: '', stance: '', buenoCode: '', buenoName: '',
      noteEn: '', noteEs: '', summaryEn: '', summaryEs: '', sourceEdition: '', sourceUrl: '', sourceRevision: '', sourceLicence: '', links: [], references: [],
      c: blankCurated(),
    },
    texts: [],
    stats: [],
  };
}
