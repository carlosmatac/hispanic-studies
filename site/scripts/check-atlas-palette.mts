/* Checks the Atlas map's palette (lib/atlas-palette.ts; issue #104).

   For every pair of realm colours that touch on the map (NEIGHBOURS), and for
   every realm colour against the grey of the rest of the world, the distance
   in OKLab under normal vision and under simulated protanopia, deuteranopia
   and tritanopia (Machado, Oliveira and Fernandes 2009, severity 1) must be at
   least MIN. Colour is not the only cue (every realm is named and edged), but
   the families must hold apart.

     npm run atlas:palette */

import { GROUND, NEIGHBOURS, TINTS, type Tint } from '../lib/atlas-palette';

const MIN_PAIR = 0.04;      // realms that touch
const MIN_LAND = 0.05;      // a realm against the grey land (normal vision)
const MIN_LAND_CVD = 0.03;  // ... and under simulation, with the edge drawn

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin = (h: string) => [1, 3, 5].map((i) => toLin(parseInt(h.slice(i, i + 2), 16) / 255));
function oklab([r, g, b]: number[]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const M: Record<string, number[][]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const seen = (h: string, k: string) => oklab(M[k].map((row) => { const v = lin(h); return Math.min(1, Math.max(0, row[0] * v[0] + row[1] * v[1] + row[2] * v[2])); }));
const dist = (a: string, b: string, k: string) => { const p = seen(a, k), q = seen(b, k); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

let bad = 0;
const row = (a: string, b: string, min: number, minCvd = min) => {
  const ds = Object.keys(M).map((k) => [k, dist(a, b, k)] as const);
  const fail = ds.filter(([k, d]) => d < (k === 'normal' ? min : minCvd));
  if (fail.length) bad++;
  console.log(`${fail.length ? 'FAIL' : 'ok  '}  ${a.padEnd(13)} ${b.padEnd(13)} ${ds.map(([k, d]) => `${k} ${d.toFixed(3)}`).join('  ')}`);
};
const name = (t: Tint) => t;
for (const [a, b] of NEIGHBOURS) {
  const ds = Object.keys(M).map((k) => [k, dist(TINTS[a], TINTS[b], k)] as const);
  const fail = ds.filter(([, d]) => d < MIN_PAIR);
  if (fail.length) bad++;
  console.log(`${fail.length ? 'FAIL' : 'ok  '}  ${name(a).padEnd(13)} ${name(b).padEnd(13)} ${ds.map(([k, d]) => `${k} ${d.toFixed(3)}`).join('  ')}`);
}
console.log('');
for (const t of Object.keys(TINTS) as Tint[]) row(TINTS[t], GROUND.land, MIN_LAND, MIN_LAND_CVD);
console.log(bad ? `\n${bad} pairs too close.` : '\nEvery pair holds apart.');
process.exit(bad ? 1 : 0);
