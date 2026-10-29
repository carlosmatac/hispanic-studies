import { adminText } from '@/lib/admin/lang';
import { listSections } from '@/lib/admin/queries';
import Sections from '@/components/admin/Sections';

export default async function SectionsPage() {
  const { lang, t } = await adminText();
  const sections = await listSections();
  return (
    <>
      <div className="adm-head"><div><h1>{t.sections.h}</h1><p className="adm-lead">{t.sections.lead}</p></div></div>
      <Sections sections={sections} lang={lang} />
    </>
  );
}
