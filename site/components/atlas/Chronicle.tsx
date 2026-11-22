import { dict, type Lang } from '@/lib/i18n';
import { RETIRED, type Chronicle as Data } from '@/lib/atlas-chronicle';

/* The chronicle as text (issues #71 and #95): every stop the globe tells, in
   the same order, chapter by chapter: the records with their four paragraphs,
   links and plate credit; the voyages with their dated landfalls; the border
   changes with their sources. It is the accessible equivalent of the globe
   and what a reader without JavaScript gets; since the Atlas became a fixed
   app it lives on its own page, /[lang]/atlas/chronicle. "Show on the globe"
   links open the app at that stop (/[lang]/atlas#on-map-<id>). */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

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
      {t.chapters.map((name, c) => {
        const stops = data.stops.filter((s) => s.chapter === c);
        if (!stops.length) return null;
        return (
          <div key={c} className="chron__chapter">
            <h3 className="chron__chapter-h"><span>{ROMAN[c]}</span>{name}</h3>
            <ol className="chron__list">
              {stops.map((b) => {
                const v = b.voyage !== undefined ? data.voyages[b.voyage] : undefined;
                const r = b.record;
                const rl = r && r.lang !== lang ? r.lang : undefined;
                return (
                  <li key={b.id} id={`stop-${b.id}`} className={`chron__beat chron__beat--${b.kind}`}>
                    {b.aliases.map((a) => <span key={a} id={`stop-${a}`} />)}
                    <details>
                      <summary>
                        <span className="chron__label">{b.label}</span>
                        <span className="chron__title" lang={b.kind === 'record' ? rl : undefined}>{b.title}</span>
                        <span className="chron__kind">{b.kicker.split(' · ')[0]}</span>
                      </summary>
                      <div className="chron__body">
                        {b.kind !== 'record' && <p>{b.text}</p>}
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
                        {b.branches && (
                          <dl className="chron__meta">
                            {b.branches.map((x) => <div key={x.title} style={{ display: 'contents' }}><dt>{x.title}</dt><dd>{x.text}</dd></div>)}
                          </dl>
                        )}
                        {b.note && <p className="chron__note">{b.note}</p>}
                        {r && (
                          <div className="chron__record" lang={rl}>
                            {b.kind !== 'record' && <p className="chron__rec-h" lang={lang}>{t.record} {r.id}: <span lang={rl}>{r.title}</span></p>}
                            {r.pending && <p className="chron__pending" lang={lang}>{t.pendingEs}</p>}
                            {r.interpretation && <p className="chron__note" lang={lang}><strong>{t.interpretation(r.interpretation)}.</strong> {t.interpretationNote}</p>}
                            {r.paragraphs.map((p, k) => <p key={k}>{p}</p>)}
                            <p className="chron__map" lang={lang}><span>{t.onMap}:</span> {r.anchors.length ? `${r.anchors.map((a) => a.name).join(', ')}. ${t.mapRecord}` : t.mapNoAnchor}</p>
                            {r.mapNote && <p className="chron__map"><span lang={lang}>{t.mapNote}:</span> {r.mapNote}</p>}
                            <p className="chron__src" lang={lang}>
                              <span>{t.readFurther}:</span>{' '}
                              {r.links.wikipedia && <><a href={r.links.wikipedia}>{t.wikipedia}</a> · </>}
                              {r.links.book && <><a href={r.links.book.url}>{t.book}: {r.links.book.label}</a> · </>}
                              {r.links.further.map((l, k) => <span key={l.url}>{k > 0 && ' · '}<a href={l.url}>{l.label}</a></span>)}
                            </p>
                            {r.plate && (
                              <p className="chron__src" lang={lang}>
                                <span>{t.plateRole[r.plate.role]}:</span> <a href={r.plate.page}>{r.plate.caption}</a>
                                {r.plate.licence && <> · {r.plate.author ? `${r.plate.author}, ` : ''}{r.plate.licence}</>}
                              </p>
                            )}
                          </div>
                        )}
                        {b.milestones.length > 0 && (
                          <p className="chron__ms">
                            {t.milestones}:{' '}
                            {b.milestones.map((m, i) => (
                              <span key={m.n}>{i > 0 && ' · '}<a href={`#m${m.n}`}>{m.n}. {m.title}</a></span>
                            ))}
                          </p>
                        )}
                        {b.sources.length > 0 && <p className="chron__src"><span>{b.sources.length > 1 ? t.sources : t.source}:</span> {b.sources.join(' · ')}</p>}
                        <a className="chron__go" href={`/${lang}/atlas#on-map-${b.id}`}>{t.showOnMap} →</a>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
      <p className="chron__credit">{t.credit} {t.retired(RETIRED.join(', '))}</p>
    </section>
  );
}
