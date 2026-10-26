'use client';

import { useEffect } from 'react';

/* The footer's blind. The page ends at the bottom of the glass; scrolling on
   lifts the glass like a blind and shows the name lying under it. When the
   scroll is let go, the blind drops back slowly (the page eases back to the
   bottom of the glass). Touching the wheel or the screen again stops it where
   it is; while a finger is down it never drops. */

const WAIT = 420; // ms of stillness before the blind drops
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease-in-out cubic

export default function FooterBlind() {
  useEffect(() => {
    const foot = document.querySelector<HTMLElement>('.foot');
    const glass = foot?.querySelector<HTMLElement>('.foot__glass');
    if (!foot || !glass) return;
    let touching = false;
    let timer: number | undefined;
    let frame = 0;
    let dropping = false;
    const limit = () => foot.getBoundingClientRect().top + window.scrollY + glass.offsetHeight - window.innerHeight;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      dropping = false;
    };
    const drop = () => {
      if (touching) return;
      const to = limit();
      const from = window.scrollY;
      if (to <= 0 || from <= to + 1) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: to, behavior: 'instant' });
        return;
      }
      // the further it was lifted, the longer it takes to fall: 0.8 to 1.4 s
      const dur = Math.min(1400, 800 + (from - to) * 0.9);
      const t0 = performance.now();
      dropping = true;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        window.scrollTo({ top: from + (to - from) * ease(t), behavior: 'instant' });
        if (t < 1 && dropping) frame = requestAnimationFrame(step);
        else stop();
      };
      frame = requestAnimationFrame(step);
    };
    const onScroll = () => {
      if (dropping) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(drop, WAIT);
    };
    const interrupt = () => { stop(); onScroll(); };
    const down = () => { touching = true; stop(); window.clearTimeout(timer); };
    const up = () => { touching = false; onScroll(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    window.addEventListener('touchcancel', up, { passive: true });
    return () => {
      stop();
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('keydown', interrupt);
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
    };
  }, []);
  return null;
}
