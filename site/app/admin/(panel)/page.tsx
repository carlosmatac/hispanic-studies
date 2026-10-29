import Link from 'next/link';
import { adminText } from '@/lib/admin/lang';
import { listDeleted, listRegions, listSections, listWorks } from '@/lib/admin/queries';
import { restoreRevision } from '@/app/admin/actions';
import WorksTable from '@/components/admin/WorksTable';

/* The list of works: search, filters, a way in to each, and the works deleted lately. */
export default async function WorksPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { lang, t } = await adminText();
  const [works, sections, regions, deleted] = await Promise.all([listWorks(), listSections(), listRegions(), listDeleted()]);
  const { deleted: justDeleted } = await searchParams;
  const when = (iso: string) => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{t.works.h}</h1>
          <p className="adm-lead">{t.works.lead}</p>
        </div>
        <Link className="adm-btn adm-btn--primary" href="/admin/works/new">+ {t.works.add}</Link>
      </div>
      {justDeleted && <p className="adm-msg adm-msg--ok" role="status">{t.works.deletedOn(when(new Date().toISOString()), '')}: {justDeleted}</p>}
      <WorksTable lang={lang} works={works} sections={sections} regions={regions} />
      {deleted.length > 0 && (
        <section className="adm-card adm-deleted" aria-labelledby="deleted-h">
          <h2 id="deleted-h">{t.works.deleted}</h2>
          <p className="adm-help">{t.works.deletedLead}</p>
          <ul>
            {deleted.map((d) => (
              <li key={d.id}>
                <span><b>{d.title}</b> <span className="adm-muted">({d.workId}) · {t.works.deletedOn(when(d.createdAt), d.createdBy ?? '')}</span></span>
                <form action={restoreRevision.bind(null, d.id)}>
                  <button className="adm-btn">{t.works.restore}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
