import { dict, type Lang } from '@/lib/i18n';

/* The hero is a title page: the eagle, the Institute's name as large as the
   screen allows, one line on what it is about, and a running band with the
   three pillars. Nothing else competes; the reel below does the explaining.

   The eagle's wings open step by step (its own stepped silhouette) and the
   lines of the name rise into place. Both are CSS only and fail open: without
   animation support, or with reduced motion, everything is simply there. */

export default function Hero({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const band = [...d.pillars.items.map((p) => p.name), d.hero.motto, 'De Indiis Editions'];
  return (
    <section className="title" aria-labelledby="hero-h">
      <div className="title__page">
        <span className="title__eagle" aria-hidden="true" />
        <h1 id="hero-h" className="title__name">
          <span className="title__line title__line--small"><span>Institute for</span></span>
          <span className="title__line"><span>Hispano</span></span>{' '}
          <span className="title__line"><span>Studies</span></span>
        </h1>
        <p className="title__say">{d.hero.h1a}<em>{d.hero.h1em}</em>{d.hero.h1b}</p>
      </div>

      {/* the running band: two copies, so the loop has no seam */}
      <div className="title__band" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span key={copy} className="title__run">
            {band.map((w) => (
              <span key={w} className="title__item">{w}<i className="title__star">✦</i></span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
