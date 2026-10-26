'use client';

import { useEffect } from 'react';

/* The footer's blind. The page ends at the bottom of the glass; scrolling on
   lifts the glass like a blind and shows the name lying under it.

   Lifting it is heavy: past the bottom of the glass, each turn of the wheel
   or move of the finger lifts it less than it would scroll the page, the
   higher it is the less, and the motion is damped. Let go and it falls back
   by its own weight (a quick smooth scroll to the bottom of the glass). While
   a finger is down it never falls.

   Only a real push holds it up. A touchpad keeps sending small, fading wheel
   events for a second or two after the fingers leave it (inertia); those
   neither hold the blind up nor stop it falling, or it would hang up there. */

const WAIT = 240; // ms of stillness before the blind falls
const DAMP = 0.14; // how much of the way to the target the blind moves each frame
const give = (p: number) => 0.12 + 0.6 * Math.pow(1 - p, 1.2); // share of the scroll that lifts it, at height p (0..1)

export default function FooterBlind() {
  useEffect(() => {
    const foot = document.querySelector<HTMLElement>('.foot');
    const glass = foot?.querySelector<HTMLElement>('.foot__glass');
    if (!foot || !glass) return;
    const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const limit = () => foot.getBoundingClientRect().top + window.scrollY + glass.offsetHeight - window.innerHeight;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;

    let touching = false;
    let lastY = 0;
    let timer: number | undefined;
    let frame = 0;
    let target = -1; // where the lifted blind is heading, -1 when not lifting
    let pushed = 0; // when the blind was last really pushed up
    let lastD = 0; // the previous wheel step, to tell a push from inertia
    let falling = false;
    let calm = false; // it has fallen, and only a new push may lift it again

    const halt = () => { if (frame) cancelAnimationFrame(frame); frame = 0; target = -1; };
    const fall = () => {
      timer = undefined;
      if (touching) return;
      const quiet = performance.now() - pushed;
      if (quiet < WAIT) { timer = window.setTimeout(fall, WAIT - quiet); return; }
      halt();
      const to = limit();
      if (to > 0 && window.scrollY > to + 1) {
        falling = true;
        calm = true;
        window.scrollTo({ top: to, behavior: still() ? 'auto' : 'smooth' });
      }
    };
    // one timer at a time: later events never put the fall off; fall() itself
    // waits until WAIT ms after the last real push
    const later = () => {
      if (timer === undefined) timer = window.setTimeout(fall, WAIT);
    };
    const run = () => {
      const y = window.scrollY;
      const next = y + (target - y) * DAMP;
      window.scrollTo({ top: Math.abs(target - next) < 0.5 ? target : next, behavior: 'instant' });
      // stop when it arrives, or when the page will not go further (its very end)
      if (Math.abs(target - window.scrollY) >= 0.5 && Math.abs(window.scrollY - y) >= 0.2) frame = requestAnimationFrame(run);
      else { frame = 0; target = -1; later(); }
    };
    // push the blind up by `d` px of scrolling; returns false when the page should scroll as usual
    const lift = (d: number, push = true) => {
      const l = limit();
      const from = target >= 0 ? target : window.scrollY;
      if (l <= 0 || d <= 0 || from + d <= l) return false;
      const room = Math.max(1, max() - l);
      let y = Math.max(from, l);
      let rest = d - Math.max(0, l - from); // the part below the bottom of the glass scrolls normally
      while (rest > 0) { // spend it in small steps, so the resistance grows as it rises
        const s = Math.min(rest, 8);
        y += s * give(Math.min(1, (y - l) / room));
        rest -= s;
      }
      const was = target >= 0 ? target : window.scrollY;
      target = Math.min(max(), y);
      if (push && target > was + 0.5) pushed = performance.now(); // inertia may still lift it, but never holds it up
      if (still()) { window.scrollTo({ top: target, behavior: 'instant' }); target = -1; }
      else if (!frame) frame = requestAnimationFrame(run);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      // inertia: the same direction, no bigger than the step before, and small
      const fading = d > 0 && lastD > 0 && d <= lastD && d < 40;
      lastD = d;
      if (falling && d > 0 && (fading || d < 40)) { e.preventDefault(); return; } // let it fall
      if (calm && d > 0 && fading) { e.preventDefault(); return; } // the tail of a flick after it fell
      falling = false;
      calm = false;
      if (d > 0 && lift(d, !fading)) e.preventDefault();
      else if (d < 0) halt();
      later();
    };
    const onTouchStart = (e: TouchEvent) => { touching = true; falling = false; lastY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const d = lastY - y; // finger up = page down = lifting
      lastY = y;
      if (d > 0 && lift(d)) e.preventDefault();
    };
    const onTouchEnd = () => { touching = false; later(); };
    const onScroll = () => {
      if (falling && window.scrollY <= limit() + 1) falling = false;
      if (!frame && !falling) later();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return null;
}
