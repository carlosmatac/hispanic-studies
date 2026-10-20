'use client';

import { useEffect, useRef, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';

interface Place { name: Record<string, string>; tier: 'emersa' | 'submersa'; authors: number }

/* The Atlas plate from proposals/o-atlas/map.js, mounted as is: it draws
   into its host imperatively, and this wrapper only owns its lifetime and
   the readout. */
export default function HeroMap({ lang }: { lang: Lang }) {
  const d = dict(lang).map;
  const host = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState<Place | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let api: { destroy(): void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { drawMap, loadMapData } = await import('@/lib/atlas-map');
        const data = await loadMapData('/data');
        if (cancelled || !host.current) return;
        api = drawMap(host.current, data, { animate: true, onPick: (p: Place | null) => setPick(p) });
      } catch (err) {
        console.error(err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; api?.destroy(); };
  }, []);

  return (
    <>
      <div ref={host} className={`hero-map${failed ? ' is-failed' : ''}`}>{failed ? d.failed : null}</div>
      <div className="readout" aria-live="polite">
        {pick ? (
          <>
            <strong>{pick.name[lang] || pick.name.en}</strong>
            <span className="hint">{pick.tier === 'emersa' ? d.emersa : d.submersa}</span>
            <dl><dt>{d.inCorpus}</dt><dd>{d.author(pick.authors)}</dd></dl>
          </>
        ) : <span className="hint">{d.hint}</span>}
      </div>
    </>
  );
}
