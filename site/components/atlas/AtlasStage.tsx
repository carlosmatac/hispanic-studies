'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import type { Chronicle, RecordView } from '@/lib/atlas-chronicle';
import { CHAPTER_STARTS, stopIndex, TRACKS, yearLabel, type Track } from '@/lib/atlas-time';
import { DEFAULT_LAYERS, focusKey, type Anchors, type Box, type Engine, type Focus, type FrameInfo, type HitInfo, type Layers, type Mode } from '@/lib/atlas-globe';
import { changedItems, noteFor, place } from './explainer';

/* The Atlas app (issue #95 and its review of 2026-11-22). Carlos: "a fixed
   panel where you can't scroll", "like Prometheus", layers, more colour.

   - The globe (lib/atlas-globe.ts) fills a fixed window under the site's
     header. The wheel and the trackpad zoom it toward the pointer, a pinch on
     phones; dragging turns it. The page never scrolls.
   - Top left, as in Prometheus: the chapter, a big year, the stop's title and
     one sentence, and how many polities are mapped and from where.
   - Top right: Places & events (every stop, searchable, and the text version),
     Layers (polities, place names, events, routes, Iberian jurisdictions,
     recorded / not mapped, and the dark, off by default), map options and
     fullscreen. Right edge: zoom and a scale bar.
   - Bottom: one time bar (jump to a year, previous, play the story, next, the
     timeline by chapter). The card that tells each stop is a side panel that
     can be closed (a sheet on phones).

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
const LAYER_KEYS: (keyof Layers)[] = ['polities', 'labels', 'events', 'routes', 'iberian', 'recorded', 'fog'];
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
  const range = useRef<HTMLInputElement>(null);
  const yearEl = useRef<HTMLSpanElement>(null);
  const eraEl = useRef<HTMLSpanElement>(null);
  const dateEl = useRef<HTMLSpanElement>(null);
  const zoomEl = useRef<HTMLSpanElement>(null);
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
  const [yearQ, setYearQ] = useState('');
  const [polities, setPolities] = useState(-1);
  const [full, setFull] = useState(false);
  const [tip, setTip] = useState<HitInfo | null>(null);
  const [cardFocus, setCardFocus] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [timeline, setTimeline] = useState<{ total: number; starts: number[]; durs: number[] } | null>(null);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const reducedRef = useRef(reduced);
  const followRef = useRef(follow);
  const durs = useRef<number[]>([]);
  const downAt = useRef({ x: 0, y: 0 });
  const last = useRef({ bi: -1, landfall: -1, year: '', era: '', date: '', free: false, playing: false, zoom: '', scale: '', pol: -2 });

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
    () => (started ? noteFor({ chron: chronicle, bi, stop: landfall, focus: cardFocus ?? pinned, t, fmtDate }) : null),
    [chronicle, bi, landfall, cardFocus, pinned, t, fmtDate, started],
  );
  const placeNote = useCallback(() => {
    const el = calloutEl.current, st = stage.current, an = anchors.current;
    const ln = leader.current, dot = leaderDot.current;
    const hideLeader = () => { if (ln && dot) ln.style.display = dot.style.display = 'none'; };
    if (!el || !st || !an || !note) { hideLeader(); return; }
    const sr = st.getBoundingClientRect();
    const avoid = [rel(nowEl.current, sr), rel(tools.current, sr), rel(bar.current, sr), rel(card.current, sr), rel(keyEl.current, sr)].filter((b): b is Box => !!b);
    if (slot.current.key !== note.key) slot.current = { key: note.key, slot: '' };
    const p = place({ note, anchors: an, chron: chronicle, w: el.offsetWidth, h: el.offsetHeight, avoid, prevSlot: slot.current.slot });
    slot.current.slot = p.slot;
    el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
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
  useLayoutEffect(() => { placeRef.current = placeNote; placeNote(); }, [placeNote, cardOpen, started, ready, more]);
  const onAnchors = useCallback((a: Anchors) => { anchors.current = a; placeRef.current(); }, []);

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
    const zoom = `${f.zoom.toFixed(1)}×`;
    if (zoom !== l.zoom && zoomEl.current) { zoomEl.current.textContent = zoom; l.zoom = zoom; }
    if (f.kmPx > 0 && scaleEl.current && scaleTx.current) {
      const km = niceKm(f.kmPx * 90);
      const key = `${km}:${Math.round(km / f.kmPx)}`;
      if (key !== l.scale) {
        l.scale = key;
        scaleEl.current.style.width = `${Math.round(km / f.kmPx)}px`;
        scaleTx.current.textContent = `${km.toLocaleString(lang)} km`;
      }
    }
    if (f.polities !== l.pol) { l.pol = f.polities; setPolities(f.polities); }
    if (range.current) range.current.setAttribute('aria-valuetext', `${year} · ${b.title}`);
    if (f.stop !== l.bi) {
      const tr = followRef.current;
      if (f.playing && tr && !b.tracks.includes(tr)) {
        let j = f.stop + 1;
        while (j < N && !stops[j].tracks.includes(tr)) j++;
        if (j < N) { engine.current?.seekStop(j); return; }
        engine.current?.pause();
      }
      l.bi = f.stop; setBi(f.stop); setCardFocus(null); setPinned(null); setMore(false);
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
          layers: DEFAULT_LAYERS, polityText: t.polityText,
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
      let l = 0, r = 0, top = 0, b = 0;
      if (wide) {
        r = cardOpen && c && c.width ? s.right - c.left + 8 : 0;
        l = !welcome && n && n.width && s.width > 1280 ? Math.min(n.right - s.left, s.width * 0.24) : 0;
        b = k ? s.bottom - k.top : 0;
        top = 40;
      } else {
        const sheetTop = cardOpen && c && c.height ? c.top : k?.top ?? s.bottom;
        b = Math.max(0, s.bottom - sheetTop) + 4;
        top = n && n.height ? Math.max(0, n.bottom - s.top) * 0.6 : 0;
      }
      engine.current?.setInset({ l, r, t: top, b });
      engine.current?.resize();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    if (card.current) ro.observe(card.current);
    if (bar.current) ro.observe(bar.current);
    return () => ro.disconnect();
  }, [wide, ready, cardOpen, welcome, started]);

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
  const surprise = () => go(Math.floor(Math.random() * N));
  const jumpYear = (ev: React.FormEvent) => {
    ev.preventDefault();
    const raw = yearQ.trim();
    const n = parseInt(raw.replace(/[^\d-]/g, ''), 10);
    if (!Number.isFinite(n)) return;
    const y = /(bc|a\.?\s*c)/i.test(raw) && n > 0 ? -n : n;
    let j = 0;
    stops.forEach((s, i) => { if (s.year <= y + 0.999) j = i; });
    go(j);
    setYearQ('');
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
  const onClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    setPanel('');
    if (Math.hypot(ev.clientX - downAt.current.x, ev.clientY - downAt.current.y) > 5) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const h = engine.current?.pick(ev.clientX - r.left, ev.clientY - r.top);
    if (h?.go !== undefined) go(h.go);
    else if (h?.focus) { const f = h.focus; setPinned((p) => (focusKey(p) === focusKey(f) ? null : f)); }
  };
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
    else if (e.key === 'Escape') setPanel('');
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
  const onLayers = LAYER_KEYS.filter((k) => layers[k]).length;

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
  const legend: { k: string; label: string }[] = [
    ...(layers.polities ? [{ k: 'polities', label: t.legend2.polities }] : []),
    ...(layers.recorded ? [{ k: 'notmapped', label: t.legend2.notMapped }] : []),
    ...(layers.iberian ? [{ k: 'es', label: t.legend2.es }, { k: 'pt', label: t.legend2.pt }] : []),
    ...(layers.events ? [{ k: 'events', label: t.legend2.events }] : []),
    ...(layers.routes ? [{ k: 'route', label: t.legend2.route }] : []),
    { k: 'ring', label: t.legend2.ring },
    ...(layers.fog ? [{ k: 'fog', label: t.legend2.fog }] : []),
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

        {/* top left: the chapter, the year, the stop in one sentence */}
        <div className="atlas__now" ref={nowEl} hidden={welcome && ready}>
          <p className="atlas__era"><span>{ROMAN[chapter]}</span> {t.chapters[chapter]}</p>
          <p className="atlas__when" aria-hidden="true">
            <span className="atlas__yw">{t.yearWord}</span>
            <span className="atlas__year" ref={yearEl}>{Math.abs(Math.floor(stops[0].year))}</span>
            <span className="atlas__era-mark" ref={eraEl}>{stops[0].year < 0 ? t.eraBCE : t.eraCE}</span>
          </p>
          <p className="atlas__date" aria-hidden="true"><span ref={dateEl}>{stops[0].label}</span></p>
          {started && (
            <>
              <h2 className="atlas__title" lang={ledeLang}>{b.title}</h2>
              {lede && <p className="atlas__lede" lang={ledeLang}>{lede}</p>}
              {!cardOpen && <button type="button" className="atlas__open" onClick={() => setCardOpen(true)}>{t.openCard} →</button>}
            </>
          )}
          {wide && layers.polities && (
            <p className="atlas__count">
              <span>{polities >= 0 ? t.mapped(polities) : t.mappedLoading}</span>
              <a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noopener noreferrer">{t.cliopatria}</a>
            </p>
          )}
        </div>

        {/* top right: places & events, layers, map options, fullscreen */}
        <div className="atlas__tools" ref={tools}>
          <button type="button" className={`atlas__tool${panel === 'places' ? ' is-on' : ''}`} onClick={() => { setQuery(''); setPanel((p) => (p === 'places' ? '' : 'places')); }} aria-expanded={panel === 'places'} title={t.placesEvents}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" /><path d="M6 2.5v11M8.2 6h3.3M8.2 8.5h3.3" /></svg><span>{t.placesEvents}</span>
          </button>
          <button type="button" className={`atlas__tool${panel === 'layers' ? ' is-on' : ''}`} onClick={() => setPanel((p) => (p === 'layers' ? '' : 'layers'))} aria-expanded={panel === 'layers'} title={t.layersH}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2.5 6 3.2-6 3.2-6-3.2z" /><path d="m2 9 6 3.2L14 9" /></svg><span>{t.layersH}</span><b>{onLayers}</b>
          </button>
          <button type="button" className={`atlas__tool atlas__tool--opt${panel === 'options' ? ' is-on' : ''}`} onClick={() => setPanel((p) => (p === 'options' ? '' : 'options'))} aria-expanded={panel === 'options'} title={t.mapOptions}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="atlas__only-narrow"><circle cx="8" cy="8" r="5.8" /><path d="M2.2 8h11.6M8 2.2c2 2.2 2 9.4 0 11.6M8 2.2c-2 2.2-2 9.4 0 11.6" /></svg>
            <span>{t.mapOptions}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="atlas__only-wide"><path d="m4 6 4 4 4-4" /></svg>
          </button>
          <button type="button" className="atlas__tool atlas__tool--full" onClick={fullscreen} aria-label={full ? t.exitFullscreen : t.fullscreen} title={full ? t.exitFullscreen : t.fullscreen}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg><span>{full ? t.exitFullscreen : t.fullscreen}</span>
          </button>
        </div>

        {panel === 'layers' && (
          <div className="atlas__pop atlas__pop--layers" role="group" aria-label={t.layersH}>
            <p className="atlas__pop-h">{t.layersH}</p>
            <ul>
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
            <ul className="atlas__legend atlas__legend--pop" aria-hidden="true">
              {legend.map((x) => <li key={x.k} className={`atlas__legend--${x.k}`}>{x.label}</li>)}
            </ul>
          </div>
        )}
        {panel === 'options' && (
          <div className="atlas__pop atlas__pop--options" role="group" aria-label={t.mapOptions}>
            <p className="atlas__pop-h">{t.projection}</p>
            <div className="atlas__seg">
              <button type="button" aria-pressed={mode === 'globe'} onClick={() => setMode('globe')}>{t.globe}</button>
              <button type="button" aria-pressed={mode === 'flat'} onClick={() => setMode('flat')}>{t.flat}</button>
            </div>
            <p className="atlas__pop-h">{t.help}</p>
            <button type="button" className="atlas__linkbtn" onClick={() => { setPanel(''); setWelcome(true); }}>{t.howTitle} →</button>
            <a className="atlas__linkbtn" href={`${base}/chronicle`}>{t.textVersion} →</a>
          </div>
        )}

        {/* right edge: zoom and the scale */}
        <div className="atlas__zoom" role="group" aria-label={`${t.zoomIn} / ${t.zoomOut}`}>
          <button type="button" onClick={() => engine.current?.zoomBy(1.6)} aria-label={t.zoomIn} title={t.zoomIn} disabled={!ready}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
          </button>
          <button type="button" onClick={() => engine.current?.zoomBy(1 / 1.6)} aria-label={t.zoomOut} title={t.zoomOut} disabled={!ready}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
          </button>
          <button type="button" onClick={() => engine.current?.zoomTo(1)} title={t.wholePlanet} aria-label={t.wholePlanet} disabled={!ready}>
            <span ref={zoomEl}>1.0×</span>
          </button>
          <button type="button" onClick={() => engine.current?.recentre()} title={t.recentre} aria-label={t.recentre} disabled={!ready}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.6" /><path d="M8 1.5v2.8M8 11.7v2.8M1.5 8h2.8M11.7 8h2.8" /></svg>
          </button>
        </div>
        <div className="atlas__scale" aria-hidden="true"><span ref={scaleTx}>1,000 km</span><div ref={scaleEl} /></div>
        {free && ready && started && (
          <button type="button" className="atlas__recentre" onClick={() => engine.current?.recentre()}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.4" /><path d="M8 1.5v2.5M8 12v2.5M1.5 8H4M12 8h2.5" /></svg> {t.recentre}
          </button>
        )}

        {/* bottom left: how to move, and what the colours mean */}
        <div className="atlas__key" ref={keyEl}>
          <p className="atlas__hint">{wide ? t.hintDrag : t.hintTouch}</p>
          <ul className="atlas__legend">
            {legend.map((x) => <li key={x.k} className={`atlas__legend--${x.k}`}>{x.label}</li>)}
          </ul>
        </div>
        {ready && !welcome && <button type="button" className="atlas__surprise" onClick={surprise}>{t.surprise}</button>}

        <svg className="atlas__leader" aria-hidden="true">
          <line ref={leader} style={{ display: 'none' }} />
          <circle ref={leaderDot} r="4" style={{ display: 'none' }} key={note?.key} />
        </svg>
        {ready && note && !welcome && (
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
            <p className="atlas__welcome-hint">{wide ? `${t.hintDrag} · ${t.keys}` : t.hintTouch} · <a href={`${base}/chronicle`}>{t.textVersion}</a></p>
          </div>
        )}

        {/* places & events: every stop, searchable; the text version */}
        {panel === 'places' && (
          <aside className="atlas__places" aria-labelledby="atlas-places-h">
            <div className="atlas__places-head">
              <h2 id="atlas-places-h">{t.placesEvents}</h2>
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
          <form className="atlas__jump" onSubmit={jumpYear}>
            <input value={yearQ} onChange={(e) => setYearQ(e.currentTarget.value)} inputMode="numeric" placeholder={yearLabel(Math.floor(b.year), lang)} aria-label={t.yearInput} title={t.yearInput} />
            <button type="submit" disabled={!ready}>{t.goYear}</button>
          </form>
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
          <button type="button" className="atlas__btn atlas__btn--help" onClick={() => setWelcome(true)} aria-label={t.help} title={t.help}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 6.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4M8 11.8v.2" /></svg>
          </button>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">{said}</p>
    </div>
  );
}

function formatDate(iso: string, day: Intl.DateTimeFormat, month: Intl.DateTimeFormat) {
  const [y, m, d] = iso.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, d ? +d : 15));
  return (d ? day : month).format(date);
}
