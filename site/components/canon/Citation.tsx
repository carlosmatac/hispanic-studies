import { cite } from '@/lib/cite';
import type { Reference } from '@/lib/canon';

/* One reference, formatted (lib/cite.ts): titles in italics, the address a link. */
export default function Citation({ reference, lang }: { reference: Reference; lang: 'en' | 'es' }) {
  return (
    <>
      {cite(reference, lang).map((p, i) =>
        p.href ? <a key={i} href={p.href} rel="noopener" target="_blank">{p.text}</a>
          : p.italic ? <i key={i}>{p.text}</i>
            : <span key={i}>{p.text}</span>)}
    </>
  );
}
