// K · Carta Universal: ships travelling the Flota de Indias and Manila galleon routes (canvas 2D, no libraries).
// Points are fractions of the map image (x, y), hand-placed on Ribero's 1529 layout: approximate on purpose.
const stage = document.querySelector('.stage');
const cv = document.getElementById('routes');
const ctx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IMG_W = 1600, IMG_H = 686;
const ATL = '181, 64, 42';
const PAC = '47, 93, 98';

const ports = {
  Seville: [0.592, 0.225], Veracruz: [0.345, 0.33], Acapulco: [0.325, 0.385], Manila: [0.045, 0.375],
};
const routes = [
  { c: ATL, ships: 3, dur: 16000, pts: [ports.Seville, [0.575, 0.3], [0.56, 0.345], [0.5, 0.37], [0.43, 0.345], [0.385, 0.33], ports.Veracruz] },
  { c: ATL, ships: 2, dur: 17000, pts: [ports.Veracruz, [0.4, 0.29], [0.45, 0.255], [0.52, 0.24], [0.565, 0.235], ports.Seville] },
  { c: PAC, ships: 2, dur: 20000, pts: [ports.Acapulco, [0.27, 0.41], [0.18, 0.415], [0.1, 0.4], ports.Manila] },
  { c: PAC, ships: 2, dur: 24000, pts: [ports.Manila, [0.09, 0.3], [0.16, 0.22], [0.24, 0.21], [0.3, 0.27], ports.Acapulco] },
];

let box = { x: 0, y: 0, w: 1, h: 1 };
function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = stage.getBoundingClientRect();
  cv.width = r.width * dpr; cv.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const s = Math.min(r.width / IMG_W, r.height / IMG_H); // the image is object-fit: contain
  box = { w: IMG_W * s, h: IMG_H * s, x: (r.width - IMG_W * s) / 2, y: (r.height - IMG_H * s) / 2 };
  for (const rt of routes) rt.path = sample(rt.pts.map(([x, y]) => [box.x + x * box.w, box.y + y * box.h]));
}

// Catmull-Rom spline sampled into a polyline with cumulative lengths.
function sample(p) {
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(p[p.length - 1]);
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, len, total: len[len.length - 1] };
}

function at(path, u) {
  const d = Math.min(Math.max(u, 0), 1) * path.total;
  let i = 1;
  while (i < path.len.length - 1 && path.len[i] < d) i++;
  const a = path.pts[i - 1], b = path.pts[i], k = (d - path.len[i - 1]) / (path.len[i] - path.len[i - 1] || 1);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

function draw(now) {
  const r = stage.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  const s = box.w / 1400;
  for (const rt of routes) {
    ctx.setLineDash([5 * s, 6 * s]);
    ctx.strokeStyle = `rgba(${rt.c}, 0.55)`;
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    rt.path.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
    for (let n = 0; n < rt.ships; n++) {
      const u = reduce ? (n + 0.5) / rt.ships : ((now / rt.dur) + n / rt.ships) % 1;
      for (let k = 6; k >= 0; k--) { // wake
        const [x, y] = at(rt.path, u - k * 0.008);
        ctx.fillStyle = `rgba(${rt.c}, ${k ? 0.35 * (1 - k / 7) : 1})`;
        ctx.beginPath(); ctx.arc(x, y, (k ? 2.4 : 4.2) * s, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.font = `${Math.max(10, 12 * s)}px "Space Mono", monospace`;
  for (const [name, [px, py]] of Object.entries(ports)) {
    const x = box.x + px * box.w, y = box.y + py * box.h;
    const pulse = reduce ? 0 : (now / 1600) % 1;
    ctx.strokeStyle = `rgba(71, 11, 21, ${0.8 * (1 - pulse)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, (6 + pulse * 14) * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#470B15';
    ctx.beginPath(); ctx.arc(x, y, 3.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(name.toUpperCase(), x + 8 * s, y - 8 * s);
  }
  if (!reduce) requestAnimationFrame(draw);
}

size();
addEventListener('resize', () => { size(); if (reduce) draw(0); });
requestAnimationFrame(draw);
