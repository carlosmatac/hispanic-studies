'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* The back office's sections; the current one marked. */
export default function AdminNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const path = usePathname();
  const current = (href: string) => (href === '/admin' ? path === '/admin' || path.startsWith('/admin/works') : path.startsWith(href));
  return (
    <nav className="adm-nav" aria-label={label}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={current(i.href) ? 'page' : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
