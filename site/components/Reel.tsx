'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dict, type Lang } from '@/lib/i18n';

/* The reel: a film about the Institute that runs right under the title page,
   full width, silent and looping. It is graded on the page's own paper, so
   until someone presses play it reads as part of the page, not as a video.

   - Pressing it (or the "play" label that follows the pointer) opens the
     same film from the start, with sound, in a contained player.
   - Clicking outside the player, Esc or the close button returns to the
     silent loop.
   - The loop only plays while it is on screen; with reduced motion it does
     not play by itself (the poster stands in) and the player still works. */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getRM = () => window.matchMedia(RM).matches;

export default function Reel({ lang, src, poster }: { lang: Lang; src: string; poster: string }) {
  const t = dict(lang).reel;
  const loop = useRef<HTMLVideoElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeRM, getRM, () => false);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  // the loop plays only while it is seen, nothing is open, and motion is welcome
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const v = loop.current;
    if (!v) return;
    if (visible && !open && !reduced) v.play().catch(() => { /* autoplay refused: the poster stays */ });
    else v.pause();
  }, [visible, open, reduced]);

  const play = useCallback(() => {
    const d = dialog.current, f = film.current;
    if (!d || !f) return;
    d.showModal();
    setOpen(true);
    f.currentTime = 0;
    f.muted = false;
    f.play().catch(() => { /* the controls are there */ });
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);

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
          ref={loop}
          className="reel__loop"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload={reduced ? 'none' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
        />
        <button type="button" className="reel__hit" onClick={play} onPointerMove={onMove} onPointerLeave={onLeave} aria-label={t.playLabel}>
          <span className="reel__chip" aria-hidden="true"><i className="reel__tri" />{t.play}</span>
        </button>
      </div>

      <dialog
        ref={dialog}
        className="reel__dialog"
        aria-label={t.label}
        onClose={() => { film.current?.pause(); setOpen(false); }}
        // a click on the backdrop lands on the dialog itself
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="reel__frame">
          <video ref={film} className="reel__film" src={src} poster={poster} controls playsInline preload="none" />
          <button type="button" className="reel__close" onClick={close}>{t.close} <span aria-hidden="true">✕</span></button>
        </div>
      </dialog>
    </section>
  );
}
