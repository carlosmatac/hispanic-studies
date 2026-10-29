import type { Metadata, Viewport } from 'next';
import { fontVars } from '@/lib/fonts';
import { adminLang } from '@/lib/admin/lang';
import '../globals.css';
import './admin.css';

/* The back office (issue #69): its own root layout, in the site's faces and
   colours, never indexed. Spanish unless the editor picks English. */

export const metadata: Metadata = {
  title: 'IHS · Archivo',
  robots: { index: false, follow: false },
  icons: { icon: '/brand/ihs-logo.svg' },
};

export const viewport: Viewport = { themeColor: '#f9f3dd' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const lang = await adminLang();
  return (
    <html lang={lang} className={fontVars}>
      <body className="admin">{children}</body>
    </html>
  );
}
