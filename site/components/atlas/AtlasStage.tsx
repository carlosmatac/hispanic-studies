'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import type { Chronicle } from '@/lib/atlas-chronicle';
import type { Engine, FrameInfo, HitInfo } from '@/lib/atlas-engine';

/* The Atlas stage (issue #71): the dark chart (lib/atlas-engine.ts) with the
   year over it, the controls under it and the card that tells each beat.

   It never runs by itself: the reader sets sail, pauses, steps or scrubs (as
   Beltrán asked: a timeline you step through, not an open map). The clock
   waits while the stage is off screen. With reduced motion there is no play:
   each step shows the beat finished, and the camera cuts.

   Everything on the card is also in the chronicle under the stage
   (components/atlas/Chronicle.tsx), which works without this script. */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;
const WIDE = '(min-width: 1000px)';
const subscribeWide = (cb: () => void) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getWide = () => window.matchMedia(WIDE).matches;

const TICK_LABELS = new Set(['open', 'magellan', 'legazpi', 'era-1750', 'today']);

export default function AtlasStage({ lang, chronicle }: { lang: Lang; chronicle: Chronicle }) {
  const t = dict(lang).atlas;
  const { beats } = chronicle;
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const yearEl = useRef<HTMLSpanElement>(null);
  const dateEl = useRef<HTMLSpanElement>(null);
  const engine = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bi, setBi] = useState(0);
  const [stop, setStop] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [tip, setTip] = useState<HitInfo | null>(null);
  const [timeline, setTimeline] = useState<{ total: number; starts: number[]; durs: number[] } | null>(null);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => true);
  const reducedRef = useRef(reduced);
  const last = useRef({ bi: -1, stop: -1, year: '', date: '' });

  const fmt = useMemo(() => ({
    day: new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
    month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }), [lang]);

  const onFrame = useCallback((f: FrameInfo) => {
    const b = beats[f.beat];
    if (range.current && document.activeElement !== range.current) range.current.value = String(f.s);
    let year = b.label, date = '';
    if (b.kind === 'voyage') {
      const d = new Date(f.day * 864e5);
      year = String(d.getUTCFullYear());
      date = f.voyageDay ? fmt.month.format(d) : fmt.day.format(d);
    }
    const l = last.current;
    if (year !== l.year && yearEl.current) { yearEl.current.textContent = year; l.year = year; }
    if (date !== l.date && dateEl.current) { dateEl.current.textContent = date; l.date = date; }
    if (range.current) range.current.setAttribute('aria-valuetext', `${year} · ${b.title}`);
    if (f.beat !== l.bi) { l.bi = f.beat; setBi(f.beat); }
    if (f.stop !== l.stop) { l.stop = f.stop; setStop(f.stop); }
    setPlaying(f.playing);
  }, [beats, fmt]);

  // the engine: created once, fed the reader's settings
  useEffect(() => {
    if (!canvas.current) return;
    let alive = true;
    let eng: Engine | null = null;
    (async () => {
      const { createAtlasEngine } = await import('@/lib/atlas-engine');
      if (!alive || !canvas.current) return;
      eng = createAtlasEngine(canvas.current, chronicle, {
        lang, reduced: reducedRef.current, seaNames: t.seas,
        onFrame, onHover: setTip,
        onReady: () => alive && setReady(true),
        onError: () => alive && setFailed(true),
      });
      engine.current = eng;
      setTimeline({ total: eng.total, starts: eng.starts, durs: eng.durs });
      document.documentElement.classList.add('has-atlas');
    })();
    return () => { alive = false; eng?.destroy(); engine.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { reducedRef.current = reduced; engine.current?.setReduced(reduced); }, [reduced]);

  // what covers the chart: the card on wide screens, the controls always
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const measure = () => {
      const s = st.getBoundingClientRect();
      const c = card.current?.getBoundingClientRect();
      const k = controls.current?.getBoundingClientRect();
      const r = c && wide && c.left < s.right && c.right > s.left && c.top < s.bottom ? s.right - c.left + 12 : 0;
      const b = k && k.top < s.bottom && k.bottom > s.top ? s.bottom - k.top + 8 : 0;
      engine.current?.setInset({ l: wide ? 24 : 0, r, t: wide ? 90 : 64, b });
      engine.current?.resize();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    if (card.current) ro.observe(card.current);
    return () => ro.disconnect();
  }, [wide, ready]);

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

  // links from the chronicle: #on-map-<beat id>
  useEffect(() => {
    const go = () => {
      const m = location.hash.match(/^#on-map-(.+)$/);
      if (!m) return;
      const i = beats.findIndex((b) => b.id === m[1]);
      if (i < 0 || !engine.current) return;
      engine.current.pause();
      engine.current.seekBeat(i);
      setStarted(true);
      stage.current?.scrollIntoView({ block: 'start', behavior: reducedRef.current ? 'auto' : 'smooth' });
    };
    window.addEventListener('hashchange', go);
    if (ready) go();
    return () => window.removeEventListener('hashchange', go);
  }, [ready, beats]);

  const step = (dir: number) => {
    const e = engine.current;
    if (!e) return;
    e.pause();
    setStarted(true);
    e.seekBeat(Math.max(0, Math.min(beats.length - 1, bi + dir)));
  };
  const toggle = () => {
    const e = engine.current;
    if (!e) return;
    setStarted(true);
    if (reduced) { step(1); return; }
    if (e.isPlaying()) e.pause(); else e.play();
  };

  const onPointer = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    engine.current?.pick(ev.clientX - r.left, ev.clientY - r.top);
  };

  const b = beats[bi];
  const voyage = b.voyage !== undefined ? chronicle.voyages[b.voyage] : undefined;
  const stops = voyage ? voyage.route.filter((w) => w.name) : [];
  const shown = b.milestones.slice(0, 3);

  return (
    <section className="voyage" aria-label={t.mapLabel}>
      <div className={`voyage__stage${ready ? ' is-ready' : ''}`} ref={stage}>
        <canvas
          ref={canvas}
          className="voyage__canvas"
          role="img"
          aria-label={`${t.mapLabel}: ${b.title}, ${b.label}`}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setTip(null)}
        />
        <noscript><p className="voyage__msg">{t.noscript}</p></noscript>
        {!ready && !failed && <p className="voyage__msg" aria-live="polite">{t.loading}</p>}
        {failed && <p className="voyage__msg" role="alert">{t.failed}</p>}

        <p className="voyage__when" aria-hidden="true">
          <span className="voyage__year" ref={yearEl}>1492</span>
          <span className="voyage__date" ref={dateEl} />
        </p>

        {tip && (
          <div className="voyage__tip" style={{ left: tip.x, top: tip.y }} role="status">
            {tip.date && <span className="voyage__tip-date">{tip.date}</span>}
            <strong>{tip.title}</strong>
            {tip.text && <span>{tip.text}</span>}
          </div>
        )}

        {ready && !started && bi === 0 && (
          <div className="voyage__start">
            <button type="button" className="voyage__sail" onClick={toggle}>
              <span aria-hidden="true">▶</span> {reduced ? t.begin : t.start}
            </button>
            <p>{t.startHint}</p>
          </div>
        )}

        <div className="voyage__controls" ref={controls}>
          <button type="button" className="voyage__btn" onClick={() => step(-1)} disabled={bi === 0} aria-label={t.prev}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
          </button>
          <button type="button" className="voyage__btn voyage__btn--play" onClick={toggle} aria-label={reduced ? t.next : playing ? t.pause : t.play} aria-pressed={reduced ? undefined : playing}>
            {playing
              ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" /></svg>
              : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" className="fill" /></svg>}
          </button>
          <button type="button" className="voyage__btn" onClick={() => step(1)} disabled={bi === beats.length - 1} aria-label={t.next}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>
          <div className="voyage__track">
            {timeline && (
              <div className="voyage__ticks" aria-hidden="true">
                {beats.map((x, i) => (
                  <span
                    key={x.id}
                    className={`voyage__tick voyage__tick--${x.kind}${i === bi ? ' is-on' : ''}`}
                    style={{ left: `${(timeline.starts[i] / timeline.total) * 100}%`, width: x.kind === 'voyage' ? `${(timeline.durs[i] / timeline.total) * 100}%` : undefined }}
                  >
                    {TICK_LABELS.has(x.id) && <em>{x.kind === 'today' ? x.label : x.label.slice(0, 4)}</em>}
                  </span>
                ))}
              </div>
            )}
            <input
              ref={range}
              type="range"
              min={0}
              max={timeline?.total ?? 1}
              step={0.05}
              defaultValue={0}
              aria-label={t.scrub}
              disabled={!ready}
              onChange={(e) => { setStarted(true); engine.current?.pause(); engine.current?.seek(Number(e.currentTarget.value)); }}
            />
          </div>
          <span className="voyage__count">{t.beatOf(bi + 1, beats.length)}</span>
        </div>
      </div>

      <aside className="voyage__card" ref={card} aria-labelledby="voyage-card-h">
        <p className="voyage__kicker">{b.kicker}</p>
        <h2 id="voyage-card-h">{b.title}</h2>
        {b.image && (
          <figure className="voyage__fig">
            <Image src={b.image.src} alt="" width={640} height={400} sizes="380px" />
            <figcaption>{b.image.credit}</figcaption>
          </figure>
        )}
        <p className="voyage__text">{b.text}</p>
        {(b.who || b.ships) && (
          <dl className="voyage__meta">
            {b.who && <><dt>{t.who}</dt><dd>{b.who}</dd></>}
            {b.ships && <><dt>{t.ships}</dt><dd>{b.ships}</dd></>}
          </dl>
        )}
        {stops.length > 0 && (
          <>
            <h3 className="voyage__sub">{t.log}</h3>
            <ol className="voyage__log">
              {stops.map((w, k) => (
                <li key={`${w.name}${w.date}`} className={k < stop ? 'is-past' : k === stop ? 'is-now' : 'is-ahead'}>
                  <span className="voyage__log-date">{w.date && formatDate(w.date, fmt.day, fmt.month)}</span>
                  <span className="voyage__log-name">{w.name}</span>
                  {k <= stop && <span className="voyage__log-text">{w.log}</span>}
                </li>
              ))}
            </ol>
          </>
        )}
        {b.note && <p className="voyage__note">{b.note}</p>}
        {shown.length > 0 && (
          <>
            <h3 className="voyage__sub">{t.milestones}</h3>
            <ul className="voyage__ms">
              {shown.map((m) => (
                <li key={m.n}><a href={`#m${m.n}`}><span>{m.n}</span> {m.title}</a> <em>{m.date}</em></li>
              ))}
            </ul>
            {b.milestones.length > shown.length && <p className="voyage__more">{t.more(b.milestones.length - shown.length)}</p>}
          </>
        )}
        <p className="voyage__src"><span>{b.sources.length > 1 ? t.sources : t.source}</span> {b.sources.join(' · ')}</p>
      </aside>
      <p className="visually-hidden" aria-live="polite">{started ? `${b.label}. ${b.title}` : ''}</p>
    </section>
  );
}

function formatDate(iso: string, day: Intl.DateTimeFormat, month: Intl.DateTimeFormat) {
  const [y, m, d] = iso.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, d ? +d : 15));
  return (d ? day : month).format(date);
}
