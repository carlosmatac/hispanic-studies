import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { SITE, SHORTS, ESSAYS, CHANNELS, shortThumb, shortUrl } from '@/lib/content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroMap from '@/components/HeroMap';
import Signup from '@/components/Signup';
import CanonGraphLazy from '@/components/canon/CanonGraphLazy';

// Server-only reads: the cartouche counts what the data actually holds.
import iberophone from '@/public/data/iberophone.json';
import milestones from '@/data/milestones.json';
import canon from '@/data/canon.json';

const places = [...iberophone.countries, ...iberophone.points] as { tier: string }[];
const COUNTS = {
  states: places.filter((p) => p.tier === 'emersa').length,
  presence: places.filter((p) => p.tier === 'submersa').length,
  authors: (canon as { corpusTotal?: number }).corpusTotal ?? 0,
  milestones: milestones.milestones.length,
};

const GLYPHS: Record<string, React.ReactNode> = {
  mestizaje: (
    <>
      <path d="M6 5c0 11 7 15 13 19s5 12 5 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 5c0 11-7 15-13 19s-5 12-5 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 29v14" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </>
  ),
  catolicismo: (
    <>
      <ellipse cx="24" cy="24" rx="9.5" ry="15" stroke="currentColor" strokeWidth="2.2" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M24 3v4M24 41v4M10 24H6M42 24h-4" />
        <path d="M12.5 10.5 9.8 7.8M35.5 37.5l2.7 2.7M12.5 37.5l-2.7 2.7M35.5 10.5l2.7-2.7" />
      </g>
    </>
  ),
  lengua: (
    <>
      <path d="M9 17c3-5 7-5 10 0s7 5 10 0 7-5 10 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 25v18M32 25v18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
};

const fmtDate = (iso: string, lang: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const patreon = CHANNELS.find((c) => c.name === 'Patreon')!;

  return (
    <>
      <Header lang={lang} />
      <main id="main">

        {/* HERO · the map */}
        <section className="hero" aria-labelledby="hero-h">
          <div className="plate-wrap">
            <HeroMap lang={lang} />
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
          <div className="hero__band">
            <div>
              <p className="eyebrow">{d.hero.eyebrow}</p>
              <h1 id="hero-h">{d.hero.h1a}<em>{d.hero.h1em}</em>{d.hero.h1b}</h1>
              <p className="lede">{d.hero.lede}</p>
            </div>
            <div>
              <p>{d.hero.pamphletA}<b>{SITE.pamphlet}</b>{d.hero.pamphletB}</p>
              <Signup lang={lang} />
              <p className="mono consent">{d.hero.consent}</p>
            </div>
          </div>
        </section>

        {/* I · three pillars */}
        <section className="pillars" aria-labelledby="pillars-h">
          <span className="numeral" aria-hidden="true">I<i /></span>
          <div className="section-head reveal">
            <p className="eyebrow">{d.pillars.eyebrow}</p>
            <h2 id="pillars-h">{d.pillars.h}</h2>
            <p>{d.pillars.sub}</p>
          </div>
          <div className="pillars__grid">
            {d.pillars.items.map((p) => (
              <a key={p.key} className="pillar reveal" href="#canon">
                <svg className="pillar__glyph" viewBox="0 0 48 48" fill="none" aria-hidden="true">{GLYPHS[p.key]}</svg>
                <h3>{p.name}</h3>
                <p>{p.sub}</p>
                <span className="pillar__count">{p.n}</span>
              </a>
            ))}
          </div>
        </section>

        {/* II · the Atlas (next version) */}
        <section className="atlas" id="atlas" aria-labelledby="atlas-h">
          <span className="numeral" aria-hidden="true">II<i /></span>
          <div className="section-head">
            <p className="eyebrow">{d.atlas.eyebrow}</p>
            <h2 id="atlas-h">{d.atlas.h}</h2>
            <p>{d.atlas.sub}</p>
          </div>
          <p className="pending">{d.atlas.pending}</p>
        </section>

        {/* III · the canon */}
        <section className="canon" id="canon" aria-labelledby="canon-h">
          <span className="numeral" aria-hidden="true">III<i /></span>
          <div className="section-head reveal">
            <p className="eyebrow">{d.canon.eyebrow}</p>
            <h2 id="canon-h">{d.canon.h}</h2>
            <p>{d.canon.sub}</p>
          </div>
          <CanonGraphLazy lang={lang} />
          <div className="canon__notes">
            <p>{d.canon.disclaimer}</p>
            {lang === 'es' && <p>{d.canon.dataNote}</p>}
          </div>
        </section>

        {/* IV · books (next version) */}
        <section className="books" id="books" aria-labelledby="books-h">
          <span className="numeral" aria-hidden="true">IV<i /></span>
          <div className="section-head">
            <p className="eyebrow">{d.books.eyebrow}</p>
            <h2 id="books-h">{d.books.h}</h2>
          </div>
          <p className="pending">{d.books.pending}</p>
        </section>

        {/* V · watch */}
        <section className="watch" id="watch" aria-labelledby="watch-h">
          <span className="numeral" aria-hidden="true">V<i /></span>
          <div className="section-head reveal">
            <p className="eyebrow">{d.watch.eyebrow}</p>
            <h2 id="watch-h">{d.watch.h}</h2>
            <p>{d.watch.sub}</p>
          </div>
          <div className="watch__grid">
            {SHORTS.map((s) => (
              <a key={s.id} className="vid reveal" href={shortUrl(s.id)} target="_blank" rel="noopener noreferrer">
                <span className="vid__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube */}
                  <img src={shortThumb(s.id)} alt="" loading="lazy" width={480} height={360} />
                  <span className="vid__views">{s.views} {d.watch.views}</span>
                </span>
                <h3>{s.title}</h3>
              </a>
            ))}
          </div>
        </section>

        {/* VI · read */}
        <section className="read" id="read" aria-labelledby="read-h">
          <span className="numeral" aria-hidden="true">VI<i /></span>
          <div className="section-head reveal">
            <p className="eyebrow">{d.read.eyebrow}</p>
            <h2 id="read-h">{d.read.h}</h2>
            <p>{d.read.sub}</p>
          </div>
          <div className="read__list">
            {ESSAYS.map((e) => (
              <a key={e.slug} className="essay" href={e.url} target="_blank" rel="noopener noreferrer">
                <span className="essay__date">{fmtDate(e.date, lang)}</span>
                <span>
                  <h3>{e.title}</h3>
                  <p className="essay__by">{e.author}{e.translator ? ` · ${d.read.trans} ${e.translator}` : ''}</p>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* VII · about */}
        <section className="about" id="about" aria-labelledby="about-h">
          <span className="numeral" aria-hidden="true">VII<i /></span>
          <div className="section-head reveal">
            <p className="eyebrow">{d.about.eyebrow}</p>
            <h2 id="about-h">{d.about.h}</h2>
          </div>
          <p className="lede">{d.about.p1}</p>
          <p>{d.about.p2}</p>
        </section>

        {/* community */}
        <section className="community" aria-labelledby="comm-h">
          <div className="section-head">
            <p className="eyebrow">{d.comm.eyebrow}</p>
            <h2 id="comm-h">{d.comm.h}</h2>
            <p>{d.comm.sub}</p>
          </div>
          <div className="community__actions">
            <span className="pending">{d.comm.discord} {d.comm.discordPending}</span>
            <a className="btn btn--ghost" href={patreon.url} target="_blank" rel="noopener noreferrer">{d.comm.patreon}</a>
          </div>
        </section>

        {/* merch (not connected) */}
        <section className="merch" id="merch" aria-labelledby="merch-h">
          <div className="section-head">
            <p className="eyebrow">{d.merch.eyebrow}</p>
            <h2 id="merch-h">{d.merch.h}</h2>
          </div>
          <p className="pending">{d.merch.pending}</p>
        </section>

      </main>
      <Footer lang={lang} />
    </>
  );
}
