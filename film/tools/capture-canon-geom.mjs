// Capture the canon graph as the site lays it out (each card's position, size
// and markup, each edge's path) into film/reel/data/canon-geom.json, which
// film/tools/make-works.py turns into the reel's canon shot. Needs the site
// running (cd site && npm run build && npx next start -p 3100) and playwright-core.
//   node film/tools/capture-canon-geom.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto('http://127.0.0.1:3100/en', { waitUntil: 'load' });
await p.evaluate(() => document.getElementById('canon').scrollIntoView({ behavior: 'instant' }));
await p.waitForSelector('.react-flow__node-text', { timeout: 30000 });
await p.waitForTimeout(1500);
const data = await p.evaluate(() => {
  const nodes = [...document.querySelectorAll('.react-flow__node')].map((n) => {
    const m = n.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    const card = n.querySelector('.cg-node');
    return {
      id: n.dataset.id, type: [...n.classList].find((c) => c.startsWith('react-flow__node-'))?.slice(17),
      x: m ? +m[1] : 0, y: m ? +m[2] : 0, w: n.offsetWidth, h: n.offsetHeight,
      cls: card ? card.className : '', html: card ? card.innerHTML : '',
    };
  });
  const edges = [...document.querySelectorAll('.react-flow__edge')].map((e) => {
    const path = e.querySelector('.react-flow__edge-path');
    return { id: e.dataset.id || e.getAttribute('data-testid'), d: path?.getAttribute('d'), style: path?.getAttribute('style') };
  });
  return { nodes, edges };
});
fs.writeFileSync(new URL('../reel/data/canon-geom.json', import.meta.url), JSON.stringify(data));
console.log(data.nodes.length, data.edges.length, JSON.stringify(data.nodes[0]).slice(0, 400), JSON.stringify(data.edges[0]).slice(0, 300));
await b.close();
