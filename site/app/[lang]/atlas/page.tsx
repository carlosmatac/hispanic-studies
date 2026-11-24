import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import Header from '@/components/Header';
import AtlasStage from '@/components/atlas/AtlasStage';
import { chronicleFor } from '@/lib/atlas-chronicle';
import './atlas.css';

/* The Atlas app (issue #95; Carlos, 2026-11-22: "more of an application within
   the site", "a fixed panel where you can't scroll"). The globe fills the window
   under the site's header and the page does not scroll (atlas.css). The text
   version, with the sixty milestones, is at ./chronicle; without JavaScript the
   app says so and links there. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return { title: `${d.nav.atlas} · ${d.meta.title}`, description: d.atlas.door(chronicleFor(lang).stops.length) };
}

export default async function AtlasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const chronicle = chronicleFor(lang);
  return (
    <>
      <Header lang={lang} current="atlas" />
      <main id="main" className="atlas-main">
        <AtlasStage lang={lang} chronicle={chronicle} />
        <noscript>
          <p className="atlas__noscript">{d.atlas.noscript} <a href={`/${lang}/atlas/chronicle`}>{d.atlas.textVersion} →</a></p>
        </noscript>
      </main>
    </>
  );
}
