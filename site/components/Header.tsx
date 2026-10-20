import Link from 'next/link';
import { dict, LANGS, type Lang } from '@/lib/i18n';

export const NAV = ['atlas', 'canon', 'books', 'watch', 'read', 'about', 'merch'] as const;

export default function Header({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const links = NAV.map((k) => <a key={k} href={`#${k}`}>{d.nav[k]}</a>);
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
            <Link key={l} href={`/${l}`} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
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
