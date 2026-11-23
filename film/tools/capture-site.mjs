/* Capture the site where the reel shows the site (issue #107), from a running copy of it
   (`npm run dev` or `npm start` in site/), at 2x, on a virtual clock so every frame is exact.

     node film/tools/capture-site.mjs globe <base url> <out dir>    the "four continents" globe
     node film/tools/capture-site.mjs app   <base url> <out dir>    the Atlas app, for the works
     node film/tools/capture-site.mjs pages <base url> <out dir>    the archive page and a work's page

   - globe: our own engine (site/lib/atlas-globe.ts, bundled with esbuild from site/node_modules,
     plus a camera setter that exists only in the bundle) draws the "today" stop on a bare canvas,
     a scripted camera frame by frame (film frames 130 to 237): close on Iberia, back to the
     planet, turning east. Writes g_<frame>.png and labels.json (where America, Europe, Africa
     and Asia fall on each frame, for the names in compositions/name.html).
   - app: the Atlas page as it is, its deep links (#on-map-<stop>) sent on given film times; the
     engine flies there by itself. CSS transitions are off so the cards swap on the frame.
     Writes a_<frame>.png for the frames and stops in film/reel/assets/img/site/site.json.
   - pages: /en/archive (the collection's title down its first era) and /en/archive/T030.

   Then (ffmpeg): the PNGs are scaled to 1920 x 1080 with the BT.709 matrix and encoded to
   film/reel/assets/atlas/globe-today.mp4 and atlas-app.mp4 (x264 crf 18); the pages to JPEG in
   film/reel/assets/img/site/. Needs playwright-core (PLAYWRIGHT_CORE=<its folder>, or installed
   where node finds it) and Microsoft Edge. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = path.join(ROOT, 'site');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'film/reel/assets/img/site/site.json'), 'utf8'));

const [mode, base, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const CSS = '*,*::before,*::after{transition:none!important;animation:none!important} nextjs-portal{display:none!important} .reveal{opacity:1!important;transform:none!important}';

// a virtual clock: performance.now and requestAnimationFrame answer to __vt.step(ms) only
const virtualClock = () => {
  let now = 1000, cbs = [], id = 0;
  performance.now = () => now;
  window.requestAnimationFrame = (f) => { cbs.push([++id, f]); return id; };
  window.cancelAnimationFrame = (i) => { cbs = cbs.filter(([j]) => j !== i); };
  window.__vt = { step(ms) { now += ms; const run = cbs; cbs = []; for (const [, f] of run) { try { f(now); } catch (e) { console.error(e); } } return run.length; } };
};
const shoot = async (page, file) => {
  for (let tries = 0; ; tries++) {
    try { await page.screenshot({ path: file, timeout: 90000 }); return; } catch (err) { if (tries > 3) throw err; }
  }
};
const browserAt2x = async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  return { browser, ctx };
};

/* ---------- globe ---------- */
const P2 = 4.326;                 // the second guitar phrase (compositions/name.html)
const GLOBE = { first: 130, end: 238, inset: { l: 330, r: 0, t: 150, b: 0 } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const p3io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const sstep = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
// close on Iberia, back to the planet (power3.inOut over 1.7 s), and a turn east that ramps up to 13 deg/s
function camAt(t) {
  const tau = t - P2;
  const e = p3io(clamp(tau / 1.7, 0, 1));
  const k = tau <= 1.7 ? Math.exp(Math.log(7) * (1 - e)) : 1 - 0.06 * (tau - 1.7) / 1.89;
  const lat = 40 + (9 - 40) * e;
  let lon = -4;
  const dt = 1 / 600;
  for (let x = 0; x < tau; x += dt) lon += 13 * sstep((x - 1.1) / 1.0) * dt;
  return { lon, lat, k };
}
const ANCHORS = { america: [-60, -12], europa: [-2, 47], africa: [18, -6], asia: [80, 32] };

async function bundleEngine() {
  const src = fs.readFileSync(path.join(SITE, 'lib/atlas-globe.ts'), 'utf8');
  const key = '    lookAt(at: LonLat) {';
  if (src.split(key).length !== 2) throw new Error('lib/atlas-globe.ts changed: update the camera setter');
  const patched = src.replace(key, '    __setCam(c: { lon: number; lat: number; k: number }) { cam = { lon: c.lon, lat: c.lat, R: R0() * c.k }; free = true; flight = null; vel = { lon: 0, lat: 0 }; kick(); },\n    __R0: () => R0(),\n    __avail: () => avail(),\n' + key);
  const esbuild = require(path.join(SITE, 'node_modules/esbuild'));
  const r = await esbuild.build({
    stdin: { contents: patched + '\n;(window as unknown as Record<string, unknown>).AtlasFilm = { createAtlasGlobe, DEFAULT_LAYERS };\n', resolveDir: path.join(SITE, 'lib'), loader: 'ts' },
    bundle: true, format: 'iife', write: false, tsconfig: path.join(SITE, 'tsconfig.json'), nodePaths: [path.join(SITE, 'node_modules')], target: 'es2020', logLevel: 'warning',
  });
  return r.outputFiles[0].text;
}

async function chronicleAndWords() {
  // the chronicle and the Atlas's words, as the page builds them (via tsx, in site/)
  const tmp = path.join(SITE, 'scripts', `_film-${process.pid}.mts`);
  const out = path.join(outDir, 'chronicle.json');
  fs.writeFileSync(tmp, `import { chronicleFor } from '@/lib/atlas-chronicle';\nimport { dict } from '@/lib/i18n';\nimport fs from 'node:fs';\nconst t = dict('en').atlas as any;\nfs.writeFileSync(${JSON.stringify(out)}, JSON.stringify({ chron: chronicleFor('en'), t: { seas: t.seas, lines: t.lines, approxText: t.approxText } }));\n`);
  try {
    const { execFileSync } = await import('node:child_process');
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', tmp], { cwd: SITE, stdio: 'inherit', shell: process.platform === 'win32' });
  } finally { fs.rmSync(tmp, { force: true }); }
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

async function globe() {
  const bundle = await bundleEngine();
  const { chron, t } = await chronicleAndWords();
  const { browser, ctx } = await browserAt2x();
  await ctx.addInitScript(virtualClock);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  // a page of the site, for its origin (the engine fetches /data/*) and its fonts
  await page.goto(base + '/en/atlas/chronicle', { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(async () => {
    const v = getComputedStyle(document.documentElement);
    const loads = [];
    for (const k of ['--font-display', '--font-body', '--font-mono']) for (const w of ['400', '500', '600']) for (const s of ['normal', 'italic']) loads.push(document.fonts.load(`${s} ${w} 20px ${v.getPropertyValue(k).trim()}`).catch(() => {}));
    await Promise.all(loads);
    document.body.innerHTML = '<canvas id="film" style="position:fixed;left:0;top:0;width:1920px;height:1080px;display:block"></canvas>';
    document.body.style.cssText = 'margin:0;overflow:hidden;background:#17130f';
  });
  await page.addScriptTag({ content: bundle });
  await page.evaluate(({ chron, t }) => {
    const { createAtlasGlobe, DEFAULT_LAYERS } = window.AtlasFilm;
    window.__e = createAtlasGlobe(document.getElementById('film'), chron, {
      lang: 'en', reduced: false, mode: 'globe', seaNames: t.seas, lines: t.lines, approxText: t.approxText,
      layers: { ...DEFAULT_LAYERS, events: false },
      onFrame: () => {}, onHover: () => {}, onReady: () => { window.__ready = true; }, onError: () => { window.__failed = true; },
    });
  }, { chron, t });
  for (let i = 0; i < 400 && !(await page.evaluate(() => window.__ready || window.__failed)); i++) {
    await page.evaluate(() => window.__vt.step(16));
    await page.waitForTimeout(100);
  }
  if (await page.evaluate(() => window.__failed)) throw new Error('the engine failed to load');
  const today = chron.stops.findIndex((s) => s.id === 'today');
  await page.evaluate(({ today, inset }) => { const e = window.__e; e.setInset(inset); e.setAvoid([]); e.setOverview(false); e.seekStop(today); e.resize(); }, { today, inset: GLOBE.inset });
  for (let i = 0; i < 300; i++) await page.evaluate(() => window.__vt.step(16));
  const rows = [];
  for (let f = GLOBE.first; f < GLOBE.end; f++) {
    const c = camAt(f / 30);
    const info = await page.evaluate((c) => { const e = window.__e; e.__setCam(c); window.__vt.step(33.333); window.__vt.step(1); return { R0: e.__R0(), a: e.__avail() }; }, c);
    // where each anchor falls: the orthographic projection the engine uses (d3 geoOrthographic)
    const R = info.R0 * c.k, rad = Math.PI / 180, l0 = c.lon * rad, p0 = c.lat * rad;
    const row = { f, cam: c };
    for (const [k, [lon, lat]] of Object.entries(ANCHORS)) {
      const l = lon * rad, p = lat * rad;
      const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
      const x = R * Math.cos(p) * Math.sin(l - l0);
      const y = R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0));
      row[k] = [Math.round((info.a.cx + x) * 10) / 10, Math.round((info.a.cy - y) * 10) / 10, Math.round(cosc * 1000) / 1000];
    }
    rows.push(row);
    await shoot(page, path.join(outDir, `g_${String(f).padStart(4, '0')}.png`));
  }
  fs.writeFileSync(path.join(outDir, 'labels.json'), JSON.stringify({ first: GLOBE.first, rows }));
  await browser.close();
}

/* ---------- app ---------- */
async function app() {
  const { first, frames, stops } = MANIFEST.atlas;
  const { browser, ctx } = await browserAt2x();
  await ctx.addInitScript(virtualClock);
  const page = await ctx.newPage();
  await page.goto(base + '/en/atlas', { waitUntil: 'networkidle', timeout: 120000 });
  await page.addStyleTag({ content: CSS });
  const step = (ms) => page.evaluate((ms) => window.__vt.step(ms), ms);
  for (let i = 0; i < 60; i++) { await step(16); await step(16); await page.waitForTimeout(50); }
  const go = async (id) => { await page.evaluate((id) => { location.hash = 'on-map-' + id; }, id); await page.waitForTimeout(150); };
  // before the shot: the first stop, settled; then the clock runs in film time
  await go(stops[0][1]);
  for (let i = 0; i < 320; i++) { await step(16); if (i % 4 === 3) await page.waitForTimeout(20); }
  await page.waitForTimeout(800);
  let t = stops[1][0] - 0.6, k = 1;
  for (let f = first; f < first + frames; f++) {
    const tf = f / 30;
    while (t < tf - 1e-9) {
      if (k < stops.length && stops[k][0] <= t + 1e-9) { await go(stops[k][1]); k++; }
      const next = Math.min(tf, k < stops.length ? Math.max(stops[k][0], t + 0.001) : tf, t + 1 / 60);
      await step((next - t) * 1000);
      t = next;
    }
    await page.waitForTimeout(60);
    await shoot(page, path.join(outDir, `a_${String(f).padStart(4, '0')}.png`));
  }
  await browser.close();
}

/* ---------- pages ---------- */
async function pages() {
  const { browser, ctx } = await browserAt2x();
  const page = await ctx.newPage();
  for (const [key, h] of [['archive', MANIFEST.archive.h], ['work', MANIFEST.work.h]]) {
    await page.goto(base + MANIFEST[key].from, { waitUntil: 'networkidle', timeout: 120000 });
    await page.addStyleTag({ content: CSS });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, MANIFEST[key].file.replace(/\.jpg$/, '.png')), clip: { x: 0, y: 0, width: 1920, height: h }, fullPage: true });
  }
  await browser.close();
}

await ({ globe, app, pages }[mode] ?? (() => { throw new Error('mode: globe, app or pages'); }))();
