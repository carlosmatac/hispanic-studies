'use client';

/* One renderer per entity in the legend's grammar: a work is an outlined
   rectangle, an author a filled pill (broken outline for the
   counter-tradition), a corpus or idea a dotted box, a periodical a
   parallelogram, an institution a hexagon. */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { CardData } from './layout';

const Ports = () => (
  <>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </>
);

type CardProps = NodeProps<Node<CardData>>;

const Work = memo(function Work({ data }: CardProps) {
  const { rec, year } = data;
  return (
    <div className="cg-node cg-node--text" title={rec.label}>
      <Ports />
      {year != null && <span className="cg-node__yr">{year}</span>}
      <span className="cg-node__t">{rec.label}</span>
      {rec.author && <span className="cg-node__a">{rec.author}</span>}
    </div>
  );
});

const Author = memo(function Author({ data }: CardProps) {
  const { rec, counter } = data;
  return (
    <div className={`cg-node cg-node--author${counter ? ' is-counter' : ''}`} title={rec.label}>
      <Ports />
      <span className="cg-node__t">{rec.label}</span>
      {rec.life && <span className="cg-node__a">{rec.life}</span>}
    </div>
  );
});

const Corpus = memo(function Corpus({ data }: CardProps) {
  return (
    <div className="cg-node cg-node--corpus" title={data.rec.label}>
      <Ports />
      <span className="cg-node__t">{data.rec.label}</span>
    </div>
  );
});

const Venue = memo(function Venue({ data }: CardProps) {
  const { rec } = data;
  return (
    <div className={`cg-node cg-node--${rec.kind}`} title={rec.label}>
      <Ports />
      <span className="cg-node__in">
        <span className="cg-node__t">{rec.label}</span>
        {rec.place && <span className="cg-node__a">{rec.place}</span>}
      </span>
    </div>
  );
});

export const nodeTypes = {
  text: Work,
  author: Author,
  corpus: Corpus,
  periodical: Venue,
  institution: Venue,
};
