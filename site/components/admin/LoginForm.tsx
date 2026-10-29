'use client';

import { useActionState } from 'react';
import { login } from '@/app/admin/actions';
import type { AdminDict } from '@/lib/i18n';

export default function LoginForm({ t, next }: { t: AdminDict['signIn']; next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="adm-login__form">
      <input type="hidden" name="next" value={next ?? ''} />
      <label className="adm-field">
        <span className="adm-field__label">{t.user}</span>
        <input name="username" key={state?.values?.username ?? ''} defaultValue={state?.values?.username} autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">{t.password}</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.message && <p className="adm-msg adm-msg--error" role="alert">{state.message}</p>}
      <button className="adm-btn adm-btn--primary" disabled={pending}>{pending ? '…' : t.submit}</button>
    </form>
  );
}
