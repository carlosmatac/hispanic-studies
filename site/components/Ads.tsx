'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/* Google AdSense in the reader (issue #70). Off, and invisible, until
   NEXT_PUBLIC_ADSENSE_ID (ca-pub-…) and NEXT_PUBLIC_ADSENSE_SLOT (the id of one
   responsive display unit) are set: the empty `.ad-slot` placeholders the reader
   already carries (page.tsx, lib/text.ts) stay hidden. With them, the script
   loads and each placeholder becomes the unit. The EEA/UK consent message is not
   code: it is switched on in AdSense → Privacy & messaging and the script shows it. */
const ID = process.env.NEXT_PUBLIC_ADSENSE_ID;
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

export default function Ads() {
  useEffect(() => {
    if (!ID || !SLOT) return;
    const w = window as unknown as { adsbygoogle?: unknown[] };
    document.querySelectorAll<HTMLElement>('.ad-slot[data-ad-slot]').forEach((slot) => {
      if (slot.querySelector('ins')) return; // strict mode runs effects twice
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.dataset.adClient = ID;
      ins.dataset.adSlot = SLOT;
      ins.dataset.adFormat = 'auto';
      ins.dataset.fullWidthResponsive = 'true';
      slot.append(ins);
      slot.hidden = false;
      slot.removeAttribute('aria-hidden');
      slot.setAttribute('role', 'complementary');
      slot.setAttribute('aria-label', document.documentElement.lang === 'es' ? 'Publicidad' : 'Advertisement');
      (w.adsbygoogle ||= []).push({});
    });
  }, []);

  if (!ID || !SLOT) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ID}`}
    />
  );
}
