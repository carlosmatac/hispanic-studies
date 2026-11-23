import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { curatedWorks, fillCounts, getArchive } from '@/lib/archive';
import { chronicleFor } from '@/lib/atlas-chronicle';
import CanonCard from './canon/CanonCard';

/* III and IV on the home (after the videos since #89): the Atlas and the archive
   as two plates that open their own pages. The two are twins (#106): the same
   width, the same picture frame, the same text below, at every width. The
   Atlas's picture is a still of its globe (public/art/atlas-plate.jpg, captured
   from the app itself; assets/art/SOURCES.md); the archive's is five of its own
   cards, fanned, one of each region but Spain, whose burgundy is the plate's
   own ground. */

const FAN = ['T012', 'T013', 'T001', 'T030', 'T039'];

export default async function Doors({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const archive = await getArchive();
  const { works } = archive;
  const curated = curatedWorks(archive, false).length;
  const stops = chronicleFor(lang).stops.length;
  const door = archive.page.door[lang] || d.canon.door;
  const fan = FAN.map((id) => works.find((w) => w.id === id)).filter((w) => w !== undefined);
  return (
    <section className="doors" aria-label={`${d.nav.atlas} · ${d.nav.canon}`}>
      <a className="door door--atlas" href={`/${lang}/atlas`}>
        <span className="door__plate">
          <Image src="/art/atlas-plate.jpg" alt="" width={2000} height={1250} sizes="(max-width: 1040px) 100vw, 50vw" />
        </span>
        <span className="door__text">
          <span className="eyebrow"><span className="door__n">III</span> {d.atlas.eyebrow}</span>
          <span className="door__h">{d.nav.atlas}</span>
          <span className="door__p">{d.atlas.door(stops)}</span>
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
          <span className="eyebrow"><span className="door__n">IV</span> {d.canon.eyebrow(curated, archive.eras.length, works.length - curated)}</span>
          <span className="door__h">{d.nav.canon}</span>
          <span className="door__p">{fillCounts(door, archive)}</span>
          <span className="door__go">{d.canon.open} <i aria-hidden="true">→</i></span>
        </span>
      </a>
    </section>
  );
}
