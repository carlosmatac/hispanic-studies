'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { stopIndex, TRACKS, yearLabel, type Chronicle, type RecordView, type Track } from '@/lib/atlas-chronicle';
import { focusKey, type Anchors, type Box, type Engine, type Focus, type FrameInfo, type HitInfo, type Mode } from '@/lib/atlas-globe';
import { changedItems, noteFor, place } from './explainer';

/* The Atlas stage (issue #95): a planet that tells the story, from 218 BCE to
   today, after Prometheus (exploreprometheus.com) and in our own register.

   - The globe (lib/atlas-globe.ts) fills the stage; the chapter and the year
     sit over it, top left; the card tells the stop on the right (a bottom
     sheet on phones) and always ends in Previous / Next stop.
   - The dock: play, the timeline coloured by chapter with a tick per stop,
     and the regional lanes under it, so you see where the story is.
   - The tools: zoom, back to the story, globe or flat map, the index (search
     every stop, follow one region) and the welcome again.

   It never plays by itself: the reader begins, steps, scrubs or plays (as
   Beltrán asked: a timeline you step through). With reduced motion there is no
   playback and no flight: each step shows the stop finished and still.

   The card and the globe point at each other (#88): a note over the globe says
   what the stop changes, beside the thing; hovering a landfall, a jurisdiction,
   a treaty line or a place on the card lights it on the globe, and back.
   Everything here is also in the chronicle under the stage (./Chronicle.tsx),
   which works without this script. */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;
const WIDE = '(min-width: 1000px)';
const subscribeWide = (cb: () => void) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getWide = () => window.matchMedia(WIDE).matches;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const rel = (el: Element | null, to: DOMRect): Box | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width ? [r.left - to.left, r.top - to.top, r.right - to.left, r.bottom - to.top] : null;
};
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function AtlasStage({ lang, chronicle }: { lang: Lang; chronicle: Chronicle }) {
  const t = dict(lang).atlas;
  const { stops } = chronicle;
  const N = stops.length;
  const index = useMemo(() => stopIndex(chronicle), [chronicle]);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLElement>(null);
  const cardBody = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const nowEl = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const yearEl = useRef<HTMLSpanElement>(null);
  const dateEl = useRef<HTMLSpanElement>(null);
  const calloutEl = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGLineElement>(null);
  const leaderDot = useRef<SVGCircleElement>(null);
  const welcomeEl = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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
  const [sheet, setSheet] = useState(false);
  const [follow, setFollow] = useState<Track | ''>('');
  const [query, setQuery] = useState('');
  const [tip, setTip] = useState<HitInfo | null>(null);
  const [cardFocus, setCardFocus] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [timeline, setTimeline] = useState<{ total: number; starts: number[]; durs: number[] } | null>(null);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const reducedRef = useRef(reduced);
  const followRef = useRef(follow);
  const last = useRef({ bi: -1, landfall: -1, year: '', date: '', free: false, playing: false });
  const durs = useRef<number[]>([]);

  const fmt = useMemo(() => ({
    day: new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }), [lang]);
  const fmtDate = useCallback((iso?: string) => (iso ? formatDate(iso, fmt.day, fmt.month) : ''), [fmt]);
  const inTrack = useCallback((i: number, tr: Track | '') => !tr || stops[i].tracks.includes(tr), [stops]);

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
    const avoid = [rel(nowEl.current, sr), rel(tools.current, sr), rel(dock.current, sr), rel(card.current, sr)].filter((b): b is Box => !!b);
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
  useLayoutEffect(() => { placeRef.current = placeNote; placeNote(); }, [placeNote, sheet, started, ready, more]);
  const onAnchors = useCallback((a: Anchors) => { anchors.current = a; placeRef.current(); }, []);

  const onFrame = useCallback((f: FrameInfo) => {
    const b = stops[f.stop];
    // the timeline gives every stop the same width: its position is the stop
    // and how far into it the story is
    if (range.current) {
      const x = f.stop + Math.min(0.999, f.tau / Math.max(1e-6, durs.current[f.stop] ?? 1));
      if (document.activeElement !== range.current) range.current.value = String(x);
      range.current.style.setProperty('--pct', String(x / N));
    }
    let year = b.kind === 'today' ? b.label : yearLabel(b.year, lang), date = b.label;
    if (b.kind === 'voyage') {
      const d = new Date(f.day * 864e5);
      year = String(d.getUTCFullYear());
      date = f.voyageDay ? fmt.month.format(d) : fmt.day.format(d);
    } else if (b.kind === 'era') { year = String(Math.floor(b.year)); date = `${t.bordersKicker} · ${b.label}`; }
    else if (b.kind === 'record') year = yearLabel(b.year, lang).replace(/\.5$/, '');
    const l = last.current;
    if (year !== l.year && yearEl.current) { yearEl.current.textContent = year; l.year = year; }
    if (date !== l.date && dateEl.current) { dateEl.current.textContent = date; l.date = date; }
    if (range.current) range.current.setAttribute('aria-valuetext', `${year} · ${b.title}`);
    if (f.stop !== l.bi) {
      // following one region: playing on skips the stops outside it
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
  }, [stops, fmt, t, lang, N]);

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
  // the welcome shows the whole planet; the story begins where it begins
  useEffect(() => { engine.current?.setOverview(!started); }, [started, ready]);

  // the globe is framed in what the year, the card and the dock leave free
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const s = st.getBoundingClientRect();
      const c = card.current?.getBoundingClientRect();
      const k = dock.current?.getBoundingClientRect();
      const y = nowEl.current?.getBoundingClientRect();
      let l = 0, r = 0, top = 0, b = 0;
      if (wide) {
        r = c && c.width ? s.right - c.left + 8 : 0;
        b = k ? s.bottom - k.top + 4 : 0;
        top = y ? Math.max(0, y.bottom - s.top) * 0.35 : 0;
        l = 0;
      } else {
        const sheetTop = c ? Math.min(c.top, k?.top ?? c.top) : s.bottom;
        b = Math.max(0, s.bottom - sheetTop) + 4;
        top = y ? Math.max(0, y.bottom - s.top) * 0.6 : 0;
      }
      engine.current?.setInset({ l, r, t: top, b });
      engine.current?.resize();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    if (card.current) ro.observe(card.current);
    if (dock.current) ro.observe(dock.current);
    return () => ro.disconnect();
  }, [wide, ready, sheet, welcome]);

  // the clock waits while the stage is off screen or the tab hidden
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    let onScreen = true;
    const apply = () => engine.current?.setVisible(onScreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; apply(); }, { threshold: 0.05 });
    io.observe(st);
    document.addEventListener('visibilitychange', apply);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', apply); };
  }, [ready]);

  const go = useCallback((i: number) => {
    const e = engine.current;
    if (!e) return;
    e.pause();
    setStarted(true); setWelcome(false);
    e.seekStop(Math.max(0, Math.min(N - 1, i)));
  }, [N]);

  // links from the chronicle and from outside: #on-map-<stop id or record id>
  useEffect(() => {
    const onHash = () => {
      const m = location.hash.match(/^#on-map-(.+)$/);
      if (!m) return;
      const i = index.get(decodeURIComponent(m[1]));
      if (i === undefined || !engine.current) return;
      go(i);
      stage.current?.scrollIntoView({ block: 'start', behavior: reducedRef.current ? 'auto' : 'smooth' });
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
  const step = (dir: number) => { const j = nextIn(bi, dir); if (j >= 0) go(j); };
  const toggle = () => {
    const e = engine.current;
    if (!e) return;
    if (!started || welcome) { setStarted(true); setWelcome(false); }
    if (reduced) { step(1); return; }
    if (e.isPlaying()) e.pause(); else e.play();
  };
  const begin = () => {
    setStarted(true); setWelcome(false);
    const e = engine.current;
    if (!e) return;
    e.seekStop(follow ? Math.max(0, nextIn(-1, 1)) : 0);
    if (!reduced) e.play();
  };
  const openIndex = () => { setQuery(''); dialog.current?.showModal(); };
  const pick = (i: number) => { dialog.current?.close(); go(i); };

  const onPointer = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (ev.buttons && ev.pointerType === 'mouse') return;
    const r = ev.currentTarget.getBoundingClientRect();
    engine.current?.pick(ev.clientX - r.left, ev.clientY - r.top);
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

  // the timeline: chapters as bands, a tick per stop, the regional lanes
  const bands = useMemo(() => {
    if (!timeline) return [];
    return t.chapters.map((name, c) => {
      const first = stops.findIndex((s) => s.chapter === c);
      let lastI = -1;
      stops.forEach((s, i) => { if (s.chapter === c) lastI = i; });
      if (first < 0) return null;
      return { c, name, first, x0: first / N, x1: (lastI + 1) / N, from: yearLabel(stops[first].year, lang) };
    }).filter((x): x is NonNullable<typeof x> => !!x);
  }, [timeline, stops, t.chapters, lang, N]);

  const q = fold(query.trim());
  const found = useMemo(() => stops.map((s, i) => ({ s, i })).filter(({ s, i }) => {
    if (!inTrack(i, follow)) return false;
    if (!q) return true;
    const hay = fold(`${s.title} ${s.label} ${s.kicker} ${s.record?.id ?? ''} ${s.record?.anchors.map((a) => a.name).join(' ') ?? ''} ${s.text}`);
    return q.split(/\s+/).every((w) => hay.includes(w));
  }), [stops, q, follow, inTrack]);

  const trackNames = b.tracks.map((x) => t.tracksShort[x]).join(' · ');
  const recordBlock = (r: RecordView, own: boolean) => (
    <div className="atlas__record" lang={r.lang !== lang ? r.lang : undefined}>
      {!own && <h3 className="atlas__sub">{t.record} {r.id} · {r.title}</h3>}
      {r.interpretation && (
        <p className="atlas__interp"><strong>{t.interpretation(r.interpretation)}</strong> <span lang={lang}>{t.interpretationNote}</span></p>
      )}
      {r.plate?.src && (
        <figure className="atlas__fig">
          <Image src={r.plate.src} alt="" width={r.plate.w ?? 560} height={r.plate.h ?? 380} sizes="(min-width: 1000px) 400px, 92vw" />
          <figcaption>
            <span className="atlas__role" lang={lang}>{t.plateRole[r.plate.role]}</span>
            {r.plate.caption}. {r.plate.author && <>{r.plate.author}, </>}{r.plate.licence} · <a href={r.plate.page} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
          </figcaption>
        </figure>
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
    <section className={`atlas${wide ? '' : ' is-narrow'}`} aria-label={t.mapLabel} data-mode={mode}>
      <div className={`atlas__stage${ready ? ' is-ready' : ''}${started ? ' is-started' : ''}`} ref={stage} tabIndex={-1} onKeyDown={onKey}>
        <canvas
          ref={canvas}
          className="atlas__canvas"
          role="img"
          aria-label={`${t.mapLabel}: ${b.title}, ${b.label}`}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => engine.current?.pick(-999, -999)}
        />
        <noscript><p className="atlas__msg">{t.noscript}</p></noscript>
        {!ready && !failed && <p className="atlas__msg" aria-live="polite">{t.loading}</p>}
        {failed && <p className="atlas__msg" role="alert">{t.failed}</p>}

        <div className="atlas__now" ref={nowEl} aria-hidden="true" hidden={welcome && ready}>
          <p className="atlas__chapter"><span>{ROMAN[chapter]}</span> {t.chapters[chapter]}</p>
          <p className="atlas__when">
            <span className="atlas__year" ref={yearEl}>{yearLabel(stops[0].year, lang)}</span>
            <span className="atlas__date" ref={dateEl}>{stops[0].label}</span>
          </p>
        </div>

        <div className="atlas__tools" ref={tools}>
          <button type="button" className="atlas__tool atlas__tool--wide" onClick={openIndex} aria-haspopup="dialog">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M3 8h10M3 12h6" /></svg><span>{t.index}</span>
          </button>
          <div className="atlas__seg" role="group" aria-label={`${t.globe} / ${t.flat}`}>
            <button type="button" aria-pressed={mode === 'globe'} onClick={() => setMode('globe')}>{t.globe}</button>
            <button type="button" aria-pressed={mode === 'flat'} onClick={() => setMode('flat')}>{t.flat}</button>
          </div>
          <button type="button" className="atlas__tool atlas__tool--mode" onClick={() => setMode((m) => (m === 'globe' ? 'flat' : 'globe'))}
            aria-label={mode === 'globe' ? t.flat : t.globe} title={mode === 'globe' ? t.flat : t.globe}>
            {mode === 'globe'
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2 8h12M8 3.5v9" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.8" /><path d="M2.2 8h11.6M8 2.2c2 2.2 2 9.4 0 11.6M8 2.2c-2 2.2-2 9.4 0 11.6" /></svg>}
          </button>
          <div className="atlas__zoom">
            <button type="button" className="atlas__tool" onClick={() => engine.current?.zoomBy(1.6)} aria-label={t.zoomIn} title={t.zoomIn} disabled={!ready}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
            </button>
            <button type="button" className="atlas__tool" onClick={() => engine.current?.zoomBy(1 / 1.6)} aria-label={t.zoomOut} title={t.zoomOut} disabled={!ready}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
            </button>
          </div>
          <button type="button" className="atlas__tool" onClick={() => setWelcome(true)} aria-label={t.help} title={t.help}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 6.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4M8 11.8v.2" /></svg>
          </button>
        </div>
        {free && ready && (
          <button type="button" className="atlas__recentre" onClick={() => engine.current?.recentre()}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.4" /><path d="M8 1.5v2.5M8 12v2.5M1.5 8H4M12 8h2.5" /></svg> {t.recentre}
          </button>
        )}

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
          <div className="atlas__welcome" ref={welcomeEl} role="dialog" aria-labelledby="atlas-welcome-h">
            <p className="atlas__welcome-kicker">{t.welcomeKicker} · {yearLabel(stops[0].year, lang)} – {t.todayLabel}</p>
            <h2 id="atlas-welcome-h">{t.welcomeTitle}</h2>
            <p className="atlas__welcome-text">{t.welcomeText(N)}</p>
            <div className="atlas__welcome-go">
              <button type="button" className="atlas__begin" onClick={started ? () => setWelcome(false) : begin} autoFocus>
                <span aria-hidden="true">▶</span> {started ? t.close : t.begin}
              </button>
              {!started && <button type="button" className="atlas__ghost" onClick={() => go(index.get('columbus-1') ?? 0)}>{t.jump1492}</button>}
              <button type="button" className="atlas__ghost" onClick={openIndex}>{t.browse}</button>
            </div>
            <h3 className="atlas__welcome-sub">{t.howTitle}</h3>
            <ul className="atlas__how">
              {t.how.map((h) => (
                <li key={h.k} className={`atlas__how--${h.k}`}><i aria-hidden="true" /><strong>{h.t}</strong> {h.d}</li>
              ))}
            </ul>
            <p className="atlas__welcome-hint">{wide ? `${t.hint} · ${t.keys}` : t.hintTouch}</p>
          </div>
        )}

        <div className="atlas__dock" ref={dock}>
          <div className="atlas__controls">
            <button type="button" className="atlas__btn" onClick={() => step(-1)} disabled={!ready || prevI < 0} aria-label={t.prev}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
            </button>
            <button type="button" className="atlas__btn atlas__btn--play" onClick={toggle} disabled={!ready} aria-label={reduced ? t.next : playing ? t.pause : t.play} aria-pressed={reduced ? undefined : playing}>
              {playing
                ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" /></svg>
                : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.2v9.6l7.4-4.8z" className="fill" /></svg>}
            </button>
            <button type="button" className="atlas__btn" onClick={() => step(1)} disabled={!ready || nextI < 0} aria-label={t.next}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
            </button>
            <div className="atlas__timeline">
              <div className="atlas__bands">
                {bands.map((x) => (
                  <button key={x.c} type="button" className={`atlas__band${x.c === chapter ? ' is-on' : ''}`} style={{ left: `${x.x0 * 100}%`, width: `${(x.x1 - x.x0) * 100}%` }}
                    onClick={() => go(x.first)} title={`${ROMAN[x.c]} · ${x.name} · ${x.from}`} aria-label={`${t.chapter} ${ROMAN[x.c]}: ${x.name}, ${x.from}`}>
                    <span>{ROMAN[x.c]}</span><em>{x.from}</em>
                  </button>
                ))}
              </div>
              <div className="atlas__track">
                {timeline && (
                  <div className="atlas__ticks" aria-hidden="true">
                    {stops.map((x, i) => (
                      <span key={x.id} className={`atlas__tick atlas__tick--${x.kind}${i === bi ? ' is-on' : ''}${follow && !x.tracks.includes(follow) ? ' is-out' : ''}`}
                        style={{ left: `${((i + 0.5) / N) * 100}%` }} />
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
              {wide && timeline && (
                <div className="atlas__lanes" aria-hidden="true">
                  {TRACKS.map((tr) => (
                    <div key={tr} className={`atlas__lane${follow === tr ? ' is-follow' : ''}${b.tracks.includes(tr) ? ' is-now' : ''}`}>
                      <span className="atlas__lane-name">{t.tracksShort[tr]}</span>
                      {stops.map((x, i) => (x.tracks.includes(tr) ? (
                        <i key={x.id} className={i === bi ? 'is-on' : i < bi ? 'is-past' : undefined} style={{ left: `${((i + 0.5) / N) * 100}%` }} onClick={() => go(i)} title={`${x.label} · ${x.title}`} />
                      ) : null))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="atlas__follow">
              <span className="visually-hidden">{t.follow}</span>
              <select value={follow} onChange={(e) => setFollow(e.currentTarget.value as Track | '')}>
                <option value="">{t.followAll}</option>
                {TRACKS.map((tr) => <option key={tr} value={tr}>{t.tracks[tr]}</option>)}
              </select>
            </label>
          </div>
        </div>

        <aside className={`atlas__card${sheet ? ' is-open' : ''}`} ref={card} aria-labelledby="atlas-card-h">
          {!wide && (
            <button type="button" className="atlas__handle" aria-expanded={sheet} aria-controls="atlas-card-body" onClick={() => setSheet((x) => !x)}>
              <span aria-hidden="true" /><span className="visually-hidden">{sheet ? t.readLess : t.readMore}</span>
            </button>
          )}
          <div className="atlas__card-head">
            <p className="atlas__kicker">{t.stopOf(bi + 1, N)}{trackNames && <> · {trackNames}</>}</p>
            <p className="atlas__type">{b.kicker}</p>
            <h2 id="atlas-card-h" lang={b.kind === 'record' && b.record && b.record.lang !== lang ? b.record.lang : undefined}>{b.title}</h2>
            <p className="atlas__label">{b.label}{b.record?.pending && b.kind === 'record' && <span className="atlas__pending">{t.pendingEs}</span>}</p>
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
                    <li key={m.n}><a href={`#m${m.n}`}><span>{m.n}</span> {m.title}</a> <em>{m.date}</em></li>
                  ))}
                </ul>
                {b.milestones.length > shown.length && <p className="atlas__more-ms">{t.more(b.milestones.length - shown.length)}</p>}
              </>
            )}
            {b.sources.length > 0 && <p className="atlas__src"><span>{b.sources.length > 1 ? t.sources : t.source}</span> {b.sources.join(' · ')}</p>}
          </div>
          <div className="atlas__card-foot">
            <button type="button" className="atlas__prev" onClick={() => step(-1)} disabled={!ready || prevI < 0}>← {t.prev}</button>
            <button type="button" className="atlas__next" onClick={() => (started ? step(1) : begin())} disabled={!ready || (started && nextI < 0)}>
              {started ? t.next : t.begin} →
            </button>
          </div>
        </aside>
      </div>

      <dialog className="atlas__index" ref={dialog} aria-labelledby="atlas-index-h" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="atlas__index-in">
          <div className="atlas__index-head">
            <h2 id="atlas-index-h">{t.indexTitle}</h2>
            <button type="button" className="atlas__tool" onClick={() => dialog.current?.close()} aria-label={t.close}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
            </button>
          </div>
          <div className="atlas__index-filters">
            <input type="search" value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder={t.search} aria-label={t.search} />
            <select value={follow} onChange={(e) => setFollow(e.currentTarget.value as Track | '')} aria-label={t.follow}>
              <option value="">{t.followAll}</option>
              {TRACKS.map((tr) => <option key={tr} value={tr}>{t.tracks[tr]}</option>)}
            </select>
          </div>
          <p className="atlas__index-count" aria-live="polite">{found.length ? t.results(found.length) : t.noResults}</p>
          <div className="atlas__index-list">
            {t.chapters.map((name, c) => {
              const here = found.filter(({ s }) => s.chapter === c);
              if (!here.length) return null;
              return (
                <section key={c}>
                  <h3><span>{ROMAN[c]}</span> {name}</h3>
                  <ol>
                    {here.map(({ s, i }) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => pick(i)} className={i === bi ? 'is-on' : undefined}>
                          <span className="atlas__index-date">{s.label}</span>
                          <span className="atlas__index-title" lang={s.record && s.kind === 'record' && s.record.lang !== lang ? s.record.lang : undefined}>{s.title}</span>
                          <span className="atlas__index-kind">{s.kicker.split(' · ')[0]}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>
      </dialog>
      <p className="visually-hidden" aria-live="polite">{said}</p>
    </section>
  );
}

function formatDate(iso: string, day: Intl.DateTimeFormat, month: Intl.DateTimeFormat) {
  const [y, m, d] = iso.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, d ? +d : 15));
  return (d ? day : month).format(date);
}

