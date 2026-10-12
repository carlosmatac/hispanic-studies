// I · Códice: a quill-ink trail that follows the cursor (canvas 2D, no libraries).
const hero = document.querySelector('.hero');
const cv = document.getElementById('ink');
const ctx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '30, 26, 22';
const RED = '163, 36, 43';
const LIFE = 3200; // ms until the ink has faded
const segs = []; // {ax, ay, bx, by, w, t, red}
let w = 0, h = 0, last = null, lastMove = -1e9, auto = null;

function size() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = hero.getBoundingClientRect();
  w = r.width; h = r.height;
  cv.width = w * dpr; cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function add(p) {
  if (last && p.t - last.t < 200) {
    const d = Math.hypot(p.x - last.x, p.y - last.y);
    if (d < 1.5) return;
    const v = d / Math.max(1, p.t - last.t); // px per ms
    const width = Math.max(1.1, 7.5 - v * 3.2);
    segs.push({ ax: last.x, ay: last.y, bx: p.x, by: p.y, w: width, t: p.t, red: false });
    if (v < 0.35 && Math.random() < 0.05) {
      segs.push({ ax: p.x + (Math.random() - 0.5) * 10, ay: p.y + 4 + Math.random() * 8, bx: 0, by: 0, w: 2 + Math.random() * 4, t: p.t, red: true });
    }
    if (segs.length > 1400) segs.splice(0, segs.length - 1400);
  }
  last = p;
}

hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  lastMove = performance.now();
  auto = null;
  add({ x: e.clientX - r.left, y: e.clientY - r.top, t: lastMove });
});
hero.addEventListener('pointerleave', () => { last = null; });

// Idle: draw a Nahua speech scroll (volute) next to the folio.
function idle(now) {
  if (!auto) {
    const f = document.querySelector('.folio').getBoundingClientRect();
    const r = hero.getBoundingClientRect();
    auto = { cx: f.left - r.left - 30 - Math.random() * 120, cy: f.top - r.top + f.height * (0.25 + Math.random() * 0.5), t0: now };
    last = null;
  }
  const k = (now - auto.t0) / 2600; // one scroll every 2.6 s
  if (k > 1.25) { auto = null; return; }
  if (k > 1) return; // short pause between scrolls
  const a = k * Math.PI * 3.2;
  const rad = 70 * (1 - k * 0.8);
  add({ x: auto.cx + Math.cos(a) * rad - k * 60, y: auto.cy - Math.sin(a) * rad * 0.85, t: now });
}

function frame(now) {
  if (now - lastMove > 1800) idle(now);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  let i = 0;
  while (i < segs.length && now - segs[i].t > LIFE) i++;
  if (i) segs.splice(0, i);
  for (const s of segs) {
    const age = (now - s.t) / LIFE;
    const a = Math.pow(1 - age, 1.6) * 0.9;
    if (s.red) {
      ctx.fillStyle = `rgba(${RED}, ${a})`;
      ctx.beginPath(); ctx.arc(s.ax, s.ay, s.w, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(${INK}, ${a})`;
      ctx.lineWidth = s.w * (1 - age * 0.35);
      ctx.beginPath(); ctx.moveTo(s.ax, s.ay); ctx.lineTo(s.bx, s.by); ctx.stroke();
    }
  }
  requestAnimationFrame(frame);
}

if (!reduce) {
  size();
  addEventListener('resize', size);
  requestAnimationFrame(frame);
}
