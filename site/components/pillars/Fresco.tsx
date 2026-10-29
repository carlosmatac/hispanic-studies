'use client';

import { useState } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { PILLAR_LINKS, type PillarKey } from '@/lib/content';

/* The three pillars (redesigned 2026-10-26, after Carlos's mock-ups): one
   fresco across the full width, made of three public-domain paintings melted
   into each other (tools/build-fresco.py), and under it the three pillars as
   tabs. Opening one unfolds a panel with its painting and what rests on it. */

const KEYS: PillarKey[] = ['mestizaje', 'catolicismo', 'lengua'];
const ROMAN = ['I', 'II', 'III'];
const DETAIL: Record<PillarKey, { w: number; h: number }> = {
  mestizaje: { w: 777, h: 995 },
  catolicismo: { w: 1400, h: 1400 },
  lengua: { w: 1132, h: 1065 },
};

export default function Fresco({ lang, counts }: { lang: Lang; counts: { milestones: number } }) {
  const d = dict(lang);
  const t = d.pillars;
  const [open, setOpen] = useState<PillarKey | null>(null);
  const [hover, setHover] = useState<PillarKey | null>(null);
  const lit = hover ?? open;
  const local = (h: string) => (h.startsWith('/') ? `/${lang}${h}` : h);
  const toggle = (k: PillarKey) => setOpen((o) => (o === k ? null : k));
  const i = open ? KEYS.indexOf(open) : -1;
  const item = open ? t.items[i] : null;

  const rows = open
    ? [
        { work: `${t.works.books} · ${t.series}`, title: item!.n, meta: 'De Indiis Editions', href: '#books', external: false },
        ...(open === 'lengua' ? [{ work: t.works.atlas, title: d.map.title, meta: `${counts.milestones} ${t.worksSub.milestones}`, href: `/${lang}/atlas`, external: false }] : []),
        ...PILLAR_LINKS[open].map((l) => ({
          work: t.works[l.work],
          title: l.title,
          meta: l.meta ? (l.work === 'watch' ? `${l.meta} ${d.watch.views}` : l.meta) : '',
          href: local(l.href),
          external: !!l.external,
        })),
      ]
    : [];

  return (
    <div className={`fresco${lit ? ' has-lit' : ''}`} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(null); }}>
      <div className="fresco__band">
        <Image src="/art/pillars/fresco.jpg" alt="" width={3200} height={1000} sizes="100vw" />
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`fresco__zone fresco__zone--${k}${lit === k ? ' is-lit' : ''}`}
            onMouseEnter={() => setHover(k)}
            onMouseLeave={() => setHover(null)}
            onClick={() => toggle(k)}
          />
        ))}
      </div>
      <p className="fresco__credit mono">{t.frescoCredit}</p>

      <div className="fresco__tabs">
        {t.items.map((p, j) => {
          const k = KEYS[j];
          return (
            <button
              key={k}
              type="button"
              className={`ftab${open === k ? ' is-open' : ''}${lit === k ? ' is-lit' : ''}`}
              aria-expanded={open === k}
              aria-controls="pillar-panel"
              onClick={() => toggle(k)}
              onMouseEnter={() => setHover(k)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(k)}
              onBlur={() => setHover(null)}
            >
              <span className="ftab__n">{ROMAN[j]}</span>
              <span className="ftab__name">{p.name}</span>
              <span className="ftab__sign" aria-hidden="true">{open === k ? '−' : '+'}</span>
            </button>
          );
        })}
      </div>

      <div
        id="pillar-panel"
        className="fpanel"
        role="region"
        aria-labelledby={open ? 'pillar-panel-h' : undefined}
        hidden={!open}
      >
        {open && item && (
          <div className="fpanel__sheet" key={open}>
            <figure className="fpanel__art">
              <Image src={`/art/pillars/${open}-detail.jpg`} alt="" width={DETAIL[open].w} height={DETAIL[open].h} sizes="(max-width: 900px) 100vw, 46vw" />
              <figcaption>{t.credits[open]}</figcaption>
            </figure>
            <div className="fpanel__body">
              <button type="button" className="fpanel__close" onClick={() => setOpen(null)}>
                {t.close} <span aria-hidden="true">×</span>
              </button>
              <p className="fpanel__kicker">{ROMAN[i]} / {item.name}</p>
              <h3 id="pillar-panel-h" className="fpanel__h">{t.heads[open]}</h3>
              <p className="fpanel__sub">{item.sub}</p>
              <p className="fpanel__label">{t.explore}</p>
              <ul className="fpanel__list">
                {rows.map((r) => (
                  <li key={r.href + r.title}>
                    <a href={r.href} {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      <span className="frow__work">{r.work}</span>
                      <span className="frow__title">{r.title}</span>
                      <span className="frow__meta">{r.meta}</span>
                      <span className="frow__go" aria-hidden="true">{r.external ? '↗' : '→'}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
