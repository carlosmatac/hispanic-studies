import { headers } from 'next/headers';
import { dict, isLang, LANGS } from '@/lib/i18n';
import { entryLang, safeNext } from '@/lib/preview-gate';
import EntryForm from '@/components/EntryForm';

/* The entry page: the home's title page (components/Hero.tsx), the drifting
   shapes behind the frosted glass, with the eagle, the name and one field. */

export default async function EnterPage({
  params, searchParams,
}: { params: Promise<{ lang?: string[] }>; searchParams: Promise<{ next?: string | string[] }> }) {
  const [{ lang: seg }, query] = await Promise.all([params, searchParams]);
  const next = safeNext(Array.isArray(query.next) ? query.next[0] : query.next);
  const lang = seg?.[0] && isLang(seg[0]) ? seg[0] : entryLang(next, (await headers()).get('accept-language'));
  const t = dict(lang).enter;
  const qs = next ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <main className="title enter">
      <div className="title__mesh" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="title__page enter__page">
        <span className="title__eagle enter__eagle" aria-hidden="true" />
        <h1 className="title__name enter__name">
          <span className="title__line title__line--small"><span>Institute for</span></span>
          <span className="title__line"><span>Hispano</span></span>{' '}
          <span className="title__line"><span>Studies</span></span>
        </h1>
        <EntryForm t={t} lang={lang} next={next} />
        <p className="enter__note">{t.note}</p>
        <nav className="enter__lang" aria-label={t.langLabel}>
          {LANGS.map((l) => (
            <a key={l} href={`/enter/${l}${qs}`} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
              {l.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}
