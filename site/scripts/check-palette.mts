import { MIN_CONTRAST, MIN_DELTA_E, SWATCHES, BASES, contrast, deltaE, swatchHex } from '@/lib/palette';

/* npm run palette:check — the region palette's rule (lib/palette.ts): every
   pair of swatches at least MIN_DELTA_E apart in OKLab, and the card's text at
   least MIN_CONTRAST against its ground. Fails (exit 1) when a swatch breaks it. */
let bad = 0;
const hex = SWATCHES.map((s) => [s, swatchHex(s)] as const);
for (const [s, h] of hex) {
  const text = s.fg === 'paper' ? BASES.paper : BASES.ink;
  const c = contrast(h, text);
  const near = hex.filter(([o]) => o !== s).map(([o, oh]) => [o.id, deltaE(h, oh)] as const).sort((a, b) => a[1] - b[1])[0];
  const ok = c >= MIN_CONTRAST && near[1] >= MIN_DELTA_E;
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${s.id.padEnd(9)} ${h}  text ${s.fg.padEnd(5)} ${c.toFixed(2)}:1   nearest ${near[0].padEnd(9)} ΔE ${near[1].toFixed(3)}`);
}
console.log(bad ? `${bad} swatch(es) break the rule.` : `All ${SWATCHES.length} swatches pass (ΔE_ok ≥ ${MIN_DELTA_E}, contrast ≥ ${MIN_CONTRAST}:1).`);
process.exit(bad ? 1 : 0);
