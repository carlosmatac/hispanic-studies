/* ==========================================================================
   Themes.

   The three presets are not decoration: they are the three imaginative
   settings Beltrán described in the first meeting [02:03], made switchable so
   he can click through them and tell us which one the site should live in.

     Desierto   "el Southwest de Estados Unidos, cowboys, desierto, norte de
                 México… que también es Castilla, la Castilla profunda"
     Caribe     "el Caribe, Miami… tropical, fresco, neón"
     Virreinal  "una ciudad virreinal, como la Ciudad de México, como Quito,
                 como Salamanca"

   Each swaps palette and type together, because a palette without its
   typography is half a register. Applied as custom properties on <html>, so
   any page that consumes the token names gets them.
   ========================================================================== */

export const THEMES = {
  virreinal: {
    label: { en: 'Viceregal', es: 'Virreinal' },
    note: {
      en: 'Mexico City, Quito, Salamanca. Baroque stone, talavera, gold leaf.',
      es: 'Ciudad de México, Quito, Salamanca. Piedra barroca, talavera, pan de oro.',
    },
    swatch: ['#16213E', '#7B2230', '#D9A441'],
    fonts: ['Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600'],
    tokens: {
      '--base': '#fbf6ec',
      '--base-2': '#f3ead9',
      '--ink': '#171310',
      '--ink-soft': '#6b5f54',
      '--line': '#ddd0bb',
      '--block-1': '#16213e',
      '--block-2': '#0f0c0b',
      '--block-3': '#7b2230',
      '--on-block': '#f4ece0',
      '--on-block-soft': 'rgba(244, 236, 224, 0.68)',
      '--accent': '#d9a441',
      '--accent-ink': '#1a1205',
      '--accent-2': '#c96a52',
      '--display': '"Fraunces", Georgia, serif',
      '--display-wght': '600',
      '--display-tracking': '-0.025em',
      '--body': 'Inter, system-ui, sans-serif',
    },
    // O · Atlas keeps its own structure — paper, hairlines, square corners —
    // so each theme hands it a matching token set rather than overwriting it.
    // Virreinal is O's own palette, so the default look is unchanged.
    plate: {
      '--paper': '#f5efe2', '--paper-deep': '#ebe1ce',
      '--ink': '#1e1d1a', '--ink-muted': '#696259',
      '--grid': '#c9bfaf', '--grid-light': '#ded6c9',
      '--burgundy': '#470b15', '--burgundy-dark': '#2f070d',
      '--gold': '#ad8220', '--gold-light': '#d6b85f', '--rupture': '#b42e35',
      '--map-emersa': '#7b2230', '--map-submersa': '#9c6a52',
      '--display': '"Ibarra Real Nova", Georgia, serif',
    },
  },

  desierto: {
    label: { en: 'Desert', es: 'Desierto' },
    note: {
      en: 'The Southwest and Castilla profunda. Adobe, terracotta, cactus, sun.',
      es: 'El Southwest y la Castilla profunda. Adobe, terracota, cactus, sol.',
    },
    swatch: ['#33211a', '#a8502f', '#e79a3e'],
    fonts: ['Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700'],
    tokens: {
      '--base': '#f7f0e4',
      '--base-2': '#ede2cf',
      '--ink': '#1e1712',
      '--ink-soft': '#6e6054',
      '--line': '#d9c9b2',
      '--block-1': '#33211a',
      '--block-2': '#a8502f',
      '--block-3': '#4f5e48',
      '--on-block': '#f7efe2',
      '--on-block-soft': 'rgba(247, 239, 226, 0.7)',
      '--accent': '#e79a3e',
      '--accent-ink': '#241306',
      '--accent-2': '#8a9a6f',
      '--display': '"Bricolage Grotesque", system-ui, sans-serif',
      '--display-wght': '700',
      '--display-tracking': '-0.035em',
      '--body': 'Inter, system-ui, sans-serif',
    },
    plate: {
      '--paper': '#f7f0e4', '--paper-deep': '#ede2cf',
      '--ink': '#1e1712', '--ink-muted': '#6e6054',
      '--grid': '#d9c9b2', '--grid-light': '#e7dbc6',
      '--burgundy': '#8a3b1f', '--burgundy-dark': '#5e2614',
      '--gold': '#c57a2a', '--gold-light': '#e0a85c', '--rupture': '#b4432e',
      '--map-emersa': '#a8502f', '--map-submersa': '#b8865f',
      '--display': '"Bricolage Grotesque", system-ui, sans-serif',
    },
  },

  caribe: {
    label: { en: 'Caribbean', es: 'Caribe' },
    note: {
      en: 'Miami as the capital of US Hispanidad. Night water, aqua, neon.',
      es: 'Miami como capital de la hispanidad estadounidense. Agua nocturna, aguamarina, neón.',
    },
    swatch: ['#0b2e3b', '#10565c', '#16c8b0'],
    fonts: ['Space+Grotesk:wght@500;700'],
    tokens: {
      '--base': '#edf7f6',
      '--base-2': '#dcefed',
      '--ink': '#0a1f26',
      '--ink-soft': '#4a6b72',
      '--line': '#c2ded9',
      '--block-1': '#0b2e3b',
      '--block-2': '#10565c',
      '--block-3': '#e8734a',
      '--on-block': '#e9fbf8',
      '--on-block-soft': 'rgba(233, 251, 248, 0.7)',
      '--accent': '#16c8b0',
      '--accent-ink': '#04221e',
      '--accent-2': '#ff5c8a',
      '--display': '"Space Grotesk", system-ui, sans-serif',
      '--display-wght': '700',
      '--display-tracking': '-0.03em',
      '--body': '"Space Grotesk", system-ui, sans-serif',
    },
    plate: {
      '--paper': '#edf7f6', '--paper-deep': '#dcefed',
      '--ink': '#0a1f26', '--ink-muted': '#4a6b72',
      '--grid': '#bcd9d4', '--grid-light': '#d3e8e4',
      '--burgundy': '#0b4049', '--burgundy-dark': '#06282f',
      '--gold': '#0f9e8c', '--gold-light': '#5fd4c3', '--rupture': '#e8734a',
      '--map-emersa': '#10565c', '--map-submersa': '#5e9aa0',
      '--display': '"Space Grotesk", system-ui, sans-serif',
    },
  },
};

export const THEME_ORDER = ['virreinal', 'desierto', 'caribe'];
const STORE = 'ihs-theme';

/** Every display family, in one Google Fonts request. */
export function fontHref(extra = ['Inter:wght@400;500;600', 'IBM+Plex+Mono:wght@400;500']) {
  const families = [
    ...THEME_ORDER.flatMap((k) => THEMES[k].fonts),
    ...extra,
  ].map((f) => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * @param {string} name
 * @param {object} [opts]
 * @param {boolean} [opts.plate] also apply the plate token set, for O · Atlas
 */
export function applyTheme(name, opts = {}) {
  const theme = THEMES[name] || THEMES[THEME_ORDER[0]];
  const root = document.documentElement;
  const set = opts.plate && theme.plate ? theme.plate : theme.tokens;
  for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
  root.dataset.theme = name;
  try { localStorage.setItem(STORE, name); } catch { /* private window: fine */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: name }));
}

export function storedTheme() {
  // ?theme=caribe wins, so a specific register can be linked and shown
  try {
    const q = new URL(window.location).searchParams.get('theme');
    if (q && THEMES[q]) return q;
  } catch { /* ignore */ }
  try {
    const v = localStorage.getItem(STORE);
    if (v && THEMES[v]) return v;
  } catch { /* ignore */ }
  return THEME_ORDER[0];
}

/**
 * Build the switcher. Each button carries the theme's own swatch, so the
 * control shows what it does before you click it.
 */
export function mountThemeSwitcher(host, { lang = () => 'en', compact = false, plate = false } = {}) {
  host.classList.add('themer');
  if (compact) host.classList.add('themer--compact');

  const render = () => {
    const L = lang();
    const current = document.documentElement.dataset.theme || THEME_ORDER[0];
    host.innerHTML = THEME_ORDER.map((k) => {
      const t = THEMES[k];
      const dots = t.swatch.map((c) => `<i style="background:${c}"></i>`).join('');
      return `<button type="button" data-theme-btn="${k}" aria-pressed="${k === current}"
        title="${t.note[L] || t.note.en}"><span class="themer__dots">${dots}</span>
        <span class="themer__name">${t.label[L] || t.label.en}</span></button>`;
    }).join('');
    for (const b of host.querySelectorAll('[data-theme-btn]')) {
      b.addEventListener('click', () => applyTheme(b.dataset.themeBtn, { plate }));
    }
  };

  document.addEventListener('themechange', render);
  document.addEventListener('langchange', render);
  render();
  return render;
}
