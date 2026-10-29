import { dict, type Lang } from '@/lib/i18n';
import milestones from '@/data/milestones.json';
import voyagesData from '@/data/atlas-voyages.json';
import atlasEras from '@/data/atlas-eras.json';
import iberophone from '@/public/data/iberophone.json';

/* The Atlas as a chronicle (issue #71): one ordered sequence of beats, built on
   the server for one language and handed to the stage (components/atlas) and to
   the list under it, which is the same content as text.

   - a voyage beat sails a documented route (data/atlas-voyages.json);
   - an era beat is one of the twenty border keyframes (data/atlas-eras.json);
   - the opening is 1492 before Columbus sails; the closing is today.

   The order is written out below rather than sorted, so that each beat sits
   where the story needs it; the dates still run forward. */

type L = { en: string; es: string };
export type LonLat = [number, number];
export type Layout = 'atlantic' | 'pacific' | 'globe';

const SEQUENCE: string[] = [
  'open',
  'columbus-1', 'columbus-2', 'era-1494', 'gama', 'columbus-3', 'cabral', 'columbus-4',
  'era-1511', 'balboa', 'magellan', 'era-1535', 'orellana', 'era-1542', 'legazpi', 'era-1565',
  'era-1670', 'era-1697', 'era-1739', 'era-1750', 'era-1763', 'era-1777', 'era-1783', 'era-1790',
  'era-1795', 'era-1803', 'era-1819', 'era-1826', 'era-1848', 'era-1898',
  'today',
];

/* Framing for beats that are not voyages: a box [[west, south], [east, north]]. */
const FRAMES: Record<string, { box: [LonLat, LonLat]; layout?: Layout }> = {
  open: { box: [[-90, 8], [12, 46]] },
  'era-1494': { box: [[-95, -30], [20, 45]] },
  'era-1511': { box: [[-88, 8], [-58, 26]] },
  'era-1535': { box: [[-118, 5], [-60, 34]] },
  'era-1542': { box: [[-118, -45], [-30, 32]] },
  'era-1565': { box: [[100, -2], [260, 32]], layout: 'pacific' },
  'era-1670': { box: [[-100, 5], [-55, 30]] },
  'era-1697': { box: [[-86, 14], [-62, 24]] },
  'era-1739': { box: [[-90, -20], [-55, 15]] },
  'era-1750': { box: [[-80, -40], [-30, 5]] },
  'era-1763': { box: [[-120, 10], [-60, 50]] },
  'era-1777': { box: [[-140, -50], [-30, 58]] },
  'era-1783': { box: [[-110, 12], [-65, 38]] },
  'era-1790': { box: [[-150, 15], [-95, 62]] },
  'era-1795': { box: [[-110, 12], [-62, 38]] },
  'era-1803': { box: [[-115, 5], [-55, 50]] },
  'era-1819': { box: [[-125, -45], [-35, 45]] },
  'era-1826': { box: [[-120, -55], [-30, 35]] },
  'era-1848': { box: [[-125, 10], [-75, 45]] },
  'era-1898': { box: [[-130, -5], [140, 35]] },
  today: { box: [[-118, -42], [128, 52]] },
};

type RawWaypoint = { at: LonLat; date?: string; name?: L; log?: L; reveal?: number };
type RawVoyage = {
  id: string; crown: 'es' | 'pt'; kind: 'sea' | 'land' | 'river'; layout: Layout;
  title: L; who: L; ships: L; summary: L; note?: L; milestones: number[]; image?: string;
  sources: string[]; route: RawWaypoint[];
};
const VOYAGES = (voyagesData.voyages as unknown as RawVoyage[]);

type RawEra = {
  year: number; label: string; date: string; act: L; change: L; source: L;
  pulse: string[]; labels: string[]; lines: string[]; frame: string[];
  units: { f: string; ohm?: number; drawn?: string }[];
  marks?: { at: LonLat; name: L; kind: string }[];
  names?: Record<string, { name: L; short: L }>;
};
type RawFamily = { kind: string; tone: number; name: L; short?: L; at?: LonLat };
const ERAS = atlasEras.eras as unknown as RawEra[];
const FAMILIES = atlasEras.families as unknown as Record<string, RawFamily>;

type Milestone = { n: number; year: number; date: L; title: L; body: L };
const MILESTONES = milestones.milestones as Milestone[];

const IMAGES: Record<string, { src: string; credit: L }> = {
  puebla: {
    src: '/art/tour/puebla-desembarco-1862.jpg',
    credit: { en: 'Dióscoro Puebla, The First Landing of Columbus in America, 1862. Museo del Prado', es: 'Dióscoro Puebla, Primer desembarco de Cristóbal Colón en América, 1862. Museo del Prado' },
  },
  galleon: {
    src: '/art/tour/galleon-cabrera-bueno-1734.jpg',
    credit: { en: 'A galleon, after José González Cabrera Bueno, Navegación especulativa y práctica, Manila 1734', es: 'Galeón, según José González Cabrera Bueno, Navegación especulativa y práctica, Manila 1734' },
  },
};

/* ---------- what the client gets ---------- */

export type Waypoint = { at: LonLat; date?: string; name?: string; log?: string; reveal?: number };
export type Voyage = {
  id: string; crown: 'es' | 'pt'; kind: 'sea' | 'land' | 'river'; layout: Layout;
  title: string; who: string; ships: string; route: Waypoint[];
};
export type EraUnit = { id: string; f: string };
export type Era = {
  year: number; label: string; date: string;
  units: EraUnit[]; pulse: string[]; labels: string[]; lines: string[];
  marks: { at: LonLat; name: string; kind: string }[];
  names: Record<string, string>;
};
export type Family = { kind: string; tone: number; name: string; at?: LonLat };
export type BeatMilestone = { n: number; date: string; title: string; text: string };
export type Beat = {
  id: string;
  kind: 'open' | 'voyage' | 'era' | 'today';
  layout: Layout;
  label: string;               // the years, as shown
  date: string;                // ISO date the beat stands at (a voyage: its first)
  end: string;                 // ISO date it ends at
  kicker: string;
  title: string;
  text: string;
  who?: string;
  ships?: string;
  note?: string;
  sources: string[];
  milestones: BeatMilestone[];
  voyage?: number;             // index in `voyages`
  era?: number;                // index in `eras`
  box?: [LonLat, LonLat];
  image?: { src: string; credit: string };
};
export type Chronicle = {
  beats: Beat[];
  voyages: Voyage[];
  eras: Era[];
  families: Record<string, Family>;
  iberophone: { emersa: string[]; submersa: string[]; points: { at: LonLat; name: string; tier: string }[] };
};

const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();
const yearOf = (iso: string) => Number(iso.slice(0, 4));

export function chronicleFor(lang: Lang): Chronicle {
  const t = dict(lang).atlas;
  const voyages: Voyage[] = VOYAGES.map((v) => ({
    id: v.id, crown: v.crown, kind: v.kind, layout: v.layout,
    title: v.title[lang], who: v.who[lang], ships: v.ships[lang],
    route: v.route.map((w) => ({ at: w.at, date: w.date, name: w.name?.[lang], log: w.log?.[lang], reveal: w.reveal })),
  }));
  const eras: Era[] = ERAS.map((e) => ({
    year: e.year, label: e.label, date: e.date,
    units: e.units.map((u) => ({ id: u.ohm ? `r${u.ohm}` : (u.drawn as string), f: u.f })),
    pulse: e.pulse, labels: e.labels, lines: e.lines,
    marks: (e.marks ?? []).map((m) => ({ at: m.at, kind: m.kind, name: m.name[lang] })),
    names: Object.fromEntries(Object.entries(e.names ?? {}).map(([k, v]) => [k, v.short[lang] || v.name[lang]])),
  }));
  const families = Object.fromEntries(Object.entries(FAMILIES).map(([k, f]) => [k, {
    kind: f.kind, tone: f.tone, name: (f.short ?? f.name)[lang], at: f.at,
  }]));

  const used = new Set<number>(VOYAGES.flatMap((v) => v.milestones));
  const beats: Beat[] = SEQUENCE.map((id) => {
    if (id === 'open') {
      const e = ERAS[0];
      return {
        id, kind: 'open', layout: 'atlantic', label: '1492', date: '1492-04-17', end: '1492-04-17',
        kicker: t.openKicker, title: t.openTitle, text: `${t.openText} ${e.act[lang]}: ${firstSentence(e.change[lang])}`,
        sources: [e.source[lang]], milestones: [], era: 0, box: FRAMES.open.box,
      };
    }
    if (id === 'today') {
      return {
        id, kind: 'today', layout: 'atlantic', label: t.todayLabel, date: '2026-01-01', end: '2026-01-01',
        kicker: t.todayKicker, title: t.todayTitle, text: t.todayText,
        sources: [t.todaySource], milestones: [], box: FRAMES.today.box,
      };
    }
    if (id.startsWith('era-')) {
      const i = ERAS.findIndex((e) => `era-${e.year}` === id);
      const e = ERAS[i];
      return {
        id, kind: 'era', layout: FRAMES[id]?.layout ?? 'atlantic', label: e.label, date: e.date, end: e.date,
        kicker: `${t.bordersKicker} · ${e.label}`, title: e.act[lang], text: e.change[lang],
        sources: [e.source[lang]], milestones: [], era: i, box: FRAMES[id]?.box,
      };
    }
    const vi = VOYAGES.findIndex((v) => v.id === id);
    const v = VOYAGES[vi];
    const dated = v.route.filter((w) => w.date);
    const first = dated[0].date as string;
    const last = dated[dated.length - 1].date as string;
    const y0 = yearOf(first), y1 = yearOf(last);
    const image = v.image ? { src: IMAGES[v.image].src, credit: IMAGES[v.image].credit[lang] } : undefined;
    return {
      id, kind: 'voyage', layout: v.layout, label: y0 === y1 ? `${y0}` : `${y0}–${y1}`, date: first, end: last,
      kicker: `${t.voyageKicker} · ${y0 === y1 ? y0 : `${y0}–${y1}`} · ${v.crown === 'es' ? t.crownEs : t.crownPt}`,
      title: v.title[lang], text: v.summary[lang], who: v.who[lang], ships: v.ships[lang], note: v.note?.[lang],
      sources: v.sources, image,
      milestones: v.milestones.map((n) => MILESTONES.find((m) => m.n === n) as Milestone).map((m) => ({
        n: m.n, date: m.date[lang], title: m.title[lang], text: firstSentence(m.body[lang]),
      })),
      voyage: vi,
    };
  });

  // every milestone not tied to a voyage goes to the last non-voyage beat that
  // starts at or before its year (before 1492: the opening; after 1898: today)
  for (const m of MILESTONES) {
    if (used.has(m.n)) continue;
    let target = beats[0];
    for (const b of beats) if (b.kind !== 'voyage' && (b.era !== undefined && b.kind === 'era' ? ERAS[b.era].year : yearOf(b.date)) <= m.year) target = b;
    if (m.year > 1899) target = beats[beats.length - 1];
    target.milestones.push({ n: m.n, date: m.date[lang], title: m.title[lang], text: firstSentence(m.body[lang]) });
  }

  const places = iberophone as unknown as {
    countries: { iso: string; tier: string }[];
    points: { lon: number; lat: number; tier: string; name: L }[];
  };
  return {
    beats, voyages, eras, families,
    iberophone: {
      emersa: places.countries.filter((c) => c.tier === 'emersa').map((c) => c.iso),
      submersa: places.countries.filter((c) => c.tier === 'submersa').map((c) => c.iso),
      points: places.points.map((p) => ({ at: [p.lon, p.lat] as LonLat, name: p.name[lang], tier: p.tier })),
    },
  };
}
