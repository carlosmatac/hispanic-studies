'use client';

import { useActionState } from 'react';
import { savePage } from '@/app/admin/actions';
import { adminDict, type Lang } from '@/lib/i18n';

type Copy = Record<'titleEn' | 'titleEs' | 'introEn' | 'introEs' | 'notesEn' | 'notesEs' | 'doorEn' | 'doorEs', string>;

/* The archive page's own words, in Spanish and English side by side. */
export default function PageCopyForm({ copy, lang }: { copy: Copy; lang: Lang }) {
  const { page: t, common } = adminDict(lang);
  const [state, action, pending] = useActionState(savePage, null);
  const rows: [keyof Copy, keyof Copy, string, number][] = [
    ['titleEs', 'titleEn', t.title, 2], ['introEs', 'introEn', t.intro, 6], ['notesEs', 'notesEn', t.notes, 5], ['doorEs', 'doorEn', t.door, 3],
  ];
  return (
    <form action={action} className="adm-card">
      {rows.map(([es, en, label, lines]) => (
        <fieldset key={es} className="adm-grid adm-pair">
          <legend>{label}</legend>
          <div className="adm-field">
            <label className="adm-field__label" htmlFor={`p-${es}`}>{common.spanish}</label>
            <textarea id={`p-${es}`} name={es} defaultValue={copy[es]} rows={lines} lang="es" />
          </div>
          <div className="adm-field">
            <label className="adm-field__label" htmlFor={`p-${en}`}>{common.english}</label>
            <textarea id={`p-${en}`} name={en} defaultValue={copy[en]} rows={lines} lang="en" />
          </div>
        </fieldset>
      ))}
      <div className="adm-form-foot">
        <button className="adm-btn adm-btn--primary" disabled={pending}>{pending ? common.saving : common.save}</button>
        {state?.message && <span role="status" className={state.ok ? 'is-ok' : 'is-error'}>{state.message}</span>}
        <a className="adm-btn" href="/admin/view?path=/es/archive" target="_blank" rel="noopener">{common.viewOnSite} ↗</a>
      </div>
    </form>
  );
}
