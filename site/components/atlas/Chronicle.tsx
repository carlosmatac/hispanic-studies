import { dict, type Lang } from '@/lib/i18n';
import type { Chronicle as Data } from '@/lib/atlas-chronicle';

/* The chronicle as text (issue #71): every beat the map plays, in the same
   order, with the voyages' dated landfalls and every source. It is the
   accessible equivalent of the stage and what a reader without JavaScript
   gets. "Show on the map" links (#on-map-<id>) are picked up by the stage and
   only shown once it is running (html.has-atlas). */

function fmt(lang: Lang, iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const date = new Date(Date.UTC(+y, +m - 1, d ? +d : 15));
  return new Intl.DateTimeFormat(lang, d ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function Chronicle({ lang, data }: { lang: Lang; data: Data }) {
  const t = dict(lang).atlas;
  return (
    <section className="chron" id="chronicle" aria-labelledby="chron-h">
      <div className="section-head">
        <p className="eyebrow">{t.chronEyebrow}</p>
        <h2 id="chron-h">{t.chronH}</h2>
        <p>{t.chronSub}</p>
      </div>
      <ol className="chron__list">
        {data.beats.map((b) => {
          const v = b.voyage !== undefined ? data.voyages[b.voyage] : undefined;
          return (
            <li key={b.id} id={`beat-${b.id}`} className={`chron__beat chron__beat--${b.kind}`}>
              <details>
                <summary>
                  <span className="chron__label">{b.label}</span>
                  <span className="chron__title">{b.title}</span>
                  <span className="chron__kind">{b.kicker.split(' · ')[0]}</span>
                </summary>
                <div className="chron__body">
                  <p>{b.text}</p>
                  {(b.who || b.ships) && (
                    <dl className="chron__meta">
                      {b.who && <><dt>{t.who}</dt><dd>{b.who}</dd></>}
                      {b.ships && <><dt>{t.ships}</dt><dd>{b.ships}</dd></>}
                    </dl>
                  )}
                  {v && (
                    <ol className="chron__log" aria-label={t.log}>
                      {v.route.filter((w) => w.name).map((w, k) => (
                        <li key={k}><span>{fmt(lang, w.date)}</span> <strong>{w.name}.</strong> {w.log}</li>
                      ))}
                    </ol>
                  )}
                  {b.note && <p className="chron__note">{b.note}</p>}
                  {b.milestones.length > 0 && (
                    <p className="chron__ms">
                      {t.milestones}:{' '}
                      {b.milestones.map((m, i) => (
                        <span key={m.n}>{i > 0 && ' · '}<a href={`#m${m.n}`}>{m.n}. {m.title}</a></span>
                      ))}
                    </p>
                  )}
                  <p className="chron__src"><span>{b.sources.length > 1 ? t.sources : t.source}:</span> {b.sources.join(' · ')}</p>
                  <a className="chron__go" href={`#on-map-${b.id}`}>{t.showOnMap} ↑</a>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      <p className="chron__credit">{t.credit}</p>
    </section>
  );
}
