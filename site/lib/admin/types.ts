import type { Link } from '@/lib/db/schema';
import type { Reference, Rights } from '@/lib/canon';

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
