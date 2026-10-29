'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveWork } from '@/app/admin/actions';
import { LANGUAGES, RIGHTS, type Reference } from '@/lib/canon';
import { swatchStyle } from '@/lib/palette';
import { renderMarkdown, renderTree } from '@/lib/text';
import { suggestId, type WorkPayload } from '@/lib/admin/types';
import { adminDict, type Lang } from '@/lib/i18n';
import type { RegionRow, SectionRow } from '@/lib/admin/queries';
import Citation from '@/components/canon/Citation';
import TextEditor, { minutesFor, type TextEditorHandle } from './TextEditor';
import ConfirmButton from './ConfirmButton';

/* The form of a work: every field of its record, its text in Spanish and/or
   English (and in the original language when it is another), its references
   and links. Grouped in the order Beltrán thinks of them; help under every
   field; what is wrong marked in red; a bar at the foot that saves. */

export type WorkInitial = {
  isNew: boolean;
  work: Omit<WorkPayload, 'texts' | 'isNew'>;
  texts: { lang: string; body: string }[];
  stats: { lang: string; words: number; minutes: number }[];
  updatedAt?: string;
  updatedBy?: string | null;
};

type Props = {
  lang: Lang;
  initial: WorkInitial;
  sections: SectionRow[];
  regions: RegionRow[];
  deleteAction?: () => Promise<void>;
};

const emptyRef = (): Reference => ({ kind: 'book', author: '', title: '', container: '', edition: '', publisher: '', place: '', year: '', pages: '', url: '', accessed: '' });

function Field({ label, help, error, children, wide, id }: { label: string; help?: string; error?: string; children: React.ReactElement<Record<string, unknown>>; wide?: boolean; id: string }) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = React.cloneElement(children, {
    id, 'aria-invalid': error ? true : undefined, 'aria-describedby': [helpId, errId].filter(Boolean).join(' ') || undefined,
  });
  return (
    <div className={`adm-field${wide ? ' adm-field--wide' : ''}${error ? ' is-error' : ''}`}>
      <label className="adm-field__label" htmlFor={id}>{label}</label>
      {control}
      {help && <p className="adm-help" id={helpId}>{help}</p>}
      {error && <p className="adm-field__error" id={errId}>{error}</p>}
    </div>
  );
}

/** "Draft (only you see it)": the part in brackets is dropped on a phone, where the bar is narrow. */
const Two = ({ text }: { text: string }) => {
  const m = /^(.*?)\s*(\(.*\))$/.exec(text);
  return m ? <>{m[1]}<span className="adm-wide-only"> {m[2]}</span></> : <>{text}</>;
};

export default function WorkForm({ lang, initial, sections, regions, deleteAction }: Props) {
  const t = adminDict(lang);
  const w = t.work;
  const router = useRouter();
  const [rec, setRec] = useState(initial.work);
  const [isNew, setIsNew] = useState(initial.isNew);
  const [idTouched, setIdTouched] = useState(!initial.isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dirtyTexts, setDirtyTexts] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState(initial.stats);
  const [live, setLive] = useState<Record<string, number>>({});
  const [pending, start] = useTransition();
  const [meta, setMeta] = useState({ at: initial.updatedAt, by: initial.updatedBy });
  const editors = useRef<Record<string, TextEditorHandle | null>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // the text tabs: Spanish, English, and the original language when it is another
  const textLangs = ['es', 'en', ...(rec.language !== 'es' && rec.language !== 'en' ? [rec.language] : [])];
  const textOf = (l: string) => initial.texts.find((x) => x.lang === l)?.body ?? '';
  const [tab, setTab] = useState(() => (textOf(rec.language) ? rec.language : textOf('es') ? 'es' : textOf('en') ? 'en' : rec.language === 'en' ? 'en' : 'es'));
  const [preview, setPreview] = useState<string | null>(null);
  const langName = (id: string) => { const n = LANGUAGES.find((l) => l.id === id)?.name[lang] ?? id; return n.charAt(0).toUpperCase() + n.slice(1); };

  const set = <K extends keyof typeof rec>(k: K, v: (typeof rec)[K]) => {
    setRec((r) => {
      const next = { ...r, [k]: v };
      if (isNew && !idTouched && (k === 'author' || k === 'title')) next.id = suggestId(next.author, next.title);
      return next;
    });
    setDirty(true);
  };
  const text = (k: keyof typeof rec) => ({ value: String(rec[k] ?? ''), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never) });

  const onDirty = useCallback((l: string) => { setDirty(true); setDirtyTexts((s) => (s.has(l) ? s : new Set(s).add(l))); }, []);
  const counters = useRef<Record<string, (n: number) => void>>({});
  const counter = (l: string) => (counters.current[l] ??= (n: number) => setLive((c) => (c[l] === n ? c : { ...c, [l]: n })));
  const dirtiers = useRef<Record<string, () => void>>({});
  const dirtier = (l: string) => (dirtiers.current[l] ??= () => onDirty(l));

  // leaving with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = () => {
    setMessage(null);
    const texts = [...dirtyTexts].map((l) => ({ lang: l, body: editors.current[l]?.getMarkdown() ?? '' }));
    start(async () => {
      const r = await saveWork({ ...rec, isNew, texts });
      if (!r.ok) {
        setErrors(r.fields ?? {});
        setMessage({ ok: false, text: r.message });
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      setErrors({});
      setDirty(false);
      setDirtyTexts(new Set());
      setStats(r.texts);
      setMeta({ at: r.updatedAt, by: null });
      setMessage({ ok: true, text: r.message });
      if (isNew) {
        setIsNew(false);
        setIdTouched(true);
        router.replace(`/admin/works/${encodeURIComponent(r.id)}?created=1`);
      }
    });
  };

  const err = (k: string) => errors[k];
  const statFor = (l: string) => stats.find((s) => s.lang === l);
  const wordsNow = (l: string) => live[l] ?? statFor(l)?.words ?? 0;
  const when = (iso?: string) => (iso ? new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso)) : '');
  const usedSwatch = (id: string) => regions.find((r) => r.id === id)?.swatch ?? 'paper';
  const name = (r: { nameEn: string; nameEs: string }) => (lang === 'es' ? r.nameEs : r.nameEn);

  const previewTree = preview != null ? renderMarkdown(preview, { adSlot: false }).tree : null;

  return (
    <form ref={formRef} className="adm-work" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
      <div className="adm-head">
        <div>
          <p className="adm-eyebrow">{isNew ? w.newH : w.editH}</p>
          <h1>{rec.title || w.newH}</h1>
          {meta.at && <p className="adm-muted">{w.lastChange(when(meta.at), meta.by ?? '')}</p>}
        </div>
        {!isNew && (
          <div className="adm-head__tools">
            <a className="adm-btn" href={`/admin/view?path=/${lang}/archive/${encodeURIComponent(rec.id)}`} target="_blank" rel="noopener">{t.common.viewOnSite} ↗</a>
            <a className="adm-btn" href={`/admin/works/${encodeURIComponent(rec.id)}/history`}>{w.history}</a>
          </div>
        )}
      </div>

      <fieldset className="adm-card adm-grid">
        <legend>{w.essentials}</legend>
        <Field id="f-title" label={w.title} help={w.titleHelp} error={err('title')} wide><input {...text('title')} required /></Field>
        <Field id="f-author" label={w.author} help={w.authorHelp} error={err('author')}><input {...text('author')} /></Field>
        <Field id="f-fullName" label={w.fullName}><input {...text('fullName')} /></Field>
        <Field id="f-life" label={w.life} help={w.lifeHelp}><input {...text('life')} /></Field>
        <Field id="f-year" label={w.year} help={w.yearHelp} error={err('year')}><input {...text('year')} inputMode="numeric" required /></Field>
        <Field id="f-section" label={w.section} help={w.sectionHelp} error={err('sectionId')}>
          <select {...text('sectionId')}>{sections.map((s) => <option key={s.id} value={s.id}>{name(s)}</option>)}</select>
        </Field>
        <Field id="f-region" label={w.region} help={w.regionHelp} error={err('regionId')}>
          <select {...text('regionId')}>{regions.map((r) => <option key={r.id} value={r.id}>{name(r)}</option>)}</select>
        </Field>
        <div className="adm-field adm-swatch-preview" aria-hidden="true">
          <span className="adm-field__label">&nbsp;</span>
          <span className="adm-mini-card" style={swatchStyle(usedSwatch(rec.regionId))}><span>{rec.year}</span><i>{rec.title.split(':')[0] || '…'}</i></span>
        </div>
        <Field id="f-place" label={w.place} help={w.placeHelp}><input {...text('place')} /></Field>
        <Field id="f-code" label={w.code} help={w.codeHelp}><input {...text('code')} maxLength={4} /></Field>
        <Field id="f-language" label={w.language} error={err('language')}>
          <select {...text('language')}>{LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name[lang]}</option>)}</select>
        </Field>
        <Field id="f-id" label={w.id} help={isNew ? w.idHelp : undefined} error={err('id')}>
          <input value={rec.id} readOnly={!isNew} onChange={(e) => { setIdTouched(true); set('id', e.target.value.toLowerCase()); }} spellCheck={false} />
        </Field>
      </fieldset>

      <fieldset className="adm-card adm-grid">
        <legend>{w.rights}</legend>
        <Field id="f-rights" label={w.rights} help={w.rightsHelp} error={err('rights')} wide>
          <select {...text('rights')}>{RIGHTS.map((r) => <option key={r} value={r}>{w.rightsName[r]}</option>)}</select>
        </Field>
        <Field id="f-pdSpain" label={w.pdSpainYear} help={w.pdYearHelp} error={err('pdSpainYear')}><input {...text('pdSpainYear')} inputMode="numeric" /></Field>
        <Field id="f-pdUs" label={w.pdUsYear} help={w.pdYearHelp} error={err('pdUsYear')}><input {...text('pdUsYear')} inputMode="numeric" /></Field>
        <label className="adm-check adm-field--wide">
          <input type="checkbox" checked={rec.needsTranscription} onChange={(e) => set('needsTranscription', e.target.checked)} />
          <span><b>{w.needsTranscription}</b><span className="adm-help">{w.needsTranscriptionHelp}</span></span>
        </label>
      </fieldset>

      <fieldset className="adm-card">
        <legend>{w.texts}</legend>
        <p className="adm-help">{w.textHelp}</p>
        {rec.rights !== 'public-domain' && <p className="adm-msg adm-msg--warn">{w.textNotShown}</p>}
        <div className="adm-tabs" role="tablist" aria-label={w.texts}>
          {textLangs.map((l) => {
            const has = dirtyTexts.has(l) ? wordsNow(l) > 0 : !!statFor(l);
            return (
              <button key={l} type="button" role="tab" id={`tab-${l}`} aria-controls={`panel-${l}`} aria-selected={tab === l}
                onClick={() => { setTab(l); setPreview(null); }}>
                {langName(l)}{l === rec.language ? ` (${w.original})` : ''}
                <span className="adm-tabs__state">{has ? `${minutesFor(wordsNow(l))} min` : w.empty}</span>
              </button>
            );
          })}
        </div>
        {textLangs.map((l) => (
          <div key={l} role="tabpanel" id={`panel-${l}`} aria-labelledby={`tab-${l}`} hidden={tab !== l} className="adm-tabpanel">
            <div className="adm-tabpanel__bar">
              <span className="adm-muted">{w.words(wordsNow(l), minutesFor(wordsNow(l)))}</span>
              <span className="adm-tabpanel__tools">
                <button type="button" className="adm-btn adm-btn--small" aria-pressed={tab === l && preview != null}
                  onClick={() => setPreview(preview == null ? (editors.current[l]?.getMarkdown() ?? '') : null)}>
                  {preview == null ? w.preview : w.write}
                </button>
                <ConfirmButton className="adm-btn adm-btn--small adm-btn--quiet" label={w.tb.clear} question={w.clearConfirm(langName(l))}
                  confirm={w.tb.clear} cancel={t.common.cancel} onConfirm={() => editors.current[l]?.clear()} />
              </span>
            </div>
            <div hidden={tab === l && preview != null}>
              <TextEditor ref={(h) => { editors.current[l] = h; }} initial={textOf(l)} lang={l} ui={lang} label={`${w.texts} · ${langName(l)}`}
                onDirty={dirtier(l)} onCount={counter(l)} />
            </div>
            {tab === l && previewTree && (
              <div className="adm-preview">
                <p className="adm-help">{w.previewHelp}</p>
                <div className="reader adm-preview__page" lang={l}>{renderTree(previewTree, React)}</div>
              </div>
            )}
          </div>
        ))}
      </fieldset>

      <fieldset className="adm-card adm-grid">
        <legend>{w.source}</legend>
        <Field id="f-sEd" label={w.sourceEdition} help={w.sourceEditionHelp} wide><input {...text('sourceEdition')} /></Field>
        <Field id="f-sUrl" label={w.sourceUrl} help={w.sourceUrlHelp} error={err('sourceUrl')}><input {...text('sourceUrl')} type="url" inputMode="url" /></Field>
        <Field id="f-sRev" label={w.sourceRevision} help={w.sourceRevisionHelp}><input {...text('sourceRevision')} /></Field>
        <Field id="f-sLic" label={w.sourceLicence} help={w.sourceLicenceHelp} wide><input {...text('sourceLicence')} /></Field>
      </fieldset>

      <fieldset className="adm-card">
        <legend>{w.links}</legend>
        <p className="adm-help">{w.linksHelp}</p>
        <ol className="adm-repeat">
          {rec.links.map((l, i) => (
            <li key={i} className="adm-repeat__item adm-grid">
              <Field id={`f-link-${i}-label`} label={w.linkLabel}>
                <input value={l.label} onChange={(e) => set('links', rec.links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
              </Field>
              <Field id={`f-link-${i}-url`} label={w.linkUrl} error={err(`links.${i}`)}>
                <input value={l.url} type="url" inputMode="url" onChange={(e) => set('links', rec.links.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
              </Field>
              <button type="button" className="adm-btn adm-btn--small adm-btn--quiet adm-repeat__remove" onClick={() => set('links', rec.links.filter((_, k) => k !== i))}>{w.removeLink}</button>
            </li>
          ))}
        </ol>
        <button type="button" className="adm-btn" onClick={() => set('links', [...rec.links, { label: '', url: '' }])}>+ {w.addLink}</button>
      </fieldset>

      <fieldset className="adm-card">
        <legend>{w.references}</legend>
        <p className="adm-help">{w.refsHelp}</p>
        <ol className="adm-repeat">
          {rec.references.map((r, i) => {
            const up = (k: keyof Reference, v: string) => set('references', rec.references.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
            const container = w.ref.container[r.kind];
            return (
              <li key={i} className="adm-repeat__item adm-grid">
                <Field id={`f-ref-${i}-kind`} label={w.refKind}>
                  <select value={r.kind} onChange={(e) => up('kind', e.target.value)}>
                    {(['book', 'chapter', 'article', 'web'] as const).map((k) => <option key={k} value={k}>{w.refKinds[k]}</option>)}
                  </select>
                </Field>
                <Field id={`f-ref-${i}-author`} label={w.ref.author} help={w.ref.authorHelp}><input value={r.author} onChange={(e) => up('author', e.target.value)} /></Field>
                <Field id={`f-ref-${i}-title`} label={w.ref.title} wide><input value={r.title} onChange={(e) => up('title', e.target.value)} /></Field>
                {container && <Field id={`f-ref-${i}-container`} label={container} wide><input value={r.container} onChange={(e) => up('container', e.target.value)} /></Field>}
                <Field id={`f-ref-${i}-edition`} label={w.ref.edition} help={w.ref.editionHelp}><input value={r.edition} onChange={(e) => up('edition', e.target.value)} /></Field>
                {r.kind !== 'article' && r.kind !== 'web' && <Field id={`f-ref-${i}-publisher`} label={w.ref.publisher}><input value={r.publisher} onChange={(e) => up('publisher', e.target.value)} /></Field>}
                {r.kind !== 'article' && r.kind !== 'web' && <Field id={`f-ref-${i}-place`} label={w.ref.place}><input value={r.place} onChange={(e) => up('place', e.target.value)} /></Field>}
                <Field id={`f-ref-${i}-year`} label={w.ref.year}><input value={r.year} onChange={(e) => up('year', e.target.value)} /></Field>
                {r.kind !== 'web' && <Field id={`f-ref-${i}-pages`} label={w.ref.pages}><input value={r.pages} onChange={(e) => up('pages', e.target.value)} /></Field>}
                <Field id={`f-ref-${i}-url`} label={w.ref.url} error={err(`references.${i}.url`)}><input value={r.url} type="url" inputMode="url" onChange={(e) => up('url', e.target.value)} /></Field>
                {r.url && <Field id={`f-ref-${i}-accessed`} label={w.ref.accessed}><input value={r.accessed} type="date" onChange={(e) => up('accessed', e.target.value)} /></Field>}
                <div className="adm-field adm-field--wide adm-cite">
                  <span className="adm-field__label">{w.citation}</span>
                  <p><Citation reference={r} lang={lang} /></p>
                </div>
                <button type="button" className="adm-btn adm-btn--small adm-btn--quiet adm-repeat__remove" onClick={() => set('references', rec.references.filter((_, j) => j !== i))}>{w.removeRef}</button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="adm-btn" onClick={() => set('references', [...rec.references, emptyRef()])}>+ {w.addRef}</button>
      </fieldset>

      <fieldset className="adm-card adm-grid">
        <legend>{w.notes}</legend>
        <Field id="f-noteEs" label={w.noteEs} help={w.noteHelp}><textarea {...text('noteEs')} rows={4} /></Field>
        <Field id="f-noteEn" label={w.noteEn} help={w.noteHelp}><textarea {...text('noteEn')} rows={4} /></Field>
        <Field id="f-sumEs" label={w.summaryEs}><textarea {...text('summaryEs')} rows={4} /></Field>
        <Field id="f-sumEn" label={w.summaryEn}><textarea {...text('summaryEn')} rows={4} /></Field>
      </fieldset>

      <details className="adm-card adm-details">
        <summary>{w.compiler}</summary>
        <p className="adm-help">{w.compilerHelp}</p>
        <div className="adm-grid">
          <label className="adm-check adm-field--wide">
            <input type="checkbox" checked={rec.counter} onChange={(e) => set('counter', e.target.checked)} />
            <span><b>{w.counter}</b><span className="adm-help">{w.counterHelp}</span></span>
          </label>
          <Field id="f-camp" label={w.camp} wide><input {...text('camp')} lang="en" /></Field>
          <Field id="f-stance" label={w.position} wide><textarea {...text('stance')} rows={3} lang="en" /></Field>
          <Field id="f-bCode" label={w.buenoCode}><input {...text('buenoCode')} /></Field>
          <Field id="f-bName" label={w.buenoName}><input {...text('buenoName')} lang="en" /></Field>
        </div>
      </details>

      {!isNew && deleteAction && (
        <div className="adm-danger">
          <ConfirmButton className="adm-btn adm-btn--danger" label={w.deleteWork} question={w.deleteConfirm(rec.title)}
            confirm={t.common.confirm} cancel={t.common.cancel} action={deleteAction} />
        </div>
      )}

      <div className="adm-savebar" role="region" aria-label={t.common.save}>
        <div className="adm-savebar__status" role="radiogroup" aria-label={w.status}>
          <label><input type="radio" name="status" checked={rec.status === 'draft'} onChange={() => set('status', 'draft')} /> <Two text={w.draft} /></label>
          <label><input type="radio" name="status" checked={rec.status === 'published'} onChange={() => set('status', 'published')} /> <Two text={w.published} /></label>
        </div>
        <p className="adm-savebar__msg" role="status" aria-live="polite">
          {pending ? t.common.saving : message ? <span className={message.ok ? 'is-ok' : 'is-error'}>{message.text}</span> : dirty ? t.common.unsaved : ''}
        </p>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={pending}>{t.common.save}</button>
      </div>
    </form>
  );
}

