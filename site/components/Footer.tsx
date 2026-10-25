import { dict, type Lang } from '@/lib/i18n';
import { CHANNELS, SITE } from '@/lib/content';
import ChannelIcon from './ChannelIcon';
import AlgoretoLogo from './AlgoretoLogo';
import { navHref } from './Header';

/* The footer: the name in letters cut out of the burgundy, each letter a
   window onto a different picture of the Hispanic world (all public domain or
   CC0, in assets/art/SOURCES.md), with the Institute's name and motto on a
   paper strip beside it. Then the columns, and the credits. */

const LETTERS: { ch: string; src: string; pos?: string; by: string }[][] = [
  [
    { ch: 'H', src: '00-cabrera-maria-luz-padilla', pos: '45% 30%', by: 'Miguel Cabrera' },
    { ch: 'I', src: '01-cuzco-archangel-eliel-arquebus', pos: '50% 30%', by: 'Cuzco School' },
    { ch: 'S', src: '02-tepotzotlan-crossing-retablos', by: 'Tepotzotlán' },
    { ch: 'P', src: '03-morlete-casta-albino', pos: '50% 25%', by: 'Juan Patricio Morlete' },
    { ch: 'A', src: '04-nuremberg-tenochtitlan-1524', by: 'Tenochtitlan, 1524' },
    { ch: 'N', src: '05-biombo-indian-wedding-palo-volador', by: 'Biombo, c. 1690' },
    { ch: 'O', src: '06-perez-holguin-pentecost', pos: '50% 35%', by: 'Melchor Pérez de Holguín' },
  ],
  [
    { ch: 'S', src: '07-villalpando-triumph-of-religion', by: 'Cristóbal de Villalpando' },
    { ch: 'T', src: '08-paoay-church', pos: '30% 50%', by: 'Paoay' },
    { ch: 'U', src: '09-capilla-rosario-puebla', by: 'Capilla del Rosario, Puebla' },
    { ch: 'D', src: '10-plaza-mayor-mexico-nebel-1836', by: 'Carl Nebel' },
    { ch: 'I', src: '11-tepotzotlan-retablo-mayor', by: 'Tepotzotlán' },
    { ch: 'E', src: '12-villalpando-plaza-mayor-1695', by: 'Villalpando, 1695' },
    { ch: 'S', src: '13-blaeu-americae-nova-tabula', by: 'Willem Blaeu' },
  ],
];
const BY = [...new Set(LETTERS.flat().map((l) => l.by))];

export default function Footer({ lang }: { lang: Lang }) {
  const d = dict(lang);
  return (
    <footer className="foot">
      <div className="foot__plate">
        <p className="foot__word" aria-label="Hispano Studies">
          {LETTERS.map((line, j) => (
            <span key={j} className="foot__line" aria-hidden="true">
              {line.map((l, i) => (
                <span
                  key={i}
                  className="foot__l"
                  style={{ '--img': `url(/art/letters/${l.src}.jpg)`, '--pos': l.pos ?? '50% 50%' } as React.CSSProperties}
                >
                  {l.ch}
                </span>
              ))}
            </span>
          ))}
        </p>
        <aside className="foot__strip">
          <span className="foot__name">{SITE.name}</span>
          <i aria-hidden="true" />
          <em className="foot__motto">{SITE.motto}.</em>
        </aside>
      </div>
      <p className="foot__letters mono">{d.foot.letters}: {BY.join(' · ')}</p>

      <div className="foot__cols">
        <div className="foot__say">
          <p className="foot__lede">{d.foot.blurb}</p>
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

      <div className="foot__base mono">
        <span>{d.foot.legal} · {SITE.motto}</span>
        <span>{d.foot.version}</span>
        <a className="foot__made" href="https://algoreto.com" target="_blank" rel="noopener noreferrer">
          <span>{d.foot.madeBy}</span>
          <AlgoretoLogo className="foot__algoreto" />
        </a>
      </div>
    </footer>
  );
}
