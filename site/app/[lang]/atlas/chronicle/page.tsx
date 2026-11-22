import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Chronicle from '@/components/atlas/Chronicle';
import { chronicleFor } from '@/lib/atlas-chronicle';
import milestones from '@/data/milestones.json';
import '../atlas.css';

/* The Atlas as text (issue #95): since the Atlas became a fixed application
   (Carlos, 2026-11-22: "a fixed panel where you can't scroll"), the chronicle
   that used to sit under the globe and Beltrán's sixty milestones live here, on
   an ordinary page that reads without JavaScript. The app links here, and every
   stop links back to the globe (/[lang]/atlas#on-map-<id>). */

type Milestone = { n: number; chapter: number; date: { en: string; es: string }; title: { en: string; es: string }; body: { en: string; es: string } };
const MS = milestones.milestones as Milestone[];
const CHAPTERS = milestones.chapters as { en: string; es: string }[];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return { title: `${d.atlas.chronEyebrow} · ${d.nav.atlas} · ${d.meta.title}`, description: d.atlas.door };
}

export default async function AtlasChroniclePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const chronicle = chronicleFor(lang);
  return (
    <>
      <Header lang={lang} current="atlas" />
      <main id="main">
        <section className="page-head page-head--atlas" aria-labelledby="atlas-h">
          <p className="eyebrow">{d.atlas.eyebrow}</p>
          <h1 id="atlas-h">{d.atlas.h}</h1>
          <p>{d.atlas.sub(chronicle.stops.length)}</p>
        </section>

        <p className="chron__back"><a href={`/${lang}/atlas`}>← {d.atlas.welcomeTitle}</a></p>
        <Chronicle lang={lang} data={chronicle} />

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
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
