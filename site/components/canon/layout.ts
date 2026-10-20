/* The canon field: turns Beltrán's dataset into positioned nodes.

   The field means something. X is the year, Y is the Bueno band. A node's
   position is an argument about where it sits in the dispute, not a layout
   convenience, so nothing is auto-arranged. The one liberty: a card may slide
   up to NUDGE_YEARS to the right if that saves opening a whole new lane. The
   card always prints its own date. */

import type { Node } from '@xyflow/react';

export type NodeKind = 'text' | 'author' | 'corpus' | 'periodical' | 'institution';
export type EdgeKind = 'documented' | 'probable' | 'opposition' | 'wrote';

export interface CanonRecord {
  id: string;
  kind: NodeKind;
  label: string;
  year: number | null;
  band: string | null;
  unity?: string;
  operations?: string[];
  author?: string;
  region?: string;
  life?: string;
  role?: string;
  camp?: string;
  position?: string;
  place?: string;
  network?: string;
}

export interface CanonEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  mechanism?: string;
  confidence?: string;
  control?: string;
}

export interface CanonGraphData {
  note: string;
  bands: { code: string; name: string; subtitle: string }[];
  ruptures: { year: number; label: string }[];
  movements: { id: string; label: string; start: number; end: number; bands: string[] }[];
  nodes: CanonRecord[];
  edges: CanonEdge[];
}

/** What a card renders. `year` is the record's own year, never the placed one. */
export interface CardData extends Record<string, unknown> {
  rec: CanonRecord;
  year: number | null;
  counter: boolean;
}

export const Y0 = 1806;
export const Y1 = 2008;
export const PX_PER_YEAR = 16;
export const LANE_H = 86;
const H_OF: Record<NodeKind, number> = { text: 76, author: 54, corpus: 54, periodical: 56, institution: 56 };
const W_OF: Record<NodeKind, number> = { text: 162, author: 140, corpus: 150, periodical: 140, institution: 140 };
const NUDGE_YEARS = 2.5;
const BAND_GAP = 10;
const PAD_L = 40;

export const xOf = (year: number) => PAD_L + (Math.max(Y0, Math.min(Y1, year)) - Y0) * PX_PER_YEAR;

/** A piece of the background, in field coordinates. */
export interface Layer {
  id: string;
  type: 'band' | 'axis' | 'rupture' | 'movement';
  zIndex: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  data: Record<string, unknown>;
}

export interface Field {
  cards: Node<CardData>[];
  layers: Layer[];
  width: number;
  height: number;
  rowTop: number[];
  rowH: number[];
}

export function buildField(graph: CanonGraphData, showMovements: boolean): Field {
  const bandIndex: Record<string, number> = {};
  graph.bands.forEach((b, i) => { bandIndex[b.code] = i; });
  const width = PAD_L + (Y1 - Y0) * PX_PER_YEAR + 320;

  /* A corpus node carries no date or band of its own: it hangs at the year
     and in the band of whatever it connects to. Two passes, so a corpus that
     only touches another corpus still inherits instead of piling up at 1806. */
  const yearBy = new Map(graph.nodes.map((n) => [n.id, n.year]));
  const bandBy = new Map(graph.nodes.map((n) => [n.id, n.band]));
  const pYear = new Map<string, number>();
  const pBand = new Map<string, string>();
  for (let pass = 0; pass < 2; pass += 1) {
    for (const e of graph.edges) {
      for (const [a, b] of [[e.source, e.target], [e.target, e.source]]) {
        const by = yearBy.get(b) ?? pYear.get(b);
        const bb = bandBy.get(b) || pBand.get(b);
        if (yearBy.get(a) == null && !pYear.has(a) && by != null) pYear.set(a, by);
        if (!bandBy.get(a) && !pBand.has(a) && bb) pBand.set(a, bb);
      }
    }
  }
  const yearOf = (n: CanonRecord) => n.year ?? pYear.get(n.id) ?? Y0;
  /* ORIGIN is the compiler's early-modern prologue, not one of the eight
     Bueno rows; it rides with the inter-nationalist band. */
  const bandOf = (n: CanonRecord) => {
    const b = n.band || pBand.get(n.id) || 'A2';
    return bandIndex[b] === undefined ? 'A2' : b;
  };

  const ordered = [...graph.nodes].sort((a, b) => yearOf(a) - yearOf(b) || a.id.localeCompare(b.id));
  const lanesUsed: number[] = [];
  const taken = new Map<string, number>();
  const placed: { n: CanonRecord; row: number; lane: number; x: number }[] = [];
  const slack = NUDGE_YEARS * PX_PER_YEAR;
  for (const n of ordered) {
    const row = bandIndex[bandOf(n)];
    const x = xOf(yearOf(n));
    let lane = 0;
    let px = x;
    for (;;) {
      const free = taken.get(`${row}:${lane}`) ?? -Infinity;
      if (free < x) { px = x; break; }
      if (free <= x + slack) { px = free; break; }
      lane += 1;
    }
    taken.set(`${row}:${lane}`, px + W_OF[n.kind] + 14);
    lanesUsed[row] = Math.max(lanesUsed[row] ?? 1, lane + 1);
    placed.push({ n, row, lane, x: px });
  }

  const rowTop: number[] = [];
  const rowH: number[] = [];
  let y = 0;
  graph.bands.forEach((_, i) => {
    const h = Math.max(1, lanesUsed[i] ?? 1) * LANE_H + 16;
    rowTop[i] = y;
    rowH[i] = h;
    y += h + BAND_GAP;
  });
  const height = y - BAND_GAP;

  /* Background layers (bands, decade rules, ruptures, movements) are NOT
     React Flow nodes. They are drawn by FieldUnderlay under the graph, in the
     same coordinates. In the HTML version they were nodes, and that is what
     broke selection: see the note in canon.css. */
  const layers: Layer[] = [];
  graph.bands.forEach((b, i) => {
    layers.push({
      id: `band:${b.code}`, type: 'band', zIndex: 0,
      position: { x: -40, y: rowTop[i] },
      width: width + 80, height: rowH[i],
      data: { i },
    });
  });
  // decade rules, so the eye can read a year off the field
  for (let yr = 1810; yr <= 2000; yr += 10) {
    layers.push({
      id: `axis:${yr}`, type: 'axis', zIndex: 0,
      position: { x: xOf(yr), y: -26 },
      width: 1, height: height + 26,
      data: { year: yr, major: yr % 50 === 0 },
    });
  }
  if (showMovements) {
    graph.movements.forEach((m, i) => {
      const rows = [...new Set(m.bands.map((c) => bandIndex[c]).filter((v) => v !== undefined))];
      if (!rows.length) return;
      const top = rowTop[Math.min(...rows)];
      const last = Math.max(...rows);
      layers.push({
        id: `mv:${m.id}:${i}`, type: 'movement', zIndex: 1,
        position: { x: xOf(m.start), y: top },
        width: Math.max(90, (m.end - m.start) * PX_PER_YEAR), height: rowTop[last] + rowH[last] - top,
        data: { label: m.label },
      });
    });
  }
  graph.ruptures.filter((r) => r.year >= Y0).forEach((r, i) => {
    layers.push({
      id: `rp:${i}`, type: 'rupture', zIndex: 2,
      position: { x: xOf(r.year), y: -26 },
      width: 1, height: height + 26,
      data: { year: r.year, label: r.label },
    });
  });

  const cards: Node<CardData>[] = placed.map(({ n, row, lane, x }) => ({
    id: n.id,
    type: n.kind,
    zIndex: 5,
    className: 'cg-card',
    draggable: false,
    selectable: false,
    position: { x, y: rowTop[row] + 10 + lane * LANE_H },
    width: W_OF[n.kind],
    height: H_OF[n.kind],
    data: { rec: n, year: n.kind === 'author' ? null : n.year ?? null, counter: n.role === 'counter-tradition' },
  }));

  return { cards, layers, width, height, rowTop, rowH };
}
