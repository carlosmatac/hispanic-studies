import Link from 'next/link';
import { dict, LANGS, type Lang } from '@/lib/i18n';

export const NAV = ['atlas', 'canon', 'watch', 'books', 'read', 'about', 'merch'] as const;
export type NavKey = (typeof NAV)[number];

/* The Atlas and the archive have their own pages; everything else is a section
   of the home. (The archive keeps the key "canon", its name until 2026-10-29.) */
export const navHref = (lang: Lang, k: NavKey) =>
  k === 'atlas' ? `/${lang}/atlas` : k === 'canon' ? `/${lang}/archive` : `/${lang}#${k}`;

/** `path` is the page's address without the language (e.g. "/archive/T001"), for the language switch. */
export default function Header({ lang, current, path }: { lang: Lang; current?: NavKey; path?: string }) {
  const d = dict(lang);
  const links = NAV.map((k) => (
    <a key={k} href={navHref(lang, k)} aria-current={k === current ? 'page' : undefined}>{d.nav[k]}</a>
  ));
  const here = path ?? (current === 'atlas' ? '/atlas' : current === 'canon' ? '/archive' : '');
  return (
    <header className="bar">
      <a className="skip" href="#main">{d.nav.skip}</a>
      <Link className="brand" href={`/${lang}`}>
        <span className="brand__mark" aria-hidden="true" />
        <span className="brand__name">Institute for<br />Hispano Studies</span>
      </Link>
      <nav className="nav" aria-label={d.nav.main}>{links}</nav>
      <div className="tools">
        <div className="lang" role="group" aria-label={d.nav.language}>
          {LANGS.map((l) => (
            <Link key={l} href={`/${l}${here}`} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
        <span className="mono cart">{d.nav.cart}</span>
        <details className="menu">
          <summary>Menu</summary>
          <nav aria-label={d.nav.main}>{links}</nav>
        </details>
      </div>
    </header>
  );
}
