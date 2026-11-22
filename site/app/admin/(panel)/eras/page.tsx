import { adminText } from '@/lib/admin/lang';
import { listCurated } from '@/lib/admin/queries';
import Eras from '@/components/admin/Eras';

/* The eras of the curated 80 (issue #93): their names in Spanish and English. */
export default async function ErasPage() {
  const { lang, t } = await adminText();
  const { eras } = await listCurated();
  return (
    <>
      <div className="adm-head"><div><h1>{t.curated.eras}</h1><p className="adm-lead">{t.curated.erasLead}</p></div></div>
      <Eras eras={eras} lang={lang} />
    </>
  );
}
