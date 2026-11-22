import React from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { collabHref, readHref, translationAppeal, type Article, type CanonWork, type Edition, type Section } from '@/lib/canon';
import { buttonKind, isReadingLang } from '@/lib/editions';
import { renderMarkdown, renderTree } from '@/lib/text';
import { swatchStyle } from '@/lib/palette';
import Citation from '@/components/canon/Citation';
import ReaderToc from '@/components/canon/ReaderToc';
import ArticleTabs from './ArticleTabs';
import PdfViewer from './PdfViewer';

/* A work of the curated 80 (issue #93), as Beltrán's brief lays it out:
   1. the header: original title; author or issuing body; date and its kind; scope;
   2–4. the article (about the author or issuing body; the work in its time; why
      read it today), in Spanish or English, with a switch that changes only the
      article's language;
   5. "Read the text": the editions grouped by reading language (ES, PT, EN),
      the best one first, each with its access state and the button the brief's
      table gives it, never a false "full text" or "PDF download"; the
      translation appeal when no complete English translation is known; the
      sources in other languages and the companion documents apart;
   then the text itself when it is hosted here (the reader), or the PDF viewer. */

type Text = { tree: Parameters<typeof renderTree>[0]; sections: Section[]; words: number; minutes: number; lang: string } | null;

/** Where an ad may go later (#70). Empty and hidden: no ad code yet. */
const AdSlot = ({ name }: { name: string }) => <div className="ad-slot" data-ad-slot={name} hidden aria-hidden="true" />;

const md = (s: string) => renderTree(renderMarkdown(s, { adSlot: false }).tree, React);

function ArticleBody({ a, lang }: { a: Article; lang: 'es' | 'en' }) {
  const t = dict(lang).archive80;
  return (
    <>
      {[[t.aboutAuthor, a.aboutAuthor], [t.workInItsTime, a.workInItsTime], [t.whyRead, a.whyReadToday]].filter(([, body]) => body.trim()).map(([h, body]) => (
        <section key={h} className="w80-section">
          <h2>{h}</h2>
          <div className="w80-prose">{md(body)}</div>
        </section>
      ))}
    </>
  );
}

function EditionItem({ e, lang, work, primary }: { e: Edition; lang: Lang; work: CanonWork; primary: boolean }) {
  const t = dict(lang).archive80;
  const ext = (label: string, quiet = !primary) => (
    <a className={`w80-btn${quiet ? ' w80-btn--quiet' : ''}`} href={e.url} target="_blank" rel="noopener">
      {label}<span className="sr"> ({t.newTab})</span>
    </a>
  );
  const kind = buttonKind(e.extent);
  const source = e.sourceName || t.access[e.extent];
  let actions: React.ReactNode;
  if (e.hosted === 'local_pdf') {
    actions = (
      <>
        <a className="w80-btn" href={`#pdf-${e.id}`}>{t.button.pdf}</a>
        <a className="w80-btn w80-btn--quiet" href={e.pdfUrl} download>{t.button.download}</a>
      </>
    );
  } else if (e.hosted === 'inline_html' && work.texts.some((x) => x.lang === e.readingLang)) {
    actions = <a className="w80-btn" href="#text">{t.button.here}</a>;
  } else if (!e.url) {
    actions = null;
  } else {
    actions = kind === 'read' ? ext(t.button.read(source)) : kind === 'facsimile' ? ext(t.button.facsimile(source)) : kind === 'part' ? ext(t.button.part(source))
      : kind === 'publisher' ? ext(t.button.publisher, true) : kind === 'request' ? ext(t.button.request, true) : ext(t.button.record, true);
  }
  return (
    <li className={`w80-ed${primary ? ' w80-ed--primary' : ''}`}>
      <p className="w80-ed__access">{e.hosted ? t.hostedAccess[e.hosted] : t.access[e.extent] ?? e.extent}</p>
      {e.label && <p className="w80-ed__label">{e.label}{e.publicationYear && !e.label.includes(String(e.publicationYear)) ? ` (${e.publicationYear})` : ''}</p>}
      {e.scopeNote && <p className="w80-ed__scope">{e.scopeNote}</p>}
      {e.translator && <p className="w80-ed__by">{t.translator} {e.translator}</p>}
      {actions && <p className="w80-ed__go">{actions}</p>}
    </li>
  );
}

export default function CuratedWork({ lang, work, eraName, eraId, articles, text, prev, next, editor, regionNames }: {
  lang: Lang;
  work: CanonWork;
  eraName: string;
  eraId: string;
  articles: Article[];
  text: Text;
  prev: CanonWork | null;
  next: CanonWork | null;
  editor: boolean;
  regionNames: string[];
}) {
  const d = dict(lang);
  const t = d.archive80;
  const r = d.reader;
  const c = work.curated!;
  const origLang = c.originalLanguages[0] ?? work.language;
  const langName = (l: string) => t.langName[l] ?? l;

  // the reading groups: the original's language first, then ES, PT, EN; English left out where Beltrán left it out on purpose
  const order = ['es', 'pt', 'en'].sort((a, b) => Number(c.originalLanguages.includes(b)) - Number(c.originalLanguages.includes(a)));
  const groups = order
    .filter((l) => !(l === 'en' && c.englishState === 'suppressed_by_editor'))
    .map((l) => {
      const eds = c.editions.filter((e) => e.readingLang === l);
      const sorted = [...eds.filter((e) => e.primary), ...eds.filter((e) => !e.primary)];
      return { lang: l, hereText: work.texts.some((x) => x.lang === l) && !eds.some((e) => e.hosted === 'inline_html'), editions: sorted };
    })
    .filter((g) => g.hereText || g.editions.length);
  const sources = c.editions.filter((e) => !isReadingLang(e.readingLang));
  const appeal = translationAppeal(work);
  const pdfs = c.editions.filter((e) => e.hosted === 'local_pdf');
  const scope = t.scopeName[c.scope];
  const dateKind = t.dateKind[c.dateKind];

  const articleTabs = (['es', 'en'] as const)
    .map((l) => ({ l, a: articles.find((x) => x.locale === l) }))
    .filter((x): x is { l: 'es' | 'en'; a: Article } => !!x.a && !!(x.a.aboutAuthor || x.a.workInItsTime || x.a.whyReadToday))
    .map(({ l, a }) => ({ locale: l, label: l === 'es' ? 'Español' : 'English', href: `/${l}/archive/${work.id}`, content: <ArticleBody a={a} lang={l} /> }));
  const initial = articleTabs.some((x) => x.locale === lang) ? lang : articleTabs[0]?.locale ?? lang;

  return (
    <main id="main" className={`reader w80${text ? ' reader--text' : ''}`}>
      <article className="reader__article">
        <header className="reader__head w80-head">
          <p className="reader__crumb">
            <a href={`/${lang}/archive`}>{r.archive}</a>
            <span aria-hidden="true"> · </span>
            <a href={`/${lang}/archive#${eraId}`}>{eraName}</a>
          </p>
          {editor && c.articleStatus !== 'published' && <p className="reader__draft">{t.inReviewNote}</p>}
          {work.status === 'draft' && c.articleStatus === 'published' && <p className="reader__draft">{r.draftNote}</p>}
          <p className="w80-head__n" aria-hidden="true">{c.order} / 80</p>
          <h1 className="reader__title w80-title" lang={origLang}>{c.originalTitle}</h1>
          <p className="reader__author">{c.creator}</p>
          <dl className="reader__facts">
            <div><dt>{t.date}</dt><dd>{c.dateDisplay}{dateKind ? ` · ${dateKind}` : ''}</dd></div>
            {scope && <div><dt>{t.scope}</dt><dd>{scope}</dd></div>}
            {c.originalLanguages.length > 0 && <div><dt>{t.originalLanguage}</dt><dd>{c.originalLanguages.map(langName).join(', ')}</dd></div>}
            {regionNames.length > 0 && <div><dt>{t.regions}</dt><dd><span className="reader__swatch" style={swatchStyle(work.swatch)} aria-hidden="true" />{regionNames.join(' · ')}</dd></div>}
          </dl>
        </header>

        {articleTabs.length > 0 && (
          <div className="w80-articlewrap">
            <ArticleTabs initial={initial} tabs={articleTabs} label={t.articleIn} />
          </div>
        )}

        {/* AD SLOT (#70): after the article */}
        <AdSlot name="reader-top" />

        <section className="w80-read" id="read" aria-labelledby="read-h">
          <h2 id="read-h">{t.readText}</h2>
          {groups.length === 0 && <p className="w80-read__none">{t.readTextNone}</p>}
          <div className="w80-groups">
            {groups.map((g) => (
              <div key={g.lang} className="w80-group" lang={lang}>
                <h3>
                  {langName(g.lang)}
                  <span>{c.originalLanguages.includes(g.lang) ? t.original : t.translation}</span>
                </h3>
                <ul className="w80-eds">
                  {g.hereText && (
                    <li className="w80-ed w80-ed--primary w80-ed--here">
                      <p className="w80-ed__access">{t.hereLabel}</p>
                      {work.source.edition && <p className="w80-ed__label">{work.source.edition}</p>}
                      <p className="w80-ed__go"><a className="w80-btn" href="#text">{t.button.here}</a></p>
                    </li>
                  )}
                  {g.editions.map((e, i) => <EditionItem key={e.id} e={e} lang={lang} work={work} primary={!g.hereText && i === 0} />)}
                </ul>
              </div>
            ))}
          </div>
          {appeal && (
            <p className="w80-appeal">
              {appeal === 'partial' ? t.appeal.partial : t.appeal.missing}{' '}
              <a href={collabHref(lang, c.slug)}>{appeal === 'partial' ? t.appeal.helpPartial : t.appeal.help}</a>
            </p>
          )}
        </section>

        {sources.length > 0 && (
          <section className="w80-sources" aria-labelledby="src-h">
            <h2 id="src-h">{t.sources}</h2>
            <ul>
              {sources.map((e) => (
                <li key={e.id}>
                  <span className="w80-sources__lang">{e.languages.map(langName).join(', ') || '—'}</span>
                  <span className="w80-sources__what">{t.access[e.extent] ?? e.extent}{e.label ? `: ${e.label}` : ''}</span>
                  {e.url && <a href={e.url} target="_blank" rel="noopener">{e.sourceName || e.url}<span className="sr"> ({t.newTab})</span></a>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.companions.length > 0 && (
          <section className="w80-sources w80-companions" aria-labelledby="comp-h">
            <h2 id="comp-h">{t.companions}</h2>
            <p className="w80-companions__note">{t.companionsNote}</p>
            <ul>
              {c.companions.map((x) => (
                <li key={x.url || x.title}>
                  {x.url ? <a href={x.url} target="_blank" rel="noopener">{x.title}<span className="sr"> ({t.newTab})</span></a> : <span>{x.title}</span>}
                  {x.note && <span className="w80-companions__what">{x.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {text && (
          <section id="text" className="w80-text" aria-label={t.hereLabel}>
            {text.sections.length > 1 && (
              <details className="reader__toc">
                <summary>{r.contents} <span>({text.sections.length})</span></summary>
                <ol>{text.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
              </details>
            )}
            <p className="reader__meta">{r.minutes(text.minutes)} · {langName(text.lang)}</p>
            <div className="reader__body">
              {text.sections.length > 1 && <ReaderToc sections={text.sections} label={r.contents} />}
              <div lang={text.lang}>{renderTree(text.tree, React)}</div>
            </div>
            <footer className="reader__source">
              <p className="reader__fleuron" aria-hidden="true">❦</p>
              <h2>{r.source}</h2>
              <dl>
                {work.source.edition && <><dt>{r.edition}</dt><dd>{work.source.edition}</dd></>}
                {work.source.url && <><dt>{r.revision}</dt><dd><a href={work.source.url} rel="noopener">{work.source.revision || work.source.url}</a></dd></>}
              </dl>
              {work.source.licence && <p>{work.source.licence}</p>}
            </footer>
          </section>
        )}

        {pdfs.map((e) => (
          <PdfViewer key={e.id} id={e.id} url={e.pdfUrl} title={c.originalTitle} heading={`${langName(e.readingLang)} · ${e.label || t.access[e.extent]}`} lang={lang} />
        ))}

        {work.references.length > 0 && (
          <section className="reader__refs" aria-labelledby="refs-h">
            <h2 id="refs-h">{r.references}</h2>
            <ol>{work.references.map((ref, k) => <li key={k}><Citation reference={ref} lang={lang} /></li>)}</ol>
          </section>
        )}

        {/* AD SLOT (#70): after the text */}
        <AdSlot name="reader-end" />

        <nav className="reader__pager" aria-label={t.back}>
          {prev ? <Neighbour work={prev} lang={lang} label={t.earlier} rel="prev" /> : <span />}
          <a className="reader__back" href={`/${lang}/archive#${work.id}`}>{t.back}</a>
          {next ? <Neighbour work={next} lang={lang} label={t.later} rel="next" /> : <span />}
        </nav>
      </article>
    </main>
  );
}

function Neighbour({ work, lang, label, rel }: { work: CanonWork; lang: Lang; label: string; rel: 'prev' | 'next' }) {
  const c = work.curated!;
  return (
    <a className={`reader__nb reader__nb--${rel}`} href={readHref(lang, work.id)} rel={rel}>
      <span className="reader__nb-label">{rel === 'prev' ? '← ' : ''}{label}{rel === 'next' ? ' →' : ''}</span>
      <span className="reader__nb-title" lang={c.originalLanguages[0] ?? work.language}>{c.originalTitle}</span>
      <span className="reader__nb-meta">{c.creator}, {c.dateDisplay}</span>
    </a>
  );
}
