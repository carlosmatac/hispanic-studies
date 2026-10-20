// Real IHS content, collected on 2026-10-12 (docs/research/context.md) and
// carried over from proposals/shared/content.js. Never add invented books,
// people, numbers, prices or quotes. Video and essay titles stay in their
// original language.

export const SITE = {
  name: 'Institute for Hispano Studies',
  imprint: 'De Indiis Editions',
  motto: 'Veritas prius pace',
  pamphlet: 'Hispanic Reunification: 200 Years of Theory and Praxis',
};

/** Follower counts we have verified. None for TikTok or Patreon: do not invent them. */
export const FOLLOWING = { youtube: '13.5K', instagram: '19K', x: '22K', substack: '587' };

export const CHANNELS = [
  { name: 'YouTube', url: 'https://www.youtube.com/@hispano_studies' },
  { name: 'Instagram', url: 'https://www.instagram.com/hispano_studies/' },
  { name: 'X', url: 'https://x.com/hispano_studies' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@hispano_studies' },
  { name: 'Substack', url: 'https://hispanicamerican.substack.com/' },
  { name: 'Patreon', url: 'https://www.patreon.com/HispanicAmericanStudies' },
];

export const DISCORD = { name: 'Reconquista Syndicate' };

export const SHORTS = [
  { id: 'XnwLiEsrPdA', title: 'Cross of Burgundy: The Flag That Connected the World', views: '203K' },
  { id: 'lwJfzpmMTD8', title: 'Why are indigenous Bolivians waving a Spanish imperial flag?', views: '151K' },
  { id: 'mszCuwwTb9c', title: 'From Napoleon to Franco: The French Insult That Backfired', views: '156K' },
  { id: 'w0t-IC2yi20', title: "Mexican Independence Day: You Can't Erase Spain From the Party", views: '47K' },
  { id: 'X2pDJsl6Xp0', title: 'You Were Given a History With 300 Years Cut Out of It', views: '15K' },
  { id: 'o-dErW9X2P0', title: 'The West went so far West… it became the East.', views: '4.7K' },
];

const SUB = 'https://hispanicamerican.substack.com/p/';
export const ESSAYS = [
  { title: 'The Catholic-Hispanic Position on Racism', author: 'Francisco Elías de Tejada', date: '2025-12-19', slug: 'the-catholic-hispanic-position-on' },
  { title: 'The Vikings Did Not Discover America', author: 'Iván Vélez', date: '2025-12-29', slug: 'the-vikings-did-not-discover-america' },
  { title: 'Oiréis hablar de mí: A Tribute to José Vasconcelos', author: 'Ismael Carvallo Robledo', translator: 'Beltrán Arellanes', date: '2025-09-17', slug: 'oireis-hablar-de-mi-a-tribute-to' },
  { title: 'Transitional Political Society, Neither Feudal nor Capitalist: The Spanish Empire', author: 'Santiago Armesilla', translator: 'Beltrán Arellanes', date: '2025-06-02', slug: 'transitional-political-society-neither' },
  { title: 'Spain and America', author: 'Gustavo Bueno', translator: 'Beltrán Arellanes', date: '2025-04-17', slug: 'spain-and-america' },
  { title: 'On Bullfighting', author: 'Gustavo Bueno', translator: 'Beltrán Arellanes', date: '2025-05-21', slug: 'on-bullfighting' },
  { title: 'Aryan Indigenismo and Manifest Destiny', author: 'Beltrán Arellanes', date: '2025-04-06', slug: 'aryan-indigenismo-and-manifest-destiny' },
  { title: 'The Black Legend: Threat to Hispanic Civilization (Part 1)', author: 'Alicia Melchor Herrera', date: '2025-04-12', slug: 'the-black-legend-threat-to-hispanic' },
]
  .map((e) => ({ ...e, url: SUB + e.slug }))
  .sort((a, b) => b.date.localeCompare(a.date));

export const shortThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const shortUrl = (id: string) => `https://www.youtube.com/shorts/${id}`;
