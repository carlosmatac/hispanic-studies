import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LANGS, isLang, dict } from '@/lib/i18n';
import { fontVars } from '@/lib/fonts';
import '../globals.css';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = dict(lang);
  return {
    title: d.meta.title,
    description: d.meta.description,
    alternates: { languages: { en: '/en', es: '/es' } },
    icons: { icon: '/brand/ihs-logo.svg' },
  };
}

export const viewport: Viewport = { themeColor: '#f9f3dd' };

export default async function RootLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
