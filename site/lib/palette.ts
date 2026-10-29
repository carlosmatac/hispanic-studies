import type { CSSProperties } from 'react';

/* The colours a region of the archive may wear (issue #69). A fixed set: the
   back office offers only the swatches no other region uses, and the server
   refuses a duplicate. Each swatch is one of the brand's own colours
   (globals.css) or a color-mix() of two of them, plus the two muted hues the
   archive already wore when it moved to the database (sea and olive, #68).

   The rule, checked by `npm run palette:check` (scripts/check-palette.ts):
   - every pair of swatches is at least 0.08 apart in OKLab (ΔE_ok; about four
     times the smallest difference the eye notices), so two regions never look
     alike on the shelf;
   - the card's text (paper on the dark swatches, ink on the light ones) has a
     contrast of at least 4.5:1 (WCAG AA for small text).
   The `mix` recipes are what the check computes; the `bg` strings are what the
   browser draws, and they must say the same thing. */

export type Base = 'burgundy' | 'burgundy-dark' | 'leather' | 'paper' | 'paper-deep' | 'ink';

export const BASES: Record<Base, string> = {
  burgundy: '#470b15',
  'burgundy-dark': '#2f070d',
  leather: '#8b5e4b',
  paper: '#f9f3dd',
  'paper-deep': '#ede3c8',
  ink: '#28231e',
};

export type Swatch = {
  id: string;
  name: { en: string; es: string };
  /** how the colour is made: a hex, or `a` p% mixed with `b` (sRGB, as color-mix() does) */
  mix: { hex: string } | { a: Base | string; p: number; b: Base | string };
  /** the card's ground, as CSS */
  bg: string;
  /** the card's text colour */
  fg: 'paper' | 'ink';
  /** small details on the card (the rule, the country code) */
  accent: string;
  /** hairlines on the card */
  line: string;
  /** carried over from the archive's first version (#68), not a mix of the brand colours */
  legacy?: boolean;
};

const onDark = { line: 'color-mix(in srgb, var(--paper) 26%, transparent)' };

export const SWATCHES: Swatch[] = [
  {
    id: 'burgundy', name: { en: 'Burgundy', es: 'Burdeos' },
    mix: { hex: BASES.burgundy }, bg: 'var(--burgundy)', fg: 'paper',
    accent: 'color-mix(in srgb, var(--paper) 78%, var(--leather))', line: 'color-mix(in srgb, var(--paper) 28%, transparent)',
  },
  {
    id: 'leather', name: { en: 'Leather', es: 'Cuero' },
    mix: { hex: BASES.leather }, bg: 'var(--leather)', fg: 'paper',
    accent: 'var(--paper)', line: 'color-mix(in srgb, var(--paper) 34%, transparent)',
  },
  {
    id: 'ink', name: { en: 'Ink', es: 'Tinta' },
    mix: { hex: BASES.ink }, bg: 'var(--ink)', fg: 'paper',
    accent: 'color-mix(in srgb, var(--leather) 55%, var(--paper))', line: 'color-mix(in srgb, var(--paper) 22%, transparent)',
  },
  {
    id: 'sea', name: { en: 'Sea', es: 'Mar' }, legacy: true,
    mix: { a: '#2c6670', p: 62, b: 'ink' }, bg: 'var(--region-sea)', fg: 'paper',
    accent: 'color-mix(in srgb, var(--paper) 80%, var(--region-sea))', ...onDark,
  },
  {
    id: 'olive', name: { en: 'Olive', es: 'Oliva' }, legacy: true,
    mix: { a: '#5f6b2c', p: 66, b: 'ink' }, bg: 'var(--region-olive)', fg: 'paper',
    accent: 'color-mix(in srgb, var(--paper) 80%, var(--leather))', ...onDark,
  },
  {
    id: 'paper', name: { en: 'Paper', es: 'Papel' },
    mix: { hex: BASES.paper }, bg: 'var(--paper)', fg: 'ink',
    accent: 'var(--burgundy)', line: 'color-mix(in srgb, var(--ink) 30%, transparent)',
  },
  {
    id: 'brick', name: { en: 'Brick', es: 'Ladrillo' },
    mix: { a: 'burgundy', p: 55, b: 'leather' }, bg: 'color-mix(in srgb, var(--burgundy) 55%, var(--leather))', fg: 'paper',
    accent: 'color-mix(in srgb, var(--paper) 80%, var(--leather))', ...onDark,
  },
  {
    id: 'tan', name: { en: 'Tan', es: 'Canela' },
    mix: { a: 'leather', p: 75, b: 'paper' }, bg: 'color-mix(in srgb, var(--leather) 75%, var(--paper))', fg: 'ink',
    accent: 'var(--burgundy)', line: 'color-mix(in srgb, var(--ink) 34%, transparent)',
  },
  {
    id: 'sand', name: { en: 'Sand', es: 'Arena' },
    mix: { a: 'leather', p: 25, b: 'paper' }, bg: 'color-mix(in srgb, var(--leather) 25%, var(--paper))', fg: 'ink',
    accent: 'var(--burgundy)', line: 'color-mix(in srgb, var(--ink) 30%, transparent)',
  },
  {
    id: 'stone', name: { en: 'Stone', es: 'Piedra' },
    mix: { a: 'ink', p: 35, b: 'paper' }, bg: 'color-mix(in srgb, var(--ink) 35%, var(--paper))', fg: 'ink',
    accent: 'var(--burgundy)', line: 'color-mix(in srgb, var(--ink) 32%, transparent)',
  },
];

export const swatch = (id: string): Swatch => SWATCHES.find((s) => s.id === id) ?? SWATCHES[0];

/** The CSS variables a card (or a legend's dot) reads to wear the swatch. */
export const swatchStyle = (id: string): CSSProperties => {
  const s = swatch(id);
  return {
    '--bg': s.bg,
    '--fg': s.fg === 'paper' ? 'var(--paper)' : 'var(--ink)',
    '--accent': s.accent,
    '--line': s.line,
  } as CSSProperties;
};

/* ---- the arithmetic behind the rule (used by the check and by the back office) ---- */

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hexOf = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const resolve = (x: string) => (x.startsWith('#') ? x : BASES[x as Base]);

/** The swatch's colour as a hex string. */
export function swatchHex(s: Swatch): string {
  if ('hex' in s.mix) return s.mix.hex;
  const a = rgb(resolve(s.mix.a));
  const b = rgb(resolve(s.mix.b));
  const p = s.mix.p / 100;
  return hexOf(a.map((v, i) => v * p + b[i] * (1 - p)));
}

const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };

export function oklab(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export const deltaE = (h1: string, h2: string) => {
  const [a, b] = [oklab(h1), oklab(h2)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

const luminance = (hex: string) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (h1: string, h2: string) => {
  const [x, y] = [luminance(h1), luminance(h2)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export const MIN_DELTA_E = 0.08;
export const MIN_CONTRAST = 4.5;
