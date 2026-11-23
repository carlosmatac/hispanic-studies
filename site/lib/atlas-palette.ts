/* The Atlas map's colours (issue #104; Carlos, 2026-11-23: "it needs colours
   and more distinctions between territories").

   The map has its own palette, an exception to the brand rule written in
   AGENTS.md: muted historical-atlas hues on the warm dark ground. Four
   families, so a visitor can tell at a glance whose a territory is, and a
   shade per realm inside each, so neighbours part (their names are on the map
   too):
   - Spain and its realms: reds, anchored in the brand's burgundy (Castile and
     Spain themselves wear `spain`, a lifted burgundy);
   - Portugal and its realms: greens and teals;
   - al-Andalus and the Islamic states of the peninsula: blues and violets, so
     the fronts of the Reconquista read;
   - Rome and the Gothic kingdoms: stone and ochre.
   Everything else that was inhabited is one quiet warm grey (`land`): no
   empire outside the story is told from another.

   Picked in OKLCH (lightness 0.45 to 0.77, chroma 0.06 to 0.125) and checked
   by `npm run atlas:palette` (scripts/check-atlas-palette.mts): the pairs of
   realms that touch on the map stay apart under normal vision and under
   simulated protanopia, deuteranopia and tritanopia (Machado 2009), and every
   realm stands off the grey land. Paper labels with a dark halo read on all of
   them. */

export type Tint =
  | 'es.spain' | 'es.red' | 'es.rose' | 'es.wine' | 'es.brick' | 'es.amber' | 'es.plum' | 'es.coral'
  | 'pt.portugal' | 'pt.brazil' | 'pt.sage' | 'pt.teal' | 'pt.pine'
  | 'isl.andalus' | 'isl.steel' | 'isl.violet' | 'isl.sky' | 'isl.slate'
  | 'ant.stone' | 'ant.ochre' | 'ant.sand' | 'ant.clay' | 'ant.olive'
  | 'ind.peach' | 'ind.mauve' | 'ind.lilac' | 'ind.sand' | 'ind.straw' | 'ind.heather' | 'ind.blush' | 'ind.clay' | 'ind.sage' | 'ind.mint' | 'ind.mist';

export const TINTS: Record<Tint, string> = {
  'es.spain': '#a5464a', 'es.red': '#c26450', 'es.rose': '#d2949d', 'es.wine': '#85415e',
  'es.brick': '#bb7b4e', 'es.amber': '#d1af70', 'es.plum': '#97648b', 'es.coral': '#d3896c',
  'pt.portugal': '#509779', 'pt.brazil': '#66aea2', 'pt.sage': '#99c199', 'pt.teal': '#488c94', 'pt.pine': '#397664',
  'isl.andalus': '#61629b', 'isl.steel': '#728ab4', 'isl.violet': '#9e78af', 'isl.sky': '#94a0c8', 'isl.slate': '#584d78',
  'ant.stone': '#9f907b', 'ant.ochre': '#91745d', 'ant.sand': '#b5aa8f', 'ant.clay': '#8b6959', 'ant.olive': '#5f6042',
  // the independent states that followed the Spanish and Portuguese realms: pale, so they read as no longer Spain's or Portugal's
  'ind.peach': '#e8c7a9', 'ind.mauve': '#bf8f9d', 'ind.lilac': '#c3b3d1', 'ind.sand': '#ad9c7f', 'ind.straw': '#e2dcb7', 'ind.heather': '#9b9bba',
  'ind.blush': '#dcb3a8', 'ind.clay': '#c29e95', 'ind.sage': '#afd1bd', 'ind.mint': '#d2e1c5', 'ind.mist': '#bae0e0',
};

/** A realm that became independent keeps its place in the scheme: its shade's pale counterpart. */
export const INDEPENDENT: Partial<Record<Tint, Tint>> = {
  'es.spain': 'ind.clay', 'es.red': 'ind.peach', 'es.rose': 'ind.mauve', 'es.wine': 'ind.lilac', 'es.brick': 'ind.sand', 'es.amber': 'ind.straw',
  'es.plum': 'ind.heather', 'es.coral': 'ind.blush', 'pt.brazil': 'ind.mist', 'pt.sage': 'ind.mint', 'pt.portugal': 'ind.mist', 'pt.teal': 'ind.mist', 'pt.pine': 'ind.mist',
};

/** The ground: the space around the planet, the sea, the inhabited world outside the story. */
export const GROUND = {
  space: '#17130f',
  sea: '#29211c',
  land: '#47433e',
  /** the same land, a step lighter: other crowns in the keyframes (named only when the story is about them) */
  landHi: '#55504a',
};

/** Pairs of realms that share a border somewhere in the keyframes: these must stay apart. */
const IND_NEIGHBOURS: [Tint, Tint][] = [
  ['ind.peach', 'ind.mauve'], ['ind.mauve', 'ind.straw'], ['ind.straw', 'ind.blush'], ['ind.blush', 'ind.heather'], ['ind.heather', 'ind.sand'],
  ['ind.sand', 'ind.blush'], ['ind.blush', 'ind.lilac'], ['ind.lilac', 'ind.mist'], ['ind.lilac', 'ind.mauve'], ['ind.mauve', 'ind.straw'],
  ['ind.straw', 'ind.heather'], ['ind.heather', 'ind.blush'], ['ind.blush', 'ind.mist'], ['ind.sand', 'ind.mist'], ['ind.heather', 'ind.mist'],
  ['ind.straw', 'ind.mist'], ['ind.mint', 'ind.sand'], ['ind.mint', 'ind.mist'], ['ind.mint', 'ind.heather'],
  // during the wars of independence a free state borders a realm still Spain's
  ['ind.sand', 'es.wine'], ['ind.straw', 'es.wine'], ['ind.straw', 'es.rose'], ['ind.mist', 'es.wine'], ['ind.mist', 'es.amber'], ['ind.peach', 'es.coral'],
];
export const NEIGHBOURS: [Tint, Tint][] = [
  ['es.spain', 'pt.portugal'], ['es.spain', 'isl.andalus'], ['pt.portugal', 'isl.andalus'], ['es.spain', 'isl.violet'],
  ['pt.brazil', 'es.wine'], ['pt.brazil', 'es.amber'], ['pt.brazil', 'es.brick'], ['pt.brazil', 'es.plum'], ['pt.sage', 'es.brick'], ['pt.sage', 'es.plum'],
  ['es.red', 'es.coral'], ['es.red', 'es.amber'], ['es.red', 'es.rose'], ['es.wine', 'es.amber'], ['es.wine', 'es.brick'], ['es.wine', 'es.rose'],
  ['es.brick', 'es.plum'], ['es.amber', 'es.rose'], ['es.plum', 'es.coral'], ['es.amber', 'es.plum'], ['es.spain', 'es.amber'], ['es.spain', 'es.plum'],
  ['es.spain', 'es.red'], ['es.spain', 'es.coral'], ['es.wine', 'es.spain'], ['pt.portugal', 'pt.sage'], ['pt.brazil', 'pt.sage'],
  ['isl.andalus', 'isl.steel'], ['isl.andalus', 'isl.violet'], ['isl.steel', 'isl.sky'], ['isl.violet', 'isl.sky'], ['isl.slate', 'isl.steel'],
  ['es.amber', 'isl.andalus'], ['es.red', 'isl.steel'], ['es.plum', 'isl.violet'], ['ant.stone', 'ant.clay'], ['ant.sand', 'ant.clay'], ['ant.stone', 'ant.olive'], ['ant.clay', 'ant.olive'], ['ant.sand', 'ant.olive'], ['ant.stone', 'ant.sand'],
  ...IND_NEIGHBOURS,
  ['es.rose', 'es.amber'], ['es.rose', 'es.spain'], ['es.coral', 'es.brick'], ['es.wine', 'es.plum'], ['es.coral', 'es.rose'], ['pt.sage', 'es.wine'], ['isl.violet', 'es.spain'], ['isl.andalus', 'es.wine'], ['isl.andalus', 'es.rose'],
];

export const familyOf = (t: Tint) => t.split('.')[0] as 'es' | 'pt' | 'isl' | 'ant' | 'ind';
