'use client';

import { useEffect, useMemo, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { swatchStyle } from '@/lib/palette';
import { fold } from '@/lib/canon';

/* The curated 80 on the archive's landing (issue #93): the six eras with
   their works in Beltrán's (chronological) order, a search (author, title,
   variant title, issuing institution) and two filters (region, reading
   language). No theoretical labels or filters, as the brief asks. Everything
   is rendered on the server; the search and filters only hide entries, so
   without a script every work is there. #T030 and #<slug> in the address
   scroll to that work and mark it. */

export type Entry = {
  id: string;
  slug: string;
  href: string;
  order: number;
  era: string;
  date: string;
  title: string;
  titleLang: string;
  creator: string;
  regions: string[];
  langs: string[];
  swatch: string;
  here: boolean;
  review: boolean;
  /** everything searchable, folded (lower case, no accents) */
  haystack: string;
};

export type EraGroup = { id: string; numeral: string; name: string; years: string };

export default function ArchiveBrowser({ lang, eras, entries, regions }: {
  lang: Lang;
  eras: EraGroup[];
  entries: Entry[];
  regions: { id: string; name: string }[];
}) {
  const t = dict(lang).archive80;
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [reading, setReading] = useState('');
  const [mark, setMark] = useState<string | null>(null);

  const words = useMemo(() => fold(q).split(/\s+/).filter(Boolean), [q]);
  const shown = useMemo(() => new Set(entries.filter((e) =>
    (!region || e.regions.includes(region)) &&
    (!reading || e.langs.includes(reading)) &&
    words.every((w) => e.haystack.includes(w)),
  ).map((e) => e.id)), [entries, region, reading, words]);
  const filtered = shown.size !== entries.length;

  // #T030 (old links) or #<slug>: scroll to the work and mark it
  useEffect(() => {
    const go = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const e = entries.find((x) => x.id === h || x.slug === h);
      if (!e) return;
      setMark(e.id);
      requestAnimationFrame(() => document.getElementById(e.id)?.scrollIntoView({ block: 'center' }));
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [entries]);

  const langs = [['', t.anyLanguage], ['es', t.langName.es], ['pt', t.langName.pt], ['en', t.langName.en]] as const;

  return (
    <div className="a80">
      <form className="a80-tools glass" role="search" aria-label={t.browse} onSubmit={(e) => e.preventDefault()}>
        <label className="a80-tools__search">
          <span className="a80-tools__label">{t.search}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchHint} autoComplete="off" spellCheck={false} />
        </label>
        <label className="a80-tools__region">
          <span className="a80-tools__label">{t.region}</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t.allRegions}</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <fieldset className="a80-tools__langs">
          <legend className="a80-tools__label">{t.readingIn}</legend>
          <div className="a80-seg">
            {langs.map(([id, name]) => (
              <label key={id || 'any'}>
                <input type="radio" name="a80-lang" value={id} checked={reading === id} onChange={() => setReading(id)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="a80-tools__count" role="status" aria-live="polite">
          {t.shown(shown.size, entries.length)}
          {filtered && <button type="button" className="a80-tools__clear" onClick={() => { setQ(''); setRegion(''); setReading(''); }}>{t.clear}</button>}
        </p>
      </form>

      <nav className="a80-index" aria-label={t.era}>
        {eras.filter((g) => entries.some((e) => e.era === g.id)).map((g) => {
          const n = entries.filter((e) => e.era === g.id && shown.has(e.id)).length;
          return (
            <a key={g.id} href={`#${g.id}`} aria-disabled={n === 0 || undefined}>
              <span className="a80-index__n">{g.numeral}</span>
              <span className="a80-index__name">{g.name}</span>
            </a>
          );
        })}
      </nav>

      {eras.map((g) => {
        const list = entries.filter((e) => e.era === g.id);
        const visible = list.filter((e) => shown.has(e.id)).length;
        if (!list.length) return null;
        return (
          <section key={g.id} id={g.id} className="a80-era" aria-labelledby={`${g.id}-h`} hidden={visible === 0}>
            <header className="a80-era__head">
              <span className="a80-era__n" aria-hidden="true">{g.numeral}</span>
              <h2 id={`${g.id}-h`}>{g.name}</h2>
              <span className="a80-era__meta">{t.count(visible)}</span>
            </header>
            <ol className="a80-list">
              {list.map((e) => (
                <li key={e.id} id={e.id} className={`a80-entry${mark === e.id ? ' is-marked' : ''}`} hidden={!shown.has(e.id)} style={swatchStyle(e.swatch)}>
                  <a href={e.href}>
                    <span className="a80-entry__bind" aria-hidden="true"><span>{e.order}</span></span>
                    <span className="a80-entry__body">
                      <span className="a80-entry__date">{e.date}</span>
                      <span className="a80-entry__title" lang={e.titleLang}>{e.title}</span>
                      <span className="a80-entry__creator">{e.creator}</span>
                      <span className="a80-entry__tags">
                        {e.langs.map((l) => <abbr key={l} className="a80-tag" title={t.langName[l]}>{l.toUpperCase()}</abbr>)}
                        {e.here && <span className="a80-tag a80-tag--here">{t.hereBadge}</span>}
                        {e.review && <span className="a80-tag a80-tag--review">{t.inReview}</span>}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {shown.size === 0 && <p className="a80-none">{t.none}</p>}
    </div>
  );
}
