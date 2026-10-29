import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { getWorks } from '@/lib/archive';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CanonShelf from '@/components/canon/CanonShelf';

/* The archive of Hispanic thought (it was the canon until 2026-10-29, and
   /canon redirects here): the works in six periods, as cards coloured by
   region that open their records (components/canon/CanonShelf). The works
   whose text is in the public domain open into the reader, /archive/<id>. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  const works = await getWorks();
  return {
    title: `${d.canon.h.replace(/\.$/, '')} · ${d.meta.title}`,
    description: d.canon.door(works.length),
    alternates: { languages: { en: '/en/archive', es: '/es/archive' } },
  };
}

export default async function ArchivePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const works = await getWorks();
  return (
    <>
      <Header lang={lang} current="canon" path="/archive" />
      <main id="main" className="canon-page">
        <section className="page-head" aria-labelledby="canon-h">
          <p className="eyebrow">{d.canon.eyebrow(works.length, works[0].year, works[works.length - 1].year)}</p>
          <h1 id="canon-h">{d.canon.h}</h1>
          <p>{d.canon.sub}</p>
        </section>
        <div className="canon-shelf">
          <CanonShelf lang={lang} works={works} />
        </div>
        <section className="canon__notes">
          <p>{d.canon.disclaimer}</p>
          {lang === 'es' && <p>{d.canon.dataNote}</p>}
        </section>
      </main>
      <Footer lang={lang} />
    </>
  );
}
