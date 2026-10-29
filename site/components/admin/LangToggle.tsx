'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminLang } from '@/app/admin/actions';
import type { Lang } from '@/lib/i18n';

/* Español / English for the back office itself (a cookie; the page reloads its words). */
export default function LangToggle({ lang, label, names }: { lang: Lang; label: string; names: Record<Lang, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="adm-lang" role="group" aria-label={label}>
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l} type="button" lang={l} aria-pressed={l === lang} disabled={pending}
          onClick={() => start(async () => { await setAdminLang(l); router.refresh(); })}
        >{names[l]}</button>
      ))}
    </div>
  );
}
