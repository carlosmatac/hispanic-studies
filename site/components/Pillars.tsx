import { dict, type Lang } from '@/lib/i18n';
import { VIDEOS, SHORTS, ESSAYS } from '@/lib/content';
import Temple from './pillars/Temple';

/* I · The three pillars hold up the Institute: mestizaje, catolicismo and
   lengua carry its works (pillars/Temple.tsx). */
export default function Pillars({ lang, counts }: { lang: Lang; counts: { milestones: number; authors: number } }) {
  const d = dict(lang);
  return (
    <section className="pillars" aria-labelledby="pillars-h">
      <span className="numeral" aria-hidden="true">I<i /></span>
      <div className="section-head reveal">
        <p className="eyebrow">{d.pillars.eyebrow}</p>
        <h2 id="pillars-h">{d.pillars.h}</h2>
      </div>
      <Temple
        lang={lang}
        counts={{ ...counts, videos: VIDEOS.length + SHORTS.length, essays: ESSAYS.length }}
      />
    </section>
  );
}
