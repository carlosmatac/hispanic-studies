import type { Lang } from '@/lib/i18n';
import type { Chronicle } from '@/lib/atlas-chronicle';

/* What the Atlas's server side (lib/atlas-chronicle.ts) and its client side
   (components/atlas/) share at run time: the chapters, the regional tracks,
   how a year is written, and the deep-link index. Kept apart because the
   chronicle reads files on the server. */

/** Chapters: the first year of each (ours; the dates only divide the story). */
export const CHAPTER_STARTS = [-218, 711, 1230, 1492, 1580, 1808, 1898];
export const TRACKS = ['iberia', 'islands', 'north-america', 'south-america', 'africa', 'asia', 'oceania', 'world'] as const;
export type Track = (typeof TRACKS)[number];

/** A year on the axis as shown: 218 BCE, 1492. */
export function yearLabel(y: number, lang: Lang): string {
  return y < 0 ? `${-y} ${lang === 'es' ? 'a. C.' : 'BCE'}` : String(Math.floor(y));
}

/** Every stop id and alias, for deep links. */
export function stopIndex(c: Chronicle): Map<string, number> {
  const m = new Map<string, number>();
  c.stops.forEach((s, i) => { m.set(s.id, i); for (const a of s.aliases) m.set(a, i); });
  return m;
}
