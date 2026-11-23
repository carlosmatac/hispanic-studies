'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import type { Chronicle, RecordView } from '@/lib/atlas-chronicle';
import { CHAPTER_STARTS, stopIndex, TRACKS, yearLabel, type Track } from '@/lib/atlas-time';
import { DEFAULT_LAYERS, focusKey, type Anchors, type Box, type Engine, type Focus, type FrameInfo, type HitInfo, type Layers, type Mode, type Spot } from '@/lib/atlas-globe';
import { changedItems, noteFor, place } from './explainer';
import RealmInfo, { type UnitFacts } from './RealmInfo';
import { statusAt } from '@/lib/atlas-status';

/* The Atlas app (issues #95 and #102). Carlos: "a fixed panel where you can't
   scroll", layers, colour; then (2026-11-23) "ours, not a copy", and no world
   polities: only what the Atlas tells is coloured and named.

   - The globe (lib/atlas-globe.ts) fills a fixed window under the site's
     header. The wheel and the trackpad zoom it toward the pointer, a pinch on
     phones; dragging turns it. The page never scrolls.
   - Top left, a chart's cartouche: the chapter, the year, the stop's title and
     one sentence. Down the right edge, one rail of instruments: the index,
     the layers, globe or flat, the whole screen, how it works, and the zoom.
   - Bottom left, the legend on paper; bottom, the time bar (previous, play the
     story, next, the timeline by chapter). The card that tells each stop is a
     side panel that can be closed (a sheet on phones).

   It never plays by itself. Reduced motion: no playback, no flights. The card
   and the globe point at each other (#88). Everything is also in the text
   version at /[lang]/atlas/chronicle, linked from here and readable without
   this script. */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;
const WIDE = '(min-width: 1000px)';
const subscribeWide = (cb: () => void) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getWide = () => window.matchMedia(WIDE).matches;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const LAYER_KEYS: (keyof Layers)[] = ['world', 'iberian', 'recorded', 'routes', 'events', 'labels', 'fog'];
const STORE = 'ihs-atlas-layers';

const rel = (el: Element | null, to: DOMRect): Box | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width ? [r.left - to.left, r.top - to.top, r.right - to.left, r.bottom - to.top] : null;
};
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();
const niceKm = (km: number) => { const p = Math.pow(10, Math.floor(Math.log10(km))); const m = km / p; return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; };

export default function AtlasStage({ lang, chronicle }: { lang: Lang; chronicle: Chronicle }) {
  const t = dict(lang).atlas;
  const { stops } = chronicle;
  const N = stops.length;
  const base = `/${lang}/atlas`;
  const index = useMemo(() => stopIndex(chronicle), [chronicle]);
  const app = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLElement>(null);
  const cardBody = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const nowEl = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const keyEl = useRef<HTMLDivElement>(null);
  const sideEl = useRef<HTMLDivElement>(null);
  const drawerEl = useRef<HTMLElement>(null);
  const scaleBox = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const yearEl = useRef<HTMLSpanElement>(null);
  const eraEl = useRef<HTMLSpanElement>(null);
  const dateEl = useRef<HTMLSpanElement>(null);
  const scaleEl = useRef<HTMLDivElement>(null);
  const scaleTx = useRef<HTMLSpanElement>(null);
  const calloutEl = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGLineElement>(null);
  const leaderDot = useRef<SVGCircleElement>(null);
  const engine = useRef<Engine | null>(null);
  const anchors = useRef<Anchors | null>(null);
  const slot = useRef({ key: '', slot: '' });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bi, setBi] = useState(0);
  const [landfall, setLandfall] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [free, setFree] = useState(false);
  const [mode, setMode] = useState<Mode>('globe');
  const [more, setMore] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [panel, setPanel] = useState<'' | 'places' | 'layers' | 'options'>('');
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [follow, setFollow] = useState<Track | ''>('');
  const [query, setQuery] = useState('');
  const [full, setFull] = useState(false);
  const [tip, setTip] = useState<HitInfo | null>(null);
  const [cardFocus, setCardFocus] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [timeline, setTimeline] = useState<{ total: number; starts: number[]; durs: number[] } | null>(null);
  // the legend: open where the left column has room, a chip where it has not (the reader decides after that)
  const [keyOpen, setKeyOpen] = useState<boolean | null>(null);
  const [tall, setTall] = useState(true);
  const keyShown = keyOpen ?? tall;
  // what the globe draws at this stop: the realms the stop's places lie in, and which colours are on it
  const [here, setHere] = useState<{ f: string; name: string }[]>([]);
  const [kinds, setKinds] = useState('');
  // the realms on the globe now (for the list in Layers), and the click-for-info popover (#104)
  const [realms, setRealms] = useState<{ f: string; name: string }[]>([]);
  const [info, setInfo] = useState<{ spot: Spot; x: number; y: number; keyboard: boolean; related: { i: number; title: string } | null } | null>(null);
  const [facts, setFacts] = useState<UnitFacts | null>(null);
  const infoEl = useRef<HTMLDivElement>(null);
  const realmsKey = useRef('');
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const reducedRef = useRef(reduced);
  const followRef = useRef(follow);
  const durs = useRef<number[]>([]);
  const downAt = useRef({ x: 0, y: 0 });
  const last = useRef({ bi: -1, landfall: -1, year: '', era: '-', date: '', free: false, playing: false, zoom: '', scale: '', pol: -2 });

  const fmt = useMemo(() => ({
    day: new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }), [lang]);
  const fmtDate = useCallback((iso?: string) => (iso ? formatDate(iso, fmt.day, fmt.month) : ''), [fmt]);
  const inTrack = useCallback((i: number, tr: Track | '') => !tr || stops[i].tracks.includes(tr), [stops]);

  // the reader's layers, remembered on this device
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLayers({ ...DEFAULT_LAYERS, ...JSON.parse(raw) });
    } catch { /* private window */ }
  }, []);
  const toggleLayer = (k: keyof Layers) => setLayers((l) => {
    const n = { ...l, [k]: !l[k] };
    try { localStorage.setItem(STORE, JSON.stringify(n)); } catch { /* private window */ }
    return n;
  });

  /* --- the note over the globe --- */
  const focus = cardFocus ?? tip?.focus ?? pinned;
  const focusK = focusKey(focus);
  const note = useMemo(
    () => (started ? noteFor({ chron: chronicle, bi, stop: landfall, focus: cardFocus ?? pinned, t, fmtDate, here }) : null),
    [chronicle, bi, landfall, cardFocus, pinned, t, fmtDate, started, here],
  );
  const placeNote = useCallback(() => {
    const el = calloutEl.current, st = stage.current, an = anchors.current;
    const ln = leader.current, dot = leaderDot.current;
    const hideLeader = () => { if (ln && dot) ln.style.display = dot.style.display = 'none'; };
    if (!el || !st || !an || !note) { hideLeader(); return; }
    const sr = st.getBoundingClientRect();
    // everything that floats is kept clear, with a margin: the note never sits on a panel
    const avoid = [nowEl, tools, bar, card, keyEl, scaleBox, drawerEl]
      .map((r) => rel(r.current, sr)).filter((b): b is Box => !!b).map((b) => [b[0] - 8, b[1] - 8, b[2] + 8, b[3] + 8] as Box);
    if (slot.current.key !== note.key) slot.current = { key: note.key, slot: '' };
    const p = place({ note, anchors: an, chron: chronicle, w: el.offsetWidth, h: el.offsetHeight, avoid, prevSlot: slot.current.slot });
    slot.current.slot = p.slot;
    el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
    // no free place for it: it waits (the card says the same)
    if (p.blocked) { delete el.dataset.placed; hideLeader(); return; }
    el.dataset.placed = '';
    if (!ln || !dot) return;
    if (p.target && p.from) {
      ln.setAttribute('x1', p.from[0].toFixed(1)); ln.setAttribute('y1', p.from[1].toFixed(1));
      ln.setAttribute('x2', p.target[0].toFixed(1)); ln.setAttribute('y2', p.target[1].toFixed(1));
      dot.setAttribute('cx', p.target[0].toFixed(1)); dot.setAttribute('cy', p.target[1].toFixed(1));
      ln.style.display = dot.style.display = '';
    } else hideLeader();
  }, [note, chronicle]);
  const placeRef = useRef(placeNote);
  useLayoutEffect(() => { placeRef.current = placeNote; placeNote(); }, [placeNote, cardOpen, started, ready, more, keyShown, panel]);
  const hereKey = useRef('');
  useLayoutEffect(() => {
    const el = infoEl.current, st = stage.current;
    if (!el || !st || !info) return;
    if (!wide) { el.style.transform = ''; return; }
    const sr = st.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight, g = 14, m = 10;
    const panels = [nowEl, keyEl, tools, bar, card, scaleBox].map((r) => rel(r.current, sr)).filter((b): b is Box => !!b);
    const label = info.spot.f ? anchors.current?.labelOf(info.spot.f) ?? null : null;
    const avoid = label ? [...panels, label] : panels;
    const { x, y } = info;
    const cands: [number, number][] = [[x + g, y + g], [x - g - w, y + g], [x + g, y - g - h], [x - g - w, y - g - h], [x - w / 2, y + g * 2], [x - w / 2, y - g * 2 - h]];
    const fits = (bx: number, by: number) => bx >= m && by >= m && bx + w <= sr.width - m && by + h <= sr.height - m;
    const hit = (bx: number, by: number) => avoid.reduce((acc, b) => acc + Math.max(0, Math.min(bx + w, b[2]) - Math.max(bx, b[0])) * Math.max(0, Math.min(by + h, b[3]) - Math.max(by, b[1])), 0);
    let best: [number, number] | null = null, bestScore = Infinity;
    for (const [cx, cy] of cands) {
      const bx = Math.max(m, Math.min(sr.width - m - w, cx)), by = Math.max(m, Math.min(sr.height - m - h, cy));
      const score = hit(bx, by) * 10 + (fits(cx, cy) ? 0 : 500) + Math.hypot(bx - cx, by - cy);
      if (score < bestScore) { bestScore = score; best = [bx, by]; }
    }
    if (best) el.style.transform = `translate(${Math.round(best[0])}px, ${Math.round(best[1])}px)`;
    el.dataset.placed = '';
    if (info.keyboard) el.focus();
  }, [info, facts, wide, cardOpen]);
  // a click anywhere outside the popover and the globe closes it
  useEffect(() => {
    if (!info) return;
    const off = (e: PointerEvent) => {
      const t = e.target as Node;
      if (infoEl.current?.contains(t) || canvas.current === t) return;
      setInfo(null);
    };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [info]);
  // the stop most worth reading about this realm: a border change that names it, else a record set in it, nearest in time
  const relatedFor = (sp: Spot) => {
    if (!sp.f || !sp.unit) return null;
    const e = engine.current;
    let best: { i: number; title: string; d: number } | null = null;
    stops.forEach((s, i) => {
      if (i === bi) return;
      const named = s.kind === 'era' && s.era !== undefined && chronicle.eras[s.era].pulse.includes(sp.f as string);
      const inside = !named && s.kind === 'record' && !!s.record?.anchors.length && Math.abs(s.year - sp.year) < 60 && !!e?.unitHolds(sp.unit as string, s.record.anchors[0].at);
      if (!named && !inside) return;
      const d = Math.abs(s.year - sp.year) + (named ? 0 : 5);
      if (!best || d < best.d) best = { i, title: s.title, d };
    });
    return best ? { i: (best as { i: number }).i, title: (best as { title: string }).title } : null;
  };

  const onAnchors = useCallback((a: Anchors) => {
    anchors.current = a;
    const hk = `${a.stop}|${a.here.map((h) => h.f).join(',')}`;
    if (hk !== hereKey.current) { hereKey.current = hk; setHere(a.here); }
    setKinds((k) => (k === a.kinds ? k : a.kinds));
    const rk = a.realms.map((r) => `${r.f}:${r.name}`).join('|');
    if (rk !== realmsKey.current) { realmsKey.current = rk; setRealms(a.realms); }
    placeRef.current();
  }, []);

  const onFrame = useCallback((f: FrameInfo) => {
    const b = stops[f.stop];
    if (range.current) {
      const x = f.stop + Math.min(0.999, f.tau / Math.max(1e-6, durs.current[f.stop] ?? 1));
      if (document.activeElement !== range.current) range.current.value = String(x);
      range.current.style.setProperty('--pct', String(x / N));
    }
    let y = Math.floor(b.year), date = b.label;
    if (b.kind === 'voyage') {
      const d = new Date(f.day * 864e5);
      y = d.getUTCFullYear();
      date = f.voyageDay ? fmt.month.format(d) : fmt.day.format(d);
    } else if (b.kind === 'era') { y = chronicle.eras[b.era as number].year; date = `${t.bordersKicker} · ${b.label}`; }
    const l = last.current;
    const year = b.kind === 'today' ? t.todayLabel : String(Math.abs(y));
    const era = b.kind === 'today' ? '' : y < 0 ? t.eraBCE : t.eraCE;
    if (year !== l.year && yearEl.current) { yearEl.current.textContent = year; l.year = year; }
    if (era !== l.era && eraEl.current) { eraEl.current.textContent = era; l.era = era; }
    if (date !== l.date && dateEl.current) { dateEl.current.textContent = date; l.date = date; }
    if (f.kmPx > 0 && scaleEl.current && scaleTx.current) {
      const km = niceKm(f.kmPx * 90);
      const key = `${km}:${Math.round(km / f.kmPx)}`;
      if (key !== l.scale) {
        l.scale = key;
        scaleEl.current.style.width = `${Math.round(km / f.kmPx)}px`;
        scaleTx.current.textContent = `${km.toLocaleString(lang)} km`;
      }
    }
    if (range.current) range.current.setAttribute('aria-valuetext', `${year} · ${b.title}`);
    if (f.stop !== l.bi) {
      const tr = followRef.current;
      if (f.playing && tr && !b.tracks.includes(tr)) {
        let j = f.stop + 1;
        while (j < N && !stops[j].tracks.includes(tr)) j++;
        if (j < N) { engine.current?.seekStop(j); return; }
        engine.current?.pause();
      }
      l.bi = f.stop; setBi(f.stop); setCardFocus(null); setPinned(null); setMore(false); setInfo(null);
      cardBody.current?.scrollTo({ top: 0 });
    }
    if (f.landfall !== l.landfall) { l.landfall = f.landfall; setLandfall(f.landfall); }
    if (f.free !== l.free) { l.free = f.free; setFree(f.free); }
    if (f.playing !== l.playing) { l.playing = f.playing; setPlaying(f.playing); }
  }, [stops, fmt, t, N, chronicle, lang]);

  // the engine: loaded after the page, created once
  useEffect(() => {
    if (!canvas.current) return;
    let alive = true;
    let eng: Engine | null = null;
    (async () => {
      try {
        const { createAtlasGlobe } = await import('@/lib/atlas-globe');
        if (!alive || !canvas.current) return;
        eng = createAtlasGlobe(canvas.current, chronicle, {
          lang, reduced: reducedRef.current, mode: 'globe', seaNames: t.seas, lines: t.lines, approxText: t.approxText,
          layers: DEFAULT_LAYERS,
          onFrame, onHover: setTip, onAnchors,
          onReady: () => alive && setReady(true),
          onError: () => alive && setFailed(true),
        });
        engine.current = eng;
        durs.current = eng.durs;
        setTimeline({ total: eng.total, starts: eng.starts, durs: eng.durs });
        document.documentElement.classList.add('has-atlas');
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => { alive = false; eng?.destroy(); engine.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { reducedRef.current = reduced; engine.current?.setReduced(reduced); }, [reduced]);
  useEffect(() => { followRef.current = follow; }, [follow]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { engine.current?.setFocus(focus); }, [focusK, ready]);
  useEffect(() => { engine.current?.setMode(mode); }, [mode, ready]);
  useEffect(() => { engine.current?.setLayers(layers); }, [layers, ready]);
  useEffect(() => { engine.current?.setOverview(!started); }, [started, ready]);
  // on a wide screen the card opens with the story; on a phone the reader opens it
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (started && window.matchMedia('(min-width: 1200px)').matches) setCardOpen(true);
  }, [started]);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  // the globe is framed in what the year, the card and the bar leave free
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const s = st.getBoundingClientRect();
      const c = card.current?.getBoundingClientRect();
      const k = bar.current?.getBoundingClientRect();
      const n = nowEl.current?.getBoundingClientRect();
      // the layout's measures, for the stylesheet: the time bar's height, and on
      // phones how far down the year and the rail reach (the sheet stops there)
      const a = app.current;
      if (a) {
        if (k && k.height) a.style.setProperty('--bar-h', `${Math.round(k.height)}px`);
        const rr = tools.current?.getBoundingClientRect();
        const topH = Math.max(n && n.height ? n.bottom - s.top : 0, rr && rr.height ? rr.bottom - s.top : 0);
        a.style.setProperty('--top-h', `${Math.round(topH)}px`);
        // the legend stands open when the left column has room for it and the year
        const side = sideEl.current;
        if (side && side.clientHeight) setTall(side.clientHeight >= 600);
      }
      let l = 0, r = 0, top = 0, b = 0;
      if (wide) {
        r = cardOpen && c && c.width ? s.right - c.left + 8 : 0;
        // the globe is framed right of the left column, while that leaves it room
        const side = sideEl.current?.getBoundingClientRect();
        const edge = !welcome && side && side.width ? side.right - s.left + 8 : 0;
        l = edge && s.width - edge - r > 420 ? edge : 0;
        b = k ? s.bottom - k.top : 0;
        top = 40;
      } else {
        const sheetTop = cardOpen && c && c.height ? c.top : k?.top ?? s.bottom;
        b = Math.max(0, s.bottom - sheetTop) + 4;
        top = n && n.height ? Math.max(0, n.bottom - s.top) * 0.6 : 0;
      }
      engine.current?.setInset({ l, r, t: top, b });
      // the panels over the globe: the engine keeps its names out from under them
      engine.current?.setAvoid([nowEl, keyEl, tools, bar, card, drawerEl, scaleBox].map((x) => rel(x.current, s)).filter((x): x is Box => !!x));
      engine.current?.resize();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    if (card.current) ro.observe(card.current);
    if (bar.current) ro.observe(bar.current);
    if (nowEl.current) ro.observe(nowEl.current);
    if (tools.current) ro.observe(tools.current);
    if (keyEl.current) ro.observe(keyEl.current);
    return () => ro.disconnect();
  }, [wide, ready, cardOpen, welcome, started, panel, keyShown]);

  // the clock waits while the tab is hidden
  useEffect(() => {
    const apply = () => engine.current?.setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', apply);
    return () => document.removeEventListener('visibilitychange', apply);
  }, [ready]);

  const go = useCallback((i: number) => {
    const e = engine.current;
    if (!e) return;
    e.pause();
    setStarted(true); setWelcome(false); setPanel('');
    e.seekStop(Math.max(0, Math.min(N - 1, i)));
  }, [N]);

  // deep links: #on-map-<stop id or record id>
  useEffect(() => {
    const onHash = () => {
      const m = location.hash.match(/^#on-map-(.+)$/);
      if (!m) return;
      const i = index.get(decodeURIComponent(m[1]));
      if (i !== undefined && engine.current) go(i);
    };
    window.addEventListener('hashchange', onHash);
    if (ready) onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, [ready, index, go]);

  const nextIn = (from: number, dir: number) => {
    let j = from + dir;
    while (j >= 0 && j < N && !inTrack(j, follow)) j += dir;
    return j >= 0 && j < N ? j : -1;
  };
  const begin = () => {
    setStarted(true); setWelcome(false);
    const e = engine.current;
    if (!e) return;
    e.seekStop(follow ? Math.max(0, nextIn(-1, 1)) : 0);
    if (!reduced) e.play();
  };
  const step = (dir: number) => {
    if (!started) { begin(); return; }
    const j = nextIn(bi, dir);
    if (j >= 0) go(j);
  };
  const toggle = () => {
    const e = engine.current;
    if (!e) return;
    if (!started || welcome) { setStarted(true); setWelcome(false); }
    if (reduced) { step(1); return; }
    if (e.isPlaying()) e.pause(); else e.play();
  };
  const fullscreen = () => {
    const el = app.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  const onPointer = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (ev.buttons && ev.pointerType === 'mouse') return;
    const r = ev.currentTarget.getBoundingClientRect();
    engine.current?.pick(ev.clientX - r.left, ev.clientY - r.top);
  };
  // the facts behind the popover (the units' own tags, capitals, ISO codes): fetched the first time one opens
  const loadFacts = useCallback(() => {
    if (facts) return;
    fetch('/data/atlas-units.json').then((r) => (r.ok ? r.json() : null)).then((d: UnitFacts | null) => d && setFacts(d)).catch(() => {});
  }, [facts]);
  const openInfo = useCallback((spot: Spot | null, x: number, y: number, keyboard = false) => {
    if (!spot) { setInfo(null); return; }
    loadFacts();
    setInfo({ spot, x, y, keyboard, related: relatedFor(spot) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFacts, bi, stops]);
  const onClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    setPanel('');
    if (Math.hypot(ev.clientX - downAt.current.x, ev.clientY - downAt.current.y) > 5) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    const h = engine.current?.pick(x, y);
    if (h?.go !== undefined) { setInfo(null); go(h.go); }
    else if (h?.focus && h.focus.kind !== 'unit') { setInfo(null); const f = h.focus; setPinned((p) => (focusKey(p) === focusKey(f) ? null : f)); }
    // a territory (or any land): what it was in this year
    else openInfo(engine.current?.infoAt(x, y) ?? null, x, y);
  };
  // a realm chosen from a list (Layers, the card): the same popover, at the realm's name
  const infoFor = useCallback((f: string) => {
    const e = engine.current;
    if (!e) return;
    const spot = e.realmSpot(f);
    setPanel('');
    const show = () => {
      const at = e.realmPoint(f);
      const st = stage.current?.getBoundingClientRect();
      openInfo(spot, at?.[0] ?? (st ? st.width / 2 : 200), at?.[1] ?? (st ? st.height / 2 : 200), true);
    };
    // a realm on the far side of the planet: the globe turns to it first
    // (after the drawer has closed and the globe has been framed again)
    if (!e.realmPoint(f) && spot) setTimeout(() => { e.lookAt(spot.at); setTimeout(show, reducedRef.current ? 60 : 560); }, 120); else show();
  }, [openInfo]);
  const point = (f: Focus) => ({
    onPointerEnter: () => setCardFocus(f),
    onPointerLeave: () => setCardFocus(null),
    onFocus: () => setCardFocus(f),
    onBlur: () => setCardFocus(null),
  });
  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || !ready) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === '+' || e.key === '=') engine.current?.zoomBy(1.5);
    else if (e.key === '-') engine.current?.zoomBy(1 / 1.5);
    else if (e.key === 'Escape') { if (info) setInfo(null); else setPanel(''); }
    else if (e.key === ' ' && (e.target as HTMLElement) === stage.current) { e.preventDefault(); toggle(); }
  };

  const b = stops[bi];
  const voyage = b.voyage !== undefined ? chronicle.voyages[b.voyage] : undefined;
  const logStops = voyage ? voyage.route.filter((w) => w.name) : [];
  const shown = b.milestones.slice(0, 3);
  const items = changedItems(chronicle, bi, t);
  const prevI = nextIn(bi, -1), nextI = nextIn(bi, 1);
  const chapter = b.chapter;
  const heard = note && (note.beatLevel || !playing) ? ` ${note.title}${note.text ? `: ${note.text}` : ''}` : '';
  const said = started ? `${t.stopOf(bi + 1, N)}. ${b.label}. ${b.title}.${heard}` : '';
  const lede = firstSentence(b.kind === 'record' ? b.record?.paragraphs[0] ?? '' : b.text);
  const ledeLang = b.kind === 'record' && b.record && b.record.lang !== lang ? b.record.lang : undefined;

  const bands = useMemo(() => {
    if (!timeline) return [];
    return t.chapters.map((name, c) => {
      const first = stops.findIndex((s) => s.chapter === c);
      let lastI = -1;
      stops.forEach((s, i) => { if (s.chapter === c) lastI = i; });
      if (first < 0) return null;
      return { c, name, first, x0: first / N, x1: (lastI + 1) / N, from: yearLabel(CHAPTER_STARTS[c], lang) };
    }).filter((x): x is NonNullable<typeof x> => !!x);
  }, [timeline, stops, t.chapters, lang, N]);

  /* The chapters' years under the timeline, measured so that no two ever touch.
     The current chapter first, then the first chapter, then the others from the
     left; a year that has no room shrinks to its chapter's numeral, and drops
     out only if even that would touch a neighbour. A phone shows fewer. */
  const marksRef = useRef<HTMLDivElement>(null);
  const [marksW, setMarksW] = useState(0);
  useEffect(() => {
    const el = marksRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMarksW(el.clientWidth));
    ro.observe(el);
    setMarksW(el.clientWidth);
    return () => ro.disconnect();
  }, [timeline]);
  const marks = useMemo(() => {
    if (!marksW || !bands.length) return [];
    const charW = wide ? 6.4 : 5.6;              // the mono at 10.5 / 9 px
    const pad = wide ? 12 : 16;
    const place = (x: (typeof bands)[number], text: string) => {
      const w = text.length * charW + 4;
      const left = Math.min(Math.max(0, x.x0 * marksW), marksW - w);
      return { x, text, left, right: left + w };
    };
    const cur = bands.findIndex((x) => x.c === chapter);
    const order = [cur, 0, ...bands.map((_, i) => i)].filter((i, k, all) => i >= 0 && all.indexOf(i) === k);
    const kept: ReturnType<typeof place>[] = [];
    const clear = (m: ReturnType<typeof place>, gap: number) => !kept.some((k) => m.left < k.right + gap && m.right + gap > k.left);
    for (const i of order) {
      const full = place(bands[i], bands[i].from);
      if (clear(full, pad)) { kept.push(full); continue; }
      const short = place(bands[i], ROMAN[bands[i].c]);
      if (clear(short, pad / 2)) kept.push(short);
    }
    return kept.sort((p, q) => p.left - q.left);
  }, [bands, marksW, wide, chapter]);

  const q = fold(query.trim());
  const found = useMemo(() => stops.map((s, i) => ({ s, i })).filter(({ s, i }) => {
    if (!inTrack(i, follow)) return false;
    if (!q) return true;
    const hay = fold(`${s.title} ${s.label} ${s.kicker} ${s.record?.id ?? ''} ${s.record?.anchors.map((a) => a.name).join(' ') ?? ''} ${s.text} ${s.record?.paragraphs[0] ?? ''}`);
    return q.split(/\s+/).every((w) => hay.includes(w));
  }), [stops, q, follow, inTrack]);

  const trackNames = b.tracks.map((x) => t.tracksShort[x]).join(' · ');
  // a span for which no sourced border exists (the taifas, Portugal 1199–1297…): the card says so
  const gap = chronicle.gaps.find((g) => b.year >= g.from && b.year < g.to);
  // the legend names what the globe draws now: the realms' colours that are on it, then the rest
  const drawn = new Set(kinds.split(',').filter(Boolean));
  const L2 = t.legend2;
  const legend: { k: string; label: string }[] = [
    ...(layers.iberian ? (['es-today', 'pt-today', 'ant', 'es', 'pt', 'isl', 'contested', 'indep', 'native', 'other'] as const)
      .filter((k) => drawn.has(k) || ((k === 'es' || k === 'pt') && !drawn.size))
      .map((k) => ({ k, label: L2[k] })) : []),
    ...(layers.iberian && here.length ? [{ k: 'here', label: L2.here }] : []),
    ...(layers.world ? [{ k: 'world', label: L2.world }] : []),
    ...(layers.events ? [{ k: 'events', label: L2.events }] : []),
    ...(layers.routes ? [{ k: 'route', label: L2.route }] : []),
    { k: 'ring', label: L2.ring },
    ...(layers.recorded ? [{ k: 'recorded', label: L2.recorded }] : []),
    ...(layers.fog ? [{ k: 'fog', label: L2.fog }] : []),
  ];

  const recordBlock = (r: RecordView, own: boolean) => (
    <div className="atlas__record" lang={r.lang !== lang ? r.lang : undefined}>
      {!own && <h3 className="atlas__sub" lang={lang}>{t.record} {r.id} · <span lang={r.lang !== lang ? r.lang : undefined}>{r.title}</span></h3>}
      {r.interpretation && (
        <p className="atlas__interp" lang={lang}><strong>{t.interpretation(r.interpretation)}</strong> {t.interpretationNote}</p>
      )}
      {r.plate?.src && (
        <figure className="atlas__fig">
          <Image src={r.plate.src} alt="" width={r.plate.w ?? 560} height={r.plate.h ?? 380} sizes="(min-width: 1000px) 400px, 92vw" />
          <figcaption lang="en">
            <span className="atlas__role" lang={lang}>{t.plateRole[r.plate.role]}</span>
            {r.plate.caption}. {r.plate.author && <>{r.plate.author}, </>}{r.plate.licence} · <a href={r.plate.page} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
          </figcaption>
        </figure>
      )}
      {r.plate && !r.plate.src && (
        <p className="atlas__plate-link" lang={lang}>{t.plateNotShipped} <a href={r.plate.page} target="_blank" rel="noopener noreferrer" lang="en">{r.plate.caption}</a></p>
      )}
      {r.paragraphs.slice(0, more ? 3 : 1).map((p, k) => <p key={k} className="atlas__text">{p}</p>)}
      {r.paragraphs.length > 1 && (
        <button type="button" className="atlas__more" aria-expanded={more} onClick={() => setMore((m) => !m)} lang={lang}>
          {more ? t.readLess : t.readMore}
        </button>
      )}
      <div lang={lang}>
        <h3 className="atlas__sub">{t.onMap}</h3>
        {own && r.anchors.length > 0 && layers.iberian && (
          <p className="atlas__status">{here.length ? t.mapRealm(here.map((h) => h.name)) : gap?.text ?? t.mapNoRealm}</p>
        )}
        {own && here.length > 0 && layers.iberian && (
          <ul className="atlas__chips">
            {here.map((h) => {
              const f: Focus = { kind: 'unit', f: h.f };
              const fk = focusKey(f);
              return (
                <li key={fk}>
                  <button type="button" className={`atlas__chip atlas__chip--unit${focusK === fk ? ' is-hl' : ''}`} aria-pressed={focusKey(pinned) === fk}
                    onClick={() => { setPinned((p) => (focusKey(p) === fk ? null : f)); infoFor(h.f); }} {...point(f)}>
                    <i aria-hidden="true" />{h.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="atlas__status">{r.anchors.length ? t.mapRecord : t.mapNoAnchor}</p>
        {own && r.anchors.length > 0 && (
          <ul className="atlas__chips">
            {r.anchors.map((a, k) => {
              const f: Focus = { kind: 'place', k };
              const fk = focusKey(f);
              return (
                <li key={k}>
                  <button type="button" className={`atlas__chip atlas__chip--place${focusK === fk ? ' is-hl' : ''}`} aria-pressed={focusKey(pinned) === fk}
                    onClick={() => setPinned((p) => (focusKey(p) === fk ? null : f))} {...point(f)}>
                    <i aria-hidden="true" />{a.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {r.mapNote && (
          <details className="atlas__mapnote">
            <summary>{t.mapNote}</summary>
            <p lang={r.lang !== lang ? r.lang : undefined}>{r.mapNote}</p>
          </details>
        )}
        <h3 className="atlas__sub">{t.readFurther}</h3>
        <ul className="atlas__links">
          {r.links.wikipedia && <li><a href={r.links.wikipedia} target="_blank" rel="noopener noreferrer"><span>{t.wikipedia}</span> {decodeURIComponent(r.links.wikipedia.split('/wiki/')[1] ?? '').replace(/_/g, ' ')}</a></li>}
          {r.links.book && <li><a href={r.links.book.url} target="_blank" rel="noopener noreferrer"><span>{t.book}</span> {r.links.book.label}</a></li>}
          {r.links.further.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer"><span>{t.further}</span> {l.label}</a></li>)}
        </ul>
      </div>
    </div>
  );

  return (
    <div className={`atlas-app${wide ? '' : ' is-narrow'}${cardOpen ? ' has-card' : ''}`} ref={app} data-mode={mode}>
      <h1 className="visually-hidden">{t.appH}</h1>
      <div className={`atlas__stage${ready ? ' is-ready' : ''}${started ? ' is-started' : ''}`} ref={stage} tabIndex={-1} onKeyDown={onKey}>
        <canvas
          ref={canvas}
          className="atlas__canvas"
          role="img"
          aria-label={`${t.mapLabel}: ${b.title}, ${b.label}`}
          onPointerMove={onPointer}
          onPointerDown={(ev) => { downAt.current = { x: ev.clientX, y: ev.clientY }; onPointer(ev); }}
          onPointerLeave={() => engine.current?.pick(-999, -999)}
          onClick={onClick}
        />
        {!ready && !failed && <p className="atlas__msg" aria-live="polite">{t.loading}</p>}
        {failed && <p className="atlas__msg" role="alert">{t.failed} <a href={`${base}/chronicle`}>{t.textVersion}</a></p>}

        {/* the left column: the chart's cartouche (the chapter, the year, the stop
            in one sentence) and, under it, the legend. One flex column, so the two
            can never cover each other: on a short window the sentence gives way
            first, then the legend folds to a chip (and is always in Layers). */}
        <div className="atlas__side" ref={sideEl} hidden={(welcome && ready) || panel !== ''}>
          <div className="atlas__now" ref={nowEl}>
            <div className="atlas__cartouche">
              <p className="atlas__era"><span>{ROMAN[chapter]}</span>{t.chapters[chapter]}</p>
              <p className="atlas__when" aria-hidden="true">
                <span className="atlas__year" ref={yearEl}>{Math.abs(Math.floor(stops[0].year))}</span>
                <span className="atlas__era-mark" ref={eraEl}>{stops[0].year < 0 ? t.eraBCE : t.eraCE}</span>
              </p>
              <p className="atlas__date" aria-hidden="true"><span ref={dateEl}>{stops[0].label}</span></p>
            </div>
            {started && (
              <>
                <h2 className="atlas__title" lang={ledeLang}>{b.title}</h2>
                {here.length > 0 && <p className="atlas__where">{t.whereIn(here.map((h) => h.name))}</p>}
                {lede && <p className="atlas__lede" lang={ledeLang}>{lede}</p>}
                {!cardOpen && <button type="button" className="atlas__open" onClick={() => setCardOpen(true)}>{t.openCard} →</button>}
              </>
            )}
          </div>
          {wide && (
            <div className={`atlas__key${keyShown ? ' is-open' : ''}`} ref={keyEl}>
              <button type="button" className="atlas__key-h" aria-expanded={keyShown} onClick={() => setKeyOpen(!keyShown)}>
                {t.legendH}
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d={keyShown ? 'm4 6 4 4 4-4' : 'm4 10 4-4 4 4'} /></svg>
              </button>
              {keyShown && <Legend items={legend} />}
            </div>
          )}
        </div>

        {/* the right edge: one rail of instruments */}
        <div className="atlas__rail" ref={tools}>
          <button type="button" className={`atlas__inst${panel === 'places' ? ' is-on' : ''}`} onClick={() => { setQuery(''); setPanel((p) => (p === 'places' ? '' : 'places')); }} aria-expanded={panel === 'places'} title={t.index}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h7l2 2v9h-9z" /><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" /></svg><span>{t.index}</span>
          </button>
          <button type="button" className={`atlas__inst${panel === 'layers' ? ' is-on' : ''}`} onClick={() => setPanel((p) => (p === 'layers' ? '' : 'layers'))} aria-expanded={panel === 'layers'} title={t.layersH}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2.5 6 3.2-6 3.2-6-3.2z" /><path d="m2 9 6 3.2L14 9" /></svg><span>{t.layersH}</span>
          </button>
          <button type="button" className="atlas__inst" onClick={() => setMode((m) => (m === 'globe' ? 'flat' : 'globe'))} title={mode === 'globe' ? t.flat : t.globe} aria-label={mode === 'globe' ? t.flat : t.globe}>
            {mode === 'globe'
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2 8h12M8 3.5v9" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.8" /><path d="M2.2 8h11.6M8 2.2c2 2.2 2 9.4 0 11.6M8 2.2c-2 2.2-2 9.4 0 11.6" /></svg>}
            <span>{mode === 'globe' ? t.flat : t.globe}</span>
          </button>
          <button type="button" className="atlas__inst atlas__inst--full" onClick={fullscreen} aria-label={full ? t.exitFullscreen : t.fullscreen} title={full ? t.exitFullscreen : t.fullscreen}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg>
          </button>
          <button type="button" className="atlas__inst" onClick={() => { setPanel(''); setWelcome(true); }} aria-label={t.help} title={t.help}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 6.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4M8 11.8v.2" /></svg>
          </button>
          <span className="atlas__rail-rule" aria-hidden="true" />
          {/* the reader has the camera: one press gives it back to the story */}
          {free && ready && started && (
            <button type="button" className="atlas__inst atlas__inst--back" onClick={() => engine.current?.recentre()} aria-label={t.recentre} title={t.recentre}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.4" /><path d="M8 1.5v2.5M8 12v2.5M1.5 8H4M12 8h2.5" /></svg>
            </button>
          )}
          <button type="button" className="atlas__inst atlas__inst--zoom" onClick={() => engine.current?.zoomBy(1.6)} aria-label={t.zoomIn} title={t.zoomIn} disabled={!ready}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
          </button>
          <button type="button" className="atlas__inst atlas__inst--zoom" onClick={() => engine.current?.zoomBy(1 / 1.6)} aria-label={t.zoomOut} title={t.zoomOut} disabled={!ready}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
          </button>
          <button type="button" className="atlas__inst atlas__inst--zoom" onClick={() => engine.current?.zoomTo(1)} aria-label={t.wholePlanet} title={t.wholePlanet} disabled={!ready}>
            {/* a compass rose: the whole planet again */}
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 9.3 6.7 14.5 8 9.3 9.3 8 14.5 6.7 9.3 1.5 8 6.7 6.7z" /></svg>
          </button>
        </div>

        {/* layers: a drawer in the left column's place, with the legend at its foot */}
        {panel === 'layers' && (
          <aside className="atlas__drawer atlas__drawer--layers" ref={drawerEl} aria-labelledby="atlas-layers-h">
            <div className="atlas__drawer-head">
              <h2 id="atlas-layers-h">{t.layersH}</h2>
              <button type="button" className="atlas__x" onClick={() => setPanel('')} aria-label={t.close}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
              </button>
            </div>
            <div className="atlas__drawer-body">
              <ul className="atlas__layers">
                {LAYER_KEYS.map((k) => (
                  <li key={k}>
                    <label className={`atlas__layer atlas__layer--${k}`}>
                      <input type="checkbox" checked={layers[k]} onChange={() => toggleLayer(k)} />
                      <span className="atlas__switch" aria-hidden="true" />
                      <span className="atlas__layer-t">{t.layerNames[k].t}</span>
                      <span className="atlas__layer-d">{t.layerNames[k].d}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {realms.length > 0 && layers.iberian && (
                <>
                  <h3 className="atlas__pop-h">{t.info.onGlobe}</h3>
                  <p className="atlas__pop-hint">{t.info.onGlobeHint}</p>
                  <ul className="atlas__chips atlas__chips--realms">
                    {realms.map((r) => {
                      const k = statusAt(chronicle.families[r.f], stops[bi].year).kind;
                      return (
                        <li key={r.f}>
                          <button type="button" className={`atlas__chip atlas__chip--unit atlas__chip--${k}`} onClick={() => infoFor(r.f)}>
                            <i aria-hidden="true" />{r.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <h3 className="atlas__pop-h">{t.legendH}</h3>
              <Legend items={legend} />
            </div>
            <p className="atlas__pop-foot"><a href={`${base}/chronicle`}>{t.textVersion} →</a></p>
          </aside>
        )}

        {/* a portolan's scale */}
        <div className="atlas__scale" ref={scaleBox} aria-hidden="true"><div ref={scaleEl} /><span ref={scaleTx}>1,000 km</span></div>

        <svg className="atlas__leader" aria-hidden="true">
          <line ref={leader} style={{ display: 'none' }} />
          <circle ref={leaderDot} r="4" style={{ display: 'none' }} key={note?.key} />
        </svg>
        {info && (
          <RealmInfo ref={infoEl} spot={info.spot} chronicle={chronicle} facts={facts} lang={lang} t={t} related={info.related}
            onGo={(i) => { setInfo(null); go(i); }} onClose={() => setInfo(null)} sheet={!wide}
            when={b.kind === 'era' && b.era !== undefined ? String(chronicle.eras[b.era].year) : b.kind === 'today' ? t.todayLabel : yearLabel(Math.floor(b.kind === 'record' ? b.year : info.spot.year), lang)} />
        )}
        {ready && note && !welcome && !panel && !info && (
          <div className="atlas__callout" ref={calloutEl} key={note.key} aria-hidden="true">
            <span className="atlas__callout-kicker">{note.kicker}</span>
            <strong className="atlas__callout-title">{note.title}</strong>
            {note.text && <span className="atlas__callout-text">{note.text}</span>}
          </div>
        )}
        {tip && (
          <div className="atlas__tip" style={{ left: tip.x, top: tip.y }} role="status">
            {tip.date && <span className="atlas__tip-date">{tip.date}</span>}
            <strong>{tip.title}</strong>
            {tip.text && <span>{tip.text}</span>}
          </div>
        )}

        {ready && welcome && (
          <div className="atlas__welcome" role="dialog" aria-labelledby="atlas-welcome-h">
            <p className="atlas__welcome-kicker">{t.welcomeKicker} · {yearLabel(stops[0].year, lang)} – {t.todayLabel}</p>
            <h2 id="atlas-welcome-h">{t.welcomeTitle}</h2>
            <p className="atlas__welcome-text">{t.welcomeText(N)}</p>
            <div className="atlas__welcome-go">
              <button type="button" className="atlas__begin" onClick={started ? () => setWelcome(false) : begin} autoFocus>
                <span aria-hidden="true">▶</span> {started ? t.close : t.begin}
              </button>
              {!started && <button type="button" className="atlas__ghost" onClick={() => go(index.get('columbus-1') ?? 0)}>{t.jump1492}</button>}
              <button type="button" className="atlas__ghost" onClick={() => { setWelcome(false); setStarted(true); setPanel('places'); }}>{t.browse}</button>
            </div>
            <ul className="atlas__how">
              {t.how.map((h) => (
                <li key={h.k} className={`atlas__how--${h.k}`}><i aria-hidden="true" /><strong>{h.t}</strong> {h.d}</li>
              ))}
            </ul>
            <p className="atlas__welcome-hint">{wide ? `${t.hint} · ${t.keys}` : t.hintTouch} · <a href={`${base}/chronicle`}>{t.textVersion}</a></p>
          </div>
        )}

        {/* places & events: every stop, searchable; the text version */}
        {panel === 'places' && (
          <aside className="atlas__drawer atlas__places" ref={drawerEl} aria-labelledby="atlas-places-h">
            <div className="atlas__places-head">
              <h2 id="atlas-places-h">{t.index}</h2>
              <button type="button" className="atlas__x" onClick={() => setPanel('')} aria-label={t.close}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
              </button>
            </div>
            <div className="atlas__places-filters">
              <input type="search" value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder={t.search} aria-label={t.search} />
              <select value={follow} onChange={(e) => setFollow(e.currentTarget.value as Track | '')} aria-label={t.follow}>
                <option value="">{t.followAll}</option>
                {TRACKS.map((tr) => <option key={tr} value={tr}>{t.tracks[tr]}</option>)}
              </select>
            </div>
            <p className="atlas__places-count" aria-live="polite">{found.length ? t.results(found.length) : t.noResults}</p>
            <div className="atlas__places-list">
              {t.chapters.map((name, c) => {
                const here = found.filter(({ s }) => s.chapter === c);
                if (!here.length) return null;
                return (
                  <div key={c} role="group" aria-label={name}>
                    <h3><span>{ROMAN[c]}</span> {name}</h3>
                    <ol>
                      {here.map(({ s, i }) => (
                        <li key={s.id}>
                          <button type="button" onClick={() => go(i)} className={i === bi && started ? 'is-on' : undefined}>
                            <span className="atlas__places-date">{s.label}</span>
                            <span className="atlas__places-title" lang={s.record && s.kind === 'record' && s.record.lang !== lang ? s.record.lang : undefined}>{s.title}</span>
                            <span className="atlas__places-kind">{s.kicker.split(' · ')[0]}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
            <p className="atlas__places-foot">
              <a href={`${base}/chronicle`}>{t.chronicleLink} →</a>
              <a href={`${base}/chronicle#milestones`}>{t.milestonesLink} →</a>
            </p>
          </aside>
        )}

        {/* the card: the stop in full; closed, the year block says it in a line */}
        <aside className={`atlas__card${cardOpen ? ' is-open' : ''}`} ref={card} aria-labelledby="atlas-card-h" hidden={!cardOpen}>
          <div className="atlas__progress" aria-hidden="true"><i style={{ width: `${((bi + 1) / N) * 100}%` }} /></div>
          <div className="atlas__card-head">
            <p className="atlas__kicker">{t.stopOf(bi + 1, N)}{trackNames && <> · {trackNames}</>}</p>
            <button type="button" className="atlas__x" onClick={() => setCardOpen(false)} aria-label={t.closeCard} title={t.closeCard}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
            </button>
            <p className="atlas__type">{b.kicker}</p>
            <h2 id="atlas-card-h" lang={b.kind === 'record' && b.record && b.record.lang !== lang ? b.record.lang : undefined}>{b.title}</h2>
            <p className="atlas__label">
              {b.label}
              {b.record?.pending && b.kind === 'record' && <span className="atlas__pending">{t.pendingEs}</span>}
              {b.record?.machine && b.kind === 'record' && <span className="atlas__pending">{t.machineEs}</span>}
            </p>
          </div>
          <div className="atlas__card-body" id="atlas-card-body" ref={cardBody}>
            {b.kind === 'record' && b.record && recordBlock(b.record, true)}
            {b.kind !== 'record' && (
              <>
                {b.image && (
                  <figure className="atlas__fig">
                    <Image src={b.image.src} alt="" width={640} height={400} sizes="(min-width: 1000px) 400px, 92vw" />
                    <figcaption>{b.image.credit}</figcaption>
                  </figure>
                )}
                <p className="atlas__text">{b.text}</p>
                {(b.who || b.ships) && (
                  <dl className="atlas__meta">
                    {b.who && <><dt>{t.who}</dt><dd>{b.who}</dd></>}
                    {b.ships && <><dt>{t.ships}</dt><dd>{b.ships}</dd></>}
                  </dl>
                )}
                {items.length > 0 && (
                  <>
                    <h3 className="atlas__sub">{t.onMap}</h3>
                    <ul className="atlas__chips">
                      {items.map((it) => {
                        const k = focusKey(it.focus);
                        return (
                          <li key={k}>
                            <button type="button" className={`atlas__chip atlas__chip--${it.focus.kind}${focusK === k ? ' is-hl' : ''}`} aria-pressed={focusKey(pinned) === k}
                              onClick={() => setPinned((p) => (focusKey(p) === k ? null : it.focus))} {...point(it.focus)}>
                              <i aria-hidden="true" />{it.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                {b.branches && (
                  <>
                    <h3 className="atlas__sub">{t.branches}</h3>
                    <dl className="atlas__branches">
                      {b.branches.map((x) => <div key={x.title}><dt>{x.title}</dt><dd>{x.text}</dd></div>)}
                    </dl>
                  </>
                )}
                {logStops.length > 0 && (
                  <>
                    <h3 className="atlas__sub">{t.log}</h3>
                    <ol className="atlas__log">
                      {logStops.map((w, k) => (
                        <li key={`${w.name}${w.date}`} className={`${k < landfall ? 'is-past' : k === landfall ? 'is-now' : 'is-ahead'}${focusK === `stop:${k}` ? ' is-hl' : ''}`}>
                          <button type="button" className="atlas__log-btn" onClick={() => { setStarted(true); engine.current?.pause(); engine.current?.seekLandfall(k); }} title={t.goTo} {...point({ kind: 'stop', k })}>
                            <span className="atlas__log-date">{w.date && formatDate(w.date, fmt.day, fmt.month)}</span>
                            <span className="atlas__log-name">{w.name}</span>
                            {k <= landfall && <span className="atlas__log-text">{w.log}</span>}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                {b.note && <p className="atlas__note">{b.note}</p>}
                {b.record && recordBlock(b.record, false)}
              </>
            )}
            {shown.length > 0 && (
              <>
                <h3 className="atlas__sub">{t.milestones}</h3>
                <ul className="atlas__ms">
                  {shown.map((m) => (
                    <li key={m.n}><a href={`${base}/chronicle#m${m.n}`}><span>{m.n}</span> {m.title}</a> <em>{m.date}</em></li>
                  ))}
                </ul>
                {b.milestones.length > shown.length && <p className="atlas__more-ms">{t.more(b.milestones.length - shown.length)}</p>}
              </>
            )}
            {b.sources.length > 0 && <p className="atlas__src"><span>{b.sources.length > 1 ? t.sources : t.source}</span> {b.sources.join(' · ')}</p>}
          </div>
          <div className="atlas__card-foot">
            <button type="button" className="atlas__prev" onClick={() => step(-1)} disabled={!ready || prevI < 0}>← {t.prev}</button>
            <button type="button" className="atlas__next" onClick={() => step(1)} disabled={!ready || (started && nextI < 0)}>
              {started ? t.next : t.begin} →
            </button>
          </div>
        </aside>

        {/* the time bar */}
        <div className="atlas__bar" ref={bar}>
          <button type="button" className="atlas__btn" onClick={() => step(-1)} disabled={!ready || (started && prevI < 0)} aria-label={t.prev} title={t.prev}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
          </button>
          <button type="button" className="atlas__play" onClick={toggle} disabled={!ready} aria-pressed={reduced ? undefined : playing}>
            {playing
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.2v9.6l7.4-4.8z" className="fill" /></svg>}
            <span>{reduced ? t.next : playing ? t.pause : t.playStory}</span>
          </button>
          <button type="button" className="atlas__btn" onClick={() => step(1)} disabled={!ready || (started && nextI < 0)} aria-label={t.next} title={t.next}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>
          <div className="atlas__timeline">
            <div className="atlas__track">
              <div className="atlas__bands" aria-hidden="true">
                {bands.map((x) => <i key={x.c} className={`atlas__band atlas__band--${x.c}${x.c === chapter ? ' is-on' : ''}`} style={{ left: `${x.x0 * 100}%`, width: `${(x.x1 - x.x0) * 100}%` }} />)}
              </div>
              {timeline && (
                <div className="atlas__ticks" aria-hidden="true">
                  {stops.map((x, i) => (
                    <span key={x.id} className={`atlas__tick atlas__tick--${x.kind}${follow && !x.tracks.includes(follow) ? ' is-out' : ''}`} style={{ left: `${((i + 0.5) / N) * 100}%` }} />
                  ))}
                </div>
              )}
              <input
                ref={range}
                type="range"
                min={0}
                max={N}
                step={0.001}
                defaultValue={0}
                aria-label={t.scrub}
                disabled={!ready}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value);
                  const i = Math.min(N - 1, Math.floor(v));
                  setStarted(true); setWelcome(false); engine.current?.pause();
                  if (timeline) engine.current?.seek(timeline.starts[i] + (v - i) * timeline.durs[i]);
                }}
              />
            </div>
            <div className="atlas__marks" ref={marksRef}>
              {marks.map(({ x, left, text }) => (
                <button key={x.c} type="button" style={{ left: `${left}px` }} className={x.c === chapter ? 'is-on' : undefined}
                  onClick={() => go(x.first)} title={`${ROMAN[x.c]} · ${x.name} · ${x.from}`} aria-label={`${t.chapter} ${ROMAN[x.c]}: ${x.name}, ${x.from}`}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">{said}</p>
    </div>
  );
}

function Legend({ items }: { items: { k: string; label: string }[] }) {
  return (
    <ul className="atlas__legend">
      {items.map((x) => <li key={x.k} className={`atlas__legend--${x.k}`}>{x.label}</li>)}
    </ul>
  );
}

function formatDate(iso: string, day: Intl.DateTimeFormat, month: Intl.DateTimeFormat) {
  const [y, m, d] = iso.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, d ? +d : 15));
  return (d ? day : month).format(date);
}
