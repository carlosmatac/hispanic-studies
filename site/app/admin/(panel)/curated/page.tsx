import Link from 'next/link';
import { adminText } from '@/lib/admin/lang';
import { listCurated } from '@/lib/admin/queries';
import { approveEra, setArticleStatus } from '@/app/admin/actions';
import ConfirmButton from '@/components/admin/ConfirmButton';

/* The curated 80 (issue #93): every work by era, in Beltrán's order, with its
   review state. Read an article on the site, then "Approve and publish" it, or
   a whole era at once; "Back to review" undoes it. Below, the editions the JSON
   marks as candidates to host here (the approval queue): they stay links until
   someone approves one, with its U.S. rights evidence, in the work's page. */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default async function CuratedPage() {
  const { lang, t } = await adminText();
  const c = t.curated;
  const { eras, works, queue } = await listCurated();
  const published = works.filter((w) => w.articleStatus === 'published').length;
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{c.h}</h1>
          <p className="adm-lead">{c.lead}</p>
          {works.length > 0 && <p className="adm-muted">{c.counts(published, works.length - published)}</p>}
        </div>
        <a className="adm-btn" href={`/admin/view?path=/${lang}/archive`} target="_blank" rel="noopener">{c.view} ↗</a>
      </div>

      {works.length === 0 && <p className="adm-empty">{c.none}</p>}

      {eras.map((era, i) => {
        const list = works.filter((w) => w.eraId === era.id);
        if (!list.length) return null;
        const name = lang === 'es' ? era.nameEs : era.nameEn;
        const inReview = list.filter((w) => w.articleStatus !== 'published').length;
        return (
          <section key={era.id} className="adm-card adm-era" aria-labelledby={`era-${era.id}`}>
            <header className="adm-era__head">
              <span className="adm-stack__n">{ROMAN[i] ?? i + 1}</span>
              <h2 id={`era-${era.id}`}>{name}</h2>
              <span className="adm-muted">{c.counts(list.length - inReview, inReview)}</span>
              {inReview > 0 && (
                <ConfirmButton className="adm-btn adm-btn--primary" danger={false} label={c.approveEra(inReview)} question={c.approveEraConfirm(name, inReview)}
                  confirm={c.approve} cancel={t.common.cancel} action={approveEra.bind(null, era.id)} />
              )}
            </header>
            <ol className="adm-list adm-curated">
              {list.map((w) => {
                const title = w.originalTitle || w.title;
                const live = w.articleStatus === 'published';
                return (
                  <li key={w.id} className="adm-row adm-row--static">
                    <span className="adm-curated__n">{w.order}</span>
                    <span className="adm-row__main">
                      <span className="adm-row__title"><i>{title}</i></span>
                      <span className="adm-muted">{w.creator} · {w.dateDisplay} · {c.editions(w.editions)}{w.hosted ? ` · ${c.hosted}` : ''}</span>
                    </span>
                    <span className={`adm-tag${live ? '' : ' adm-tag--draft'}`}>{live ? c.published : c.inReview}</span>
                    <span className="adm-curated__tools">
                      <a className="adm-btn adm-btn--small" href={`/admin/view?path=/${lang}/archive/${encodeURIComponent(w.id)}`} target="_blank" rel="noopener">{c.view} ↗</a>
                      <Link className="adm-btn adm-btn--small" href={`/admin/works/${encodeURIComponent(w.id)}`}>{c.edit}</Link>
                      {live
                        ? <ConfirmButton className="adm-btn adm-btn--small adm-btn--quiet" label={c.unpublish} question={c.unpublishConfirm(title)}
                            confirm={c.unpublish} cancel={t.common.cancel} action={setArticleStatus.bind(null, [w.id], 'review')} />
                        : <ConfirmButton className="adm-btn adm-btn--small adm-btn--primary" danger={false} label={c.approve} question={c.approveConfirm(title)}
                            confirm={c.approve} cancel={t.common.cancel} action={setArticleStatus.bind(null, [w.id], 'published')} />}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {queue.length > 0 && (
        <section className="adm-card" aria-labelledby="queue-h">
          <h2 id="queue-h">{c.queue}</h2>
          <p className="adm-help">{c.queueLead}</p>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>{c.queueCols.work}</th><th>{c.queueCols.edition}</th><th>{c.queueCols.lang}</th><th>{c.queueCols.plan}</th><th>{c.queueCols.year}</th><th>{c.queueCols.state}</th></tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id}>
                    <td><Link href={`/admin/works/${encodeURIComponent(q.workId)}`}>{q.order}. {q.work}</Link></td>
                    <td className="adm-mono">{q.id}</td>
                    <td>{q.lang}</td>
                    <td>{c.plan[q.plan] ?? q.plan}</td>
                    <td>{q.year ?? '—'}</td>
                    <td>{q.hosted ? c.hostedNow : c.waiting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
