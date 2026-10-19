/* ==========================================================================
   P · Tornaviaje — page wiring.

   One frame loop drives everything that moves: the corridor, the lamp, the
   plaques, the meter, the drifting book rows and the nav ring. Two loops
   would mean two clocks and two opinions about where the page is.
   ========================================================================== */

import { CHANNELS, SHORTS, VIDEOS, shortThumb, shortUrl } from '../shared/content.js';
import { mountThemeSwitcher } from '../shared/theme.js';
import { drawMap, loadMapData } from '../o-atlas/map.js';
import { REDUCED, observeReveals, flushWatchers } from '../o-atlas/motion.js';
import { buildCorridor, sectionProgress, smoothed } from './corridor.js';

const DATA = '../shared/data';
const ART = '../../assets/art/corridor';
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* How many of the sixty milestones you actually fly past. The rest are in the
   index below: a hallway you can never reach the end of is a worse experience
   than a hallway with a door at the end. */
const WAYPOINTS = 24;

/* ==========================================================================
   i18n
   ========================================================================== */

const STRINGS = {
  en: {},
  es: {
    'nav.atlas': 'El corredor', 'nav.canon': 'Canon', 'nav.books': 'Libros', 'nav.watch': 'Ver',

    'hero.kicker': 'Institute for Hispano Studies · De Indiis Editions',
    'hero.h1': 'El <em>tornaviaje</em><br>es la vuelta.',
    'hero.lede': 'Dos coronas ibéricas construyeron un mundo y después perdieron su mapa. Todo lo que se discutió desde entonces — mestizaje, fe, lengua — sigue aquí, colgado en las paredes. Baja y míralo.',
    'hero.cue': 'Desplázate para entrar en el corredor',

    'voy.treatment': 'Cómo lo dibuja el mapa',

    'idx.kicker': 'La cronología completa',
    'idx.h': 'Sesenta hitos, siete capítulos.',

    'world.kicker': 'Lo que salió de aquello',
    'world.h': 'Veintinueve estados lo siguen hablando.',
    'world.authors': 'autores en el corpus',
    'world.texts': 'textos canónicos',
    'world.milestones': 'hitos fechados',
    'world.states': 'estados, lengua oficial',

    'canon.kicker': 'El canon · cincuenta textos',
    'canon.h': 'Recórrelo con la vista.',
    'canon.sub': 'Doscientos años de gente discutiendo lo mismo. Monárquicos y marxistas, liberales y nacionalistas — y los que argumentaron <em>contra</em> la unidad hispánica, señalados como tales.',
    'canon.fine': 'Clasificación adaptada de Gustavo Bueno, «España y América» (2001). Las tradiciones portuguesa, brasileña, lusoafricana, asiática, indígena, del Atlántico negro, ecuatoguineana y filipina siguen siendo históricamente distintas. Su presencia aquí no implica su adhesión a un proyecto hispánico o iberófono.',

    'books.kicker': 'De Indiis Editions',
    'books.h': 'Casi nada de esto se tradujo nunca.',
    'books.fine': 'Los órdenes de prioridad son recomendaciones editoriales del programa de adquisiciones, no anuncios de publicación. No se listan los prologuistas ni los editores propuestos: son investigadores que no han aceptado participar. Las cubiertas son provisionales.',

    'watch.kicker': 'Ver · por donde llega casi todo el mundo',
    'watch.h': 'Trescientos años, recortados del relato.',

    'cta.kicker': 'De Indiis Editions · gratis',
    'cta.h': 'Llévate <em>la discusión entera</em><br>a casa.',
    'cta.lede': 'Doscientos años de teoría y praxis en un folleto: de dónde vienen estas ideas, quién las discutió y por dónde empezar a leer.',
    'cta.ph': 'tu@correo.com',
    'cta.btn': 'Envíamelo',
    'cta.ok': 'Confírmalo en tu correo. (Maqueta: no se envía nada.)',
    'cta.discord': 'Reconquista Syndicate · Discord',

    'foot.motto': 'Veritas prius pace',
    'foot.blurb': 'Un think tank sobre la civilización hispano-católica y la geopolítica panibérica, y la editorial que traduce su canon.',
    'foot.explore': 'Explorar', 'foot.channels': 'Canales', 'foot.look': 'Registro',
    'foot.world': 'El mundo',
    'foot.note': 'Tres registros, un mismo instituto.',
    'foot.legal': 'Hispano Studies LLC',
    'foot.draft': 'Borrador de la dirección P · Tornaviaje · octubre de 2026',
  },
};

let lang = 'en';

function captureEnglish() {
  for (const n of document.querySelectorAll('[data-i18n]')) STRINGS.en[n.dataset.i18n] = n.innerHTML;
  for (const n of document.querySelectorAll('[data-i18n-html]')) STRINGS.en[n.dataset.i18nHtml] = n.innerHTML;
  for (const n of document.querySelectorAll('[data-i18n-attr]')) {
    const [a, k] = n.dataset.i18nAttr.split(':');
    STRINGS.en[k] = n.getAttribute(a);
  }
}

function applyLang(next, push = true) {
  lang = next;
  document.documentElement.lang = next;
  if (push) {
    const url = new URL(window.location);
    if (next === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }
  const dict = STRINGS[next];
  for (const n of document.querySelectorAll('[data-i18n]')) {
    if (dict[n.dataset.i18n] !== undefined) n.innerHTML = dict[n.dataset.i18n];
  }
  for (const n of document.querySelectorAll('[data-i18n-html]')) {
    if (dict[n.dataset.i18nHtml] !== undefined) n.innerHTML = dict[n.dataset.i18nHtml];
  }
  for (const n of document.querySelectorAll('[data-i18n-attr]')) {
    const [a, k] = n.dataset.i18nAttr.split(':');
    if (dict[k] !== undefined) n.setAttribute(a, dict[k]);
  }
  for (const b of document.querySelectorAll('.lang button')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === next));
  }
  document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

/* ==========================================================================
   THE VOYAGE
   ========================================================================== */

function pickWaypoints(items, n) {
  // every chapter is entered, then the rest are spread evenly so no stretch
  // of the hall is left without a year to read
  const opens = items.map((m, i) => (i === 0 || items[i - 1].chapter !== m.chapter ? i : -1))
    .filter((i) => i >= 0);
  const out = new Set(opens);
  const step = items.length / (n - opens.length + 1);
  for (let k = 1; out.size < n && k < items.length; k += 1) {
    out.add(Math.min(items.length - 1, Math.round(k * step)));
  }
  return [...out].sort((a, b) => a - b).slice(0, n);
}

function setupVoyage(doc, images) {
  const section = $('#voyage');
  const items = doc.milestones;
  const refs = doc.references;
  const ways = pickWaypoints(items, WAYPOINTS);

  const steps = $('#voyage-steps');
  // one screen per waypoint, plus two: one to hold the hero still at the
  // mouth, one to land on at the end
  const stepCount = ways.length + 2;
  for (let i = 0; i < stepCount; i += 1) {
    const d = document.createElement('div');
    d.className = 'voyage__step';
    steps.appendChild(d);
  }
  section.style.setProperty('--steps', stepCount);

  const hall = buildCorridor($('#corridor'), { images, planes: 76 });
  const progress = sectionProgress(section);
  const z = smoothed(0, REDUCED ? 1 : 0.09);

  const hero = $('#hero');
  const way = $('#way');
  const fill = $('#meter-fill');
  const meter = $('.meter__track');
  const lamp = $('#lamp');
  const ring = $('#ring');
  const capsule = $('#capsule');

  let shown = -1;
  const HERO_END = 0.07;

  function render(i, n) {
    const m = items[i];
    const L = lang;
    $('#w-n').textContent = `${String(n + 1).padStart(2, '0')} / ${ways.length}`;
    $('#w-chapter').textContent = doc.chapters[m.chapter][L] || doc.chapters[m.chapter].en;
    $('#w-year').textContent = m.date[L] || m.date.en;
    $('#w-title').textContent = m.title[L] || m.title.en;
    $('#w-body').textContent = m.body[L] || m.body.en;
    $('#w-map').textContent = m.map[L] || m.map.en;
    $('#w-src').textContent = m.sources
      .map((k) => (refs[k] ? `${k} · ${refs[k][L] || refs[k].en}` : k)).join(' · ');
  }

  function paint() {
    const p = progress();

    z.set(p * hall.depth);
    hall.travel(z.step());

    // the hero holds at the mouth, then hands over
    const heroOut = clamp((p - HERO_END * 0.35) / (HERO_END * 0.65), 0, 1);
    hero.style.setProperty('--o', (1 - heroOut).toFixed(3));
    hero.style.visibility = heroOut >= 1 ? 'hidden' : 'visible';
    way.style.setProperty('--o', heroOut.toFixed(3));
    way.style.visibility = heroOut <= 0.02 ? 'hidden' : 'visible';

    const wp = clamp((p - HERO_END) / (1 - HERO_END - 0.05), 0, 1);
    const idx = clamp(Math.floor(wp * ways.length), 0, ways.length - 1);
    if (idx !== shown) { shown = idx; render(ways[idx], idx); }

    // the meter reads the chronology, not the scrollbar: a broken axis, the
    // way the source document itself draws time
    const yr = items[ways[idx]].year;
    const t = clamp(yr <= 1800 ? ((yr - 722) / 1078) * 0.38 : 0.41 + ((yr - 1800) / 226) * 0.59, 0, 1);
    fill.style.width = `${(t * 100).toFixed(1)}%`;
    meter.style.setProperty('--p', `${(t * 100).toFixed(1)}%`);

  }

  function chrome() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const d = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
    capsule.classList.toggle('is-tight', window.scrollY > window.innerHeight * 0.6);
    ring.style.strokeDashoffset = (107 * (1 - d)).toFixed(1);
    // one light, drifting through one room, for the whole document
    lamp.style.setProperty('--lx', `${(42 + Math.sin(d * 7.4) * 26).toFixed(1)}%`);
    lamp.style.setProperty('--ly', `${(22 + Math.cos(d * 4.1) * 16 + d * 26).toFixed(1)}%`);
  }

  document.addEventListener('langchange', () => { if (shown >= 0) render(ways[shown], shown); });
  render(ways[0], 0);

  return { paint, chrome };
}

/* ==========================================================================
   THE REST
   ========================================================================== */

const CHAPTER_INK = ['#8a7a5e', '#4e6f7d', '#a8502f', '#6e7f63', '#7b2230', '#5a5680', '#ad8220'];

function setupChronology(doc) {
  const render = () => {
    $('#chron').innerHTML = doc.milestones.map((m) => `
      <li style="--ch:${CHAPTER_INK[m.chapter]}">
        <b>${m.date[lang] || m.date.en}</b>
        <span>${m.title[lang] || m.title.en}</span>
      </li>`).join('');
  };
  document.addEventListener('langchange', render);
  render();
}

const BAND = {
  A1: 'Nationalist', A2: 'Inter-nationalist', B1: 'American whole', 'B2.4': 'Pan-American',
  'B2.5': 'Occidentalist', 'B2.6': 'Hispanic community', 'B2.7': 'Lusophone community',
  'B2.8': 'Iberian / Iberophone',
};
const PL = {
  en: { pos: 'Position', unity: 'Unity', op: 'Operation', reg: 'Region', ct: 'Argued against Hispanic unity' },
  es: { pos: 'Posición', unity: 'Unidad', op: 'Operación', reg: 'Región', ct: 'Argumentó contra la unidad hispánica' },
};

function setupCanon(canon) {
  const list = $('#hoverlist');
  const plate = $('#canon-plate');
  const texts = [...canon.texts].sort((a, b) => a.year - b.year);

  const show = (t, li) => {
    for (const el of list.querySelectorAll('.is-on')) el.classList.remove('is-on');
    if (li) li.classList.add('is-on');
    const l = PL[lang];
    plate.innerHTML = `
      <p class="pl-t">${t.title}</p>
      <p class="pl-a">${t.author}${t.life ? ` · ${t.life}` : ''}</p>
      <dl>
        <dt>${l.pos}</dt><dd>${t.bueno} · ${BAND[t.bueno] || ''}</dd>
        <dt>${l.unity}</dt><dd>${t.unity}</dd>
        <dt>${l.op}</dt><dd>${t.operations.join(', ') || '—'}</dd>
        <dt>${l.reg}</dt><dd>${t.region || '—'}</dd>
      </dl>
      ${t.role === 'counter-tradition' ? `<p class="pl-ct">${l.ct}</p>` : ''}`;
  };

  const render = () => {
    list.innerHTML = texts.map((t, i) => `
      <li${t.role === 'counter-tradition' ? ' class="is-ct"' : ''}>
        <button type="button" data-i="${i}">
          <span class="yr">${t.year}</span>
          <span class="t">${t.title.replace(/\s*\(\d{4}\)\s*$/, '')}</span>
          <span class="cls">${t.bueno}</span>
        </button>
      </li>`).join('');
    for (const b of list.querySelectorAll('button')) {
      const t = texts[+b.dataset.i];
      const li = b.closest('li');
      b.addEventListener('pointerenter', () => show(t, li));
      b.addEventListener('focus', () => show(t, li));
      b.addEventListener('click', () => show(t, li));
    }
    show(texts[0], list.querySelector('li'));
  };
  document.addEventListener('langchange', render);
  render();
}

function setupBooks(doc) {
  const a = $('#drift-a');
  const b = $('#drift-b');
  const card = (x) => `
    <article class="tome">
      <div class="tome__spine"><span>${x.source_year ?? ''}</span></div>
      <h3>${x.title}</h3>
      <p>${x.author}</p>
    </article>`;
  const render = () => {
    // doubled, so a row can drift without running out of books
    a.innerHTML = doc.books.slice(0, 10).map(card).join('').repeat(2);
    b.innerHTML = doc.books.slice(10, 20).map(card).join('').repeat(2);
  };
  document.addEventListener('langchange', render);
  render();

  return (p) => {
    const span = a.scrollWidth / 2;
    a.style.transform = `translateX(${(-p * span * 0.5).toFixed(1)}px)`;
    b.style.transform = `translateX(${(-span * 0.5 + p * span * 0.5).toFixed(1)}px)`;
  };
}

function setupWatch() {
  const all = [...SHORTS.map((s) => ({ ...s, short: true })), ...VIDEOS].slice(0, 6);
  $('#vids').innerHTML = all.map((v) => `
    <a class="vid" href="${v.short ? shortUrl(v.id) : `https://www.youtube.com/watch?v=${v.id}`}" target="_blank" rel="noopener">
      <span class="vid__thumb">
        <img src="${shortThumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        ${v.views ? `<span class="vid__views">${v.views}</span>` : ''}
      </span>
      <h3>${v.title}</h3>
    </a>`).join('');
}

function setupFooter() {
  $('#foot-channels').innerHTML = CHANNELS.map((c) =>
    `<li><a href="${c.url}" target="_blank" rel="noopener">${c.name}</a></li>`).join('');
  const words = [...CHANNELS.map((c) => c.name), 'Reconquista Syndicate', 'De Indiis Editions', 'Veritas prius pace'];
  const row = words.map((w) => `<span>${w}</span>`).join('');
  $('#foot-ticker').innerHTML = row + row;
}

/* ==========================================================================
   BOOT
   ========================================================================== */

async function boot() {
  captureEnglish();
  for (const b of document.querySelectorAll('.lang button')) {
    b.addEventListener('click', () => applyLang(b.dataset.lang));
  }
  mountThemeSwitcher($('#themer'), { lang: () => lang, compact: true });
  mountThemeSwitcher($('#themer-foot'), { lang: () => lang });
  $('#signup').addEventListener('submit', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('is-done');
  });

  setupWatch();
  setupFooter();

  const [mapData, milestones, canon, books, art] = await Promise.all([
    loadMapData(DATA),
    fetch(`${DATA}/milestones.json`).then((r) => r.json()),
    fetch(`${DATA}/canon.json`).then((r) => r.json()),
    fetch(`${DATA}/books.json`).then((r) => r.json()),
    fetch(`${ART}/manifest.json`).then((r) => r.json()).catch(() => []),
  ]);

  // the hall still has to stand up if the picture set is missing
  const images = art.length
    ? art.map((x) => `${ART}/${x.file}`)
    : ['velazquez-las-lanzas', 'velazquez-las-meninas', 'guadalupe-tilma', 'zurbaran-agnus-dei',
      'ribero-carta-universal-1529', 'florentine-codex-folio-80', 'galleon-cabrera-bueno-1734']
      .map((n) => `../../assets/art/${n}.jpg`);

  const all = [...mapData.iberophone.countries, ...mapData.iberophone.points];
  /* The tallies count from the page's own loop rather than a shared observer:
     one clock, and the figure on screen is never left mid-count. Every value
     is read off the data. */
  const tallies = [
    [$('#s-authors'), canon.corpusTotal ?? 267],
    [$('#s-texts'), canon.texts.length],
    [$('#s-milestones'), milestones.milestones.length],
    [$('#s-states'), all.filter((c) => c.tier === 'emersa').length],
  ];
  for (const [el, v] of tallies) el.textContent = REDUCED ? v : 0;
  let countFrom = REDUCED ? -1 : null;
  const paintTallies = () => {
    if (countFrom === -1) return;
    const r = tallies[0][0].getBoundingClientRect();
    if (countFrom === null) {
      if (r.top > window.innerHeight * 0.88 || r.bottom < 0) return;
      countFrom = performance.now();
    }
    const k = clamp((performance.now() - countFrom) / 1100, 0, 1);
    const e = 1 - (1 - k) ** 3;
    for (const [el, v] of tallies) el.textContent = Math.round(v * e);
    if (k >= 1) { for (const [el, v] of tallies) el.textContent = v; countFrom = -1; }
  };

  drawMap($('#world-map'), mapData, { animate: true, labels: false, rose: false });

  const voyage = setupVoyage(milestones, images);
  setupChronology(milestones);
  setupCanon(canon);
  const drift = setupBooks(books);
  const booksProgress = sectionProgress($('#books'));

  const tick = () => {
    voyage.paint();
    voyage.chrome();
    drift(booksProgress());
    paintTallies();
    // the reveals ride this loop too: one clock for everything that moves
    flushWatchers();
  };
  const loop = () => { tick(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  // a frame callback is not guaranteed to be delivered; the corridor must not
  // freeze if one is dropped
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick, { passive: true });
  tick();

  const wanted = new URL(window.location).searchParams.get('lang');
  if (wanted === 'es') applyLang('es', false);

  observeReveals();
  flushWatchers();
  window.__motionReady = true;
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('js-motion');
});
