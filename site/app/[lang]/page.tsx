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
import Signup from '@/components/Signup';
import Epigraph from '@/components/Epigraph';
import Doors from '@/components/Doors';
import { COUNTS } from '@/lib/atlas';
import Pillars from '@/components/Pillars';
import ShortsRail from '@/components/ShortsRail';
import ChannelIcon from '@/components/ChannelIcon';
import { SealRow, ChannelBadge, ChannelGrid } from '@/components/Channels';

// The reel's address carries a fingerprint of the file, read at build time: a new cut gets a
// new URL, so no browser or CDN keeps playing the old one.
const stamp = (file: string) => createHash('sha1').update(readFileSync(path.join(process.cwd(), 'public', file))).digest('hex').slice(0, 10);
const REEL = `/video/reel.mp4?v=${stamp('video/reel.mp4')}`;
const REEL_POSTER = `/video/reel-poster.jpg?v=${stamp('video/reel-poster.jpg')}`;

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

        {/* the epigraph: Lewis Hanke */}
        <Epigraph lang={lang} />

        {/* I · three pillars holding up the Institute */}
        <Pillars lang={lang} counts={{ milestones: COUNTS.milestones, authors: COUNTS.authors }} />

        {/* where to find us: every channel, a light band right under the pillars */}
        <section className="channels" id="channels" aria-labelledby="channels-h">
          <div className="channels__head">
            <p className="eyebrow">{d.channels.eyebrow}</p>
            <h2 id="channels-h">{d.channels.h}</h2>
          </div>
          <ChannelGrid lang={lang} />
        </section>

        {/* II · watch: his latest videos, right under where to find him (2026-10-30, #89) */}
        <section className="watch" id="watch" aria-labelledby="watch-h">
          <span className="numeral" aria-hidden="true">II<i /></span>
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

        {/* III · IV · the Atlas and the archive, as two plates that open their pages */}
        <Doors lang={lang} />

        {/* V · books (next version) */}
        <section className="books" id="books" aria-labelledby="books-h">
          <span className="numeral" aria-hidden="true">V<i /></span>
          <div className="section-head">
            <p className="eyebrow">{d.books.eyebrow}</p>
            <h2 id="books-h">{d.books.h}</h2>
          </div>
          <p className="pending">{d.books.pending}</p>
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
                <span className="essay__cover">
                  <Image src={e.cover} alt="" fill sizes="(max-width: 760px) 92px, 132px" />
                </span>
                <div className="essay__text">
                  <span className="essay__date">{fmtDate(e.date, lang)}</span>
                  <h3>{e.title}</h3>
                  <p className="essay__by">{e.author}{e.translator ? ` · ${d.read.trans} ${e.translator}` : ''}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* VII · about */}
        <section className="about" id="about" aria-labelledby="about-h">
          <span className="numeral" aria-hidden="true">VII<i /></span>
          <div className="about__grid">
            <figure className="about__plate">
              <Image src="/art/villalpando-plaza-mayor-1695.jpg" alt="" width={2200} height={1660} sizes="(max-width: 1040px) 92vw, 680px" />
              <figcaption>{d.about.plate}</figcaption>
            </figure>
            <div className="about__text">
              <p className="eyebrow">{d.about.eyebrow}</p>
              <h2 id="about-h">{d.about.h}</h2>
              {/* the short mission summary from Beltrán's own manifesto goes here,
                  with a link to the full text on /[lang]/mission (issue #66; text pending) */}
              <p className="lede">{d.about.p1}</p>
              <p>{d.about.p2}</p>
            </div>
          </div>
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
