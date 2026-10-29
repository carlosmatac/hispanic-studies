import { adminText } from '@/lib/admin/lang';
import { listRegions } from '@/lib/admin/queries';
import Regions from '@/components/admin/Regions';

export default async function RegionsPage() {
  const { lang, t } = await adminText();
  const regions = await listRegions();
  return (
    <>
      <div className="adm-head"><div><h1>{t.regions.h}</h1><p className="adm-lead">{t.regions.lead}</p></div></div>
      <Regions regions={regions} lang={lang} />
    </>
  );
}
