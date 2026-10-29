import { getDb, schema } from '@/lib/db';
import { readWork } from '@/lib/backup';
import { eq } from 'drizzle-orm';
import type { WorkInitial } from '@/components/admin/WorkForm';

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
      links: w.links, references: w.references,
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
    },
    texts: [],
    stats: [],
  };
}
