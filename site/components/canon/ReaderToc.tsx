'use client';

import { useEffect, useState } from 'react';
import type { Section } from '@/lib/canon';

/* The contents of a long text, beside it on wide screens: every chapter, the
   one being read marked. Without JavaScript it is still a plain list of links. */

export default function ReaderToc({ sections, label }: { sections: Section[]; label: string }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const heads = sections.map((s) => document.getElementById(s.id)).filter((h): h is HTMLElement => !!h);
    if (!heads.length) return;
    // the chapter whose heading last crossed the upper third of the screen
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let id: string | null = null;
      for (const h of heads) if (h.getBoundingClientRect().top < line) id = h.id;
      setCurrent(id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [sections]);

  return (
    <nav className="reader__aside" aria-label={label}>
      <p className="reader__aside-h">{label}</p>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={s.id === current ? 'location' : undefined}>{s.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
