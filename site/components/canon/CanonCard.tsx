import { splitTitle, tilt, type CanonWork } from '@/lib/canon';
import { swatchStyle } from '@/lib/palette';

/* One work of the archive as a small cover: the year and the place at the top,
   the title in the middle, the author at the foot. The binding is the colour
   of the work's region (a swatch of lib/palette.ts). Used by the archive page (as a button that
   opens the record) and by the home's door (as a picture). */

export default function CanonCard({ work, counterLabel, textLabel, draftLabel }: { work: CanonWork; counterLabel?: string; textLabel?: string; draftLabel?: string }) {
  const [title, sub] = splitTitle(work.title);
  const long = title.length > 46;
  return (
    <span
      className={`ccard${work.counter ? ' ccard--counter' : ''}${work.status === 'draft' ? ' ccard--draft' : ''}`}
      style={{ ...swatchStyle(work.swatch), '--tilt': `${tilt(work.id)}deg` } as React.CSSProperties}
    >
      <span className="ccard__top">
        <span className="ccard__year">{work.year}</span>
        <span className="ccard__code">{work.code}</span>
      </span>
      <span className={`ccard__title${long ? ' is-long' : ''}`}>{title}</span>
      {sub && <span className="ccard__sub">{sub}</span>}
      <span className="ccard__foot">
        <span className="ccard__rule" />
        <span className="ccard__author">{work.author}</span>
        <span className="ccard__life">{work.life}</span>
        {work.counter && counterLabel && <span className="ccard__counter">{counterLabel}</span>}
      </span>
      {work.hasText && textLabel && <span className="ccard__text">{textLabel}</span>}
      {work.status === 'draft' && draftLabel && <span className="ccard__draft">{draftLabel}</span>}
    </span>
  );
}
