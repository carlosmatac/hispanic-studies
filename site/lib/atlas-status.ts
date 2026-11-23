import type { Family, Period } from '@/lib/atlas-chronicle';

/* A realm's status in a given year (#104): the curated period in force
   (data/atlas-status.json), else the family's own kind. Shared by the globe,
   which colours by it, and the popover, which tells it. Client-safe. */

export type Status = { kind: string; type?: string; name?: string; note?: string; sovereign?: string | null; period?: Period };

export function statusAt(f: Family | undefined, year: number): Status {
  if (!f) return { kind: 'other' };
  const p = f.periods?.find((x) => year >= x.from && year < x.to);
  if (!p) return { kind: f.kind === 'pt-indep' ? 'indep' : f.kind, type: f.type, sovereign: f.sovereign };
  return {
    kind: p.kind, type: p.type ?? f.type, name: p.name, note: p.note,
    sovereign: p.sovereign === undefined ? f.sovereign : p.sovereign, period: p,
  };
}

/** The colour family a status wears on the map (and the legend's item). */
export const legendKind = (kind: string) => (kind === 'pt-indep' ? 'indep' : kind === 'claim' ? 'es' : kind);
