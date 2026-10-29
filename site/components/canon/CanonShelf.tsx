'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { readHref, splitTitle, type CanonRegion, type CanonSection, type CanonWork } from '@/lib/canon';
import { swatchStyle } from '@/lib/palette';
import CanonCard from './CanonCard';

/* The archive page: one box per section (period), each with its works as floating
   cards coloured by region. A card opens the work's record in a dialog; the
   address follows it (/archive#T030), so a link from the pillars or the map
   opens the same record. From the record, the work's own page: the full text
   when it is in the public domain. */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const roman = (i: number) => ROMAN[i] ?? String(i + 1);

export default function CanonShelf({ lang, works, sections, regions }: { lang: Lang; works: CanonWork[]; sections: CanonSection[]; regions: CanonRegion[] }) {
  const t = dict(lang).canon;
  const r = dict(lang).reader;
  const box = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<CanonWork | null>(null);

  const show = useCallback((w: CanonWork, push = true) => {
    setOpen(w);
    if (push) history.replaceState(null, '', `#${w.id}`);
    const d = box.current;
    if (d && !d.open) d.showModal();
  }, []);

  // open the record named in the address, on arrival and when the hash changes
  useEffect(() => {
    const fromHash = () => {
      const w = works.find((x) => `#${x.id}` === decodeURIComponent(location.hash));
      if (!w) return;
      document.getElementById(`w-${w.id}`)?.scrollIntoView({ block: 'center' });
      show(w, false);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [show, works]);

  const onClose = () => {
    if (open) document.getElementById(`w-${open.id}`)?.focus({ preventScroll: true });
    setOpen(null);
    history.replaceState(null, '', location.pathname);
  };

  const periods = sections.map((p) => ({ ...p, works: works.filter((w) => w.period === p.id) })).filter((p) => p.works.length);
  const regionOf = (id: string) => regions.find((g) => g.id === id);
  const openRegion = open ? regionOf(open.region) : undefined;
  const [title, sub] = open ? splitTitle(open.title) : ['', undefined];

  return (
    <>
      <nav className="canon-index" aria-label={t.periods}>
        {periods.map((p, i) => (
          <a key={p.id} href={`#${p.id}`}>
            <span className="canon-index__n">{roman(i)}</span>
            <span className="canon-index__name">{p.name[lang]}</span>
          </a>
        ))}
      </nav>

      <figure className="canon-legend">
        <figcaption>{t.legend}</figcaption>
        <ul>
          {regions.map((g) => (
            <li key={g.id}>
              <span className="canon-legend__swatch" style={swatchStyle(g.swatch)} aria-hidden="true" />
              <span className="canon-legend__name">{g.name[lang]}</span>
              <span className="canon-legend__note">{g.note[lang]}</span>
            </li>
          ))}
        </ul>
      </figure>

      {periods.map((p, i) => {
        const years = `${p.works[0].year}–${p.works[p.works.length - 1].year}`;
        return (
          <section key={p.id} id={p.id} className="canon-box" aria-labelledby={`${p.id}-h`}>
            <header className="canon-box__head">
              <span className="canon-box__n" aria-hidden="true">{roman(i)}</span>
              <h2 id={`${p.id}-h`}>{p.name[lang]}</h2>
              <span className="canon-box__meta">{years} · {t.count(p.works.length)}</span>
            </header>
            <ul className="canon-box__grid">
              {p.works.map((w, k) => (
                <li key={w.id} className="float" style={{ '--d': `${(k % 5) * -1.3}s` } as React.CSSProperties}>
                  <button id={`w-${w.id}`} type="button" className="ccard-btn" onClick={() => show(w)} aria-haspopup="dialog">
                    <CanonCard work={w} counterLabel={t.counterShort} textLabel={t.fullText} draftLabel={r.draft} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <dialog ref={box} className="record" onClose={onClose} onClick={(e) => { if (e.target === e.currentTarget) box.current?.close(); }} aria-labelledby="record-h">
        {open && (
          <div className="record__sheet">
            <button type="button" className="record__close" onClick={() => box.current?.close()} aria-label={t.close}>×</button>
            <p className="record__kicker">
              <span className="record__swatch" style={swatchStyle(open.swatch)} aria-hidden="true" />
              {open.year} · {openRegion?.name[lang]} · {open.place}
            </p>
            <h2 id="record-h" className="record__title">{title}</h2>
            {sub && <p className="record__sub">{sub}</p>}
            <p className="record__author">{open.fullName} <span>{open.life}</span></p>
            {open.counter && <p className="record__counter">{t.counter}</p>}
            {open.note[lang] && <p className="record__note-text">{open.note[lang]}</p>}
            {open.position && <p className="record__position">{open.position}</p>}
            {(open.camp || open.bueno.code) && (
              <dl className="record__facts">
                {open.camp && <><dt>{t.camp}</dt><dd>{open.camp}</dd></>}
                {open.bueno.code && <><dt>{t.bueno}</dt><dd>{open.bueno.code} · {open.bueno.name.toLowerCase()}</dd></>}
              </dl>
            )}
            <p className="record__go">
              {open.hasText
                ? <a className="record__read" href={readHref(lang, open.id)}>{t.read} <i aria-hidden="true">→</i></a>
                : <a className="record__page" href={readHref(lang, open.id)}>{t.openPage} <i aria-hidden="true">→</i></a>}
              {!open.hasText && <span className="record__status">{open.rights === 'public-domain' ? r.pendingPd : open.rights === 'unverified' ? r.pending : r.rightsName[open.rights]}</span>}
            </p>
            {lang === 'es' && open.position && <p className="record__note">{t.dataNote}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
