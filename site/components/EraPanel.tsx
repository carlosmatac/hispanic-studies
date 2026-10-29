'use client';

import { dict, type Lang } from '@/lib/i18n';
import type { Era } from '@/lib/atlas';

/* Under the Atlas map: the year of the borders on show, a scrubber through the
   twenty keyframes (1492-1898, then today), the keyframe's act, what changed
   and its source. It is also the text version of the map: every keyframe is
   listed with its act and source, and each opens on the map.

   The scrubber is a native range input, so it works with the keyboard and
   speaks its value (the year and the act). Its stops are evenly spaced, one
   per keyframe, not proportional to time: the changes are what it steps
   through. */

const KINDS = ['es', 'pt', 'other', 'native', 'indep', 'claim', 'line'] as const;

export default function EraPanel({ lang, eras, shown, live, onPick }: {
  lang: Lang; eras: Era[]; shown: number | null; live: boolean; onPick: (year: number | null) => void;
}) {
  const t = dict(lang).map.eras;
  const n = eras.length;
  const i = shown === null ? n : Math.max(0, eras.findIndex((e) => e.year === shown));
  const era = shown === null ? null : eras[i];
  const label = era ? era.label : t.today;
  const act = era ? era.act : t.todayAct;

  return (
    <section className="eras" aria-labelledby="eras-h">
      <div className="eras__bar">
        <h2 id="eras-h" className="eras__h">{t.h}</h2>
        <div className="eras__scrub">
          <output className="eras__year" htmlFor="eras-range" aria-hidden="true">{label}</output>
          <div className="eras__track">
            <input
              id="eras-range" type="range" min={0} max={n} step={1} value={i}
              aria-label={t.label} aria-valuetext={`${label}: ${act}`}
              onChange={(e) => { const k = Number(e.target.value); onPick(k >= n ? null : eras[k].year); }}
              style={{ '--k': i / n } as React.CSSProperties}
            />
            <ol className="eras__ticks" aria-hidden="true">
              {eras.map((e, k) => (
                <li key={e.year} className={k === i ? 'is-on' : undefined} style={{ '--k': k / n } as React.CSSProperties}>
                  <span>{e.year}</span>
                </li>
              ))}
              <li className={i === n ? 'is-on' : undefined} style={{ '--k': 1 } as React.CSSProperties}><span>{t.today}</span></li>
            </ol>
          </div>
        </div>
      </div>

      <div className="eras__card" aria-live={live ? 'polite' : 'off'}>
        <p className="eras__act">{act}</p>
        <p className="eras__change">{era ? era.change : t.todayText}</p>
        {era && <p className="eras__src"><span>{t.source}</span> {era.source}</p>}
        {era && (
          <ul className="eras__legend" aria-label={t.h}>
            {KINDS.filter((k) => era.kinds.includes(k)).map((k) => (
              <li key={k}><i className={`eras__key eras__key--${k}`} aria-hidden="true" />{t.kinds[k]}</li>
            ))}
          </ul>
        )}
      </div>

      <details className="eras__all">
        <summary>{t.all}</summary>
        <ol>
          {eras.map((e) => (
            <li key={e.year}>
              <button type="button" onClick={() => { onPick(e.year); document.getElementById('atlas')?.scrollIntoView({ block: 'start' }); }} aria-pressed={e.year === shown}>
                <span className="eras__all-year">{e.label}</span>
                <span className="eras__all-go">{e.year === shown ? t.shown : t.show}</span>
              </button>
              <p className="eras__all-act">{e.act}</p>
              <p className="eras__all-change">{e.change}</p>
              <p className="eras__all-src"><span>{t.source}</span> {e.source}</p>
            </li>
          ))}
        </ol>
        <p className="eras__credit">{t.credit}</p>
      </details>
    </section>
  );
}
