import data from '@/data/canon-works.json';

/* The canon as a reference list (decided with Beltrán on 2026-10-24): the
   compiler's fifty classic texts, each joined to its author's record, in five
   boxes by period. Built by tools/build-canon-works.py. */

export type CanonWork = {
  id: string;
  title: string;
  year: number;
  author: string;
  fullName: string;
  life: string;
  region: string;
  code: string;
  counter: boolean;
  camp: string;
  position: string;
  bueno: { code: string; name: string };
  period: string;
};
export type CanonPeriod = { id: string; from: number; to: number; name: { en: string; es: string } };

export const WORKS = data.works as CanonWork[];
export const PERIODS = data.periods as CanonPeriod[];

/** "Title: subtitle" → the title, and the subtitle on its own line. */
export function splitTitle(t: string): [string, string | undefined] {
  const i = t.indexOf(': ');
  return i > 0 ? [t.slice(0, i), t.slice(i + 2)] : [t, undefined];
}

/* Each card is bound in one of five covers, like a shelf of mismatched
   editions. The order is fixed by the id, so neighbours rarely match. */
const BINDINGS = ['paper', 'burgundy', 'vellum', 'leather', 'ink'] as const;
export type Binding = (typeof BINDINGS)[number];
export const binding = (id: string): Binding => BINDINGS[(parseInt(id.slice(1), 10) * 3) % BINDINGS.length];

/** A small deterministic tilt in degrees (-1.6 … 1.6), so the cards sit like loose sheets. */
export const tilt = (id: string) => {
  const n = parseInt(id.slice(1), 10);
  return Math.round(((n * 37) % 33) - 16) / 10;
};

export const workHref = (lang: string, id: string) => `/${lang}/canon#${id}`;
