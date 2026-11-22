'use client';

import { useActionState } from 'react';
import { saveEra } from '@/app/admin/actions';
import { adminDict, type Lang } from '@/lib/i18n';

/* The eras of the curated 80 (issue #93): rename them and give their years.
   Their order and their works come from Beltrán's list. Each row is its own form. */

type Era = { id: string; nameEn: string; nameEs: string; yearFrom: number | null; yearTo: number | null };

function EraForm({ e, lang }: { e: Era; lang: Lang }) {
  const { curated: t, common } = adminDict(lang);
  const [state, action, pending] = useActionState(saveEra, null);
  const err = (k: string) => state?.fields?.[k];
  const f = (k: string) => `era-${e.id}-${k}`;
  return (
    <form action={action} className="adm-grid adm-grid--4">
      <input type="hidden" name="id" value={e.id} />
      <div className={`adm-field adm-field--wide${err('nameEs') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('es')}>{t.eraNameEs}</label>
        <input id={f('es')} name="nameEs" defaultValue={state?.values?.nameEs ?? e.nameEs} required aria-invalid={!!err('nameEs')} />
      </div>
      <div className={`adm-field adm-field--wide${err('nameEn') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('en')}>{t.eraNameEn}</label>
        <input id={f('en')} name="nameEn" defaultValue={state?.values?.nameEn ?? e.nameEn} required aria-invalid={!!err('nameEn')} lang="en" />
      </div>
      <div className={`adm-field${err('yearFrom') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('from')}>{t.from}</label>
        <input id={f('from')} name="yearFrom" defaultValue={state?.values?.yearFrom ?? e.yearFrom ?? ''} inputMode="numeric" />
      </div>
      <div className={`adm-field${err('yearTo') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('to')}>{t.to}</label>
        <input id={f('to')} name="yearTo" defaultValue={state?.values?.yearTo ?? e.yearTo ?? ''} inputMode="numeric" />
      </div>
      <div className="adm-form-foot adm-field--wide">
        <button className="adm-btn" disabled={pending}>{pending ? common.saving : common.save}</button>
        {state?.message && <span role="status" className={state.ok ? 'is-ok' : 'is-error'}>{state.message}</span>}
      </div>
    </form>
  );
}

export default function Eras({ eras, lang }: { eras: Era[]; lang: Lang }) {
  return (
    <ol className="adm-stack">
      {eras.map((e, i) => (
        <li key={e.id} className="adm-card">
          <div className="adm-stack__head">
            <span className="adm-stack__n">{i + 1}</span>
            <b>{lang === 'es' ? e.nameEs : e.nameEn}</b>
            <span className="adm-muted">#{e.id}</span>
          </div>
          <EraForm key={`${e.id}-${e.nameEs}-${e.nameEn}`} e={e} lang={lang} />
        </li>
      ))}
    </ol>
  );
}
