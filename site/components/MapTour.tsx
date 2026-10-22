'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import type { TourCard } from '@/lib/map-tour';

interface Inset { l: number; r: number; t: number; b: number }
interface Place { name: Record<string, string>; tier: 'emersa' | 'submersa'; authors: number }
interface MapApi {
  destroy(): void;
  highlight(isos: string[]): void;
  showRoutes(ids: Set<string> | null): void;
  flyTo(isos: string[], o?: { pad?: number; ms?: number; onDone?: () => void; inset?: Inset }): void;
}

/* The Atlas map runs a tour on its own: the camera flies from stop to stop
   (rising when the way is long, then coming down), each stop lights its
   countries and routes and brings a card. It keeps moving, but it never
   holds the reader:

   - pointing at the map or the card, focusing anything in it, or touching
     it holds the tour; a few seconds after the reader lets go, it goes on;
   - the pause button stops it until play is pressed (WCAG 2.2.2);
   - it waits while the map is off screen or the tab is hidden;
   - with reduced motion it does not play by itself, and the camera cuts. */

const DWELL = 6500;           // ms on each stop once the camera has arrived
const FLIGHT = 2300;          // ms for the camera to get there
const RELEASE = 2600;         // ms after the reader lets go before it moves on
const TOUCH_RELEASE = 7000;   // after a touch there is no "leave", so wait longer

/* What lies on top of the map, as fractions of it: the cartouche on the left,
   the tour card on the right. Only what actually overlaps counts, so on
   phones (where they stack below) it is all zero. */
function covered(map: HTMLElement | null): Inset {
  const z = { l: 0, r: 0, t: 0.03, b: 0 };
  if (!map) return z;
  const m = map.getBoundingClientRect();
  if (!m.width || !m.height) return z;
  const over = (el: Element | null | undefined) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const overlaps = r.right > m.left && r.left < m.right && r.bottom > m.top && r.top < m.bottom;
    return overlaps ? r : null;
  };
  const plate = map.closest('.plate-wrap');
  const cart = over(plate?.querySelector('.cartouche'));
  const card = over(plate?.querySelector('.tour'));
  if (cart) z.l = Math.min(0.4, (cart.right - m.left) / m.width + 0.01);
  if (card) z.r = Math.min(0.45, (m.right - card.left) / m.width + 0.01);
  return z;
}

type Hold = 'hover' | 'focus' | 'touch' | 'offscreen' | 'hidden' | 'pick';

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;

export default function MapTour({ lang, cards }: { lang: Lang; cards: TourCard[] }) {
  const d = dict(lang).map;
  const t = d.tour;
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const api = useRef<MapApi | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pick, setPick] = useState<Place | null>(null);
  const [idx, setIdx] = useState(0);
  const [arrived, setArrived] = useState(false);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  // the reader's choice; until they make one, play unless motion is reduced
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reduced;
  const [holds, setHolds] = useState<Set<Hold>>(new Set());
  const releaseTimer = useRef<number>(0);

  const hold = useCallback((h: Hold, on: boolean) => {
    setHolds((prev) => {
      if (prev.has(h) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(h); else next.delete(h);
      return next;
    });
  }, []);
  // let go of the reader's holds after a pause, so the tour does not lurch on
  const releaseSoon = useCallback((ms: number, ...hs: Hold[]) => {
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => hs.forEach((h) => hold(h, false)), ms);
  }, [hold]);

  // mount the map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { drawMap, loadMapData } = await import('@/lib/atlas-map');
        const data = await loadMapData('/data');
        if (cancelled || !host.current) return;
        api.current = drawMap(host.current, data, {
          animate: true,
          onPick: (p: Place | null) => {
            setPick(p);
            if (p) { window.clearTimeout(releaseTimer.current); hold('pick', true); }
            else releaseSoon(RELEASE, 'pick');
          },
        }) as unknown as MapApi;
        setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; api.current?.destroy(); api.current = null; };
  }, [hold, releaseSoon]);

  // off screen, or in a background tab: wait
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => hold('offscreen', !e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    const vis = () => hold('hidden', document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [hold]);

  // go to the current stop
  useEffect(() => {
    const m = api.current;
    const c = cards[idx];
    if (!ready || !m || !c) return;
    setArrived(false);
    m.highlight(c.light);
    m.showRoutes(c.routes === null || c.routes === undefined ? null : new Set(c.routes));
    m.flyTo(c.frame, { pad: c.pad, ms: FLIGHT, inset: covered(host.current), onDone: () => setArrived(true) });
  }, [idx, ready, cards]);

  // and on to the next one, once arrived, if nothing holds it
  const paused = !playing || holds.size > 0;
  useEffect(() => {
    if (!ready || !arrived || paused) return;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % cards.length), DWELL);
    return () => window.clearTimeout(id);
  }, [ready, arrived, paused, idx, cards.length]);

  const goTo = (i: number) => {
    setIdx((i + cards.length) % cards.length);
    // stepping by hand holds the tour for a moment, then it continues
    hold('focus', true);
    releaseSoon(RELEASE * 2, 'focus');
  };

  // the reader's hand on the map or the card
  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => { if (e.pointerType === 'mouse') { window.clearTimeout(releaseTimer.current); hold('hover', true); } },
    onPointerLeave: (e: React.PointerEvent) => { if (e.pointerType === 'mouse') releaseSoon(RELEASE, 'hover', 'pick'); },
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') { hold('touch', true); releaseSoon(TOUCH_RELEASE, 'touch', 'pick'); } },
    onFocus: () => { window.clearTimeout(releaseTimer.current); hold('focus', true); },
    onBlur: (e: React.FocusEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) releaseSoon(RELEASE, 'focus'); },
  };

  const c = cards[idx];
  return (
    <div ref={wrap} className={`map-tour${paused ? ' is-paused' : ''}`}>
      <div ref={host} className={`tour-map${failed ? ' is-failed' : ''}`} {...handlers}>{failed ? d.failed : null}</div>

      <aside className="tour" aria-label={t.label} aria-roledescription="carousel" {...handlers}>
        <div className="tour__card" aria-live={paused ? 'polite' : 'off'}>
          {pick ? (
            <div className="tour__body tour__body--place">
              <p className="tour__kicker">{pick.tier === 'emersa' ? d.emersa : d.submersa}</p>
              <h2 className="tour__title">{pick.name[lang] || pick.name.en}</h2>
              <p className="tour__text">{d.inCorpus}: {d.author(pick.authors)}</p>
            </div>
          ) : c && (
            <div className="tour__body" key={c.id}>
              {c.media && (
                <figure className={`tour__media tour__media--${c.media.kind}`}>
                  {c.media.kind === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element -- small, already sized
                    <img src={c.media.src} alt="" loading="lazy" />
                  )}
                  {c.media.kind === 'video' && (
                    <video src={c.media.src} poster={c.media.poster} muted loop playsInline autoPlay={!reduced} preload="none" />
                  )}
                  {c.media.kind === 'pending' && <span className="tour__pending">[{t.pending} · {c.mediaText}]</span>}
                  {c.media.kind !== 'pending' && c.mediaText && <figcaption>{c.mediaText}</figcaption>}
                </figure>
              )}
              <p className="tour__kicker">{c.kicker}</p>
              <h2 className="tour__title">{c.title}</h2>
              <p className="tour__text">{c.text}</p>
              <a className="tour__link" href={c.link.href}>{c.link.label} →</a>
            </div>
          )}
        </div>

        <div className="tour__controls">
          <button type="button" className="tour__btn" onClick={() => goTo(idx - 1)} aria-label={t.prev}>‹</button>
          <button type="button" className="tour__btn tour__btn--play" onClick={() => setChoice(!playing)} aria-label={playing ? t.pause : t.play} aria-pressed={!playing}>
            {playing ? <span className="tour__pause" aria-hidden="true" /> : <span className="tour__play" aria-hidden="true" />}
          </button>
          <button type="button" className="tour__btn" onClick={() => goTo(idx + 1)} aria-label={t.next}>›</button>
          <ol className="tour__dots">
            {cards.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={i === idx ? 'is-on' : undefined} onClick={() => goTo(i)} aria-label={`${t.goTo} ${i + 1}`} aria-current={i === idx ? 'step' : undefined} />
              </li>
            ))}
          </ol>
          {/* how long until the next stop */}
          <span className={`tour__clock${arrived && !paused ? ' is-running' : ''}`} key={`${idx}-${arrived}-${paused}`} style={{ '--dwell': `${DWELL}ms` } as React.CSSProperties} aria-hidden="true" />
        </div>
      </aside>
    </div>
  );
}
