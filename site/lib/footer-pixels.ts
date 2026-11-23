import { BASES, type Base } from '@/lib/palette';

/* The footer's ground (issue #106, after algoreto.com's footer): our generated
   film of a Spanish tercio on the march and a ship off the Pillars of Hercules
   (public/video/footer-film.mp4; assets/art/SOURCES.md), shown as discrete
   pixels in the brand's dark colours at low contrast
   (components/FooterPixels.tsx). The subject must read through the pixels
   (the pikes, the banner, the helmets; the hull and the sails) and the footer
   must stay quiet: brand colours only, the text on top perfectly readable.

   Every knob is here:
   - cell: the size of a pixel, in CSS px (a pixel is one canvas pixel scaled
     up by the browser, so the screen's DPR costs nothing); cellNarrow on a
     footer under 600 px wide, so a phone still gets enough pixels to read.
   - ramp: the colours, dark to light, as brand colours or mixes of two of them
     (sRGB, as color-mix() does). A cell's brightness picks a step.
   - contrast: 0..1, how far the steps sit from the footer's ground (0 = a flat
     ground, 1 = the ramp as written). Lower = quieter.
   - window: the share of darkest and lightest cells clipped when each frame's
     levels are set (eased over a second or so, so the cuts don't flash).
   - dither: 0..1, a 4×4 ordered (Bayer) dither between steps.
   - speed: the film's playback rate (it is encoded at half speed already);
     fps: the most redraws a second.
   - veil: 0..1, how much of the ground lies over the pixels behind the
     bottom line (the band above it has none).
   - focus: [x, y], 0..1, the point of the frame kept in view when the film
     is cropped to its window (the band under the links, down to the foot of
     the page; its height is .foot__field's in globals.css). Above the window
     the ground stays plain, and the film dissolves into it, pixel by pixel. */

export type Mix = Base | { a: Base; p: number; b: Base };

export const FOOTER = {
  cell: 5,
  cellNarrow: 4,
  ramp: [
    { a: 'burgundy-dark', p: 60, b: 'ink' },
    'burgundy-dark',
    'burgundy',
    { a: 'burgundy', p: 70, b: 'leather' },
    { a: 'burgundy', p: 45, b: 'leather' },
    'leather',
  ] as Mix[],
  contrast: 0.6,
  window: [0.02, 0.98] as [number, number],
  dither: 0.5,
  speed: 1,
  fps: 12,
  veil: 0.4,
  focus: [0.58, 0.5] as [number, number],
};

/** the footer's ground: burgundy deepened toward burgundy-dark (the ramp's middle, so the pixels fade in without a jump) */
export const GROUND: Mix = { a: 'burgundy', p: 55, b: 'burgundy-dark' };

/** the film and its still (the still is what reduced motion, Save-Data and a failed film show, pixelated the same way) */
export const FOOTER_FILM = { src: '/video/footer-film.mp4', still: '/video/footer-film.jpg' };

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

export function mixRgb(m: Mix): [number, number, number] {
  if (typeof m === 'string') return rgb(BASES[m]);
  const [a, b] = [rgb(BASES[m.a]), rgb(BASES[m.b])];
  return a.map((v, i) => Math.round((v * m.p + b[i] * (100 - m.p)) / 100)) as [number, number, number];
}

/** the ramp as it is drawn: each step pulled toward the ground by (1 - contrast) */
export function rampRgb(): [number, number, number][] {
  const g = mixRgb(GROUND);
  return FOOTER.ramp.map((m) => mixRgb(m).map((c, i) => Math.round(g[i] + (c - g[i]) * FOOTER.contrast)) as [number, number, number]);
}
