import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { dict, isLang, type Lang } from '@/lib/i18n';
import { curatedWorks, getArchive, getArticles, getPublishedArchive, getText, isEditor, pickText } from '@/lib/archive';
import { languageName, readHref, showsCurated, splitTitle, workHref, type CanonWork } from '@/lib/canon';
import { renderTree } from '@/lib/text';
import { swatchStyle } from '@/lib/palette';
import Citation from '@/components/canon/Citation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReaderToc from '@/components/canon/ReaderToc';
import CuratedWork from '@/components/archive/CuratedWork';

/* A work's own page (issue #68). One of the curated 80 whose article is
   approved (issue #93) gets its article, editions and, when it is hosted
   here, its text (components/archive/CuratedWork). Any other work: when it is
   in the U.S. public domain and its text is in the archive, the reader:
   long-form reading on the site's paper, the text in its original language,
   its chapters as contents, and where it came from; otherwise the record, with
   links to legitimate copies only. /archive/<slug> (Beltrán's address for a
   work we already had under another id) goes to /archive/<id>.
   Statically generated for every published work in the database; a work
   added later in the back office is generated on its first visit, and every
   save regenerates the pages (lib/admin/revalidate.ts). Drafts are shown only
   to signed-in editors. */

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPublishedArchive()).works.map((w) => ({ id: w.id }));
}

type Params = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, id } = await params;
  const work = isLang(lang) ? (await getArchive()).works.find((w) => w.id === id) : undefined;
  if (!isLang(lang) || !work) return {};
  const d = dict(lang);
  const alternates = { languages: { en: `/en/archive/${id}`, es: `/es/archive/${id}` } };
  if (showsCurated(work, await isEditor())) {
    const c = work.curated!;
    const intro = (await getArticles(id)).find((a) => a.locale === lang)?.whyReadToday ?? '';
    return {
      title: `${c.originalTitle} · ${c.creator} (${c.dateDisplay}) · ${d.reader.archive} · ${d.meta.title}`,
      description: intro.split(/(?<=\.)\s/)[0] || `${c.creator}, ${c.originalTitle} (${c.dateDisplay}).`,
      alternates,
      ...(work.status === 'draft' || c.articleStatus !== 'published' ? { robots: { index: false } } : {}),
    };
  }
  const [title] = splitTitle(work.title);
  return {
    title: `${title} · ${work.author} (${work.year}) · ${d.reader.archive} · ${d.meta.title}`,
    description: work.note[lang] || `${work.author}, ${work.title} (${work.year}).`,
    alternates,
    ...(work.status === 'draft' ? { robots: { index: false } } : {}),
  };
}

/** Where an ad may go later (#70). Empty and hidden: no ad code yet. */
const AdSlot = ({ name }: { name: string }) => <div className="ad-slot" data-ad-slot={name} hidden aria-hidden="true" />;

export default async function ReaderPage({ params }: Params) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const archive = await getArchive();
  const works = archive.works;
  const i = works.findIndex((w) => w.id === id);
  if (i < 0) {
    // Beltrán's slug for a work we keep under another id
    const bySlug = works.find((w) => w.curated?.slug === id);
    if (bySlug) redirect(`/${lang}/archive/${encodeURIComponent(bySlug.id)}`);
    notFound();
  }
  const work = works[i];
  const textLang = pickText(work, lang);
  const text = textLang ? await getText(id, textLang) : null;
  const editor = await isEditor();

  if (showsCurated(work, editor)) {
    const list = curatedWorks(archive, editor);
    const k = list.findIndex((w) => w.id === id);
    const era = archive.eras.find((e) => e.id === work.curated!.era);
    const regionNames = work.curated!.browseRegions.map((r) => archive.browseRegions.find((g) => g.id === r)?.name[lang]).filter((x): x is string => !!x);
    return (
      <>
        <Header lang={lang} current="canon" path={`/archive/${id}`} />
        {text && <div className="reader-progress" aria-hidden="true"><span /></div>}
        <CuratedWork
          lang={lang} work={work} eraName={era?.name[lang] ?? ''} eraId={era?.id ?? ''} articles={await getArticles(id)} text={text}
          prev={k > 0 ? list[k - 1] : null} next={k >= 0 && k < list.length - 1 ? list[k + 1] : null} editor={editor} regionNames={regionNames}
        />
        <Footer lang={lang} />
      </>
    );
  }

  const d = dict(lang);
  const r = d.reader;
  const [title, sub] = splitTitle(work.title);
  const period = archive.sections.find((p) => p.id === work.period);
  const reg = archive.regions.find((g) => g.id === work.region);
  // the same text in the site's other language, when there is one
  const other = lang === 'en' ? 'es' : 'en';
  const otherText = text && text.lang !== other && work.texts.some((t) => t.lang === other);

  return (
    <>
      <Header lang={lang} current="canon" path={`/archive/${id}`} />
      {text && <div className="reader-progress" aria-hidden="true"><span /></div>}
      <main id="main" className={`reader${text ? ' reader--text' : ''}`}>
        <article className="reader__article">
          <header className="reader__head">
            <p className="reader__crumb">
              <a href={`/${lang}/archive`}>{r.archive}</a>
              <span aria-hidden="true"> · </span>
              {period && <a href={`/${lang}/archive#${period.id}`}>{period.name[lang]}</a>}
            </p>
            {work.status === 'draft' && <p className="reader__draft">{r.draftNote}</p>}
            <h1 className="reader__title" lang={work.language}>{title}</h1>
            {sub && <p className="reader__sub" lang={work.language}>{sub}</p>}
            <p className="reader__author">{work.author} <span>{work.life}</span></p>
            <dl className="reader__facts">
              <div><dt>{r.year}</dt><dd>{work.year}</dd></div>
              {reg && <div><dt>{r.region}</dt><dd><span className="reader__swatch" style={swatchStyle(reg.swatch)} aria-hidden="true" />{reg.name[lang]}</dd></div>}
              {text && <div><dt>{r.language}</dt><dd>{languageName(text.lang, lang)}</dd></div>}
              <div><dt>{r.rights}</dt><dd>{r.rightsName[work.rights]}</dd></div>
            </dl>
            {work.note[lang] && <p className="reader__note">{work.note[lang]}</p>}
            {text && (
              <p className="reader__meta">
                {r.minutes(text.minutes)} · {text.lang === work.language ? r.original : r.translation(languageName(work.language, lang))}
                {otherText && <> · <a href={`/${other}/archive/${id}`} hrefLang={other}>{r.otherLanguage}</a></>}
              </p>
            )}
          </header>

          {text && text.sections.length > 1 && (
            <details className="reader__toc">
              <summary>{r.contents} <span>({text.sections.length})</span></summary>
              <ol>
                {text.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
              </ol>
            </details>
          )}

          {/* AD SLOT (#70): above the text */}
          <AdSlot name="reader-top" />

          {text ? (
            <div className="reader__body">
              {text.sections.length > 1 && <ReaderToc sections={text.sections} label={r.contents} />}
              <div lang={text.lang}>{renderTree(text.tree, React)}</div>
            </div>
          ) : (
            <Status work={work} lang={lang} />
          )}

          {text && (
            <footer className="reader__source">
              <p className="reader__fleuron" aria-hidden="true">❦</p>
              <h2>{r.source}</h2>
              <dl>
                {work.source.edition && <><dt>{r.edition}</dt><dd>{work.source.edition}</dd></>}
                {work.source.url && <><dt>{r.revision}</dt><dd><a href={work.source.url} rel="noopener">{work.source.revision || work.source.url}</a></dd></>}
              </dl>
              {work.source.licence && <p>{work.source.licence}</p>}
            </footer>
          )}

          <Record work={work} lang={lang} />

          {work.references.length > 0 && (
            <section className="reader__refs" aria-labelledby="refs-h">
              <h2 id="refs-h">{r.references}</h2>
              <ol>
                {work.references.map((ref, k) => <li key={k}><Citation reference={ref} lang={lang} /></li>)}
              </ol>
            </section>
          )}

          {/* AD SLOT (#70): after the text */}
          <AdSlot name="reader-end" />

          <nav className="reader__pager" aria-label={r.archive}>
            {i > 0 ? <Neighbour work={works[i - 1]} lang={lang} label={r.earlier} rel="prev" /> : <span />}
            <a className="reader__back" href={workHref(lang, work.id)}>{r.back}</a>
            {i < works.length - 1 ? <Neighbour work={works[i + 1]} lang={lang} label={r.later} rel="next" /> : <span />}
          </nav>
        </article>
      </main>
      <Footer lang={lang} />
    </>
  );
}

function Status({ work, lang }: { work: CanonWork; lang: Lang }) {
  const r = dict(lang).reader;
  const lines: string[] = [];
  const pd = work.rights === 'public-domain';
  if (work.rights === 'in-copyright') lines.push(r.notHosted);
  else if (work.rights === 'pd-us-only') lines.push(r.pdUsOnly);
  else if (work.rights === 'pd-outside-us') lines.push(r.pdOutsideUs);
  else if (pd) lines.push(work.needsTranscription ? r.needsTranscription : r.pendingPd);
  else lines.push(r.pending);
  if (!pd && work.pdSpainYear) lines.push(r.freeInSpain(work.pdSpainYear));
  if (!pd && work.pdUsYear) lines.push(r.freeInUs(work.pdUsYear));
  const lead = work.links.length ? (pd ? r.scans : r.readAt) : work.rights === 'unverified' ? '' : r.noCopy;
  return (
    <div className={`reader__status reader__status--${work.rights}`}>
      <p>{lines.join(' ')}</p>
      {lead && <p className="reader__status-lead">{lead}</p>}
      {work.links.length > 0 && (
        <ul className="reader__links">
          {work.links.map((l) => <li key={l.url}><a href={l.url} rel="noopener" target="_blank">{l.label}</a></li>)}
        </ul>
      )}
    </div>
  );
}

function Record({ work, lang }: { work: CanonWork; lang: Lang }) {
  const d = dict(lang);
  const t = d.canon;
  const r = d.reader;
  const hasRecord = work.position || work.camp || work.bueno.code || work.summary[lang] || (work.hasText && work.links.length);
  if (!hasRecord) return null;
  return (
    <div className="reader__record">
      <h2>{r.record}</h2>
      {work.counter && <p className="record__counter">{t.counter}</p>}
      {work.summary[lang] && <p>{work.summary[lang]}</p>}
      {work.position && <p lang="en">{work.position}</p>}
      {(work.camp || work.bueno.code) && (
        <dl className="record__facts">
          {work.camp && <><dt>{t.camp}</dt><dd lang="en">{work.camp}</dd></>}
          {work.bueno.code && <><dt>{t.bueno}</dt><dd lang="en">{work.bueno.code} · {work.bueno.name.toLowerCase()}</dd></>}
        </dl>
      )}
      {work.hasText && work.links.length > 0 && (
        <>
          <h3>{r.copies}</h3>
          <ul className="reader__links">
            {work.links.map((l) => <li key={l.url}><a href={l.url} rel="noopener" target="_blank">{l.label}</a></li>)}
          </ul>
        </>
      )}
      {lang === 'es' && work.position && <p className="record__note">{t.dataNote}</p>}
    </div>
  );
}

function Neighbour({ work, lang, label, rel }: { work: CanonWork; lang: Lang; label: string; rel: 'prev' | 'next' }) {
  const [title] = splitTitle(work.title);
  return (
    <a className={`reader__nb reader__nb--${rel}`} href={readHref(lang, work.id)} rel={rel}>
      <span className="reader__nb-label">{rel === 'prev' ? '← ' : ''}{label}{rel === 'next' ? ' →' : ''}</span>
      <span className="reader__nb-title" lang={work.language}>{title}</span>
      <span className="reader__nb-meta">{work.author}, {work.year}</span>
    </a>
  );
}
