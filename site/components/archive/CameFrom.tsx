'use client';

import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';

/* "You came from: <work>" on the Collaborate page, from ?work=<slug> (the
   translation appeal passes it). Client-side, so the page itself stays static;
   without a script, or with an unknown slug, it shows nothing. */
export default function CameFrom({ titles, label, lang }: { titles: Record<string, string>; label: string; lang: Lang }) {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    // read once on arrival (the address does not change on this page)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlug(new URLSearchParams(location.search).get('work'));
  }, []);
  const title = slug ? titles[slug] : undefined;
  if (!title) return null;
  return (
    <p className="collab__from">
      {label}: <a href={`/${lang}/archive/${encodeURIComponent(slug!)}`}>{title}</a>
    </p>
  );
}
