/* Checks that the Atlas colours and names every territory by its status in the
   year shown (issue #104; Carlos found Brazil in Portugal's colour in 1896).

   - Every curated period (data/atlas-status.json) has a source, sane dates
     and a known kind, and a family's periods do not overlap.
   - For as long as each unit is on the globe (an American keyframe: until the
     next keyframe; a realm: between its OHM dates), the status in force never
     contradicts the transfers below: Spain's or Portugal's colour after a
     territory left them, or the independent states' before it was free.

     npm run atlas:status */

import eras from '../data/atlas-eras.json' with { type: 'json' };
import realms from '../data/atlas-realms.json' with { type: 'json' };
import status from '../data/atlas-status.json' with { type: 'json' };

type Period = { from: string; to: string; kind: string; source?: { en: string; es: string } };
const ST = status as unknown as { families: Record<string, { type?: string; periods?: Period[] }> };
const FAM = { ...(eras as unknown as { families: Record<string, { kind: string }> }).families, ...(realms as unknown as { families: Record<string, { kind: string }> }).families };
const isoYear = (iso: string) => { const [y, m = '1', d = '1'] = iso.replace(/^-/, '').split('-'); const v = +y + (+m - 1) / 12 + (+d - 1) / 365.25; return iso.startsWith('-') ? -v : v; };
const KINDS = new Set(['es', 'pt', 'isl', 'ant', 'indep', 'contested', 'other', 'native', 'claim']);

const kindAt = (f: string, y: number) => {
  const p = ST.families[f]?.periods?.find((x) => y >= isoYear(x.from) && y < isoYear(x.to));
  const k = p?.kind ?? FAM[f]?.kind;
  return k === 'pt-indep' ? 'indep' : k;
};

/* The transfers (a territory leaves Spain or Portugal, or a ruler changes),
   from the curated periods' own sources and the standard chronologies. */
type Rule = { f: string; after?: number; before?: number; not: string[]; why: string };
const RULES: Rule[] = [
  { f: 'brazil', after: 1822.69, not: ['pt'], why: 'Brazil independent, 7 September 1822' },
  { f: 'brazil', before: 1822.68, not: ['indep'], why: 'Brazil Portuguese until 7 September 1822' },
  { f: 'maranhao', after: 1822.69, not: ['pt'], why: 'Brazil independent, 7 September 1822' },
  { f: 'brazil-empire', after: 1822.69, not: ['pt', 'es'], why: 'the Empire, then the Republic, of Brazil' },
  { f: 'new-spain', after: 1821.75, not: ['es', 'contested'], why: 'Mexico independent, 27 September 1821' },
  { f: 'provincias-internas', after: 1821.75, not: ['es', 'contested'], why: 'Mexico independent, 1821' },
  { f: 'guatemala', after: 1821.71, not: ['es', 'contested'], why: 'Central America independent, 15 September 1821' },
  { f: 'peru', after: 1824.94, not: ['es', 'contested'], why: 'Ayacucho, 9 December 1824' },
  { f: 'new-granada', after: 1819.6, not: ['es', 'contested'], why: 'Boyacá, 7 August 1819' },
  { f: 'venezuela', after: 1821.48, not: ['es', 'contested'], why: 'Carabobo, 24 June 1821' },
  { f: 'rio-de-la-plata', after: 1816.53, not: ['es', 'contested'], why: 'independence declared at Tucumán, 9 July 1816' },
  { f: 'chile', after: 1818.12, not: ['es', 'contested'], why: 'independence proclaimed, 12 February 1818' },
  { f: 'florida', after: 1821.55, not: ['es'], why: 'Florida handed to the United States, July 1821' },
  { f: 'louisiana', after: 1803.92, not: ['es'], why: 'Louisiana handed to France, 30 November 1803' },
  { f: 'trinidad', after: 1797.14, not: ['es'], why: 'Trinidad taken by Britain, February 1797' },
  { f: 'jamaica-es', after: 1655.36, not: ['es'], why: 'Jamaica taken by England, May 1655' },
  { f: 'santo-domingo', after: 1822.11, not: ['es'], why: 'Haitian rule from February 1822' },
  { f: 'cuba', after: 1899.0, not: ['es'], why: 'United States military government from 1 January 1899' },
  { f: 'puerto-rico', after: 1898.95, not: ['es'], why: 'Treaty of Paris, 10 December 1898' },
  { f: 'philippines', after: 1899.28, not: ['es'], why: 'Treaty of Paris in force, 11 April 1899' },
  { f: 'us-cuba', after: 1902.39, not: ['other', 'es'], why: 'Republic of Cuba, 20 May 1902' },
  { f: 'us-philippines', after: 1946.51, not: ['other', 'es'], why: 'Philippine independence, 4 July 1946' },
  { f: 'dominican-republic', after: 1865.53, not: ['es'], why: 'Spain leaves Santo Domingo, July 1865' },
  { f: 'angola', after: 1975.87, not: ['pt'], why: 'Angola independent, 11 November 1975' },
  { f: 'mozambique', after: 1975.49, not: ['pt'], why: 'Mozambique independent, 25 June 1975' },
  { f: 'cape-verde', after: 1975.52, not: ['pt'], why: 'Cape Verde independent, 5 July 1975' },
  { f: 'sao-tome', after: 1975.53, not: ['pt'], why: 'São Tomé and Príncipe independent, 12 July 1975' },
  { f: 'pt-guinea', after: 1974.7, not: ['pt'], why: 'Guinea-Bissau recognised, 10 September 1974' },
  { f: 'timor', after: 1975.91, not: ['pt'], why: 'Portuguese administration ends, November–December 1975' },
  { f: 'macau', after: 1999.97, not: ['pt'], why: 'Macau handed to China, 20 December 1999' },
  { f: 'estado-da-india', after: 1961.97, not: ['pt'], why: 'Goa, Daman and Diu taken by India, December 1961' },
  { f: 'spanish-guinea', after: 1968.79, not: ['es'], why: 'Equatorial Guinea independent, 12 October 1968' },
  { f: 'ifni', after: 1969.5, not: ['es'], why: 'Ifni handed to Morocco, 30 June 1969' },
  { f: 'spanish-sahara', after: 1976.16, not: ['es'], why: 'Spain leaves Western Sahara, 26 February 1976' },
  { f: 'spanish-morocco', after: 1956.27, not: ['es'], why: 'Moroccan independence, 7 April 1956' },
  { f: 'milan', before: 1535.8, not: ['es'], why: 'Milan Spanish from 1535' },
];

let bad = 0;
const fail = (m: string) => { bad++; console.log(`FAIL  ${m}`); };

// 1. the curated periods
for (const [f, st] of Object.entries(ST.families)) {
  if (!FAM[f]) fail(`${f}: a status for a family the Atlas does not draw`);
  const ps = (st.periods ?? []).map((p) => ({ ...p, a: isoYear(p.from), b: isoYear(p.to) })).sort((p, q) => p.a - q.a);
  ps.forEach((p, i) => {
    if (!p.source?.en || !p.source?.es) fail(`${f} ${p.from}: no source`);
    if (!(p.b > p.a)) fail(`${f} ${p.from}–${p.to}: empty`);
    if (!KINDS.has(p.kind)) fail(`${f} ${p.from}: unknown kind ${p.kind}`);
    if (i > 0 && p.a < ps[i - 1].b - 1e-6) fail(`${f} ${p.from}: overlaps the period before`);
  });
}
for (const f of Object.keys(FAM)) if (!ST.families[f]) fail(`${f}: no status (type and sovereign) in data/atlas-status.json`);

// 2. when each family is on the globe
const shown = new Map<string, [number, number][]>();
const add = (f: string, a: number, b: number) => shown.set(f, [...(shown.get(f) ?? []), [a, b]]);
const E = (eras as unknown as { eras: { date: string; units: { f: string }[] }[] }).eras;
E.forEach((e, i) => { const a = isoYear(e.date), b = i + 1 < E.length ? isoYear(E[i + 1].date) : 2026.5; for (const u of e.units) add(u.f, a, b); });
for (const u of (realms as unknown as { units: { f: string; from: number; to: number }[] }).units) add(u.f, u.from, Math.min(u.to, 2026.5));

// 3. the transfers
let checked = 0;
for (const r of RULES) {
  for (const [a, b] of shown.get(r.f) ?? []) {
    const lo = Math.max(a, r.after ?? -Infinity), hi = Math.min(b, r.before ?? Infinity);
    for (let y = lo; y < hi; y += 0.02) {
      checked++;
      const k = kindAt(r.f, y);
      if (r.not.includes(k)) { fail(`${r.f} drawn as "${k}" in ${y.toFixed(2)} (${r.why})`); break; }
    }
  }
}
console.log(`${Object.keys(ST.families).length} families, ${RULES.length} transfers, ${checked} dated samples checked.`);
console.log(bad ? `${bad} problems.` : 'Every territory is coloured by its status in force.');
process.exit(bad ? 1 : 0);
