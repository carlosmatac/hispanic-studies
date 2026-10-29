import { notFound } from 'next/navigation';
import { adminText } from '@/lib/admin/lang';
import { listRegions, listSections } from '@/lib/admin/queries';
import { deleteWork } from '@/app/admin/actions';
import WorkForm from '@/components/admin/WorkForm';
import { loadWork } from '../load';

export default async function EditWorkPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; restored?: string }> }) {
  const { id } = await params;
  const { created, restored } = await searchParams;
  const { lang, t } = await adminText();
  const [initial, sections, regions] = await Promise.all([loadWork(decodeURIComponent(id)), listSections(), listRegions()]);
  if (!initial) notFound();
  return (
    <>
      {(created || restored) && <p className="adm-msg adm-msg--ok" role="status">{restored ? t.history.restored : t.common.saved}</p>}
      {/* a fresh form after a restore; otherwise the form keeps its state (and its "saved" note) across the refresh that follows a save */}
      <WorkForm key={`${initial.work.id}-${restored ?? ''}`} lang={lang} initial={initial} sections={sections} regions={regions} deleteAction={deleteWork.bind(null, initial.work.id)} />
    </>
  );
}
