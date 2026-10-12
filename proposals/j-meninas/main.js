// J · Meninas: three-layer mouse parallax with CSS 3D transforms (no libraries).
const hero = document.querySelector('.hero');
const bg = document.querySelector('.layer--bg');
const paint = document.querySelector('.layer--paint');
const fg = document.querySelector('.layer--fg');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 600px)');
let tx = 0, ty = 0, x = 0, y = 0, lastMove = -1e9;

hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  tx = ((e.clientX - r.left) / r.width) * 2 - 1;
  ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  lastMove = performance.now();
});

function frame(now) {
  if (now - lastMove > 2500) { // idle: a slow figure-of-eight, like someone pacing the room
    const t = now / 5200;
    tx = Math.sin(t) * 0.6;
    ty = Math.sin(t * 2) * 0.3;
  }
  x += (tx - x) * 0.06;
  y += (ty - y) * 0.06;
  bg.style.transform = `translate3d(${x * 22}px, ${y * 14}px, 0) scale(1.04)`;
  const base = small.matches ? 'translateX(50%) ' : '';
  paint.style.transform = `${base}translate3d(${x * -10}px, ${y * -6}px, 0) rotateY(${x * 6}deg) rotateX(${y * -4}deg)`;
  paint.style.setProperty('--gx', `${50 - x * 45}%`);
  paint.style.setProperty('--gy', `${40 - y * 35}%`);
  fg.style.transform = `translate3d(${x * -34}px, ${y * -22}px, 0)`;
  requestAnimationFrame(frame);
}

if (!reduce) requestAnimationFrame(frame);
