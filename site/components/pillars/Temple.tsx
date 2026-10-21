'use client';

import { useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { PILLAR_LINKS, type PillarKey, type Work } from '@/lib/content';

/* The three pillars hold up the Institute.

   A Doric portico after Vignola: the cornice, a frieze whose metopes are the
   Institute's works (Atlas, Canon, Books, Watch, Read, Community) between
   triglyphs, an architrave carrying its name; three columns whose shafts are
   the three words; three steps. The columns stand under triglyphs 1, 3 and 5,
   as a Doric frieze requires.

   Choosing a pillar (hover, focus, tap) lights the works that rest on it and
   lists them below, with real titles and links. */

const WORKS: Work[] = ['atlas', 'canon', 'books', 'watch', 'read', 'community'];
const KEYS: PillarKey[] = ['mestizaje', 'catolicismo', 'lengua'];

// which works rest on each pillar: those with a link, plus the book series every pillar has
const RESTS: Record<PillarKey, Set<Work>> = Object.fromEntries(
  KEYS.map((k) => [k, new Set<Work>(['books', ...PILLAR_LINKS[k].map((l) => l.work), ...(k === 'lengua' ? (['atlas'] as Work[]) : [])])]),
) as Record<PillarKey, Set<Work>>;

/* A Doric shaft drawn as an engraving: a slight entasis, and hatching lines
   that crowd toward the edges to give it its roundness. Stretched to the
   shaft's box; strokes keep their weight. */
const N_HATCH = 26;
const HATCH = Array.from({ length: N_HATCH }, (_, i) => 0.5 - 0.5 * Math.cos((Math.PI * (i + 0.5)) / N_HATCH));
function Shaft() {
  // the outline narrows to 5/6 at the top, bulging a little a third of the way up
  const L = 'M4 100 C3 66 6 30 12 0', R = 'M96 100 C97 66 94 30 88 0';
  return (
    <svg className="col__shaft-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g className="col__hatch">
        {HATCH.map((x, i) => {
          const xb = 4 + x * 92, xt = 12 + x * 76;
          const w = Math.abs(x - 0.5) * 2;          // 0 at the axis, 1 at the edge
          return <path key={i} d={`M${xb} 100 L${xt} 0`} style={{ opacity: 0.15 + 0.55 * w * w }} />;
        })}
      </g>
      <path className="col__edge" d={L} />
      <path className="col__edge" d={R} />
    </svg>
  );
}

// Doric capital: abacus, echinus, three annulets, the neck
const Capital = () => (
  <svg className="col__cap" viewBox="0 0 160 46" preserveAspectRatio="none" aria-hidden="true">
    <rect x="1" y="1" width="158" height="13" />
    <path d="M14 14 C18 28 30 31 38 31 H122 C130 31 142 28 146 14" />
    <path d="M38 33.5 H122 M39 36 H121 M40 38.5 H119" />
    <path d="M41 38.5 V45 M119 38.5 V45" />
  </svg>
);
// Attic base on a plinth
const Base = () => (
  <svg className="col__base" viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
    <path d="M30 1 H130" />
    <path d="M30 1 C20 2 18 6 18 9 C18 12 22 14 30 14 H130 C138 14 142 12 142 9 C142 6 140 2 130 1" />
    <path d="M26 14 C24 16 24 19 26 21 H134 C136 19 136 16 134 14" />
    <path d="M14 21 C8 22 7 25 8 27 H152 C153 25 152 22 146 21 Z" />
    <rect x="4" y="27" width="152" height="12" />
  </svg>
);

export default function Temple({ lang, counts }: { lang: Lang; counts: { milestones: number; authors: number; videos: number; essays: number } }) {
  const d = dict(lang);
  const t = d.pillars;
  const [sel, setSel] = useState<PillarKey | null>(null);
  const lit = sel ? RESTS[sel] : null;
  const item = sel ? t.items.find((i) => i.key === sel)! : null;

  const sub: Record<Work, string> = {
    atlas: `${counts.milestones} ${t.worksSub.milestones}`,
    canon: `${counts.authors} ${t.worksSub.authors}`,
    books: t.worksSub.books,
    watch: `${counts.videos} ${t.worksSub.videos}`,
    read: `${counts.essays} ${t.worksSub.essays}`,
    community: t.worksSub.community,
  };
  const href: Record<Work, string> = { atlas: '#atlas', canon: '#canon', books: '#books', watch: '#watch', read: '#read', community: '#community' };

  return (
    <div className={`temple${sel ? ' has-sel' : ''}`}>
      {/* what the pillars hold up */}
      <div className="temple__ent">
        <div className="temple__cornice" aria-hidden="true"><i /><i /><i /></div>
        <nav className="temple__frieze" aria-label={t.architrave}>
          <span className="tri" aria-hidden="true" />
          {WORKS.map((w) => (
            <span key={w} className="temple__bay">
              <a className={`metope${lit?.has(w) ? ' is-lit' : ''}`} href={href[w]}>
                <b>{t.works[w]}</b>
                <small>{sub[w]}</small>
              </a>
              <span className="tri" aria-hidden="true" />
            </span>
          ))}
        </nav>
        <p className="temple__architrave">{t.architrave}</p>
      </div>

      {/* the three pillars */}
      <div className="temple__cols">
        {t.items.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`col${sel === p.key ? ' is-sel' : ''}`}
            aria-pressed={sel === p.key}
            onMouseEnter={() => setSel(p.key as PillarKey)}
            onFocus={() => setSel(p.key as PillarKey)}
            onClick={() => setSel(p.key as PillarKey)}
          >
            <Capital />
            <span className="col__shaft">
              <Shaft />
              <span className="col__word">{p.name}</span>
            </span>
            <Base />
          </button>
        ))}
      </div>
      <div className="temple__steps" aria-hidden="true"><i /><i /><i /></div>

      {/* under each pillar, what it means */}
      <div className="temple__subs">
        {t.items.map((p) => <p key={p.key} className={sel === p.key ? 'is-sel' : undefined}>{p.sub}</p>)}
      </div>

      {/* what rests on the chosen pillar */}
      <div className="temple__rests" aria-live="polite">
        {item ? (
          <>
            <div className="rests__head">
              <p className="rests__kicker">{t.rests}</p>
              <h3>{item.name}</h3>
              <p className="rests__sub">{item.sub}</p>
            </div>
            <ul className="rests__list">
              <li>
                <a href="#books">
                  <span className="rests__work">{t.works.books} · {t.series}</span>
                  <span className="rests__title">{item.n}</span>
                  <span className="rests__meta">De Indiis Editions</span>
                </a>
              </li>
              {sel === 'lengua' && (
                <li>
                  <a href="#atlas">
                    <span className="rests__work">{t.works.atlas}</span>
                    <span className="rests__title">{d.map.title}</span>
                    <span className="rests__meta">{sub.atlas}</span>
                  </a>
                </li>
              )}
              {PILLAR_LINKS[sel!].map((l) => (
                <li key={l.href}>
                  <a href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="rests__work">{t.works[l.work]}{l.external ? ' ↗' : ''}</span>
                    <span className="rests__title">{l.title}</span>
                    {l.meta && <span className="rests__meta">{l.work === 'watch' ? `${l.meta} ${d.watch.views}` : l.meta}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rests__hint">{t.hint}</p>
        )}
      </div>
    </div>
  );
}
