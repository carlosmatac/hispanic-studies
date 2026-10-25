import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CanonShelf from '@/components/canon/CanonShelf';

/* The canon, on its own page since 2026-10-25: fifty classic texts in five
   periods, as cards that open their records (components/canon/CanonShelf). */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return { title: `${d.nav.canon} · ${d.meta.title}`, description: d.canon.door };
}

export default async function CanonPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  return (
    <>
      <Header lang={lang} current="canon" />
      <main id="main" className="canon-page">
        <section className="page-head" aria-labelledby="canon-h">
          <p className="eyebrow">{d.canon.eyebrow}</p>
          <h1 id="canon-h">{d.canon.h}</h1>
          <p>{d.canon.sub}</p>
        </section>
        <div className="canon-shelf">
          <CanonShelf lang={lang} />
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
