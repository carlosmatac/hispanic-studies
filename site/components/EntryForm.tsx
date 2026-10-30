'use client';

import { useActionState, useEffect, useRef, useSyncExternalStore } from 'react';
import { enter } from '@/app/enter/actions';
import type { Dict, Lang } from '@/lib/i18n';

/* The entry page's one field (issue #86). A wrong password is said in place,
   under the field, and the field is ready for another try. Without scripts the
   form still posts and the page answers the same way. */

const onHash = (change: () => void) => {
  window.addEventListener('hashchange', change);
  return () => window.removeEventListener('hashchange', change);
};

export default function EntryForm({ t, lang, next }: { t: Dict['enter']; lang: Lang; next: string | null }) {
  const [state, action, pending] = useActionState(enter, null);
  const field = useRef<HTMLInputElement>(null);
  // the browser keeps a link's #T030 on the entry page; carry it on
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '');
  useEffect(() => { if (state?.wrong) field.current?.focus(); }, [state]);

  const target = next ?? `/${lang}`;
  const wrong = Boolean(state?.wrong) && !pending;
  return (
    <form action={action} className="enter__form">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="next" value={hash && !target.includes('#') ? target + hash : target} />
      <label className="enter__label" htmlFor="enter-password">{t.label}</label>
      <div className="enter__row">
        <input
          ref={field} id="enter-password" name="password" type="password" className="enter__input"
          autoComplete="current-password" required autoFocus aria-invalid={wrong || undefined}
          aria-describedby={wrong ? 'enter-wrong' : undefined}
        />
        <button className="enter__btn" disabled={pending}>{pending ? t.pending : t.submit}</button>
      </div>
      <p id="enter-wrong" className="enter__wrong" role="alert" key={state?.wrong ?? 0}>
        {wrong ? t.wrong : ''}
      </p>
    </form>
  );
}
