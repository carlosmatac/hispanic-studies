const film = document.getElementById('film');
const hero = document.querySelector('.hero');
const caption = document.getElementById('caption');
const bars = [...document.querySelectorAll('.progress i')];

// Shot cuts measured on the clip (ffmpeg scene detection): 0, 2.0, 3.92, 5.25, end 7.25 s.
const SHOTS = [
  { t: 0, label: 'I · The road · Flanders, 1620s' },
  { t: 2.0, label: 'II · The morions' },
  { t: 3.92, label: 'III · The pike square' },
  { t: 5.25, label: 'IV · The dust' },
];
const END = 7.25;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduce) film.removeAttribute('autoplay'), film.pause();

let current = -1;
const tick = () => {
  const t = film.currentTime;
  const i = SHOTS.findLastIndex((s) => t >= s.t);
  if (i !== current) {
    current = i;
    caption.textContent = SHOTS[i].label;
  }
  bars.forEach((b, k) => {
    const start = SHOTS[k].t;
    const end = SHOTS[k + 1]?.t ?? END;
    b.style.width = `${Math.min(1, Math.max(0, (t - start) / (end - start))) * 100}%`;
  });
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

const sound = document.getElementById('sound');
sound.addEventListener('click', () => {
  film.muted = !film.muted;
  sound.setAttribute('aria-pressed', String(!film.muted));
  sound.textContent = film.muted ? 'Sound off' : 'Sound on';
  if (!film.muted) film.play();
});

// Glyph mode: the same clip through our engine (castle.tech look), created on first use.
let field = null;
const glyph = document.getElementById('glyph');
const toggleGlyph = async () => {
  const on = !hero.classList.contains('is-glyph');
  if (on && !field) {
    const { GlyphField } = await import('../shared/glyph-field.js');
    field = new GlyphField(document.getElementById('glyphs'), {
      source: { type: 'video', src: '../../assets/video/tercio-720.mp4' },
      charset: ' .:-=+*#%@',
      font: '"JetBrains Mono", monospace',
      cell: matchMedia('(max-width: 760px)').matches ? 6 : 8,
      background: '#0E0708',
      palette: ['#470B15', '#B3202A', '#C9A24A', '#F2E8D0'],
      focus: [0.5, 0.45],
      contrast: 1.15,
      flicker: 0.25,
      mouse: { radius: 170, peek: 1, parallax: 0 },
      reveal: { mode: 'load', duration: 1.6 },
    });
  }
  hero.classList.toggle('is-glyph', on);
  glyph.setAttribute('aria-pressed', String(on));
};
glyph.addEventListener('click', toggleGlyph);
addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'g') toggleGlyph(); });
