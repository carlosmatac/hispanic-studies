'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { PERIODS, WORKS, splitTitle, type CanonWork } from '@/lib/canon';
import CanonCard from './CanonCard';

/* The canon page: five boxes by period, each with its works as floating cards.
   A card opens the work's record in a dialog; the address follows it
   (/canon#T030), so a link from the pillars or the map opens the same record. */

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export default function CanonShelf({ lang }: { lang: Lang }) {
  const t = dict(lang).canon;
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
      const w = WORKS.find((x) => `#${x.id}` === location.hash);
      if (!w) return;
      document.getElementById(`w-${w.id}`)?.scrollIntoView({ block: 'center' });
      show(w, false);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [show]);

  const onClose = () => {
    if (open) document.getElementById(`w-${open.id}`)?.focus({ preventScroll: true });
    setOpen(null);
    history.replaceState(null, '', location.pathname);
  };

  const [title, sub] = open ? splitTitle(open.title) : ['', undefined];

  return (
    <>
      <nav className="canon-index" aria-label={t.periods}>
        {PERIODS.map((p, i) => (
          <a key={p.id} href={`#${p.id}`}>
            <span className="canon-index__n">{ROMAN[i]}</span>
            <span className="canon-index__name">{p.name[lang]}</span>
          </a>
        ))}
      </nav>

      {PERIODS.map((p, i) => {
        const works = WORKS.filter((w) => w.period === p.id);
        const years = `${works[0].year}–${works[works.length - 1].year}`;
        return (
          <section key={p.id} id={p.id} className="canon-box" aria-labelledby={`${p.id}-h`}>
            <header className="canon-box__head">
              <span className="canon-box__n" aria-hidden="true">{ROMAN[i]}</span>
              <h2 id={`${p.id}-h`}>{p.name[lang]}</h2>
              <span className="canon-box__meta">{years} · {t.count(works.length)}</span>
            </header>
            <ul className="canon-box__grid">
              {works.map((w, k) => (
                <li key={w.id} className="float" style={{ '--d': `${(k % 5) * -1.3}s` } as React.CSSProperties}>
                  <button id={`w-${w.id}`} type="button" className="ccard-btn" onClick={() => show(w)} aria-haspopup="dialog">
                    <CanonCard work={w} counterLabel={t.counterShort} />
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
            <p className="record__kicker">{open.year} · {open.region}</p>
            <h2 id="record-h" className="record__title">{title}</h2>
            {sub && <p className="record__sub">{sub}</p>}
            <p className="record__author">{open.fullName} <span>{open.life}</span></p>
            {open.counter && <p className="record__counter">{t.counter}</p>}
            <p className="record__position">{open.position}</p>
            <dl className="record__facts">
              <dt>{t.camp}</dt><dd>{open.camp}</dd>
              <dt>{t.bueno}</dt><dd>{open.bueno.code} · {open.bueno.name.toLowerCase()}</dd>
            </dl>
            {lang === 'es' && <p className="record__note">{t.dataNote}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}
