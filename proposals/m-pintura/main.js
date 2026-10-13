// Four paintings, each with its own text colours, layout and copy. Keys 1–4 or ← → switch them.
const SCENES = [
  {
    layout: 'center', shift: '-12svh', fadeA: '84%', fadeB: '97%', ink: '#3a0912', accent: '#470B15', muted: 'rgba(58, 9, 18, 0.7)', base: '#BFAB92', base2: '#a99377', field: 'rgba(255, 250, 240, 0.55)', veil: 'rgba(245, 235, 220, 0.45)',
    focus: '62% 100%', eyebrow: 'Institute for Hispano Studies', title: 'Under the same <em>sky.</em>',
    sub: 'From Castile to California: discover 200 years of Hispanic reunification thought in our free pamphlet.',
  },
  {
    layout: 'wordmark', ink: '#F1EADB', accent: '#E8C27A', muted: 'rgba(241, 234, 219, 0.72)', base: '#595A4D', base2: '#3f4037', field: 'rgba(20, 22, 18, 0.35)', veil: 'rgba(25, 27, 22, 0.3)',
    focus: '78% 50%', eyebrow: 'A lantern in the fog since 1565', title: 'Hispano <em>Studies</em>',
    sub: 'Films, books and translations that light the way back to a shared civilization.',
  },
  {
    layout: 'bottom', fadeA: '62%', fadeB: '86%', ink: '#FBF3E6', accent: '#F2B8A0', muted: 'rgba(251, 243, 230, 0.78)', base: '#533D3A', base2: '#3b2a28', field: 'rgba(40, 22, 20, 0.35)', veil: 'rgba(45, 25, 20, 0.45)',
    focus: '70% 50%', eyebrow: 'Hispanic America, on American soil', title: 'Before the United States, <em>the missions.</em>',
    sub: 'Saint Augustine, Santa Fe, San Antonio, California. Get the free pamphlet on 200 years of Hispanic reunification.',
  },
  {
    layout: 'horizon', ink: '#FFF6E6', accent: '#F0C674', muted: 'rgba(255, 246, 230, 0.8)', base: '#756855', base2: '#574c3d', field: 'rgba(30, 24, 16, 0.3)', veil: 'rgba(50, 35, 15, 0.42)',
    focus: '50% 50%', eyebrow: 'Non plus ultra → Plus Ultra', title: 'Beyond the <em>pillars.</em>',
    sub: 'The Hispanic world began where the old one ended. Read where it goes next.',
  },
];

const root = document.documentElement;
const scenes = [...document.querySelectorAll('.scene')];
const buttons = [...document.querySelectorAll('#switcher button')];
const copy = document.getElementById('copy');
const els = { eyebrow: document.getElementById('eyebrow'), title: document.getElementById('title'), sub: document.getElementById('sub') };
let current = -1;

function show(i) {
  i = (i + SCENES.length) % SCENES.length;
  if (i === current) return;
  const s = SCENES[i];
  const first = current === -1;
  current = i;
  scenes.forEach((el, k) => el.classList.toggle('is-active', k === i));
  buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  for (const k of ['ink', 'accent', 'muted', 'base', 'base2', 'field', 'focus', 'shift', 'fadeA', 'fadeB', 'veil']) {
    if (s[k]) root.style.setProperty(`--${k}`, s[k]);
    else root.style.removeProperty(`--${k}`);
  }
  root.dataset.scene = i;
  const apply = () => {
    copy.dataset.layout = s.layout;
    els.eyebrow.textContent = s.eyebrow;
    els.title.innerHTML = s.title;
    els.sub.textContent = s.sub;
    copy.classList.remove('is-out');
  };
  if (first) return apply();
  copy.classList.add('is-out');
  setTimeout(apply, 450);
}

buttons.forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
addEventListener('keydown', (e) => {
  if (e.target.closest('input')) return;
  if (e.key >= '1' && e.key <= String(SCENES.length)) show(+e.key - 1);
  else if (e.key === 'ArrowRight') show(current + 1);
  else if (e.key === 'ArrowLeft') show(current - 1);
});
show(+(new URLSearchParams(location.search).get('s') || 0));

// Cursor: gentle parallax on the painting and a warm lamp following the pointer.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const stage = document.getElementById('stage');
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', (e) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
    root.style.setProperty('--lx', `${e.clientX}px`);
    root.style.setProperty('--ly', `${e.clientY + scrollY}px`);
  }, { passive: true });
  const loop = () => {
    x += (tx - x) * 0.05;
    y += (ty - y) * 0.05;
    stage.style.setProperty('--px', `${(-x * 18).toFixed(2)}px`);
    stage.style.setProperty('--py', `${(-y * 12).toFixed(2)}px`);
    requestAnimationFrame(loop);
  };
  loop();
}
