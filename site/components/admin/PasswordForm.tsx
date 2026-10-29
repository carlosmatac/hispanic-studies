'use client';

import { useActionState } from 'react';
import { changePassword } from '@/app/admin/actions';
import { adminDict, type Lang } from '@/lib/i18n';

export default function PasswordForm({ lang, min }: { lang: Lang; min: number }) {
  const { account: t, common } = adminDict(lang);
  const [state, action, pending] = useActionState(changePassword, null);
  const err = (k: string) => state?.fields?.[k];
  return (
    <form action={action} className="adm-card adm-grid">
      <h2 className="adm-field--wide">{t.change}</h2>
      <div className={`adm-field adm-field--wide${err('current') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor="pw-current">{t.current}</label>
        <input id="pw-current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className={`adm-field${err('next') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor="pw-next">{t.next}</label>
        <input id="pw-next" name="next" type="password" autoComplete="new-password" minLength={min} required aria-describedby="pw-help" />
        <p className="adm-help" id="pw-help">{t.nextHelp(min)}</p>
      </div>
      <div className={`adm-field${err('again') ? ' is-error' : ''}`}>
        <label className="adm-field__label" htmlFor="pw-again">{t.again}</label>
        <input id="pw-again" name="again" type="password" autoComplete="new-password" required />
      </div>
      <div className="adm-form-foot adm-field--wide">
        <button className="adm-btn adm-btn--primary" disabled={pending}>{pending ? common.saving : common.save}</button>
        {state?.message && <span role="status" className={state.ok ? 'is-ok' : 'is-error'}>{state.message}</span>}
      </div>
    </form>
  );
}
