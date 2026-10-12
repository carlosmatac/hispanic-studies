import { GlyphField } from '../shared/glyph-field.js';
import { fillAll } from '../shared/content.js';

fillAll();

const ART = '../../assets/art/';
const FONT = '"JetBrains Mono", ui-monospace, monospace';
const FLAG = { type: 'procedural', glsl: GlyphField.procedural.burgundyFlag, size: [1500, 1000] };
// palette: [unused, field, saltire, pole]
const FLAG_PAL = ['#1a0b0d', '#8a7f69', '#E3343B', '#C9A24A'];

const narrow = matchMedia('(max-width: 760px)').matches;
new GlyphField(document.getElementById('flag'), {
  source: FLAG,
  charset: ' .:1742365098',
  font: FONT,
  weight: 700,
  cell: narrow ? 9 : 12,
  background: '#0E0708',
  palette: FLAG_PAL,
  colorMode: 'source',
  fit: 'contain',
  zoom: narrow ? 0.95 : 0.78,
  focus: narrow ? [0.5, 0.3] : [0.78, 0.5],
  dither: 0.04,
  flicker: 0.35,
  mouse: { radius: 0, parallax: 0.03 },
  reveal: { mode: 'load', duration: 2.6 },
});

new GlyphField(document.getElementById('lanzas'), {
  source: { type: 'image', src: ART + 'velazquez-las-lanzas-crop-lances.jpg' },
  charset: ' .:-+*#%@',
  font: FONT,
  cell: narrow ? 6 : 8,
  background: '#0E0708',
  palette: ['#3a0a12', '#B3202A', '#C9A24A', '#F2E8D0'],
  gamma: 1.35,
  contrast: 1.15,
  focus: [0.5, 0.25],
  drift: { zoom: 0.08, pan: [0.04, 0], period: 36 },
  mouse: { radius: 150, peek: 0.9, parallax: 0.02 },
  reveal: { mode: 'scroll', start: 0.95, end: 0.25 },
});

new GlyphField(document.getElementById('tee-flag'), {
  source: FLAG,
  charset: ' .:1742365098',
  font: FONT,
  weight: 700,
  cell: 5,
  background: '#141010',
  palette: ['#141010', '#5c5243', '#C9A24A', '#141010'],
  colorMode: 'source',
  fit: 'contain',
  zoom: 1,
  flicker: 0,
  mouse: { radius: 0, parallax: 0 },
  reveal: null,
});
