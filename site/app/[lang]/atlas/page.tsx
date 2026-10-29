import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MapTour from '@/components/MapTour';
import { COUNTS, erasFor, tourCards } from '@/lib/atlas';
import milestones from '@/data/milestones.json';

/* The Atlas, on its own page since 2026-10-25 (Beltrán found the home too busy
   with the map live on it): the map and its tour, then Beltrán's sixty
   milestones in their seven chapters. */

type Milestone = { n: number; chapter: number; date: { en: string; es: string }; title: { en: string; es: string }; body: { en: string; es: string } };
const MS = milestones.milestones as Milestone[];
const CHAPTERS = milestones.chapters as { en: string; es: string }[];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return { title: `${d.nav.atlas} · ${d.meta.title}`, description: d.atlas.door };
}

export default async function AtlasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const { eras, families } = erasFor(lang);
  return (
    <>
      <Header lang={lang} current="atlas" />
      <main id="main">
        <section className="page-head" aria-labelledby="atlas-h">
          <p className="eyebrow">{d.atlas.eyebrow}</p>
          <h1 id="atlas-h">{d.atlas.h}</h1>
          <p>{d.atlas.sub}</p>
        </section>

        <section className="atlas atlas--page" id="atlas" aria-label={d.map.title}>
          <div className="plate-wrap">
            <MapTour lang={lang} cards={tourCards(lang)} eras={eras} families={families} />
            <div className="cartouche">
              <h2>{d.map.title}</h2>
              <div className="rule" />
              <dl>
                <dt>{d.map.states}</dt><dd>{COUNTS.states}</dd>
                <dt>{d.map.presence}</dt><dd>{COUNTS.presence}</dd>
                <dt>{d.map.authors}</dt><dd>{COUNTS.authors}</dd>
                <dt>{d.map.milestones}</dt><dd>{COUNTS.milestones}</dd>
                <dt>{d.map.rupture}</dt><dd>1898</dd>
              </dl>
              <p className="src">{d.map.src}</p>
            </div>
          </div>
        </section>

        <section className="milestones" id="milestones" aria-labelledby="ms-h">
          <div className="section-head">
            <p className="eyebrow">{d.atlas.msEyebrow}</p>
            <h2 id="ms-h">{d.atlas.msH}</h2>
          </div>
          {CHAPTERS.map((c, i) => (
            <div key={i} className="chapter">
              <h3 className="chapter__h"><span>{ROMAN[i]}</span>{c[lang]}</h3>
              <ol className="chapter__list">
                {MS.filter((m) => m.chapter === i).map((m) => (
                  <li key={m.n} id={`m${m.n}`}>
                    <details className="ms">
                      <summary>
                        <span className="ms__n">{m.n}</span>
                        <span className="ms__date">{m.date[lang]}</span>
                        <span className="ms__title">{m.title[lang]}</span>
                      </summary>
                      <p className="ms__body">{m.body[lang]}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="pending atlas__next">{d.atlas.pending}</p>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
