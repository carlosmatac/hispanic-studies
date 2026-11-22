import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { CHANNELS } from '@/lib/content';
import { curatedWorks, getPublishedArchive } from '@/lib/archive';
import { collabAnchor, collabPath, translationAppeal } from '@/lib/canon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChannelIcon from '@/components/ChannelIcon';
import CameFrom from '@/components/archive/CameFrom';

/* The Collaborate page (issue #93): where the translation appeal on a work's
   page leads (/en/work-with-us#translations, /es/colabora#traducciones, with
   ?work=<slug>). Three distinct actions, as the brief asks: translate, donate,
   and — Beltrán, 2026-11-22: paid content goes on Substack, not Patreon —
   support the Institute on Substack. No translator form or payment page exists
   yet, so those two say so plainly (AGENTS.md: placeholder must look like
   placeholder). Static: the work named in ?work= is shown by a small client
   component. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return {
    title: `${d.collab.meta} · ${d.meta.title}`,
    description: d.collab.sub,
    alternates: { languages: { en: '/en/work-with-us', es: '/es/colabora' } },
  };
}

export default async function CollaboratePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = dict(lang);
  const c = d.collab;
  const archive = await getPublishedArchive();
  const curated = curatedWorks(archive, false);
  // the published works an appeal can come from, by slug, for "You came from"
  const titles = Object.fromEntries(curated.map((w) => [w.curated!.slug, `${w.curated!.creator}, ${w.curated!.originalTitle}`]));
  const needEnglish = curated.filter((w) => translationAppeal(w)).length;
  const substack = CHANNELS.find((ch) => ch.key === 'substack')!;
  return (
    <>
      <Header lang={lang} path={collabPath(lang)} />
      <main id="main" className="collab">
        <section className="page-head" aria-labelledby="collab-h">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 id="collab-h">{c.h}</h1>
          <p>{c.sub}</p>
          <CameFrom titles={titles} label={c.fromWork} lang={lang} />
        </section>

        <div className="collab__grid">
          <section id={collabAnchor(lang)} className="collab__card" aria-labelledby="collab-tr">
            <span className="collab__n" aria-hidden="true">I</span>
            <h2 id="collab-tr">{c.translations}</h2>
            <p>{c.translationsP}</p>
            {needEnglish > 0 && <p className="collab__note">{c.needEnglish(needEnglish)}</p>}
            <h3>{c.translate}</h3>
            <p className="pending">{c.translatePending}</p>
          </section>

          <section id={lang === 'es' ? 'donar' : 'donate'} className="collab__card" aria-labelledby="collab-do">
            <span className="collab__n" aria-hidden="true">II</span>
            <h2 id="collab-do">{c.donate}</h2>
            <p>{c.donateP}</p>
            <p className="pending">{c.donatePending}</p>
          </section>

          <section id="substack" className="collab__card" aria-labelledby="collab-ss">
            <span className="collab__n" aria-hidden="true">III</span>
            <h2 id="collab-ss">{c.substack}</h2>
            <p>{c.substackP}</p>
            <a className="btn btn--solid collab__go" href={substack.url} target="_blank" rel="noopener noreferrer">
              <ChannelIcon name="substack" /> {c.substackGo}<span className="sr"> ({d.about.newTab})</span>
            </a>
          </section>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
