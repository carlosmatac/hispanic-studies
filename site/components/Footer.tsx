import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, DISCORD, SITE } from '@/lib/content';
import { collabPath, privacyPath } from '@/lib/canon';
import AlgoretoLogo from './AlgoretoLogo';
import { navHref } from './Header';
import FooterPixels from './FooterPixels';

/* The footer (issue #106, after algoreto.com's): one burgundy panel whose
   ground is our generated film of a tercio on the march and a ship off the
   Pillars of Hercules, redrawn as discreet pixels in the brand's dark colours
   (FooterPixels, lib/footer-pixels.ts). Over it, the content as a grid of
   cells parted by hairlines, a band where the film shows, and the bottom
   line. The film is credited as generated, under Sources. */
export default function Footer({ lang }: { lang: Lang }) {
  const d = dict(lang);
  return (
    <footer className="foot">
      <FooterPixels />
      <div className="foot__body">
        <div className="foot__grid">
          <a className="foot__mark" href={`/${lang}`} aria-label={SITE.name}>
            <span className="foot__eagle" aria-hidden="true" />
          </a>
          <nav className="foot__col" aria-label={d.foot.explore}>
            <h4>{d.foot.explore}</h4>
            <ul>
              {(['atlas', 'canon', 'books', 'watch', 'read', 'mission'] as const).map((k) => (
                <li key={k}><a href={navHref(lang, k)}>{d.nav[k]}</a></li>
              ))}
            </ul>
          </nav>
          <div className="foot__col">
            <h4>{d.foot.channels}</h4>
            <ul>
              {CHANNELS.map((c) => (
                <li key={c.key}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    {c.name}{c.following && <span className="foot__count">{c.following}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot__col">
            <h4>{d.foot.community}</h4>
            <ul>
              <li><a href={`/${lang}#community`}>{d.foot.pamphlet}</a></li>
              <li><a href={DISCORD.url} target="_blank" rel="noopener noreferrer">{d.foot.discord}</a></li>
              <li><a href={`/${lang}${collabPath(lang)}`}>{d.collab.meta}</a></li>
              <li><a href={`/${lang}#merch`}>{d.nav.merch}</a></li>
            </ul>
          </div>
          <div className="foot__side">
            <div className="foot__say">
              <i aria-hidden="true" />
              <p className="foot__motto">{SITE.motto}.</p>
              <p className="foot__blurb">{d.foot.blurb}</p>
            </div>
            <div className="foot__src">
              <h4>{d.foot.sources}</h4>
              <ul>
                <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">{d.foot.naturalEarth}</a></li>
                <li><span>{d.foot.canonSrc}</span></li>
                <li><span>{d.foot.film}</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot__field" aria-hidden="true" />
        <div className="foot__base">
          <span>© 2026 {d.foot.legal}</span>
          <div className="foot__chips">
            <a className="foot__chip" href={`/${lang}${privacyPath(lang)}`}>{d.foot.privacy}</a>
            <span className="foot__chip">{d.foot.version}</span>
            <a className="foot__chip foot__made" href="https://algoreto.com" target="_blank" rel="noopener noreferrer">
              <span>{d.foot.madeBy}</span>
              <AlgoretoLogo className="foot__algoreto" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
