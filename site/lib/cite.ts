import type { Reference } from '@/lib/canon';

/* A reference, formatted for the reader (Chicago, bibliography style), from
   the fields Beltrán fills in the back office. The result is a list of pieces,
   so titles can be set in italics and the address linked; Citation.tsx draws
   it, here and in the back office's preview.
     Book     Author. Title. Edition. Place: Publisher, Year. Pages. URL (accessed …).
     Chapter  Author. “Title.” In Book, edition, pages. Place: Publisher, Year. URL.
     Article  Author. “Title.” Journal (Year): pages. URL.
     Web      Author. “Title.” Site. Year. URL (accessed …). */

export type Piece = { text: string; italic?: boolean; href?: string };

const t = (s: string) => s.trim();
/** close a sentence, unless it already ends in a stop */
const stop = (s: string) => (/[.?!…]["”»']?$/.test(s) ? s : `${s}.`);

function accessedOn(iso: string, lang: 'en' | 'es') {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : null;
  if (!d || isNaN(+d)) return '';
  const day = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  return lang === 'es' ? `consultado el ${day}` : `accessed ${day}`;
}

export function cite(r: Reference, lang: 'en' | 'es' = 'en'): Piece[] {
  const out: Piece[] = [];
  const say = (text: string, extra: Omit<Piece, 'text'> = {}) => { if (text) out.push({ text, ...extra }); };
  const sp = () => { if (out.length) say(' '); };
  const [author, title, container, edition, publisher, place, year, pages, url] =
    [r.author, r.title, r.container, r.edition, r.publisher, r.place, r.year, r.pages, r.url].map(t);
  const imprint = [place && publisher ? `${place}: ${publisher}` : place || publisher, year].filter(Boolean).join(', ');
  const q = (s: string) => (lang === 'es' ? `«${s}»` : `“${s}”`);
  const quoted = (s: string) => (lang === 'es' ? q(s) + '.' : q(stop(s)));

  if (author) say(stop(author));
  if (r.kind === 'book') {
    if (title) { sp(); say(title, { italic: true }); say(/[.?!]$/.test(title) ? '' : '.'); }
    if (edition) { sp(); say(stop(edition)); }
    if (imprint) { sp(); say(stop(imprint)); }
    if (pages) { sp(); say(stop(pages)); }
  } else if (r.kind === 'chapter') {
    if (title) { sp(); say(quoted(title)); }
    if (container) {
      sp(); say(lang === 'es' ? 'En ' : 'In '); say(container, { italic: true });
      say([edition, pages].filter(Boolean).map((x) => `, ${x}`).join('') + '.');
    }
    if (imprint) { sp(); say(stop(imprint)); }
  } else if (r.kind === 'article') {
    if (title) { sp(); say(quoted(title)); }
    if (container) { sp(); say(container, { italic: true }); }
    const tail = [edition && ` ${edition}`, year && ` (${year})`, pages && `: ${pages}`].filter(Boolean).join('');
    if (container || tail) say(tail + '.');
  } else {
    if (title) { sp(); say(quoted(title)); }
    if (container) { sp(); say(container, { italic: true }); say('.'); }
    if (year) { sp(); say(stop(year)); }
  }
  if (url) {
    sp(); say(url, { href: url });
    const acc = accessedOn(r.accessed, lang);
    say(acc ? ` (${acc}).` : '.');
  }
  return out;
}

/** The citation as plain text. */
export const citeText = (r: Reference, lang: 'en' | 'es' = 'en') => cite(r, lang).map((p) => p.text).join('');
