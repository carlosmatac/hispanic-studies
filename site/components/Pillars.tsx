import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { SITE } from '@/lib/content';

/* The three pillars as a portico: an entablature carrying the motto rests on
   three columns (capital, a painted niche, base), and the columns stand on
   steps that run into the Atlas section below. The paintings are public
   domain and logged in assets/art/SOURCES.md. The motion (columns rising,
   the entablature settling) is CSS only, in globals.css, and fails open. */

/* Tuscan capital and base, drawn once and stretched to the column width;
   strokes keep their weight with non-scaling-stroke. */
const Capital = () => (
  <svg className="column__cap" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
    <rect x="3" y="1.5" width="194" height="11" />
    <path d="M10 12.5C16 27 30 30 30 30h140s14-3 20-17.5" />
    <path d="M30 34h140M30 38.5h140" />
  </svg>
);
const Base = () => (
  <svg className="column__base" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
    <path d="M30 1.5h140M30 6h140" />
    <path d="M30 6C14 8 12 13 12 18s2 9 18 9h140c16 0 18-4 18-9s-2-10-18-12" />
    <rect x="3" y="27" width="194" height="11.5" />
  </svg>
);

const SRC: Record<string, string> = {
  mestizaje: '/art/pillars/mestizaje.jpg',
  catolicismo: '/art/pillars/catolicismo.jpg',
  lengua: '/art/pillars/lengua.jpg',
};

export default function Pillars({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const motto = SITE.motto.toUpperCase().replace(/U/g, 'V').split(' ');
  return (
    <section className="pillars" aria-labelledby="pillars-h">
      <span className="numeral" aria-hidden="true">I<i /></span>
      <div className="section-head reveal">
        <p className="eyebrow">{d.pillars.eyebrow}</p>
        <h2 id="pillars-h">{d.pillars.h}</h2>
        <p>{d.pillars.sub}</p>
      </div>

      <div className="portico">
        <div className="portico__top" aria-hidden="true">
          <div className="portico__cornice" />
          <div className="portico__frieze">
            {motto.map((w, i) => (
              <span key={w}>{i > 0 && <i>·</i>}{w}</span>
            ))}
          </div>
          <div className="portico__architrave" />
        </div>

        <div className="portico__cols">
          {d.pillars.items.map((p) => (
            <article key={p.key} className={`column column--${p.key}`}>
              <Capital />
              <div className="column__shaft">
                <figure className="column__niche">
                  <span className="column__arch">
                    <Image src={SRC[p.key]} alt={p.alt} width={900} height={1200} sizes="(max-width: 760px) 88vw, 28vw" />
                  </span>
                  <figcaption>{p.art}</figcaption>
                </figure>
                <div className="column__text">
                  <h3>{p.name}</h3>
                  <p>{p.sub}</p>
                  <p className="column__series">{p.n}</p>
                </div>
              </div>
              <Base />
            </article>
          ))}
        </div>

        <div className="portico__steps" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </section>
  );
}
