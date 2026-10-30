import type { Chronicle, LonLat } from '@/lib/atlas-chronicle';
import type { Anchors, Box, Focus } from '@/lib/atlas-engine';
import type { Dict } from '@/lib/i18n';

/* The explainer (issue #88): a short note laid over the chart, next to what the
   beat changes, with a leader line to it. It says in a line or two what just
   happened, from the content the card already has (a landfall's log, the first
   sentence of a keyframe, the treaty's sides); nothing in it is new.

   - a voyage: the latest landfall reached (its date, name and log);
   - a keyframe: what changes (the jurisdictions that pulse, or the treaty line);
   - a change of layout: the chart turning into a globe or to the Pacific;
   - the opening: how to read the dark; today: the closing sentence.
   Hovering or focusing an item on the card moves the note to that item. */

type T = Dict['atlas'];
export type NoteAnchor =
  | { kind: 'point'; at: LonLat }
  | { kind: 'units'; families: string[] }
  | { kind: 'line'; id: string };
export type Note = { key: string; kicker: string; title: string; text?: string; pre?: string; anchor: NoteAnchor | null; beatLevel: boolean };

export type MapItem = { focus: Focus; name: string };

const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();

/** The jurisdictions and lines a keyframe changes, as the card lists them. */
export function changedItems(chron: Chronicle, bi: number, t: T): MapItem[] {
  const b = chron.beats[bi];
  if (b.kind !== 'era' || b.era === undefined) return [];
  const e = chron.eras[b.era];
  const out: MapItem[] = [];
  for (const id of e.pulse) {
    if (e.lines.includes(id)) { out.push({ focus: { kind: 'line', id }, name: t.lines[id as keyof T['lines']]?.name ?? id }); continue; }
    const f = chron.families[id];
    if (!f || !e.units.some((u) => u.f === id)) continue;
    out.push({ focus: { kind: 'unit', f: id }, name: e.names[id] ?? f.name });
  }
  return out;
}

export function noteFor(opts: {
  chron: Chronicle; bi: number; stop: number; focus: Focus | null; turning: boolean; reduced: boolean; t: T;
  fmtDate: (iso?: string) => string;
}): Note | null {
  const { chron, bi, stop, focus, turning, reduced, t, fmtDate } = opts;
  const b = chron.beats[bi];
  const prev = chron.beats[bi - 1];
  const layoutTurn = prev && prev.layout !== b.layout ? t.layoutNote[b.layout] : null;
  const voyage = b.voyage !== undefined ? chron.voyages[b.voyage] : undefined;
  const stops = voyage ? voyage.route.filter((w) => w.name) : [];

  const stopNote = (k: number, own: boolean): Note | null => {
    const w = stops[k];
    if (!w) return null;
    return {
      key: `${b.id}:stop:${k}`, kicker: fmtDate(w.date) || t.log, title: w.name as string,
      text: k <= stop ? w.log : undefined, anchor: { kind: 'point', at: w.at }, beatLevel: !own,
    };
  };

  // the card points at something: the note goes to it
  if (focus?.kind === 'stop' && voyage) return stopNote(focus.k, true);
  if (focus?.kind === 'line') {
    const l = t.lines[focus.id as keyof T['lines']];
    if (l) return { key: `${b.id}:line:${focus.id}`, kicker: t.onMap, title: l.name, text: t.lineSides(l.west, l.east), anchor: { kind: 'line', id: focus.id }, beatLevel: false };
  }
  if (focus?.kind === 'unit') {
    const it = changedItems(chron, bi, t).find((x) => x.focus.kind === 'unit' && x.focus.f === focus.f);
    if (it) return { key: `${b.id}:unit:${focus.f}`, kicker: t.onMap, title: it.name, anchor: { kind: 'units', families: [focus.f] }, beatLevel: false };
  }

  // the chart turns: said first, while it turns
  if (layoutTurn && turning && !reduced) {
    return { key: `${b.id}:turn`, kicker: b.label, title: layoutTurn.title, text: layoutTurn.text, anchor: null, beatLevel: true };
  }
  const pre = layoutTurn && reduced ? layoutTurn.title : undefined;

  let note: Note | null = null;
  if (b.kind === 'open') {
    note = { key: 'open', kicker: t.readKicker, title: t.readTitle, text: t.readText, anchor: { kind: 'point', at: [-56, 22] }, beatLevel: true };
  } else if (b.kind === 'today') {
    note = { key: 'today', kicker: b.label, title: b.title, text: firstSentence(b.text), anchor: null, beatLevel: true };
  } else if (b.kind === 'voyage') {
    note = stopNote(Math.max(0, Math.min(stop, stops.length - 1)), false);
  } else {
    const items = changedItems(chron, bi, t);
    const line = items.find((x) => x.focus.kind === 'line');
    const fams = items.flatMap((x) => (x.focus.kind === 'unit' ? [x.focus.f] : []));
    const names = items.slice(0, 3).map((x) => x.name).join(' · ') + (items.length > 3 ? ` ${t.andMore(items.length - 3)}` : '');
    const text = firstSentence(b.text);
    note = {
      key: `${b.id}:era`, kicker: `${t.whatChanges} · ${b.label}`, title: names || b.title, text,
      anchor: line?.focus.kind === 'line' ? { kind: 'line', id: line.focus.id } : fams.length ? { kind: 'units', families: fams } : null,
      beatLevel: true,
    };
  }
  if (note && pre) note.pre = pre;
  return note;
}

/* ---------- placement: beside the thing, never over it ---------- */

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const grow = (b: Box, d: number): Box => [b[0] - d, b[1] - d, b[2] + d, b[3] + d];

export type Placement = { x: number; y: number; target: [number, number] | null; from: [number, number] | null; slot: string };

export function place(opts: {
  note: Note; anchors: Anchors; chron: Chronicle; w: number; h: number; avoid: Box[]; prevSlot: string;
}): Placement {
  const { note, anchors: an, chron, w, h, avoid, prevSlot } = opts;
  const [ax0, ay0, ax1, ay1] = an.area;
  const pad = 12;
  const clampX = (x: number) => Math.max(ax0 + pad, Math.min(ax1 - pad - w, x));
  const clampY = (y: number) => Math.max(ay0 + pad, Math.min(ay1 - pad - h, y));

  // what the note points at: a box to keep clear, and the point the leader ends on
  let box: Box | null = null;
  let target: [number, number] | null = null;
  let line = false;
  let others: Box[] = [];
  const A = note.anchor;
  if (A?.kind === 'point') {
    const p = an.project(A.at);
    if (p && p[0] > ax0 - 4 && p[0] < ax1 + 4 && p[1] > ay0 - 4 && p[1] < ay1 + 4) { target = p; box = [p[0] - 12, p[1] - 12, p[0] + 12, p[1] + 12]; }
  } else if (A?.kind === 'units') {
    // point at the first jurisdiction that changes (at its name, where it has one);
    // keep clear of it, and as far as can be of the others
    const found = A.families.map((f) => ({ f, b: an.unitBox(f) })).filter((x): x is { f: string; b: Box } => !!x.b);
    if (found.length) {
      box = found[0].b;
      const at = chron.families[found[0].f]?.at;
      const p = at ? an.project(at) : null;
      // (the name is drawn above its point: the leader ends just under it, not on it)
      target = p && p[0] >= box[0] - 20 && p[0] <= box[2] + 20 && p[1] >= box[1] - 20 && p[1] <= box[3] + 20 ? [p[0], p[1] + 9] : [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
      others = found.slice(1).map((x) => x.b);
    }
  } else if (A?.kind === 'line') {
    const b = an.lineBox(A.id);
    if (b) { box = [b[0] - 26, b[1], b[2] + 26, b[3]]; line = true; target = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
  }

  if (!box || !target) {
    // nothing to point at: high in the middle of the chart
    return { x: clampX((ax0 + ax1) / 2 - w / 2), y: clampY(ay0 + 16), target: null, from: null, slot: 'top' };
  }

  const g = 30;
  const [tx, ty] = target;
  const cands: [string, number, number][] = [
    ['r', box[2] + g, ty - h / 2], ['l', box[0] - g - w, ty - h / 2],
    ['t', tx - w / 2, box[1] - g - h], ['b', tx - w / 2, box[3] + g],
    ['rt', box[2] + g, box[1] - h * 0.6], ['rb', box[2] + g, box[3] - h * 0.4],
    ['lt', box[0] - g - w, box[1] - h * 0.6], ['lb', box[0] - g - w, box[3] - h * 0.4],
    ['c1', ax0 + pad, ay0 + pad], ['c2', ax1 - pad - w, ay0 + pad], ['c3', ax0 + pad, ay1 - pad - h], ['c4', ax1 - pad - w, ay1 - pad - h],
  ];
  const keep = grow(box, 6);
  const ship: Box | null = an.ship ? [an.ship[0] - 30, an.ship[1] - 34, an.ship[0] + 30, an.ship[1] + 18] : null;
  let best: { slot: string; x: number; y: number; score: number } | null = null;
  for (const [slot, x0, y0] of cands) {
    const x = clampX(x0), y = clampY(y0);
    const r: Box = [x, y, x + w, y + h];
    let score = overlap(r, keep) * 30;
    // the point itself must never be covered
    if (tx > x - 8 && tx < x + w + 8 && ty > y - 8 && ty < y + h + 8) score += 1e7;
    if (ship) score += overlap(r, ship) * 20;
    for (const l of an.labels) score += overlap(r, l) * 3;
    for (const a of avoid) score += overlap(r, a) * 40;
    for (const o of others) score += overlap(r, o) * 4;
    const nx = Math.max(x, Math.min(tx, x + w)), ny = Math.max(y, Math.min(ty, y + h));
    score += Math.hypot(nx - tx, ny - ty) * 6;
    if (slot === prevSlot) score -= 900;   // stay put while the camera glides
    if (!best || score < best.score) best = { slot, x, y, score };
  }
  const b = best as { slot: string; x: number; y: number };
  // the leader: from the note's nearest edge to the point (on a line: level with the note)
  const to: [number, number] = line ? [tx, Math.max(box[1] + 8, Math.min(box[3] - 8, b.y + h / 2))] : target;
  const from: [number, number] = [Math.max(b.x, Math.min(to[0], b.x + w)), Math.max(b.y, Math.min(to[1], b.y + h))];
  const far = Math.hypot(from[0] - to[0], from[1] - to[1]) > 12;
  return { x: b.x, y: b.y, target: far ? to : null, from: far ? from : null, slot: b.slot };
}
