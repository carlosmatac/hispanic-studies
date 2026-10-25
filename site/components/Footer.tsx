import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, SITE, DISCORD } from '@/lib/content';
import ChannelIcon from './ChannelIcon';
import { navHref } from './Header';

/* The footer from P · Tornaviaje: motto and blurb, columns, a channel
   marquee and an oversized wordmark. The wordmark is an SVG so it scales to
   the column and can never clip. */
export default function Footer({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const words = [...CHANNELS.map((c) => c.name), DISCORD.name, SITE.imprint, SITE.motto];
  return (
    <footer className="foot">
      <div className="foot__cols">
        <div className="foot__say">
          <p className="foot__motto">{SITE.motto}</p>
          <p className="foot__blurb">{d.foot.blurb}</p>
        </div>
        <div>
          <h4>{d.foot.explore}</h4>
          <ul>
            {(['atlas', 'canon', 'books', 'watch', 'read', 'about'] as const).map((k) => (
              <li key={k}><a href={navHref(lang, k)}>{d.nav[k]}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{d.foot.channels}</h4>
          <ul>
            {CHANNELS.map((c) => (
              <li key={c.key}>
                <a className="foot__chan" href={c.url} target="_blank" rel="noopener noreferrer">
                  <ChannelIcon name={c.key} />
                  <span>{c.name}</span>
                  {c.following && <span className="foot__count">{c.following}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{d.foot.community}</h4>
          <ul>
            <li className="foot__chan"><ChannelIcon name="discord" /><span>{d.foot.discord} <span className="foot__pending">{d.comm.discordPending}</span></span></li>
          </ul>
          <h4 style={{ marginTop: 26 }}>{d.foot.sources}</h4>
          <ul>
            <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">{d.foot.naturalEarth}</a></li>
            <li><span>{d.foot.canonSrc}</span></li>
          </ul>
        </div>
      </div>
      <div className="foot__marquee" aria-hidden="true">
        <div className="foot__ticker">
          {[...words, ...words].map((w, i) => <span key={i}>{w}</span>)}
        </div>
      </div>
      <svg className="foot__word" viewBox="0 0 1000 118" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <text x="500" y="100" textAnchor="middle" textLength="990" lengthAdjust="spacingAndGlyphs">HISPANO STUDIES</text>
      </svg>
      <p className="foot__base mono">
        <span>{d.foot.legal} · {SITE.motto}</span>
        <span>{d.foot.version}</span>
      </p>
    </footer>
  );
}
