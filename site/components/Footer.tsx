import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, SITE } from '@/lib/content';
import AlgoretoLogo from './AlgoretoLogo';
import { navHref } from './Header';
import FooterBlind from './FooterBlind';

/* The footer is one panel and a blind. The page ends with a frosted glass
   that carries the links; under it lies the name, each letter a window onto
   a painting (an image Carlos made; see assets/art/SOURCES.md), seen blurred
   through the glass. Scrolling on lifts the glass and shows the name; letting
   go drops it again (FooterBlind). */
export default function Footer({ lang }: { lang: Lang }) {
  const d = dict(lang);
  return (
    <footer className="foot">
      <div className="foot__name">
        <Image src="/art/footer-name.jpg" alt="Hispano Studies" width={1826} height={809} sizes="100vw" />
      </div>
      <div className="foot__glass">
        <div className="foot__grid">
          <a className="foot__mark" href={`/${lang}`} aria-label={SITE.name}>
            <span className="foot__eagle" aria-hidden="true" />
          </a>
          <nav className="foot__col" aria-label={d.foot.explore}>
            <h4>{d.foot.explore}</h4>
            <ul>
              {(['atlas', 'canon', 'books', 'watch', 'read', 'about'] as const).map((k) => (
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
              <li><span>{d.foot.discord} <span className="foot__pending">{d.comm.discordPending}</span></span></li>
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
              </ul>
            </div>
          </div>
        </div>
        <div className="foot__base">
          <span>© 2026 {d.foot.legal}</span>
          <div className="foot__chips">
            <span className="foot__chip">{d.foot.version}</span>
            <a className="foot__chip foot__made" href="https://algoreto.com" target="_blank" rel="noopener noreferrer">
              <span>{d.foot.madeBy}</span>
              <AlgoretoLogo className="foot__algoreto" />
            </a>
          </div>
        </div>
      </div>
      <div className="foot__under" aria-hidden="true" />
      <FooterBlind />
    </footer>
  );
}
