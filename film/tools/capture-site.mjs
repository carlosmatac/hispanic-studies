/* Render the Atlas globe for the reel from our own engine, and export the archive's works
   (issue #107). Nothing here captures a page of the site: the globe is drawn alone on a bare
   canvas (the planet, its realms, routes and treaty lines; no UI), and the archive is data
   that film/tools/make-works.py builds covers from.

     node film/tools/capture-site.mjs globe   <out dir>   the "four continents" opening (film frames 130-237)
     node film/tools/capture-site.mjs atlas   <out dir>   the Atlas shot of the works (film/reel/assets/atlas/atlas-plan.json)
     node film/tools/capture-site.mjs archive <out file>  the curated works, their regions' colours, three articles' first lines

   - globe / atlas: site/lib/atlas-globe.ts is bundled with esbuild (from site/node_modules) with a
     film camera added only in the bundle (the site's code is untouched), and run in Edge by
     Playwright on a virtual clock, so every frame is exact. The engine's data are served straight
     from site/public by Playwright (no server); Ibarra Real Nova from film/reel/assets/fonts.
     Writes <prefix>_<film frame>.png at 2x and a JSON of where the named places fall on each frame
     (labels.json for the continents' names, pins.json for the milestone cards).
   - archive: reads the archive's database (read only) with site/.env.local.

   Then the PNGs are scaled to 1920 x 1080 with the BT.709 matrix and encoded (x264 crf 18) to
   film/reel/assets/atlas/globe-today.mp4 and atlas-shot.mp4. Needs playwright-core
   (PLAYWRIGHT_CORE=<its folder>, or installed where node finds it) and Microsoft Edge. */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = path.join(ROOT, 'site');
const FONTS = path.join(ROOT, 'film/reel/assets/fonts');
const require = createRequire(import.meta.url);
const [mode, out] = process.argv.slice(2);

function tsx(code, args = []) {
  const tmp = path.join(SITE, 'scripts', `_film-${process.pid}.mts`);
  fs.writeFileSync(tmp, code);
  try {
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', '--env-file=.env.local', tmp, ...args], { cwd: SITE, stdio: 'inherit', shell: process.platform === 'win32' });
  } finally { fs.rmSync(tmp, { force: true }); }
}

/* ---------- archive ---------- */
function archive() {
  tsx(`import fs from 'node:fs';
import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { swatch, swatchHex } from '@/lib/palette';
const db = getDb();
const [works, regions, eras, arts] = await Promise.all([db.select().from(schema.works), db.select().from(schema.regions), db.select().from(schema.eras).orderBy(asc(schema.eras.position)), db.select().from(schema.workArticles)]);
const sw = new Map(regions.map((r) => [r.id, r.swatch])), rn = new Map(regions.map((r) => [r.id, r.nameEn]));
const ei = (id: string | null) => eras.findIndex((e) => e.id === id);
const cur = works.filter((w) => w.curated && w.status === 'published' && w.eraId).sort((a, b) => ei(a.eraId) - ei(b.eraId) || (a.curatedOrder ?? 0) - (b.curatedOrder ?? 0));
const out = {
  eras: eras.map((e) => ({ id: e.id, name: e.nameEn, from: e.yearFrom, to: e.yearTo })),
  works: cur.map((w) => { const s = swatch(sw.get(w.regionId) ?? 'paper'); return { id: w.id, title: w.originalTitle || w.title, author: w.creator || w.author, year: w.year, date: w.dateDisplay || String(w.year), era: w.eraId, region: rn.get(w.regionId), swatch: s.id, bg: swatchHex(s), fg: s.fg, accent: s.accent, line: s.line }; }),
  articles: arts.filter((a) => a.locale === 'en' && ['T030', 'T013', 'T001'].includes(a.workId)).map((a) => ({ id: a.workId, title: a.title, aboutAuthor: a.aboutAuthor.slice(0, 400), workInItsTime: a.workInItsTime.slice(0, 400), whyReadToday: a.whyReadToday.slice(0, 400) })),
};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
process.exit(0);
`, [path.resolve(out)]);
}

/* ---------- the globe ---------- */
function chronicle() {
  const file = path.join(path.resolve(out), 'chronicle.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  tsx(`import { chronicleFor } from '@/lib/atlas-chronicle';
import { dict } from '@/lib/i18n';
import fs from 'node:fs';
const t = dict('en').atlas as any;
fs.writeFileSync(process.argv[2], JSON.stringify({ chron: chronicleFor('en'), t: { seas: t.seas, lines: t.lines, approxText: t.approxText } }));
`, [file]);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function bundle() {
  const src = fs.readFileSync(path.join(SITE, 'lib/atlas-globe.ts'), 'utf8');
  const k0 = 'export function createAtlasGlobe(canvas: HTMLCanvasElement, chron: Chronicle, opts: EngineOpts): Engine {';
  const k1 = '    lookAt(at: LonLat) {', k2 = '      if (st.era !== lastEra) {';
  for (const k of [k0, k1, k2]) if (src.split(k).length !== 2) throw new Error('lib/atlas-globe.ts changed: update the film camera in capture-site.mjs');
  // the film camera: where it looks and the story's clock, set per frame; it holds against the story's own flights
  const p = src
    .replace(k0, k0 + '\n  let filmCam: { lon: number; lat: number; k: number } | null = null;')
    .replace(k2, '      if (filmCam) { cam = { lon: filmCam.lon, lat: filmCam.lat, R: R0() * filmCam.k }; flight = null; free = true; moving = false; }\n' + k2)
    .replace(k1, '    __film(c: { lon: number; lat: number; k: number }, at: number) { filmCam = c; s = clamp(at, 0, total); dirty = true; last = 0; schedule(); },\n    __R0: () => R0(),\n    __avail: () => avail(),\n' + k1);
  const esbuild = require(path.join(SITE, 'node_modules/esbuild'));
  return esbuild.buildSync({
    stdin: { contents: p + '\n;(window as unknown as Record<string, unknown>).AtlasFilm = { createAtlasGlobe, DEFAULT_LAYERS };\n', resolveDir: path.join(SITE, 'lib'), loader: 'ts' },
    bundle: true, format: 'iife', write: false, tsconfig: path.join(SITE, 'tsconfig.json'), nodePaths: [path.join(SITE, 'node_modules')], target: 'es2020', logLevel: 'warning',
  }).outputFiles[0].text;
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = { linear: (u) => u, inout: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2), p3: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) };
const sstep = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
// a camera through keyframes { at, lon, lat, k, ease } (zoom eased in log space)
const keyframed = (keys) => (tau) => {
  if (tau <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (tau <= keys[i].at) {
      const a = keys[i - 1], b = keys[i], u = ease[b.ease || 'inout']((tau - a.at) / (b.at - a.at));
      return { lon: a.lon + (b.lon - a.lon) * u, lat: a.lat + (b.lat - a.lat) * u, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * u) };
    }
  }
  return keys[keys.length - 1];
};

// the opening (compositions/name.html, the second guitar phrase at 4.326 s): close on Iberia,
// back to the planet (power3.inOut over 1.7 s), turning east (up to 13 deg/s)
const P2 = 4.326;
const OPENING = {
  first: 130, end: 238, t0: 0, inset: { l: 330, r: 0, t: 150, b: 0 }, prefix: 'g', json: 'labels.json',
  story: [{ at: 0, stop: 'today' }],
  cam(tau) {
    const u = tau - P2, e = ease.p3(clamp(u / 1.7, 0, 1));
    let lon = -4;
    for (let x = 0; x < u; x += 1 / 600) lon += 13 * sstep((x - 1.1) / 1.0) / 600;
    return { lon, lat: 40 + (9 - 40) * e, k: u <= 1.7 ? Math.exp(Math.log(7) * (1 - e)) : 1 - 0.06 * (u - 1.7) / 1.89 };
  },
  pins: { america: [-60, -12], europa: [-2, 47], africa: [18, -6], asia: [80, 32] },
};

async function render(spec) {
  const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
  const { chron, t } = chronicle();
  const code = bundle();
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => {
      let now = 1000, cbs = [], id = 0;
      performance.now = () => now;
      window.requestAnimationFrame = (f) => { cbs.push([++id, f]); return id; };
      window.cancelAnimationFrame = (i) => { cbs = cbs.filter(([j]) => j !== i); };
      window.__vt = { step(ms) { now += ms; const run = cbs; cbs = []; for (const [, f] of run) { try { f(now); } catch (e) { console.error(e); } } } };
    });
    await ctx.route('http://film.local/**', (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><style>
        @font-face { font-family: "Ibarra Real Nova"; src: url("/font/ibarra-real-nova.ttf"); font-weight: 400 700; }
        @font-face { font-family: "Ibarra Real Nova"; src: url("/font/ibarra-real-nova-italic.ttf"); font-weight: 400 700; font-style: italic; }
        :root { --font-display: "Ibarra Real Nova"; --font-body: "Segoe UI"; --font-mono: Consolas; }
        html, body { margin: 0; background: #17130f; overflow: hidden; }
        canvas { position: fixed; left: 0; top: 0; width: 1920px; height: 1080px; display: block; }
        </style><canvas id="film"></canvas>` });
      if (u.pathname.startsWith('/font/')) return route.fulfill({ path: path.join(FONTS, u.pathname.slice(6)), contentType: 'font/ttf' });
      return route.fulfill({ path: path.join(SITE, 'public', decodeURIComponent(u.pathname)) });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('pageerror', e.message));
    await page.goto('http://film.local/', { waitUntil: 'load' });
    await page.evaluate(async () => { for (const f of ['400 20px', '600 20px', 'italic 600 20px']) await document.fonts.load(`${f} "Ibarra Real Nova"`); });
    await page.addScriptTag({ content: code });
    await page.evaluate(({ chron, t }) => {
      const { createAtlasGlobe, DEFAULT_LAYERS } = window.AtlasFilm;
      window.__e = createAtlasGlobe(document.getElementById('film'), chron, {
        lang: 'en', reduced: false, mode: 'globe', seaNames: t.seas, lines: t.lines, approxText: t.approxText,
        layers: { ...DEFAULT_LAYERS, events: false },
        onFrame: () => {}, onHover: () => {}, onReady: () => { window.__ready = true; }, onError: () => { window.__failed = true; },
      });
    }, { chron, t });
    for (let i = 0; i < 600 && !(await page.evaluate(() => window.__ready || window.__failed)); i++) { await page.evaluate(() => window.__vt.step(16)); await page.waitForTimeout(50); }
    if (!(await page.evaluate(() => window.__ready))) throw new Error('the engine did not load');
    const { starts, durs } = await page.evaluate((inset) => { const e = window.__e; e.setInset(inset); e.setAvoid([]); e.setOverview(false); e.resize(); return { starts: e.starts, durs: e.durs }; }, spec.inset);
    const idx = Object.fromEntries(chron.stops.map((s, i) => [s.id, i]));
    // the story's clock: a stop's start, or a voyage run from one fraction of it to another
    const storyAt = (tau) => {
      let cur = spec.story[0];
      for (const st of spec.story) if (st.at <= tau + 1e-9) cur = st;
      const i = idx[cur.stop];
      if (!cur.run) return starts[i] + 0.001;
      const u = clamp((tau - cur.at) / cur.for, 0, 1);
      return starts[i] + durs[i] * (cur.run[0] + (cur.run[1] - cur.run[0]) * u);
    };
    const tauOf = (f) => f / 30 - spec.t0;
    for (let i = 0; i < 120; i++) await page.evaluate(({ c, s }) => { window.__e.__film(c, s); window.__vt.step(16); }, { c: spec.cam(tauOf(spec.first)), s: storyAt(tauOf(spec.first)) });
    const rows = [];
    let prev = tauOf(spec.first - 1);
    for (let f = spec.first; f < spec.end; f++) {
      const tau = tauOf(f), c = spec.cam(tau), s = storyAt(tau);
      const info = await page.evaluate(({ c, s, dt }) => { const e = window.__e; e.__film(c, s); window.__vt.step(dt); e.__film(c, s); window.__vt.step(1); return { R0: e.__R0(), a: e.__avail() }; }, { c, s, dt: (tau - prev) * 1000 - 1 });
      prev = tau;
      // where each named place falls: the orthographic projection the engine uses (d3 geoOrthographic)
      const R = info.R0 * c.k, rad = Math.PI / 180, l0 = c.lon * rad, p0 = c.lat * rad;
      const row = { f };
      for (const [k, [lon, lat]] of Object.entries(spec.pins)) {
        const l = lon * rad, p = lat * rad;
        const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
        const x = R * Math.cos(p) * Math.sin(l - l0), y = R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0));
        row[k] = [Math.round((info.a.cx + x) * 10) / 10, Math.round((info.a.cy - y) * 10) / 10, Math.round(cosc * 1000) / 1000];
      }
      rows.push(row);
      for (let tries = 0; ; tries++) {
        try { await page.screenshot({ path: path.join(out, `${spec.prefix}_${String(f).padStart(4, '0')}.png`), timeout: 90000 }); break; } catch (err) { if (tries > 3) throw err; }
      }
    }
    fs.writeFileSync(path.join(out, spec.json), JSON.stringify({ first: spec.first, rows }));
  } finally { await browser.close(); }
}

if (mode === 'archive') archive();
else if (mode === 'globe') await render(OPENING);
else if (mode === 'atlas') {
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'film/reel/assets/atlas/atlas-plan.json'), 'utf8'));
  const cam = keyframed(plan.camera);
  await render({ first: plan.first, end: plan.end, t0: plan.a0, inset: { l: 0, r: 0, t: 0, b: 0 }, prefix: 't', json: 'pins.json', story: plan.story, cam, pins: plan.pins });
} else throw new Error('mode: globe, atlas or archive');
