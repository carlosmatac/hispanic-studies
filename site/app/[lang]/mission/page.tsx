import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { missionPath } from '@/lib/canon';
import { MANIFESTO, MANIFESTO_LANGS } from '@/lib/manifesto';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ManifestoText from '@/components/Manifesto';

/* The Mission page (issue #116): /en/mission and /es/mision. Beltrán's
   manifesto, whole and verbatim (lib/manifesto.ts), in his three languages.
   The site speaks English and Spanish; the manifesto also speaks Portuguese,
   on this page only. All three versions are in the page; a switch of plain
   anchors (#en, #es, #pt) shows one, through :target, with the site's language
   by default. No script: it works without JavaScript, a version can be linked
   (/en/mission#pt), and a browser without :has() shows all three, one under
   another (globals.css). Static. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return {
    title: `${d.mission.meta} · ${d.meta.title}`,
    description: MANIFESTO[lang].excerpt,
    alternates: { languages: { en: `/en${missionPath('en')}`, es: `/es${missionPath('es')}` } },
  };
}

export default async function MissionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = dict(lang).mission;
  // the site's language first: it is the one shown by default, and the first one without :has()
  const order = [lang, ...MANIFESTO_LANGS.filter((l) => l !== lang)];
  return (
    <>
      <Header lang={lang} current="mission" path={missionPath(lang)} />
      <main id="main" className="manifesto">
        {order.map((l) => {
          const m = MANIFESTO[l];
          return (
            <article key={l} id={l} lang={l} className="manifesto__version" data-default={l === lang ? '' : undefined} aria-labelledby={`manifesto-${l}`}>
              <header className="manifesto__head">
                <p className="eyebrow" lang={lang}>{t.eyebrow}</p>
                <nav className="manifesto__switch" aria-label={t.switchLabel} lang={lang}>
                  <span className="manifesto__switch-label" aria-hidden="true">{t.switchLabel}</span>
                  {MANIFESTO_LANGS.map((x) => (
                    <a key={x} href={`#${x}`} hrefLang={x} lang={x} aria-current={x === l ? 'true' : undefined}>{t.langs[x]}</a>
                  ))}
                </nav>
                <h1 id={`manifesto-${l}`}>{m.title}</h1>
              </header>
              <ManifestoText m={m} lang={l} />
            </article>
          );
        })}
      </main>
      <Footer lang={lang} />
    </>
  );
}
