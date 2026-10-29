import { dict, type Lang } from '@/lib/i18n';
import { TOUR, type TourCard } from '@/lib/map-tour';
import { workHref } from '@/lib/canon';
import iberophone from '@/public/data/iberophone.json';
import milestones from '@/data/milestones.json';
import canon from '@/data/canon.json';

/* Server-side reads for the Atlas: what the cartouche counts, and the tour's
   cards with their text resolved for one language. */

const places = [...iberophone.countries, ...iberophone.points] as { tier: string }[];
export const COUNTS = {
  states: places.filter((p) => p.tier === 'emersa').length,
  presence: places.filter((p) => p.tier === 'submersa').length,
  authors: (canon as { corpusTotal?: number }).corpusTotal ?? 0,
  milestones: milestones.milestones.length,
};

type Milestone = { n: number; date: { en: string; es: string }; title: { en: string; es: string }; body: { en: string; es: string } };
const MILESTONES = new Map((milestones.milestones as Milestone[]).map((m) => [m.n, m]));
// the first sentence of a milestone's text: a card has room for one
const firstSentence = (s: string) => (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s).trim();

export function tourCards(lang: Lang): TourCard[] {
  const t = dict(lang).map.tour;
  const total = MILESTONES.size;
  return TOUR.map((stop, i) => {
    const m = stop.milestone ? MILESTONES.get(stop.milestone) : undefined;
    const last = i === TOUR.length - 1;
    const media = stop.media;
    const mediaText = !media ? undefined : media.kind === 'pending' ? media.what[lang] : media.credit[lang];
    if (!m) {
      return {
        ...stop, mediaText,
        kicker: t.introKicker, title: dict(lang).map.title, text: t.introText,
        link: { href: '#milestones', label: t.atlas },
      };
    }
    return {
      ...stop, mediaText,
      kicker: last ? `${m.date[lang]} · ${t.outroKicker}` : `${m.date[lang]} · ${t.milestone} ${m.n} ${t.of} ${total}`,
      title: m.title[lang],
      text: firstSentence(m.body[lang]),
      link: stop.canon ? { href: workHref(lang, stop.canon), label: t.canon } : { href: '#milestones', label: t.atlas },
    };
  });
}
