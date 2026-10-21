import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { SITE } from '@/lib/content';
import EngravedPlate from './pillars/EngravedPlate';

/* The three pillars as a plate from an architecture treatise: three column
   types of the Hispanic world, one per pillar, under an entablature with the
   motto and on steps that run into the Atlas section.

     Mestizaje    column of the Andean barroco mestizo, flat two-plane carving
     Catolicismo  Solomonic column with the eucharistic vine
     Lengua       plateresque balaustre, after Sagredo, Medidas del Romano (1526)

   The columns are our own 3D models of each type (tools/blender/), rendered
   as turntables; pillars/EngravedPlate.tsx turns, engraves and gilds them as
   they scroll in. Sources: assets/art/SOURCES.md. */

const ROMAN = ['I', 'II', 'III'];

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
        <p className="portico__method mono">{d.pillars.method}</p>
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
          {d.pillars.items.map((p, i) => (
            <article key={p.key} className={`column column--${p.key}`}>
              <figure className="lamina">
                <span className="lamina__no" aria-hidden="true">{d.pillars.plate} {ROMAN[i]}</span>
                <EngravedPlate dir={`/art/pillars/${p.key}`} alt={p.colAlt} order={i} />
                <figcaption>
                  <span className="lamina__cap">{p.col}</span>
                  <span className="lamina__credit">{p.credit}</span>
                </figcaption>
              </figure>

              <div className="column__text">
                <h3>{p.name}</h3>
                <p>{p.sub}</p>
                <figure className="column__art">
                  <Image src={`/art/pillars/${p.key}.jpg`} alt={p.alt} width={900} height={1200} sizes="96px" />
                  <figcaption>{p.art}</figcaption>
                </figure>
                <p className="column__series">{p.n}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="portico__steps" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </section>
  );
}
