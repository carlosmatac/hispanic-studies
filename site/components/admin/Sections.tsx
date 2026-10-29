'use client';

import { useActionState, useState, useTransition } from 'react';
import { deleteSection, moveSection, saveSection } from '@/app/admin/actions';
import { adminDict, type AdminDict, type Lang } from '@/lib/i18n';
import type { SectionRow } from '@/lib/admin/queries';
import type { FormState } from '@/lib/admin/types';
import ConfirmButton from './ConfirmButton';

/* The sections (boxes) of the archive: rename, give dates, reorder, add,
   delete (only when empty). Each row is its own small form. */

function SectionForm({ s, t, common, isNew }: { s?: SectionRow; t: AdminDict['sections']; common: AdminDict['common']; isNew?: boolean }) {
  const [state, action, pending] = useActionState(saveSection, null);
  const err = (k: string) => state?.fields?.[k];
  const f = (k: string) => `sec-${s?.id ?? 'new'}-${k}`;
  return (
    <form action={action} className="adm-grid adm-grid--4">
      <input type="hidden" name="id" value={s?.id ?? ''} />
      <div className={`adm-field${err('nameEs') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('es')}>{t.nameEs}</label>
        <input id={f('es')} name="nameEs" defaultValue={state?.values?.nameEs ?? s?.nameEs} required aria-invalid={!!err('nameEs')} />
      </div>
      <div className={`adm-field${err('nameEn') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('en')}>{t.nameEn}</label>
        <input id={f('en')} name="nameEn" defaultValue={state?.values?.nameEn ?? s?.nameEn} required aria-invalid={!!err('nameEn')} lang="en" />
      </div>
      <div className={`adm-field${err('yearFrom') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('from')}>{t.from}</label>
        <input id={f('from')} name="yearFrom" defaultValue={state?.values?.yearFrom ?? s?.yearFrom ?? ''} inputMode="numeric" />
      </div>
      <div className={`adm-field${err('yearTo') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('to')}>{t.to}</label>
        <input id={f('to')} name="yearTo" defaultValue={state?.values?.yearTo ?? s?.yearTo ?? ''} inputMode="numeric" />
      </div>
      <div className="adm-form-foot adm-field--wide">
        <button className={`adm-btn${isNew ? ' adm-btn--primary' : ''}`} disabled={pending}>{pending ? common.saving : isNew ? `+ ${t.add}` : common.save}</button>
        {state?.message && <span role="status" className={state.ok ? 'is-ok' : 'is-error'}>{state.message}</span>}
      </div>
    </form>
  );
}

export default function Sections({ sections, lang }: { sections: SectionRow[]; lang: Lang }) {
  const { sections: t, common } = adminDict(lang);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<FormState>(null);
  return (
    <>
      {notice?.message && <p className="adm-msg adm-msg--error" role="alert">{notice.message}</p>}
      <ol className="adm-stack">
        {sections.map((s, i) => (
          <li key={s.id} className="adm-card">
            <div className="adm-stack__head">
              <span className="adm-stack__n">{i + 1}</span>
              <b>{lang === 'es' ? s.nameEs : s.nameEn}</b>
              <span className="adm-muted">#{s.id} · {t.works(s.works)}</span>
              <span className="adm-stack__tools">
                <button type="button" className="adm-btn adm-btn--small" disabled={pending || i === 0} onClick={() => start(() => moveSection(s.id, -1))} aria-label={`${common.up}: ${s.nameEs}`}>↑</button>
                <button type="button" className="adm-btn adm-btn--small" disabled={pending || i === sections.length - 1} onClick={() => start(() => moveSection(s.id, 1))} aria-label={`${common.down}: ${s.nameEs}`}>↓</button>
                {s.works > 0
                  ? <span className="adm-muted adm-stack__why">{t.cantDelete(s.works)}</span>
                  : <ConfirmButton className="adm-btn adm-btn--small adm-btn--quiet" label={common.delete} question={t.deleteConfirm(lang === 'es' ? s.nameEs : s.nameEn)}
                    confirm={common.confirm} cancel={common.cancel} action={async () => setNotice(await deleteSection(s.id))} />}
              </span>
            </div>
            <SectionForm key={`${s.id}-${s.nameEs}-${s.nameEn}`} s={s} t={t} common={common} />
          </li>
        ))}
      </ol>
      <section className="adm-card adm-card--add" aria-labelledby="add-section">
        <h2 id="add-section">{t.add}</h2>
        <SectionForm key={sections.length} t={t} common={common} isNew />
      </section>
    </>
  );
}
