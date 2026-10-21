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

export type ChannelKey = 'youtube' | 'instagram' | 'x' | 'tiktok' | 'substack' | 'patreon' | 'discord';

/** `unit` says what the count counts: YouTube and Substack have subscribers, the rest followers. */
export const CHANNELS: { key: ChannelKey; name: string; handle: string; url: string; following?: string; unit?: 'subscribers' | 'followers' }[] = [
  { key: 'youtube', name: 'YouTube', handle: '@hispano_studies', url: 'https://www.youtube.com/@hispano_studies', following: FOLLOWING.youtube, unit: 'subscribers' },
  { key: 'instagram', name: 'Instagram', handle: '@hispano_studies', url: 'https://www.instagram.com/hispano_studies/', following: FOLLOWING.instagram, unit: 'followers' },
  { key: 'x', name: 'X', handle: '@hispano_studies', url: 'https://x.com/hispano_studies', following: FOLLOWING.x, unit: 'followers' },
  { key: 'tiktok', name: 'TikTok', handle: '@hispano_studies', url: 'https://www.tiktok.com/@hispano_studies' },
  { key: 'substack', name: 'Substack', handle: 'hispanicamerican', url: 'https://hispanicamerican.substack.com/', following: FOLLOWING.substack, unit: 'subscribers' },
  { key: 'patreon', name: 'Patreon', handle: 'HispanicAmericanStudies', url: 'https://www.patreon.com/HispanicAmericanStudies' },
];
export const channel = (key: ChannelKey) => CHANNELS.find((c) => c.key === key)!;

export const DISCORD = { name: 'Reconquista Syndicate' };

/* Every video on the channel, read from youtube.com/@hispano_studies on
   2026-10-21 (IDs checked against YouTube's oEmbed). Titles are the
   originals, minus hashtags and emoji; view counts are as of that day. */
export const VIEWS_AS_OF = '2026-10-21';

export const VIDEOS = [
  { id: 'BISc6y6fIuM', title: 'The "Wild" West Was a LIE', views: '98K' },
  { id: 'JNLr7NM_buA', title: 'Assimilation Is OVER: Bad Bunny and America’s Spanish Future', views: '58K' },
  { id: '3LYcIzK8mxo', title: 'There Was No Mexico Before Cortes', views: '28K' },
  { id: '5Yug5P6lbCc', title: 'Spain vs. The False Messiah: The Battle for the Holy Land (1532)', views: '19K' },
  { id: 'NJKfmnwbOXQ', title: 'How to be Catholic If You Don’t Believe in God', views: '10K' },
  { id: 'Xinb9TN9aOM', title: 'Why Mexico Keeps FAILING at the World Cup', views: '6.1K' },
];

export const SHORTS = [
  { id: 'XnwLiEsrPdA', title: 'Cross of Burgundy: The Flag That Connected the World', views: '230K' },
  { id: 'mszCuwwTb9c', title: 'From Napoleon to Franco: The French Insult That Backfired', views: '156K' },
  { id: 'lwJfzpmMTD8', title: 'Why are indigenous Bolivians waving a Spanish imperial flag?', views: '155K' },
  { id: 'w0t-IC2yi20', title: 'Mexican Independence Day: You Can’t Erase Spain From the Party', views: '51K' },
  { id: 'SPIvTx33sOk', title: 'Why Does Mexican Pride Put Spain on Trial?', views: '39K' },
  { id: 'MfZDgdXhLvM', title: 'Bad Bunny is doing more than just making hits; he’s leading a cultural shift', views: '34K' },
  { id: '8v0CMVYXJpE', title: 'Why Unamuno Told Spain to Become More African', views: '31K' },
  { id: 'N9-_qD9BvXY', title: 'What Happened to Mexico’s Indigenous Languages After Independence?', views: '30K' },
  { id: '35z7XHXk5W8', title: '“Columbus Didn’t Discover America” Misses the Point', views: '25K' },
  { id: 'urUxytVc2Zc', title: 'LATINO vs. HISPANIC: Know the Difference', views: '23K' },
  { id: 'X2pDJsl6Xp0', title: 'You Were Given a History With 300 Years Cut Out of It', views: '16K' },
  { id: 'G1s13iY9Rrc', title: 'Why Anglos Became Pioneers and Spaniards Became Conquistadors', views: '13K' },
  { id: '2RMoqe-pz8o', title: 'THE LIE THAT OUTLIVED THE EMPIRE | SPAIN’S BLACK LEGEND', views: '10K' },
  { id: 'in8ZZBfXXlo', title: 'Too American for Mexico, Too Mexican for America', views: '10K' },
  { id: 'PeOALq5v0zY', title: 'The Bicontinental Spain Nobody Talks About', views: '10K' },
  { id: 'mMXKN9nTeMo', title: 'Indigenous languages survived because of Spain — not in spite of it. History rewired.', views: '10K' },
  { id: 'ZJaNB5HJudU', title: 'Spain Built the New World. England Rebuilt the Old.', views: '9.6K' },
  { id: 'TwMFI684Wcc', title: 'Zapata’s Revolution Began With Spanish Land Titles', views: '9.4K' },
  { id: 'xvZouT3m_q4', title: 'The Jesuit Secret for a Productive Day', views: '9.2K' },
  { id: 'tBq7cuILmbE', title: 'Why Martyrs Never Have to Govern | Che Guevara & José Antonio', views: '7.7K' },
  { id: 'F2ownKA80Ug', title: 'The New Kingmakers: Hispanics & The 2024 Shift', views: '5.2K' },
  { id: 'o-dErW9X2P0', title: 'The West went so far West… it became the East.', views: '4.7K' },
  { id: 'AmmDHiD7MPI', title: 'Why the Church Spends Money on Art', views: '4K' },
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

/** YouTube's own thumbnails: the portrait frame for Shorts, the 16:9 one for videos. */
export const shortThumb = (id: string) => `https://i.ytimg.com/vi/${id}/oar2.jpg`;
export const shortUrl = (id: string) => `https://www.youtube.com/shorts/${id}`;
export const videoThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const videoUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
