import { GlyphField } from '../shared/glyph-field.js';
import { fillAll } from '../shared/content.js';

fillAll();

const ART = '../../assets/art/';
const GALLEON = {
  type: 'procedural',
  glsl: GlyphField.procedural.galleonSea,
  image: ART + 'galleon-cabrera-bueno-1734.jpg',
  crop: [0.19, 0.13, 0.84, 0.86],
  size: [480, 493],
};
const narrow = matchMedia('(max-width: 760px)').matches;

// palette: [unused, sea, ship]
new GlyphField(document.getElementById('galleon'), {
  source: GALLEON,
  charset: ' .·:;-~=+*o%',
  font: '"IBM Plex Mono", ui-monospace, monospace',
  weight: 500,
  cell: narrow ? 6 : 8,
  background: '#0B1B2B',
  palette: ['#0B1B2B', '#5B82A8', '#E9E1CC'],
  colorMode: 'source',
  fit: 'contain',
  zoom: narrow ? 0.9 : 0.86,
  focus: narrow ? [0.5, 0.2] : [0.62, 0.5],
  flicker: 0.3,
  mouse: { radius: 0, parallax: 0.025 },
  reveal: { mode: 'load', duration: 2.8 },
});

new GlyphField(document.getElementById('tee'), {
  source: GALLEON,
  charset: ' ·:;+=*#',
  cell: 3,
  background: '#0B1B2B',
  palette: ['#0B1B2B', '#2c4762', '#B8C2CC'],
  colorMode: 'source',
  fit: 'contain',
  flicker: 0,
  mouse: { radius: 0, parallax: 0 },
  reveal: null,
});

const year = document.getElementById('year');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const t0 = performance.now();
  const tick = (now) => {
    const p = ((now - t0) / 9000) % 1;
    year.textContent = String(Math.round(1565 + p * 250));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
