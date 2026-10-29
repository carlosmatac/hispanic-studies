import { dict, type Lang } from '@/lib/i18n';
import { TOUR, type TourCard } from '@/lib/map-tour';
import { workHref } from '@/lib/canon';
import iberophone from '@/public/data/iberophone.json';
import milestones from '@/data/milestones.json';
import canon from '@/data/canon.json';
import atlasEras from '@/data/atlas-eras.json';

/* Server-side reads for the Atlas: what the cartouche counts, and the tour's
   cards with their text resolved for one language. */

const places = [...iberophone.countries, ...iberophone.points] as { tier: string }[];
export const COUNTS = {
  states: places.filter((p) => p.tier === 'emersa').length,
  presence: places.filter((p) => p.tier === 'submersa').length,
  authors: (canon as { corpusTotal?: number }).corpusTotal ?? 0,
  milestones: milestones.milestones.length,
};

/* The historical borders, 1492-1898 (data/atlas-eras.json, issue #71): twenty
   keyframes, each a dated act with its source. A milestone shows the latest
   keyframe at or before its year; outside 1492-1898 the map shows today. */

type L = { en: string; es: string };
type RawFamily = { kind: string; tone: number; name: L; short?: L; at?: [number, number] };
type RawEra = {
  year: number; label: string; act: L; change: L; source: L;
  pulse: string[]; labels: string[]; lines: string[]; frame: string[];
  units: { f: string; ohm?: number; drawn?: string }[];
  marks?: { at: [number, number]; name: L; kind: string }[];
  names?: Record<string, { name: L; short: L }>;
};
const ERAS_RAW = atlasEras.eras as unknown as RawEra[];
const FAMILIES_RAW = atlasEras.families as unknown as Record<string, RawFamily>;

export type EraFamily = { kind: string; tone: number; name: string; short?: string; at?: [number, number] };
export type Era = {
  year: number; label: string; act: string; change: string; source: string;
  pulse: string[]; labels: string[]; lines: string[]; frame: string[];
  units: { f: string; ohm?: number; drawn?: string }[];
  marks?: { at: [number, number]; name: string; kind: string }[];
  names?: Record<string, { name: string; short: string }>;
  kinds: string[];             // the kinds drawn, for the legend
};

export const ERA_FIRST = ERAS_RAW[0].year;
export const ERA_LAST = ERAS_RAW[ERAS_RAW.length - 1].year;

/** The keyframe a year falls in, or null for today's states. */
export function eraYear(year: number | undefined): number | null {
  if (year === undefined || year < ERA_FIRST || year > ERA_LAST) return null;
  let found: number | null = null;
  for (const e of ERAS_RAW) if (e.year <= year) found = e.year;
  return found;
}

export function erasFor(lang: Lang): { eras: Era[]; families: Record<string, EraFamily> } {
  const families = Object.fromEntries(Object.entries(FAMILIES_RAW).map(([k, f]) => [k, {
    kind: f.kind, tone: f.tone, name: f.name[lang], short: f.short?.[lang], at: f.at,
  }]));
  const eras = ERAS_RAW.map((e) => ({
    year: e.year, label: e.label, act: e.act[lang], change: e.change[lang], source: e.source[lang],
    pulse: e.pulse, labels: e.labels, lines: e.lines, frame: e.frame, units: e.units,
    marks: e.marks?.map((m) => ({ at: m.at, kind: m.kind, name: m.name[lang] })),
    names: e.names && Object.fromEntries(Object.entries(e.names).map(([k, v]) => [k, { name: v.name[lang], short: v.short[lang] }])),
    kinds: [...new Set([
      ...e.units.map((u) => FAMILIES_RAW[u.f].kind.replace('pt-indep', 'indep')),
      ...(e.lines.length ? ['line'] : []),
      ...(e.marks?.length ? ['native'] : []),
    ])],
  }));
  return { eras, families };
}

type Milestone = { n: number; year: number; date: { en: string; es: string }; title: { en: string; es: string }; body: { en: string; es: string } };
const MILESTONES = new Map((milestones.milestones as Milestone[]).map((m) => [m.n, m]));
// the first sentence of a milestone's text: a card has room for one
const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();

export function tourCards(lang: Lang): TourCard[] {
  const t = dict(lang).map.tour;
  const total = MILESTONES.size;
  return TOUR.map((stop, i) => {
    const m = stop.milestone ? MILESTONES.get(stop.milestone) : undefined;
    const last = i === TOUR.length - 1;
    const media = stop.media;
    const mediaText = !media ? undefined : media.kind === 'pending' ? media.what[lang] : media.credit[lang];
    if (!m) {
      return {
        ...stop, mediaText, era: null,
        kicker: t.introKicker, title: dict(lang).map.title, text: t.introText,
        link: { href: '#milestones', label: t.atlas },
      };
    }
    return {
      ...stop, mediaText, era: eraYear(m.year),
      kicker: last ? `${m.date[lang]} · ${t.outroKicker}` : `${m.date[lang]} · ${t.milestone} ${m.n} ${t.of} ${total}`,
      title: m.title[lang],
      text: firstSentence(m.body[lang]),
      link: stop.canon ? { href: workHref(lang, stop.canon), label: t.canon } : { href: '#milestones', label: t.atlas },
    };
  });
}
