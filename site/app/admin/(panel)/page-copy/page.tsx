import { adminText } from '@/lib/admin/lang';
import { getPageCopy } from '@/lib/admin/queries';
import { dict } from '@/lib/i18n';
import PageCopyForm from '@/components/admin/PageCopyForm';

export default async function PageCopyPage() {
  const { lang, t } = await adminText();
  const p = await getPageCopy();
  const [en, es] = [dict('en').canon, dict('es').canon];
  // an empty field shows the site's own default, so there is always something to start from
  const copy = {
    titleEn: p?.titleEn || en.h, titleEs: p?.titleEs || es.h,
    introEn: p?.introEn || en.sub, introEs: p?.introEs || es.sub,
    notesEn: p?.notesEn || en.disclaimer, notesEs: p?.notesEs || es.disclaimer,
    doorEn: p?.doorEn || en.door(0).replace(/^0 /, '{works} '), doorEs: p?.doorEs || es.door(0).replace(/^0 /, '{obras} '),
  };
  return (
    <>
      <div className="adm-head"><div><h1>{t.page.h}</h1><p className="adm-lead">{t.page.lead}</p></div></div>
      <PageCopyForm copy={copy} lang={lang} />
    </>
  );
}
