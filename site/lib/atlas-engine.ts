/* ==========================================================================
   The Atlas engine (issue #71): a dark chart that is discovered.

   One canvas, drawn by d3-geo every frame from three things: the story clock
   (seconds into the chronicle, lib/atlas-chronicle.ts), the camera, and the
   data (Natural Earth land, the OpenHistoricalMap keyframes, the voyages).

   - The dark is what was not on Iberian charts: a fog over the whole chart,
     cut away by a low-resolution mask (soft edges come free from scaling it
     up) where ships have sailed, around the places they reached, over the
     jurisdictions of each keyframe, and dimly over the Old World. Indigenous
     states are named through it.
   - Voyages are dense great-circle polylines; a ship sails them at a steady
     pace, pausing at each dated landfall.
   - The layout changes with the story: an Atlantic chart, a globe for the
     circumnavigation, a Pacific chart for the galleon. Changing layout
     cross-fades; within a layout the camera glides.
   - Reduced motion: the camera cuts, no ship moves, nothing pulses; the page
     only ever asks for a beat's finished state.

   Colours are the brand's (app/globals.css) and tints of them, nothing else.
   ========================================================================== */

import {
  geoEqualEarth, geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance,
  geoCircle, geoCentroid, type GeoProjection,
} from 'd3-geo';
import { feature, merge, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, MultiLineString } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Beat, Chronicle, Era, Layout, LonLat, Voyage, Waypoint } from '@/lib/atlas-chronicle';

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
  fog: mix(BRAND.burgundyDark, BRAND.ink, 0.3),             // the unknown: wine-black
  sea: mix(BRAND.ink, BRAND.leather, 0.27),                   // a charted sea
  land: mix(BRAND.paperDeep, BRAND.leather, 0.5),            // charted land
  other: mix(BRAND.paperDeep, BRAND.ink, 0.55),              // other crowns and states
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
  ink: BRAND.ink,
};

/* ---------- small helpers ---------- */

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180;
function dayOf(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const [y, m = '6', d] = iso.split('-');
  return Date.UTC(+y, +m - 1, d ? +d : 15) / 864e5;
}
const angleDiff = (a: number, b: number) => ((b - a + 540) % 360) - 180;

/* ---------- the compiled story ---------- */

type Stop = { wi: number; d: number; day: number; wp: Waypoint; arrive: number };
type Seg = { t0: number; t1: number; d0: number; d1: number; move: boolean };
type CVoyage = {
  v: Voyage; pts: LonLat[]; cum: number[]; length: number; wpd: number[];
  stops: Stop[]; segs: Seg[]; dur: number;
};
type CBeat = { beat: Beat; start: number; dur: number; day: number; endDay: number };

const PAUSE = 1.05, FIRST = 0.7, LAST = 1.6;
const ERA_BEAT = 6.5, OPEN_BEAT = 3, TODAY_BEAT = 7;

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
  const stops: Stop[] = [];
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
  return { v, pts, cum, length: acc, wpd, stops, segs, dur: t };
}

/** Where a voyage stands `tau` seconds in: distance sailed and last stop reached. */
function voyageAt(cv: CVoyage, tau: number): { d: number; stop: number; atStop: boolean; day: number } {
  let d = 0, stop = 0, atStop = true;
  for (const s of cv.segs) {
    if (tau < s.t0) break;
    const u = clamp((tau - s.t0) / (s.t1 - s.t0), 0, 1);
    // a ship gathers way out of port and shortens sail into the next one
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

/* ---------- public types ---------- */

export type Inset = { l: number; r: number; t: number; b: number };
export type HitInfo = { x: number; y: number; title: string; date?: string; text?: string };
export type FrameInfo = { s: number; beat: number; stop: number; day: number; playing: boolean; voyageDay: boolean };
export type EngineOpts = {
  lang: 'en' | 'es';
  reduced: boolean;
  seaNames: { atlantic: string; south: string; pacific: string };
  onFrame: (f: FrameInfo) => void;
  onHover: (h: HitInfo | null) => void;
  onReady: () => void;
  onError: () => void;
};
export type Engine = {
  total: number;
  starts: number[];
  durs: number[];
  play(): void; pause(): void; isPlaying(): boolean;
  seek(s: number): void;
  seekBeat(i: number): void;
  setInset(i: Inset): void;
  setReduced(r: boolean): void;
  setVisible(v: boolean): void;
  pick(x: number, y: number): HitInfo | null;
  resize(): void;
  destroy(): void;
};

/* ---------- the engine ---------- */

export function createAtlasEngine(canvas: HTMLCanvasElement, chron: Chronicle, opts: EngineOpts): Engine {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d') as CanvasRenderingContext2D;
  const fogC = document.createElement('canvas');
  const fctx = fogC.getContext('2d') as CanvasRenderingContext2D;
  let snap: HTMLCanvasElement | null = null;
  let snapAt = 0;

  let reduced = opts.reduced;
  const fmtDay = new Intl.DateTimeFormat(opts.lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const fmtMonth = new Intl.DateTimeFormat(opts.lang, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const dateLabel = (iso?: string) => {
    const d = dayOf(iso);
    if (d === undefined || !iso) return undefined;
    return (iso.length > 7 ? fmtDay : fmtMonth).format(new Date(d * 864e5));
  };

  /* --- the story --- */
  const voyages = chron.voyages.map(compileVoyage);
  const beats: CBeat[] = [];
  let total = 0;
  for (const b of chron.beats) {
    const dur = b.kind === 'voyage' ? voyages[b.voyage as number].dur
      : b.kind === 'era' ? ERA_BEAT : b.kind === 'open' ? OPEN_BEAT : TODAY_BEAT;
    beats.push({ beat: b, start: total, dur, day: dayOf(b.date) as number, endDay: dayOf(b.end) as number });
    total += dur;
  }
  const eraDays = chron.eras.map((e) => dayOf(e.date) as number);
  // the jurisdictions known by each keyframe: every unit of it and of all before it
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
  let oldWorld: Feature | null = null;
  let iberia: Feature | null = null;
  let countries = new Map<string, Feature>();
  let borders: MultiLineString | null = null;
  const units = new Map<string, Feature>();
  const lines = new Map<string, Feature>();
  let loaded = false;

  /* --- layout and camera --- */
  const ROT: Record<Layout, number> = { atlantic: 30, pacific: 170, globe: 0 };
  const unitProj: Record<'atlantic' | 'pacific', GeoProjection> = {
    atlantic: geoEqualEarth().rotate([ROT.atlantic, 0]).scale(1).translate([0, 0]),
    pacific: geoEqualEarth().rotate([ROT.pacific, 0]).scale(1).translate([0, 0]),
  };
  const worldB = geoPath(unitProj.atlantic).bounds({ type: 'Sphere' });
  const worldW = worldB[1][0] - worldB[0][0];
  const worldH = worldB[1][1] - worldB[0][1];

  type Cam = { layout: Layout; k: number; mx: number; my: number; lon: number; lat: number };
  let cam: Cam | null = null;
  let W = 0, H = 0, dpr = 1;
  let inset: Inset = { l: 0, r: 0, t: 0, b: 0 };
  const avail = () => {
    const w = Math.max(80, W - inset.l - inset.r), h = Math.max(80, H - inset.t - inset.b);
    return { x: inset.l, y: inset.t, w, h, cx: inset.l + w / 2, cy: inset.t + h / 2 };
  };
  const kFitWorld = () => { const a = avail(); return Math.min(a.w / worldW, a.h / worldH) * 0.98; };

  function fitPoints(layout: 'atlantic' | 'pacific', pts: LonLat[], minSpan: number, pad = 0.1): Cam {
    const p = unitProj[layout];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of pts) {
      const r = p(q);
      if (!r) continue;
      x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[0]); y1 = Math.max(y1, r[1]);
    }
    const a = avail();
    const span = Math.max(minSpan, 1e-3);
    const bw = Math.max(x1 - x0, span), bh = Math.max(y1 - y0, span * 0.6);
    const k = clamp(Math.min((a.w * (1 - pad * 2)) / bw, (a.h * (1 - pad * 2)) / bh), kFitWorld(), kFitWorld() * 18);
    return { layout, k, mx: (x0 + x1) / 2, my: (y0 + y1) / 2, lon: 0, lat: 0 };
  }
  function boxPoints(box: [LonLat, LonLat]): LonLat[] {
    const [[w, s], [e, n]] = box;
    const out: LonLat[] = [];
    for (let lon = w; lon <= e + 0.01; lon += Math.max(2, (e - w) / 12)) for (let lat = s; lat <= n + 0.01; lat += Math.max(2, (n - s) / 8)) out.push([lon > 180 ? lon - 360 : lon, lat]);
    return out;
  }

  function projectionFor(c: Cam): GeoProjection {
    const a = avail();
    if (c.layout === 'globe') {
      return geoOrthographic().rotate([-c.lon, -c.lat]).scale(c.k).translate([a.cx, a.cy]).clipAngle(90).precision(0.7);
    }
    return geoEqualEarth().rotate([ROT[c.layout], 0]).scale(c.k).translate([a.cx - c.k * c.mx, a.cy - c.k * c.my]).precision(0.7);
  }

  /* --- the state of the story at a time --- */
  type State = {
    bi: number; cb: CBeat; tau: number;
    vi: number; vd: number; stop: number; atStop: boolean;
    day: number; era: number; preEra: boolean; fog: number;
  };
  function stateAt(s: number): State {
    let bi = 0;
    for (let i = 0; i < beats.length; i++) if (beats[i].start <= s) bi = i;
    const cb = beats[bi];
    const tau = clamp(s - cb.start, 0, cb.dur);
    let vi = -1, vd = 0, stop = 0, atStop = false, day = cb.day;
    if (cb.beat.kind === 'voyage') {
      vi = cb.beat.voyage as number;
      const r = voyageAt(voyages[vi], tau);
      vd = r.d; stop = r.stop; atStop = r.atStop; day = r.day;
    }
    let era = 0;
    for (let i = 0; i < eraDays.length; i++) if (eraDays[i] <= day) era = i;
    const preEra = day < eraDays[0];
    const fog = cb.beat.kind === 'today' ? (reduced ? 0 : 1 - smooth(tau / 3)) : 1;
    return { bi, cb, tau, vi, vd, stop, atStop, day, era, preEra, fog };
  }

  function targetCam(st: State): Cam {
    const b = st.cb.beat;
    if (st.vi >= 0) {
      const cv = voyages[st.vi];
      const ship = pointAt(cv, st.vd);
      if (b.layout === 'globe') {
        const a = avail();
        return { layout: 'globe', k: Math.min(a.w, a.h) * 0.47, mx: 0, my: 0, lon: ship[0] + 8, lat: clamp(ship[1] * 0.6, -35, 35) };
      }
      const w = clamp(cv.length * 0.24, 0.05, 0.75);
      const pts: LonLat[] = [ship];
      for (let i = 0; i < cv.pts.length; i++) if (Math.abs(cv.cum[i] - st.vd) <= w) pts.push(cv.pts[i]);
      const minSpan = cv.v.kind === 'land' ? worldW * 0.035 : worldW * 0.11;
      return fitPoints(b.layout as 'atlantic' | 'pacific', pts, minSpan, 0.12);
    }
    const layout = (b.layout === 'globe' ? 'atlantic' : b.layout) as 'atlantic' | 'pacific';
    return fitPoints(layout, b.box ? boxPoints(b.box) : [[-180, -60], [180, 75]], worldW * 0.1, 0.06);
  }

  /* --- clock --- */
  let s = 0;
  let playing = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let dirty = true;
  let lastEra = -1;
  let eraFadeAt = -1e9;
  let prevEra = -1;
  let pulseAt = -1e9;
  let hits: HitInfo[] = [];
  let hoverKey = '';

  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (playing && visible) {
      s = Math.min(total, s + dt);
      dirty = true;
      if (s >= total) playing = false;
    }
    if (loaded && W > 0) {
      const st = stateAt(s);
      const tgt = targetCam(st);
      let moving = false;
      if (!cam || reduced || cam.layout !== tgt.layout) {
        if (cam && cam.layout !== tgt.layout && !reduced) {
          snap = snap ?? document.createElement('canvas');
          snap.width = canvas.width; snap.height = canvas.height;
          (snap.getContext('2d') as CanvasRenderingContext2D).drawImage(canvas, 0, 0);
          snapAt = now;
        }
        cam = { ...tgt };
      } else {
        const f = 1 - Math.exp(-dt * 2.6);
        const lk = Math.log(cam.k), tk = Math.log(tgt.k);
        const nk = Math.exp(lk + (tk - lk) * f);
        const nc: Cam = {
          layout: tgt.layout, k: nk,
          mx: cam.mx + (tgt.mx - cam.mx) * f, my: cam.my + (tgt.my - cam.my) * f,
          lon: cam.lon + angleDiff(cam.lon, tgt.lon) * f, lat: cam.lat + (tgt.lat - cam.lat) * f,
        };
        moving = Math.abs(tk - lk) > 1e-3 || Math.abs(tgt.mx - cam.mx) * nk > 0.3 || Math.abs(tgt.my - cam.my) * nk > 0.3 || Math.abs(angleDiff(cam.lon, tgt.lon)) > 0.05 || Math.abs(tgt.lat - cam.lat) > 0.05;
        cam = nc;
      }
      if (st.era !== lastEra) {
        if (lastEra >= 0 && !reduced) { prevEra = lastEra; eraFadeAt = now; pulseAt = now; }
        lastEra = st.era;
      }
      const fading = now - eraFadeAt < 1000 || now - pulseAt < 2800 || (snap !== null && now - snapAt < 900);
      if (dirty || moving || fading) {
        draw(st, now);
        dirty = false;
      }
      opts.onFrame({ s, beat: st.bi, stop: st.stop, day: st.day, playing, voyageDay: st.vi >= 0 && !st.atStop });
      if (playing || moving || fading) schedule();
    } else if (playing) schedule();
  }
  const schedule = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
  const kick = () => { dirty = true; last = 0; schedule(); };

  /* --- drawing --- */
  let fontSerif = 'Georgia, serif';
  let fontMono = 'ui-monospace, monospace';
  let grain: CanvasPattern | null = null;
  function readFonts() {
    const cs = getComputedStyle(document.documentElement);
    const d = cs.getPropertyValue('--font-display').trim();
    const m = cs.getPropertyValue('--font-mono').trim();
    if (d) fontSerif = `${d}, Georgia, serif`;
    if (m) fontMono = `${m}, ui-monospace, monospace`;
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

  function pxPerDeg(proj: GeoProjection): number {
    const a = avail();
    const c = proj.invert?.([a.cx, a.cy]);
    if (!c) return 1;
    const p1 = proj([c[0] - 0.5, c[1]]), p2 = proj([c[0] + 0.5, c[1]]);
    if (!p1 || !p2) return proj.scale() * RAD;
    return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / Math.max(0.2, Math.cos(c[1] * RAD));
  }

  const circle = geoCircle();
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

  function draw(st: State, now: number) {
    const proj = projectionFor(cam as Cam);
    const globe = (cam as Cam).layout === 'globe';
    const path = geoPath(proj, ctx);
    const ppd = pxPerDeg(proj);
    const era: Era = chron.eras[st.era];
    const today = st.cb.beat.kind === 'today';
    // on the globe, a point on the far side is not drawn
    const centre: LonLat = [(cam as Cam).lon, (cam as Cam).lat];
    const pt = (at: LonLat) => (globe && geoDistance(at, centre) > Math.PI / 2 - 0.03 ? null : proj(at));
    // close in, the 1:50m coast; further out, the 1:110m one
    const coast = land50 && !globe && (cam as Cam).k > kFitWorld() * 2.2 ? land50 : land;
    const coastPath = new Path2D();
    // (d3 only calls moveTo, lineTo, closePath and arc, which a Path2D has)
    if (coast) geoPath(proj, coastPath as unknown as CanvasRenderingContext2D)(coast);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // the sea (and, on the globe, the dark around it)
    ctx.fillStyle = css(C.fog);
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = css(C.sea); ctx.fill();

    // a portolan's rhumb lines, from two wind roses
    if (!globe) {
      ctx.save();
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.clip();
      ctx.lineWidth = 0.6;
      for (const at of [[-38, 24], [-150, 8]] as LonLat[]) {
        const p = proj(at);
        if (!p) continue;
        for (let k = 0; k < 32; k++) {
          const a = (k * Math.PI) / 16;
          ctx.strokeStyle = css(C.leatherLight, k % 4 === 0 ? 0.16 : 0.07);
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * 4000, p[1] + Math.sin(a) * 4000); ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.beginPath(); path(geoGraticule10()); ctx.lineWidth = 0.5; ctx.strokeStyle = css(C.paper, 0.07); ctx.stroke();

    // land
    if (coast) { ctx.fillStyle = css(C.land); ctx.fill(coastPath); }

    // jurisdictions: the keyframe in force (cross-fading from the one before)
    const drawEra = (e: Era, alpha: number, pre: boolean) => {
      ctx.globalAlpha = alpha;
      for (const u of e.units) {
        const f = famOf(u); const g = units.get(u.id);
        if (!f || !g || (pre && f.kind !== 'native')) continue;
        ctx.beginPath(); path(g);
        ctx.fillStyle = css(unitFill(f));
        ctx.fill();
        if (f.kind === 'claim') {
          ctx.save(); ctx.clip();
          ctx.strokeStyle = css(C.paper, 0.25); ctx.lineWidth = 0.8;
          for (let x = -H; x < W; x += 7) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
          ctx.restore();
        }
      }
      ctx.lineWidth = 0.7; ctx.strokeStyle = css(C.paper, 0.5);
      for (const u of e.units) {
        const f = famOf(u); const g = units.get(u.id);
        if (!f || !g || (pre && f.kind !== 'native')) continue;
        ctx.setLineDash(f.kind === 'native' ? [2, 3] : []);
        ctx.beginPath(); path(g); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };
    if (today) {
      const lit = (ids: string[], c: RGB) => {
        ctx.fillStyle = css(c);
        for (const id of ids) { const g = countries.get(id); if (g) { ctx.beginPath(); path(g); ctx.fill(); } }
      };
      lit(chron.iberophone.submersa, C.pt[1]);
      lit(chron.iberophone.emersa, C.es[1]);
      if (borders) { ctx.beginPath(); path(borders); ctx.lineWidth = 0.6; ctx.strokeStyle = css(C.paper, 0.45); ctx.stroke(); }
    } else {
      const ef = reduced ? 1 : smooth((now - eraFadeAt) / 900);
      if (ef < 1 && prevEra >= 0 && prevEra !== st.era) drawEra(chron.eras[prevEra], 1 - ef, false);
      drawEra(era, ef, st.preEra);
      // the units that changed: a pulse, or with reduced motion a still outline
      if (!st.preEra && st.cb.beat.kind === 'era') {
        const pt = (now - pulseAt) / 1000;
        const a = reduced ? 0.8 : pt < 2.6 ? (1 - pt / 2.6) * (0.55 + 0.45 * Math.sin(pt * 7)) : 0;
        if (a > 0.01) {
          ctx.lineWidth = 2.2; ctx.strokeStyle = css(C.paper, a);
          for (const u of era.units) if (era.pulse.includes(u.f)) { const g = units.get(u.id); if (g) { ctx.beginPath(); path(g); ctx.stroke(); } }
        }
      }
    }
    // a coastline, so every shore reads against the dark sea
    if (coast) { ctx.lineWidth = 0.6; ctx.strokeStyle = css(C.paperDeep, 0.35); ctx.stroke(coastPath); }

    // routes: the voyages already sailed, then the one at sea
    const sailed: { cv: CVoyage; d: number; current: boolean }[] = [];
    for (let i = 0; i <= st.bi; i++) {
      const b = beats[i].beat;
      if (b.kind !== 'voyage') continue;
      const cv = voyages[b.voyage as number];
      sailed.push({ cv, d: i === st.bi ? st.vd : cv.length, current: i === st.bi });
    }
    for (const r of sailed) {
      if (r.current) continue;
      ctx.beginPath(); path({ type: 'LineString', coordinates: r.cv.pts });
      ctx.lineWidth = 1; ctx.setLineDash(r.cv.v.kind === 'land' ? [1.5, 3] : [4, 4]);
      ctx.strokeStyle = css(r.cv.v.crown === 'pt' ? C.leatherLight : C.paper, 0.32); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* the fog: a low-resolution mask of what is known, scaled up (soft edges) */
    if (st.fog > 0.001) {
      const f = 0.25;
      const mw = Math.ceil(W * f), mh = Math.ceil(H * f);
      if (mask.width !== mw || mask.height !== mh) { mask.width = mw; mask.height = mh; }
      mctx.setTransform(f, 0, 0, f, 0, 0);
      mctx.clearRect(0, 0, W, H);
      const mpath = geoPath(proj, mctx);
      mctx.fillStyle = '#fff'; mctx.strokeStyle = '#fff';
      mctx.lineJoin = 'round'; mctx.lineCap = 'round';
      // the Old World, known by chart or by report: dimly
      if (oldWorld) {
        mctx.globalAlpha = 0.42;
        mctx.beginPath(); mpath(oldWorld); mctx.fill();
        mctx.lineWidth = ppd * 2.2; mctx.stroke();
      }
      mctx.globalAlpha = 1;
      if (iberia) { mctx.beginPath(); mpath(iberia); mctx.fill(); mctx.lineWidth = ppd * 4; mctx.stroke(); }
      // after the voyages, the dark thins over the centuries as the rest of the
      // world's coasts reach the charts; the borders take over the story
      const year = 1970 + st.day / 365.25;
      const charted = clamp((year - 1570) / 180, 0, 0.82);
      if (charted > 0) { mctx.globalAlpha = charted; mctx.beginPath(); mpath({ type: 'Sphere' }); mctx.fill(); mctx.globalAlpha = 1; }
      // jurisdictions known by now
      if (!st.preEra) for (const id of knownUnits[st.era]) { const g = units.get(id); if (g) { mctx.beginPath(); mpath(g); mctx.fill(); } }
      // wakes and landfalls
      for (const r of sailed) {
        const kind = r.cv.v.kind;
        mctx.lineWidth = ppd * (kind === 'land' ? 1.2 : kind === 'river' ? 2.4 : 3.3);
        mctx.beginPath(); mpath({ type: 'LineString', coordinates: r.current ? sliceTo(r.cv, r.d) : r.cv.pts }); mctx.stroke();
        for (const stp of r.cv.stops) {
          if (stp.d > r.d + 1e-9) break;
          const grow = r.current && !reduced ? smooth((st.tau - stp.arrive) / 1.4) : 1;
          const rad = (stp.wp.reveal ?? 2.4) * Math.max(0.05, grow);
          mctx.beginPath(); mpath(circle.center(stp.wp.at).radius(rad)()); mctx.fill();
        }
      }
      // the fog itself
      if (fogC.width !== Math.ceil(W) || fogC.height !== Math.ceil(H)) { fogC.width = Math.ceil(W); fogC.height = Math.ceil(H); grain = null; }
      if (!grain) makeGrain();
      fctx.globalCompositeOperation = 'source-over';
      fctx.globalAlpha = 1;
      fctx.fillStyle = css(C.fog); fctx.fillRect(0, 0, W, H);
      if (grain) { fctx.fillStyle = grain; fctx.fillRect(0, 0, W, H); }
      fctx.globalCompositeOperation = 'destination-out';
      fctx.imageSmoothingEnabled = true;
      fctx.drawImage(mask, 0, 0, W, H);
      fctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = st.fog;
      ctx.drawImage(fogC, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // the chart's grid runs on into the dark, faintly
    ctx.beginPath(); path(geoGraticule10()); ctx.lineWidth = 0.5; ctx.strokeStyle = css(C.paper, 0.035); ctx.stroke();
    if (globe) { ctx.beginPath(); path({ type: 'Sphere' }); ctx.lineWidth = 1; ctx.strokeStyle = css(C.paper, 0.18); ctx.stroke(); }

    hits = [];
    const placed: [number, number, number, number][] = [];
    const free = (x: number, y: number, w: number, h: number) => {
      if (x < 4 || y < 4 || x + w > W - 4 || y + h > H - 4) return false;
      for (const b of placed) if (x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]) return false;
      placed.push([x, y, w, h]); return true;
    };

    // treaty lines, drawn across the unknown as well: they divided what no one had seen
    if (!today && !st.preEra) {
      for (const id of era.lines) {
        const g = lines.get(id);
        if (!g) continue;
        ctx.beginPath(); path(g); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.3; ctx.strokeStyle = css(C.paper, 0.75); ctx.stroke(); ctx.setLineDash([]);
        const p = pt([-48.5, 30]);
        if (p) {
          ctx.save(); ctx.translate(p[0] + 7, p[1]); ctx.rotate(-Math.PI / 2);
          ctx.font = `500 10px ${fontMono}`; ctx.fillStyle = css(C.paper, 0.8); ctx.textAlign = 'center';
          ctx.fillText('TORDESILLAS · 1494', 0, 0); ctx.restore();
        }
      }
    }

    // seas get their names when they are reached
    const seas: { at: LonLat; name: string; from?: string }[] = [
      { at: [-38, 30], name: opts.seaNames.atlantic },
      { at: [-92, 2], name: opts.seaNames.south, from: '1513-09-25' },
      { at: [-145, -14], name: opts.seaNames.pacific, from: '1520-11-28' },
    ];
    ctx.font = `italic 400 ${clamp(ppd * 1.3, 12, 19)}px ${fontSerif}`;
    ctx.textAlign = 'center';
    for (const sea of seas) {
      if (sea.from && st.day < (dayOf(sea.from) as number)) continue;
      const p = pt(sea.at);
      if (!p) continue;
      const w = ctx.measureText(sea.name).width;
      if (!free(p[0] - w / 2, p[1] - 12, w, 16)) continue;
      ctx.fillStyle = css(C.paperDeep, 0.42); ctx.fillText(sea.name, p[0], p[1]);
    }

    // Indigenous states, named through the dark
    if (!today) {
      ctx.font = `italic 400 13px ${fontSerif}`;
      for (const u of era.units) {
        const f = famOf(u);
        if (!f || f.kind !== 'native' || !f.at) continue;
        const p = pt(f.at);
        if (!p) continue;
        const w = ctx.measureText(f.name).width;
        if (!free(p[0] - w / 2, p[1] - 11, w, 14)) continue;
        ctx.fillStyle = css(C.leatherLight, 0.85); ctx.fillText(f.name, p[0], p[1]);
      }
      for (const m of era.marks) {
        const p = pt(m.at);
        if (!p) continue;
        diamond(p[0], p[1], 3.5, css(C.leatherLight, 0.9));
        ctx.font = `italic 400 13px ${fontSerif}`; ctx.textAlign = 'left';
        const w = ctx.measureText(m.name).width;
        if (free(p[0] + 7, p[1] - 10, w, 14)) { ctx.fillStyle = css(C.leatherLight, 0.9); ctx.fillText(m.name, p[0] + 7, p[1] + 1); }
        ctx.textAlign = 'center';
        hits.push({ x: p[0], y: p[1], title: m.name });
      }
    }

    // the current route, the places reached and the ship
    const cur = sailed.find((r) => r.current);
    for (const r of sailed) {
      for (const stp of r.cv.stops) {
        if (stp.d > r.d + 1e-9) break;
        const p = pt(stp.wp.at);
        if (!p) continue;
        hits.push({ x: p[0], y: p[1], title: stp.wp.name as string, date: dateLabel(stp.wp.date), text: stp.wp.log });
        if (!r.current) { dot(p[0], p[1], 1.8, css(C.paper, 0.5)); }
      }
    }
    if (cur) {
      const pts = sliceTo(cur.cv, cur.d);
      const lineStyle = cur.cv.v.crown === 'pt' ? C.leatherLight : C.paper;
      ctx.save();
      ctx.shadowColor = css(C.leather, 0.9); ctx.shadowBlur = 8;
      ctx.beginPath(); path({ type: 'LineString', coordinates: pts });
      ctx.lineWidth = 1.8; ctx.setLineDash(cur.cv.v.kind === 'land' ? [2, 3] : []);
      ctx.strokeStyle = css(lineStyle, 0.95); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // landfalls: the newest first, so its name always shows
      const reached = cur.cv.stops.filter((stp) => stp.d <= cur.d + 1e-9);
      for (let k = reached.length - 1; k >= 0; k--) {
        const stp = reached[k];
        const p = pt(stp.wp.at);
        if (!p) continue;
        const age = st.tau - stp.arrive;
        if (!reduced && age >= 0 && age < 1.6) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 4 + age * 18, 0, Math.PI * 2);
          ctx.lineWidth = 1.2; ctx.strokeStyle = css(C.paper, 0.7 * (1 - age / 1.6)); ctx.stroke();
        }
        dot(p[0], p[1], k === reached.length - 1 ? 3.2 : 2.4, css(C.paper, 0.95), css(C.burgundyDark));
        const label = (stp.wp.name as string).toUpperCase();
        ctx.font = `500 10.5px ${fontMono}`; ctx.textAlign = 'left';
        const w = ctx.measureText(label).width;
        const spots: [number, number][] = [[8, 4], [-8 - w, 4], [-w / 2, -9], [-w / 2, 16]];
        for (const [dx, dy] of spots) {
          if (free(p[0] + dx - 2, p[1] + dy - 10, w + 4, 13)) {
            ctx.fillStyle = css(C.fog, 0.55); ctx.fillRect(p[0] + dx - 3, p[1] + dy - 10, w + 6, 13.5);
            ctx.fillStyle = css(C.paper, k === reached.length - 1 ? 1 : 0.78); ctx.fillText(label, p[0] + dx, p[1] + dy);
            break;
          }
        }
      }
      // the ship
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

    // keyframe labels: the jurisdictions' names
    if (!today && !st.preEra) {
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
        if (!free(p[0] - w / 2 - 2, p[1] - size, w + 4, size + 4)) continue;
        ctx.lineWidth = 3; ctx.strokeStyle = css(C.burgundyDark, 0.55); ctx.strokeText(name, p[0], p[1]);
        ctx.fillStyle = css(C.paper, 0.95); ctx.fillText(name, p[0], p[1]);
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

    // a vignette, and the old chart fading out after a change of layout
    const a = avail();
    const vg = ctx.createRadialGradient(a.cx, a.cy, Math.min(W, H) * 0.35, a.cx, a.cy, Math.max(W, H) * 0.75);
    vg.addColorStop(0, css(C.fog, 0)); vg.addColorStop(1, css(C.fog, 0.55));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (snap && !reduced) {
      const t = (now - snapAt) / 900;
      if (t < 1) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1 - smooth(t);
        ctx.drawImage(snap, 0, 0);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }

  function dot(x: number, y: number, r: number, fill: string, stroke?: string) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function diamond(x: number, y: number, r: number, fill: string) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  /** A nao under sail, bow to the right unless `flip`. */
  function ship(x: number, y: number, k: number, flip: boolean, crown: 'es' | 'pt') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -k : k, k);
    // glow on the water
    const g = ctx.createRadialGradient(0, 2, 0, 0, 2, 22);
    g.addColorStop(0, css(C.paper, 0.35)); g.addColorStop(1, css(C.paper, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 2, 22, 0, Math.PI * 2); ctx.fill();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = css(C.burgundyDark); ctx.lineWidth = 1.1;
    // hull: a high stern castle on the left, the bow on the right
    ctx.beginPath();
    ctx.moveTo(-11, -4); ctx.lineTo(-7, -2); ctx.lineTo(9, -2); ctx.lineTo(12, -4);
    ctx.quadraticCurveTo(10, 3, 5, 4.5); ctx.lineTo(-6, 4.5); ctx.quadraticCurveTo(-10, 3, -11, -4); ctx.closePath();
    ctx.fillStyle = css(C.paperDeep); ctx.fill(); ctx.stroke();
    // masts
    ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(1, -19); ctx.moveTo(7.5, -2); ctx.lineTo(7.5, -13); ctx.moveTo(-6, -3); ctx.lineTo(-6, -14); ctx.stroke();
    // square sails, filled by the wind
    ctx.fillStyle = css(C.paper);
    ctx.beginPath(); ctx.moveTo(-4.5, -16.5); ctx.lineTo(6.5, -16.5); ctx.quadraticCurveTo(8.5, -11, 6.8, -5.5); ctx.lineTo(-4.8, -5.5); ctx.quadraticCurveTo(-3, -11, -4.5, -16.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -11.5); ctx.lineTo(10.5, -11.5); ctx.quadraticCurveTo(12, -8, 10.8, -4.5); ctx.lineTo(5.2, -4.5); ctx.quadraticCurveTo(6.2, -8, 5, -11.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    // lateen on the mizzen
    ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-11.5, -4.5); ctx.lineTo(-3, -4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    // a cross on the mainsail, and a pennant
    ctx.strokeStyle = css(crown === 'pt' ? C.leather : C.burgundy); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(1, -14.5); ctx.lineTo(1, -7.5); ctx.moveTo(-1.8, -11.2); ctx.lineTo(3.8, -11.2); ctx.stroke();
    ctx.fillStyle = css(crown === 'pt' ? C.leather : C.burgundy);
    ctx.beginPath(); ctx.moveTo(1, -19); ctx.lineTo(7, -20.5); ctx.lineTo(1, -22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  /** A banner on a staff, for an expedition on foot. */
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

  /* --- sizing --- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    cam = null;
    kick();
  }

  /* --- data load --- */
  (async () => {
    try {
      const [world, eraTopo] = await Promise.all([
        fetch('/data/world-110m.json').then((r) => r.json()),
        fetch('/data/atlas-eras.topo.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      // the finer coast comes after, and only matters close in
      fetch('/data/land-50m.json').then((r) => (r.ok ? r.json() : null)).then((t: Topology | null) => {
        if (!t) return;
        land50 = feature(t, t.objects.land) as unknown as Feature;
        kick();
      }).catch(() => {});
      const wt = world as Topology;
      const cobj = wt.objects.countries as GeometryCollection;
      land = feature(wt, wt.objects.land) as unknown as Feature;
      const fc = feature(wt, cobj) as unknown as FeatureCollection;
      countries = new Map(fc.features.map((f) => [String(f.id), f]));
      const notOld = new Set(['036', '554', '598', '090', '548', '242', '540', '608', '010', '260', '304']);
      const oldGeoms = cobj.geometries.filter((g) => {
        const id = String(g.id);
        if (notOld.has(id)) return false;
        const f = countries.get(id);
        return f ? geoCentroid(f)[0] > -26 : false;
      });
      oldWorld = { type: 'Feature', properties: {}, geometry: merge(wt, oldGeoms as never) as MultiPolygon };
      iberia = { type: 'Feature', properties: {}, geometry: merge(wt, cobj.geometries.filter((g) => ['724', '620'].includes(String(g.id))) as never) as MultiPolygon };
      borders = mesh(wt, cobj, (a, b) => a !== b) as MultiLineString;
      if (eraTopo) {
        const et = eraTopo as Topology;
        for (const f of (feature(et, et.objects.units) as unknown as FeatureCollection<Geometry>).features) units.set(String(f.id), f);
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

  return {
    total,
    starts: beats.map((b) => b.start),
    durs: beats.map((b) => b.dur),
    play() {
      if (reduced) return;
      if (s >= total - 0.01) s = 0;
      playing = true; kick();
    },
    pause() { playing = false; kick(); },
    isPlaying: () => playing,
    seek(x: number) { s = clamp(x, 0, total); kick(); },
    seekBeat(i: number) {
      const b = beats[clamp(i, 0, beats.length - 1)];
      // with reduced motion a beat is shown finished; otherwise from its start
      s = reduced ? b.start + b.dur - 1e-3 : b.start;
      kick();
    },
    setInset(i: Inset) {
      if (i.l === inset.l && i.r === inset.r && i.t === inset.t && i.b === inset.b) return;
      inset = i; kick();
    },
    setReduced(r: boolean) { reduced = r; if (r) playing = false; cam = null; kick(); },
    setVisible(v: boolean) { visible = v; if (v) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    pick(x: number, y: number) {
      let best: HitInfo | null = null, bd = 16;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
      const key = best ? `${best.title}${best.date ?? ''}` : '';
      if (key !== hoverKey) { hoverKey = key; opts.onHover(best); }
      return best;
    },
    resize,
    destroy() { if (raf) cancelAnimationFrame(raf); raf = 0; playing = false; },
  };
}
