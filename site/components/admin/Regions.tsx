'use client';

import { useActionState, useState, useTransition } from 'react';
import { deleteRegion, moveRegion, saveRegion } from '@/app/admin/actions';
import { SWATCHES, swatchStyle } from '@/lib/palette';
import { adminDict, type AdminDict, type Lang } from '@/lib/i18n';
import type { RegionRow } from '@/lib/admin/queries';
import type { FormState } from '@/lib/admin/types';
import ConfirmButton from './ConfirmButton';

/* The regions: names, what they cover, and a colour from the fixed palette
   (lib/palette.ts). Only the colours no other region wears are offered; the
   server refuses a taken one anyway. */

function RegionForm({ r, used, t, common, lang, isNew }: {
  r?: RegionRow; used: Set<string>; t: AdminDict['regions']; common: AdminDict['common']; lang: 'en' | 'es'; isNew?: boolean;
}) {
  const [state, action, pending] = useActionState(saveRegion, null);
  const free = SWATCHES.filter((s) => !used.has(s.id) || s.id === r?.swatch);
  const [pick, setPick] = useState(r?.swatch ?? free[0]?.id ?? '');
  const err = (k: string) => state?.fields?.[k];
  const f = (k: string) => `reg-${r?.id ?? 'new'}-${k}`;
  if (isNew && !free.length) return <p className="adm-msg adm-msg--warn">{t.noColour}</p>;
  return (
    <form action={action} className="adm-grid">
      <input type="hidden" name="id" value={r?.id ?? ''} />
      <div className={`adm-field${err('nameEs') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('es')}>{t.nameEs}</label>
        <input id={f('es')} name="nameEs" defaultValue={state?.values?.nameEs ?? r?.nameEs} required aria-invalid={!!err('nameEs')} />
      </div>
      <div className={`adm-field${err('nameEn') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor={f('en')}>{t.nameEn}</label>
        <input id={f('en')} name="nameEn" defaultValue={state?.values?.nameEn ?? r?.nameEn} required aria-invalid={!!err('nameEn')} lang="en" />
      </div>
      <div className="adm-field">
        <label className="adm-field__label" htmlFor={f('nes')}>{t.noteEs}</label>
        <input id={f('nes')} name="noteEs" defaultValue={state?.values?.noteEs ?? r?.noteEs} aria-describedby={f('nh')} />
      </div>
      <div className="adm-field">
        <label className="adm-field__label" htmlFor={f('nen')}>{t.noteEn}</label>
        <input id={f('nen')} name="noteEn" defaultValue={state?.values?.noteEn ?? r?.noteEn} lang="en" />
        <p className="adm-help" id={f('nh')}>{t.noteHelp}</p>
      </div>
      <fieldset className={`adm-field adm-field--wide adm-swatches${err('swatch') ? ' is-error' : ''}`}>
        <legend className="adm-field__label">{t.colour}</legend>
        <p className="adm-help">{t.colourHelp}</p>
        <div className="adm-swatches__list">
          {free.map((s) => (
            <label key={s.id} className="adm-swatch">
              <input type="radio" name="swatch" value={s.id} checked={pick === s.id} onChange={() => setPick(s.id)} />
              <span className="adm-swatch__chip" style={swatchStyle(s.id)} aria-hidden="true"><span>Aa</span></span>
              <span className="adm-swatch__name">{s.name[lang]}</span>
            </label>
          ))}
        </div>
        {err('swatch') && <p className="adm-field__error">{err('swatch')}</p>}
      </fieldset>
      <div className="adm-form-foot adm-field--wide">
        <button className={`adm-btn${isNew ? ' adm-btn--primary' : ''}`} disabled={pending}>{pending ? common.saving : isNew ? `+ ${t.add}` : common.save}</button>
        {state?.message && <span role="status" className={state.ok ? 'is-ok' : 'is-error'}>{state.message}</span>}
      </div>
    </form>
  );
}

export default function Regions({ regions, lang }: { regions: RegionRow[]; lang: Lang }) {
  const { regions: t, common } = adminDict(lang);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<FormState>(null);
  const used = new Set(regions.map((r) => r.swatch));
  const usedKey = [...used].sort().join(',');
  return (
    <>
      {notice?.message && <p className="adm-msg adm-msg--error" role="alert">{notice.message}</p>}
      <ol className="adm-stack">
        {regions.map((r, i) => (
          <li key={r.id} className="adm-card">
            <div className="adm-stack__head">
              <span className="adm-legend-chip" style={swatchStyle(r.swatch)} aria-hidden="true" />
              <b>{lang === 'es' ? r.nameEs : r.nameEn}</b>
              <span className="adm-muted">{t.works(r.works)}</span>
              <span className="adm-stack__tools">
                <button type="button" className="adm-btn adm-btn--small" disabled={pending || i === 0} onClick={() => start(() => moveRegion(r.id, -1))} aria-label={`${common.up}: ${r.nameEs}`}>↑</button>
                <button type="button" className="adm-btn adm-btn--small" disabled={pending || i === regions.length - 1} onClick={() => start(() => moveRegion(r.id, 1))} aria-label={`${common.down}: ${r.nameEs}`}>↓</button>
                {r.works > 0
                  ? <span className="adm-muted adm-stack__why">{t.cantDelete(r.works)}</span>
                  : <ConfirmButton className="adm-btn adm-btn--small adm-btn--quiet" label={common.delete} question={t.deleteConfirm(lang === 'es' ? r.nameEs : r.nameEn)}
                    confirm={common.confirm} cancel={common.cancel} action={async () => setNotice(await deleteRegion(r.id))} />}
              </span>
            </div>
            <details className="adm-details adm-details--inline">
              <summary>{common.edit}</summary>
              <RegionForm key={`${r.id}-${usedKey}`} r={r} used={used} t={t} common={common} lang={lang} />
            </details>
          </li>
        ))}
      </ol>
      <section className="adm-card adm-card--add" aria-labelledby="add-region">
        <h2 id="add-region">{t.add}</h2>
        <RegionForm key={usedKey} used={used} t={t} common={common} lang={lang} isNew />
      </section>
    </>
  );
}
