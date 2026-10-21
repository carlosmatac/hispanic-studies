/* ==========================================================================
   P · Tornaviaje — page wiring.

   One frame loop drives everything that moves: the corridor, the lamp, the
   plaques, the meter, the drifting book rows and the nav ring. Two loops
   would mean two clocks and two opinions about where the page is.
   ========================================================================== */

import { CHANNELS, STATS, SHORTS, VIDEOS, ESSAYS, shortThumb, shortUrl } from '../shared/content.js';
import { mountThemeSwitcher } from '../shared/theme.js';
import { drawMap, loadMapData } from '../o-atlas/map.js';
import { REDUCED, observeReveals, flushWatchers } from '../o-atlas/motion.js';
import { buildCorridor, sectionProgress, smoothed } from './corridor.js';

const DATA = '../shared/data';
const ART = '../../assets/art/corridor';
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* How many of the sixty milestones you actually fly past. Short on purpose:
   the corridor used to be the hero and blocked everything under it. The rail
   reaches all sixty. */
const WAYPOINTS = 14;

/* ==========================================================================
   i18n
   ========================================================================== */

const STRINGS = {
  en: {},
  es: {
    'nav.watch': 'Ver', 'nav.corridor': 'El corredor', 'nav.world': 'El mundo',
    'nav.canon': 'Canon', 'nav.books': 'Libros', 'nav.read': 'Leer', 'nav.about': 'Nosotros',

    'hero.kicker': 'Institute for Hispano Studies · De Indiis Editions',
    'hero.h1': 'Cuatro continentes. Dos lenguas.<br><em>Una discusión que no terminó.</em>',
    'hero.lede': 'Un think tank sobre la civilización hispano-católica y la geopolítica panibérica — y la editorial que traduce su canon. Vídeo corto, ensayo largo, y los libros que casi nunca llegaron al inglés.',
    'hero.cta1': 'Empieza por los vídeos',
    'hero.cta2': 'Quiero el folleto gratuito',
    'hero.f1': 'autores en el corpus',
    'hero.f2': 'textos canónicos',
    'hero.f3': 'hitos fechados',
    'hero.f4': 'estados, lengua oficial',
    'hero.cue': 'Baja',

    'voy.kicker': 'El corredor · de hacia 722 a 2026',
    'voy.h': 'Recorre la cronología.',
    'voy.sub': 'Sesenta hitos fechados en siete capítulos, colgados en las paredes. Desplázate para avanzar por el pasillo; cada parada lleva su tratamiento cartográfico y su fuente. Usa el raíl para saltar.',
    'voy.treatment': 'Cómo lo dibuja el mapa',

    'world.kicker': 'Lo que salió de aquello',
    'world.h': 'Veintinueve estados lo siguen hablando.',
    'world.sub': 'El español y el portugués son oficiales en cuatro continentes, y las rutas que los unieron funcionaron trescientos años.',
    'world.cart': 'El mundo<br>iberófono',
    'world.c1': 'Estados, lengua oficial',
    'world.c2': 'Territorios de presencia',
    'world.c3': 'Rutas marítimas dibujadas',
    'world.c4': 'La ruptura',
    'world.hint': 'Señala un país.',
    'world.cap': 'Proyección equivalente · geometría de Natural Earth · rutas según la Carrera de Indias, el Galeón de Manila y la Carreira da Índia',

    'canon.kicker': 'El canon · cincuenta textos',
    'canon.h': 'Una discusión viva, no una lista de lecturas.',
    'canon.sub': 'Situados según el tipo de unidad que presupone cada uno, y unidos por lo que de verdad los conecta. Cada línea es una afirmación sobre la evidencia: continua donde la recepción está documentada, discontinua donde solo es probable, roja donde ambos se enfrentaron. Pincha en cualquier cosa para leerla.',
    'canon.fine': 'Clasificación adaptada de Gustavo Bueno, «España y América» (2001). Las tradiciones portuguesa, brasileña, lusoafricana, asiática, indígena, del Atlántico negro, ecuatoguineana y filipina siguen siendo históricamente distintas. Su presencia aquí no implica su adhesión a un proyecto hispánico o iberófono.',

    'books.kicker': 'De Indiis Editions',
    'books.h': 'Casi nada de esto se tradujo nunca.',
    'books.fine': 'Los órdenes de prioridad son recomendaciones editoriales del programa de adquisiciones, no anuncios de publicación. No se listan los prologuistas ni los editores propuestos: son investigadores que no han aceptado participar. Las cubiertas son provisionales.',

    'watch.kicker': 'Ver',
    'watch.h': 'Trescientos años, recortados del relato.',
    'watch.sub': 'Vídeo corto en YouTube, Instagram, X y TikTok. Los mismos cortes en todas partes, porque el argumento viaja mejor que la plataforma.',
    'watch.shorts': 'Cortos',
    'watch.long': 'Formato largo',

    'about.kicker': 'La misión',
    'about.h': 'Una tradición olvidada, no refutada.',
    'about.p1': 'El Instituto estudia y defiende la civilización hispánica: su historia, su herencia católica, su mestizaje y sus dos lenguas. De Indiis Editions traduce y reedita el canon de esa discusión.',
    'about.p2': 'La tesis no es que esta tradición fuera derrotada. Es que casi nunca se tradujo, y un argumento que no puedes leer es un argumento que no puedes responder.',

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

  const way = $('#way');
  const fill = $('#meter-fill');
  const meter = $('.meter__track');
  const lamp = $('#lamp');
  const ring = $('#ring');
  const capsule = $('#capsule');

  // one tick per milestone, the stops drawn taller; clicking scrolls the hall
  const railX = (y) => (y <= 1800 ? ((y - 722) / 1078) * 38 : 41 + ((y - 1800) / 226) * 59);
  const stops = new Set(ways);
  const ticks = items.map((m, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tick';
    b.style.left = `${railX(m.year)}%`;
    b.dataset.stop = String(stops.has(n));
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `${m.date.en} — ${m.title.en}`);
    b.addEventListener('click', () => {
      // jump to the nearest stop on the hall
      let k = 0;
      ways.forEach((v, j) => { if (v <= n) k = j; });
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const target = window.scrollY + r.top + span * ((k + 0.5) / ways.length);
      window.scrollTo({ top: target, behavior: REDUCED ? 'auto' : 'smooth' });
    });
    meter.appendChild(b);
    return b;
  });

  let shown = -1;

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

    const idx = clamp(Math.floor(p * ways.length), 0, ways.length - 1);
    if (idx !== shown) {
      shown = idx;
      render(ways[idx], idx);
      ticks.forEach((b, k) => b.setAttribute('aria-current', String(k === ways[idx])));
    }

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

/* ==========================================================================
   THE CHART — the same map as O's hero, hung and lit in this room
   ========================================================================== */

const TIER_WORD = {
  en: { emersa: 'Spanish or Portuguese official', submersa: 'Iberophone presence, not official' },
  es: { emersa: 'español o portugués oficial', submersa: 'presencia iberófona, sin oficialidad' },
};
const CORPUS_WORD = {
  en: (n) => `${n} ${n === 1 ? 'author' : 'authors'}`,
  es: (n) => `${n} ${n === 1 ? 'autor' : 'autores'}`,
};

function renderReadout(rec) {
  const box = $('#readout');
  if (!rec) {
    const hint = lang === 'es' ? 'Señala un país.' : 'Point at a country.';
    box.innerHTML = `<span class="readout__hint">${hint}</span>`;
    return;
  }
  const corpus = lang === 'es' ? 'En el corpus' : 'In the corpus';
  box.innerHTML = `<strong>${rec.name[lang] || rec.name.en}</strong>
    <span class="readout__hint">${TIER_WORD[lang][rec.tier]}</span>
    <dl><dt>${corpus}</dt><dd>${CORPUS_WORD[lang](rec.authors)}</dd></dl>`;
}

/* ==========================================================================
   HERO WALL — the whole hang at once
   ========================================================================== */

function setupWall(images) {
  const wall = $('#wall');
  // four rows, drifting at different speeds, so the hang fills the frame
  const rows = 4;
  const per = Math.ceil(images.length / rows);
  wall.innerHTML = '';
  for (let r = 0; r < rows; r += 1) {
    const slice = images.slice(r * per, (r + 1) * per);
    const row = document.createElement('div');
    row.className = 'wall__row';
    // doubled so the slide loops without a seam
    row.innerHTML = [...slice, ...slice]
      .map((src) => `<img src="${src}" alt="" loading="lazy" decoding="async">`).join('');
    wall.appendChild(row);
  }
}

/* ==========================================================================
   WATCH — the way most people arrive, so it is not a list
   ========================================================================== */

/* Follower counts from docs/research/context.md. The clips are cross-posted to
   every platform, which is why one set of thumbnails stands for all of them. */
/* We have real numbers for four of the six. The other two show the platform
   instead of a dash: a placeholder figure on a page about sourcing is the one
   thing that should never appear. */
const REACH = { YouTube: '13.5K', Instagram: '19K', X: '22K', Substack: '587' };
const REACH_LABEL = {
  en: { subs: 'subscribers', followers: 'followers', readers: 'readers', members: 'members' },
  es: { subs: 'suscriptores', followers: 'seguidores', readers: 'lectores', members: 'miembros' },
};
const REACH_KIND = {
  YouTube: 'subs', Instagram: 'followers', X: 'followers',
  TikTok: 'followers', Substack: 'readers', Patreon: 'members',
};

function setupWatch() {
  const renderChannels = () => {
    const l = REACH_LABEL[lang];
    const visit = lang === 'es' ? 'ver el perfil' : 'visit the profile';
    $('#channels').innerHTML = CHANNELS.map((c) => {
      const n = REACH[c.name];
      return `<a class="channel${n ? '' : ' channel--plain'}" href="${c.url}" target="_blank" rel="noopener">
        ${n ? `<b>${n}</b><span>${c.name}</span><i>${l[REACH_KIND[c.name]] || ''}</i>`
          : `<span class="channel__name">${c.name}</span><i>${visit} →</i>`}
      </a>`;
    }).join('');
  };

  // the clips are cut vertical, so they are shown vertical
  $('#shorts').innerHTML = SHORTS.map((v) => `
    <a class="short" href="${shortUrl(v.id)}" target="_blank" rel="noopener">
      <span class="short__frame">
        <img src="${shortThumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        <span class="short__views">${v.views}</span>
      </span>
      <h3>${v.title}</h3>
    </a>`).join('');

  $('#longs').innerHTML = VIDEOS.slice(0, 3).map((v) => `
    <a class="long" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
      <span class="long__frame">
        <img src="${shortThumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        <span class="long__play"><span>▶</span></span>
      </span>
      <h3>${v.title}</h3>
    </a>`).join('');

  document.addEventListener('langchange', renderChannels);
  renderChannels();
}

function setupRead() {
  const render = () => {
    const f = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' });
    $('#essays').innerHTML = ESSAYS.slice(0, 6).map((e) => `
      <a class="essay" href="${e.url}" target="_blank" rel="noopener">
        <span class="essay__date">${f.format(new Date(e.date))}</span>
        <h3>${e.title}</h3>
        <p class="essay__by">${e.author}${e.translator
          ? ` · ${lang === 'es' ? 'trad.' : 'trans.'} ${e.translator}` : ''}</p>
      </a>`).join('');
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
  setupRead();
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
  // they are in the hero, so they are on screen from the first frame
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

  // the full plate: labels, sea names, the rose and the routes, as in O
  drawMap($('#world-map'), mapData, {
    animate: true, labels: true, rose: true, onPick: renderReadout,
  });
  renderReadout(null);
  $('#c-states').textContent = all.filter((c) => c.tier === 'emersa').length;
  $('#c-presence').textContent = all.filter((c) => c.tier === 'submersa').length;
  $('#c-routes').textContent = mapData.routes.length;
  document.addEventListener('langchange', () => renderReadout(null));

  setupWall(images);
  const voyage = setupVoyage(milestones, images);
  /* The canon is a graph now. It pulls React and React Flow from pinned CDN
     modules, so the module is imported dynamically and mounted on its own: a
     static import would mean an unreachable CDN takes the whole page down
     with it, which is exactly what it did the first time. */
  import('./canon-graph.js')
    .then(({ mountCanonGraph }) =>
      mountCanonGraph($('#canon-chart'), { dataUrl: `${DATA}/canon-graph.json`, lang }))
    .then(({ render }) => document.addEventListener('langchange', () => render(lang)))
    .catch((err) => {
      console.error('canon graph:', err);
      $('#canon-chart').innerHTML =
        '<p class="cg-fail">The canon graph could not be loaded. Open the page through <code>make serve</code>.</p>';
    });
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
