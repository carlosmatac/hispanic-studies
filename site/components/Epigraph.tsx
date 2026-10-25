import Image from 'next/image';
import { dict, type Lang } from '@/lib/i18n';
import { HANKE } from '@/lib/content';

/* The epigraph: Lewis Hanke's sentence, set after the film like the epigraph
   after a book's frontispiece. As the section scrolls past, the words are
   inked in one by one (CSS scroll-driven animation). It fails open: without
   support, or with reduced motion, the sentence is simply there. */

export default function Epigraph({ lang }: { lang: Lang }) {
  const t = dict(lang).epigraph;
  const words = HANKE.split(' ');
  return (
    <section className="epigraph" aria-label={t.label}>
      <div className="epigraph__stick">
        <Image className="epigraph__art" src="/art/epigraph-agnus-dei.jpg" alt="" width={1600} height={948} sizes="70vw" />
        <figure className="epigraph__fig">
          <blockquote className="epigraph__q" lang="en" style={{ '--n': words.length } as React.CSSProperties}>
            <span className="epigraph__mark" aria-hidden="true">“</span>
            {words.map((w, i) => (
              <span key={i} className="epigraph__w" style={{ '--i': i } as React.CSSProperties}>{w}{' '}</span>
            ))}
          </blockquote>
          <figcaption className="epigraph__by">
            <span className="epigraph__name">{t.by}</span>
            <span>{t.role}</span>
            <cite>{t.work}</cite>
          </figcaption>
          {t.translation && <p className="epigraph__tr">{t.translation}</p>}
        </figure>
      </div>
    </section>
  );
}
