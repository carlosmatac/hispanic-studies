import type { Metadata } from 'next';

/* The CMS has its own root layout: it is not part of the site (no header, no
   fonts, no grain) and it is never indexed. proxy.ts keeps it closed on a
   deployment that has no GitHub login configured. */

export const metadata: Metadata = {
  title: 'IHS · Archive editor',
  robots: { index: false, follow: false },
};

export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
