/* The archive of Hispanic thought (issue #68; it was "the canon" until
   2026-10-29). Since issue #69 the works live in the database (lib/db) and
   Beltrán edits them at /admin; lib/archive.ts reads them on the server. This
   file holds what the pages share: the shapes of an entry, the languages, the
   rights and a few helpers. It never touches the database, so client
   components can import it. */

import type { Lang } from '@/lib/i18n';

/* The boxes (periods) and the regions live in the database since issue #69:
   Beltrán adds, renames and reorders them in the back office. These are their
   shapes as the pages use them. A region's colour is a swatch of the fixed
   palette in lib/palette.ts. */
export type Localised = { en: string; es: string };
export type CanonSection = { id: string; position: number; name: Localised; from: number | null; to: number | null };
export type CanonRegion = { id: string; position: number; name: Localised; note: Localised; swatch: string };

export const LANGUAGES = [
  { id: 'es', name: { en: 'Spanish', es: 'español' } },
  { id: 'pt', name: { en: 'Portuguese', es: 'portugués' } },
  { id: 'la', name: { en: 'Latin', es: 'latín' } },
  { id: 'fr', name: { en: 'French', es: 'francés' } },
  { id: 'en', name: { en: 'English', es: 'inglés' } },
  { id: 'it', name: { en: 'Italian', es: 'italiano' } },
] as const;
export const languageName = (id: string, lang: Lang) => LANGUAGES.find((l) => l.id === id)?.name[lang] ?? id;

/* Whether we may host the text (rights research of 2026-10-29,
   docs/research/archive-rights/). The site is served from the US and read
   mostly in Spain and the Americas, so a text is hosted only when it is in the
   public domain in the US, in Spain and in its country of origin. The two
   partial verdicts get the record and links, and say when the text comes free. */
export const RIGHTS = ['public-domain', 'pd-us-only', 'pd-outside-us', 'in-copyright', 'unverified'] as const;
export type Rights = (typeof RIGHTS)[number];

export type ArchiveLink = { label: string; url: string };
/** A chapter of a text in the reader (its "## " heading). */
export type Section = { id: string; title: string };

/** One entry of the archive, without its text (what the shelf and the cards need). */
export type CanonWork = {
  id: string;
  title: string;
  author: string;
  fullName: string;
  life: string;
  year: number;
  /** draft works are seen only by signed-in editors */
  status: 'draft' | 'published';
  period: string;
  region: string;
  /** the region's colour (lib/palette.ts) */
  swatch: string;
  place: string;
  code: string;
  language: string;
  rights: Rights;
  counter: boolean;
  camp: string;
  position: string;
  bueno: { code: string; name: string };
  note: { en: string; es: string };
  summary: { en: string; es: string };
  source: { edition: string; url: string; revision: string; licence: string };
  links: ArchiveLink[];
  /** the year it enters the public domain in Spain / in the US (1 January), when we know it */
  pdSpainYear: number | null;
  pdUsYear: number | null;
  /** public domain, but only scans exist: the text needs a careful transcription */
  needsTranscription: boolean;
  /** true when a full text is in the archive and may be shown (public domain) */
  hasText: boolean;
  /** the languages its text is in, with the reading time of each */
  texts: { lang: string; minutes: number }[];
  references: Reference[];
};

/** A reference of a work, formatted for the reader by lib/cite.ts. */
export type Reference = {
  kind: 'book' | 'chapter' | 'article' | 'web';
  author: string;
  title: string;
  container: string;
  edition: string;
  publisher: string;
  place: string;
  year: string;
  pages: string;
  url: string;
  accessed: string;
};

/** "Title: subtitle" → the title, and the subtitle on its own line. */
export function splitTitle(t: string): [string, string | undefined] {
  const i = t.indexOf(': ');
  return i > 0 ? [t.slice(0, i), t.slice(i + 2)] : [t, undefined];
}

/* a small stable number from any id (T030 → 30; new ids are hashed) */
const seed = (id: string) => {
  const n = /^T(\d+)$/.exec(id);
  if (n) return parseInt(n[1], 10);
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 997;
};

/** A small deterministic tilt in degrees (-1.6 … 1.6), so the cards sit like loose sheets. */
export const tilt = (id: string) => Math.round(((seed(id) * 37) % 33) - 16) / 10;

/** The work's card on the archive page (opens its record). */
export const workHref = (lang: string, id: string) => `/${lang}/archive#${id}`;
/** The work's own page: the reader when the text is here, the record otherwise. */
export const readHref = (lang: string, id: string) => `/${lang}/archive/${id}`;
