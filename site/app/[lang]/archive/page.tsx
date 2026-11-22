import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang, type Lang } from '@/lib/i18n';
import { curatedWorks, fillCounts, getArchive, isEditor } from '@/lib/archive';
import { fold, readHref, readingLanguages, type CanonWork } from '@/lib/canon';
import { swatchStyle } from '@/lib/palette';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CanonShelf from '@/components/canon/CanonShelf';
import ArchiveBrowser, { type Entry, type EraGroup } from '@/components/archive/ArchiveBrowser';

/* The archive's landing (issue #93): Beltrán's curated 80, "De la Monarquía
   Universal a la iberofonía", in six eras, with his landing copy, a search and
   filters by region and reading language (components/archive/ArchiveBrowser).
   A work shows here once its article is approved in the back office; until
   then, and for the works outside the 80, the rest of the archive follows as
   it was (the shelf of cards by period, components/canon/CanonShelf: /canon
   and #T030 links keep working). Signed-in editors see every one of the 80,
   marked "in review". Everything comes from the database (/admin, #69). */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  const archive = await getArchive();
  const title = archive.page.landingTitle[lang] || d.archive80.title;
  const intro = archive.page.landingIntro[lang] || d.archive80.intro;
  return {
    title: `${title} · ${d.meta.title}`,
    description: intro.split(/\n\s*\n/)[1] ?? intro,
    alternates: { languages: { en: '/en/archive', es: '/es/archive' } },
  };
}

function entry(w: CanonWork, lang: Lang, editor: boolean): Entry {
  const c = w.curated!;
  return {
    id: w.id,
    slug: c.slug,
    href: readHref(lang, w.id),
    order: c.order,
    era: c.era,
    date: c.dateDisplay,
    title: c.originalTitle,
    titleLang: c.originalLanguages[0] ?? w.language,
    creator: c.creator,
    regions: c.browseRegions,
    langs: readingLanguages(w),
    swatch: w.swatch,
    here: w.hasText || c.editions.some((e) => e.hosted),
    review: editor && c.articleStatus !== 'published',
    haystack: fold([c.originalTitle, c.titles.es, c.titles.en, w.title, c.creator, w.author, w.fullName, c.dateDisplay].join(' · ')),
  };
}

export default async function ArchivePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const t = d.archive80;
  const archive = await getArchive();
  const editor = await isEditor();
  const curated = curatedWorks(archive, editor);
  const shownIds = new Set(curated.map((w) => w.id));
  // the rest of the archive: what is not shown among the 80 (an editor sees all of the 80 above)
  const rest = archive.works.filter((w) => !shownIds.has(w.id) && !(editor && w.curated?.current));
  const page = archive.page;
  const title = page.landingTitle[lang] || t.title;
  const intro = (page.landingIntro[lang] || t.intro).split(/\n\s*\n/);
  const eras: EraGroup[] = archive.eras.map((e, i) => ({
    id: e.id,
    numeral: ROMAN[i] ?? String(i + 1),
    name: e.name[lang],
    years: e.from && e.to ? `${e.from}–${e.to}` : '',
  }));
  const usedRegions = new Set(curated.flatMap((w) => w.curated!.browseRegions));
  const regions = archive.browseRegions.filter((r) => usedRegions.has(r.id)).map((r) => ({ id: r.id, name: r.name[lang] }));
  const colourRegions = archive.regions.filter((g) => curated.some((w) => w.region === g.id));

  return (
    <>
      <Header lang={lang} current="canon" path="/archive" />
      <main id="main" className="canon-page a80-page">
        <section className="page-head a80-head" aria-labelledby="a80-h">
          <p className="eyebrow">{t.eyebrow(curated.length || 80)}</p>
          <h1 id="a80-h">{title}</h1>
          <div className="a80-head__intro">
            {intro.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        <div className="a80-wrap">
          {curated.length > 0 ? (
            <>
              <ArchiveBrowser lang={lang} eras={eras} entries={curated.map((w) => entry(w, lang, editor))} regions={regions} />
              {colourRegions.length > 0 && (
                <figure className="a80-legend">
                  <figcaption>{t.legend}</figcaption>
                  <ul>
                    {colourRegions.map((g) => (
                      <li key={g.id}><span className="a80-legend__swatch" style={swatchStyle(g.swatch)} aria-hidden="true" />{g.name[lang]}</li>
                    ))}
                  </ul>
                </figure>
              )}
            </>
          ) : (
            <p className="a80-empty">{t.emptyPublic}</p>
          )}
        </div>

        {rest.length > 0 && (
          <>
            <section className="page-head a80-more" aria-labelledby="more-h">
              <h2 id="more-h">{t.more}</h2>
              <p>{fillCounts(page.intro[lang] || d.canon.sub, archive)}</p>
            </section>
            <div className="canon-shelf">
              <CanonShelf lang={lang} works={rest} sections={archive.sections} regions={archive.regions} />
            </div>
            <section className="canon__notes">
              <p>{fillCounts(page.notes[lang] || d.canon.disclaimer, archive)}</p>
              {lang === 'es' && <p>{d.canon.dataNote}</p>}
            </section>
          </>
        )}
      </main>
      <Footer lang={lang} />
    </>
  );
}
