'use client';

/* The canon, as a graph: React Flow does the panning, zooming and edge
   routing; the field (x = year, y = Bueno band) comes from layout.ts.

   Selection is our own state, keyed by id. React Flow's built-in selection is
   off (`elementsSelectable={false}`): the cards are display objects, the
   click handler is what selects, and nothing has to round-trip through
   onNodesChange. */

import '@xyflow/react/dist/base.css';
import './canon.css';

import {
  memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react';
import {
  ReactFlow, ReactFlowProvider, useReactFlow, useStore, MarkerType,
  type Edge, type Node, type NodeMouseHandler, type EdgeMouseHandler, type ReactFlowState,
} from '@xyflow/react';

import graphJson from '@/data/canon-graph.json';
import { dict, type Lang } from '@/lib/i18n';
import {
  buildField, xOf, Y0, Y1,
  type Layer, type CanonEdge, type CanonGraphData, type CanonRecord, type EdgeKind,
} from './layout';
import { nodeTypes } from './nodes';
import { edgeTypes, edgeStyle, EDGE_KINDS, type SparkData } from './edges';

const GRAPH = graphJson as unknown as CanonGraphData;
const START_YEAR = 1880;
const START_ZOOM = 0.62;

/* Bueno wrote these categories in Spanish; the compiler's dataset carries
   them in English. */
const BAND_ES: Record<string, string> = {
  A1: 'NACIONALISTA',
  A2: 'INTERNACIONALISTA',
  B1: 'TODO AMERICANO / LATINOAMERICANO / INDOAMERICANO',
  'B2.4': 'PANAMERICANO',
  'B2.5': 'OCCIDENTALISTA',
  'B2.6': 'COMUNIDAD HISPÁNICA',
  'B2.7': 'COMUNIDAD LUSÓFONA',
  'B2.8': 'TODO IBÉRICO / IBERÓFONO',
};
const bandName = (code: string, lang: Lang) =>
  (lang === 'es' ? BAND_ES[code] : undefined) ?? GRAPH.bands.find((b) => b.code === code)?.name ?? code;

/* --- reduced motion, live ------------------------------------------------ */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
function useReducedMotion() {
  return useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => true);
}

/* --- neighbourhoods ------------------------------------------------------- */

interface Link { edge: CanonEdge; other: string; out: boolean }

const RECORDS = new Map(GRAPH.nodes.map((n) => [n.id, n]));
const LINKS = (() => {
  const m = new Map<string, Link[]>();
  for (const e of GRAPH.edges) {
    if (!m.has(e.source)) m.set(e.source, []);
    if (!m.has(e.target)) m.set(e.target, []);
    m.get(e.source)!.push({ edge: e, other: e.target, out: true });
    m.get(e.target)!.push({ edge: e, other: e.source, out: false });
  }
  return m;
})();

/* --- screen-space rails ----------------------------------------------------
   They follow the viewport but their type does not scale with it: band names
   and years must stay readable at the zoom where you see the whole web, which
   is exactly where scaled type disappears. Each subscribes to the transform
   on its own, so panning re-renders the rails and nothing else. */

const selTransform = (s: ReactFlowState) => s.transform;

function BandRail({ rowTop, rowH, lang }: { rowTop: number[]; rowH: number[]; lang: Lang }) {
  const [tx, ty, zoom] = useStore(selTransform);
  void tx;
  return (
    <div className="cg-rail" aria-hidden="true">
      {GRAPH.bands.map((b, i) => {
        const h = rowH[i] * zoom;
        return (
          <div key={b.code} className="cg-rail__row" style={{ top: rowTop[i] * zoom + ty, height: h }}>
            <span className="cg-rail__code">{b.code}</span>
            {h > 34 && <span className="cg-rail__name">{bandName(b.code, lang)}</span>}
          </div>
        );
      })}
    </div>
  );
}

function YearRail() {
  const [tx, , zoom] = useStore(selTransform);
  const step = 10 * 16 * zoom > 46 ? 10 : 50;
  const ticks: number[] = [];
  for (let y = 1810; y <= 2000; y += 10) if (y % step === 0) ticks.push(y);
  return (
    <div className="cg-years" aria-hidden="true">
      {ticks.map((y) => (
        <span key={y} className={y % 50 === 0 ? 'is-major' : ''} style={{ left: xOf(y) * zoom + tx }}>{y}</span>
      ))}
      {GRAPH.ruptures.filter((r) => r.year >= Y0 && r.year <= Y1).map((r) => (
        <i key={r.year} className="cg-years__rp" style={{ left: xOf(r.year) * zoom + tx }} title={`${r.year} · ${r.label}`} />
      ))}
    </div>
  );
}

/* --- the field underlay ----------------------------------------------------
   Bands, decade rules, ruptures and movements, drawn under the graph in field
   coordinates with the viewport's own transform. They are not nodes, so they
   can never sit over a card or take its click. */

const UnderlayLayers = memo(function UnderlayLayers({ layers }: { layers: Layer[] }) {
  return (
    <>
      {layers.map((l) => (
        <div key={l.id} className={`cg-l cg-l--${l.type}${l.type === 'band' && Number(l.data.i) % 2 ? ' is-odd' : ''}${l.data.major ? ' is-major' : ''}`}
          style={{ left: l.position.x, top: l.position.y, width: l.width, height: l.height, zIndex: l.zIndex }}>
          {l.type === 'movement' && <span>{String(l.data.label)}</span>}
        </div>
      ))}
    </>
  );
});

function FieldUnderlay({ layers }: { layers: Layer[] }) {
  const [x, y, zoom] = useStore(selTransform);
  return (
    <div className="cg-under" aria-hidden="true">
      <div className="cg-under__in" style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}>
        <UnderlayLayers layers={layers} />
      </div>
    </div>
  );
}

/* --- the reading panel ---------------------------------------------------- */

function Evidence({ e, lang }: { e: CanonEdge; lang: Lang }) {
  const t = dict(lang).graph;
  if (!e.mechanism && !e.confidence && !e.control) return null;
  return (
    <dl className="cg-ev">
      {e.mechanism && <><dt>{t.mechanism}</dt><dd>{e.mechanism}</dd></>}
      {e.confidence && <><dt>{t.confidence}</dt><dd>{e.confidence}</dd></>}
      {e.control && <><dt>{t.control}</dt><dd>{e.control}</dd></>}
    </dl>
  );
}

function KindSwatch({ kind }: { kind: EdgeKind }) {
  const s = edgeStyle(kind);
  return (
    <svg className="cg-swatch" viewBox="0 0 26 6" aria-hidden="true">
      <line x1="0" y1="3" x2="26" y2="3" style={{ ...s, strokeWidth: Number(s.strokeWidth) * 1.1 }} />
    </svg>
  );
}

function NodeRef({ id, lang, onGo, dir }: { id: string; lang: Lang; onGo: (id: string) => void; dir?: 'out' | 'in' }) {
  const d = dict(lang);
  const r = RECORDS.get(id);
  if (!r) return null;
  const kind = r.role === 'counter-tradition' ? d.kind.counter : d.kind[r.kind];
  return (
    <button type="button" className="cg-ref" onClick={() => onGo(id)}>
      {dir && <span className="cg-ref__dir" aria-label={dir === 'out' ? d.graph.to : d.graph.from}>{dir === 'out' ? '→' : '←'}</span>}
      <span className="cg-ref__t">{r.label}</span>
      <span className="cg-ref__k">{kind}{r.year && r.kind !== 'author' ? ` · ${r.year}` : r.life ? ` · ${r.life}` : ''}</span>
    </button>
  );
}

function NodeRecord({ rec, lang, onGo }: { rec: CanonRecord; lang: Lang; onGo: (id: string) => void }) {
  const d = dict(lang);
  const t = d.graph;
  const links = LINKS.get(rec.id) ?? [];
  const counter = rec.role === 'counter-tradition';
  const row = (k: string, v?: string | number | null) => (v ? <><dt>{k}</dt><dd>{v}</dd></> : null);
  const band = rec.band && GRAPH.bands.some((b) => b.code === rec.band) ? `${rec.band} · ${bandName(rec.band, lang)}` : null;
  return (
    <>
      <p className="cg-panel__kind">{counter ? d.kind.counter : d.kind[rec.kind]}</p>
      <h3 className="cg-panel__t" id="cg-panel-title">{rec.label}</h3>
      {rec.kind === 'text' && rec.author && (
        <p className="cg-panel__a">{rec.author}{rec.life ? ` · ${rec.life}` : ''}</p>
      )}
      <dl className="cg-panel__dl">
        {rec.kind !== 'author' && row(t.year, rec.year)}
        {rec.kind === 'author' && row(t.life, rec.life)}
        {row(t.position, band)}
        {row(t.unity, rec.unity)}
        {row(t.operation, rec.operations?.join(', '))}
        {row(t.region, rec.region)}
        {row(t.camp, rec.camp)}
        {row(t.place, rec.place)}
        {row(t.network, rec.network)}
      </dl>
      {rec.position && <p className="cg-panel__p">{rec.position}</p>}
      {counter && <p className="cg-panel__ct">{t.counter}</p>}

      <h4 className="cg-panel__h">{t.connections(links.length)}</h4>
      {!links.length && <p className="cg-panel__none">{t.noConnections}</p>}
      {EDGE_KINDS.map((k) => {
        const group = links.filter((l) => l.edge.kind === k);
        if (!group.length) return null;
        return (
          <div key={k} className={`cg-group cg-group--${k}`}>
            <p className="cg-group__h"><KindSwatch kind={k} />{d.edge[k]} <span>{group.length}</span></p>
            <ul>
              {group.map((l) => (
                <li key={l.edge.id}>
                  <NodeRef id={l.other} lang={lang} onGo={onGo} dir={l.out ? 'out' : 'in'} />
                  <Evidence e={l.edge} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function EdgeRecord({ e, lang, onGo }: { e: CanonEdge; lang: Lang; onGo: (id: string) => void }) {
  const d = dict(lang);
  return (
    <>
      <p className="cg-panel__kind">{d.graph.edgeTitle}</p>
      <p className="cg-group__h cg-group__h--lg"><KindSwatch kind={e.kind} />{d.edge[e.kind]}</p>
      <ul className="cg-pair">
        <li><NodeRef id={e.source} lang={lang} onGo={onGo} /></li>
        <li aria-hidden="true" className="cg-pair__arrow">↓</li>
        <li><NodeRef id={e.target} lang={lang} onGo={onGo} /></li>
      </ul>
      <Evidence e={e} lang={lang} />
    </>
  );
}

/* --- the graph -------------------------------------------------------------- */

type Sel = { type: 'node'; id: string } | { type: 'edge'; id: string } | null;

function Graph({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const t = d.graph;
  const reduced = useReducedMotion();
  const rf = useReactFlow();
  const shell = useRef<HTMLDivElement>(null);
  const fsButton = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [kinds, setKinds] = useState<Record<EdgeKind, boolean>>({ documented: true, probable: true, opposition: true, wrote: true });
  const [showMovements, setShowMovements] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [full, setFull] = useState(false);

  const field = useMemo(() => buildField(GRAPH, showMovements), [showMovements]);
  /* Start where the argument is densest, at a zoom where a title can be
     read; the fit button gives the whole field. */
  const startView = useMemo(
    () => ({ x: 200 - xOf(START_YEAR) * START_ZOOM, y: 40 - field.rowTop[1] * START_ZOOM, zoom: START_ZOOM }),
    // the start view is only read once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const cardById = useMemo(() => new Map(field.cards.map((c) => [c.id, c])), [field]);

  const focus = sel?.type === 'node' ? sel.id : null;
  const focusEdge = sel?.type === 'edge' ? GRAPH.edges.find((e) => e.id === sel.id) ?? null : null;
  const near = useMemo(() => {
    if (focus) return new Set([focus, ...(LINKS.get(focus) ?? []).map((l) => l.other)]);
    if (focusEdge) return new Set([focusEdge.source, focusEdge.target]);
    return null;
  }, [focus, focusEdge]);

  const nodes = useMemo<Node[]>(() => {
    const cards = field.cards.map((c) => {
      const cls = ['cg-card'];
      if (near) cls.push(near.has(c.id) ? 'is-lit' : 'is-dim');
      if (c.id === focus) cls.push('is-sel');
      return { ...c, className: cls.join(' ') };
    });
    return cards;
  }, [field, near, focus]);

  const edges = useMemo<Edge<SparkData>[]>(() => GRAPH.edges
    .filter((e) => kinds[e.kind])
    .map((e, i) => {
      const lit = focusEdge ? e.id === focusEdge.id : !near || (near.has(e.source) && near.has(e.target) && (!focus || e.source === focus || e.target === focus));
      const s = edgeStyle(e.kind);
      return {
        id: e.id, source: e.source, target: e.target, type: 'spark',
        style: { ...s, opacity: lit ? 1 : 0.08 },
        markerEnd: e.kind === 'wrote' ? undefined : { type: MarkerType.ArrowClosed, color: String(s.stroke), width: 14, height: 14 },
        className: `cg-edge cg-edge--${e.kind}${lit ? '' : ' is-dim'}${focusEdge?.id === e.id ? ' is-sel' : ''}`,
        zIndex: lit && near ? 4 : 3,
        interactionWidth: lit ? 18 : 0,
        data: { rec: e, delay: (i % 7) * 0.55, lit: lit && (!!near || e.kind !== 'wrote'), motion: !reduced },
      };
    }), [kinds, near, focus, focusEdge, reduced]);

  /* Navigating from the panel moves the camera; clicking on the field does
     not, because the thing you clicked is already where you are looking. */
  const go = useCallback((id: string) => {
    setSel({ type: 'node', id });
    const c = cardById.get(id);
    if (!c) return;
    const zoom = Math.max(rf.getZoom(), 0.85);
    rf.setCenter(c.position.x + (c.width ?? 0) / 2, c.position.y + (c.height ?? 0) / 2, { zoom, duration: reduced ? 0 : 520 });
  }, [cardById, rf, reduced]);

  /* Links from elsewhere on the page (the pillars) point at a record with
     `#canon=<id>`: scroll to the canon, select it and centre on it. */
  useEffect(() => {
    const fromHash = () => {
      const m = /^#canon=(.+)$/.exec(window.location.hash);
      const id = m ? decodeURIComponent(m[1]) : null;
      if (!id || !RECORDS.has(id)) return;
      document.getElementById('canon')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      window.setTimeout(() => go(id), 60);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [go, reduced]);

  const onNodeClick = useCallback<NodeMouseHandler>((_, n) => setSel({ type: 'node', id: n.id }), []);
  const onEdgeClick = useCallback<EdgeMouseHandler>((_, e) => setSel({ type: 'edge', id: e.id }), []);
  const onPaneClick = useCallback(() => setSel(null), []);

  // Enter or Space on a focused card selects it, as a click would
  const onKeyDown = useCallback((ev: React.KeyboardEvent) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const el = (ev.target as HTMLElement).closest('.react-flow__node.cg-card') as HTMLElement | null;
    const id = el?.dataset.id;
    if (!id) return;
    ev.preventDefault();
    setSel({ type: 'node', id });
  }, []);

  /* Full screen is our own overlay rather than the Fullscreen API: it works
     the same on iOS Safari (which has no element fullscreen), keeps the page
     chrome predictable, and Esc is handled here. */
  useEffect(() => {
    if (!full) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => { root.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [full]);

  // Esc outside full screen clears the selection
  useEffect(() => {
    if (full || !sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shell.current?.contains(document.activeElement)) setSel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full, sel]);

  // a new record starts at the top of the panel
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }); }, [sel]);

  const selRec = focus ? RECORDS.get(focus) : null;

  return (
    <div ref={shell} className={`cg${full ? ' is-full' : ''}`} onKeyDown={onKeyDown}>
      <div className="cg-bar">
        <span className="cg-bar__label">{t.edges}</span>
        {EDGE_KINDS.map((k) => (
          <button key={k} type="button" className="cg-chip" aria-pressed={kinds[k]}
            onClick={() => setKinds((s) => ({ ...s, [k]: !s[k] }))}>
            <KindSwatch kind={k} />{d.edge[k]}
          </button>
        ))}
        <button type="button" className="cg-chip cg-chip--mv" aria-pressed={showMovements}
          onClick={() => setShowMovements((v) => !v)}><i />{t.movements}</button>
        <span className="cg-bar__hint">{t.hint}</span>
      </div>

      <div className="cg-body">
        <div className="cg-stage" role="group" aria-label={t.stage}>
          <FieldUnderlay layers={field.layers} />
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
            nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
            nodesFocusable edgesFocusable={false}
            defaultViewport={startView}
            minZoom={0.18} maxZoom={2.4}
            translateExtent={[[-360, -280], [field.width + 360, field.height + 280]]}
            proOptions={{ hideAttribution: true }}
            zoomOnDoubleClick={false}
          />
          <YearRail />
          <BandRail rowTop={field.rowTop} rowH={field.rowH} lang={lang} />
          <div className="cg-tools">
            <button type="button" onClick={() => rf.zoomIn({ duration: reduced ? 0 : 200 })} aria-label={t.zoomIn} title={t.zoomIn}>+</button>
            <button type="button" onClick={() => rf.zoomOut({ duration: reduced ? 0 : 200 })} aria-label={t.zoomOut} title={t.zoomOut}>−</button>
            <button type="button" onClick={() => rf.fitView({ padding: 0.03, minZoom: 0.18, duration: reduced ? 0 : 400 })} aria-label={t.fit} title={t.fit}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="4" width="11" height="8" /><circle cx="8" cy="8" r="1.2" /></svg>
            </button>
            <button ref={fsButton} type="button" onClick={() => setFull((v) => !v)}
              aria-pressed={full} aria-label={full ? t.exitFullscreen : t.fullscreen} title={full ? `${t.exitFullscreen} (Esc)` : t.fullscreen}>
              {full
                ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2v4H2M10 2v4h4M14 10h-4v4M2 10h4v4" /></svg>
                : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" /></svg>}
            </button>
          </div>
        </div>

        <aside ref={panelRef} className={`cg-panel${sel ? ' has-sel' : ''}`} aria-live="polite" aria-labelledby={sel ? 'cg-panel-title' : undefined}>
          {sel && (
            <button type="button" className="cg-panel__close" onClick={() => setSel(null)} aria-label={t.close}>×</button>
          )}
          {selRec && <NodeRecord rec={selRec} lang={lang} onGo={go} />}
          {focusEdge && <EdgeRecord e={focusEdge} lang={lang} onGo={go} />}
          {!sel && (
            <>
              <p className="cg-panel__hint">{t.pick}</p>
              <p className="cg-panel__sub">{t.pickSub}</p>
              <Legend lang={lang} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Legend({ lang }: { lang: Lang }) {
  const d = dict(lang);
  return (
    <div className="cg-legend">
      <p className="cg-group__h">{d.graph.shapes}</p>
      <ul>
        <li><i className="lg lg--text" />{d.kind.text}</li>
        <li><i className="lg lg--author" />{d.kind.author}</li>
        <li><i className="lg lg--counter" />{d.kind.counter}</li>
        <li><i className="lg lg--corpus" />{d.kind.corpus}</li>
        <li><i className="lg lg--periodical" />{d.kind.periodical}</li>
        <li><i className="lg lg--institution" />{d.kind.institution}</li>
      </ul>
      <p className="cg-group__h">{d.graph.edges}</p>
      <ul>
        {EDGE_KINDS.map((k) => <li key={k}><KindSwatch kind={k} />{d.edge[k]}</li>)}
      </ul>
      <p className="cg-panel__sub">{d.graph.nudged}</p>
    </div>
  );
}

export default function CanonGraph({ lang }: { lang: Lang }) {
  return (
    <ReactFlowProvider>
      <Graph lang={lang} />
    </ReactFlowProvider>
  );
}

