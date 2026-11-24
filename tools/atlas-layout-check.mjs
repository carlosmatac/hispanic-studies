#!/usr/bin/env node
/* The Atlas's layout check (issue #104): nothing that floats over the globe may
   cover another floating thing or leave the window.

   It opens /[lang]/atlas at every viewport below, in English and Spanish, in a
   few states (the welcome; a stop with the card open and closed; the layers;
   the click-for-info popover
   panel; the index), measures the bounding box of every fixed piece of the
   interface (the cartouche, the legend, the rail, the time bar, the card, the
   explainer, the scale, the panels) and fails when two of them intersect, when
   one sticks out of the app's window, when the card's close button is not
   fully visible, or when the page scrolls sideways.

   Playwright is not a dependency of the site. Run it with any Playwright:

     PLAYWRIGHT=/path/to/node_modules/playwright-core node tools/atlas-layout-check.mjs http://localhost:3108 [--shots dir] [--channel msedge]

   It prints one line per viewport and state, and a summary; the exit code is
   the number of failures (capped at 1). */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT || 'playwright-core');

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) || 'http://localhost:3108').replace(/\/$/, '');
const shotsAt = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : '';
const channel = args.includes('--channel') ? args[args.indexOf('--channel') + 1] : 'msedge';
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const langs = args.includes('--lang') ? [args[args.indexOf('--lang') + 1]] : ['en', 'es'];

// width x height (CSS pixels) and the device scale: browser zoom at 125% on a
// 1920 x 1080 or a 1366 x 768 screen is a smaller CSS viewport at 1.25
const VIEWPORTS = [
  ['1280x720', 1280, 720, 1], ['1366x768', 1366, 768, 1], ['1440x900', 1440, 900, 1], ['1536x864', 1536, 864, 1],
  ['1680x1050', 1680, 1050, 1], ['1841x841', 1841, 841, 1], ['1920x1080', 1920, 1080, 1], ['2560x1440', 2560, 1440, 1],
  ['1024x768', 1024, 768, 1], ['768x1024', 768, 1024, 2], ['390x844', 390, 844, 3],
  ['1920x1080@125%', 1536, 864, 1.25], ['1366x768@125%', 1093, 614, 1.25],
].filter((v) => !only || v[0] === only);

// the fixed pieces, by selector; panels are measured only when open
const PIECES = {
  now: '.atlas__now', key: '.atlas__key', keyChip: '.atlas__key-chip', rail: '.atlas__rail', bar: '.atlas__bar', card: '.atlas__card',
  callout: '.atlas__callout', scale: '.atlas__scale', layers: '.atlas__drawer--layers', index: '.atlas__places', welcome: '.atlas__welcome',
  info: '.atlas__info',
};

async function boxes(page) {
  return page.evaluate((pieces) => {
    const out = {};
    const app = document.querySelector('.atlas-app')?.getBoundingClientRect();
    for (const [k, sel] of Object.entries(pieces)) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0 || el.closest('[hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out[k] = [r.left, r.top, r.right, r.bottom];
    }
    const x = document.querySelector('.atlas__card:not([hidden]) .atlas__x')?.getBoundingClientRect();
    return {
      boxes: out,
      app: app ? [app.left, app.top, app.right, app.bottom] : null,
      x: x ? [x.left, x.top, x.right, x.bottom] : null,
      sideways: document.scrollingElement.scrollWidth - window.innerWidth,
      win: [window.innerWidth, window.innerHeight],
    };
  }, PIECES);
}

const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

function judge(m) {
  const bad = [];
  const keys = Object.keys(m.boxes);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    const area = inter(m.boxes[a], m.boxes[b]);
    if (area > 1) bad.push(`${a}×${b} overlap ${Math.round(area)}px²`);
  }
  if (m.app) for (const k of keys) {
    const r = m.boxes[k], A = m.app;
    if (r[0] < A[0] - 0.5 || r[1] < A[1] - 0.5 || r[2] > A[2] + 0.5 || r[3] > A[3] + 0.5) bad.push(`${k} outside the window [${r.map(Math.round)}] vs [${A.map(Math.round)}]`);
  }
  if (m.x && (m.x[0] < 0 || m.x[1] < 0 || m.x[2] > m.win[0] || m.x[3] > m.win[1])) bad.push('the card’s × is clipped');
  if (m.sideways > 0) bad.push(`the page scrolls sideways by ${m.sideways}px`);
  return bad;
}

const settle = (page, ms = 700) => page.waitForTimeout(ms);

async function run() {
  const browser = await pw.chromium.launch({ channel });
  let failures = 0, checks = 0;
  const rows = [];
  for (const lang of langs) {
    for (const [name, w, h, dpr] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: 'reduce', isMobile: w < 700, hasTouch: w < 1000 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(`${base}/${lang}/atlas`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.atlas__stage.is-ready', { timeout: 30000 });
      await settle(page);
      const states = [];
      const measure = async (state) => {
        await settle(page);
        const m = await boxes(page);
        const bad = judge(m);
        checks++;
        if (bad.length) failures++;
        states.push({ state, bad, pieces: Object.keys(m.boxes) });
        if (shotsAt) await page.screenshot({ path: path.join(shotsAt, `layout-${lang}-${name.replace('%', 'pc')}-${state}.png`) });
      };
      await measure('welcome');
      for (const [stop, label] of [['A136', '1410'], ['A104', '1536']]) {
        await page.evaluate((id) => { location.hash = `#on-map-${id}`; }, stop);
        await settle(page, 900);
        const open = await page.$('.atlas__open');
        if (open) { await open.click(); await settle(page); }
        await measure(`${label}-card`);
        const x = await page.$('.atlas__card:not([hidden]) .atlas__x');
        if (x) { await x.click(); await measure(`${label}-nocard`); }
      }
      // the layers panel, with the card open again where there is room for both
      const open = await page.$('.atlas__open');
      if (open && w >= 1000) { await open.click(); await settle(page); }
      await page.click('.atlas__rail .atlas__inst:nth-child(2)');
      await measure('layers');
      // the click-for-info popover, opened from the list of realms in Layers
      const chip = await page.$('.atlas__chips--realms button');
      if (chip) { await chip.click(); await settle(page, 1200); await measure('info'); await page.keyboard.press('Escape'); }
      else await page.keyboard.press('Escape');
      await page.click('.atlas__rail .atlas__inst:nth-child(1)');
      await measure('index');
      await page.keyboard.press('Escape');
      const errs = errors.filter((e) => !/Download the React DevTools|HMR|Fast Refresh/.test(e));
      if (errs.length) { failures++; states.push({ state: 'console', bad: errs.slice(0, 3), pieces: [] }); }
      for (const s of states) {
        rows.push(`${s.bad.length ? 'FAIL' : 'ok  '}  ${lang}  ${name.padEnd(15)} ${s.state.padEnd(12)} ${s.bad.length ? s.bad.join('; ') : s.pieces.join(' ')}`);
        console.log(rows[rows.length - 1]);
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n${checks} layouts measured, ${failures} with a problem.`);
  if (shotsAt) fs.writeFileSync(path.join(shotsAt, 'layout-check.txt'), rows.join('\n') + `\n\n${checks} layouts measured, ${failures} with a problem.\n`);
  process.exit(failures ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(2); });
