// Real IHS content, collected on 2026-10-12 (see docs/research/context.md). Every proposal reads from here so the
// three mockups show the same, verified material. Never add invented books, people, prices or quotes.

export const SITE = {
  name: 'Institute for Hispano Studies',
  short: 'IHS',
  tagline: 'Hispanic-Catholic Civilization & Pan-Iberian Geopolitics',
  imprint: 'De Indiis Editions',
  motto: 'Veritas prius pace',
  email: 'hispanostudies@gmail.com',
  pamphlet: 'Hispanic Reunification: 200 Years of Theory and Praxis',
  pamphletEs: 'Reunificación hispánica: 200 años de teoría y praxis',
  nav: ['Watch', 'Read', 'Books', 'About', 'Merch'],
  navEs: ['Ver', 'Leer', 'Libros', 'Nosotros', 'Tienda'],
};

export const STATS = [
  { n: '22K', label: 'on X' },
  { n: '19K', label: 'on Instagram' },
  { n: '13.5K', label: 'on YouTube' },
  { n: '203K', label: 'views on our most-watched Short' },
];

export const CHANNELS = [
  { name: 'YouTube', url: 'https://www.youtube.com/@hispano_studies' },
  { name: 'Instagram', url: 'https://www.instagram.com/hispano_studies/' },
  { name: 'X', url: 'https://x.com/hispano_studies' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@hispano_studies' },
  { name: 'Substack', url: 'https://hispanicamerican.substack.com/' },
  { name: 'Patreon', url: 'https://www.patreon.com/HispanicAmericanStudies' },
];

export const DISCORD = { name: 'Reconquista Syndicate', note: 'Discord server · free to join' };

export const SHORTS = [
  { id: 'XnwLiEsrPdA', title: 'Cross of Burgundy: The Flag That Connected the World', views: '203K' },
  { id: 'lwJfzpmMTD8', title: 'Why are indigenous Bolivians waving a Spanish imperial flag?', views: '151K' },
  { id: 'mszCuwwTb9c', title: 'From Napoleon to Franco: The French Insult That Backfired', views: '156K' },
  { id: 'w0t-IC2yi20', title: "Mexican Independence Day: You Can't Erase Spain From the Party", views: '47K' },
  { id: 'X2pDJsl6Xp0', title: 'You Were Given a History With 300 Years Cut Out of It', views: '15K' },
  { id: 'o-dErW9X2P0', title: 'The West went so far West… it became the East.', views: '4.7K' },
];

export const VIDEOS = [
  { id: '3LYcIzK8mxo', title: 'There Was No Mexico Before Cortes' },
  { id: 'BISc6y6fIuM', title: 'The "Wild" West Was a LIE' },
  { id: 'JNLr7NM_buA', title: "Assimilation Is OVER: Bad Bunny and America's Spanish Future" },
  { id: '5Yug5P6lbCc', title: 'Spain vs. The False Messiah: The Battle for the Holy Land (1532)' },
  { id: 'NJKfmnwbOXQ', title: "How to be Catholic If You Don't Believe in God" },
  { id: 'Xinb9TN9aOM', title: 'Why Mexico Keeps FAILING at the World Cup' },
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
].map((e) => ({ ...e, url: SUB + e.slug }));

// Seven-part manifesto outline from the brief (docs/brief). Titles only: the owner's final text is authoritative.
export const MISSION = [
  { n: 'I', title: 'Against the Black Legend', es: 'Contra la Leyenda Negra' },
  { n: 'II', title: 'In defense of the Catholic inheritance', es: 'En defensa de la herencia católica' },
  { n: 'III', title: 'In defense of mestizaje', es: 'En defensa del mestizaje' },
  { n: 'IV', title: 'Spanish and Portuguese: Iberofonía', es: 'Español y portugués: Iberofonía' },
  { n: 'V', title: 'An intellectual tradition of reunification', es: 'Una tradición intelectual de reunificación' },
  { n: 'VI', title: 'Plural expressions of Hispanism', es: 'Expresiones plurales del hispanismo' },
  { n: 'VII', title: 'Our practical mission', es: 'Nuestra misión práctica' },
];

export const MISSION_SUMMARY =
  'The Institute for Hispano Studies is dedicated to the study, defense, and renewal of Hispanic civilization. Through audiovisual work, publishing, translation, and community, we seek to make its history and intellectual traditions accessible across languages and borders.';

export const shortThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const shortUrl = (id) => `https://www.youtube.com/shorts/${id}`;
export const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const fmtDate = (iso, locale = 'en-US') =>
  new Date(iso + 'T12:00:00').toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });

// Fills every [data-list="name"] element using its <template> child: {{key}} placeholders, nested keys not needed.
export function fill(root, name, items) {
  root.querySelectorAll(`[data-list="${name}"]`).forEach((el) => {
    const tpl = el.querySelector('template');
    if (!tpl) return;
    const html = items
      .map((it, i) => tpl.innerHTML.replace(/\{\{(\w+)\}\}/g, (_, k) => (k === 'i' ? String(i + 1).padStart(2, '0') : it[k] ?? '')))
      .join('');
    el.insertAdjacentHTML('beforeend', html);
  });
}

export function fillAll(root = document) {
  fill(root, 'shorts', SHORTS.map((s) => ({ ...s, thumb: shortThumb(s.id), url: shortUrl(s.id) })));
  fill(root, 'videos', VIDEOS.map((v) => ({ ...v, thumb: shortThumb(v.id), url: videoUrl(v.id) })));
  fill(root, 'essays', ESSAYS.map((e) => ({ ...e, dateLabel: fmtDate(e.date), byline: e.translator ? `${e.author} · trans. ${e.translator}` : e.author })));
  fill(root, 'mission', MISSION);
  fill(root, 'stats', STATS);
  fill(root, 'channels', CHANNELS);
}
