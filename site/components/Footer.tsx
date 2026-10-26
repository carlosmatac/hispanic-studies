import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, SITE } from '@/lib/content';
import ChannelIcon from './ChannelIcon';
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
        <div className="foot__inner">
          <div className="foot__head">
            <p className="foot__inst">{SITE.name}</p>
            <p className="foot__motto">{SITE.motto}.</p>
          </div>
          <div className="foot__cols">
            <p className="foot__lede">{d.foot.blurb}</p>
            <div>
              <h4>{d.foot.explore}</h4>
              <ul className="foot__two">
                {(['atlas', 'canon', 'books', 'watch', 'read', 'about'] as const).map((k) => (
                  <li key={k}><a href={navHref(lang, k)}>{d.nav[k]}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>{d.foot.channels}</h4>
              <ul className="foot__two">
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
              <h4 className="foot__h-gap">{d.foot.sources}</h4>
              <ul>
                <li><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">{d.foot.naturalEarth}</a></li>
                <li><span>{d.foot.canonSrc}</span></li>
              </ul>
            </div>
          </div>
          <div className="foot__base mono">
            <span>{d.foot.legal} · {d.foot.version}</span>
            <a className="foot__made" href="https://algoreto.com" target="_blank" rel="noopener noreferrer">
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
