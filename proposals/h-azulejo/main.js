// H · Azulejo: a generative Talavera wall built from the IHS eagle and the Cross of Burgundy (canvas 2D).
// Tiles start as bisque (fired clay with the pencil sketch); the cursor glazes them in cobalt on tin-white, and the
// glaze stays. Corner quarter-rosettes join across four tiles, like real azulejos. Reduced motion: fully glazed, still.

const canvas = document.getElementById('tiles');
const ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const C = { glaze: '#F6F3EA', cobalt: '#1F3E8C', cobalt2: '#3B63B8', yellow: '#E0A526', burgundy: '#470B15', bisque: '#D8B193', pencil: 'rgba(60, 45, 40, 0.38)' };

const logo = new Image();
logo.src = '../../assets/brand/ihs-logo-mask.png';

let S = 120, dpr = 1, cols = 0, rows = 0, W = 0, H = 0;
let sprites = null;
let tiles = [];

function tinted(img, color, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, w, h);
  return c;
}

// one tile face; glazed = colour, otherwise pencil lines on bisque
function drawTile(kind, glazed, s) {
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  const line = glazed ? C.cobalt : C.pencil;
  x.fillStyle = glazed ? C.glaze : C.bisque;
  x.fillRect(0, 0, s, s);
  if (!glazed) {
    // clay speckle
    for (let i = 0; i < s * 1.2; i++) {
      x.fillStyle = `rgba(120, 70, 50, ${Math.random() * 0.12})`;
      x.fillRect(Math.random() * s, Math.random() * s, 1.2, 1.2);
    }
  }
  const stroke = (w, col) => { x.lineWidth = w; x.strokeStyle = col; x.stroke(); };
  const fill = (col) => { x.fillStyle = col; x.fill(); };
  // corner quarter-rosettes (join into full rosettes across four tiles)
  for (const [cx, cy] of [[0, 0], [s, 0], [0, s], [s, s]]) {
    x.beginPath(); x.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
    glazed ? fill(C.cobalt) : stroke(1.2, line);
    x.beginPath(); x.arc(cx, cy, s * 0.21, 0, Math.PI * 2);
    glazed ? fill(C.glaze) : stroke(1, line);
    x.beginPath(); x.arc(cx, cy, s * 0.14, 0, Math.PI * 2);
    glazed ? fill(C.yellow) : stroke(1, line);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      x.beginPath(); x.ellipse(cx + Math.cos(a) * s * 0.255, cy + Math.sin(a) * s * 0.255, s * 0.03, s * 0.018, a, 0, Math.PI * 2);
      glazed ? fill(C.glaze) : stroke(0.8, line);
    }
  }
  // fine frame and mid-edge buds
  x.beginPath(); x.rect(s * 0.06, s * 0.06, s * 0.88, s * 0.88);
  stroke(glazed ? s * 0.012 : 1, glazed ? C.cobalt2 : line);
  for (const [mx, my] of [[s / 2, 0], [s / 2, s], [0, s / 2], [s, s / 2]]) {
    x.beginPath(); x.arc(mx, my, s * 0.07, 0, Math.PI * 2);
    glazed ? fill(C.cobalt2) : stroke(1, line);
  }
  // central medallion
  x.beginPath(); x.arc(s / 2, s / 2, s * 0.27, 0, Math.PI * 2);
  glazed ? (fill(C.glaze), stroke(s * 0.018, C.cobalt)) : stroke(1, line);
  if (kind === 'eagle') {
    const w = s * 0.4, h = w * 567 / 800;
    if (glazed) x.drawImage(sprites.eagleBlue, s / 2 - w / 2, s / 2 - h / 2, w, h);
    else { x.globalAlpha = 0.55; x.drawImage(sprites.eaglePencil, s / 2 - w / 2, s / 2 - h / 2, w, h); x.globalAlpha = 1; }
  } else {
    // Cross of Burgundy: two ragged branches in a saltire
    x.save(); x.translate(s / 2, s / 2);
    for (const r of [Math.PI / 4, -Math.PI / 4]) {
      x.save(); x.rotate(r);
      x.beginPath(); x.rect(-s * 0.2, -s * 0.026, s * 0.4, s * 0.052);
      glazed ? fill(C.burgundy) : stroke(1, line);
      for (let k = -2; k <= 2; k++) {
        if (k === 0) continue;
        x.beginPath(); x.rect(k * s * 0.07 - s * 0.012, -s * 0.05, s * 0.024, s * 0.1);
        glazed ? fill(C.burgundy) : stroke(0.8, line);
      }
      x.restore();
    }
    x.restore();
  }
  if (glazed) {
    // a soft pooled highlight, like tin glaze
    const g = x.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    g.addColorStop(1, 'rgba(0, 0, 40, 0.06)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  }
  return c;
}

function build() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  S = W < 700 ? 92 : 128;
  cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1;
  const px = Math.round(S * dpr);
  const lw = Math.round(px * 0.4), lh = Math.round(lw * 567 / 800);
  sprites = { eagleBlue: tinted(logo, C.cobalt, lw, lh), eaglePencil: tinted(logo, 'rgb(60, 45, 40)', lw, lh) };
  sprites.eagle = [drawTile('eagle', false, px), drawTile('eagle', true, px)];
  sprites.cross = [drawTile('cross', false, px), drawTile('cross', true, px)];
  const old = tiles;
  tiles = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const prev = old.find((t) => t.i === i && t.j === j);
    tiles.push(prev || { i, j, g: reduced ? 1 : 0, target: reduced ? 1 : 0, ox: 0.5, oy: 0.5 });
  }
  if (!reduced && !old.length) {
    // a first band glazes itself so the wall reads at once
    tiles.forEach((t) => { if (Math.abs(t.i - t.j - Math.floor(cols * 0.45)) < 2) { t.target = 1; t.delay = (t.i + t.j) * 60; } });
  }
}

const mouse = { x: -1e4, y: -1e4, active: false };
addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
}, { passive: true });

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#e9e1d2';
  ctx.fillRect(0, 0, W, H);
  const R = S * 1.1;
  for (const t of tiles) {
    const x = t.i * S, y = t.j * S;
    if (mouse.active && t.target < 1) {
      const dx = mouse.x - (x + S / 2), dy = mouse.y - (y + S / 2);
      if (dx * dx + dy * dy < R * R) { t.target = 1; t.ox = Math.min(1, Math.max(0, (mouse.x - x) / S)); t.oy = Math.min(1, Math.max(0, (mouse.y - y) / S)); t.delay = 0; t.start = now; }
    }
    if (t.target > t.g) {
      if (t.start === undefined) t.start = now;
      if (now - t.start > (t.delay || 0)) t.g = Math.min(1, t.g + 0.035);
    }
    const [bisque, glazed] = (t.i + t.j) % 2 ? sprites.cross : sprites.eagle;
    if (t.g < 1) ctx.drawImage(bisque, x, y, S, S);
    if (t.g > 0) {
      ctx.save();
      if (t.g < 1) { ctx.beginPath(); ctx.arc(x + t.ox * S, y + t.oy * S, t.g * S * 1.45, 0, Math.PI * 2); ctx.clip(); }
      ctx.drawImage(glazed, x, y, S, S);
      ctx.restore();
    }
  }
  // grout
  ctx.strokeStyle = 'rgba(120, 104, 90, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= cols; i++) { ctx.moveTo(i * S + 0.5, 0); ctx.lineTo(i * S + 0.5, H); }
  for (let j = 0; j <= rows; j++) { ctx.moveTo(0, j * S + 0.5); ctx.lineTo(W, j * S + 0.5); }
  ctx.stroke();
  // wet sheen that follows the cursor over the glaze
  if (mouse.active) {
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, S * 1.6);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(mouse.x - S * 2, mouse.y - S * 2, S * 4, S * 4);
  }
  if (!reduced) requestAnimationFrame(draw);
}

logo.onload = () => {
  build();
  addEventListener('resize', () => { build(); if (reduced) requestAnimationFrame(draw); });
  requestAnimationFrame(draw);
};
