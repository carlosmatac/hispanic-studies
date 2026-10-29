import { adminText } from '@/lib/admin/lang';
import { listRegions, listSections } from '@/lib/admin/queries';
import WorkForm from '@/components/admin/WorkForm';
import { blankWork } from '../load';

export default async function NewWorkPage() {
  const { lang } = await adminText();
  const [sections, regions] = await Promise.all([listSections(), listRegions()]);
  return <WorkForm lang={lang} initial={blankWork(sections[0]?.id ?? '', regions[0]?.id ?? '')} sections={sections} regions={regions} />;
}
