'use client';

import dynamic from 'next/dynamic';
import type { Lang } from '@/lib/i18n';

/* React Flow measures the DOM, so the graph renders on the client only. The
   placeholder keeps the stage's height so the page does not jump. */
const CanonGraph = dynamic(() => import('./CanonGraph'), {
  ssr: false,
  loading: () => <div className="cg-placeholder" aria-hidden="true" />,
});

export default function CanonGraphLazy({ lang }: { lang: Lang }) {
  return <CanonGraph lang={lang} />;
}
