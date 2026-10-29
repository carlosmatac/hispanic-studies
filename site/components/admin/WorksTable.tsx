'use client';

import { useMemo, useState } from 'react';
import { adminDict, type Lang } from '@/lib/i18n';
import type { RegionRow, SectionRow, WorkRow } from '@/lib/admin/queries';
import { swatchStyle } from '@/lib/palette';

/* The works as a list that filters as you type (title, author or year) and by
   section, region and state. On a phone each row becomes a small card. */

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function WorksTable({ lang, works, sections, regions }: {
  lang: Lang; works: WorkRow[]; sections: SectionRow[]; regions: RegionRow[];
}) {
  const t = adminDict(lang).works;
  const [q, setQ] = useState('');
  const [section, setSection] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const name = (r: { nameEn: string; nameEs: string }) => (lang === 'es' ? r.nameEs : r.nameEn);
  const rows = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    return works.filter((w) =>
      (!section || w.sectionId === section) && (!region || w.regionId === region) && (!status || w.status === status) &&
      words.every((x) => fold(`${w.title} ${w.author} ${w.year} ${w.id}`).includes(x)));
  }, [works, q, section, region, status]);

  return (
    <div className="adm-works">
      <div className="adm-filters" role="search">
        <label className="adm-field adm-field--grow">
          <span className="adm-field__label">{t.search}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">{t.cols.section}</span>
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="">{t.allSections}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{name(s)}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">{t.cols.region}</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t.allRegions}</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{name(r)}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">{t.cols.status}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t.allStatus}</option>
            <option value="published">{t.published}</option>
            <option value="draft">{t.draft}</option>
          </select>
        </label>
      </div>
      <p className="adm-count" aria-live="polite">{t.count(rows.length)}</p>
      {rows.length === 0 ? <p className="adm-empty">{t.empty}</p> : (
        <ol className="adm-list">
          {rows.map((w) => {
            const reg = regions.find((r) => r.id === w.regionId);
            const sec = sections.find((s) => s.id === w.sectionId);
            return (
              <li key={w.id}>
                <a className="adm-row" href={`/admin/works/${encodeURIComponent(w.id)}`}>
                  <span className="adm-row__swatch" style={reg ? swatchStyle(reg.swatch) : undefined} aria-hidden="true" />
                  <span className="adm-row__year">{w.year}</span>
                  <span className="adm-row__main">
                    <span className="adm-row__title">{w.title}</span>
                    <span className="adm-row__author">{w.author}</span>
                  </span>
                  <span className="adm-row__meta">
                    <span>{sec ? name(sec) : ''}</span>
                    <span>{reg ? name(reg) : ''}</span>
                  </span>
                  <span className="adm-row__flags">
                    {w.texts.length ? <span className="adm-tag">{w.texts.map((l) => l.toUpperCase()).join(' · ')}</span> : <span className="adm-tag adm-tag--quiet">{t.noText}</span>}
                    {w.status === 'draft' && <span className="adm-tag adm-tag--draft">{t.draft}</span>}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
