import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { fillCounts, getArchive } from '@/lib/archive';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CanonShelf from '@/components/canon/CanonShelf';

/* The archive of Hispanic thought (it was the canon until 2026-10-29, and
   /canon redirects here): the works in their sections, as cards coloured by
   region that open their records (components/canon/CanonShelf). The works
   whose text is in the public domain open into the reader, /archive/<id>.
   Everything on it comes from the database and is edited at /admin (#69). */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  const archive = await getArchive();
  const title = fillCounts(archive.page.title[lang] || d.canon.h, archive);
  const door = archive.page.door[lang];
  return {
    title: `${title.replace(/\.$/, '')} · ${d.meta.title}`,
    description: door ? fillCounts(door, archive) : d.canon.door(archive.works.length),
    alternates: { languages: { en: '/en/archive', es: '/es/archive' } },
  };
}

export default async function ArchivePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const archive = await getArchive();
  const { works, page } = archive;
  const years = works.length ? [works[0].year, works[works.length - 1].year] : [0, 0];
  return (
    <>
      <Header lang={lang} current="canon" path="/archive" />
      <main id="main" className="canon-page">
        <section className="page-head" aria-labelledby="canon-h">
          <p className="eyebrow">{d.canon.eyebrow(works.length, years[0], years[1])}</p>
          <h1 id="canon-h">{fillCounts(page.title[lang] || d.canon.h, archive)}</h1>
          <p>{fillCounts(page.intro[lang] || d.canon.sub, archive)}</p>
        </section>
        <div className="canon-shelf">
          <CanonShelf lang={lang} works={works} sections={archive.sections} regions={archive.regions} />
        </div>
        <section className="canon__notes">
          <p>{fillCounts(page.notes[lang] || d.canon.disclaimer, archive)}</p>
          {lang === 'es' && <p>{d.canon.dataNote}</p>}
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
