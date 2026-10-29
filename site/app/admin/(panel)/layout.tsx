import Link from 'next/link';
import { requireSession } from '@/lib/admin/session';
import { adminText } from '@/lib/admin/lang';
import { logout } from '@/app/admin/actions';
import LangToggle from '@/components/admin/LangToggle';
import AdminNav from '@/components/admin/AdminNav';

/* Every page of the back office but the sign-in: the bar with the sections of
   the back office, the language, the backup and the way out. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireSession();
  const { lang, t } = await adminText();
  const nav = [
    { href: '/admin', label: t.nav.works },
    { href: '/admin/sections', label: t.nav.sections },
    { href: '/admin/regions', label: t.nav.regions },
    { href: '/admin/page-copy', label: t.nav.page },
    { href: '/admin/account', label: t.nav.account },
  ];
  return (
    <>
      <a className="adm-skip" href="#adm-main">{t.nav.skip}</a>
      <header className="adm-bar">
        <Link className="adm-bar__brand" href="/admin">
          <span className="adm-bar__eagle" aria-hidden="true" />
          <span>{t.brand}</span>
        </Link>
        <AdminNav items={nav} label={t.nav.menu} />
        <div className="adm-bar__tools">
          <a className="adm-bar__link" href={`/admin/view?path=/${lang}/archive`}>{t.nav.site} ↗</a>
          <LangToggle lang={lang} label={t.lang.label} names={{ es: t.lang.es, en: t.lang.en }} />
          <form action={logout}>
            <button className="adm-bar__out" title={me.displayName}>{t.nav.signOut}</button>
          </form>
        </div>
      </header>
      <main id="adm-main" className="adm-main">{children}</main>
    </>
  );
}
