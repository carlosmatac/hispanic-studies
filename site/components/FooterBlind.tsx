'use client';

import { useEffect } from 'react';

/* The footer's blind. The page ends at the bottom of the glass; scrolling on
   lifts the glass like a blind and shows the name lying under it. As soon as
   the scroll is let go, the blind drops back: the page scrolls back to the
   bottom of the glass. While a finger is on the screen it never drops. */
export default function FooterBlind() {
  useEffect(() => {
    const foot = document.querySelector<HTMLElement>('.foot');
    const glass = foot?.querySelector<HTMLElement>('.foot__glass');
    if (!foot || !glass) return;
    let touching = false;
    let timer: number | undefined;
    const limit = () => foot.getBoundingClientRect().top + window.scrollY + glass.offsetHeight - window.innerHeight;
    const settle = () => {
      if (touching) return;
      const l = limit();
      if (l > 0 && window.scrollY > l + 1) {
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: l, behavior: still ? 'auto' : 'smooth' });
      }
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 240);
    };
    const down = () => { touching = true; window.clearTimeout(timer); };
    const up = () => { touching = false; onScroll(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    window.addEventListener('touchcancel', up, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
    };
  }, []);
  return null;
}
