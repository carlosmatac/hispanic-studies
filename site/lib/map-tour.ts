/* The Atlas map's automatic tour: about ten stops through the Iberophone world,
   each one a milestone from site/data/milestones.json (Beltrán's sixty), with
   where the camera goes, what lights up and which routes show.

   Countries are ISO 3166 numeric ids as in world-110m (e.g. '724' Spain).
   Media: AI video only for places and atmospheres, never historical scenes;
   historical stops use public-domain art (docs/brand/imagery-and-rights.md).
   Until a clip or image is sourced, `media.pending` says what goes there and
   the card shows it as a visible placeholder. */

export type TourMedia =
  | { kind: 'pending'; what: { en: string; es: string } }
  | { kind: 'video'; src: string; poster: string; credit: { en: string; es: string } }
  | { kind: 'image'; src: string; credit: { en: string; es: string } };

export type TourStop = {
  id: string;
  milestone?: number;          // n in milestones.json; none for the opening and closing frames
  frame: string[];             // countries the camera fits; [] is the whole world
  light: string[];             // countries that light up
  routes?: string[] | null;    // route ids to show; null = all of them
  pad?: number;
  media?: TourMedia;
  canon?: string;              // a canon work to open on the canon page, e.g. 'T030'
};

const AI = (en: string, es: string): TourMedia => ({ kind: 'pending', what: { en: `AI video: ${en}`, es: `Vídeo IA: ${es}` } });

export const TOUR: TourStop[] = [
  { id: 'world', frame: [], light: [], routes: null },
  {
    id: 'atlantic', milestone: 9, frame: ['724', '620', '214', '192', '630'], light: ['724', '214', '192'], routes: ['indias'], pad: 0.18,
    media: { kind: 'image', src: '/art/tour/puebla-desembarco-1862.jpg', credit: { en: 'Dióscoro Puebla, The First Landing of Columbus in America, 1862. Museo del Prado', es: 'Dióscoro Puebla, Primer desembarco de Cristóbal Colón en América, 1862. Museo del Prado' } },
  },
  {
    id: 'tenochtitlan', milestone: 14, frame: ['484'], light: ['484'], routes: [], pad: 0.35,
    media: AI('Mexico City today, the Zócalo from above', 'la Ciudad de México hoy, el Zócalo desde lo alto'),
  },
  {
    id: 'andes', milestone: 16, frame: ['604', '068', '218'], light: ['604', '068', '218'], routes: [], pad: 0.3,
    media: AI('the Andes at dawn above Cuzco', 'los Andes al amanecer sobre Cuzco'),
  },
  {
    id: 'pacific', milestone: 18, frame: ['608', '484'], light: ['608', '484'], routes: ['manila', 'tornaviaje'],
    media: { kind: 'image', src: '/art/tour/galleon-cabrera-bueno-1734.jpg', credit: { en: 'A galleon, after José González Cabrera Bueno, Navegación especulativa y práctica, Manila 1734', es: 'Galeón, según José González Cabrera Bueno, Navegación especulativa y práctica, Manila 1734' } },
  },
  {
    id: 'valladolid', milestone: 17, frame: ['724', '620'], light: ['724'], routes: [], pad: 0.25,
    media: AI('a cloister in the Salamanca style, sandstone in afternoon light', 'un patio de arquitectura salmantina, piedra de Villamayor a media tarde'),
  },
  {
    id: 'rio', milestone: 22, frame: ['620', '076'], light: ['620', '076'], routes: ['brasil'], pad: 0.12,
    media: AI('the bay of Rio de Janeiro from the sea', 'la bahía de Río de Janeiro desde el mar'),
  },
  {
    id: 'guadalupe', milestone: 31, frame: ['484'], light: ['484'], routes: [], pad: 0.7,
    media: AI('the Sonoran desert at dusk', 'el desierto de Sonora al atardecer'),
  },
  {
    id: 'caribbean', milestone: 39, frame: ['192', '630', '214', '608'], light: ['192', '630', '608'], routes: [],
    media: AI('Old Havana seen from the sea', 'La Habana Vieja vista desde el mar'),
  },
  {
    id: 'vasconcelos', milestone: 46, frame: ['484', '170', '604', '076', '032', '152'], light: ['484', '170', '604', '076', '032', '152', '858'], routes: [], pad: 0.08,
    canon: 'T030',
  },
  {
    id: 'lusophone', milestone: 57, frame: ['620', '076', '024', '508'], light: ['620', '076', '024', '508', '624', '626', '226'], routes: ['india', 'brasil'], pad: 0.08,
  },
  { id: 'iberofonia', milestone: 60, frame: [], light: [], routes: null },
];

/** A stop with its card text resolved for one language (built on the server). */
export type TourCard = TourStop & {
  kicker: string;
  title: string;
  text: string;
  link: { href: string; label: string };
  mediaText?: string;          // credit, or what is still pending
};
