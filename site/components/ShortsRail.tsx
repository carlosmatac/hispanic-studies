'use client';

import { useRef } from 'react';

/* A horizontal rail that scrolls by touch, trackpad or keyboard on its own;
   the arrows are for mouse users. Smooth only when motion is allowed. */
export default function ShortsRail({ label, prev, next, children }: { label: string; prev: string; next: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: still ? 'auto' : 'smooth' });
  };
  return (
    <div className="rail">
      <ul ref={ref} className="rail__track" tabIndex={0} aria-label={label}>{children}</ul>
      <div className="rail__nav">
        <button type="button" onClick={() => go(-1)} aria-label={prev}>←</button>
        <button type="button" onClick={() => go(1)} aria-label={next}>→</button>
      </div>
    </div>
  );
}
