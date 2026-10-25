import Link from 'next/link';
import { dict, LANGS, type Lang } from '@/lib/i18n';

export const NAV = ['atlas', 'canon', 'books', 'watch', 'read', 'about', 'merch'] as const;
export type NavKey = (typeof NAV)[number];

/* The Atlas and the canon have their own pages; everything else is a section of the home. */
export const navHref = (lang: Lang, k: NavKey) => (k === 'atlas' || k === 'canon' ? `/${lang}/${k}` : `/${lang}#${k}`);

export default function Header({ lang, current }: { lang: Lang; current?: NavKey }) {
  const d = dict(lang);
  const links = NAV.map((k) => (
    <a key={k} href={navHref(lang, k)} aria-current={k === current ? 'page' : undefined}>{d.nav[k]}</a>
  ));
  const here = current === 'atlas' || current === 'canon' ? `/${current}` : '';
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
