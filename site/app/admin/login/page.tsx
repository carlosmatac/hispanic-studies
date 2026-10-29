import { redirect } from 'next/navigation';
import { getSession } from '@/lib/admin/session';
import { adminText } from '@/lib/admin/lang';
import LoginForm from '@/components/admin/LoginForm';
import LangToggle from '@/components/admin/LangToggle';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSession()) redirect('/admin');
  const { lang, t } = await adminText();
  const { next } = await searchParams;
  return (
    <main className="adm-login">
      <div className="adm-login__card">
        <span className="adm-login__eagle" aria-hidden="true" />
        <p className="adm-eyebrow">{t.brand}</p>
        <h1>{t.signIn.h}</h1>
        <p className="adm-lead">{t.signIn.lead}</p>
        <LoginForm t={t.signIn} next={next} />
        <LangToggle lang={lang} label={t.lang.label} names={{ es: t.lang.es, en: t.lang.en }} />
      </div>
    </main>
  );
}
