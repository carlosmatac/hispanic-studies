/* ==========================================================================
   O · Atlas — page wiring.

   Content comes from proposals/shared/content.js (real channels, real video
   IDs, real essays) and proposals/shared/data/ (the datasets built from the
   documents Beltran handed over). Nothing on this page is invented: if a
   number is not in the data, it is not on the page.
   ========================================================================== */

import { CHANNELS, SHORTS, VIDEOS, ESSAYS, shortThumb, shortUrl } from '../shared/content.js';
import { drawMap, loadMapData } from './map.js';
import { mountThemeSwitcher } from '../shared/theme.js';
import {
  REDUCED, observeReveals, countUp, scrollSteps, scrollProgress, makeHoverCard, whenInView, flushWatchers,
} from './motion.js';

const DATA = '../shared/data';
const $ = (sel, root = document) => root.querySelector(sel);

/* ==========================================================================
   i18n — every string we author exists in both languages. Third-party
   content (video titles, essay titles) stays in its original language.
   ========================================================================== */

const STRINGS = {
  en: {},   // the HTML ships English; this table only carries the Spanish
  es: {
    'nav.atlas': 'Atlas', 'nav.canon': 'Canon', 'nav.books': 'Libros',
    'nav.watch': 'Ver', 'nav.read': 'Leer', 'nav.about': 'Nosotros',
    'nav.merch': 'Tienda', 'nav.cart': 'Cesta 0',

    'cart.title': 'El mundo<br>iberófono',
    'cart.states': 'Estados, lengua oficial',
    'cart.presence': 'Territorios de presencia',
    'cart.authors': 'Autores en el corpus',
    'cart.milestones': 'Hitos fechados',
    'cart.rupture': 'La ruptura',
    'cart.src': 'Proyección equivalente · geometría de Natural Earth · rutas según la Carrera de Indias, el Galeón de Manila y la Carreira da Índia',
    'readout.hint': 'Señala un país para leerlo.',

    'hero.eyebrow': 'Institute for Hispano Studies · De Indiis Editions',
    'hero.h1': 'Una civilización, <em>dos lenguas,</em> cuatro continentes.',
    'hero.lede': 'El español y el portugués son oficiales en veintinueve estados de cuatro continentes. Ese espacio tiene una historia, una tradición intelectual y doscientos años de discusión sobre qué es. Esta es su obra de referencia.',
    'hero.pamphlet': 'Empieza por <b>Hispanic Reunification: 200 Years of Theory and Praxis</b>, el folleto gratuito de De Indiis Editions.',
    'hero.emailLabel': 'Correo electrónico',
    'hero.emailPlaceholder': 'tu@correo.com',
    'hero.cta': 'Descargar el PDF',
    'hero.ok': 'Confírmalo en tu correo. (Maqueta: no se envía nada.)',
    'hero.consent': 'Boletín y novedades editoriales · puedes darte de baja cuando quieras',

    'pillars.eyebrow': 'Tres troncos',
    'pillars.h': 'Todo lo de aquí cuelga de uno de los tres.',
    'pillars.sub': 'Mestizaje, catolicismo y lengua. Los tres pilares son la forma en que se organizan los vídeos, los ensayos, los libros y el canon; no son un lema.',
    'pillars.mestizaje': 'Mestizaje',
    'pillars.mestizajeSub': 'Castas, transculturación, <i>La raza cósmica</i>, pensamiento indoamericano y la Leyenda Negra sobre la raza.',
    'pillars.mestizajeN': 'Colecciones: Raza, mezcla y diferencia · Pensamiento indohispánico y sus críticos — 8 títulos prioritarios',
    'pillars.catolicismo': 'Catolicismo',
    'pillars.catolicismoSub': 'Guadalupe, evangelización, la Escuela de Salamanca y el pensamiento político católico a ambos lados del Atlántico.',
    'pillars.catolicismoN': 'Colecciones: Clásicos y críticos de la Hispanidad · Teología política hispánica — 6 títulos prioritarios',
    'pillars.lengua': 'Lengua',
    'pillars.lenguaSub': 'Español y portugués, las academias, la Iberofonía y la traducción como tarea misma de la editorial.',
    'pillars.lenguaN': 'Colecciones: Pensamiento panibérico y lusófono · Continentalismo literario — 14 títulos prioritarios',

    'atlas.eyebrow': 'El Atlas · sesenta hitos, de hacia 722 a 2026',
    'atlas.h': 'Avanza y el mapa se mueve contigo.',
    'atlas.sub': 'Una sola secuencia cronológica en siete capítulos. Cada hito lleva su propio tratamiento cartográfico y su propia fuente. Un tratado, un viaje, una red cultural y un cambio real de soberanía se dibujan de forma distinta, y las propuestas se identifican como propuestas.',
    'atlas.treatment': 'Tratamiento cartográfico',
    'atlas.keys': 'desplázate, o usa las flechas del teclado',

    'canon.eyebrow': 'El canon · cincuenta textos, de 1818 a 1999',
    'canon.h': 'Una discusión viva, no una lista de lecturas.',
    'canon.sub': 'Cada texto se sitúa según el tipo de unidad que presupone. Ha habido hispanistas monárquicos y marxistas, liberales y nacionalistas; lo que importa es la discusión, y por eso los autores que argumentaron contra la unidad hispánica también están en el esquema, dibujados con el trazo roto.',
    'canon.pick': 'Señala un texto para leerlo.',
    'canon.pickSub': 'Cincuenta obras, ocho posiciones, ciento ochenta años.',
    'canon.disclaimer': 'Clasificación adaptada de Gustavo Bueno, «España y América» (2001). Las tradiciones portuguesa, brasileña, lusoafricana, asiática, indígena, del Atlántico negro, ecuatoguineana y filipina siguen siendo históricamente distintas. Su presencia en este esquema no implica su adhesión a un proyecto hispánico o iberófono.',

    'books.eyebrow': 'De Indiis Editions',
    'books.h': 'Traducir un canon, no una estantería.',
    'books.sub': 'Cincuenta adquisiciones prioritarias en trece colecciones. La mayoría de estas obras se leyeron mucho en su día y nunca se tradujeron. Cada edición sitúa su texto dentro de la tradición de la que viene.',
    'books.note': 'Los órdenes de prioridad son recomendaciones editoriales del programa de adquisiciones, no anuncios de publicación. No se listan los prologuistas ni los editores propuestos: son investigadores que no han aceptado participar. Las cubiertas son provisionales.',
    'books.all': 'Todas',

    'watch.eyebrow': 'Ver · 13,5K en YouTube, 22K en X, 19K en Instagram',
    'watch.h': 'Trescientos años, recortados del relato.',
    'watch.sub': 'El vídeo corto es por donde llega casi todo el mundo. Cada uno remite al Atlas.',

    'read.eyebrow': 'Leer · en Substack',
    'read.h': 'Ensayos y traducciones.',
    'read.sub': 'En su mayoría, primeras traducciones al inglés de la escuela de Gustavo Bueno, junto a Vasconcelos y Elías de Tejada.',

    'about.eyebrow': 'La misión',
    'about.h': 'Una tradición olvidada, no refutada.',
    'about.p1': 'El Institute for Hispano Studies estudia y defiende la civilización hispánica: su historia, su herencia católica, su mestizaje y sus dos lenguas. De Indiis Editions traduce y reedita el canon de esa discusión.',
    'about.p2': 'La tesis no es que esta tradición fuera derrotada. Es que casi nunca se tradujo, y un argumento que no puedes leer es un argumento que no puedes responder.',

    'comm.eyebrow': 'Reconquista Syndicate',
    'comm.h': 'Únete a la discusión.',
    'comm.sub': 'Un Discord de lectores, traductores y gente harta de perder este debate por falta de fuentes.',
    'comm.discord': 'Entrar en el Discord',
    'comm.patreon': 'Apoyar en Patreon',

    'merch.eyebrow': 'Tienda',
    'merch.h': 'Lleva el argumento puesto.',
    'merch.sub': 'Sección provisional. La tienda no está conectada en este borrador.',

    'foot.explore': 'Explorar', 'foot.watchread': 'Ver y leer',
    'foot.community': 'Comunidad', 'foot.sources': 'Fuentes',
    'foot.discord': 'Discord · Reconquista Syndicate',
    'foot.canonSrc': 'Esquema del canon según Gustavo Bueno (2001)',
    'foot.legal': 'Hispano Studies LLC · Veritas prius pace',
    'foot.draft': 'Borrador de la dirección O · Atlas · octubre de 2026 · texto no definitivo',
  },
};

let lang = 'en';
const t = (key, fallback = '') => (lang === 'en' ? fallback : STRINGS.es[key] ?? fallback);

/** Snapshot the English the HTML shipped with, so switching back is lossless. */
function captureEnglish() {
  for (const node of document.querySelectorAll('[data-i18n]')) {
    STRINGS.en[node.dataset.i18n] = node.textContent;
  }
  for (const node of document.querySelectorAll('[data-i18n-html]')) {
    STRINGS.en[node.dataset.i18nHtml] = node.innerHTML;
  }
  for (const node of document.querySelectorAll('[data-i18n-attr]')) {
    const [attr, key] = node.dataset.i18nAttr.split(':');
    STRINGS.en[key] = node.getAttribute(attr);
  }
}

function applyLang(next, push = true) {
  lang = next;
  document.documentElement.lang = next;
  if (push) {
    const url = new URL(window.location);
    if (next === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }
  const dict = STRINGS[next];
  for (const node of document.querySelectorAll('[data-i18n]')) {
    const v = dict[node.dataset.i18n];
    if (v !== undefined) node.textContent = v;
  }
  for (const node of document.querySelectorAll('[data-i18n-html]')) {
    const v = dict[node.dataset.i18nHtml];
    if (v !== undefined) node.innerHTML = v;
  }
  for (const node of document.querySelectorAll('[data-i18n-attr]')) {
    const [attr, key] = node.dataset.i18nAttr.split(':');
    const v = dict[key];
    if (v !== undefined) node.setAttribute(attr, v);
  }
  for (const b of document.querySelectorAll('.lang button')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === next));
  }
  document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
}

/* ==========================================================================
   HERO MAP
   ========================================================================== */

const COUNT_WORD = {
  en: (n) => `${n} ${n === 1 ? 'author' : 'authors'}`,
  es: (n) => `${n} ${n === 1 ? 'autor' : 'autores'}`,
};
const TIER_WORD = {
  en: { emersa: 'Spanish or Portuguese official', submersa: 'Iberophone presence, not official' },
  es: { emersa: 'español o portugués oficial', submersa: 'presencia iberófona, sin oficialidad' },
};

function renderReadout(rec) {
  const box = $('#readout');
  if (!rec) {
    box.innerHTML = `<span class="hint">${t('readout.hint', 'Point at a country to read it.')}</span>`;
    return;
  }
  const corpus = lang === 'es' ? 'En el corpus' : 'In the corpus';
  box.innerHTML = `<strong>${rec.name[lang] || rec.name.en}</strong>
    <span class="hint">${TIER_WORD[lang][rec.tier]}</span>
    <dl><dt>${corpus}</dt><dd>${COUNT_WORD[lang](rec.authors)}</dd></dl>`;
}

/* ==========================================================================
   ATLAS — the 60 milestones
   ========================================================================== */

/* Place names, including the historical ones, mapped to the ISO ids the
   TopoJSON uses. The Atlas highlights the countries a milestone actually
   names in its title, body or map directive: a mechanism that is honest
   about being textual rather than pretending to model historical borders. */
const PLACES = {
  724: ['Spain', 'Castile', 'Castilian', 'Aragon', 'Asturias', 'Asturian', 'Granada', 'Covadonga', 'Cádiz', 'Madrid', 'Salamanca', 'Canary', 'Canaries', 'Zamora', 'Alcáçovas', 'Tordesillas', 'Valladolid', 'Spanish monarchy'],
  620: ['Portugal', 'Portuguese', 'Lisbon', 'Guimarães', 'Azores', 'Madeira', 'Ceuta'],
  76: ['Brazil', 'Brazilian', 'Rio de Janeiro', 'Bahia', 'Salvador'],
  484: ['Mexico', 'Mexican', 'New Spain', 'Tenochtitlan', 'Acapulco', 'Veracruz', 'Guadalupe Hidalgo'],
  604: ['Peru', 'Peruvian', 'Andes', 'Lima', 'Ayacucho', 'Callao', 'Cuzco'],
  608: ['Philippines', 'Philippine', 'Filipino', 'Manila'],
  192: ['Cuba', 'Cuban', 'Havana'],
  630: ['Puerto Rico'],
  214: ['Dominican', 'Santo Domingo'],
  32: ['Argentina', 'Argentine', 'Buenos Aires', 'Río de la Plata', 'Plata'],
  152: ['Chile', 'Chilean'],
  858: ['Uruguay', 'Uruguayan', 'Montevideo'],
  600: ['Paraguay', 'Paraguayan'],
  68: ['Bolivia', 'Bolivian', 'Upper Peru'],
  218: ['Ecuador', 'Quito'],
  862: ['Venezuela', 'Venezuelan', 'Caracas'],
  170: ['Colombia', 'Colombian', 'Gran Colombia', 'New Granada'],
  591: ['Panama', 'Panamanian', 'Amphictyonic'],
  320: ['Guatemala', 'Central American federation'],
  340: ['Honduras'],
  222: ['El Salvador'],
  558: ['Nicaragua'],
  188: ['Costa Rica'],
  840: ['United States', 'American republics', 'Spanish-American War', 'Pan-American'],
  24: ['Angola', 'Angolan'],
  508: ['Mozambique', 'Mozambican'],
  226: ['Equatorial Guinea', 'Equatoguinean'],
  624: ['Guinea-Bissau'],
  626: ['Timor', 'Timor-Leste'],
  356: ['India', 'Goa', 'Cape route'],
  710: ['Cape of Good Hope', 'South Africa'],
  156: ['China', 'Macao', 'Macau'],
};

/* Which routes make sense on screen in which centuries. The route layer is
   evidence of a connection, so it only appears once the connection exists. */
function routesFor(year) {
  const on = new Set();
  if (year >= 1498) on.add('india');
  if (year >= 1500) on.add('brasil');
  if (year >= 1557) on.add('macao');
  if (year >= 1565) { on.add('manila'); on.add('tornaviaje'); }
  if (year >= 1566) on.add('indias');
  return on;
}

function placesIn(text) {
  const found = new Set();
  for (const [iso, names] of Object.entries(PLACES)) {
    if (names.some((n) => text.includes(n))) found.add(String(iso).padStart(3, '0'));
  }
  return found;
}

const CHAPTER_INK = ['#8a7a5e', '#4e6f7d', '#a8502f', '#6e7f63', '#7b2230', '#5a5680', '#ad8220'];
const RUPTURES = new Set([1808, 1898, 1974]);

/** The document's own broken axis: everything before 1800 compressed. */
function railX(year) {
  if (year <= 1800) return ((year - 722) / (1800 - 722)) * 38;
  return 41 + ((year - 1800) / (2026 - 1800)) * 59;
}

/* The spine: the milestones the scroll walks through. Everything else is
   still one arrow key or one rail click away. Derived, not hand-picked —
   the opening milestone of each chapter, plus the ruptures and the hinges
   the chronology itself turns on. */
const SPINE_YEARS = new Set([1492, 1494, 1519, 1565, 1580, 1808, 1824, 1898, 1974, 2015]);

function spineOf(items) {
  const seen = new Set();
  const out = [];
  for (const [n, m] of items.entries()) {
    const opensChapter = n === 0 || items[n - 1].chapter !== m.chapter;
    if ((opensChapter || SPINE_YEARS.has(m.year)) && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function setupAtlas(doc, map) {
  const items = doc.milestones;
  const refs = doc.references;
  const spine = spineOf(items);
  let i = 0;
  let turning = 0;

  const rail = $('#rail');
  const onSpine = new Set(spine);
  const ticks = items.map((m, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail__tick';
    b.style.left = `${railX(m.year)}%`;
    b.style.setProperty('--ch', CHAPTER_INK[m.chapter]);
    b.dataset.rupture = String(RUPTURES.has(m.year));
    b.dataset.spine = String(onSpine.has(n));
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `${m.date.en} — ${m.title.en}`);
    b.addEventListener('click', () => { show(n); scroller?.goTo(spineIndexFor(n)); });
    rail.appendChild(b);
    return b;
  });

  // one invisible scroll step per spine milestone
  const stepHost = $('#atlas-steps');
  const steps = spine.map(() => {
    const d = document.createElement('div');
    d.className = 'atlas__step';
    stepHost.appendChild(d);
    return d;
  });
  $('.atlas__scroll').style.setProperty('--steps', steps.length);

  /** Nearest spine entry at or before `n`, so the rail and the scroll agree. */
  const spineIndexFor = (n) => {
    let best = 0;
    spine.forEach((v, k) => { if (v <= n) best = k; });
    return best;
  };

  let scroller = null;
  const brk = document.createElement('div');
  brk.className = 'rail__break';
  brk.style.left = '38.5%';
  rail.appendChild(brk);

  function renderLegend() {
    $('#rail-legend').innerHTML = doc.chapters.map((c, n) =>
      `<span><i style="--ch:${CHAPTER_INK[n]}"></i>${c[lang] || c.en}</span>`).join('');
  }

  function show(n) {
    i = Math.max(0, Math.min(items.length - 1, n));
    const m = items[i];
    const L = lang;

    // cross-fade the words so they do not land before the map does
    const frame = $('.atlas__frame');
    if (!REDUCED) {
      frame.classList.add('is-turning');
      clearTimeout(turning);
      turning = setTimeout(() => frame.classList.remove('is-turning'), 180);
    }

    $('#f-ghost').textContent = m.year;
    $('#f-n').textContent = `${String(m.n).padStart(2, '0')} / 60`;
    $('#f-chapter').textContent = doc.chapters[m.chapter][L] || doc.chapters[m.chapter].en;
    $('#f-date').textContent = m.date[L] || m.date.en;
    $('#f-title').textContent = m.title[L] || m.title.en;
    $('#f-body').textContent = m.body[L] || m.body.en;
    $('#f-map').textContent = m.map[L] || m.map.en;
    $('#f-src').textContent = m.sources
      .map((k) => (refs[k] ? `${k} · ${refs[k][L] || refs[k].en}` : k))
      .join(' · ');

    $('#f-prev').disabled = i === 0;
    $('#f-next').disabled = i === items.length - 1;
    for (const [n2, b] of ticks.entries()) b.setAttribute('aria-current', String(n2 === i));

    const hit = placesIn(`${m.title.en} ${m.body.en} ${m.map.en}`);
    map.highlight(hit);
    map.showRoutes(routesFor(m.year));
    map.frameTo(hit);
  }

  $('#f-prev').addEventListener('click', () => show(i - 1));
  $('#f-next').addEventListener('click', () => show(i + 1));

  // scroll walks the spine; the sticky stage keeps the map in front of you
  if (steps.length) {
    scroller = scrollSteps(steps, (k) => show(spine[k]));
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    const box = $('#atlas').getBoundingClientRect();
    if (box.bottom < 120 || box.top > window.innerHeight - 120) return;
    if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
  });
  document.addEventListener('langchange', () => { renderLegend(); show(i); });

  renderLegend();
  show(0);
}

/* ==========================================================================
   CANON — fifty texts on the Bueno field
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
};

const BAND_SHORT = {
  A1: 'NATIONALIST', A2: 'INTER-NATIONALIST', B1: 'AMERICAN WHOLE',
  'B2.4': 'PAN-AMERICAN', 'B2.5': 'OCCIDENTALIST', 'B2.6': 'HISPANIC COMMUNITY',
  'B2.7': 'LUSOPHONE COMMUNITY', 'B2.8': 'IBERIAN / IBEROPHONE',
};

function setupCanon(canon) {
  const W = 1000;
  const ROW = 42;
  const PAD_L = 132;
  const PAD_T = 16;
  const PAD_B = 26;
  const bands = canon.bands;
  const H = PAD_T + bands.length * ROW + PAD_B;
  const Y0 = 1810;
  const Y1 = 2005;
  const x = (y) => PAD_L + ((y - Y0) / (Y1 - Y0)) * (W - PAD_L - 24);

  const host = $('#canon-chart');
  host.textContent = '';
  const card = makeHoverCard(host);
  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'Fifty canonical texts placed by publication year and by the kind of unity they presuppose.',
  }, host);

  const rowY = {};
  bands.forEach((b, n) => {
    const y = PAD_T + n * ROW;
    rowY[b.code] = y;
    const g = svgEl('g', { class: 'band' }, svg);
    svgEl('rect', {
      x: PAD_L, y, width: W - PAD_L - 24, height: ROW - 3,
      fill: canon.palette[b.code] || '#e6e0d4',
    }, g);
    const label = svgEl('text', { x: PAD_L - 9, y: y + ROW / 2, 'text-anchor': 'end' }, g);
    label.textContent = BAND_SHORT[b.code] || b.code;
    const code = svgEl('text', { x: 4, y: y + ROW / 2, class: 'code' }, g);
    code.textContent = b.code;
    code.setAttribute('font-family', 'IBM Plex Mono, monospace');
    code.setAttribute('font-size', '5.4');
    code.setAttribute('fill', '#696259');
  });

  // decade axis
  const axis = svgEl('g', { class: 'axis' }, svg);
  for (let y = 1820; y <= 2000; y += 20) {
    svgEl('line', { x1: x(y), y1: PAD_T, x2: x(y), y2: H - PAD_B }, axis);
    const tx = svgEl('text', { x: x(y), y: H - PAD_B + 11, 'text-anchor': 'middle' }, axis);
    tx.textContent = y;
  }

  // 1898: the rupture the whole canon answers
  const rup = svgEl('g', { class: 'rupture' }, svg);
  svgEl('line', { x1: x(1898), y1: PAD_T - 6, x2: x(1898), y2: H - PAD_B }, rup);
  const rt = svgEl('text', { x: x(1898) + 3, y: PAD_T - 1 }, rup);
  rt.textContent = '1898';

  // a hairline that follows the pointer, so you can read a dot against the axis
  const cursor = svgEl('g', { class: 'cursor is-off' }, svg);
  const cursorLine = svgEl('line', { x1: 0, y1: PAD_T - 6, x2: 0, y2: H - PAD_B }, cursor);

  // dots, spread inside their band so nothing hides behind anything
  const byBand = {};
  for (const txt of canon.texts) (byBand[txt.bueno] ||= []).push(txt);
  for (const [code, list] of Object.entries(byBand)) {
    const y = rowY[code];
    if (y === undefined) continue;
    list.sort((a, b) => a.year - b.year);
    let lastX = -99;
    let lane = 0;
    for (const txt of list) {
      const cx = x(txt.year);
      lane = cx - lastX < 13 ? (lane + 1) % 3 : 0;
      lastX = cx;
      const cy = y + ROW / 2 - 7 + lane * 7;
      const dot = svgEl('circle', {
        class: 'dot', cx, cy, r: 3.4,
        'data-id': txt.id, 'data-role': txt.role, tabindex: '0', role: 'button',
      }, svg);
      svgEl('title', {}, dot).textContent = `${txt.title} — ${txt.author}`;
      // the canon fills in along the century, oldest first
      dot.style.setProperty('--d', `${Math.round(((txt.year - Y0) / (Y1 - Y0)) * 900)}ms`);

      const highlight = () => {
        for (const d of svg.querySelectorAll('.dot.is-active')) d.classList.remove('is-active');
        dot.classList.add('is-active');
        cursorLine.setAttribute('x1', cx);
        cursorLine.setAttribute('x2', cx);
        cursor.classList.remove('is-off');
        renderCanonReadout(txt, canon);
      };
      dot.addEventListener('pointerenter', (e) => {
        highlight();
        card.show(cardHtml(txt, canon), e.clientX, e.clientY);
      });
      dot.addEventListener('pointermove', (e) => card.move(e.clientX, e.clientY));
      dot.addEventListener('pointerleave', () => card.hide());
      dot.addEventListener('focus', () => {
        highlight();
        const b = dot.getBoundingClientRect();
        card.show(cardHtml(txt, canon), b.left + b.width / 2, b.top);
      });
      dot.addEventListener('blur', () => card.hide());
      dot.addEventListener('click', highlight);
    }
  }

  host.addEventListener('pointerleave', () => {
    card.hide();
    cursor.classList.add('is-off');
  });

  // the dots grow in when the chart arrives
  whenInView(host, () => host.classList.add('is-in'), 0.18);
}

const CARD_LABELS = {
  en: { year: 'Year', pos: 'Position', unity: 'Unity', op: 'Operation', reg: 'Region',
        ct: 'Argued against Hispanic unity' },
  es: { year: 'Año', pos: 'Posición', unity: 'Unidad', op: 'Operación', reg: 'Región',
        ct: 'Argumentó contra la unidad hispánica' },
};

function cardHtml(txt, canon) {
  const lab = CARD_LABELS[lang];
  const ct = txt.role === 'counter-tradition' ? `<p class="hc-ct">${lab.ct}</p>` : '';
  return `<p class="hc-t">${txt.title}</p>
    <p class="hc-a">${txt.author}${txt.life ? ` · ${txt.life}` : ''}</p>
    <dl>
      <dt>${lab.year}</dt><dd>${txt.year}</dd>
      <dt>${lab.pos}</dt><dd>${txt.bueno} · ${BAND_SHORT[txt.bueno] || ''}</dd>
      <dt>${lab.unity}</dt><dd>${txt.unity}</dd>
      <dt>${lab.op}</dt><dd>${txt.operations.join(', ') || '—'}</dd>
      <dt>${lab.reg}</dt><dd>${txt.region || '—'}</dd>
    </dl>${ct}`;
}

function renderCanonReadout(txt, canon) {
  const L = lang;
  const band = canon.bands.find((b) => b.code === txt.bueno);
  const lab = L === 'es'
    ? { year: 'Año', pos: 'Posición', unity: 'Unidad', op: 'Operación', reg: 'Región', ct: 'Contratradición' }
    : { year: 'Year', pos: 'Position', unity: 'Unity', op: 'Operation', reg: 'Region', ct: 'Counter-tradition' };
  const ct = txt.role === 'counter-tradition'
    ? `<dt>${lab.ct}</dt><dd>${L === 'es' ? 'sí' : 'yes'}</dd>` : '';
  $('#canon-readout').innerHTML = `
    <p class="t">${txt.title}</p>
    <p class="a">${txt.author}${txt.life ? ` · ${txt.life}` : ''}</p>
    <dl>
      <dt>${lab.year}</dt><dd>${txt.year}</dd>
      <dt>${lab.pos}</dt><dd>${txt.bueno} · ${BAND_SHORT[txt.bueno] || band?.name || ''}</dd>
      <dt>${lab.unity}</dt><dd>${txt.unity}</dd>
      <dt>${lab.op}</dt><dd>${txt.operations.join(', ') || '—'}</dd>
      <dt>${lab.reg}</dt><dd>${txt.region || '—'}</dd>
      ${ct}
    </dl>`;
}

/* ==========================================================================
   BOOKS, WATCH, READ, FOOTER
   ========================================================================== */

function setupBooks(doc) {
  const books = doc.books;
  const series = [...new Set(books.map((b) => b.series))]
    .sort((a, b) => books.filter((x) => x.series === b).length - books.filter((x) => x.series === a).length);
  let active = null;

  function renderGrid() {
    const list = (active ? books.filter((b) => b.series === active) : books).slice(0, 12);
    $('#books-grid').innerHTML = list.map((b) => `
      <article class="book">
        <div class="book__cover"><span>[${lang === 'es' ? 'Cubierta' : 'Cover'}]</span></div>
        <p class="book__year">${b.source_year ?? ''} · ${b.country}</p>
        <h3>${b.title}</h3>
        <p class="book__author">${b.author}</p>
        <p class="book__series">${b.series}</p>
      </article>`).join('');
  }

  function renderTabs() {
    const all = `<button type="button" aria-pressed="${active === null}" data-s="">${t('books.all', 'All')} · 50</button>`;
    $('#books-series').innerHTML = all + series.map((s) =>
      `<button type="button" aria-pressed="${active === s}" data-s="${s}">${s} · ${books.filter((b) => b.series === s).length}</button>`).join('');
    for (const b of $('#books-series').querySelectorAll('button')) {
      b.addEventListener('click', () => {
        active = b.dataset.s || null;
        renderTabs();
        renderGrid();
      });
    }
  }

  document.addEventListener('langchange', () => { renderTabs(); renderGrid(); });
  renderTabs();
  renderGrid();
}

function setupWatch() {
  const all = [
    ...SHORTS.map((s) => ({ ...s, kind: 'short' })),
    ...VIDEOS.map((v) => ({ ...v, kind: 'video' })),
  ].slice(0, 8);
  $('#watch-grid').innerHTML = all.map((v) => `
    <a class="vid" href="${v.kind === 'short' ? shortUrl(v.id) : `https://www.youtube.com/watch?v=${v.id}`}"
       target="_blank" rel="noopener">
      <span class="vid__thumb">
        <img src="${shortThumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        ${v.views ? `<span class="vid__views">${v.views}</span>` : ''}
      </span>
      <h3>${v.title}</h3>
    </a>`).join('');
}

function setupRead() {
  const fmt = () => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' });
  function render() {
    const f = fmt();
    $('#read-list').innerHTML = ESSAYS.slice(0, 6).map((e) => `
      <a class="essay" href="${e.url}" target="_blank" rel="noopener">
        <span class="essay__date">${f.format(new Date(e.date))}</span>
        <span>
          <h3>${e.title}</h3>
          <p class="essay__by">${e.author}${e.translator
            ? ` · ${lang === 'es' ? 'trad.' : 'trans.'} ${e.translator}` : ''}</p>
        </span>
      </a>`).join('');
  }
  document.addEventListener('langchange', render);
  render();
}

function setupFooter() {
  $('#foot-channels').innerHTML = CHANNELS.map((c) =>
    `<li><a href="${c.url}" target="_blank" rel="noopener">${c.name}</a></li>`).join('');
}

/* ==========================================================================
   BOOT
   ========================================================================== */

async function boot() {
  captureEnglish();
  for (const b of document.querySelectorAll('.lang button')) {
    b.addEventListener('click', () => applyLang(b.dataset.lang));
  }
  // the three registers from the brand plan, switchable
  mountThemeSwitcher($('#themer'), { lang: () => lang, compact: true, plate: true });
  // ?lang=es gives a shareable Spanish URL, which is also what makes the
  // bilingual build testable without clicking through the page
  const wanted = new URL(window.location).searchParams.get('lang');
  const startLang = wanted === 'es' || wanted === 'en' ? wanted : 'en';
  $('#signup').addEventListener('submit', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('is-done');
  });

  scrollProgress($('#progress'));
  setupWatch();
  setupRead();
  setupFooter();

  const [mapData, milestones, canon, books] = await Promise.all([
    loadMapData(DATA),
    fetch(`${DATA}/milestones.json`).then((r) => r.json()),
    fetch(`${DATA}/canon.json`).then((r) => r.json()),
    fetch(`${DATA}/books.json`).then((r) => r.json()),
  ]);

  // the cartouche counts what the data actually holds, and counts it up
  const all = [...mapData.iberophone.countries, ...mapData.iberophone.points];
  countUp($('#c-states'), all.filter((c) => c.tier === 'emersa').length);
  countUp($('#c-presence'), all.filter((c) => c.tier === 'submersa').length);
  countUp($('#c-authors'), canon.corpusTotal ?? 267);
  countUp($('#c-milestones'), milestones.milestones.length);

  drawMap($('#hero-map'), mapData, {
    animate: true,
    onPick: renderReadout,
  });
  document.addEventListener('langchange', () => renderReadout(null));

  const atlasMap = drawMap($('#atlas-map'), mapData, {
    rose: false, animate: false, labels: true,
  });
  setupAtlas(milestones, atlasMap);

  setupCanon(canon);
  setupBooks(books);

  if (startLang !== 'en') applyLang(startLang, false);
  observeReveals();
  flushWatchers();
  window.__motionReady = true;
}

boot().catch((err) => {
  console.error(err);
  // a failed boot must not leave the page hidden behind its own reveal state
  document.documentElement.classList.remove('js-motion');
  const r = document.querySelector('#readout');
  if (r) r.textContent = 'The map data could not be loaded. Open the page through `make serve`.';
});
