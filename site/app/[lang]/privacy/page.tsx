import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dict, isLang } from '@/lib/i18n';
import { privacyPath } from '@/lib/canon';
import { renderMarkdown, renderTree } from '@/lib/text';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/* The privacy policy (issue #111): /en/privacy and /es/privacidad. AdSense and its
   consent message need a public one, and the footer links to it. Everything it says
   is what the site does today (no analytics, no cookies for readers, a signup that
   sends nothing yet, ads from Google AdSense, hosting on Vercel and Neon); when one
   of those changes, this text changes with it. The brackets are for what only the
   owners can fill in (the contact, the date) and for the review that must happen
   before it is published. Static. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return {
    title: `${d.privacy.meta} · ${d.meta.title}`,
    alternates: { languages: { en: `/en${privacyPath('en')}`, es: `/es${privacyPath('es')}` } },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = dict(lang).privacy;
  return (
    <>
      <Header lang={lang} path={privacyPath(lang)} />
      <main id="main" className="legal">
        <section className="page-head" aria-labelledby="privacy-h">
          <p className="eyebrow">{p.eyebrow}</p>
          <h1 id="privacy-h">{p.h}</h1>
          <p className="pending">{p.draft}</p>
          <p>{p.updated}</p>
        </section>
        <div className="legal__list">
          {p.sections.map((s, i) => (
            <section key={i} className="legal__point" aria-labelledby={`privacy-${i}`}>
              <span className="legal__n" aria-hidden="true">{i + 1}</span>
              <h2 id={`privacy-${i}`}>{s.h}</h2>
              {renderTree(renderMarkdown(s.body, { adSlot: false }).tree, React)}
            </section>
          ))}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
