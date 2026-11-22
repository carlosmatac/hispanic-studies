'use client';

import { useState, type ReactNode } from 'react';

/* The ES/EN switch of a work's article (issue #93). It changes only the
   article's language, never the page's or the reading editions' (the brief:
   the article language is independent of the ES/PT/EN editions). Both
   articles are rendered on the server; the one not chosen is hidden. Without
   a script the tabs are links to the page in the other language, which shows
   that article. */

type Tab = { locale: string; label: string; href: string; content: ReactNode };

export default function ArticleTabs({ initial, tabs, label }: { initial: string; tabs: Tab[]; label: string }) {
  const [current, setCurrent] = useState(initial);
  if (tabs.length < 2) return <>{tabs[0]?.content}</>;
  const move = (dir: 1 | -1) => {
    const i = tabs.findIndex((t) => t.locale === current);
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    setCurrent(next.locale);
    document.getElementById(`art-tab-${next.locale}`)?.focus();
  };
  return (
    <div className="w80-article">
      <div className="w80-switch" role="tablist" aria-label={label}>
        <span className="w80-switch__label" aria-hidden="true">{label}</span>
        {tabs.map((t) => (
          <a key={t.locale} id={`art-tab-${t.locale}`} href={t.href} hrefLang={t.locale} role="tab" lang={t.locale}
            aria-selected={current === t.locale} aria-controls={`art-${t.locale}`} tabIndex={current === t.locale ? 0 : -1}
            onClick={(e) => { e.preventDefault(); setCurrent(t.locale); }}
            onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
            {t.label}
          </a>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.locale} id={`art-${t.locale}`} role="tabpanel" aria-labelledby={`art-tab-${t.locale}`} lang={t.locale} hidden={current !== t.locale}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
