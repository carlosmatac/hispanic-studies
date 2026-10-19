/* ==========================================================================
   The map.

   Natural Earth geometry (public domain, via world-atlas 2.0.2) drawn as an
   engraved plate: Equal Earth projection, laid-paper ocean, hairline graticule,
   hatched spheres of presence, gold routes interpolated as great circles.

   Equal Earth and not Web Mercator on purpose: Mercator inflates Europe and
   North America and shrinks the equatorial band, which is where most of the
   Iberophone world lives. See docs/research/cartography.md.

   Rotated to centre the Atlantic. Any flat world map has to cut one ocean;
   cutting the Pacific keeps Europe, Africa and the Americas whole, and the
   Manila galleon then runs off both edges, which is how period charts of the
   Carrera de Filipinas actually read.
   ========================================================================== */

import {
  geoEqualEarth, geoPath, geoGraticule10, geoInterpolate, geoCentroid,
} from 'https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm';
import { feature } from 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROTATE = [30, 0];
const WIDTH = 1000;

/** Named seas, placed by coordinate rather than by centroid. */
const SEAS = [
  { label: 'MAR OCÉANO', lon: -34, lat: 8 },
  { label: 'MAR DEL SUR', lon: -132, lat: -4 },
  { label: 'OCEANUS INDICUS', lon: 72, lat: -28 },
];

/** Labels that would collide with a neighbour at their own centroid. */
const LABEL_NUDGE = {
  620: [-21, 11],   // Portugal, pushed out over the Atlantic
  724: [12, -4],    // Spain
  226: [-13, 9],    // Equatorial Guinea, clear of Sao Tome
  624: [-9, 1],     // Guinea-Bissau
  192: [7, -4],     // Cuba
  626: [0, -6],     // Timor-Leste
  508: [7, 4],      // Mozambique
  24: [-4, 2],      // Angola
};

/** Names shortened for the plate: a map label is not a gazetteer entry. */
const LABEL_SHORT = {
  840: 'United States', 226: 'Eq. Guinea', ST: 'S. Tomé', MAC: 'Macao',
};

/** Which countries carry a name on the plate. More than this and it clutters. */
const LABELLED = new Set([
  '724', '620', '484', '076', '032', '604', '152', '170', '862', '608',
  '024', '508', '840', '192', '626', '226',
]);

const nudge = (id, [x, y]) => {
  const d = LABEL_NUDGE[id];
  return d ? [x + d[0], y + d[1]] : [x, y];
};

function el(name, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(node);
  return node;
}

/** A great circle through the waypoints, sampled densely enough to stay smooth. */
function greatCircle(waypoints, perLeg = 36) {
  const coords = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const interp = geoInterpolate(waypoints[i], waypoints[i + 1]);
    for (let t = 0; t < perLeg; t += 1) coords.push(interp(t / perLeg));
  }
  coords.push(waypoints[waypoints.length - 1]);
  return { type: 'LineString', coordinates: coords };
}

/** A 16-point compass rose, drawn in screen space: it is a plate ornament. */
function compassRose(parent, cx, cy, r) {
  const g = el('g', { class: 'rose', 'aria-hidden': 'true' }, parent);
  el('circle', { cx, cy, r }, g);
  el('circle', { cx, cy, r: r * 0.62 }, g);
  el('circle', { cx, cy, r: r * 0.1, class: 'pt-major' }, g);
  for (let i = 0; i < 16; i += 1) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const major = i % 4 === 0;
    const long = major ? r * 1.3 : i % 2 === 0 ? r * 0.95 : r * 0.72;
    const x2 = cx + Math.cos(a) * long;
    const y2 = cy + Math.sin(a) * long;
    if (major) {
      // a filled lance for the cardinals
      const w = r * 0.12;
      const px = Math.cos(a + Math.PI / 2) * w;
      const py = Math.sin(a + Math.PI / 2) * w;
      el('path', {
        class: 'pt-major',
        d: `M${cx + px} ${cy + py}L${x2} ${y2}L${cx - px} ${cy - py}Z`,
      }, g);
    } else {
      el('path', { class: 'pt-minor', d: `M${cx} ${cy}L${x2} ${y2}` }, g);
    }
  }
  return g;
}

function defs(parent, uid) {
  const d = el('defs', {}, parent);

  // diagonal hatch: the cartographic convention for a sphere of presence that
  // is not a sovereignty. Milestone 60 is a proposal and must look like one.
  const hatch = el('pattern', {
    id: `hatch-${uid}`, width: 5, height: 5,
    patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)',
  }, d);
  el('rect', { width: 5, height: 5, fill: '#efe6d4' }, hatch);
  el('path', { d: 'M0 0V5', stroke: '#9c6a52', 'stroke-width': 1.5 }, hatch);

  // laid-paper lines over the water, the way an engraved plate reads
  const laid = el('pattern', {
    id: `laid-${uid}`, width: 4, height: 4, patternUnits: 'userSpaceOnUse',
  }, d);
  el('path', { d: 'M0 0H4', stroke: '#1e1d1a', 'stroke-width': 0.35, opacity: 0.07 }, laid);

  return d;
}

/**
 * Draw the plate.
 *
 * @param {Element} host           container to render into
 * @param {object}  data           { world, iberophone, routes }
 * @param {object}  [opts]
 * @param {boolean} [opts.routes]  draw the route layer
 * @param {boolean} [opts.labels]  draw country and sea labels
 * @param {boolean} [opts.rose]    draw the compass rose
 * @param {boolean} [opts.animate] draw the routes on once
 * @param {Function}[opts.onPick]  called with a country record, or null
 */
export function drawMap(host, data, opts = {}) {
  const { world, iberophone, routes = [] } = data;
  const o = { routes: true, labels: true, rose: true, animate: false, ...opts };
  const uid = Math.random().toString(36).slice(2, 7);

  const land = feature(world, world.objects.countries);
  const byIso = new Map(iberophone.countries.map((c) => [c.iso, c]));

  const projection = geoEqualEarth().rotate(ROTATE).precision(0.2);
  // fit the whole sphere into WIDTH, then read the height back off it
  projection.fitWidth(WIDTH, { type: 'Sphere' });
  const path = geoPath(projection);
  const [[, y0], [, y1]] = geoPath(projection).bounds({ type: 'Sphere' });
  const height = Math.ceil(y1 - y0);
  projection.translate([projection.translate()[0], projection.translate()[1] - y0]);

  host.textContent = '';
  const svg = el('svg', {
    class: 'map', viewBox: `0 0 ${WIDTH} ${height}`,
    role: 'img', preserveAspectRatio: 'xMidYMid meet',
  }, host);
  el('title', {}, svg).textContent =
    'The Iberophone world: states where Spanish or Portuguese is official, '
    + 'territories of historical Iberian presence, and the historical sea routes '
    + 'that connected them.';
  defs(svg, uid);

  const plate = el('g', { class: 'plate' }, svg);

  // water
  el('path', { class: 'ocean', d: path({ type: 'Sphere' }) }, plate);
  el('path', { d: path({ type: 'Sphere' }), fill: `url(#laid-${uid})` }, plate);
  el('path', { class: 'graticule', d: path(geoGraticule10()) }, plate);

  // land that is not ours: present, recessive
  const rest = el('g', { class: 'rest' }, plate);
  const ours = el('g', { class: 'ib' }, plate);

  const features = new Map();
  for (const f of land.features) {
    features.set(f.id, f);
    const d = path(f);
    if (!d) continue;
    const rec = byIso.get(f.id);
    if (rec) {
      const p = el('path', {
        d, 'data-iso': f.id, 'data-tier': rec.tier, tabindex: '0',
        role: 'button',
      }, ours);
      el('title', {}, p).textContent =
        `${rec.name.en} — ${rec.authors} ${rec.authors === 1 ? 'author' : 'authors'} in the corpus`;
      p.setAttribute('fill', rec.tier === 'submersa' ? `url(#hatch-${uid})` : '');
      if (rec.tier === 'submersa') p.style.fill = `url(#hatch-${uid})`;
    } else {
      el('path', { d }, rest);
    }
  }

  el('path', { class: 'sphere', d: path({ type: 'Sphere' }) }, plate);

  // routes
  const routeLayer = el('g', { class: 'routes', 'aria-hidden': 'true' }, plate);
  const portLayer = el('g', { class: 'ports', 'aria-hidden': 'true' }, plate);
  if (o.routes) {
    routes.forEach((r, i) => {
      const d = path(greatCircle(r.waypoints));
      if (!d) return;
      const p = el('path', {
        class: `route${r.id === 'tornaviaje' ? ' route--return' : ''}`,
        d, 'data-route': r.id,
      }, routeLayer);
      if (o.animate) {
        const len = p.getTotalLength();
        p.style.setProperty('--len', len);
        p.style.setProperty('--delay', `${0.25 + i * 0.3}s`);
        p.classList.add('is-drawing');
      }
      for (const w of r.waypoints) {
        const xy = projection(w);
        if (xy) el('circle', { class: 'port', cx: xy[0], cy: xy[1], r: 1.7 }, portLayer);
      }
    });
  }

  // the small states a world plate cannot draw as polygons
  const pins = el('g', { class: 'pins' }, plate);
  for (const pt of iberophone.points) {
    const xy = projection([pt.lon, pt.lat]);
    if (!xy) continue;
    const c = el('circle', {
      class: 'pin', cx: xy[0], cy: xy[1], r: 2.6,
      'data-tier': pt.tier, 'data-code': pt.code, tabindex: '0', role: 'button',
    }, pins);
    el('title', {}, c).textContent =
      `${pt.name.en} — ${pt.authors} ${pt.authors === 1 ? 'author' : 'authors'} in the corpus`;
  }

  // labels
  const labels = el('g', { class: 'labels', 'aria-hidden': 'true' }, plate);
  if (o.labels) {
    for (const [iso, rec] of byIso) {
      if (!LABELLED.has(iso)) continue;
      const f = features.get(iso);
      if (!f) continue;
      const [x, y] = nudge(iso, projection(geoCentroid(f)) || [0, 0]);
      el('text', {
        class: 'label', x, y, 'text-anchor': 'middle', 'data-label-iso': iso,
      }, labels).textContent = LABEL_SHORT[Number(iso)] || rec.name.en;
    }
    for (const pt of iberophone.points) {
      const xy = projection([pt.lon, pt.lat]);
      if (!xy) continue;
      el('text', {
        class: 'label', x: xy[0], y: xy[1] - 4.6, 'text-anchor': 'middle',
      }, labels).textContent = LABEL_SHORT[pt.code] || pt.name.en;
    }
    for (const s of SEAS) {
      const xy = projection([s.lon, s.lat]);
      if (xy) {
        el('text', {
          class: 'label label--sea', x: xy[0], y: xy[1], 'text-anchor': 'middle',
        }, labels).textContent = s.label;
      }
    }
  }

  if (o.rose) compassRose(plate, WIDTH - 108, height - 74, 21);

  // --- interaction --------------------------------------------------------
  let active = null;
  const pick = (node) => {
    if (active) active.classList.remove('is-active');
    active = node;
    if (node) node.classList.add('is-active');
    if (!o.onPick) return;
    if (!node) return o.onPick(null);
    const iso = node.getAttribute('data-iso');
    const code = node.getAttribute('data-code');
    o.onPick(iso ? byIso.get(iso)
      : iberophone.points.find((p) => p.code === code) || null);
  };

  if (o.onPick) {
    for (const node of plate.querySelectorAll('[data-iso],[data-code]')) {
      node.addEventListener('pointerenter', () => pick(node));
      node.addEventListener('focus', () => pick(node));
      node.addEventListener('click', () => pick(node));
    }
    host.addEventListener('pointerleave', () => pick(null));
  }

  // --- viewBox easing, for the stepped Atlas frames -----------------------
  const full = [0, 0, WIDTH, height];
  let current = full.slice();
  let raf = 0;

  const easeOut = (t) => 1 - (1 - t) ** 3;

  function animateTo(target, ms = 450) {
    cancelAnimationFrame(raf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || ms === 0) {
      current = target.slice();
      svg.setAttribute('viewBox', current.join(' '));
      return;
    }
    const from = current.slice();
    const t0 = performance.now();
    const settle = () => {
      current = target.slice();
      svg.setAttribute('viewBox', current.map((v) => v.toFixed(2)).join(' '));
    };
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const k = easeOut(t);
      current = from.map((v, i) => v + (target[i] - v) * k);
      svg.setAttribute('viewBox', current.map((v) => v.toFixed(2)).join(' '));
      if (t < 1) raf = requestAnimationFrame(tick);
      else settle();
    };
    raf = requestAnimationFrame(tick);
    // a frozen rAF (background tab, headless capture) must not strand the
    // viewBox half way through the move
    clearTimeout(animateTo.guard);
    animateTo.guard = setTimeout(settle, ms + 80);
  }

  /** Fit the given ISO ids, with padding, or go back to the whole world. */
  function frameTo(isos, pad = 0.42) {
    const list = [...isos].map((i) => features.get(i)).filter(Boolean);
    if (!list.length) return animateTo(full);
    const b = geoPath(projection).bounds({ type: 'FeatureCollection', features: list });
    let [[bx0, by0], [bx1, by1]] = b;
    const w = Math.max(bx1 - bx0, 40);
    const h = Math.max(by1 - by0, 26);
    const px = w * pad;
    const py = h * pad;
    bx0 -= px; by0 -= py; bx1 += px; by1 += py;
    // keep the plate's aspect so nothing squashes
    const aspect = WIDTH / height;
    let vw = bx1 - bx0;
    let vh = by1 - by0;
    if (vw / vh > aspect) vh = vw / aspect; else vw = vh * aspect;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    vw = Math.min(vw, WIDTH); vh = Math.min(vh, height);
    animateTo([
      Math.max(0, Math.min(WIDTH - vw, cx - vw / 2)),
      Math.max(0, Math.min(height - vh, cy - vh / 2)),
      vw, vh,
    ]);
  }

  return {
    svg,
    width: WIDTH,
    height,
    /** Highlight a set of ISO ids and dim the rest of our own countries. */
    highlight(isos) {
      const set = new Set(isos);
      for (const p of ours.querySelectorAll('path')) {
        p.classList.toggle('is-active', set.has(p.getAttribute('data-iso')));
      }
      for (const t of labels.querySelectorAll('[data-label-iso]')) {
        t.style.opacity = set.size && !set.has(t.getAttribute('data-label-iso')) ? 0.3 : 1;
      }
    },
    /** Show only the routes whose ids are given; pass null for all of them. */
    showRoutes(ids) {
      for (const p of routeLayer.querySelectorAll('.route')) {
        p.style.display = !ids || ids.has(p.getAttribute('data-route')) ? '' : 'none';
      }
      portLayer.style.display = ids && !ids.size ? 'none' : '';
    },
    frameTo,
    reset: () => animateTo(full),
  };
}

export async function loadMapData(base = '../shared/data') {
  const [world, iberophone, routes] = await Promise.all([
    fetch(`${base}/world-110m.json`).then((r) => r.json()),
    fetch(`${base}/iberophone.json`).then((r) => r.json()),
    fetch(`${base}/routes.json`).then((r) => r.json()),
  ]);
  return { world, iberophone, routes: routes.routes };
}
