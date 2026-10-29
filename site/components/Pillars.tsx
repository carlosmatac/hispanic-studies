import { dict, type Lang } from '@/lib/i18n';
import Fresco from './pillars/Fresco';

/* I · The three pillars: mestizaje, catolicismo and lengua, as one fresco
   across the full width with a tab for each (pillars/Fresco.tsx). */
export default function Pillars({ lang, counts }: { lang: Lang; counts: { milestones: number; authors: number } }) {
  const d = dict(lang);
  return (
    <section className="pillars" aria-labelledby="pillars-h">
      <span className="numeral" aria-hidden="true">I<i /></span>
      <div className="section-head reveal">
        <p className="eyebrow">{d.pillars.eyebrow}</p>
        <h2 id="pillars-h">{d.pillars.h}</h2>
        <p>{d.pillars.hint}</p>
      </div>
      <Fresco lang={lang} counts={counts} />
    </section>
  );
}
