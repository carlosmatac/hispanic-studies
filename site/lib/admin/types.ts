import type { Companion, Link } from '@/lib/db/schema';
import type { Reference, Rights } from '@/lib/canon';

/* An edition as the work form edits it (numbers as text). */
export type EditionPayload = {
  id: string;
  readingLang: string;
  primary: boolean;
  /** "es, la" */
  languages: string;
  extent: string;
  url: string;
  label: string;
  sourceName: string;
  translator: string;
  scopeNote: string;
  citation: string;
  publicationYear: string;
  scopeCheck: string;
  deliveryPlan: string;
  usHostingBasis: string;
  renderMode: string;
  rightsApproved: boolean;
  rightsBasis: string;
  rightsEvidence: string;
  completeSpan: string;
  approvedBy: string;
  approvedOn: string;
  pdfUrl: string;
};

export type ArticlePayload = { locale: string; title: string; aboutAuthor: string; workInItsTime: string; whyReadToday: string };

/* A work's place in the curated 80 (issue #93), as the work form edits it. */
export type CuratedPayload = {
  curated: boolean;
  canonId: string;
  slug: string;
  curatedOrder: string;
  eraId: string;
  originalTitle: string;
  creator: string;
  dateDisplay: string;
  dateKind: string;
  scope: string;
  originalLanguages: string[];
  browseRegionIds: string[];
  geographicNote: string;
  englishState: string;
  editionNotes: string;
  companions: Companion[];
  articleStatus: 'review' | 'published';
  legacyRecord: boolean;
  articles: ArticlePayload[];
  editions: EditionPayload[];
};

export const blankCurated = (): CuratedPayload => ({
  curated: false, canonId: '', slug: '', curatedOrder: '', eraId: '', originalTitle: '', creator: '', dateDisplay: '', dateKind: 'publication', scope: 'work',
  originalLanguages: [], browseRegionIds: [], geographicNote: '', englishState: 'not_found', editionNotes: '', companions: [], articleStatus: 'review', legacyRecord: false,
  articles: [], editions: [],
});

export const blankEdition = (): EditionPayload => ({
  id: '', readingLang: 'es', primary: false, languages: '', extent: 'complete_html', url: '', label: '', sourceName: '', translator: '', scopeNote: '', citation: '',
  publicationYear: '', scopeCheck: '', deliveryPlan: 'external_link', usHostingBasis: '', renderMode: 'external_link',
  rightsApproved: false, rightsBasis: '', rightsEvidence: '', completeSpan: '', approvedBy: '', approvedOn: '', pdfUrl: '',
});

/* What the work form sends to the server (app/admin/actions.ts saveWork). */
export type WorkPayload = {
  isNew: boolean;
  id: string;
  status: 'draft' | 'published';
  title: string;
  author: string;
  fullName: string;
  life: string;
  year: string;
  sectionId: string;
  regionId: string;
  place: string;
  code: string;
  language: string;
  rights: Rights;
  pdSpainYear: string;
  pdUsYear: string;
  needsTranscription: boolean;
  counter: boolean;
  camp: string;
  stance: string;
  buenoCode: string;
  buenoName: string;
  noteEn: string;
  noteEs: string;
  summaryEn: string;
  summaryEs: string;
  sourceEdition: string;
  sourceUrl: string;
  sourceRevision: string;
  sourceLicence: string;
  links: Link[];
  references: Reference[];
  /** only the texts that changed, as Markdown; an empty body removes that language */
  texts: { lang: string; body: string }[];
  /** its place in the curated 80 (issue #93) */
  c: CuratedPayload;
};

export type SaveResult =
  | { ok: true; id: string; message: string; updatedAt: string; texts: { lang: string; words: number; minutes: number }[] }
  | { ok: false; message: string; fields?: Record<string, string> };

/** What a small form's action answers; `values` gives back what was typed when something was wrong (React resets the form). */
export type FormState = { ok?: boolean; message?: string; fields?: Record<string, string>; values?: Record<string, string> } | null;

/** "Miguel de Unamuno", "En torno al casticismo" → "unamuno-en-torno-al-casticismo" */
export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const STOP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'a', 'en', 'the', 'of', 'and', 'on', 'una', 'un', 'sobre', 'para', 'por', 'o', 'da', 'do', 'dos', 'das']);

/** A readable address for a new work: the author's surname and the first words of the title. */
export function suggestId(author: string, title: string) {
  const surname = slug(author).split('-').filter(Boolean).pop() ?? '';
  const words = slug(title.split(':')[0]).split('-').filter((w) => w && !STOP.has(w)).slice(0, 3);
  return [surname, ...words].filter(Boolean).join('-').slice(0, 60).replace(/-+$/, '');
}

export const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$|^T\d{3}$/;
