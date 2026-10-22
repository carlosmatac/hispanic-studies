'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dict, type Lang } from '@/lib/i18n';

/* The reel: a film about the Institute that runs right under the title page,
   full width, silent and looping. It is graded on the page's own paper, so it
   reads as part of the page, not as a video.

   - The film never moves or changes size. Pressing it (or the label that
     follows the pointer) turns the sound on where it is; pressing again
     turns it off.
   - It only plays while it is on screen. With reduced motion it does not
     play by itself (the poster stands in); turning the sound on plays it,
     turning it off stops it again. */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;

export default function Reel({ lang, src, poster }: { lang: Lang; src: string; poster: string }) {
  const t = dict(lang).reel;
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const [visible, setVisible] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // plays while it is seen, and either motion is welcome or someone asked for the sound
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = !sound;
    if (visible && (!reduced || sound)) v.play().catch(() => { /* autoplay refused: the poster stays */ });
    else v.pause();
  }, [visible, reduced, sound]);

  // the sound is switched inside the click itself, where the browser allows it
  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    const next = !sound;
    v.muted = !next;
    if (next) v.play().catch(() => { v.muted = true; setSound(false); });
    setSound(next);
  }, [sound]);

  // the pointer carries the label over the film
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
    e.currentTarget.classList.add('is-tracking');
  };
  const onLeave = (e: React.PointerEvent<HTMLButtonElement>) => e.currentTarget.classList.remove('is-tracking');

  return (
    <section className="reel" aria-label={t.label}>
      <div ref={stage} className="reel__stage">
        <video
          ref={video}
          className="reel__loop"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload={reduced ? 'none' : 'metadata'}
          aria-label={t.label}
        />
        <button
          type="button"
          className="reel__hit"
          onClick={toggle}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          aria-pressed={sound}
          aria-label={t.soundLabel}
        >
          <span className="reel__chip" aria-hidden="true">
            <svg className="reel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
              {sound
                ? <path d="M16 9l5 6M21 9l-5 6" />
                : <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.3 6.6a7.7 7.7 0 0 1 0 10.8" />}
            </svg>
            {sound ? t.soundOff : t.soundOn}
          </span>
        </button>
      </div>
    </section>
  );
}
