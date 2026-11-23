import { BASES, type Base } from '@/lib/palette';

/* The footer's ground (issue #106, after algoreto.com's footer): a slow film
   of our own, shown as discrete pixels quantised to the brand's dark colours
   at low contrast, so it reads as a living texture, not as a video
   (components/FooterPixels.tsx).

   Every knob is here, so we can iterate quickly. Three variants to compare;
   in `next dev`, `?footerVariant=1|2|3` picks one (the production site always
   shows DEFAULT_VARIANT).

   - cell: the size of a pixel, in CSS px (a pixel is one canvas pixel, scaled
     up by the browser, so the screen's DPR costs nothing).
   - ramp: the colours, dark to light, as brand colours or mixes of two of them
     (sRGB, as color-mix() does). The film's brightness picks a step.
   - contrast: 0..1, how far the steps sit from the footer's ground (0 = a flat
     ground, 1 = the ramp as written). Low = discreet.
   - levels: the film's luminance window [black, white] before it is mapped;
     with auto, the window follows each frame instead (its 3rd and 97th
     percentiles, eased over a second or so), so a dark painting and a pale
     plan weave the same density of pixels and the footer never dims.
   - dither: 0..1, a 4×4 ordered (Bayer) dither between steps, so gradients
     come out as a weave of pixels instead of bands.
   - speed: the film's playback rate (1 = as encoded); fps: how often the
     pixels are redrawn (a cap, the film is encoded at 15).
   - grid: 0..1, a hairline between pixels in the ground colour (mosaic).
   - veil: 0..1, how much of the ground lies over the pixels behind the text
     (the band under the links is always a little clearer). */

export type Mix = Base | { a: Base; p: number; b: Base };
export type FooterVariant = {
  name: string;
  cell: number;
  ramp: Mix[];
  contrast: number;
  levels: [number, number];
  auto: boolean;
  dither: number;
  speed: number;
  fps: number;
  grid: number;
  veil: number;
};

/** the footer's ground: burgundy deepened toward burgundy-dark (the mean of the ramps, so the pixels fade in without a jump) */
export const GROUND: Mix = { a: 'burgundy', p: 55, b: 'burgundy-dark' };

export const FOOTER_VARIANTS: Record<1 | 2 | 3, FooterVariant> = {
  // 1 · Grain: small pixels, five steps from ink to leather, a fine weave
  1: {
    name: 'grain',
    cell: 6,
    ramp: [{ a: 'burgundy-dark', p: 70, b: 'ink' }, 'burgundy-dark', 'burgundy', { a: 'burgundy', p: 62, b: 'leather' }, { a: 'leather', p: 80, b: 'burgundy' }],
    contrast: 0.42,
    levels: [0.12, 0.92],
    auto: true,
    dither: 0.9,
    speed: 0.6,
    fps: 15,
    grid: 0,
    veil: 0.55,
  },
  // 2 · Mosaic: medium pixels with a hairline between them, four steps, a little more contrast
  2: {
    name: 'mosaic',
    cell: 10,
    ramp: ['ink', 'burgundy-dark', 'burgundy', { a: 'burgundy', p: 55, b: 'leather' }],
    contrast: 0.5,
    levels: [0.15, 0.9],
    auto: true,
    dither: 0.6,
    speed: 0.5,
    fps: 12,
    grid: 0.55,
    veil: 0.5,
  },
  // 3 · Tessera: large tiles, three steps with a breath of paper in the light one, the slowest and calmest
  3: {
    name: 'tessera',
    cell: 18,
    ramp: ['burgundy-dark', 'burgundy', { a: 'burgundy', p: 78, b: 'paper' }],
    contrast: 0.34,
    levels: [0.18, 0.88],
    auto: true,
    dither: 0.45,
    speed: 0.35,
    fps: 10,
    grid: 0.8,
    veil: 0.4,
  },
};

export const DEFAULT_VARIANT: 1 | 2 | 3 = 1;

/** the film and its still (the still is what reduced motion, Save-Data and a failed film show, pixelated the same way) */
export const FOOTER_FILM = { src: '/video/footer-loop.mp4', still: '/video/footer-loop.jpg' };

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

export function mixRgb(m: Mix): [number, number, number] {
  if (typeof m === 'string') return rgb(BASES[m]);
  const [a, b] = [rgb(BASES[m.a]), rgb(BASES[m.b])];
  return a.map((v, i) => Math.round((v * m.p + b[i] * (100 - m.p)) / 100)) as [number, number, number];
}

export const cssRgb = (c: [number, number, number]) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

/** the ramp as it is drawn: each step pulled toward the ground by (1 - contrast) */
export function rampRgb(v: FooterVariant): [number, number, number][] {
  const g = mixRgb(GROUND);
  return v.ramp.map((m) => mixRgb(m).map((c, i) => Math.round(g[i] + (c - g[i]) * v.contrast)) as [number, number, number]);
}
