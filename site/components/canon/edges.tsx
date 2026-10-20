'use client';

/* An edge is a claim about evidence, and the four kinds are drawn
   differently, as the legend requires. A spark runs along each lit line in
   the direction of the reception (who received whom). It is an
   <animateMotion> on the edge's own path, so the browser animates it with no
   frame loop of ours, and it is not rendered at all under reduced motion. */

import { memo } from 'react';
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';
import type { CanonEdge, EdgeKind } from './layout';

export interface SparkData extends Record<string, unknown> {
  rec: CanonEdge;
  delay: number;
  lit: boolean;
  motion: boolean;
}

export const EDGE_KINDS: EdgeKind[] = ['documented', 'probable', 'opposition', 'wrote'];

export const edgeStyle = (kind: EdgeKind): React.CSSProperties => {
  switch (kind) {
    case 'opposition': return { stroke: 'var(--cg-opp)', strokeWidth: 1.8, strokeDasharray: '10 4 2 4' };
    case 'probable': return { stroke: 'var(--cg-edge)', strokeWidth: 1.6, strokeDasharray: '4 4' };
    case 'wrote': return { stroke: 'var(--cg-faint)', strokeWidth: 1.1 };
    default: return { stroke: 'var(--cg-edge)', strokeWidth: 1.9 };
  }
};

const Spark = memo(function Spark({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data, interactionWidth,
}: EdgeProps<Edge<SparkData>>) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.3 });
  const kind = data?.rec.kind ?? 'documented';
  const dur = kind === 'wrote' ? 5.5 : 4;
  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} interactionWidth={interactionWidth} />
      {data?.motion && data.lit && (
        <circle className={`cg-spark cg-spark--${kind}`} r={kind === 'wrote' ? 1.6 : 2.4}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${data.delay}s`} path={path} />
        </circle>
      )}
    </>
  );
});

export const edgeTypes = { spark: Spark };
