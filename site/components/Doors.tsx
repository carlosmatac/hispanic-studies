import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { getWorks } from '@/lib/archive';
import CanonCard from './canon/CanonCard';

/* II and III on the home: the Atlas and the archive as two plates that open
   their own pages. The map is a still of the Atlas map (public/art/atlas-plate.jpg,
   captured from the page itself); the archive is five of its own cards, fanned,
   one of each region but North America (lib/canon.ts REGIONS). */

const FAN = ['T012', 'T013', 'T001', 'T024', 'T039'];

export default async function Doors({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const works = await getWorks();
  const fan = FAN.map((id) => works.find((w) => w.id === id)).filter((w) => w !== undefined);
  return (
    <section className="doors" aria-label={`${d.nav.atlas} · ${d.nav.canon}`}>
      <a className="door door--atlas" href={`/${lang}/atlas`}>
        <span className="door__plate">
          <Image src="/art/atlas-plate.jpg" alt="" width={2400} height={1172} sizes="(max-width: 900px) 100vw, 58vw" />
        </span>
        <span className="door__text">
          <span className="eyebrow"><span className="door__n">II</span> {d.atlas.eyebrow}</span>
          <span className="door__h">{d.nav.atlas}</span>
          <span className="door__p">{d.atlas.door}</span>
          <span className="door__go">{d.atlas.open} <i aria-hidden="true">→</i></span>
        </span>
      </a>
      <a className="door door--canon" href={`/${lang}/archive`}>
        <span className="door__plate door__fan" aria-hidden="true">
          {fan.map((w, i) => (
            <span key={w.id} className="door__card" style={{ '--k': i - 2 } as React.CSSProperties}>
              <CanonCard work={w} />
            </span>
          ))}
        </span>
        <span className="door__text">
          <span className="eyebrow"><span className="door__n">III</span> {d.canon.eyebrow(works.length, works[0].year, works[works.length - 1].year)}</span>
          <span className="door__h">{d.nav.canon}</span>
          <span className="door__p">{d.canon.door(works.length)}</span>
          <span className="door__go">{d.canon.open} <i aria-hidden="true">→</i></span>
        </span>
      </a>
    </section>
  );
}
