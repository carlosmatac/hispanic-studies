import { notFound } from 'next/navigation';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { dict, isLang } from '@/lib/i18n';
import Image from 'next/image';
import { SITE, SHORTS, VIDEOS, ESSAYS, channel, shortThumb, shortUrl, videoThumb, videoUrl } from '@/lib/content';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Reel from '@/components/Reel';
import MapTour from '@/components/MapTour';
import Signup from '@/components/Signup';
import CanonGraphLazy from '@/components/canon/CanonGraphLazy';
import { TOUR, type TourCard } from '@/lib/map-tour';
import Pillars from '@/components/Pillars';
import ShortsRail from '@/components/ShortsRail';
import ChannelIcon from '@/components/ChannelIcon';
import { SealRow, ChannelBadge, ChannelGrid } from '@/components/Channels';

// The reel's address carries a fingerprint of the file, read at build time: a new cut gets a
// new URL, so no browser or CDN keeps playing the old one.
const stamp = (file: string) => createHash('sha1').update(readFileSync(path.join(process.cwd(), 'public', file))).digest('hex').slice(0, 10);
const REEL = `/video/reel.mp4?v=${stamp('video/reel.mp4')}`;
const REEL_POSTER = `/video/reel-poster.jpg?v=${stamp('video/reel-poster.jpg')}`;

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

type Milestone = { n: number; date: { en: string; es: string }; title: { en: string; es: string }; body: { en: string; es: string } };
const MILESTONES = new Map((milestones.milestones as Milestone[]).map((m) => [m.n, m]));
// the first sentence of a milestone's text: a card has room for one
const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();

function tourCards(lang: 'en' | 'es'): TourCard[] {
  const t = dict(lang).map.tour;
  const total = MILESTONES.size;
  return TOUR.map((stop, i) => {
    const m = stop.milestone ? MILESTONES.get(stop.milestone) : undefined;
    const last = i === TOUR.length - 1;
    const media = stop.media;
    const mediaText = !media ? undefined : media.kind === 'pending' ? media.what[lang] : media.credit[lang];
    if (!m) {
      return {
        ...stop, mediaText,
        kicker: t.introKicker, title: dict(lang).map.title, text: t.introText,
        link: { href: '#atlas', label: t.atlas },
      };
    }
    return {
      ...stop, mediaText,
      kicker: last ? `${m.date[lang]} · ${t.outroKicker}` : `${m.date[lang]} · ${t.milestone} ${m.n} ${t.of} ${total}`,
      title: m.title[lang],
      text: firstSentence(m.body[lang]),
      link: stop.canon ? { href: `#canon=${stop.canon}`, label: t.canon } : { href: '#atlas', label: t.atlas },
    };
  });
}

const fmtDate = (iso: string, lang: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const patreon = channel('patreon');

  return (
    <>
      <Header lang={lang} />
      <main id="main">

        {/* the title page */}
        <Hero lang={lang} />

        {/* the reel: the Institute in a minute, silent until played */}
        <Reel lang={lang} src={REEL} poster={REEL_POSTER} />

        {/* I · three pillars, as a portico */}
        <Pillars lang={lang} counts={{ milestones: COUNTS.milestones, authors: COUNTS.authors }} />

        {/* II · the Atlas (next version) */}
        <section className="atlas" id="atlas" aria-labelledby="atlas-h">
          <span className="numeral" aria-hidden="true">II<i /></span>
          <div className="section-head">
            <p className="eyebrow">{d.atlas.eyebrow}</p>
            <h2 id="atlas-h">{d.atlas.h}</h2>
            <p>{d.atlas.sub}</p>
          </div>
          <div className="plate-wrap">
            <MapTour lang={lang} cards={tourCards(lang)} />
            <div className="cartouche">
              <h3>{d.map.title}</h3>
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
          <p className="pending atlas__next">{d.atlas.pending}</p>
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
          <div className="section-head section-head--split reveal">
            <div>
              <p className="eyebrow">{d.watch.eyebrow}</p>
              <h2 id="watch-h">{d.watch.h}</h2>
              <p>{d.watch.sub}</p>
            </div>
            <ChannelBadge lang={lang} name="youtube" label={d.watch.all} unit={d.watch.subscribers} />
          </div>

          <h3 className="shelf">{d.watch.long} <span>{VIDEOS.length}</span></h3>
          <ul className="watch__grid">
            {VIDEOS.map((v, i) => (
              <li key={v.id} className={i === 0 ? 'is-lead' : undefined}>
                <a className="vid reveal" href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer">
                  <span className="vid__thumb">
                    <Image src={videoThumb(v.id)} alt="" width={1280} height={720} sizes={i === 0 ? '(max-width: 760px) 92vw, 60vw' : '(max-width: 760px) 92vw, 30vw'} />
                    <span className="vid__play" aria-hidden="true" />
                    <span className="vid__views">{v.views} {d.watch.views}</span>
                  </span>
                  <h4>{v.title}</h4>
                </a>
              </li>
            ))}
          </ul>

          <h3 className="shelf">{d.watch.shorts} <span>{SHORTS.length}</span></h3>
          <ShortsRail label={d.watch.shorts} prev={d.watch.prev} next={d.watch.next}>
            {SHORTS.map((v) => (
              <li key={v.id}>
                <a className="short" href={shortUrl(v.id)} target="_blank" rel="noopener noreferrer">
                  <span className="short__thumb">
                    <Image src={shortThumb(v.id)} alt="" width={1080} height={1920} sizes="200px" />
                    <span className="vid__views">{v.views} {d.watch.views}</span>
                  </span>
                  <h4>{v.title}</h4>
                </a>
              </li>
            ))}
          </ShortsRail>
          <p className="watch__note mono">{d.watch.asOf}</p>
        </section>

        {/* VI · read */}
        <section className="read" id="read" aria-labelledby="read-h">
          <span className="numeral" aria-hidden="true">VI<i /></span>
          <div className="section-head section-head--split reveal">
            <div>
              <p className="eyebrow">{d.read.eyebrow}</p>
              <h2 id="read-h">{d.read.h}</h2>
              <p>{d.read.sub}</p>
            </div>
            <ChannelBadge lang={lang} name="substack" label={d.read.subscribe} unit={d.read.subscribers} />
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
          <h3 className="shelf">{d.about.channels}</h3>
          <ChannelGrid lang={lang} />
        </section>

        {/* community */}
        <section className="community" id="community" aria-labelledby="comm-h">
          <div className="section-head">
            <p className="eyebrow">{d.comm.eyebrow}</p>
            <h2 id="comm-h">{d.comm.h}</h2>
            <p>{d.comm.sub}</p>
          </div>
          <div className="community__pamphlet">
            <p>{d.hero.pamphletA}<b>{SITE.pamphlet}</b>{d.hero.pamphletB}</p>
            <Signup lang={lang} />
            <p className="mono consent">{d.hero.consent}</p>
            <div className="follow">
              <span className="follow__label">{d.hero.follow}</span>
              <SealRow lang={lang} keys={['youtube', 'instagram', 'x', 'tiktok', 'substack']} />
            </div>
          </div>
          <div className="community__actions">
            <span className="pending"><ChannelIcon name="discord" /> {d.comm.discord} {d.comm.discordPending}</span>
            <a className="btn btn--ghost" href={patreon.url} target="_blank" rel="noopener noreferrer"><ChannelIcon name="patreon" /> {d.comm.patreon}</a>
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
