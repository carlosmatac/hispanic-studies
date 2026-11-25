import type { ReactNode } from 'react';
import type { Manifesto, ManifestoLang } from '@/lib/manifesto';

/* Beltrán's manifesto as text (issue #116): the opening, then his seven
   numbered parts. The marks in lib/manifesto.ts are read here: **bold**,
   *italic* (nested inside bold where he did it) and [text](href); a link to
   another site opens in a new tab, like every channel link. */

function marks(s: string, from: number, close: string | null, key: { n: number }): [ReactNode[], number] {
  const out: ReactNode[] = [];
  let text = '';
  let i = from;
  const flush = () => { if (text) { out.push(text); text = ''; } };
  while (i < s.length) {
    if (close && s.startsWith(close, i)) break;
    if (s.startsWith('**', i)) {
      flush();
      const [kids, end] = marks(s, i + 2, '**', key);
      out.push(<strong key={key.n++}>{kids}</strong>);
      i = end + 2;
    } else if (s[i] === '*') {
      flush();
      const [kids, end] = marks(s, i + 1, '*', key);
      out.push(<em key={key.n++}>{kids}</em>);
      i = end + 1;
    } else {
      const link = s[i] === '[' ? /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i)) : null;
      if (link) {
        flush();
        const [, label, href] = link;
        const away = /^https?:/.test(href);
        out.push(
          <a key={key.n++} href={href} {...(away ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>,
        );
        i += link[0].length;
      } else {
        text += s[i++];
      }
    }
  }
  flush();
  return [out, i];
}

const inline = (s: string) => marks(s, 0, null, { n: 0 })[0];

export default function ManifestoText({ m, lang }: { m: Manifesto; lang: ManifestoLang }) {
  return (
    <div className="manifesto__text">
      <div className="manifesto__intro">
        {m.intro.map((p, i) => <p key={i}>{inline(p)}</p>)}
      </div>
      {m.sections.map((s) => (
        <section key={s.n} className="manifesto__part" aria-labelledby={`manifesto-${lang}-${s.n}`}>
          <h2 id={`manifesto-${lang}-${s.n}`}><span className="manifesto__n">{s.n}.</span> {s.title}</h2>
          {s.body.map((p, i) => <p key={i}>{inline(p)}</p>)}
        </section>
      ))}
    </div>
  );
}
