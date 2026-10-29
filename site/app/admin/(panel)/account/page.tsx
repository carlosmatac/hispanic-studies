import { adminText } from '@/lib/admin/lang';
import { requireSession } from '@/lib/admin/session';
import { PASSWORD_MIN } from '@/lib/admin/password';
import PasswordForm from '@/components/admin/PasswordForm';

export default async function AccountPage() {
  const me = await requireSession();
  const { lang, t } = await adminText();
  return (
    <>
      <div className="adm-head"><div><h1>{t.account.h}</h1><p className="adm-lead">{t.account.signedInAs(`${me.displayName} (${me.username})`)}</p></div></div>
      <section className="adm-card" aria-labelledby="backup-h">
        <h2 id="backup-h">{t.account.backupH}</h2>
        <p className="adm-help">{t.account.backupLead}</p>
        <a className="adm-btn adm-btn--primary" href="/admin/backup" download>{t.nav.backup}</a>
      </section>
      <PasswordForm lang={lang} min={PASSWORD_MIN} />
    </>
  );
}
