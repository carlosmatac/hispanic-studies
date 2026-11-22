/* ==========================================================================
   The Atlas globe (issue #95; after the dark chart of #71): a planet that is
   discovered as the story goes.

   One 2D canvas, drawn by d3-geo every frame from the story clock (seconds
   into the chronicle, lib/atlas-chronicle.ts), the camera and the data
   (Natural Earth land, the OpenHistoricalMap keyframes, the voyages). The
   planet is an orthographic projection shaded as a sphere; a flat Equal Earth
   view draws the same things for whoever prefers a map (and as the light
   fallback). No WebGL: Prometheus, the reference, does the same.

   - The dark is what had not yet entered the record: a fog over the planet,
     cut away by a low-resolution mask where ships have sailed, around the
     places they reached, over each keyframe's jurisdictions, and dimly over
     the Old World. Records (Beltrán's 139) never cut it: their places are
     drawn as rings for the camera, over the fog.
   - The camera flies from stop to stop (ease in and out, rising a little on
     long hops) and follows a ship at sea. The reader can take it (drag,
     Ctrl+wheel or pinch, the zoom buttons); the next stop or "back to the
     story" gives it back.
   - Reduced motion: no flights, no inertia, nothing pulses; the page only ever
     asks for a stop's finished state.

   Colours are the brand's (app/globals.css) and tints of them, nothing else.
   ========================================================================== */

import {
  geoEqualEarth, geoOrthographic, geoPath, geoGraticule, geoInterpolate, geoDistance, geoCentroid, geoArea, geoContains,
  type GeoProjection,
} from 'd3-geo';
import { feature, merge, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, MultiLineString, Position } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Chronicle, Era, LonLat, Stop, Voyage, Waypoint } from '@/lib/atlas-chronicle';

/* ---------- colours: the brand tokens, and tints of them ---------- */

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const BRAND = {
  burgundy: hex('#470b15'), burgundyDark: hex('#2f070d'), leather: hex('#8b5e4b'),
  paper: hex('#f9f3dd'), paperDeep: hex('#ede3c8'), ink: hex('#28231e'),
};
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const css = (c: RGB, a = 1) => (a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);

const C = {
  space: mix(BRAND.burgundyDark, BRAND.ink, 0.45),            // around the planet
  fog: mix(BRAND.burgundyDark, BRAND.ink, 0.3),               // the unknown: wine-black
  sea: mix(BRAND.ink, BRAND.leather, 0.3),                    // a recorded sea
  land: mix(BRAND.paperDeep, BRAND.leather, 0.5),             // recorded land
  other: mix(BRAND.paperDeep, BRAND.ink, 0.55),
  es: [mix(BRAND.burgundy, BRAND.paper, 0.06), mix(BRAND.burgundy, BRAND.paper, 0.17), mix(BRAND.burgundy, BRAND.paper, 0.27), mix(BRAND.burgundy, BRAND.paper, 0.36)],
  pt: [BRAND.leather, mix(BRAND.leather, BRAND.paper, 0.2)],
  indep: mix(BRAND.burgundy, BRAND.paperDeep, 0.5),
  native: mix(BRAND.leather, BRAND.ink, 0.35),
  paper: BRAND.paper,
  paperDeep: BRAND.paperDeep,
  leather: BRAND.leather,
  leatherLight: mix(BRAND.leather, BRAND.paper, 0.45),
  burgundy: BRAND.burgundy,
  burgundyDark: BRAND.burgundyDark,
  glow: mix(BRAND.leather, BRAND.burgundy, 0.35),
};

/* The map's own colours (Carlos, 2026-11-22: "more colours on the Atlas map
   layers"; recorded in AGENTS.md). A neutral dark ground, a dark sea, neutral
   land where nothing is mapped, and muted historical-atlas hues for the
   polities: ochres, teals, olives, slate blues, roses. Spain stays burgundy and
   Portugal leather, so the Iberian story still reads. The interface around the
   map keeps the brand. */
const MAP = {
  space: hex('#14191c'),
  sea: hex('#1e2c32'),
  land: hex('#474a45'),
  halo: hex('#6d8e95'),
  polity: ['#c9a35b', '#5f9c97', '#8f9d5b', '#6f88b0', '#b37b8c', '#8db08a', '#c4ad86', '#8e84b5',
    '#bb7b5b', '#6e9364', '#7f9bab', '#9a7396', '#b9a24a', '#a8866f', '#5a8fa0', '#a691bd'].map(hex),
  es: hex('#a8485a'), es2: hex('#94606d'), pt: hex('#ad7f64'),
  types: { conflict: hex('#c8645a'), jurisdiction: hex('#c9a35b'), treaty: hex('#8e84b5'), route: hex('#5f9c97'), settlement: hex('#8db08a'),
    control: hex('#bb7b5b'), culture: hex('#b37b8c'), science: hex('#6f88b0'), institution: hex('#c4ad86'), chart: hex('#7f9bab'),
    contact: hex('#9a7396'), economy: hex('#b9a24a'), interpretation: hex('#a691bd'), law: hex('#a8866f') } as Record<string, RGB>,
};

/* ---------- small helpers ---------- */

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (x: number) => { const t = clamp(x, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
function dayOf(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const [y, m = '6', d] = iso.split('-');
  return Date.UTC(+y, +m - 1, d ? +d : 15) / 864e5;
}
const yearOfDay = (day: number) => { const d = new Date(day * 864e5); return d.getUTCFullYear() + d.getUTCMonth() / 12 + (d.getUTCDate() - 1) / 365; };
const angleDiff = (a: number, b: number) => ((b - a + 540) % 360) - 180;
const normLon = (x: number) => ((x + 540) % 360) - 180;

function rewind(fc: Feature | FeatureCollection): Feature | FeatureCollection {
  if (fc.type === 'FeatureCollection') { fc.features.forEach(rewindOne); return fc; }
  return rewindOne(fc);
}
function rewindOne(f: Feature): Feature {
  const area = (poly: Position[][]) => geoArea({ type: 'Polygon', coordinates: poly });
  const fix = (poly: Position[][]) => (area(poly) > 2 * Math.PI ? poly.map((r) => [...r].reverse()) : poly);
  const keep = (poly: Position[][]) => area(poly) < 4 * Math.PI - 1e-3;
  const g = f.geometry;
  if (g?.type === 'Polygon') g.coordinates = fix(g.coordinates);
  else if (g?.type === 'MultiPolygon') g.coordinates = g.coordinates.filter(keep).map(fix);
  return f;
}
function decimate(t: Topology, n: number): Topology {
  const arcs = t.arcs.map((arc) => {
    let x = 0, y = 0;
    const abs = arc.map(([dx, dy]) => { x += dx; y += dy; return [x, y]; });
    const kept = abs.filter((_, i) => i === 0 || i === abs.length - 1 || i % n === 0);
    let px = 0, py = 0;
    return kept.map(([ax, ay]) => { const d = [ax - px, ay - py]; px = ax; py = ay; return d; });
  });
  return { ...t, arcs } as Topology;
}

/* ---------- the compiled story ---------- */

type Landfall = { wi: number; d: number; day: number; wp: Waypoint; arrive: number };
type Seg = { t0: number; t1: number; d0: number; d1: number; move: boolean };
type CVoyage = { v: Voyage; pts: LonLat[]; cum: number[]; length: number; stops: Landfall[]; segs: Seg[]; dur: number };
type CStop = { stop: Stop; start: number; dur: number };

const PAUSE = 1.05, FIRST = 0.7, LAST = 1.6;
const DWELL = { record: 7, era: 6.5, today: 7 } as const;

function compileVoyage(v: Voyage): CVoyage {
  const pts: LonLat[] = [];
  const cum: number[] = [];
  const wpd: number[] = [];
  let acc = 0;
  v.route.forEach((w, i) => {
    if (i === 0) { pts.push(w.at); cum.push(0); wpd.push(0); return; }
    const a = v.route[i - 1].at, b = w.at;
    const dist = geoDistance(a, b);
    const n = Math.max(1, Math.ceil(dist / (0.6 * RAD)));
    const f = geoInterpolate(a, b);
    for (let k = 1; k <= n; k++) { pts.push(f(k / n) as LonLat); cum.push(acc + (dist * k) / n); }
    acc += dist;
    wpd.push(acc);
  });
  const named = v.route.map((w, i) => ({ w, i })).filter(({ w }) => w.name);
  const travel = clamp(3.5 + acc * 4.6, v.kind === 'land' ? 5 : 7, 27);
  const stops: Landfall[] = [];
  const segs: Seg[] = [];
  let t = 0;
  named.forEach(({ w, i }, k) => {
    const d = wpd[i];
    if (k > 0) {
      const prev = stops[k - 1];
      const dt = Math.max(0.55, (travel * (d - prev.d)) / Math.max(acc, 1e-6));
      segs.push({ t0: t, t1: t + dt, d0: prev.d, d1: d, move: true });
      t += dt;
    }
    const pause = k === 0 ? FIRST : k === named.length - 1 ? LAST : PAUSE;
    stops.push({ wi: i, d, day: dayOf(w.date) ?? 0, wp: w, arrive: t });
    segs.push({ t0: t, t1: t + pause, d0: d, d1: d, move: false });
    t += pause;
  });
  return { v, pts, cum, length: acc, stops, segs, dur: t };
}
function voyageAt(cv: CVoyage, tau: number): { d: number; stop: number; atStop: boolean; day: number } {
  let d = 0, stop = 0, atStop = true;
  for (const s of cv.segs) {
    if (tau < s.t0) break;
    const u = clamp((tau - s.t0) / (s.t1 - s.t0), 0, 1);
    const e = s.move ? 0.5 * u + 0.5 * smooth(u) : 1;
    d = s.d0 + (s.d1 - s.d0) * e;
    atStop = !s.move || u >= 1;
  }
  for (let k = 0; k < cv.stops.length; k++) if (cv.stops[k].d <= d + 1e-9) stop = k;
  const a = cv.stops[stop], b = cv.stops[Math.min(stop + 1, cv.stops.length - 1)];
  const day = b === a || b.d === a.d ? a.day : a.day + ((b.day - a.day) * (d - a.d)) / (b.d - a.d);
  return { d, stop, atStop, day };
}
function pointAt(cv: CVoyage, d: number): LonLat {
  const { cum, pts } = cv;
  if (d <= 0) return pts[0];
  if (d >= cv.length) return pts[pts.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
  const f = (d - cum[lo]) / Math.max(cum[hi] - cum[lo], 1e-9);
  return geoInterpolate(pts[lo], pts[hi])(f) as LonLat;
}
function sliceTo(cv: CVoyage, d: number): LonLat[] {
  const out: LonLat[] = [];
  for (let i = 0; i < cv.pts.length && cv.cum[i] < d; i++) out.push(cv.pts[i]);
  out.push(pointAt(cv, d));
  return out.length > 1 ? out : [cv.pts[0], cv.pts[0]];
}
/** The centre and angular radius (degrees) of a set of points on the sphere. */
function capOf(pts: LonLat[]): { at: LonLat; span: number } {
  let x = 0, y = 0, z = 0;
  for (const [lo, la] of pts) { const c = Math.cos(la * RAD); x += c * Math.cos(lo * RAD); y += c * Math.sin(lo * RAD); z += Math.sin(la * RAD); }
  const at: LonLat = [Math.atan2(y, x) * DEG, Math.atan2(z, Math.hypot(x, y)) * DEG];
  let span = 0;
  for (const p of pts) span = Math.max(span, geoDistance(at, p) * DEG);
  return { at, span };
}
function boxPoints([[w, s], [e, n]]: [LonLat, LonLat]): LonLat[] {
  const out: LonLat[] = [];
  for (let lon = w; lon <= e + 0.01; lon += Math.max(2, (e - w) / 8)) for (let lat = s; lat <= n + 0.01; lat += Math.max(2, (n - s) / 6)) out.push([normLon(lon), lat]);
  return out;
}

/* ---------- public types ---------- */

export type Inset = { l: number; r: number; t: number; b: number };
export type Box = [number, number, number, number];
export type Mode = 'globe' | 'flat';
/** What the card points at: a landfall of the voyage in this stop, a jurisdiction
    (its family), a treaty line, or a place a record names (its index). */
export type Focus = { kind: 'stop'; k: number } | { kind: 'unit'; f: string } | { kind: 'line'; id: string } | { kind: 'place'; k: number };
export const focusKey = (f: Focus | null | undefined) => (!f ? '' : f.kind === 'stop' ? `stop:${f.k}` : f.kind === 'unit' ? `unit:${f.f}` : f.kind === 'line' ? `line:${f.id}` : `place:${f.k}`);
export type HitInfo = { x: number; y: number; title: string; date?: string; text?: string; focus?: Focus; go?: number };
export type Layers = { polities: boolean; iberian: boolean; labels: boolean; routes: boolean; events: boolean; recorded: boolean; fog: boolean };
export const DEFAULT_LAYERS: Layers = { polities: true, iberian: true, labels: true, routes: true, events: true, recorded: true, fog: false };
export type FrameInfo = {
  s: number; stop: number; tau: number; landfall: number; atStop: boolean; day: number; year: number;
  playing: boolean; voyageDay: boolean; free: boolean;
  /** how far in (1 = the whole planet), km per pixel at the centre, polities in view (-1: loading) */
  zoom: number; kmPx: number; polities: number;
};
export type Anchors = {
  stop: number;
  area: Box;
  ship: [number, number] | null;
  labels: Box[];
  project: (at: LonLat) => [number, number] | null;
  unitBox: (family: string) => Box | null;
  lineBox: (id: string) => Box | null;
};
export type EngineOpts = {
  lang: 'en' | 'es';
  reduced: boolean;
  mode: Mode;
  seaNames: { atlantic: string; south: string; pacific: string };
  lines: Record<string, { name: string; west: string; east: string }>;
  approxText: string;
  layers: Layers;
  /** the tooltip line under a polity's name */
  polityText: (from: string, to: string) => string;
  onFrame: (f: FrameInfo) => void;
  onHover: (h: HitInfo | null) => void;
  onAnchors?: (a: Anchors) => void;
  onReady: () => void;
  onError: () => void;
};
export type Engine = {
  total: number;
  starts: number[];
  durs: number[];
  play(): void; pause(): void; isPlaying(): boolean;
  seek(s: number): void;
  seekStop(i: number): void;
  seekLandfall(k: number): void;
  setFocus(f: Focus | null): void;
  setInset(i: Inset): void;
  setReduced(r: boolean): void;
  setVisible(v: boolean): void;
  setMode(m: Mode): void;
  setOverview(o: boolean): void;
  setLayers(l: Layers): void;
  zoomTo(k: number): void;
  zoomBy(f: number): void;
  recentre(): void;
  pick(x: number, y: number): HitInfo | null;
  resize(): void;
  destroy(): void;
};

/* ---------- the engine ---------- */

export function createAtlasGlobe(canvas: HTMLCanvasElement, chron: Chronicle, opts: EngineOpts): Engine {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d') as CanvasRenderingContext2D;
  const fogC = document.createElement('canvas');
  const fctx = fogC.getContext('2d') as CanvasRenderingContext2D;

  let reduced = opts.reduced;
  let mode: Mode = opts.mode;
  let layers: Layers = opts.layers;
  const fmtDay = new Intl.DateTimeFormat(opts.lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const fmtMonth = new Intl.DateTimeFormat(opts.lang, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const yearText = (y: number) => (y < 0 ? `${-y} ${opts.lang === 'es' ? 'a. C.' : 'BCE'}` : String(y));
  const dateLabel = (iso?: string) => {
    const d = dayOf(iso);
    if (d === undefined || !iso) return undefined;
    return (iso.length > 7 ? fmtDay : fmtMonth).format(new Date(d * 864e5));
  };

  /* --- the story --- */
  const voyages = chron.voyages.map(compileVoyage);
  const stops: CStop[] = [];
  let total = 0;
  for (const st of chron.stops) {
    const dur = st.kind === 'voyage' ? voyages[st.voyage as number].dur : DWELL[st.kind];
    stops.push({ stop: st, start: total, dur });
    total += dur;
  }
  const eraYears = chron.eras.map((e) => yearOfDay(dayOf(e.date) as number));
  const knownUnits: string[][] = [];
  {
    const acc = new Set<string>();
    chron.eras.forEach((e) => {
      for (const u of e.units) if (chron.families[u.f]?.kind !== 'native') acc.add(u.id);
      knownUnits.push([...acc]);
    });
  }

  /* --- data --- */
  let land: Feature | null = null;
  let land50: Feature | null = null;
  let landCoarse: Feature | null = null;
  let oldWorld: Feature | null = null;
  let oldCoarse: Feature | null = null;
  let iberia: Feature | null = null;
  let countries = new Map<string, Feature>();
  let borders: MultiLineString | null = null;
  const units = new Map<string, Feature>();
  const unitsCoarse = new Map<string, Feature>();
  const lines = new Map<string, Feature>();
  let loaded = false;

  /* --- the world's polities over time (Cliopatria, tools/build-atlas-polities.py):
     fetched by period, decoded once per row, shown as the rows in force at the
     last snapshot at or before the year --- */
  type PRow = { n: string; f: number; t: number; a: number; w: string | null; k: string | number; l: LonLat; g: number[][]; feat?: Feature };
  type PChunk = { from: number; to: number; file: string };
  let pIndex: { q: number; chunks: PChunk[] } | null = null;
  const pChunks = new Map<string, { years: number[]; rows: PRow[] }>();
  const pAsked = new Set<string>();
  const pActive = new Map<string, PRow[]>();
  let lastPolities = -1;
  let shownRows: PRow[] = [];
  fetch('/data/atlas-polities/index.json').then((r) => (r.ok ? r.json() : null)).then((x) => { pIndex = x; kick(); }).catch(() => {});
  function chunkOf(y: number): PChunk | null {
    if (!pIndex) return null;
    const cs = pIndex.chunks;
    return cs.find((c) => y >= c.from && y <= c.to) ?? (y < cs[0].from ? cs[0] : cs[cs.length - 1]);
  }
  function askChunk(c: PChunk | null | undefined) {
    if (!c || pAsked.has(c.file)) return;
    pAsked.add(c.file);
    fetch(`/data/atlas-polities/${c.file}`).then((r) => (r.ok ? r.json() : null)).then((x) => { if (x) { pChunks.set(c.file, { years: x.years, rows: x.polities }); kick(); } }).catch(() => {});
  }
  function rowFeature(r: PRow): Feature {
    if (r.feat) return r.feat;
    const q = pIndex?.q ?? 100;
    const polys = r.g.map((enc) => {
      const ring: Position[] = [];
      let x = 0, y = 0;
      for (let i = 0; i < enc.length; i += 2) { x += enc[i]; y += enc[i + 1]; ring.push([x / q, y / q]); }
      ring.push(ring[0]);
      return [ring];
    });
    r.feat = rewindOne({ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } });
    return r.feat;
  }
  function politiesAt(y: number): { key: string; rows: PRow[] } | null {
    const c = chunkOf(Math.floor(y));
    if (!c) return null;
    askChunk(c);
    // the next period too, before the story gets there
    if (pIndex) askChunk(pIndex.chunks[pIndex.chunks.indexOf(c) + 1]);
    const ch = pChunks.get(c.file);
    if (!ch) return null;
    let snap = ch.years[0];
    for (const yy of ch.years) if (yy <= y + 1e-6) snap = yy;
    const key = `${c.file}:${snap}`;
    let rows = pActive.get(key);
    if (!rows) { rows = ch.rows.filter((r) => r.f <= snap && snap <= r.t); pActive.set(key, rows); }
    return { key, rows };
  }
  const polityFill = (k: string | number): RGB => (k === 'es' ? MAP.es : k === 'es2' ? MAP.es2 : k === 'pt' ? MAP.pt : MAP.polity[Number(k) % MAP.polity.length]);
  let hatch: CanvasPattern | null = null;
  function makeHatch() {
    const g = document.createElement('canvas');
    g.width = g.height = 8;
    const gc = g.getContext('2d') as CanvasRenderingContext2D;
    gc.strokeStyle = 'rgba(249,243,221,0.08)'; gc.lineWidth = 1;
    gc.beginPath(); gc.moveTo(0, 8); gc.lineTo(8, 0); gc.stroke();
    hatch = ctx.createPattern(g, 'repeat');
  }
  // the records, for the events layer: a pin at the first place each names
  const eventStops = chron.stops.map((st, i) => ({ st, i })).filter(({ st }) => st.kind === 'record' && !!st.record && st.record.anchors.length > 0);

  /* --- camera --- */
  type Cam = { lon: number; lat: number; R: number };
  let cam: Cam | null = null;
  let W = 0, H = 0, dpr = 1;
  let inset: Inset = { l: 0, r: 0, t: 0, b: 0 };
  const avail = () => {
    const w = Math.max(80, W - inset.l - inset.r), h = Math.max(80, H - inset.t - inset.b);
    return { x: inset.l, y: inset.t, w, h, cx: inset.l + w / 2, cy: inset.t + h / 2 };
  };
  // the whole planet in view, and how far in the camera may go
  const R0 = () => { const a = avail(); return mode === 'globe' ? Math.min(a.w, a.h) * 0.46 : Math.min(a.w / 5.6, a.h / 2.75); };
  const Rmax = () => R0() * 16;
  // the story keeps the planet in view: close enough to read the place, far
  // enough to see the curve of the Earth (the reader can zoom further)
  const RforSpan = (span: number, most = 1.35) => {
    const a = avail();
    const m = Math.min(a.w, a.h) * 0.4;
    const th = clamp(span * 1.2, 2.5, 85) * RAD;
    return clamp(mode === 'globe' ? m / Math.sin(th) : m / th, R0(), R0() * most);
  };

  let flight: { from: Cam; to?: Cam; t0: number; dur: number; dip: number } | null = null;
  let free = false;                  // the reader has the camera
  let overview = true;               // the welcome: the whole planet
  let overviewAt = 0;
  let flyNext = false;
  let vel = { lon: 0, lat: 0 };      // inertia after a drag
  let lastTarget: Cam | null = null;

  function projectionFor(c: Cam, fast = false): GeoProjection {
    const a = avail();
    if (mode === 'globe') {
      return geoOrthographic().rotate([-c.lon, -c.lat]).scale(c.R).translate([a.cx, a.cy]).clipAngle(90).precision(fast ? 0 : 0.5);
    }
    const p = geoEqualEarth().rotate([-c.lon, 0]).scale(c.R).translate([0, 0]).precision(fast ? 0.9 : 0.5);
    const q = p([c.lon, c.lat]) as [number, number];
    return p.translate([a.cx - q[0], a.cy - q[1]]);
  }

  /* --- the state of the story at a time --- */
  type State = {
    si: number; cs: CStop; tau: number;
    vi: number; vd: number; landfall: number; atStop: boolean;
    day: number; year: number; era: number; preEra: boolean; fog: number;
  };
  function stateAt(s: number): State {
    let si = 0;
    for (let i = 0; i < stops.length; i++) if (stops[i].start <= s) si = i;
    const cs = stops[si];
    const tau = clamp(s - cs.start, 0, cs.dur);
    let vi = -1, vd = 0, landfall = 0, atStop = false;
    let day = dayOf(cs.stop.date) ?? 0;
    let year = cs.stop.year;
    if (cs.stop.kind === 'voyage') {
      vi = cs.stop.voyage as number;
      const r = voyageAt(voyages[vi], tau);
      vd = r.d; landfall = r.stop; atStop = r.atStop; day = r.day;
      year = yearOfDay(day);
    } else if (cs.stop.kind === 'era') year = eraYears[cs.stop.era as number];
    let era = 0;
    for (let i = 0; i < eraYears.length; i++) if (eraYears[i] <= year + 1e-6) era = i;
    const preEra = year < eraYears[0] - 1e-6;
    const fog = !layers.fog ? 0 : cs.stop.kind === 'today' ? (reduced ? 0 : 1 - smooth(tau / 3)) : 1;
    return { si, cs, tau, vi, vd, landfall, atStop, day, year, era, preEra, fog };
  }

  function targetCam(st: State, now: number): Cam {
    // before the story starts: the whole planet, turning slowly
    if (overview) return { lon: normLon(-20 + (reduced ? 0 : (now - overviewAt) / 1000 * 4)), lat: 22, R: R0() };
    const b = st.cs.stop;
    if (st.vi >= 0) {
      const cv = voyages[st.vi];
      const ship = pointAt(cv, st.vd);
      const w = clamp(cv.length * 0.22, 0.05, 0.7);
      const pts: LonLat[] = [ship];
      for (let i = 0; i < cv.pts.length; i += 2) if (Math.abs(cv.cum[i] - st.vd) <= w) pts.push(cv.pts[i]);
      const cap = capOf(pts);
      const min = cv.v.kind === 'land' ? 4 : cv.v.kind === 'river' ? 9 : 16;
      return { lon: cap.at[0], lat: clamp(cap.at[1], -60, 65), R: RforSpan(Math.max(min, cap.span), cv.v.kind === 'sea' ? 1.7 : 3) };
    }
    if (b.focus) return { lon: b.focus.at[0], lat: clamp(b.focus.at[1], -65, 70), R: RforSpan(Math.max(5, b.focus.span)) };
    if (b.box) {
      const cap = capOf(boxPoints(b.box));
      return { lon: cap.at[0], lat: clamp(cap.at[1], -60, 65), R: RforSpan(Math.max(8, cap.span * 0.82), 1.5) };
    }
    // a record with no place: stay where the story was
    return lastTarget ?? { lon: -20, lat: 25, R: R0() };
  }

  /* --- clock --- */
  let s = 0;
  let playing = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let dirty = true;
  let lastKey = '';
  let drawCost = 0;
  let skip = 0;
  let lastEra = -1;
  let lastStop = -1;
  let eraFadeAt = -1e9;
  let prevEra = -1;
  let pulseAt = -1e9;
  let hits: HitInfo[] = [];
  let hoverKey = '';
  let focus: Focus | null = null;
  let shapeHits: { path: Path2D; stroke: boolean; hit: Omit<HitInfo, 'x' | 'y'> }[] = [];
  let dragging = false;
  let settleAt = 0;

  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (playing && visible) {
      s = Math.min(total, s + dt);
      if (s >= total) { playing = false; dirty = true; }
    }
    if (loaded && W > 0) {
      const st = stateAt(s);
      const tgt = targetCam(st, now);
      lastTarget = tgt;
      let moving = false;
      if (st.si !== lastStop || flyNext) {
        // a new stop: the camera is the story's again, and flies there
        if ((lastStop >= 0 || flyNext) && cam && !reduced && !overview) {
          const far = geoDistance([cam.lon, cam.lat], [tgt.lon, tgt.lat]) * DEG;
          const dip = clamp(far / 70, 0, 1) * 0.9 + Math.abs(Math.log(tgt.R / cam.R)) * 0.05;
          flight = { from: { ...cam }, t0: now, dur: 900 + clamp(far / 120, 0, 1) * 900, dip };
        }
        free = false; vel = { lon: 0, lat: 0 };
        lastStop = st.si; flyNext = false;
        // the polities of the stops either side, before the reader gets there
        if (layers.polities) for (const j of [st.si - 1, st.si + 1, st.si + 2]) { const sj = stops[j]?.stop; if (sj) askChunk(chunkOf(Math.floor(sj.year))); }
      }
      if (!cam || (reduced && !free)) {
        cam = { ...tgt };
      } else if (free) {
        // the reader's camera: inertia after a flick
        if (!dragging && (Math.abs(vel.lon) > 0.002 || Math.abs(vel.lat) > 0.002) && !reduced) {
          cam = { ...cam, lon: normLon(cam.lon + vel.lon * dt * 60), lat: clamp(cam.lat + vel.lat * dt * 60, -80, 80) };
          const k = Math.pow(0.92, dt * 60);
          vel = { lon: vel.lon * k, lat: vel.lat * k };
          moving = true;
        }
        if (flight) {
          const e = easeInOut((now - flight.t0) / flight.dur);
          const to = flight.to;
          if (to) {
            cam = { lon: flight.from.lon + angleDiff(flight.from.lon, to.lon) * e, lat: flight.from.lat + (to.lat - flight.from.lat) * e, R: Math.exp(Math.log(flight.from.R) + (Math.log(to.R) - Math.log(flight.from.R)) * e) };
            moving = true;
            if (e >= 1) flight = null;
          }
        }
      } else if (flight) {
        const u = (now - flight.t0) / flight.dur;
        const e = easeInOut(u);
        const c = geoInterpolate([flight.from.lon, flight.from.lat], [tgt.lon, tgt.lat])(e);
        const lr = Math.log(flight.from.R) + (Math.log(tgt.R) - Math.log(flight.from.R)) * e - flight.dip * Math.sin(Math.PI * e);
        cam = { lon: c[0], lat: c[1], R: clamp(Math.exp(lr), R0() * 0.85, Rmax()) };
        moving = true;
        if (u >= 1) flight = null;
      } else {
        const f = 1 - Math.exp(-dt * 2.6);
        const lk = Math.log(cam.R), tk = Math.log(tgt.R);
        const nc: Cam = { lon: normLon(cam.lon + angleDiff(cam.lon, tgt.lon) * f), lat: cam.lat + (tgt.lat - cam.lat) * f, R: Math.exp(lk + (tk - lk) * f) };
        moving = Math.abs(tk - lk) > 1e-3 || Math.abs(angleDiff(cam.lon, tgt.lon)) > 0.03 || Math.abs(tgt.lat - cam.lat) > 0.03;
        cam = nc;
      }
      if (st.era !== lastEra) {
        if (lastEra >= 0 && !reduced) { prevEra = lastEra; eraFadeAt = now; pulseAt = now; }
        lastEra = st.era;
      }
      if (moving || dragging) settleAt = now;
      const settling = now - settleAt < 260;   // one fine frame after the camera stops
      const fading = now - eraFadeAt < 1000 || now - pulseAt < 2800;
      const key = `${st.si}|${st.era}|${st.preEra}|${Math.round(st.fog * 80)}|${mode}`;
      const atSea = st.vi >= 0 && playing;
      skip = drawCost > 40 ? (skip + 1) % 3 : drawCost > 24 ? (skip + 1) % 2 : 0;
      if ((dirty || moving || fading || atSea || settling || key !== lastKey) && (skip === 0 || dirty)) {
        const t0 = performance.now();
        draw(st, now, moving || dragging || atSea);
        drawCost = drawCost * 0.8 + (performance.now() - t0) * 0.2;
        dirty = false;
        lastKey = key;
      }
      opts.onFrame({
        s, stop: st.si, tau: st.tau, landfall: st.landfall, atStop: st.atStop, day: st.day, year: st.year,
        playing, voyageDay: st.vi >= 0 && !st.atStop, free,
        zoom: cam ? cam.R / R0() : 1, kmPx: cam ? 6371 / cam.R : 0, polities: lastPolities,
      });
      if (playing || moving || fading || settling || flight || dragging || (overview && !reduced)) schedule();
    } else if (playing) schedule();
  }
  const schedule = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
  const kick = () => { dirty = true; last = 0; schedule(); };

  /* --- drawing --- */
  let fontSerif = 'Georgia, serif';
  let fontMono = 'ui-monospace, monospace';
  let fontBody = 'system-ui, sans-serif';
  let grain: CanvasPattern | null = null;
  function readFonts() {
    const cs = getComputedStyle(document.documentElement);
    const d = cs.getPropertyValue('--font-display').trim();
    const m = cs.getPropertyValue('--font-mono').trim();
    if (d) fontSerif = `${d}, Georgia, serif`;
    if (m) fontMono = `${m}, ui-monospace, monospace`;
    const bd = cs.getPropertyValue('--font-body').trim();
    if (bd) fontBody = `${bd}, system-ui, sans-serif`;
  }
  function makeGrain() {
    const g = document.createElement('canvas');
    g.width = g.height = 128;
    const gc = g.getContext('2d') as CanvasRenderingContext2D;
    const img = gc.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random();
      const c = v > 0.5 ? C.leather : C.burgundyDark;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2];
      img.data[i + 3] = Math.round(Math.abs(v - 0.5) * 70);
    }
    gc.putImageData(img, 0, 0);
    grain = fctx.createPattern(g, 'repeat');
  }

  const famOf = (u: { f: string }) => chron.families[u.f];
  function unitFill(f: { kind: string; tone: number }): RGB {
    switch (f.kind) {
      case 'es': return C.es[f.tone % C.es.length];
      case 'pt': return C.pt[f.tone % C.pt.length];
      case 'pt-indep': return mix(BRAND.leather, BRAND.paperDeep, 0.35);
      case 'indep': return C.indep;
      case 'native': return C.native;
      case 'claim': return C.es[3];
      default: return C.other;
    }
  }
  type GeoObj = Parameters<ReturnType<typeof geoPath>>[0];
  const fc = (fs: (Feature | undefined)[]): GeoObj => ({ type: 'FeatureCollection', features: fs.filter((f): f is Feature => !!f) });

  function draw(st: State, now: number, fast: boolean) {
    const c = cam as Cam;
    const globe = mode === 'globe';
    const proj = projectionFor(c, fast);
    const a = avail();
    const live = new Map<string, Path2D>();
    const G = (key: string, obj: () => GeoObj): Path2D => {
      let p = live.get(key);
      if (!p) { p = new Path2D(); geoPath(proj, p as unknown as CanvasRenderingContext2D)(obj()); live.set(key, p); }
      return p;
    };
    const ppd = c.R * RAD;     // pixels per degree at the centre
    // while the camera moves, the keyframes' shapes with a third of their points
    const UM = fast && unitsCoarse.size ? unitsCoarse : units;
    const era: Era = chron.eras[st.era];
    const today = st.cs.stop.kind === 'today';
    const centre: LonLat = [c.lon, c.lat];
    const pt = (at: LonLat) => (globe && geoDistance(at, centre) > Math.PI / 2 - 0.03 ? null : proj(at));
    const zoomed = c.R > R0() * 2.6;
    if (zoomed) loadFine();
    const coastFeat = !fast && zoomed && land50 ? land50 : globe && fast ? (landCoarse ?? land) : land;
    const coast = coastFeat ? G('coast', () => coastFeat as Feature) : null;
    const sphere = G('sphere', () => ({ type: 'Sphere' }));
    const grat = G('grat', () => geoGraticule().step([15, 15]).precision(fast ? 5 : 2.5)());
    const gx = a.cx, gy = a.cy;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // space, and the planet's halo
    ctx.fillStyle = css(MAP.space);
    ctx.fillRect(0, 0, W, H);
    if (globe) {
      const halo = ctx.createRadialGradient(gx, gy, c.R * 0.97, gx, gy, c.R * 1.16);
      halo.addColorStop(0, css(MAP.halo, 0.32)); halo.addColorStop(0.4, css(MAP.halo, 0.08)); halo.addColorStop(1, css(MAP.halo, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(gx, gy, c.R * 1.16, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = css(MAP.sea); ctx.fill(sphere);
    ctx.lineWidth = 0.5; ctx.strokeStyle = css(C.paper, 0.07); ctx.stroke(grat);
    if (coast) {
      ctx.fillStyle = css(MAP.land); ctx.fill(coast);
      // land no dataset maps: hatched, so "not mapped" reads as such
      if (layers.recorded) { if (!hatch) makeHatch(); if (hatch) { ctx.fillStyle = hatch; ctx.fill(coast); } }
    }
    // the world's polities, each in its own hue (Cliopatria)
    shownRows = [];
    if (layers.polities) {
      const pa = politiesAt(st.year);
      lastPolities = pa ? pa.rows.length : -1;
      if (pa) {
        const minA = fast ? 2500 : 0;
        const rows = pa.rows.filter((r) => r.a >= minA);
        shownRows = pa.rows;
        const byKey = new Map<string, PRow[]>();
        for (const r of rows) { const k = String(r.k); byKey.set(k, [...(byKey.get(k) ?? []), r]); }
        ctx.globalAlpha = 0.92;
        for (const [k, rs] of byKey) {
          ctx.fillStyle = css(polityFill(k === 'es' || k === 'es2' || k === 'pt' ? k : Number(k)));
          ctx.fill(G(`pol:${pa.key}:${k}:${minA}`, () => fc(rs.map(rowFeature))));
        }
        ctx.globalAlpha = 1;
        ctx.lineWidth = 0.6; ctx.strokeStyle = css(MAP.space, 0.55);
        ctx.stroke(G(`pol:${pa.key}:edges:${minA}`, () => fc(rows.map(rowFeature))));
      }
    } else lastPolities = -1;

    // jurisdictions: the keyframe in force, cross-fading from the one before
    const drawEra = (ei: number, alpha: number) => {
      const e = chron.eras[ei];
      const tag = `era:${ei}`;
      const shown = e.units.filter((u) => famOf(u) && UM.get(u.id));
      const byColour = new Map<string, typeof shown>();
      for (const u of shown) { const k = css(unitFill(famOf(u))); byColour.set(k, [...(byColour.get(k) ?? []), u]); }
      ctx.globalAlpha = alpha;
      for (const [colour, us] of byColour) { ctx.fillStyle = colour; ctx.fill(G(`${tag}:${colour}`, () => fc(us.map((u) => UM.get(u.id))))); }
      const claims = shown.filter((u) => famOf(u).kind === 'claim');
      if (claims.length) {
        const cp = G(`${tag}:claims`, () => fc(claims.map((u) => UM.get(u.id))));
        ctx.save(); ctx.clip(cp);
        const h = new Path2D();
        for (let x = -H; x < W; x += 7) { h.moveTo(x, H); h.lineTo(x + H, 0); }
        ctx.strokeStyle = css(C.paper, 0.25); ctx.lineWidth = 0.8; ctx.stroke(h);
        ctx.restore();
      }
      const solid = shown.filter((u) => famOf(u).kind !== 'native');
      const native = shown.filter((u) => famOf(u).kind === 'native');
      ctx.lineWidth = 0.7; ctx.strokeStyle = css(C.paper, 0.5);
      if (solid.length) ctx.stroke(G(`${tag}:edge`, () => fc(solid.map((u) => UM.get(u.id)))));
      if (native.length) { ctx.setLineDash([2, 3]); ctx.stroke(G(`${tag}:native`, () => fc(native.map((u) => UM.get(u.id))))); ctx.setLineDash([]); }
      ctx.globalAlpha = 1;
    };
    if (!layers.iberian) { /* the Iberian keyframes are off */ } else if (today) {
      ctx.fillStyle = css(C.pt[1]);
      ctx.fill(G('today:sub', () => fc(chron.iberophone.submersa.map((id) => countries.get(id)))));
      ctx.fillStyle = css(C.es[1]);
      ctx.fill(G('today:em', () => fc(chron.iberophone.emersa.map((id) => countries.get(id)))));
      if (borders) { ctx.lineWidth = 0.6; ctx.strokeStyle = css(C.paper, 0.45); ctx.stroke(G('borders', () => borders as MultiLineString)); }
    } else if (!st.preEra) {
      const ef = reduced ? 1 : smooth((now - eraFadeAt) / 900);
      if (ef < 1 && prevEra >= 0 && prevEra !== st.era) drawEra(prevEra, 1 - ef);
      drawEra(st.era, ef);
      if (st.cs.stop.kind === 'era') {
        const p2 = (now - pulseAt) / 1000;
        const al = reduced ? 0.8 : p2 < 2.6 ? Math.max(0.4, (1 - p2 / 2.6) * (0.55 + 0.45 * Math.sin(p2 * 7))) : 0.4;
        ctx.lineWidth = 2.2; ctx.strokeStyle = css(C.paper, al);
        ctx.stroke(G(`era:${st.era}:pulse`, () => fc(era.units.filter((u) => era.pulse.includes(u.f)).map((u) => UM.get(u.id)))));
      }
    }
    shapeHits = [];
    if (layers.iberian && !today && !st.preEra) {
      const listed = new Set(era.pulse);
      if (focus?.kind === 'unit') listed.add(focus.f);
      for (const fid of listed) {
        const us = era.units.filter((u) => u.f === fid && UM.get(u.id));
        if (!us.length || !chron.families[fid]) continue;
        const path = G(`era:${st.era}:fam:${fid}`, () => fc(us.map((u) => UM.get(u.id))));
        shapeHits.push({ path, stroke: false, hit: { title: era.names[fid] ?? chron.families[fid].name, focus: { kind: 'unit', f: fid } } });
        if (focus?.kind === 'unit' && focus.f === fid) {
          ctx.fillStyle = css(C.paper, 0.16); ctx.fill(path);
          ctx.lineWidth = 2.4; ctx.strokeStyle = css(C.paper, 0.95); ctx.stroke(path);
        }
      }
    }
    if (coast) { ctx.lineWidth = 0.6; ctx.strokeStyle = css(C.paperDeep, 0.35); ctx.stroke(coast); }

    // routes: the voyages already sailed, then the one at sea
    const sailed: { cv: CVoyage; vi: number; d: number; current: boolean }[] = [];
    for (let i = 0; i <= st.si; i++) {
      const b = stops[i].stop;
      if (b.kind !== 'voyage') continue;
      const vi = b.voyage as number;
      sailed.push({ cv: voyages[vi], vi, d: i === st.si ? st.vd : voyages[vi].length, current: i === st.si });
    }
    const routePath = (r: { cv: CVoyage; vi: number; d: number; current: boolean }): Path2D =>
      r.current ? G(`at-sea:${r.vi}`, () => ({ type: 'LineString', coordinates: sliceTo(r.cv, r.d) })) : G(`route:${r.vi}`, () => ({ type: 'LineString', coordinates: r.cv.pts }));
    for (const r of sailed) {
      if (r.current || !layers.routes) continue;
      ctx.lineWidth = 1; ctx.setLineDash(r.cv.v.kind === 'land' ? [1.5, 3] : [4, 4]);
      ctx.strokeStyle = css(r.cv.v.crown === 'pt' ? C.leatherLight : C.paper, 0.32); ctx.stroke(routePath(r));
      ctx.setLineDash([]);
    }

    /* the fog: a low-resolution mask of what is recorded, scaled up (soft edges) */
    if (st.fog > 0.001) {
      const f = 0.25;
      const mw = Math.ceil(W * f), mh = Math.ceil(H * f);
      if (mask.width !== mw || mask.height !== mh) { mask.width = mw; mask.height = mh; }
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mw, mh);
      mctx.setTransform(f, 0, 0, f, 0, 0);
      mctx.fillStyle = '#fff'; mctx.strokeStyle = '#fff';
      mctx.lineJoin = 'round'; mctx.lineCap = 'round';
      if (oldWorld) {
        const ow = G('old', () => ((globe && fast ? oldCoarse : null) ?? oldWorld) as Feature);
        mctx.globalAlpha = 0.42; mctx.fill(ow);
        mctx.lineWidth = ppd * 2.2; mctx.stroke(ow);
      }
      mctx.globalAlpha = 1;
      if (iberia) { const ib = G('iberia', () => iberia as Feature); mctx.fill(ib); mctx.lineWidth = ppd * 4; mctx.stroke(ib); }
      // after the voyages, the dark thins over the centuries as the world's coasts reach the record
      const charted = clamp((st.year - 1570) / 180, 0, 0.82);
      if (charted > 0) { mctx.globalAlpha = charted; mctx.fill(sphere); mctx.globalAlpha = 1; }
      if (!st.preEra) mctx.fill(G(`known:${st.era}`, () => fc(knownUnits[st.era].map((id) => UM.get(id)))));
      for (const r of sailed) {
        const kind = r.cv.v.kind;
        mctx.lineWidth = Math.min(ppd * (kind === 'land' ? 1.2 : kind === 'river' ? 1.7 : 3.3), kind === 'sea' ? 18 : 12);
        mctx.stroke(routePath(r));
      }
      for (const r of sailed) {
        const kind = r.cv.v.kind;
        for (const lf of r.cv.stops) {
          if (lf.d > r.d + 1e-9) break;
          const p = pt(lf.wp.at);
          if (!p) continue;
          const grow = r.current && !reduced ? smooth((st.tau - lf.arrive) / 1.4) : 1;
          const rad = (lf.wp.reveal ?? (kind === 'sea' ? 1.8 : 1.2)) * Math.max(0.05, grow) * ppd;
          mctx.beginPath(); mctx.arc(p[0], p[1], rad, 0, Math.PI * 2); mctx.fill();
        }
      }
      const fw = Math.ceil(W / 2), fh = Math.ceil(H / 2);
      if (fogC.width !== fw || fogC.height !== fh) { fogC.width = fw; fogC.height = fh; grain = null; }
      if (!grain) makeGrain();
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.globalCompositeOperation = 'source-over';
      fctx.globalAlpha = 1;
      fctx.clearRect(0, 0, fw, fh);
      fctx.fillStyle = css(C.fog); fctx.fillRect(0, 0, fw, fh);
      if (grain) { fctx.fillStyle = grain; fctx.fillRect(0, 0, fw, fh); }
      fctx.globalCompositeOperation = 'destination-out';
      fctx.imageSmoothingEnabled = true;
      fctx.drawImage(mask, 0, 0, fw, fh);
      fctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.clip(sphere);
      ctx.globalAlpha = st.fog;
      ctx.drawImage(fogC, 0, 0, W, H);
      ctx.restore();
    }

    // the grid runs on into the dark, faintly; the sphere is shaded and lit
    ctx.lineWidth = 0.5; ctx.strokeStyle = css(C.paper, 0.04); ctx.stroke(grat);
    if (globe) {
      ctx.save();
      ctx.clip(sphere);
      const lx = gx - c.R * 0.38, ly = gy - c.R * 0.42;
      const shade = ctx.createRadialGradient(lx, ly, c.R * 0.05, gx, gy, c.R * 1.02);
      shade.addColorStop(0, css(C.paper, 0.09));
      shade.addColorStop(0.5, css(C.paper, 0));
      shade.addColorStop(0.82, css(MAP.space, 0.14));
      shade.addColorStop(1, css(MAP.space, 0.55));
      ctx.fillStyle = shade;
      ctx.fillRect(gx - c.R * 1.1, gy - c.R * 1.1, c.R * 2.2, c.R * 2.2);
      ctx.restore();
      ctx.lineWidth = 1.2; ctx.strokeStyle = css(MAP.halo, 0.45); ctx.stroke(sphere);
    }

    // treaty lines, drawn across the unknown as well: they divided what no one had seen
    if (layers.iberian && !today && !st.preEra) {
      for (const id of era.lines) {
        const g = lines.get(id);
        if (!g) continue;
        const on = focus?.kind === 'line' && focus.id === id;
        const path = G(`line:${id}`, () => g);
        if (on) { ctx.lineWidth = 7; ctx.strokeStyle = css(C.paper, 0.14); ctx.stroke(path); }
        ctx.setLineDash([6, 5]); ctx.lineWidth = on ? 2.2 : 1.3; ctx.strokeStyle = css(C.paper, on ? 1 : 0.75);
        ctx.stroke(path); ctx.setLineDash([]);
        shapeHits.unshift({ path, stroke: true, hit: { title: opts.lines[id]?.name ?? id, focus: { kind: 'line', id } } });
      }
    }
    const cur = sailed.find((r) => r.current);
    if (cur && layers.routes) {
      const rp = routePath(cur);
      const lineStyle = cur.cv.v.crown === 'pt' ? C.leatherLight : C.paper;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.setLineDash(cur.cv.v.kind === 'land' ? [2, 3] : []);
      ctx.lineWidth = 6; ctx.strokeStyle = css(C.leather, 0.35); ctx.stroke(rp);
      ctx.lineWidth = 1.8; ctx.strokeStyle = css(lineStyle, 0.95); ctx.stroke(rp);
      ctx.setLineDash([]);
    }

    hits = [];
    const placed: [number, number, number, number][] = [];
    const free_ = (x: number, y: number, w: number, h: number) => {
      if (x < 4 || y < 4 || x + w > W - 4 || y + h > H - 4) return false;
      for (const b of placed) if (x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]) return false;
      placed.push([x, y, w, h]); return true;
    };

    if (layers.iberian && layers.labels && !today && !st.preEra && era.lines.includes('tordesillas')) {
      const p = pt([-48.5, 30]);
      if (p) {
        ctx.save(); ctx.translate(p[0] + 7, p[1]); ctx.rotate(-Math.PI / 2);
        ctx.font = `500 10px ${fontMono}`; ctx.fillStyle = css(C.paper, 0.8); ctx.textAlign = 'center';
        ctx.fillText('TORDESILLAS · 1494', 0, 0); ctx.restore();
        placed.push([p[0] - 2, p[1] - 58, 14, 116]);
      }
      const sides = opts.lines.tordesillas;
      const subject = (st.cs.stop.kind === 'era' && era.pulse.includes('tordesillas')) || (focus?.kind === 'line' && focus.id === 'tordesillas');
      const q = subject ? pt([-48.5, Math.max(-40, 30 - 74 / Math.max(0.5, ppd))]) : null;
      if (sides && q) {
        ctx.font = `500 10.5px ${fontMono}`;
        const west = `← ${sides.west.toUpperCase()}`, east = `${sides.east.toUpperCase()} →`;
        const ww = ctx.measureText(west).width, we = ctx.measureText(east).width;
        ctx.fillStyle = css(C.paper, 0.85);
        ctx.textAlign = 'right';
        if (free_(q[0] - 10 - ww, q[1] - 10, ww, 13)) ctx.fillText(west, q[0] - 10, q[1]);
        ctx.textAlign = 'left';
        if (free_(q[0] + 10, q[1] - 10, we, 13)) ctx.fillText(east, q[0] + 10, q[1]);
        ctx.textAlign = 'center';
      }
    }

    // seas get their names when they are reached
    const seas: { at: LonLat; name: string; from?: number }[] = [
      { at: [-38, 30], name: opts.seaNames.atlantic, from: 1492 },
      { at: [-92, 2], name: opts.seaNames.south, from: 1513.7 },
      { at: [-145, -14], name: opts.seaNames.pacific, from: 1520.9 },
    ];
    ctx.font = `italic 400 ${clamp(ppd * 1.3, 12, 19)}px ${fontSerif}`;
    ctx.textAlign = 'center';
    for (const sea of seas) {
      if (!layers.labels || (sea.from && st.year < sea.from)) continue;
      const p = pt(sea.at);
      if (!p) continue;
      const w = ctx.measureText(sea.name).width;
      if (!free_(p[0] - w / 2, p[1] - 12, w, 16)) continue;
      ctx.fillStyle = css(C.paperDeep, 0.42); ctx.fillText(sea.name, p[0], p[1]);
    }

    // the places the current record names: rings over the fog, never a reveal
    const rec = st.cs.stop.record;
    if (rec && st.cs.stop.kind !== 'voyage' && rec.anchors.length) {
      const pulse = reduced ? 0 : (Math.sin(now / 600) + 1) / 2;
      rec.anchors.forEach((an, k) => {
        const p = pt(an.at);
        if (!p) return;
        const on = focus?.kind === 'place' && focus.k === k;
        ctx.beginPath(); ctx.arc(p[0], p[1], on ? 9 : 6.5, 0, Math.PI * 2);
        ctx.setLineDash([2.5, 2.5]); ctx.lineWidth = on ? 1.8 : 1.3; ctx.strokeStyle = css(C.paper, on ? 1 : 0.88); ctx.stroke(); ctx.setLineDash([]);
        dot(p[0], p[1], 1.8, css(C.paper, 0.95));
        if (k === 0 && !reduced) { ctx.beginPath(); ctx.arc(p[0], p[1], 10 + pulse * 6, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = css(C.paper, 0.18 * (1 - pulse)); ctx.stroke(); }
        hits.push({ x: p[0], y: p[1], title: an.name, text: opts.approxText, focus: { kind: 'place', k } });
      });
      ctx.font = `500 10.5px ${fontMono}`; ctx.textAlign = 'left';
      if (layers.labels) rec.anchors.forEach((an, k) => {
        const p = pt(an.at);
        if (!p) return;
        const label = an.name.toUpperCase();
        const w = ctx.measureText(label).width;
        for (const [dx, dy] of [[10, 4], [-10 - w, 4], [-w / 2, -11], [-w / 2, 18]] as [number, number][]) {
          if (free_(p[0] + dx - 2, p[1] + dy - 10, w + 4, 13)) {
            ctx.fillStyle = css(C.fog, 0.6); ctx.fillRect(p[0] + dx - 3, p[1] + dy - 10, w + 6, 13.5);
            ctx.fillStyle = css(C.paper, k === 0 || (focus?.kind === 'place' && focus.k === k) ? 1 : 0.8); ctx.fillText(label, p[0] + dx, p[1] + dy);
            break;
          }
        }
      });
      ctx.textAlign = 'center';
    }

    // Indigenous states, named through the dark
    if (layers.iberian && layers.labels && !today && !st.preEra) {
      ctx.font = `italic 400 13px ${fontSerif}`;
      for (const u of era.units) {
        const f = famOf(u);
        if (!f || f.kind !== 'native' || !f.at) continue;
        const p = pt(f.at);
        if (!p) continue;
        const w = ctx.measureText(f.name).width;
        if (!free_(p[0] - w / 2, p[1] - 11, w, 14)) continue;
        ctx.fillStyle = css(C.leatherLight, 0.85); ctx.fillText(f.name, p[0], p[1]);
      }
      for (const m of era.marks) {
        const p = pt(m.at);
        if (!p) continue;
        diamond(p[0], p[1], 3.5, css(C.leatherLight, 0.9));
        ctx.font = `italic 400 13px ${fontSerif}`; ctx.textAlign = 'left';
        const w = ctx.measureText(m.name).width;
        if (free_(p[0] + 7, p[1] - 10, w, 14)) { ctx.fillStyle = css(C.leatherLight, 0.9); ctx.fillText(m.name, p[0] + 7, p[1] + 1); }
        ctx.textAlign = 'center';
        hits.push({ x: p[0], y: p[1], title: m.name });
      }
    }

    // the places reached and the ship
    for (const r of sailed) {
      for (const [k, lf] of r.cv.stops.entries()) {
        if (lf.d > r.d + 1e-9) break;
        const p = pt(lf.wp.at);
        if (!p) continue;
        hits.push({ x: p[0], y: p[1], title: lf.wp.name as string, date: dateLabel(lf.wp.date), text: lf.wp.log, focus: r.current ? { kind: 'stop', k } : undefined });
        if (!r.current) dot(p[0], p[1], 1.8, css(C.paper, 0.5));
      }
    }
    if (cur) {
      const reached = cur.cv.stops.filter((lf) => lf.d <= cur.d + 1e-9);
      const named = new Set<string>();
      for (let k = reached.length - 1; k >= 0; k--) {
        const lf = reached[k];
        const p = pt(lf.wp.at);
        if (!p) continue;
        const age = st.tau - lf.arrive;
        if (!reduced && age >= 0 && age < 1.6) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 4 + age * 18, 0, Math.PI * 2);
          ctx.lineWidth = 1.2; ctx.strokeStyle = css(C.paper, 0.7 * (1 - age / 1.6)); ctx.stroke();
        }
        dot(p[0], p[1], k === reached.length - 1 ? 3.2 : 2.4, css(C.paper, 0.95), css(C.burgundyDark));
        const label = (lf.wp.name as string).toUpperCase();
        if (named.has(label)) continue;
        named.add(label);
        ctx.font = `500 10.5px ${fontMono}`; ctx.textAlign = 'left';
        const w = ctx.measureText(label).width;
        // the newest landfall is where the ship is: its name goes clear of the hull
        const spots: [number, number][] = k === reached.length - 1 ? [[20, 14], [-20 - w, 14], [-w / 2, 26]] : [[8, 4], [-8 - w, 4], [-w / 2, -9], [-w / 2, 16]];
        for (const [dx, dy] of spots) {
          if (free_(p[0] + dx - 2, p[1] + dy - 10, w + 4, 13)) {
            ctx.fillStyle = css(C.fog, 0.55); ctx.fillRect(p[0] + dx - 3, p[1] + dy - 10, w + 6, 13.5);
            ctx.fillStyle = css(C.paper, k === reached.length - 1 ? 1 : 0.78); ctx.fillText(label, p[0] + dx, p[1] + dy);
            break;
          }
        }
      }
      if (focus?.kind === 'stop') {
        const lf = cur.cv.stops[focus.k];
        const p = lf && pt(lf.wp.at);
        if (p) {
          const ahead = lf.d > cur.d + 1e-9;
          ctx.beginPath(); ctx.arc(p[0], p[1], 10, 0, Math.PI * 2);
          ctx.setLineDash(ahead ? [3, 3] : []);
          ctx.lineWidth = 1.6; ctx.strokeStyle = css(C.paper, 0.95); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, Math.PI * 2);
          ctx.lineWidth = 5; ctx.strokeStyle = css(C.paper, 0.14); ctx.stroke();
          if (ahead) dot(p[0], p[1], 2.4, css(C.paper, 0.9), css(C.burgundyDark));
        }
      }
      const at = pointAt(cur.cv, cur.d);
      const p = pt(at);
      const ahead = pt(pointAt(cur.cv, Math.min(cur.cv.length, cur.d + 0.02)));
      const behind = pt(pointAt(cur.cv, Math.max(0, cur.d - 0.02)));
      if (p) {
        const dx = ahead && behind ? ahead[0] - behind[0] : 1;
        const bob = reduced ? 0 : Math.sin(now / 420) * 1.1;
        const scale = cur.cv.v.kind === 'river' ? 1.05 : 1.35;
        if (cur.cv.v.kind === 'land') banner(p[0], p[1]);
        else ship(p[0], p[1] + bob, scale, dx < -0.01, cur.cv.v.crown);
      }
    }

    // the keyframe's names
    if (layers.iberian && layers.labels && !today && !st.preEra) {
      ctx.textAlign = 'center';
      for (const fid of era.labels) {
        const f = chron.families[fid];
        if (!f?.at || f.kind === 'native') continue;
        if (!era.units.some((u) => u.f === fid)) continue;
        const p = pt(f.at);
        if (!p) continue;
        const name = era.names[fid] ?? f.name;
        const size = clamp(ppd * 0.95, 10.5, 16);
        ctx.font = `600 ${size}px ${fontSerif}`;
        const w = ctx.measureText(name).width;
        if (!free_(p[0] - w / 2 - 2, p[1] - size, w + 4, size + 4)) continue;
        ctx.lineWidth = 3; ctx.strokeStyle = css(C.burgundyDark, 0.55); ctx.strokeText(name, p[0], p[1]);
        ctx.fillStyle = css(C.paper, 0.95); ctx.fillText(name, p[0], p[1]);
      }
    }
    // the events layer: Beltrán's records in force this year, as round pins
    if (layers.events) {
      const pins: [number, number][] = [];
      const cur = st.cs.stop.kind === 'record' ? st.si : -1;
      for (const { st: es, i } of eventStops) {
        if (i === cur) continue;
        const from = es.year, to = es.until ?? es.year;
        if (st.year < from - 0.01 || st.year > to + 0.99) continue;
        const p = pt((es.record as NonNullable<typeof es.record>).anchors[0].at);
        if (!p || pins.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 13)) continue;
        pins.push([p[0], p[1]]);
        const col = MAP.types[(es.record as NonNullable<typeof es.record>).type] ?? MAP.polity[0];
        ctx.beginPath(); ctx.arc(p[0], p[1], 7.5, 0, Math.PI * 2);
        ctx.fillStyle = css(MAP.space, 0.92); ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = css(col); ctx.stroke();
        ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, Math.PI * 2); ctx.fillStyle = css(col); ctx.fill();
        placed.push([p[0] - 8, p[1] - 8, 16, 16]);
        hits.push({ x: p[0], y: p[1], title: es.title, date: es.label, text: es.kicker, go: i });
      }
    }

    // place names: the polities in view, largest first, where there is room
    if (layers.labels && layers.polities && shownRows.length) {
      const big = [...shownRows].sort((x, y) => y.a - x.a);
      for (const r of big) {
        const rad = Math.sqrt(Math.max(r.a, 1) / Math.PI) / 6371 * c.R;   // its size on screen, roughly
        if (rad < 16) break;
        // near the limb a name would sit on the edge of its land: leave it out
        if (globe && geoDistance(r.l, centre) > 1.15) continue;
        const p = pt(r.l);
        if (!p) continue;
        const size = clamp(rad / 6, 10.5, 15);
        ctx.font = `600 ${size}px ${fontBody}`;
        const name = r.n.length > 28 ? `${r.n.slice(0, 27)}…` : r.n;
        const w = ctx.measureText(name).width;
        if (w > rad * 3.2) continue;
        if (!free_(p[0] - w / 2 - 2, p[1] - size, w + 4, size + 5)) continue;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3; ctx.strokeStyle = css(MAP.space, 0.7); ctx.strokeText(name, p[0], p[1]);
        ctx.fillStyle = css(C.paper, 0.96); ctx.fillText(name, p[0], p[1]);
      }
    }

    if (today) {
      for (const ip of chron.iberophone.points) {
        const p = pt(ip.at);
        if (!p) continue;
        dot(p[0], p[1], 2.6, css(ip.tier === 'emersa' ? C.paper : C.leatherLight, 0.95), css(C.burgundyDark));
        hits.push({ x: p[0], y: p[1], title: ip.name });
      }
    }

    if (opts.onAnchors) {
      const shipAt = cur ? pt(pointAt(cur.cv, cur.d)) : null;
      const clip = (b: [[number, number], [number, number]] | null): Box | null => {
        if (!b || !Number.isFinite(b[0][0])) return null;
        const x0 = Math.max(0, b[0][0]), y0 = Math.max(0, b[0][1]), x1 = Math.min(W, b[1][0]), y1 = Math.min(H, b[1][1]);
        return x1 - x0 < 1 || y1 - y0 < 1 ? null : [x0, y0, x1, y1];
      };
      const off = today || st.preEra;
      const eraNow = st.era;
      const path = geoPath(proj);
      opts.onAnchors({
        stop: st.si,
        area: [a.x, a.y, a.x + a.w, a.y + a.h],
        ship: shipAt ? [shipAt[0], shipAt[1]] : null,
        labels: placed.map(([x, y, w, h]) => [x, y, x + w, y + h] as Box),
        project: (at) => { const p = pt(at); return p ? [p[0], p[1]] : null; },
        unitBox: (fid) => {
          if (off) return null;
          const us = chron.eras[eraNow].units.filter((u) => u.f === fid && units.get(u.id));
          return us.length ? clip(path.bounds(fc(us.map((u) => units.get(u.id))))) : null;
        },
        lineBox: (id) => (off || !chron.eras[eraNow].lines.includes(id) || !lines.get(id) ? null : clip(path.bounds(lines.get(id) as Feature))),
      });
    }

    // a vignette at the edges of the stage
    const vg = ctx.createRadialGradient(a.cx, a.cy, Math.min(W, H) * 0.42, a.cx, a.cy, Math.max(W, H) * 0.8);
    vg.addColorStop(0, css(MAP.space, 0)); vg.addColorStop(1, css(MAP.space, 0.45));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function dot(x: number, y: number, r: number, fill: string, stroke?: string) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function diamond(x: number, y: number, r: number, fill: string) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function ship(x: number, y: number, k: number, flip: boolean, crown: 'es' | 'pt') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -k : k, k);
    const g = ctx.createRadialGradient(0, 2, 0, 0, 2, 22);
    g.addColorStop(0, css(C.paper, 0.35)); g.addColorStop(1, css(C.paper, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 2, 22, 0, Math.PI * 2); ctx.fill();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = css(C.burgundyDark); ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-11, -4); ctx.lineTo(-7, -2); ctx.lineTo(9, -2); ctx.lineTo(12, -4);
    ctx.quadraticCurveTo(10, 3, 5, 4.5); ctx.lineTo(-6, 4.5); ctx.quadraticCurveTo(-10, 3, -11, -4); ctx.closePath();
    ctx.fillStyle = css(C.paperDeep); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(1, -19); ctx.moveTo(7.5, -2); ctx.lineTo(7.5, -13); ctx.moveTo(-6, -3); ctx.lineTo(-6, -14); ctx.stroke();
    ctx.fillStyle = css(C.paper);
    ctx.beginPath(); ctx.moveTo(-4.5, -16.5); ctx.lineTo(6.5, -16.5); ctx.quadraticCurveTo(8.5, -11, 6.8, -5.5); ctx.lineTo(-4.8, -5.5); ctx.quadraticCurveTo(-3, -11, -4.5, -16.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -11.5); ctx.lineTo(10.5, -11.5); ctx.quadraticCurveTo(12, -8, 10.8, -4.5); ctx.lineTo(5.2, -4.5); ctx.quadraticCurveTo(6.2, -8, 5, -11.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-11.5, -4.5); ctx.lineTo(-3, -4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = css(crown === 'pt' ? C.leather : C.burgundy); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(1, -14.5); ctx.lineTo(1, -7.5); ctx.moveTo(-1.8, -11.2); ctx.lineTo(3.8, -11.2); ctx.stroke();
    ctx.fillStyle = css(crown === 'pt' ? C.leather : C.burgundy);
    ctx.beginPath(); ctx.moveTo(1, -19); ctx.lineTo(7, -20.5); ctx.lineTo(1, -22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function banner(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
    g.addColorStop(0, css(C.paper, 0.35)); g.addColorStop(1, css(C.paper, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(C.paper); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -16); ctx.stroke();
    ctx.fillStyle = css(C.paper);
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(10, -13); ctx.lineTo(0, -9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(C.burgundy); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(2, -15); ctx.lineTo(7, -11); ctx.moveTo(7, -14.5); ctx.lineTo(2, -11.5); ctx.stroke();
    ctx.restore();
  }

  /* --- the reader's hands: drag to turn, Ctrl+wheel or pinch to zoom --- */
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  let downAt = { x: 0, y: 0, t: 0 };
  function takeCamera() {
    if (!cam) return;
    free = true; flight = null;
  }
  function onDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (pointers.size === 2) { const [p, q] = [...pointers.values()]; pinch = Math.hypot(p.x - q.x, p.y - q.y); }
  }
  function onMove(e: PointerEvent) {
    const prev = pointers.get(e.pointerId);
    if (!prev || !cam) return;
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (pinch > 0) { takeCamera(); const r = canvas.getBoundingClientRect(); zoomAt((p.x + q.x) / 2 - r.left, (p.y + q.y) / 2 - r.top, clamp(cam.R * (d / pinch), R0() * 0.85, Rmax())); }
      pinch = d;
      kick();
      return;
    }
    if (!dragging && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 4) return;
    if (!dragging) { dragging = true; takeCamera(); try { canvas.setPointerCapture(e.pointerId); } catch { /* gone */ } canvas.style.cursor = 'grabbing'; }
    // degrees per pixel at the centre
    const k = DEG / cam.R;
    const dLon = -dx * k / Math.max(0.35, mode === 'globe' ? 1 : Math.cos(cam.lat * RAD));
    const dLat = dy * k;
    cam = { ...cam, lon: normLon(cam.lon + dLon), lat: clamp(cam.lat + dLat, -80, 80) };
    vel = { lon: dLon * 0.9, lat: dLat * 0.9 };
    kick();
  }
  function onUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (dragging && pointers.size === 0) {
      dragging = false; canvas.style.cursor = '';
      if (performance.now() - downAt.t > 300 && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 30) vel = { lon: 0, lat: 0 };
      kick();
    }
  }
  /** Zoom to a radius, keeping the point under (x, y) where it is. */
  function zoomAt(x: number, y: number, nR: number) {
    if (!cam) return;
    const p = projectionFor(cam);
    const g = p.invert?.([x, y]) as LonLat | undefined;
    const ok = g && Number.isFinite(g[0]) && (mode !== 'globe' || geoDistance(g, [cam.lon, cam.lat]) < Math.PI / 2 - 0.05);
    if (ok) {
      const t = 1 - cam.R / nR;
      const cc = geoInterpolate([cam.lon, cam.lat], g as LonLat)(t);
      cam = { lon: normLon(cc[0]), lat: clamp(cc[1], -80, 80), R: nR };
    } else cam = { ...cam, R: nR };
  }
  function onWheel(e: WheelEvent) {
    // the Atlas is an application: the wheel and the trackpad zoom the planet
    e.preventDefault();
    if (!cam) return;
    takeCamera();
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016) * (e.deltaMode === 1 ? 16 : 1));
    const r = canvas.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, clamp(cam.R * k, R0() * 0.85, Rmax()));
    vel = { lon: 0, lat: 0 };
    kick();
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  /* --- sizing --- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    const coarse = window.matchMedia('(pointer: coarse)').matches || W < 700;
    dpr = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (!free) cam = null;
    flight = null;
    kick();
  }

  /* --- data load --- */
  // the finer coast only matters close in: fetched the first time the camera gets there
  let fineAsked = false;
  function loadFine() {
    if (fineAsked) return;
    fineAsked = true;
    fetch('/data/land-50m.json').then((r) => (r.ok ? r.json() : null)).then((t: Topology | null) => {
      if (!t) return;
      land50 = rewind(feature(t, t.objects.land) as unknown as FeatureCollection) as unknown as Feature;
      kick();
    }).catch(() => {});
  }
  (async () => {
    try {
      const [world, eraTopo] = await Promise.all([
        fetch('/data/world-110m.json').then((r) => r.json()),
        fetch('/data/atlas-eras.topo.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      const wt = world as Topology;
      const cobj = wt.objects.countries as GeometryCollection;
      land = rewind(feature(wt, wt.objects.land) as unknown as FeatureCollection) as unknown as Feature;
      const cfc = feature(wt, cobj) as unknown as FeatureCollection;
      countries = new Map(cfc.features.map((f) => [String(f.id), f]));
      const notOld = new Set(['036', '554', '598', '090', '548', '242', '540', '608', '010', '260', '304']);
      const oldGeoms = cobj.geometries.filter((g) => {
        const id = String(g.id);
        if (notOld.has(id)) return false;
        const f = countries.get(id);
        return f ? geoCentroid(f)[0] > -26 : false;
      });
      oldWorld = { type: 'Feature', properties: {}, geometry: merge(wt, oldGeoms as never) as MultiPolygon };
      iberia = { type: 'Feature', properties: {}, geometry: merge(wt, cobj.geometries.filter((g) => ['724', '620'].includes(String(g.id))) as never) as MultiPolygon };
      const wc = decimate(wt, 2);
      const cc = wc.objects.countries as GeometryCollection;
      landCoarse = rewind(feature(wc, wc.objects.land) as unknown as FeatureCollection) as unknown as Feature;
      oldCoarse = { type: 'Feature', properties: {}, geometry: merge(wc, cc.geometries.filter((g) => oldGeoms.some((o) => o.id === g.id)) as never) as MultiPolygon };
      borders = mesh(wt, cobj, (x, y) => x !== y) as MultiLineString;
      if (eraTopo) {
        const et = eraTopo as Topology;
        for (const f of (feature(et, et.objects.units) as unknown as FeatureCollection<Geometry>).features) units.set(String(f.id), f);
        const ec = decimate(et, 3);
        for (const f of (feature(ec, ec.objects.units) as unknown as FeatureCollection<Geometry>).features) unitsCoarse.set(String(f.id), rewindOne(f));
        for (const f of (feature(et, et.objects.lines) as unknown as FeatureCollection<Geometry>).features) lines.set(String(f.id), f);
      }
      readFonts();
      if (document.fonts) document.fonts.ready.then(() => { readFonts(); kick(); });
      loaded = true;
      resize();
      opts.onReady();
    } catch {
      opts.onError();
    }
  })();

  const flyTo = (to: Cam) => {
    if (!cam) return;
    takeCamera();
    if (reduced) { cam = to; kick(); return; }
    flight = { from: { ...cam }, to, t0: performance.now(), dur: 450, dip: 0 };
    kick();
  };

  return {
    total,
    starts: stops.map((b) => b.start),
    durs: stops.map((b) => b.dur),
    play() {
      if (reduced) return;
      if (s >= total - 0.01) s = 0;
      playing = true; kick();
    },
    pause() { playing = false; kick(); },
    isPlaying: () => playing,
    seek(x: number) { s = clamp(x, 0, total); kick(); },
    seekStop(i: number) {
      const b = stops[clamp(i, 0, stops.length - 1)];
      s = reduced ? b.start + b.dur - 1e-3 : b.start;
      kick();
    },
    seekLandfall(k: number) {
      const cur = stateAt(s);
      if (cur.vi < 0) return;
      const cv = voyages[cur.vi];
      const lf = cv.stops[clamp(k, 0, cv.stops.length - 1)];
      s = cur.cs.start + lf.arrive + 0.02;
      kick();
    },
    setFocus(f: Focus | null) {
      if (focusKey(f) === focusKey(focus)) return;
      focus = f; kick();
    },
    setInset(i: Inset) {
      if (i.l === inset.l && i.r === inset.r && i.t === inset.t && i.b === inset.b) return;
      inset = i; if (!free) cam = null; flight = null; kick();
    },
    setReduced(r: boolean) { reduced = r; if (r) { playing = false; flight = null; vel = { lon: 0, lat: 0 }; } if (!free) cam = null; kick(); },
    setVisible(v: boolean) { visible = v; if (v) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    setMode(m: Mode) {
      if (m === mode) return;
      mode = m;
      if (cam) cam = { ...cam, R: clamp(cam.R, R0() * 0.85, Rmax()) };
      if (!free) cam = null;
      flight = null;
      kick();
    },
    setOverview(o: boolean) {
      if (o === overview) return;
      overview = o; overviewAt = performance.now();
      if (o) { free = false; flight = null; }
      flyNext = !o; kick();
    },
    setLayers(l: Layers) { layers = l; kick(); },
    zoomTo(k: number) { if (cam) flyTo({ ...cam, R: clamp(R0() * k, R0() * 0.85, Rmax()) }); },
    zoomBy(f: number) { if (cam) flyTo({ ...cam, R: clamp(cam.R * f, R0() * 0.85, Rmax()) }); },
    recentre() {
      if (!cam) return;
      free = false; vel = { lon: 0, lat: 0 };
      if (!reduced) flight = { from: { ...cam }, t0: performance.now(), dur: 900, dip: 0.2 };
      else cam = null;
      kick();
    },
    pick(x: number, y: number) {
      if (dragging) return null;
      let best: HitInfo | null = null, bd = 16;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
      if (!best && shapeHits.length) {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = 12;
        for (const sh of shapeHits) {
          const inside = sh.stroke ? ctx.isPointInStroke(sh.path, x * dpr, y * dpr) : ctx.isPointInPath(sh.path, x * dpr, y * dpr);
          if (inside) { best = { x, y, ...sh.hit }; break; }
        }
        ctx.restore();
      }
      // nothing else: the polity under the pointer, as Cliopatria maps it
      if (!best && layers.polities && shownRows.length && cam) {
        const g = projectionFor(cam).invert?.([x, y]) as LonLat | undefined;
        if (g && Number.isFinite(g[0]) && (mode !== 'globe' || geoDistance(g, [cam.lon, cam.lat]) < Math.PI / 2)) {
          const r = shownRows.find((row) => geoContains(rowFeature(row), g));
          if (r) best = { x, y, title: r.n, text: opts.polityText(yearText(r.f), yearText(r.t)) };
        }
      }
      const key = best ? `${best.title}${best.date ?? ''}` : '';
      if (key !== hoverKey) { hoverKey = key; opts.onHover(best); }
      return best;
    },
    resize,
    destroy() {
      if (raf) cancelAnimationFrame(raf); raf = 0; playing = false;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
    },
  };
}
