/* ==========================================================================
   P · Tornaviaje — page wiring.

   Same data as O · Atlas, a different register. The map engine, the motion
   helpers and the datasets are shared; everything visual is this folder's.
   ========================================================================== */

import { CHANNELS, SHORTS, VIDEOS, ESSAYS, shortThumb, shortUrl } from '../shared/content.js';
import { mountThemeSwitcher } from '../shared/theme.js';
import { drawMap, loadMapData } from '../o-atlas/map.js';
import {
  REDUCED, observeReveals, countUp, scrollSteps, scrollProgress,
  makeHoverCard, whenInView, flushWatchers,
} from '../o-atlas/motion.js';

const DATA = '../shared/data';
const $ = (s, r = document) => r.querySelector(s);

/* ==========================================================================
   i18n — the HTML ships English, this table carries the Spanish
   ========================================================================== */

const STRINGS = {
  en: {},
  es: {
    'nav.atlas': 'Atlas', 'nav.canon': 'Canon', 'nav.books': 'Libros', 'nav.watch': 'Ver',
    'nav.cta': 'Quiero el folleto',

    'hero.eyebrow': 'Institute for Hispano Studies',
    'hero.h1': 'Cuatro continentes. |Dos lenguas.| Una discusión.',
    'hero.lede': 'El español y el portugués son oficiales en veintinueve estados. Ese espacio tiene una historia, un canon y doscientos años de discusión sobre qué es — y casi nada de eso llegó a traducirse.',
    'hero.cta1': 'Empieza por el folleto gratuito',
    'hero.cta2': 'Abrir el Atlas',
    'hero.mapcap': 'Veintinueve estados · cuatro continentes · las rutas que los unieron',

    'strip.h': 'El canon',
    'strip.label': 'Cincuenta obras, nunca traducidas',

    'stats.eyebrow': 'Lo que hay aquí de verdad',
    'stats.h': 'No un archivo. |Una obra de referencia.|',
    'stats.authors': 'autores en el corpus',
    'stats.milestones': 'hitos fechados, de hacia 722 a 2026',
    'stats.texts': 'textos canónicos, de 1818 a 1999',
    'stats.states': 'estados donde las lenguas son oficiales',

    'pil.eyebrow': 'Tres troncos',
    'pil.h': 'Todo lo de aquí |cuelga de uno de los tres.|',
    'pil.1': 'Mestizaje',
    'pil.1s': 'Castas, transculturación, <i>La raza cósmica</i>, pensamiento indoamericano y la Leyenda Negra sobre la raza.',
    'pil.1m': '8 títulos prioritarios',
    'pil.2': 'Catolicismo',
    'pil.2s': 'Guadalupe, evangelización, la Escuela de Salamanca y el pensamiento político católico a ambos lados del Atlántico.',
    'pil.2m': '6 títulos prioritarios',
    'pil.3': 'Lengua',
    'pil.3s': 'Español y portugués, las academias, la Iberofonía y la traducción como tarea misma de la editorial.',
    'pil.3m': '14 títulos prioritarios',

    'atlas.eyebrow': 'El Atlas · sesenta hitos',
    'atlas.h': 'Avanza, y |el mapa se mueve contigo.|',
    'atlas.sub': 'Una sola secuencia de hacia 722 a 2026, en siete capítulos. Cada hito lleva su propio tratamiento cartográfico y cita su propia fuente.',
    'atlas.treatment': 'Tratamiento cartográfico',
    'atlas.keys': 'desplázate, o usa las flechas del teclado',

    'canon.eyebrow': 'El canon · cincuenta textos',
    'canon.h': 'Una discusión viva, |no una lista de lecturas.|',
    'canon.sub': 'Cada texto se sitúa según el tipo de unidad que presupone. Ha habido hispanistas monárquicos y marxistas, liberales y nacionalistas — y por eso los autores que argumentaron <em>contra</em> la unidad hispánica también están en el esquema, con el trazo roto.',
    'canon.disclaimer': 'Clasificación adaptada de Gustavo Bueno, «España y América» (2001). Las tradiciones portuguesa, brasileña, lusoafricana, asiática, indígena, del Atlántico negro, ecuatoguineana y filipina siguen siendo históricamente distintas. Su presencia en este esquema no implica su adhesión a un proyecto hispánico o iberófono.',

    'books.eyebrow': 'De Indiis Editions',
    'books.h': 'Traducir un canon, |no una estantería.|',
    'books.note': 'Los órdenes de prioridad son recomendaciones editoriales del programa de adquisiciones, no anuncios de publicación. No se listan los prologuistas ni los editores propuestos: son investigadores que no han aceptado participar. Las cubiertas son provisionales.',

    'watch.eyebrow': 'Ver',
    'watch.h': 'Trescientos años, |recortados del relato.|',

    'read.eyebrow': 'Leer · en Substack',
    'read.h': 'Ensayos y |primeras traducciones.|',

    'join.eyebrow': 'De Indiis Editions',
    'join.h': 'Doscientos años de teoría |y praxis. Gratis.|',
    'join.sub': 'El folleto que abre el canon: de dónde vienen estas ideas, quién las discutió y por dónde empezar a leer.',
    'join.label': 'Correo electrónico',
    'join.ph': 'tu@correo.com',
    'join.cta': 'Envíamelo',
    'join.ok': 'Confírmalo en tu correo. (Maqueta: no se envía nada.)',
    'join.discord': 'Entrar en el Discord',

    'foot.motto': 'Veritas prius pace',
    'foot.explore': 'Explorar', 'foot.channels': 'Canales',
    'foot.sources': 'Fuentes', 'foot.theme': 'Tema',
    'foot.canonSrc': 'Esquema del canon según Gustavo Bueno (2001)',
    'foot.legal': 'Hispano Studies LLC',
    'foot.draft': 'Borrador de la dirección P · Tornaviaje · octubre de 2026 · texto no definitivo',
  },
};

let lang = 'en';
const t = (k, fb = '') => (lang === 'en' ? fb : STRINGS.es[k] ?? fb);

function captureEnglish() {
  for (const n of document.querySelectorAll('[data-i18n]')) STRINGS.en[n.dataset.i18n] = n.innerHTML;
  for (const n of document.querySelectorAll('[data-i18n-attr]')) {
    const [a, k] = n.dataset.i18nAttr.split(':');
    STRINGS.en[k] = n.getAttribute(a);
  }
}

/** Headlines are authored with |pipes| around the phrase that takes the accent. */
function splitWords(el) {
  const html = el.innerHTML;
  const parts = html.split('|');
  el.innerHTML = parts.map((chunk, i) => {
    const words = chunk.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    const inner = words.map((w) => `<span class="word">${w}</span>`).join(' ');
    return i % 2 ? `<span class="line-2">${inner}</span>` : inner;
  }).join(' ');
  const words = [...el.querySelectorAll('.word')];
  words.forEach((w, i) => w.style.setProperty('--d', `${i * 48}ms`));
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
    const v = dict[n.dataset.i18n];
    if (v !== undefined) {
      n.innerHTML = v;
      if (n.hasAttribute('data-split')) splitWords(n);
    }
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
   MARQUEE — the canon, moving
   ========================================================================== */

function setupMarquee(canon) {
  const pick = canon.texts.slice(0, 26);
  const one = pick.map((x) => {
    const title = x.title.replace(/\s*\(\d{4}\)\s*$/, '');
    return `<span class="marquee__item">${title}<span>${x.year}</span></span>`;
  }).join('');
  // duplicated so the translate(-50%) loop is seamless
  $('#marquee-row').innerHTML = one + one;
}

/* ==========================================================================
   ATLAS
   ========================================================================== */

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
  340: ['Honduras'], 222: ['El Salvador'], 558: ['Nicaragua'], 188: ['Costa Rica'],
  840: ['United States', 'American republics', 'Spanish-American War', 'Pan-American'],
  24: ['Angola', 'Angolan'], 508: ['Mozambique', 'Mozambican'],
  226: ['Equatorial Guinea', 'Equatoguinean'], 624: ['Guinea-Bissau'],
  626: ['Timor', 'Timor-Leste'],
  356: ['India', 'Goa', 'Cape route'], 710: ['Cape of Good Hope', 'South Africa'],
  156: ['China', 'Macao', 'Macau'],
};

const SPINE_YEARS = new Set([1492, 1494, 1519, 1565, 1580, 1808, 1824, 1898, 1974, 2015]);
const CHAPTER_INK = ['#8a7a5e', '#4e6f7d', '#a8502f', '#6e7f63', '#7b2230', '#5a5680', '#ad8220'];
const RUPTURES = new Set([1808, 1898, 1974]);

const placesIn = (text) => {
  const found = new Set();
  for (const [iso, names] of Object.entries(PLACES)) {
    if (names.some((n) => text.includes(n))) found.add(String(iso).padStart(3, '0'));
  }
  return found;
};

function routesFor(year) {
  const on = new Set();
  if (year >= 1498) on.add('india');
  if (year >= 1500) on.add('brasil');
  if (year >= 1557) on.add('macao');
  if (year >= 1565) { on.add('manila'); on.add('tornaviaje'); }
  if (year >= 1566) on.add('indias');
  return on;
}

const railX = (y) => (y <= 1800 ? ((y - 722) / 1078) * 38 : 41 + ((y - 1800) / 226) * 59);

function setupAtlas(doc, map) {
  const items = doc.milestones;
  const refs = doc.references;
  let i = 0;
  let turning = 0;
  let scroller = null;

  const spine = [];
  items.forEach((m, n) => {
    if (n === 0 || items[n - 1].chapter !== m.chapter || SPINE_YEARS.has(m.year)) spine.push(n);
  });
  const onSpine = new Set(spine);
  const spineIndexFor = (n) => { let b = 0; spine.forEach((v, k) => { if (v <= n) b = k; }); return b; };

  const rail = $('#rail');
  const ticks = items.map((m, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail__tick';
    b.style.left = `${railX(m.year)}%`;
    b.dataset.spine = String(onSpine.has(n));
    b.dataset.rupture = String(RUPTURES.has(m.year));
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `${m.date.en} — ${m.title.en}`);
    b.addEventListener('click', () => { show(n); scroller?.goTo(spineIndexFor(n)); });
    rail.appendChild(b);
    return b;
  });

  const stepHost = $('#atlas-steps');
  const steps = spine.map(() => {
    const d = document.createElement('div');
    d.className = 'atlas__step';
    stepHost.appendChild(d);
    return d;
  });
  $('.atlas__scroll').style.setProperty('--steps', steps.length);

  function show(n) {
    i = Math.max(0, Math.min(items.length - 1, n));
    const m = items[i];
    const L = lang;
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
    $('#f-src').textContent = m.sources.map((k) => (refs[k] ? `${k} · ${refs[k][L] || refs[k].en}` : k)).join(' · ');
    $('#f-prev').disabled = i === 0;
    $('#f-next').disabled = i === items.length - 1;
    ticks.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));

    const hit = placesIn(`${m.title.en} ${m.body.en} ${m.map.en}`);
    map.highlight(hit);
    map.showRoutes(routesFor(m.year));
    map.frameTo(hit);
  }

  $('#f-prev').addEventListener('click', () => show(i - 1));
  $('#f-next').addEventListener('click', () => show(i + 1));
  if (steps.length) scroller = scrollSteps(steps, (k) => show(spine[k]));

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    const box = $('#atlas').getBoundingClientRect();
    if (box.bottom < 120 || box.top > window.innerHeight - 120) return;
    if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
  });
  document.addEventListener('langchange', () => show(i));
  show(0);
}

/* ==========================================================================
   CANON
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (n, a, p) => {
  const e = document.createElementNS(NS, n);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v));
  if (p) p.appendChild(e);
  return e;
};

const BAND_SHORT = {
  A1: 'NATIONALIST', A2: 'INTER-NATIONALIST', B1: 'AMERICAN WHOLE', 'B2.4': 'PAN-AMERICAN',
  'B2.5': 'OCCIDENTALIST', 'B2.6': 'HISPANIC COMMUNITY', 'B2.7': 'LUSOPHONE COMMUNITY',
  'B2.8': 'IBERIAN / IBEROPHONE',
};
const CARD_LABELS = {
  en: { year: 'Year', pos: 'Position', unity: 'Unity', op: 'Operation', reg: 'Region', ct: 'Argued against Hispanic unity' },
  es: { year: 'Año', pos: 'Posición', unity: 'Unidad', op: 'Operación', reg: 'Región', ct: 'Argumentó contra la unidad hispánica' },
};

function cardHtml(txt) {
  const l = CARD_LABELS[lang];
  const ct = txt.role === 'counter-tradition' ? `<p class="hc-ct">${l.ct}</p>` : '';
  return `<p class="hc-t">${txt.title}</p>
    <p class="hc-a">${txt.author}${txt.life ? ` · ${txt.life}` : ''}</p>
    <dl><dt>${l.year}</dt><dd>${txt.year}</dd>
    <dt>${l.pos}</dt><dd>${txt.bueno} · ${BAND_SHORT[txt.bueno] || ''}</dd>
    <dt>${l.unity}</dt><dd>${txt.unity}</dd>
    <dt>${l.op}</dt><dd>${txt.operations.join(', ') || '—'}</dd>
    <dt>${l.reg}</dt><dd>${txt.region || '—'}</dd></dl>${ct}`;
}

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
    svgEl('rect', { x: PAD_L, y, width: W - PAD_L - 24, height: ROW - 3, rx: 6, fill: canon.palette[b.code] || '#e6e0d4' }, g);
    svgEl('text', { x: PAD_L - 9, y: y + ROW / 2, 'text-anchor': 'end' }, g).textContent = BAND_SHORT[b.code] || b.code;
  });

  const axis = svgEl('g', { class: 'axis' }, svg);
  for (let y = 1820; y <= 2000; y += 20) {
    svgEl('line', { x1: x(y), y1: PAD_T, x2: x(y), y2: H - PAD_B }, axis);
    svgEl('text', { x: x(y), y: H - PAD_B + 11, 'text-anchor': 'middle' }, axis).textContent = y;
  }

  const rup = svgEl('g', { class: 'rupture' }, svg);
  svgEl('line', { x1: x(1898), y1: PAD_T - 6, x2: x(1898), y2: H - PAD_B }, rup);
  svgEl('text', { x: x(1898) + 3, y: PAD_T - 1 }, rup).textContent = '1898';

  const cursor = svgEl('g', { class: 'cursor is-off' }, svg);
  const cursorLine = svgEl('line', { x1: 0, y1: PAD_T - 6, x2: 0, y2: H - PAD_B }, cursor);

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
      const dot = svgEl('circle', {
        class: 'dot', cx, cy: y + ROW / 2 - 7 + lane * 7, r: 3.6,
        'data-role': txt.role, tabindex: '0', role: 'button',
      }, svg);
      svgEl('title', {}, dot).textContent = `${txt.title} — ${txt.author}`;
      dot.style.setProperty('--d', `${Math.round(((txt.year - Y0) / (Y1 - Y0)) * 900)}ms`);

      const on = () => {
        for (const d of svg.querySelectorAll('.dot.is-active')) d.classList.remove('is-active');
        dot.classList.add('is-active');
        cursorLine.setAttribute('x1', cx);
        cursorLine.setAttribute('x2', cx);
        cursor.classList.remove('is-off');
      };
      dot.addEventListener('pointerenter', (e) => { on(); card.show(cardHtml(txt), e.clientX, e.clientY); });
      dot.addEventListener('pointermove', (e) => card.move(e.clientX, e.clientY));
      dot.addEventListener('pointerleave', () => card.hide());
      dot.addEventListener('focus', () => {
        on();
        const b = dot.getBoundingClientRect();
        card.show(cardHtml(txt), b.left + b.width / 2, b.top);
      });
      dot.addEventListener('blur', () => card.hide());
    }
  }

  host.addEventListener('pointerleave', () => { card.hide(); cursor.classList.add('is-off'); });
  whenInView(host, () => host.classList.add('is-in'), 0.18);
}

/* ==========================================================================
   BOOKS, WATCH, READ, FOOTER
   ========================================================================== */

function setupBooks(doc) {
  const rail = $('#books-rail');
  const render = () => {
    rail.innerHTML = doc.books.slice(0, 16).map((b) => `
      <article class="bookcard">
        <div class="bookcard__cover"><span>[${lang === 'es' ? 'Cubierta' : 'Cover'}]</span></div>
        <p class="yr">${b.source_year ?? ''} · ${b.country}</p>
        <h3>${b.title}</h3>
        <p class="au">${b.author}</p>
        <p class="se">${b.series}</p>
      </article>`).join('');
  };
  const page = (dir) => {
    const step = rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * step, behavior: REDUCED ? 'auto' : 'smooth' });
  };
  $('#b-prev').addEventListener('click', () => page(-1));
  $('#b-next').addEventListener('click', () => page(1));
  document.addEventListener('langchange', render);
  render();
}

function setupWatch() {
  const all = [...SHORTS.map((s) => ({ ...s, short: true })), ...VIDEOS].slice(0, 6);
  $('#watch-grid').innerHTML = all.map((v) => `
    <a class="vid" href="${v.short ? shortUrl(v.id) : `https://www.youtube.com/watch?v=${v.id}`}" target="_blank" rel="noopener">
      <span class="vid__thumb">
        <img src="${shortThumb(v.id)}" alt="" loading="lazy" width="480" height="360">
        ${v.views ? `<span class="vid__views">${v.views}</span>` : ''}
      </span>
      <h3>${v.title}</h3>
    </a>`).join('');
}

function setupRead() {
  const render = () => {
    const f = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    $('#read-list').innerHTML = ESSAYS.slice(0, 5).map((e) => `
      <a class="essay" href="${e.url}" target="_blank" rel="noopener">
        <span class="essay__date">${f.format(new Date(e.date))}</span>
        <span><h3>${e.title}</h3>
        <p class="essay__by">${e.author}${e.translator ? ` · ${lang === 'es' ? 'trad.' : 'trans.'} ${e.translator}` : ''}</p></span>
      </a>`).join('');
  };
  document.addEventListener('langchange', render);
  render();
}

/* ==========================================================================
   BOOT
   ========================================================================== */

async function boot() {
  captureEnglish();
  for (const el of document.querySelectorAll('[data-split]')) splitWords(el);

  for (const b of document.querySelectorAll('.lang button')) {
    b.addEventListener('click', () => applyLang(b.dataset.lang));
  }
  mountThemeSwitcher($('#themer'), { lang: () => lang, compact: true });
  mountThemeSwitcher($('#themer-foot'), { lang: () => lang });

  scrollProgress($('#progress'));
  $('#signup').addEventListener('submit', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('is-done');
  });
  $('#foot-channels').innerHTML = CHANNELS.map((c) =>
    `<li><a href="${c.url}" target="_blank" rel="noopener">${c.name}</a></li>`).join('');

  setupWatch();
  setupRead();

  const [mapData, milestones, canon, books] = await Promise.all([
    loadMapData(DATA),
    fetch(`${DATA}/milestones.json`).then((r) => r.json()),
    fetch(`${DATA}/canon.json`).then((r) => r.json()),
    fetch(`${DATA}/books.json`).then((r) => r.json()),
  ]);

  const all = [...mapData.iberophone.countries, ...mapData.iberophone.points];
  countUp($('#s-authors'), canon.corpusTotal ?? 267);
  countUp($('#s-milestones'), milestones.milestones.length);
  countUp($('#s-texts'), canon.texts.length);
  countUp($('#s-states'), all.filter((c) => c.tier === 'emersa').length);

  drawMap($('#hero-map'), mapData, {
    animate: true, labels: false, rose: false,
    projection: 'orthographic', spin: 2.4,
  });
  const atlasMap = drawMap($('#atlas-map'), mapData, { rose: false, animate: false, labels: true });

  setupMarquee(canon);
  setupAtlas(milestones, atlasMap);
  setupCanon(canon);
  setupBooks(books);

  const wanted = new URL(window.location).searchParams.get('lang');
  if (wanted === 'es') applyLang('es', false);

  // split headlines reveal on the same watcher as everything else
  for (const el of document.querySelectorAll('[data-split]')) {
    whenInView(el, () => el.classList.add('is-in'), 0.1);
  }
  observeReveals();
  flushWatchers();
  window.__motionReady = true;
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('js-motion');
});
