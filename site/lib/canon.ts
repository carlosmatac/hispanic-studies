/* The archive of Hispanic thought (issue #68; it was "the canon" until
   2026-10-29). Each work is a file in content/archive/<id>.md, edited by hand
   or in the CMS at /keystatic (keystatic.config.ts); lib/archive.ts reads them
   on the server. This file holds what both sides share: the periods, the
   regions, the shape of an entry and a few helpers. It never touches the disk,
   so client components can import it. */

import type { Lang } from '@/lib/i18n';

/* The boxes are ours and carry dates only (no new claims). Every work is filed
   in one by its year; the prelude was added at Beltrán's request on
   2026-10-29: the Empire's own thought, before the independence. */
export const PERIODS = [
  { id: 'prelude', from: 1492, to: 1799, name: { en: 'Prelude: the Empire’s own thought', es: 'Preludio: el pensamiento del Imperio' } },
  { id: 'independence', from: 1800, to: 1870, name: { en: 'Independence and the first unions', es: 'La independencia y las primeras uniones' } },
  { id: 'ninety-eight', from: 1871, to: 1900, name: { en: 'From Iberism to 1898', es: 'Del iberismo al 98' } },
  { id: 'continent', from: 1901, to: 1930, name: { en: 'Ariel and the continent', es: 'Ariel y el continente' } },
  { id: 'hispanidad', from: 1931, to: 1960, name: { en: 'Hispanidad, Indo-America, the Lusophone world', es: 'Hispanidad, Indoamérica, el mundo lusófono' } },
  { id: 'after-empire', from: 1961, to: 2000, name: { en: 'After empire', es: 'Después del imperio' } },
] as const;
export type PeriodId = (typeof PERIODS)[number]['id'];
export type CanonPeriod = (typeof PERIODS)[number];
export const periodFor = (year: number): PeriodId =>
  (PERIODS.find((p) => year >= p.from && year <= p.to) ?? PERIODS[PERIODS.length - 1]).id;

/* The cards are coloured by region (Beltrán, 2026-10-29), by where the author
   worked or what the text is about. Each region is one binding: four of the
   brand's own grounds and two muted hues (globals.css, --region-*). */
export const REGIONS = [
  { id: 'spain', binding: 'burgundy', name: { en: 'Spain', es: 'España' }, note: { en: 'and its exiles', es: 'y su exilio' } },
  { id: 'south-america', binding: 'leather', name: { en: 'South America', es: 'Sudamérica' }, note: { en: 'Spanish-speaking', es: 'hispanohablante' } },
  { id: 'north-america', binding: 'ink', name: { en: 'North America', es: 'Norteamérica' }, note: { en: 'Mexico and Central America', es: 'México y Centroamérica' } },
  { id: 'caribbean', binding: 'sea', name: { en: 'Caribbean', es: 'Caribe' }, note: { en: 'Cuba, Puerto Rico, Santo Domingo', es: 'Cuba, Puerto Rico, Santo Domingo' } },
  { id: 'lusophone', binding: 'olive', name: { en: 'Lusophone world', es: 'Mundo lusófono' }, note: { en: 'Portugal, Brazil, Lusophone Africa', es: 'Portugal, Brasil, África lusófona' } },
  { id: 'ibero-asia', binding: 'paper', name: { en: 'Ibero-Asia', es: 'Iberoasia' }, note: { en: 'the Philippines, Goa', es: 'Filipinas, Goa' } },
] as const;
export type RegionId = (typeof REGIONS)[number]['id'];
export type Binding = (typeof REGIONS)[number]['binding'];
export const region = (id: string) => REGIONS.find((r) => r.id === id) ?? REGIONS[0];
export const binding = (w: { region: string }): Binding => region(w.region).binding;

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
  period: PeriodId;
  region: RegionId;
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
  /** true when the full text is in the archive (the file has a body) */
  hasText: boolean;
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
