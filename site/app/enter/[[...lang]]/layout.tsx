import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { fontVars } from '@/lib/fonts';
import { entryLang } from '@/lib/preview-gate';
import { isLang } from '@/lib/i18n';
import '../../globals.css';
import '../enter.css';

/* The entry page of the private preview (issue #86): its own root layout, in
   the site's faces and colours, never indexed. /enter picks the language from
   the browser; /enter/en and /enter/es are the switch. */

export const metadata: Metadata = {
  title: 'Institute for Hispano Studies',
  robots: { index: false, follow: false },
  icons: { icon: '/brand/ihs-logo.svg' },
};

export const viewport: Viewport = { themeColor: '#f9f3dd' };

export default async function EnterLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang?: string[] }> }) {
  const { lang: seg } = await params;
  if (seg && (seg.length > 1 || !isLang(seg[0]))) notFound();
  const lang = seg?.[0] ?? entryLang(null, (await headers()).get('accept-language'));
  return (
    <html lang={lang} className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
