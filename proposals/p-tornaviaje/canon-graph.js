/* ==========================================================================
   The canon, as a graph.

   Beltrán's own chart connects things to each other; the version we drew first
   kept the dots and dropped every line. This puts the lines back, with React
   Flow doing the panning, zooming and edge routing.

   Two rules it holds to:

   1. The field still means what it meant. X is the year, Y is the Bueno band.
      A node's position is an argument about where it sits in the dispute, not
      a layout convenience, so nothing is auto-arranged.
   2. An edge is a claim about evidence. Every one carries the compiler's own
      mechanism, confidence and methodological control, and the three kinds —
      documented, probable, polemical opposition — are drawn differently, as
      the legend requires.

   Loaded from pinned CDN modules: no build step, consistent with AGENTS.md.
   ========================================================================== */

import React, { useCallback, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ReactFlow, Background, Controls, Handle, Position, ReactFlowProvider,
  BaseEdge, getBezierPath,
} from 'https://esm.sh/@xyflow/react@12.3.5?deps=react@18.3.1,react-dom@18.3.1';

const html = htm.bind(React.createElement);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CSS = 'https://esm.sh/@xyflow/react@12.3.5/dist/style.css';

/* --- the field ------------------------------------------------------------ */

const Y0 = 1806;
const Y1 = 2008;
const PX_PER_YEAR = 16;

/* The lane pitch has to clear the tallest card, or lanes overlap vertically
   however carefully they are allocated horizontally. Heights are fixed per
   kind and titles are clamped, so the grid stays predictable. */
const LANE_H = 86;
const H_OF = { text: 76, author: 54, corpus: 54, periodical: 56, institution: 56 };
/* A card may slide a couple of years to the right if that saves a whole new
   lane. Two years on a two-century axis is invisible, the card still prints
   its own date, and the alternative is a field too tall to read. */
const NUDGE_YEARS = 2.5;
const BAND_GAP = 10;
const PAD_L = 40;

const xOf = (year) => PAD_L + (Math.max(Y0, Math.min(Y1, year ?? Y0)) - Y0) * PX_PER_YEAR;

const EDGE_LABEL = {
  en: { documented: 'Documented', probable: 'Probable', opposition: 'Polemical opposition', wrote: 'Wrote' },
  es: { documented: 'Documentada', probable: 'Probable', opposition: 'Oposición polémica', wrote: 'Escribió' },
};
const KIND_LABEL = {
  en: { text: 'Work', author: 'Author', corpus: 'Corpus or idea', periodical: 'Periodical', institution: 'Institution' },
  es: { text: 'Obra', author: 'Autor', corpus: 'Corpus o idea', periodical: 'Publicación', institution: 'Institución' },
};
const UI = {
  en: {
    show: 'Show', edges: 'Connections', pick: 'Pick a node to read it.',
    position: 'Position', unity: 'Unity', operation: 'Operation', region: 'Region',
    camp: 'Camp', life: 'Dates', year: 'Year', wrote: 'Author',
    mechanism: 'Evidence', confidence: 'Confidence', control: 'Control',
    counter: 'Argued against Hispanic unity', movements: 'Movements', hint: 'Drag to pan · scroll to zoom',
  },
  es: {
    show: 'Mostrar', edges: 'Conexiones', pick: 'Elige un nodo para leerlo.',
    position: 'Posición', unity: 'Unidad', operation: 'Operación', region: 'Región',
    camp: 'Campo', life: 'Fechas', year: 'Año', wrote: 'Autor',
    mechanism: 'Evidencia', confidence: 'Confianza', control: 'Control',
    counter: 'Argumentó contra la unidad hispánica', movements: 'Movimientos', hint: 'Arrastra para mover · rueda para acercar',
  },
};

/* --- node renderers -------------------------------------------------------
   One per entity in the legend's grammar: a work is an outlined rectangle, an
   author a filled node, a periodical a diamond, an institution a hexagon. */

const Ports = () => html`
  <${React.Fragment}>
    <${Handle} type="target" position=${Position.Left} isConnectable=${false} />
    <${Handle} type="source" position=${Position.Right} isConnectable=${false} />
  <//>`;

function WorkNode({ data }) {
  return html`<div class="cg-node cg-node--text" style=${{ '--bc': data.bandColor }} title=${data.label}>
    <${Ports} />
    <span class="cg-node__yr">${data.year}</span>
    <span class="cg-node__t">${data.label}</span>
    <span class="cg-node__a">${data.author}</span>
  </div>`;
}

function AuthorNode({ data }) {
  return html`<div class="cg-node cg-node--author ${data.role === 'counter-tradition' ? 'is-counter' : ''}"
    style=${{ '--bc': data.bandColor }} title=${data.label}>
    <${Ports} />
    <span class="cg-node__t">${data.label}</span>
    ${data.life && html`<span class="cg-node__a">${data.life}</span>`}
  </div>`;
}

function CorpusNode({ data }) {
  return html`<div class="cg-node cg-node--corpus" style=${{ '--bc': data.bandColor }} title=${data.label}>
    <${Ports} />
    <span class="cg-node__t">${data.label}</span>
  </div>`;
}

function VenueNode({ data }) {
  return html`<div class="cg-node cg-node--${data.kind}" style=${{ '--bc': data.bandColor }} title=${data.label}>
    <${Ports} />
    <span class="cg-node__t">${data.label}</span>
    ${data.place && html`<span class="cg-node__a">${data.place}</span>`}
  </div>`;
}

function BandNode({ data }) {
  return html`<div class="cg-band" style=${{ background: data.fill }}></div>`;
}

function RuptureNode({ data }) {
  return html`<div class="cg-rupture"><span>${data.label}</span></div>`;
}

function MovementNode({ data }) {
  return html`<div class="cg-movement"><span>${data.label}</span></div>`;
}

/* A spark running the length of each line. The reading it carries is
   direction: who received whom. It is an <animateMotion> on the edge's own
   path, so the browser animates it with no frame loop of ours. */
function SparkEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) {
  const [path] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.3,
  });
  const dur = data?.kind === 'wrote' ? 5.5 : 4;
  return html`<${React.Fragment}>
    <${BaseEdge} id=${id} path=${path} style=${style} markerEnd=${markerEnd} />
    ${!REDUCED && html`
      <circle class="cg-spark cg-spark--${data?.kind}" r=${data?.kind === 'wrote' ? 1.8 : 2.6}>
        <animateMotion dur="${dur}s" repeatCount="indefinite" begin="${data?.delay ?? 0}s"
          keyPoints="0;1" keyTimes="0;1" calcMode="linear" path=${path} />
      </circle>`}
  <//>`;
}

const edgeTypes = { spark: SparkEdge };

const nodeTypes = {
  text: WorkNode,
  author: AuthorNode,
  corpus: CorpusNode,
  periodical: VenueNode,
  institution: VenueNode,
  band: BandNode,
  rupture: RuptureNode,
  movement: MovementNode,
};

/* --- turning the dataset into a field -------------------------------------- */

function layout(graph, { showMovements }) {
  const bandIndex = {};
  graph.bands.forEach((b, i) => { bandIndex[b.code] = i; });
  const width = PAD_L + (Y1 - Y0) * PX_PER_YEAR + 320;

  const widthOf = (kind) => (kind === 'text' ? 162 : kind === 'corpus' ? 150 : 140);
  const heightOf = (kind) => H_OF[kind] ?? 58;

  /* A corpus node carries no date of its own: hang it at the year of whatever
     it connects to, or at the start of the field. */
  const yearByNode = Object.fromEntries(graph.nodes.map((n) => [n.id, n.year]));
  const bandByNode = Object.fromEntries(graph.nodes.map((n) => [n.id, n.band]));
  const partnerYear = {};
  const partnerBand = {};
  for (const e of graph.edges) {
    for (const [a2, b2] of [[e.source, e.target], [e.target, e.source]]) {
      if (yearByNode[a2] == null && yearByNode[b2] != null) partnerYear[a2] = yearByNode[b2];
      if (!bandByNode[a2] && bandByNode[b2]) partnerBand[a2] = bandByNode[b2];
    }
  }
  // a second pass, so a corpus that only touches another corpus still
  // inherits a year and a band instead of piling up at the origin
  for (const e of graph.edges) {
    for (const [a2, b2] of [[e.source, e.target], [e.target, e.source]]) {
      if (partnerYear[a2] == null && partnerYear[b2] != null) partnerYear[a2] = partnerYear[b2];
      if (!partnerBand[a2] && partnerBand[b2]) partnerBand[a2] = partnerBand[b2];
    }
  }

  const yearOf = (n) => n.year ?? partnerYear[n.id] ?? Y0;
  /* An idea has no band of its own; it sits in the band of what it touches.
     ORIGIN is the compiler's early-modern prologue, which is not one of the
     eight Bueno rows, so it rides with the inter-nationalist band. */
  const bandOf = (n) => {
    const b2 = n.band || partnerBand[n.id] || 'A2';
    return bandIndex[b2] === undefined ? 'A2' : b2;
  };

  /* Lanes, allocated per band with no fixed ceiling. Nothing is ever nudged
     off its year — that would be a lie about the date — so a band simply
     grows as many lanes as its busiest stretch needs, and ends up as tall as
     it is crowded. B1 is the loudest room in the argument and now looks it. */
  const ordered = [...graph.nodes].sort((a2, b2) => yearOf(a2) - yearOf(b2));
  const lanesUsed = {};
  const placed = [];
  const taken = {};
  for (const n of ordered) {
    const band = bandOf(n);
    const row = bandIndex[band] ?? graph.bands.length - 1;
    const x = xOf(yearOf(n));
    const w = widthOf(n.kind);
    const slack = NUDGE_YEARS * PX_PER_YEAR;
    let lane = 0;
    let px = x;
    while (true) {
      const free = taken[`${row}:${lane}`] ?? -Infinity;
      if (free < x) { px = x; break; }
      if (free <= x + slack) { px = free; break; }   // a nudge beats a new lane
      lane += 1;
    }
    taken[`${row}:${lane}`] = px + w + 14;
    lanesUsed[row] = Math.max(lanesUsed[row] ?? 1, lane + 1);
    placed.push({ n, row, lane, x: px, w });
  }

  // band heights follow their lane counts, and offsets stack from there
  const rowTop = [];
  const rowH = [];
  let y = 0;
  graph.bands.forEach((b, i) => {
    const h = Math.max(1, lanesUsed[i] ?? 1) * LANE_H + 16;
    rowTop[i] = y;
    rowH[i] = h;
    y += h + BAND_GAP;
  });
  const height = y;

  const nodes = [];

  graph.bands.forEach((b, i) => {
    nodes.push({
      id: `band:${b.code}`, type: 'band', draggable: false, selectable: false,
      position: { x: -40, y: rowTop[i] }, zIndex: 0,
      style: { width: width + 80, height: rowH[i] },
      data: { fill: graph.palette[b.code] || '#888' },
    });
  });

  if (showMovements) {
    graph.movements.forEach((m, i) => {
      const rows = [...new Set(m.bands.map((c) => bandIndex[c]).filter((v) => v !== undefined))];
      if (!rows.length) return;
      const top = rowTop[Math.min(...rows)];
      const last = Math.max(...rows);
      nodes.push({
        id: `mv:${m.id}:${i}`, type: 'movement', draggable: false, selectable: false,
        position: { x: xOf(m.start), y: top }, zIndex: 1,
        style: {
          width: Math.max(90, (m.end - m.start) * PX_PER_YEAR),
          height: rowTop[last] + rowH[last] - top,
        },
        data: { label: m.label },
      });
    });
  }

  graph.ruptures.forEach((r, i) => {
    nodes.push({
      id: `rp:${i}`, type: 'rupture', draggable: false, selectable: false,
      position: { x: xOf(r.year), y: -30 }, zIndex: 2,
      style: { height: height + 30 },
      data: { label: r.year },
    });
  });

  for (const { n, row, lane, x, w } of placed) {
    nodes.push({
      id: n.id, type: n.kind, zIndex: 5,
      style: { width: w, height: heightOf(n.kind) },
      position: { x, y: rowTop[row] + 10 + lane * LANE_H },
      data: {
        ...n, kind: n.kind, year: yearOf(n),
        bandColor: graph.palette[bandOf(n)] || '#9a8f7e',
      },
    });
  }

  return { nodes, width, height, rowTop, rowH };
}

const edgeStyle = (kind) => {
  if (kind === 'opposition') {
    return { stroke: 'var(--cg-opp)', strokeWidth: 2.4, strokeDasharray: '8 5' };
  }
  if (kind === 'probable') {
    return { stroke: 'var(--cg-edge)', strokeWidth: 2, strokeDasharray: '4 5' };
  }
  if (kind === 'wrote') {
    return { stroke: 'var(--cg-faint)', strokeWidth: 1.4 };
  }
  return { stroke: 'var(--cg-edge)', strokeWidth: 2.4 };
};

/* --- the app --------------------------------------------------------------- */

function Panel({ sel, lang }) {
  const t = UI[lang];
  if (!sel) {
    return html`<div class="cg-panel"><p class="cg-panel__hint">${t.pick}</p></div>`;
  }
  if (sel.type === 'edge') {
    const e = sel.data;
    return html`<div class="cg-panel">
      <p class="cg-panel__kind">${EDGE_LABEL[lang][e.kind]}</p>
      <p class="cg-panel__t">${e.sourceLabel} → ${e.targetLabel}</p>
      <dl>
        ${e.mechanism && html`<${React.Fragment}><dt>${t.mechanism}</dt><dd>${e.mechanism}</dd><//>`}
        ${e.confidence && html`<${React.Fragment}><dt>${t.confidence}</dt><dd>${e.confidence}</dd><//>`}
        ${e.control && html`<${React.Fragment}><dt>${t.control}</dt><dd>${e.control}</dd><//>`}
      </dl>
    </div>`;
  }
  const n = sel.data;
  const row = (k, v) => (v ? html`<${React.Fragment}><dt>${k}</dt><dd>${v}</dd><//>` : null);
  return html`<div class="cg-panel">
    <p class="cg-panel__kind">${KIND_LABEL[lang][n.kind] || n.kind}</p>
    <p class="cg-panel__t">${n.label}</p>
    ${n.author && html`<p class="cg-panel__a">${n.author}${n.life ? ` · ${n.life}` : ''}</p>`}
    <dl>
      ${row(t.year, n.year)}
      ${row(t.position, n.band)}
      ${row(t.unity, n.unity)}
      ${row(t.operation, (n.operations || []).join(', '))}
      ${row(t.region, n.region)}
      ${row(t.camp, n.camp)}
      ${row(t.life, !n.author && n.life ? n.life : '')}
    </dl>
    ${n.position && html`<p class="cg-panel__p">${n.position}</p>`}
    ${n.role === 'counter-tradition' && html`<p class="cg-panel__ct">${t.counter}</p>`}
  </div>`;
}

function BandRail({ bands, view, palette, rowTop, rowH }) {
  /* The rows follow the viewport but the type does not scale with it: band
     names have to stay readable at the zoom where you can see the whole web,
     which is exactly the zoom where scaled type disappears. */
  return html`<div class="cg-rail" aria-hidden="true">
    <div class="cg-rail__in">
      ${bands.map((b, i) => html`
        <div key=${b.code} class="cg-rail__row" style=${{
    top: `${rowTop[i] * view.zoom + view.y}px`,
    height: `${rowH[i] * view.zoom}px`,
  }}>
          <span class="cg-rail__code" style=${{ color: palette[b.code] }}>${b.code}</span>
          ${rowH[i] * view.zoom > 36 && html`<span class="cg-rail__name">${b.name}</span>`}
        </div>`)}
    </div>
  </div>`;
}

function Graph({ graph, lang }) {
  const [kinds, setKinds] = useState({ documented: true, probable: true, opposition: true, wrote: true });
  const [showMovements, setShowMovements] = useState(false);
  const [sel, setSel] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const t = UI[lang];

  const laid = useMemo(() => layout(graph, { showMovements }), [graph, showMovements]);
  const labelOf = useMemo(
    () => Object.fromEntries(graph.nodes.map((n) => [n.id, n.label])), [graph],
  );

  /* Selecting a node lights its own connections and dims everything else.
     This is the part that makes the chart teach: you see at once who a thing
     answered and who answered it. */
  const focus = sel?.type === 'node' ? sel.data.id : null;
  const near = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    for (const e of graph.edges) {
      if (e.source === focus) set.add(e.target);
      if (e.target === focus) set.add(e.source);
    }
    return set;
  }, [focus, graph]);

  const edges = useMemo(() => graph.edges.filter((e) => kinds[e.kind]).map((e, i) => {
    const lit = !near || (near.has(e.source) && near.has(e.target));
    return {
      id: e.id, source: e.source, target: e.target,
      type: 'spark', style: { ...edgeStyle(e.kind), opacity: lit ? 1 : 0.1 },
      markerEnd: e.kind === 'wrote' ? undefined : { type: 'arrowclosed', color: edgeStyle(e.kind).stroke },
      data: { ...e, sourceLabel: labelOf[e.source], targetLabel: labelOf[e.target], delay: (i % 7) * 0.55 },
      className: `cg-edge cg-edge--${e.kind}${lit ? '' : ' is-dim'}`,
      zIndex: lit ? 3 : 1,
    };
  }), [graph, kinds, labelOf, near]);

  const nodes = useMemo(() => laid.nodes.map((n) => (
    ['band', 'rupture', 'movement'].includes(n.type) || !near
      ? n
      : { ...n, className: near.has(n.id) ? 'is-lit' : 'is-dim' }
  )), [laid, near]);

  const onNodeClick = useCallback((_, n) => {
    if (['band', 'rupture', 'movement'].includes(n.type)) return;
    setSel({ type: 'node', data: n.data });
  }, []);
  const onEdgeClick = useCallback((_, e) => setSel({ type: 'edge', data: e.data }), []);

  const toggle = (k) => setKinds((s) => ({ ...s, [k]: !s[k] }));

  return html`<div class="cg">
    <div class="cg-bar">
      <span class="cg-bar__label">${t.edges}</span>
      ${['documented', 'probable', 'opposition', 'wrote'].map((k) => html`
        <button key=${k} type="button" class="cg-chip cg-chip--${k}"
          aria-pressed=${kinds[k]} onClick=${() => toggle(k)}>
          <i></i>${EDGE_LABEL[lang][k]}
        </button>`)}
      <button type="button" class="cg-chip cg-chip--mv" aria-pressed=${showMovements}
        onClick=${() => setShowMovements((v) => !v)}><i></i>${t.movements}</button>
      <span class="cg-bar__hint">${t.hint}</span>
    </div>
    <div class="cg-stage">
      <${ReactFlow}
        nodes=${nodes} edges=${edges} nodeTypes=${nodeTypes} edgeTypes=${edgeTypes}
        onNodeClick=${onNodeClick} onEdgeClick=${onEdgeClick}
        onPaneClick=${() => setSel(null)}
        onMove=${(_, v) => setView(v)}
        onInit=${(inst) => setView(inst.getViewport())}
        fitView fitViewOptions=${{ padding: 0.03, minZoom: 0.38 }}
        nodesDraggable=${false} nodesConnectable=${false} elementsSelectable=${true}
        proOptions=${{ hideAttribution: true }}
        minZoom=${0.34} maxZoom=${2.4}
        translateExtent=${[[-320, -260], [laid.width + 320, laid.height + 260]]}>
        <${Background} gap=${34} size=${1} color="var(--cg-grid)" />
        <${Controls} showInteractive=${false} />
      <//>
      <${BandRail} bands=${graph.bands} view=${view} palette=${graph.palette}
        rowTop=${laid.rowTop} rowH=${laid.rowH} />
      <${Panel} sel=${sel} lang=${lang} />
    </div>
  </div>`;
}

/* --- mount ----------------------------------------------------------------- */

export async function mountCanonGraph(host, { dataUrl, lang = 'en' }) {
  if (!document.querySelector(`link[href="${CSS}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = CSS;
    document.head.appendChild(l);
  }
  const graph = await fetch(dataUrl).then((r) => r.json());
  const root = createRoot(host);
  const render = (l) => root.render(
    html`<${ReactFlowProvider}><${Graph} graph=${graph} lang=${l} /><//>`,
  );
  render(lang);
  return { render, graph };
}
