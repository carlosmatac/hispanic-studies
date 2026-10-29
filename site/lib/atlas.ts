import iberophone from '@/public/data/iberophone.json';
import milestones from '@/data/milestones.json';
import canon from '@/data/canon.json';

/* What the home counts about the Atlas. The Atlas itself is built from
   lib/atlas-chronicle.ts (issue #71). */

const places = [...iberophone.countries, ...iberophone.points] as { tier: string }[];
export const COUNTS = {
  states: places.filter((p) => p.tier === 'emersa').length,
  presence: places.filter((p) => p.tier === 'submersa').length,
  authors: (canon as { corpusTotal?: number }).corpusTotal ?? 0,
  milestones: milestones.milestones.length,
};
