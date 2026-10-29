// usage: node render.mjs out.svg "title" layer.geojson[:propKey] ...
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/carlos/Escritorio/Carlos/Projects/hispanic-studies/site/package.json');
const d3 = await import(require.resolve('d3-geo'));
const topo = await import(require.resolve('topojson-client'));
const [out, title, ...layers] = process.argv.slice(2);
const world = JSON.parse(fs.readFileSync('/home/carlos/Escritorio/Carlos/Projects/hispanic-studies/site/public/data/world-110m.json'));
const land = topo.feature(world, world.objects.countries);
const W = 1400, H = 1000;
// frame: the Americas (+ Philippines inset drawn separately)
const proj = d3.geoEqualEarth().rotate([80, 0]).fitExtent([[10, 40], [W - 10, H - 10]], { type: 'MultiPoint', coordinates: [[-125, 48], [-35, 48], [-125, -56], [-35, -56], [-80, 50], [-80, -56]] });
const path = d3.geoPath(proj);
const pal = ['#470B15', '#8B5E4B', '#2F070D', '#b07a5e', '#6d2a35', '#a35c4a', '#5a3a2e', '#c49a7a', '#7b4b3c', '#9c3b4a', '#3d2a22', '#d4b48c'];
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#F9F3DD"/>`;
svg += `<path d="${path({ type: 'Sphere' })}" fill="#EDE3C8"/>`;
for (const f of land.features) svg += `<path d="${path(f) || ''}" fill="#F9F3DD" stroke="#28231E" stroke-width="0.4"/>`;
let k = 0; const legend = [];
for (const spec of layers) {
  const [file, key = 'name', filter] = spec.split(':');
  const fc = JSON.parse(fs.readFileSync(file));
  for (const f of fc.features) {
    if (!f.geometry) continue;
    const name = f.properties[key] || f.properties.NAME;
    if (filter && !new RegExp(filter).test(JSON.stringify(f.properties))) continue;
    // d3 needs clockwise outer rings; OHM/HB rings may be either way: fix by testing area
    const fix = JSON.parse(JSON.stringify(f));
    if (fix.geometry.type === 'Polygon') fix.geometry = { type: 'MultiPolygon', coordinates: [fix.geometry.coordinates] };
    for (const poly of fix.geometry.coordinates) for (let r = 0; r < poly.length; r++) {
      const a = d3.geoArea({ type: 'Polygon', coordinates: [poly[r]] });
      if (a > 2 * Math.PI) poly[r].reverse();
    }
    const c = pal[k % pal.length]; k++;
    const dd = path(fix); if (!dd) continue;
    svg += `<path d="${dd}" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="1"/>`;
    const ct = path.centroid(fix);
    legend.push([name, c, ct]);
  }
}
for (const [n, c, [x, y]] of legend) if (Number.isFinite(x)) svg += `<text x="${x}" y="${y}" font-family="sans-serif" font-size="13" fill="#28231E" text-anchor="middle" stroke="#F9F3DD" stroke-width="3" paint-order="stroke">${String(n).replace(/&/g, '&amp;')}</text>`;
svg += `<text x="20" y="28" font-family="serif" font-size="22" fill="#28231E">${title}</text></svg>`;
fs.writeFileSync(out, svg);
console.log('wrote', out, legend.length, 'features');
