'use client';

import { useState } from 'react';
import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { PILLAR_LINKS, type PillarKey, type Work } from '@/lib/content';

/* The three pillars hold up the Institute.

   The plate is an engraving of a Doric portico (AI-generated, logged in
   assets/art/SOURCES.md, no text in it). Everything that means something is
   ours, laid over it: the Institute's works in the six metopes, its name on
   the architrave, the three words on the shafts. Choosing a pillar (hover,
   focus, tap) tints its shaft and the works that rest on it in burgundy
   (multiplied, so the engraving shows through) and lists them beside it.

   All geometry is in the image's own pixels (2400 × 1792), measured from
   the plate; the overlay SVG shares that viewBox and the HTML uses %. */

const W = 2400, H = 1792;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

const WORKS: Work[] = ['atlas', 'canon', 'books', 'watch', 'read', 'community'];
const KEYS: PillarKey[] = ['mestizaje', 'catolicismo', 'lengua'];

// the six metopes, inside their frames: [x0, x1]; all share y 131–288
const METOPES: [number, number][] = [[258, 476], [582, 809], [915, 1142], [1248, 1475], [1582, 1808], [1916, 2134]];
const METOPE_Y: [number, number] = [131, 288];
const ARCHITRAVE = { x0: 175, x1: 2225, y0: 330, y1: 366 };
// each shaft from the necking (y 505) to the base (y 1540): left/right edges down its length (entasis)
const SHAFTS: { cx: number; edge: [number, number, number][] }[] = [
  { cx: 529, edge: [[505, 433, 625], [800, 425, 633], [1100, 418, 640], [1400, 415, 642], [1540, 416, 642]] },
  { cx: 1197, edge: [[505, 1101, 1293], [800, 1093, 1301], [1100, 1085, 1307], [1400, 1083, 1310], [1540, 1084, 1309]] },
  { cx: 1864, edge: [[505, 1768, 1960], [800, 1760, 1969], [1100, 1753, 1975], [1400, 1750, 1977], [1540, 1751, 1976]] },
];
// the whole column, abacus to plinth, is the hit area
const COL_BOX = { y0: 367, y1: 1650, half: 165 };

const RESTS: Record<PillarKey, Set<Work>> = Object.fromEntries(
  KEYS.map((k) => [k, new Set<Work>(['books', ...PILLAR_LINKS[k].map((l) => l.work), ...(k === 'lengua' ? (['atlas'] as Work[]) : [])])]),
) as Record<PillarKey, Set<Work>>;

const shaftPath = (edge: [number, number, number][]) =>
  'M' + [...edge.map(([y, l]) => `${l} ${y}`), ...[...edge].reverse().map(([y, , r]) => `${r} ${y}`)].join(' L') + ' Z';

export default function Temple({ lang, counts }: { lang: Lang; counts: { milestones: number; authors: number; videos: number; essays: number } }) {
  const d = dict(lang);
  const t = d.pillars;
  const [sel, setSel] = useState<PillarKey | null>(null);
  const lit = sel ? RESTS[sel] : null;
  const item = sel ? t.items.find((i) => i.key === sel)! : null;
  const href: Record<Work, string> = { atlas: `/${lang}/atlas`, canon: `/${lang}/canon`, books: '#books', watch: '#watch', read: '#read', community: '#community' };
  const local = (h: string) => (h.startsWith('/') ? `/${lang}${h}` : h);

  return (
    <div className={`portico${sel ? ' has-sel' : ''}`}>
      <div className="portico__plate">
        <Image src="/art/portico.jpg" alt="" width={W} height={H} sizes="(max-width: 860px) 100vw, 60vw" priority={false} />

        {/* tints: multiplied over the engraving */}
        <svg className="portico__tint" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {METOPES.map(([x0, x1], i) => (
            <rect key={WORKS[i]} className={lit?.has(WORKS[i]) ? 'is-lit' : undefined} x={x0} y={METOPE_Y[0]} width={x1 - x0} height={METOPE_Y[1] - METOPE_Y[0]} />
          ))}
          {SHAFTS.map((s, i) => <path key={KEYS[i]} className={sel === KEYS[i] ? 'is-lit' : undefined} d={shaftPath(s.edge)} />)}
        </svg>

        {/* what the pillars hold up: the Institute's works and its name */}
        <nav className="portico__frieze" aria-label={t.architrave}>
          {METOPES.map(([x0, x1], i) => (
            <a
              key={WORKS[i]}
              href={href[WORKS[i]]}
              className={`portico__metope${lit?.has(WORKS[i]) ? ' is-lit' : ''}`}
              style={{ left: pct(x0, W), width: pct(x1 - x0, W), top: pct(METOPE_Y[0], H), height: pct(METOPE_Y[1] - METOPE_Y[0], H) }}
            >
              {t.works[WORKS[i]]}
            </a>
          ))}
        </nav>
        <p className="portico__architrave" style={{ left: pct(ARCHITRAVE.x0, W), width: pct(ARCHITRAVE.x1 - ARCHITRAVE.x0, W), top: pct(ARCHITRAVE.y0, H), height: pct(ARCHITRAVE.y1 - ARCHITRAVE.y0, H) }}>
          {t.architrave}
        </p>

        {/* the three pillars */}
        {t.items.map((p, i) => (
          <button
            key={p.key}
            type="button"
            className={`portico__col${sel === p.key ? ' is-sel' : ''}`}
            aria-pressed={sel === p.key}
            style={{ left: pct(SHAFTS[i].cx - COL_BOX.half, W), width: pct(COL_BOX.half * 2, W), top: pct(COL_BOX.y0, H), height: pct(COL_BOX.y1 - COL_BOX.y0, H) }}
            onMouseEnter={() => setSel(p.key as PillarKey)}
            onFocus={() => setSel(p.key as PillarKey)}
            onClick={() => setSel(p.key as PillarKey)}
          >
            <span className="portico__word">{p.name}</span>
          </button>
        ))}
      </div>

      {/* beside the plate: what rests on the chosen pillar */}
      <aside className="portico__panel" aria-live="polite">
        {item ? (
          <>
            <p className="panel__kicker">{t.rests}</p>
            <h3 className="panel__name">{item.name}</h3>
            <p className="panel__sub">{item.sub}</p>
            <ul className="panel__list">
              <li>
                <a href="#books">
                  <span className="panel__work">{t.works.books} · {t.series}</span>
                  <span className="panel__title">{item.n}</span>
                  <span className="panel__meta">De Indiis Editions</span>
                </a>
              </li>
              {sel === 'lengua' && (
                <li>
                  <a href={href.atlas}>
                    <span className="panel__work">{t.works.atlas}</span>
                    <span className="panel__title">{d.map.title}</span>
                    <span className="panel__meta">{counts.milestones} {t.worksSub.milestones}</span>
                  </a>
                </li>
              )}
              {PILLAR_LINKS[sel!].map((l) => (
                <li key={l.href}>
                  <a href={local(l.href)} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="panel__work">{t.works[l.work]}{l.external ? ' ↗' : ''}</span>
                    <span className="panel__title">{l.title}</span>
                    {l.meta && <span className="panel__meta">{l.work === 'watch' ? `${l.meta} ${d.watch.views}` : l.meta}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="panel__kicker">{t.hint}</p>
            <ul className="panel__pillars">
              {t.items.map((p) => (
                <li key={p.key}>
                  <button type="button" onClick={() => setSel(p.key as PillarKey)} onMouseEnter={() => setSel(p.key as PillarKey)}>
                    <span className="panel__pname">{p.name}</span>
                    <span className="panel__psub">{p.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
