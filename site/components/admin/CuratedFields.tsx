'use client';

import { useState } from 'react';
import { dict, adminDict, type Lang } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/canon';
import { EXTENTS, RIGHTS_BASES } from '@/lib/editions';
import { blankEdition, type ArticlePayload, type CuratedPayload, type EditionPayload } from '@/lib/admin/types';
import type { CuratedOptions } from '@/lib/admin/queries';
import Field from './Field';

/* A work's place in the curated 80 (issue #93), in its form: whether it is one
   of them, its era and order, the header readers see, its article in Spanish
   and English (three plain-text sections each), its editions with their access
   and, when it is ever approved, the U.S. rights evidence to host one here,
   and the related documents. Plain fields, help under each, as in the rest of
   the form. */

type Props = {
  lang: Lang;
  value: CuratedPayload;
  onChange: (c: CuratedPayload) => void;
  errors: Record<string, string>;
  options: CuratedOptions;
  /** the languages that have a text in this work (an HTML edition needs one) */
  textLangs: string[];
  workId: string;
};

const SECTIONS = ['aboutAuthor', 'workInItsTime', 'whyReadToday'] as const;

export default function CuratedFields({ lang, value: c, onChange, errors, options, textLangs, workId }: Props) {
  const t = adminDict(lang).w80;
  // Beltrán's number and address do not change once set (links and the import rely on them)
  const [locked] = useState({ canon: !!c.canonId, slug: !!c.slug });
  const pub = dict(lang).archive80;
  const set = <K extends keyof CuratedPayload>(k: K, v: CuratedPayload[K]) => onChange({ ...c, [k]: v });
  const text = (k: 'canonId' | 'slug' | 'curatedOrder' | 'originalTitle' | 'creator' | 'dateDisplay' | 'geographicNote' | 'editionNotes') =>
    ({ value: c[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  const name = (r: { nameEn: string; nameEs: string }) => (lang === 'es' ? r.nameEs : r.nameEn);
  const toggle = (list: string[], id: string, on: boolean) => (on ? [...list.filter((x) => x !== id), id] : list.filter((x) => x !== id));
  const err = (k: string) => errors[k];

  const article = (l: 'es' | 'en'): ArticlePayload => c.articles.find((a) => a.locale === l) ?? { locale: l, title: '', aboutAuthor: '', workInItsTime: '', whyReadToday: '' };
  const setArticle = (l: 'es' | 'en', k: keyof ArticlePayload, v: string) =>
    set('articles', [...c.articles.filter((a) => a.locale !== l), { ...article(l), [k]: v }]);

  const setEd = (i: number, patch: Partial<EditionPayload>) => set('editions', c.editions.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const moveEd = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= c.editions.length) return;
    const next = [...c.editions];
    [next[i], next[j]] = [next[j], next[i]];
    set('editions', next);
  };
  const newEditionId = () => `${workId || 'work'}-e${Math.random().toString(36).slice(2, 8)}`;

  if (!c.curated && !c.canonId) {
    return (
      <fieldset className="adm-card adm-w80">
        <legend>{t.legend}</legend>
        <label className="adm-check">
          <input type="checkbox" checked={c.curated} onChange={(e) => set('curated', e.target.checked)} />
          <span><b>{t.inCollection}</b><span className="adm-help">{t.inCollectionHelp}</span></span>
        </label>
      </fieldset>
    );
  }

  return (
    <>
      <fieldset className="adm-card adm-grid adm-w80">
        <legend>{t.legend}</legend>
        <p className="adm-help adm-field--wide">{t.help}</p>
        <label className="adm-check adm-field--wide">
          <input type="checkbox" checked={c.curated} onChange={(e) => set('curated', e.target.checked)} />
          <span><b>{t.inCollection}</b><span className="adm-help">{t.inCollectionHelp}</span></span>
        </label>
        <Field id="c-era" label={t.era} error={err('c.eraId')}>
          <select value={c.eraId} onChange={(e) => set('eraId', e.target.value)}>
            <option value="">—</option>
            {options.eras.map((e) => <option key={e.id} value={e.id}>{name(e)}</option>)}
          </select>
        </Field>
        <Field id="c-order" label={t.order} help={t.orderHelp} error={err('c.curatedOrder')}><input {...text('curatedOrder')} inputMode="numeric" /></Field>
        <Field id="c-canon" label={t.canonId} error={err('c.canonId')}><input {...text('canonId')} readOnly={locked.canon} spellCheck={false} /></Field>
        <Field id="c-slug" label={t.slug} help={t.slugHelp} error={err('c.slug')}><input {...text('slug')} readOnly={locked.slug} spellCheck={false} /></Field>

        <h3 className="adm-subhead">{t.header}</h3>
        <Field id="c-otitle" label={t.originalTitle} help={t.originalTitleHelp} wide><input {...text('originalTitle')} /></Field>
        <Field id="c-creator" label={t.creator} help={t.creatorHelp}><input {...text('creator')} /></Field>
        <Field id="c-date" label={t.dateDisplay} help={t.dateDisplayHelp}><input {...text('dateDisplay')} /></Field>
        <Field id="c-dkind" label={t.dateKind}>
          <select value={c.dateKind} onChange={(e) => set('dateKind', e.target.value)}>
            {Object.entries(pub.dateKind).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field id="c-scope" label={t.scope} help={t.scopeHelp}>
          <select value={c.scope} onChange={(e) => set('scope', e.target.value)}>
            {Object.entries(pub.scopeName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <fieldset className="adm-field adm-field--wide adm-checks-wrap">
          <legend className="adm-field__label">{t.originalLanguages}</legend>
          <div className="adm-checks">
            {LANGUAGES.map((l) => (
              <label key={l.id}><input type="checkbox" checked={c.originalLanguages.includes(l.id)} onChange={(e) => set('originalLanguages', toggle(c.originalLanguages, l.id, e.target.checked))} /> {l.name[lang]}</label>
            ))}
          </div>
        </fieldset>
        <fieldset className="adm-field adm-field--wide">
          <legend className="adm-field__label">{t.browseRegions}</legend>
          <div className="adm-checks">
            {options.regions.map((r) => (
              <label key={r.id}><input type="checkbox" checked={c.browseRegionIds.includes(r.id)} onChange={(e) => set('browseRegionIds', toggle(c.browseRegionIds, r.id, e.target.checked))} /> {name(r)}</label>
            ))}
          </div>
          <p className="adm-help">{t.browseRegionsHelp}</p>
        </fieldset>
        <Field id="c-geo" label={t.geographicNote} help={t.geographicNoteHelp} wide><input {...text('geographicNote')} /></Field>
        <Field id="c-english" label={t.englishState} wide>
          <select value={c.englishState} onChange={(e) => set('englishState', e.target.value)}>
            {Object.entries(t.englishStates).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field id="c-ednotes" label={t.editionNotes} help={t.editionNotesHelp} wide><textarea {...text('editionNotes')} rows={3} /></Field>
      </fieldset>

      {(['es', 'en'] as const).map((l) => {
        const a = article(l);
        return (
          <fieldset key={l} className="adm-card adm-grid adm-w80" lang={l}>
            <legend>{t.article(lang === 'es' ? pub.langName[l].toLowerCase() : pub.langName[l])}</legend>
            <p className="adm-help adm-field--wide">{t.articleHelp}</p>
            <Field id={`a-${l}-title`} label={t.articleTitle} wide><input value={a.title} onChange={(e) => setArticle(l, 'title', e.target.value)} /></Field>
            {SECTIONS.map((k) => (
              <Field key={k} id={`a-${l}-${k}`} label={k === 'aboutAuthor' ? t.aboutAuthor : k === 'workInItsTime' ? t.workInItsTime : t.whyRead} wide>
                <textarea value={a[k]} onChange={(e) => setArticle(l, k, e.target.value)} rows={7} />
              </Field>
            ))}
          </fieldset>
        );
      })}

      <fieldset className="adm-card adm-w80">
        <legend>{t.editions}</legend>
        <p className="adm-help">{t.editionsHelp}</p>
        <ol className="adm-repeat">
          {c.editions.map((e, i) => {
            const hosting = e.renderMode === 'inline_html' || e.renderMode === 'local_pdf';
            const f = (k: string) => `ed-${i}-${k}`;
            return (
              <li key={e.id || i} className={`adm-repeat__item adm-grid adm-edition${hosting ? ' is-hosted' : ''}`}>
                <div className="adm-edition__head">
                  <b>{e.id || '—'}</b>
                  <button type="button" className="adm-btn adm-btn--small" onClick={() => moveEd(i, -1)} disabled={i === 0} aria-label={`↑ ${e.label || e.id}`}>↑</button>
                  <button type="button" className="adm-btn adm-btn--small" onClick={() => moveEd(i, 1)} disabled={i === c.editions.length - 1} aria-label={`↓ ${e.label || e.id}`}>↓</button>
                </div>
                <Field id={f('lang')} label={t.edLang}>
                  <select value={e.readingLang} onChange={(ev) => setEd(i, { readingLang: ev.target.value })}>
                    {['es', 'pt', 'en', ''].map((k) => <option key={k} value={k}>{t.edLangs[k]}</option>)}
                  </select>
                </Field>
                <label className="adm-check">
                  <input type="checkbox" checked={e.primary} onChange={(ev) => setEd(i, { primary: ev.target.checked })} />
                  <span><b>{t.edPrimary}</b></span>
                </label>
                <Field id={f('extent')} label={t.edExtent}>
                  <select value={e.extent} onChange={(ev) => setEd(i, { extent: ev.target.value })}>
                    {EXTENTS.map((x) => <option key={x} value={x}>{pub.access[x]}</option>)}
                  </select>
                </Field>
                <Field id={f('url')} label={t.edUrl} error={err(`ed.${i}.url`)}><input value={e.url} type="url" inputMode="url" onChange={(ev) => setEd(i, { url: ev.target.value })} /></Field>
                <Field id={f('label')} label={t.edLabel} help={t.edLabelHelp} wide><input value={e.label} onChange={(ev) => setEd(i, { label: ev.target.value })} /></Field>
                <Field id={f('source')} label={t.edSource} help={t.edSourceHelp}><input value={e.sourceName} onChange={(ev) => setEd(i, { sourceName: ev.target.value })} /></Field>
                <Field id={f('translator')} label={t.edTranslator}><input value={e.translator} onChange={(ev) => setEd(i, { translator: ev.target.value })} /></Field>
                <Field id={f('scope')} label={t.edScopeNote} help={t.edScopeNoteHelp}><input value={e.scopeNote} onChange={(ev) => setEd(i, { scopeNote: ev.target.value })} /></Field>
                <Field id={f('year')} label={t.edYear} error={err(`ed.${i}.year`)}><input value={e.publicationYear} inputMode="numeric" onChange={(ev) => setEd(i, { publicationYear: ev.target.value })} /></Field>

                <details className="adm-details adm-details--inline adm-field--wide">
                  <summary>{t.edMore}</summary>
                  <div className="adm-grid">
                    <Field id={f('langs')} label={t.edLanguages} help={t.edLanguagesHelp}><input value={e.languages} onChange={(ev) => setEd(i, { languages: ev.target.value })} spellCheck={false} /></Field>
                    <Field id={f('plan')} label={t.edPlan}>
                      <select value={e.deliveryPlan} onChange={(ev) => setEd(i, { deliveryPlan: ev.target.value })}>
                        {Object.entries(t.edPlans).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </Field>
                    <Field id={f('basis-note')} label={t.edBasis}><input value={e.usHostingBasis} onChange={(ev) => setEd(i, { usHostingBasis: ev.target.value })} spellCheck={false} /></Field>
                    <Field id={f('cite')} label={t.edCitation} help={t.edCitationHelp} wide><textarea value={e.citation} rows={2} onChange={(ev) => setEd(i, { citation: ev.target.value })} lang="en" /></Field>
                  </div>
                </details>

                <div className={`adm-host${err(`ed.${i}.host`) ? ' is-error' : ''}`}>
                  <Field id={f('host')} label={t.host} help={t.hostHelp} error={err(`ed.${i}.host`)} wide>
                    <select value={e.renderMode} onChange={(ev) => setEd(i, { renderMode: ev.target.value })}>
                      {Object.entries(t.renderModes).map(([k, v]) => (
                        <option key={k} value={k} disabled={k === 'inline_html' && !textLangs.includes(e.readingLang)}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  {hosting && (
                    <div className="adm-grid">
                      <label className="adm-check adm-field--wide">
                        <input type="checkbox" checked={e.rightsApproved} onChange={(ev) => setEd(i, { rightsApproved: ev.target.checked })} />
                        <span><b>{t.approved}</b></span>
                      </label>
                      <Field id={f('basis')} label={t.basis} wide>
                        <select value={e.rightsBasis} onChange={(ev) => setEd(i, { rightsBasis: ev.target.value })}>
                          <option value="">—</option>
                          {RIGHTS_BASES.map((b) => <option key={b} value={b}>{t.bases[b]}</option>)}
                        </select>
                      </Field>
                      <Field id={f('evidence')} label={t.evidence} help={t.evidenceHelp} wide><textarea value={e.rightsEvidence} rows={2} onChange={(ev) => setEd(i, { rightsEvidence: ev.target.value })} /></Field>
                      <Field id={f('span')} label={t.span} help={t.spanHelp} wide><input value={e.completeSpan} onChange={(ev) => setEd(i, { completeSpan: ev.target.value })} /></Field>
                      <Field id={f('approver')} label={t.approver}><input value={e.approvedBy} onChange={(ev) => setEd(i, { approvedBy: ev.target.value })} /></Field>
                      <Field id={f('on')} label={t.approvedOn}><input value={e.approvedOn} type="date" onChange={(ev) => setEd(i, { approvedOn: ev.target.value })} /></Field>
                      {e.renderMode === 'local_pdf' && (
                        <Field id={f('pdf')} label={t.pdfUrl} help={t.pdfUrlHelp} wide><input value={e.pdfUrl} type="url" inputMode="url" onChange={(ev) => setEd(i, { pdfUrl: ev.target.value })} /></Field>
                      )}
                    </div>
                  )}
                </div>
                <button type="button" className="adm-btn adm-btn--small adm-btn--quiet adm-repeat__remove" onClick={() => set('editions', c.editions.filter((_, k) => k !== i))}>{t.removeEdition}</button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="adm-btn" onClick={() => set('editions', [...c.editions, { ...blankEdition(), id: newEditionId() }])}>+ {t.addEdition}</button>
      </fieldset>

      <fieldset className="adm-card adm-w80">
        <legend>{t.companions}</legend>
        <p className="adm-help">{t.companionsHelp}</p>
        <ol className="adm-repeat">
          {c.companions.map((x, i) => {
            const up = (k: 'title' | 'url' | 'note', v: string) => set('companions', c.companions.map((y, j) => (j === i ? { ...y, [k]: v } : y)));
            return (
              <li key={i} className="adm-repeat__item adm-grid">
                <Field id={`co-${i}-title`} label={t.companionTitle} wide><input value={x.title} onChange={(e) => up('title', e.target.value)} /></Field>
                <Field id={`co-${i}-url`} label={t.companionUrl}><input value={x.url} type="url" inputMode="url" onChange={(e) => up('url', e.target.value)} /></Field>
                <Field id={`co-${i}-note`} label={t.companionNote}><input value={x.note} onChange={(e) => up('note', e.target.value)} /></Field>
                <button type="button" className="adm-btn adm-btn--small adm-btn--quiet adm-repeat__remove" onClick={() => set('companions', c.companions.filter((_, j) => j !== i))}>{t.removeCompanion}</button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="adm-btn" onClick={() => set('companions', [...c.companions, { title: '', url: '', note: '', relationship: 'separate_work' }])}>+ {t.addCompanion}</button>
      </fieldset>
    </>
  );
}
