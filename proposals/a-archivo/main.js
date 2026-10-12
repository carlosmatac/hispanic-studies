import { GlyphField } from '../shared/glyph-field.js';
import { fillAll } from '../shared/content.js';

fillAll();

const ART = '../../assets/art/';
const INK = { background: '#F3EAD3', palette: ['#B8923A', '#8B2E2E', '#470B15'] };

const hero = document.getElementById('guadalupe');
const CELL = 6;
new GlyphField(hero, {
  source: { type: 'image', src: ART + 'guadalupe-tilma.jpg', crop: [0.02, 0.01, 0.98, 0.99] },
  charset: ' .·:-=+*135#%@',
  cell: CELL,
  ...INK,
  invert: true,
  fit: 'contain',
  gamma: 1.15,
  contrast: 1.3,
  local: 1.8,
  shimmer: 0.25,
  flicker: 0.25,
  drift: { zoom: 0.035, period: 22 },
  mouse: { radius: 120, peek: 1, parallax: 0.01 },
  reveal: { mode: 'load', duration: 3 },
});

const count = document.getElementById('glyph-count');
const updateCount = () => {
  const n = Math.floor(hero.clientWidth / CELL) * Math.floor(hero.clientHeight / CELL);
  count.textContent = n.toLocaleString('en-US');
};
new ResizeObserver(updateCount).observe(hero);

new GlyphField(document.getElementById('poster'), {
  source: { type: 'image', src: ART + 'guadalupe-tilma.jpg' },
  charset: ' .:-=+*#%@',
  cell: 4,
  ...INK,
  invert: true,
  fit: 'cover',
  gamma: 1.15,
  flicker: 0,
  mouse: { radius: 0, parallax: 0 },
  reveal: { mode: 'scroll', start: 1, end: 0.5 },
});
