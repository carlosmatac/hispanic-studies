import fs from 'node:fs';
import path from 'node:path';
import { dict, type Lang } from '@/lib/i18n';
import { CHAPTER_STARTS, TRACKS, type Track } from '@/lib/atlas-time';

export { CHAPTER_STARTS, TRACKS, yearLabel, stopIndex, type Track } from '@/lib/atlas-time';
import milestones from '@/data/milestones.json';
import voyagesData from '@/data/atlas-voyages.json';
import atlasEras from '@/data/atlas-eras.json';
import atlasRealms from '@/data/atlas-realms.json';
import recordsData from '@/data/atlas-records.json';
import iberophone from '@/public/data/iberophone.json';

/* The Atlas as one story (issue #95, after #71): an ordered sequence of stops,
   built on the server for one language and handed to the globe
   (components/atlas/AtlasStage.tsx) and to the chronicle under it, which is
   the same content as text.

   Four kinds of stop, merged and sorted by date (218 BCE to today):
   - a record: one of Beltrán's 139 records (data/atlas-records.json, built by
     tools/build-atlas-records.py from his manuscript of 16 November 2026);
   - a voyage: a documented route sailed by a ship (data/atlas-voyages.json);
   - a keyframe: one of the twenty border states (data/atlas-eras.json);
   - today.
   A record that tells the same story as a voyage or a keyframe (its
   `aliases.beats`) becomes that stop's text: the stop keeps its id, and the
   record's id links to it too. Milestones hang from the stop that names them,
   else from the last stop at or before their year.

   The import contract holds here: records bring text, links, a plate and an
   approximate camera anchor; never geometry. Only voyages and keyframes draw or
   lift anything on the globe. */

type L = { en: string; es: string };
export type LonLat = [number, number];

/* ---------- raw data ---------- */

type RawWaypoint = { at: LonLat; date?: string; name?: L; log?: L; reveal?: number };
type RawVoyage = {
  id: string; crown: 'es' | 'pt'; kind: 'sea' | 'land' | 'river'; layout: string;
  title: L; who: L; ships: L; summary: L; note?: L; milestones: number[]; image?: string;
  sources: string[]; route: RawWaypoint[];
};
const VOYAGES = voyagesData.voyages as unknown as RawVoyage[];

type RawEra = {
  year: number; label: string; date: string; act: L; change: L; source: L;
  pulse: string[]; labels: string[]; lines: string[]; frame: string[];
  units: { f: string; ohm?: number; drawn?: string }[];
  marks?: { at: LonLat; name: L; kind: string }[];
  names?: Record<string, { name: L; short: L }>;
};
type RawFamily = { kind: string; tone?: number; tint?: string; z?: number; name: L; short?: L; at?: LonLat };
const ERAS = atlasEras.eras as unknown as RawEra[];
const FAMILIES = atlasEras.families as unknown as Record<string, RawFamily>;

/* The realms outside the American keyframes (#104): the peninsula's polities
   from 218 BCE, Spain and Portugal, and their holdings in the Old World and the
   Pacific; each unit is one dated OpenHistoricalMap relation, drawn between its
   own dates (data/atlas-realms.json, built by tools/build-atlas-eras.py). */
type RawRealms = {
  families: Record<string, RawFamily>;
  units: { id: string; f: string; from: number; to: number }[];
  gaps: { from: number; to: number; where: string; text: L }[];
};
const REALMS = atlasRealms as unknown as RawRealms;

type Milestone = { n: number; year: number; date: L; title: L; body: L };
const MILESTONES = milestones.milestones as Milestone[];

type RawRecord = {
  id: string;
  title: { en: string; es: string | null };
  date: { label: string; start: number; end: number | null; open: boolean; precision: string; sort: number };
  type: string; regions: string[]; tracks: string[];
  anchorText: string;
  anchors: { name: string; at: LonLat; approx: true }[];
  camera: { at: LonLat; span: number; approx: true } | null;
  paragraphs: { en: string[]; es: string[] | null };
  links: { wikipedia: string | null; book: { label: string; url: string } | null; further: { label: string; url: string }[] };
  plate: null | {
    role: 'contextual' | 'associated' | 'site'; caption: string; page: string;
    licence?: string | null; author?: string | null; src?: string; width?: number; height?: number;
  };
  aliases: { milestones: number[]; beats: string[] };
  interpretation: string | null;
};
const RECORDS = (recordsData as unknown as { records: RawRecord[] }).records;
export const RETIRED = (recordsData as unknown as { retired: string[] }).retired;

/* The records in Spanish, when they exist: site/data/atlas-records.es.json,
   keyed by id ({ title, dateLabel?, anchorText, paragraphs: [four], machine }), written by the
   translation work and merged here at build time. Read from disk so the site
   builds with or without it. */
type Spanish = Record<string, { title?: string; dateLabel?: string; anchorText?: string; paragraphs?: string[]; machine?: boolean }>;
const SPANISH: Spanish | null = (() => {
  try {
    const f = path.join(process.cwd(), 'data', 'atlas-records.es.json');
    if (!fs.existsSync(f)) return null;
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
    return (raw.records && !Array.isArray(raw.records) ? raw.records : raw) as Spanish;
  } catch {
    return null;
  }
})();

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

/* Framing for keyframes and today: a box [[west, south], [east, north]]. */
const FRAMES: Record<string, [LonLat, LonLat]> = {
  'era-1492': [[-90, 8], [12, 46]],
  'era-1494': [[-95, -30], [20, 45]],
  'era-1511': [[-88, 8], [-58, 26]],
  'era-1535': [[-118, 5], [-60, 34]],
  'era-1542': [[-118, -45], [-30, 32]],
  'era-1565': [[100, -2], [260, 32]],
  'era-1670': [[-100, 5], [-55, 30]],
  'era-1697': [[-86, 14], [-62, 24]],
  'era-1739': [[-90, -20], [-55, 15]],
  'era-1750': [[-80, -40], [-30, 5]],
  'era-1763': [[-120, 10], [-60, 50]],
  'era-1777': [[-140, -50], [-30, 58]],
  'era-1783': [[-110, 12], [-65, 38]],
  'era-1790': [[-150, 15], [-95, 62]],
  'era-1795': [[-110, 12], [-62, 38]],
  'era-1803': [[-115, 5], [-55, 50]],
  'era-1819': [[-125, -45], [-35, 45]],
  'era-1826': [[-120, -55], [-30, 35]],
  'era-1848': [[-125, 10], [-75, 45]],
  // the Caribbean and the Philippines are half a world apart: seen across the Pacific
  'era-1898': [[120, 0], [285, 30]],
  today: [[-118, -42], [128, 52]],
};


/* ---------- what the client gets ---------- */

export type Waypoint = { at: LonLat; date?: string; name?: string; log?: string; reveal?: number };
export type Voyage = { id: string; crown: 'es' | 'pt'; kind: 'sea' | 'land' | 'river'; title: string; route: Waypoint[] };
export type EraUnit = { id: string; f: string };
export type Era = {
  year: number; label: string; date: string;
  units: EraUnit[]; pulse: string[]; labels: string[]; lines: string[];
  marks: { at: LonLat; name: string; kind: string }[];
  names: Record<string, string>;
};
export type Family = { kind: string; tint?: string; z: number; name: string; at?: LonLat };
export type RealmUnit = { id: string; f: string; from: number; to: number };
export type StopMilestone = { n: number; date: string; title: string };
export type RecordView = {
  id: string;
  title: string;
  /** the record's own text is in English while Spanish is pending */
  lang: 'en' | 'es';
  pending: boolean;
  /** a machine translation not yet reviewed */
  machine: boolean;
  date: string;
  type: string;
  paragraphs: string[];   // the three historical paragraphs
  mapNote: string;        // the fourth: the manuscript's note on map behaviour
  anchors: { name: string; at: LonLat }[];
  links: { wikipedia: string | null; book: { label: string; url: string } | null; further: { label: string; url: string }[] };
  plate: null | { src?: string; caption: string; role: 'contextual' | 'associated' | 'site'; page: string; author?: string | null; licence?: string | null; w?: number; h?: number };
  interpretation: string | null;
};
export type Stop = {
  id: string;
  /** other ids that link here (#on-map-<alias>): merged records, the old opening */
  aliases: string[];
  kind: 'record' | 'voyage' | 'era' | 'today';
  chapter: number;
  tracks: Track[];
  /** the year as a number on one axis (BCE negative), for the timeline and the fog */
  year: number;
  /** a record's last year (open records: today), for the events layer */
  until?: number;
  /** the years as shown */
  label: string;
  /** ISO dates for voyages and keyframes (a voyage: its first and last landfall) */
  date?: string;
  end?: string;
  kicker: string;
  title: string;
  text: string;
  who?: string;
  ships?: string;
  note?: string;
  sources: string[];
  milestones: StopMilestone[];
  voyage?: number;
  era?: number;
  record?: RecordView;
  /** the camera: a box to frame, or a point and an angular radius */
  box?: [LonLat, LonLat];
  focus?: { at: LonLat; span: number };
  image?: { src: string; credit: string };
  branches?: { title: string; text: string }[];
};
export type Chronicle = {
  stops: Stop[];
  voyages: Voyage[];
  eras: Era[];
  families: Record<string, Family>;
  /** dated units outside the keyframes, and the spans for which no shape exists */
  realms: RealmUnit[];
  gaps: { from: number; to: number; text: string }[];
  iberophone: { emersa: string[]; submersa: string[]; points: { at: LonLat; name: string; tier: string }[] };
  counts: { records: number; anchored: number };
};

const yearOf = (iso: string) => Number(iso.slice(0, 4));
export const chapterOf = (year: number) => { let c = 0; CHAPTER_STARTS.forEach((y, i) => { if (year >= y) c = i; }); return c; };

/** A record's date label in the reader's language. The English is the
    manuscript's own; the Spanish only renames the era marks and words. */
export function dateLabel(label: string, lang: Lang): string {
  if (lang === 'en') return label;
  return label
    .replace(/(\d+) tradition; (\d+) onward/, 'tradición de $1; desde $2')
    .replace(/\bBCE\b/g, 'a. C.').replace(/\bCE\b/g, 'd. C.')
    .replace(/\bc\. /g, 'h. ')
    .replace(/(\d{3,4})s\b/g, 'años $1')
    .replace(/\bpresent\b/g, 'hoy')
    .replace(/\bonward\b/g, 'en adelante');
}

const REGION_TRACK: Record<string, Track> = {};
{
  const tracks = (recordsData as unknown as { tracks: Record<Track, string[]> }).tracks;
  for (const t of TRACKS) for (const r of tracks[t] ?? []) REGION_TRACK[r] = t;
}
/** Voyages and keyframes have no regions in their data: their tracks by where they go. */
const BEAT_TRACKS: Record<string, Track[]> = {
  'columbus-1': ['islands', 'north-america'], 'columbus-2': ['islands', 'north-america'], 'columbus-3': ['islands', 'south-america'],
  'columbus-4': ['north-america'], gama: ['islands', 'africa', 'asia'], cabral: ['islands', 'south-america', 'africa', 'asia'],
  balboa: ['north-america'], magellan: ['islands', 'south-america', 'asia', 'oceania'], orellana: ['south-america'],
  legazpi: ['north-america', 'asia', 'oceania'],
  'era-1492': ['iberia', 'north-america'], 'era-1494': ['islands', 'south-america'], 'era-1511': ['north-america'], 'era-1535': ['north-america'],
  'era-1542': ['south-america'], 'era-1565': ['asia', 'oceania'], 'era-1670': ['north-america'], 'era-1697': ['north-america'],
  'era-1739': ['south-america'], 'era-1750': ['south-america'], 'era-1763': ['north-america'], 'era-1777': ['north-america', 'south-america'],
  'era-1783': ['north-america'], 'era-1790': ['north-america'], 'era-1795': ['north-america'], 'era-1803': ['north-america'],
  'era-1819': ['north-america'], 'era-1826': ['south-america', 'north-america'], 'era-1848': ['north-america'], 'era-1898': ['north-america', 'asia', 'oceania'],
  today: ['world'],
};

export function chronicleFor(lang: Lang): Chronicle {
  const t = dict(lang).atlas;
  const voyages: Voyage[] = VOYAGES.map((v) => ({
    id: v.id, crown: v.crown, kind: v.kind, title: v.title[lang],
    route: v.route.map((w) => ({ at: w.at, date: w.date, name: w.name?.[lang], log: w.log?.[lang], reveal: w.reveal })),
  }));
  const eras: Era[] = ERAS.map((e) => ({
    year: e.year, label: e.label, date: e.date,
    units: e.units.map((u) => ({ id: u.ohm ? `r${u.ohm}` : (u.drawn as string), f: u.f })),
    pulse: e.pulse, labels: e.labels, lines: e.lines,
    marks: (e.marks ?? []).map((m) => ({ at: m.at, kind: m.kind, name: m.name[lang] })),
    names: Object.fromEntries(Object.entries(e.names ?? {}).map(([k, v]) => [k, v.short[lang] || v.name[lang]])),
  }));
  const family = (f: RawFamily): Family => ({ kind: f.kind, tint: f.tint, z: f.z ?? 1, name: (f.short ?? f.name)[lang], at: f.at });
  const families: Record<string, Family> = Object.fromEntries([
    ...Object.entries(FAMILIES).map(([k, f]) => [k, family(f)]),
    ...Object.entries(REALMS.families).map(([k, f]) => [k, family(f)]),
  ]);

  const ms = (n: number): StopMilestone => {
    const m = MILESTONES.find((x) => x.n === n) as Milestone;
    return { n: m.n, date: m.date[lang], title: m.title[lang] };
  };

  const view = (r: RawRecord): RecordView => {
    // Spanish: the manuscript's own (none yet), else the translations file, else the English
    const tr = lang === 'es' ? SPANISH?.[r.id] : undefined;
    const es = lang === 'es' ? (r.paragraphs.es ?? (tr?.paragraphs?.length ? tr.paragraphs : null)) : null;
    const paras = es ?? r.paragraphs.en;
    return {
      id: r.id,
      title: (lang === 'es' ? r.title.es ?? (es ? tr?.title : null) : null) ?? r.title.en,
      lang: es ? 'es' : 'en',
      pending: lang === 'es' && !es,
      machine: !!(es && !r.paragraphs.es && tr?.machine),
      date: (es && tr?.dateLabel) || dateLabel(r.date.label, lang),
      type: r.type,
      paragraphs: paras.slice(0, 3),
      mapNote: paras[3] ?? '',
      anchors: r.anchors.map((a) => ({ name: a.name, at: a.at })),
      links: { wikipedia: r.links.wikipedia, book: r.links.book, further: r.links.further },
      plate: r.plate ? {
        src: r.plate.src, caption: r.plate.caption, role: r.plate.role, page: r.plate.page,
        author: r.plate.author, licence: r.plate.licence, w: r.plate.width, h: r.plate.height,
      } : null,
      interpretation: r.interpretation,
    };
  };
  const tracksOf = (r: RawRecord): Track[] => TRACKS.filter((x) => r.tracks.includes(x));

  /* the beats that exist already: voyages, keyframes, today */
  const merged = new Map<string, RawRecord>();
  for (const r of RECORDS) for (const b of r.aliases.beats) merged.set(b, r);

  const stops: Stop[] = [];
  VOYAGES.forEach((v, vi) => {
    const dated = v.route.filter((w) => w.date);
    const first = dated[0].date as string;
    const last = dated[dated.length - 1].date as string;
    const y0 = yearOf(first), y1 = yearOf(last);
    // Columbus's second voyage: the route shown is its first leg (1493–1494) of a voyage that ran to 1496
    const label = v.id === 'columbus-2' ? '1493–1494' : y0 === y1 ? `${y0}` : `${y0}–${y1}`;
    const rec = merged.get(v.id);
    stops.push({
      id: v.id, aliases: rec ? [rec.id] : [], kind: 'voyage',
      chapter: chapterOf(y0), tracks: BEAT_TRACKS[v.id] ?? [], year: y0 + (Number(first.slice(5, 7)) - 1) / 12,
      label, date: first, end: last,
      kicker: `${t.voyageKicker} · ${v.crown === 'es' ? t.crownEs : t.crownPt}`,
      title: v.title[lang], text: v.summary[lang], who: v.who[lang], ships: v.ships[lang],
      note: v.id === 'columbus-2' ? `${t.columbus2} ${v.note?.[lang] ?? ''}`.trim() : v.note?.[lang],
      sources: v.sources,
      image: v.image ? { src: IMAGES[v.image].src, credit: IMAGES[v.image].credit[lang] } : undefined,
      milestones: v.milestones.map(ms), voyage: vi, record: rec ? view(rec) : undefined,
    });
  });
  ERAS.forEach((e, i) => {
    const id = `era-${e.year}`;
    const rec = merged.get(id);
    const y = yearOf(e.date);
    stops.push({
      id, aliases: [...(i === 0 ? ['open'] : []), ...(rec ? [rec.id] : [])], kind: 'era',
      chapter: chapterOf(e.year), tracks: BEAT_TRACKS[id] ?? [], year: y + (Number(e.date.slice(5, 7)) - 1) / 12,
      label: e.label, date: e.date, end: e.date,
      kicker: t.bordersKicker, title: e.act[lang], text: e.change[lang],
      sources: [e.source[lang]], milestones: [], era: i, box: FRAMES[id],
      record: rec ? view(rec) : undefined,
      branches: e.year === 1898 ? t.branches1898 : undefined,
    });
  });
  for (const r of RECORDS) {
    if (r.aliases.beats.length) continue;
    const v = view(r);
    stops.push({
      id: r.id, aliases: [], kind: 'record',
      chapter: chapterOf(r.date.sort), tracks: tracksOf(r), year: r.date.sort, until: r.date.open ? 2026 : (r.date.end ?? r.date.start),
      label: v.date, kicker: t.types[r.type as keyof typeof t.types] ?? r.type,
      // (the record's own paragraphs are its text: not repeated here)
      title: v.title, text: '', sources: [],
      milestones: r.aliases.milestones.map(ms),
      focus: r.camera ? { at: r.camera.at, span: r.camera.span } : undefined,
      record: v,
    });
  }
  stops.push({
    id: 'today', aliases: [], kind: 'today', chapter: CHAPTER_STARTS.length - 1, tracks: ['world'], year: 2026,
    label: t.todayLabel, date: '2026-01-01', end: '2026-01-01',
    kicker: t.todayKicker, title: t.todayTitle, text: t.todayText, sources: [t.todaySource], milestones: [], box: FRAMES.today,
  });
  // one order: by date; at the same date a record before the voyage or keyframe it leads into
  const rank = { record: 0, era: 1, voyage: 2, today: 3 } as const;
  stops.sort((a, b) => (a.year - b.year) || (rank[a.kind] - rank[b.kind]));

  // merged records keep their tracks on the beat too
  for (const s of stops) {
    if (s.kind !== 'record' && s.record) {
      const r = RECORDS.find((x) => x.id === s.record?.id) as RawRecord;
      s.tracks = TRACKS.filter((x) => s.tracks.includes(x) || r.tracks.includes(x));
      s.milestones.push(...r.aliases.milestones.filter((n) => !s.milestones.some((m) => m.n === n)).map(ms));
    }
  }

  // every milestone not named by a stop: the last stop at or before its year
  const named = new Set(stops.flatMap((s) => s.milestones.map((m) => m.n)));
  for (const m of MILESTONES) {
    if (named.has(m.n)) continue;
    let target = stops[0];
    for (const s of stops) if (s.kind !== 'today' && s.year <= m.year + 0.999) target = s;
    if (m.year > 1999) target = stops[stops.length - 1];
    target.milestones.push(ms(m.n));
  }
  for (const s of stops) s.milestones.sort((a, b) => a.n - b.n);

  const places = iberophone as unknown as {
    countries: { iso: string; tier: string }[];
    points: { lon: number; lat: number; tier: string; name: L }[];
  };
  return {
    stops, voyages, eras, families,
    realms: REALMS.units.map((u) => ({ id: u.id, f: u.f, from: u.from, to: u.to })),
    gaps: REALMS.gaps.map((g) => ({ from: g.from, to: g.to, text: g.text[lang] })),
    iberophone: {
      emersa: places.countries.filter((c) => c.tier === 'emersa').map((c) => c.iso),
      submersa: places.countries.filter((c) => c.tier === 'submersa').map((c) => c.iso),
      points: places.points.map((p) => ({ at: [p.lon, p.lat] as LonLat, name: p.name[lang], tier: p.tier })),
    },
    counts: { records: RECORDS.length, anchored: RECORDS.filter((r) => r.camera).length },
  };
}
