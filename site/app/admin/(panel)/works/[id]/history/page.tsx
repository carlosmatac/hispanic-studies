import { notFound } from 'next/navigation';
import { adminText } from '@/lib/admin/lang';
import { listRevisions } from '@/lib/admin/queries';
import { restoreRevision } from '@/app/admin/actions';
import { readWork } from '@/lib/backup';
import { getDb } from '@/lib/db';
import ConfirmButton from '@/components/admin/ConfirmButton';

/* The earlier versions of a work: restore one to undo a mistake. */
export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  const { lang, t } = await adminText();
  const [work, revisions] = await Promise.all([readWork(getDb(), id), listRevisions(id)]);
  if (!work && !revisions.length) notFound();
  const when = (iso: string) => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  return (
    <>
      <div className="adm-head">
        <div>
          <p className="adm-eyebrow"><a href={`/admin/works/${encodeURIComponent(id)}`}>← {work?.title ?? id}</a></p>
          <h1>{t.history.h}</h1>
          <p className="adm-lead">{t.history.lead}</p>
        </div>
      </div>
      {revisions.length === 0 ? <p className="adm-empty">{t.history.none}</p> : (
        <ol className="adm-list adm-history">
          {revisions.map((r) => (
            <li key={r.id} className="adm-row adm-row--static">
              <span className="adm-row__main">
                <span className="adm-row__title">{when(r.createdAt)}</span>
                <span className="adm-row__author">
                  {t.history.action[r.action]}{r.createdBy ? ` · ${t.history.by(r.createdBy)}` : ''} · {r.title}
                  {r.langs.length > 0 && ` · ${t.history.text(r.langs.map((l) => l.toUpperCase()).join(', '))}`}
                  {r.status === 'draft' && ` · ${t.works.draft}`}
                </span>
              </span>
              <ConfirmButton className="adm-btn" label={t.history.restore} question={t.history.restoreConfirm}
                confirm={t.history.restore} cancel={t.common.cancel} danger={false} action={restoreRevision.bind(null, r.id)} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
