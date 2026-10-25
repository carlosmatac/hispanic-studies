'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { PILLAR_LINKS, type PillarKey, type Work } from '@/lib/content';

/* The three pillars hold up the Institute (redesigned 2026-10-25).

   The whole width of the page is a temple: an entablature with the
   Institute's name on the architrave and its six works in the frieze, held up
   by three columns. Each shaft is a painting in full colour, shaded round and
   fluted so it reads as a column. Pointing at a column lights the works that
   rest on it; opening it shows a popup with what rests on it.

   Everything is HTML and CSS: no plate to measure, it scales to any width. */

const WORKS: Work[] = ['atlas', 'canon', 'books', 'watch', 'read', 'community'];
const KEYS: PillarKey[] = ['mestizaje', 'catolicismo', 'lengua'];
const ROMAN = ['I', 'II', 'III'];
const IMG: Record<PillarKey, { src: string; w: number; h: number; pos: string }> = {
  mestizaje: { src: '/art/pillars/mestizaje.jpg', w: 1351, h: 1800, pos: '50% 40%' },
  catolicismo: { src: '/art/pillars/catolicismo.jpg', w: 1201, h: 1800, pos: '50% 30%' },
  lengua: { src: '/art/pillars/lengua.jpg', w: 1021, h: 1600, pos: '50% 60%' },
};

const RESTS: Record<PillarKey, Set<Work>> = Object.fromEntries(
  KEYS.map((k) => [k, new Set<Work>(['books', ...PILLAR_LINKS[k].map((l) => l.work), ...(k === 'lengua' ? (['atlas'] as Work[]) : [])])]),
) as Record<PillarKey, Set<Work>>;

export default function Temple({ lang, counts }: { lang: Lang; counts: { milestones: number; authors: number; videos: number; essays: number } }) {
  const d = dict(lang);
  const t = d.pillars;
  const box = useRef<HTMLDialogElement>(null);
  const [hover, setHover] = useState<PillarKey | null>(null);
  const [open, setOpen] = useState<PillarKey | null>(null);
  const lit = hover ?? open;
  const href: Record<Work, string> = { atlas: `/${lang}/atlas`, canon: `/${lang}/canon`, books: '#books', watch: '#watch', read: '#read', community: '#community' };
  const local = (h: string) => (h.startsWith('/') ? `/${lang}${h}` : h);
  const item = open ? t.items.find((i) => i.key === open)! : null;

  const show = (k: PillarKey) => {
    setOpen(k);
    if (box.current && !box.current.open) box.current.showModal();
  };
  // a link inside the popup closes it first, so in-page anchors land on a free page
  const leave = () => box.current?.close();

  return (
    <div className={`temple${lit ? ' has-lit' : ''}`}>
      {/* the entablature: the six works in the frieze, the name on the architrave */}
      <div className="temple__ent">
        <nav className="temple__frieze" aria-label={t.architrave}>
          {WORKS.map((w) => (
            <a key={w} href={href[w]} className={`temple__metope${lit && RESTS[lit].has(w) ? ' is-lit' : ''}`}>
              <span>{t.works[w]}</span>
            </a>
          ))}
        </nav>
        <p className="temple__arch">{t.architrave}</p>
      </div>

      {/* the three columns */}
      <div className="temple__cols">
        {t.items.map((p, i) => {
          const k = p.key as PillarKey;
          const img = IMG[k];
          return (
            <button
              key={k}
              type="button"
              className={`col${lit === k ? ' is-lit' : ''}`}
              onMouseEnter={() => setHover(k)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(k)}
              onBlur={() => setHover(null)}
              onClick={() => show(k)}
              aria-haspopup="dialog"
            >
              <span className="col__capital" aria-hidden="true"><i /><i /><i /></span>
              <span className="col__shaft">
                <Image src={img.src} alt="" width={img.w} height={img.h} sizes="(max-width: 760px) 34vw, 33vw" style={{ objectPosition: img.pos }} />
                <span className="col__round" aria-hidden="true" />
                <span className="col__label">
                  <span className="col__n">{ROMAN[i]}</span>
                  <span className="col__name">{p.name}</span>
                  <span className="col__sub">{p.sub}</span>
                  <span className="col__open">{t.open} <i aria-hidden="true">+</i></span>
                </span>
              </span>
              <span className="col__base" aria-hidden="true"><i /><i /></span>
            </button>
          );
        })}
      </div>
      <div className="temple__steps" aria-hidden="true"><i /><i /><i /></div>

      {/* the popup: what rests on the pillar */}
      <dialog ref={box} className="pop" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === e.currentTarget) leave(); }} aria-labelledby="pop-h">
        {item && open && (
          <div className="pop__sheet">
            <figure className="pop__art">
              <Image src={IMG[open].src} alt="" width={IMG[open].w} height={IMG[open].h} sizes="(max-width: 760px) 100vw, 40vw" style={{ objectPosition: IMG[open].pos }} />
              <figcaption>{t.credits[open]}</figcaption>
            </figure>
            <div className="pop__body">
              <button type="button" className="pop__close" onClick={leave} aria-label={t.close}>×</button>
              <p className="pop__kicker">{t.pillar} {ROMAN[KEYS.indexOf(open)]} · {t.rests}</p>
              <h3 id="pop-h" className="pop__name">{item.name}</h3>
              <p className="pop__sub">{item.sub}</p>
              <ul className="pop__list">
                <li>
                  <a href="#books" onClick={leave}>
                    <span className="pop__work">{t.works.books} · {t.series}</span>
                    <span className="pop__title">{item.n}</span>
                    <span className="pop__meta">De Indiis Editions</span>
                  </a>
                </li>
                {open === 'lengua' && (
                  <li>
                    <a href={href.atlas}>
                      <span className="pop__work">{t.works.atlas}</span>
                      <span className="pop__title">{d.map.title}</span>
                      <span className="pop__meta">{counts.milestones} {t.worksSub.milestones}</span>
                    </a>
                  </li>
                )}
                {PILLAR_LINKS[open].map((l) => (
                  <li key={l.href}>
                    <a href={local(l.href)} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      <span className="pop__work">{t.works[l.work]}{l.external ? ' ↗' : ''}</span>
                      <span className="pop__title">{l.title}</span>
                      {l.meta && <span className="pop__meta">{l.work === 'watch' ? `${l.meta} ${d.watch.views}` : l.meta}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
