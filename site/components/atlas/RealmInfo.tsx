'use client';

import { forwardRef, useMemo } from 'react';
import type { Dict, Lang } from '@/lib/i18n';
import type { Chronicle } from '@/lib/atlas-chronicle';
import type { Spot } from '@/lib/atlas-globe';
import { statusAt } from '@/lib/atlas-status';

/* Click a territory, read what it was (#104, Carlos: "say I click Brazil in
   this year and it tells me: independent country? Kingdom of Portugal?").

   Everything comes from the data: the status curated with its source
   (data/atlas-status.json), the unit's own OpenHistoricalMap tags, the
   capital Wikidata gives for that date (public/data/atlas-units.json, built by
   tools/build-atlas-status.py), and today's country under the pointer. A
   field nobody gives is left out. Land outside the story says only that, and
   today's country: no polity is named there. */

export type UnitFacts = {
  units: Record<string, { ohm: number; name?: string; en?: string; es?: string; start?: string; end?: string; type?: string; wikidata?: string }>;
  capitals: Record<string, { id: string; from: number | null; to: number | null; name: { en: string; es: string } }[]>;
  iso: Record<string, string>;
};

type T = Dict['atlas'];

const y4 = (iso: string | undefined, lang: Lang) => {
  if (!iso) return '';
  const m = iso.match(/^(-?)0*(\d+)/);
  if (!m) return '';
  return m[1] ? `${m[2]} ${lang === 'es' ? 'a. C.' : 'BCE'}` : m[2];
};
const yy = (y: number, lang: Lang) => (y >= 2099 ? (lang === 'es' ? 'hoy' : 'today') : y < 0 ? `${Math.ceil(-y)} ${lang === 'es' ? 'a. C.' : 'BCE'}` : String(Math.floor(y)));

export function modernName(spot: Spot | null, facts: UnitFacts | null, lang: Lang): string | undefined {
  if (!spot?.iso || !facts) return undefined;
  const a2 = facts.iso[spot.iso];
  if (!a2) return undefined;
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(a2) ?? undefined; } catch { return undefined; }
}

type Props = {
  spot: Spot; chronicle: Chronicle; facts: UnitFacts | null; lang: Lang; t: T;
  related: { i: number; title: string } | null;
  onGo: (i: number) => void; onClose: () => void; sheet: boolean;
  /** the year as the cartouche shows it */
  when: string;
};

const RealmInfo = forwardRef<HTMLDivElement, Props>(function RealmInfo({ spot, chronicle, facts, lang, t, related, onGo, onClose, sheet, when }, ref) {
  const L = t.info;
  const today = modernName(spot, facts, lang);
  const body = useMemo(() => {
    // the Iberophone world today: the state under the pointer and the language it speaks
    if (spot.today || !spot.f) {
      const em = spot.today && spot.iso && chronicle.iberophone.emersa.includes(spot.iso);
      const sub = spot.today && spot.iso && chronicle.iberophone.submersa.includes(spot.iso);
      const pt = ['620', '076', '024', '508', '624', '626'].includes(spot.iso ?? '');
      return {
        title: today ?? L.outside,
        lines: [] as { k: string; v: string }[],
        status: em ? (pt ? L.portuguese : L.spanish) : sub ? L.historic : today ? L.outside : '',
      };
    }
    const fam = chronicle.families[spot.f];
    const st = statusAt(fam, spot.year);
    const lines: { k: string; v: string }[] = [];
    const statusText = st.kind === 'contested' ? L.contested : st.type ? (t.polity[st.type] ?? '') : st.kind === 'indep' ? t.indepState : '';
    if (st.sovereign) lines.push({ k: L.belonged, v: st.sovereign });
    // the capital, as Wikidata gives it for this date (one, or none shown)
    const u = spot.unit ? facts?.units[spot.unit] : undefined;
    const caps = u?.wikidata ? facts?.capitals[u.wikidata] ?? [] : [];
    const dated = caps.filter((c) => (c.from === null || c.from <= spot.year) && (c.to === null || spot.year < c.to));
    const cap = dated.length === 1 ? dated[0] : caps.length === 1 && caps[0].from === null && caps[0].to === null ? caps[0] : null;
    if (cap) lines.push({ k: L.capital, v: cap.name[lang] || cap.name.en });
    if (st.period) lines.push({ k: L.dates, v: `${yy(st.period.from, lang)}–${yy(st.period.to, lang)}` });
    return { title: spot.name ?? fam?.name ?? '', lines, status: statusText, note: st.note, source: st.period?.source, unit: u };
  }, [spot, chronicle, facts, lang, t, L, today]);

  const u = 'unit' in body ? body.unit : undefined;
  const inRange = u && (() => {
    const s = u.start ? parseFloat(u.start) : -Infinity, e = u.end ? parseFloat(u.end) + 1 : Infinity;
    return spot.year >= s && spot.year < e;
  })();
  const eraYear = (() => { let y = ''; for (const e of chronicle.eras) if (e.year <= spot.year) y = String(e.year); return y; })();

  return (
    <div className={`atlas__info${sheet ? ' is-sheet' : ''}`} ref={ref} role="dialog" aria-label={L.label} tabIndex={-1}>
      <button type="button" className="atlas__x atlas__info-x" onClick={onClose} aria-label={L.close} title={L.close}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
      </button>
      <p className="atlas__info-year">{when}</p>
      <h3 className="atlas__info-h">{body.title}</h3>
      {today && body.title !== today && spot.f && <p className="atlas__info-today"><span>{L.today}</span> {today}</p>}
      {body.status && <p className="atlas__info-status">{body.status}</p>}
      {'note' in body && body.note && <p className="atlas__info-note">{body.note}</p>}
      {body.lines.length > 0 && (
        <dl className="atlas__info-dl">
          {body.lines.map((l) => <div key={l.k}><dt>{l.k}</dt><dd>{l.v}</dd></div>)}
        </dl>
      )}
      {u && (
        <p className="atlas__info-src">
          <span>{L.border}</span>{' '}
          <a href={`https://www.openhistoricalmap.org/relation/${u.ohm}`} target="_blank" rel="noopener noreferrer">
            {(lang === 'es' ? u.es : u.en) ?? u.name} {u.start || u.end ? `(${y4(u.start, lang)}–${y4(u.end, lang) || (lang === 'es' ? 'hoy' : 'today')})` : ''}
          </a>
          {!inRange && eraYear && <> · {L.borderAsOf(eraYear)}</>}
          {' '}· OpenHistoricalMap, CC0
        </p>
      )}
      {'source' in body && body.source && <p className="atlas__info-src"><span>{L.source}</span> {body.source}</p>}
      {related && <button type="button" className="atlas__info-see" onClick={() => onGo(related.i)}>{L.see}: {related.title} →</button>}
    </div>
  );
});

export default RealmInfo;
