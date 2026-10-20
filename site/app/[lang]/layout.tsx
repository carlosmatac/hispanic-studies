import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Ibarra_Real_Nova, Inter, IBM_Plex_Mono } from 'next/font/google';
import { LANGS, isLang, dict } from '@/lib/i18n';
import '../globals.css';

const display = Ibarra_Real_Nova({
  subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap',
});
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

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
    <html lang={lang} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
