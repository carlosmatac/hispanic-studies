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

   Ported unchanged in behaviour from proposals/o-atlas/map.js; it draws into
   a host element imperatively, so the React wrapper only mounts it.
   ========================================================================== */

import {
  geoEqualEarth, geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoCentroid,
} from 'd3-geo';
import { feature } from 'topojson-client';

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
  // its own two variables, so a page can set the hatch without having to
  // adopt the paper colour it was first drawn against
  el('rect', { width: 5, height: 5, fill: 'var(--hatch-bg, var(--paper, #f9f3dd))' }, hatch);
  el('path', {
    d: 'M0 0V5', 'stroke-width': 1.5,
    stroke: 'var(--hatch-ink, var(--map-submersa, #9c6a52))',
  }, hatch);

  // laid-paper lines over the water, the way an engraved plate reads
  const laid = el('pattern', {
    id: `laid-${uid}`, width: 4, height: 4, patternUnits: 'userSpaceOnUse',
  }, d);
  el('path', { d: 'M0 0H4', stroke: '#28231e', 'stroke-width': 0.35, opacity: 0.07 }, laid);

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
 * @param {string}  [opts.projection] 'equalEarth' (default) or 'orthographic'
 * @param {number}  [opts.spin]    degrees per second for an orthographic globe
 */
export function drawMap(host, data, opts = {}) {
  const { world, iberophone, routes = [] } = data;
  const o = { routes: true, labels: true, rose: true, animate: false, ...opts };
  const uid = Math.random().toString(36).slice(2, 7);

  const land = feature(world, world.objects.countries);
  const byIso = new Map(iberophone.countries.map((c) => [c.iso, c]));

  const globe = o.projection === 'orthographic';
  const projection = globe
    // a real sphere, tilted so the Atlantic faces the viewer: the hemisphere
    // that holds most of the Iberophone world
    ? geoOrthographic().rotate([40, -12, 0]).precision(0.4)
    : geoEqualEarth().rotate(ROTATE).precision(0.2);
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
      if (o.projection === 'orthographic') p.dataset.geo = JSON.stringify(f.geometry);
      el('title', {}, p).textContent =
        `${rec.name.en} — ${rec.authors} ${rec.authors === 1 ? 'author' : 'authors'} in the corpus`;
      p.setAttribute('fill', rec.tier === 'submersa' ? `url(#hatch-${uid})` : '');
      if (rec.tier === 'submersa') p.style.fill = `url(#hatch-${uid})`;
    } else {
      const q = el('path', { d }, rest);
      if (o.projection === 'orthographic') q.dataset.geo = JSON.stringify(f.geometry);
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
        if (xy) {
          const c = el('circle', { class: 'port', cx: xy[0], cy: xy[1], r: 1.7 }, portLayer);
          c.dataset.lon = w[0];
          c.dataset.lat = w[1];
        }
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
    c.dataset.lon = pt.lon;
    c.dataset.lat = pt.lat;
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
  const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

  /* --u is user units per screen pixel. Anything that should keep a fixed size
     on screen — type, hairlines, port dots — is written as
     calc(<px> * var(--u)), so it holds through both zooming and resizing and
     reads the same in the wide hero plate and the small atlas one. */
  const apply = () => {
    svg.setAttribute('viewBox', current.map((v) => v.toFixed(2)).join(' '));
    const px = svg.clientWidth || svg.getBoundingClientRect().width || WIDTH;
    svg.style.setProperty('--u', (current[2] / px).toFixed(4));
  };

  const sane = (b) => Array.isArray(b) && b.length === 4
    && b.every(Number.isFinite) && b[2] > 0 && b[3] > 0;

  function animateTo(box, ms = 450, ease = easeOut, onDone = null) {
    // A bad box must never reach the viewBox: once it does it feeds back into
    // the next interpolation and the numbers run away.
    const target = sane(box) ? box : full;
    cancelAnimationFrame(raf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!sane(current)) current = full.slice();
    let done = false;
    const finish = () => { if (!done) { done = true; if (onDone) onDone(); } };
    if (reduce || ms === 0) {
      current = target.slice();
      apply();
      finish();
      return;
    }
    const from = current.slice();
    // t0 comes from the first frame callback, not from performance.now(): the
    // two clocks are not guaranteed to share an epoch, and mixing them makes
    // the easing blow up.
    let t0 = null;
    const settle = () => {
      cancelAnimationFrame(raf);
      current = target.slice();
      apply();
      finish();
    };
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, Math.max(0, (now - t0) / ms));
      const k = ease(t);
      current = from.map((v, i) => v + (target[i] - v) * k);
      apply();
      if (t < 1) raf = requestAnimationFrame(tick);
      else settle();
    };
    raf = requestAnimationFrame(tick);
    // a frozen rAF (background tab, headless capture) must not strand the
    // viewBox half way through the move
    clearTimeout(animateTo.guard);
    animateTo.guard = setTimeout(settle, ms + 80);
  }

  /** The viewBox that fits the given ISO ids with padding, or the whole world
      when they cannot be fitted. */
  function boxFor(isos, pad = 0.42, inset = null) {
    // Only features that actually project to something: a geometry clipped
    // away by the antimeridian yields an empty box, and an empty box poisons
    // the bounds of the whole collection.
    const list = [...isos]
      .map((i) => features.get(i))
      .filter((f) => f && Number.isFinite(geoPath(projection).bounds(f)[0][0]));
    if (!list.length) return full;
    const b = geoPath(projection).bounds({ type: 'FeatureCollection', features: list });
    let [[bx0, by0], [bx1, by1]] = b;
    if (![bx0, by0, bx1, by1].every(Number.isFinite)) return full;
    const w = Math.max(bx1 - bx0, 40);
    const h = Math.max(by1 - by0, 26);
    const px = w * pad;
    const py = h * pad;
    bx0 -= px; by0 -= py; bx1 += px; by1 += py;
    return fit(bx0, by0, bx1, by1, inset);
  }

  // Keep the plate's aspect so nothing squashes; if the box does not fit,
  // show the whole world (clamping each side would break the aspect).
  // `inset` ({ l, r, t, b }, fractions of the plate) is what sits on top of
  // the map — a cartouche, a card, the hero's title band — so the target is
  // centred in the window left free, not hidden behind them. MIN_W keeps the
  // camera from coming so close that the 1:110m coastlines show their steps.
  const MIN_W = 250;
  function fit(bx0, by0, bx1, by1, inset = null) {
    const { l = 0, r = 0, t = 0, b = 0 } = inset || {};
    const fw = Math.max(0.2, 1 - l - r), fh = Math.max(0.2, 1 - t - b);
    const aspect = WIDTH / height;
    const w = bx1 - bx0, h = by1 - by0;
    let vw = Math.max(w / fw, (aspect * h) / fh, MIN_W);
    let vh = vw / aspect;
    if (vw > WIDTH || vh > height) return full;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const x0 = cx - (l + fw / 2) * vw;
    const y0 = cy - (t + fh / 2) * vh;
    return [
      Math.max(0, Math.min(WIDTH - vw, x0)),
      Math.max(0, Math.min(height - vh, y0)),
      vw, vh,
    ];
  }

  /** Fit the given ISO ids, with padding, or go back to the whole world. */
  function frameTo(isos, pad = 0.42, ms = 450) {
    animateTo(boxFor(isos, pad), ms);
  }

  /** Travel to the given ISO ids like a camera: when the way is long, first
      rise until both the place we are leaving and the one we are going to are
      in view, then come down onto it. Calls onDone on arrival. */
  function flyTo(isos, { pad = 0.42, ms = 2200, onDone = null, inset = null } = {}) {
    const target = isos && isos.length ? boxFor(isos, pad, inset) : full;
    const from = sane(current) ? current : full;
    const area = (b) => b[2] * b[3];
    const ux0 = Math.min(from[0], target[0]), uy0 = Math.min(from[1], target[1]);
    const ux1 = Math.max(from[0] + from[2], target[0] + target[2]);
    const uy1 = Math.max(from[1] + from[3], target[1] + target[3]);
    const union = fit(ux0, uy0, ux1, uy1);
    const far = area(union) > 2.2 * Math.max(area(from), area(target));
    if (!far) return animateTo(target, ms, easeInOut, onDone);
    // pull back a little further than the bare union, so the rise reads
    const up = fit(...grow(union, 1.15));
    animateTo(up, ms * 0.45, easeInOut, () => animateTo(target, ms * 0.55, easeInOut, onDone));
  }
  const grow = ([x, y, w, h], k) => [x - (w * (k - 1)) / 2, y - (h * (k - 1)) / 2, x + w + (w * (k - 1)) / 2, y + h + (h * (k - 1)) / 2];

  window.addEventListener('resize', apply, { passive: true });
  apply();

  /* A turning globe has to redraw: the projection changes under every path.
     Three things keep that affordable — the geometries are parsed once rather
     than per frame, the turn is capped well below the frame rate (a slow turn
     reads better anyway), and the loop stops entirely whenever the globe is
     off screen, so scrolling the rest of the page costs nothing. */
  if (globe && o.spin && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const shapes = [...plate.querySelectorAll('path[data-geo]')].map((el) => {
      const geometry = JSON.parse(el.dataset.geo);
      delete el.dataset.geo;
      return { el, geometry };
    });
    const routeGeo = [...routeLayer.querySelectorAll('.route')]
      .map((el, n) => ({ el, geometry: greatCircle(routes[n].waypoints) }));
    const dots = [...portLayer.querySelectorAll('circle'), ...pins.querySelectorAll('circle')]
      .map((el) => ({ el, lonlat: [+el.dataset.lon, +el.dataset.lat] }));

    let lon = 40;
    let last = 0;
    let running = false;
    let raf2 = 0;

    const frame = (now) => {
      if (!running) return;
      raf2 = requestAnimationFrame(frame);
      if (now - last < 66) return;                 // ~15fps is plenty for this
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      lon = (lon + o.spin * Math.min(dt, 0.2)) % 360;
      projection.rotate([lon, -12, 0]);
      for (const sh of shapes) sh.el.setAttribute('d', path(sh.geometry) || '');
      for (const r of routeGeo) r.el.setAttribute('d', path(r.geometry) || '');
      for (const d of dots) {
        const xy = projection(d.lonlat);
        d.el.style.display = xy ? '' : 'none';
        if (xy) { d.el.setAttribute('cx', xy[0]); d.el.setAttribute('cy', xy[1]); }
      }
    };

    const setRunning = (on) => {
      if (on === running) return;
      running = on;
      if (on) { last = 0; raf2 = requestAnimationFrame(frame); } else cancelAnimationFrame(raf2);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.05 })
        .observe(host);
    }
    // IntersectionObserver may not deliver before the first paint, and it is
    // not the only thing that can keep the loop from starting, so bound it:
    // check once on a timer and let scrolling correct it from there.
    const check = () => {
      const r = host.getBoundingClientRect();
      setRunning(r.bottom > 0 && r.top < window.innerHeight);
    };
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 300);
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
    flyTo,
    reset: (ms = 450) => animateTo(full, ms),
    /** Unmount: stop listening and clear the host. */
    destroy() {
      window.removeEventListener('resize', apply);
      cancelAnimationFrame(raf);
      host.textContent = '';
    },
  };
}

export async function loadMapData(base = '/data') {
  const [world, iberophone, routes] = await Promise.all([
    fetch(`${base}/world-110m.json`).then((r) => r.json()),
    fetch(`${base}/iberophone.json`).then((r) => r.json()),
    fetch(`${base}/routes.json`).then((r) => r.json()),
  ]);
  return { world, iberophone, routes: routes.routes };
}
