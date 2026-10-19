# Brand plan: Institute for Hispano Studies

Written after the first meeting (2026-10-14). The source of truth for what Beltrán asked for is [`docs/meeting/2026-10-14-decisions.md`](../meeting/2026-10-14-decisions.md); this file turns it into a system we can build against. Imagery and rights live in [`imagery-and-rights.md`](imagery-and-rights.md).

## The brief in one paragraph

A **reference instrument**, not a gallery. Someone arguing about the Black Legend should be able to send a link and win the argument with it. It has to look like an institute — sober, dense, confident — while carrying a creator's energy, and it has to say what it is in the first screen, because "esa primera imagen, solo hay una". The organising image is a **map**; the organising argument is **three pillars**; the proof is **a canon of 50 authors and 60 dated milestones** that ends in a book you can buy.

## Design principles

1. **Instrument, not poster.** Every ornament has to carry information. A border that is just a border gets cut; a border that is a map graticule stays.
2. **The content is the decoration.** 267 authors, 94 events, 60 milestones, 319 sources. Dense, well-set data *is* the aesthetic — this is what separates "institute" from "personal site".
3. **One type system, one structure, three colour registers.** His own rule: "hay que ser consistente con tipografía, con colores y la identidad". His own exception: "la propia estética de la página podría ir moviéndose según la sección". Reconciled below.
4. **Motion on user action, ambience almost never.** Budget in the table below. "Militante" is not "dinámica".
5. **Sober is not grey.** The Hispanic baroque is high contrast and high saturation. Soberness comes from restraint in *motion and layout*, not from desaturating everything into a startup landing page.
6. **Bilingual by construction.** Every string we author exists in EN and ES from the first commit. No retrofitting.

## Three pillars: the trunks

His words: "molaría quizá en la propia página que eso sean como los tres troncos" [00:00]. So the pillars are a **navigation primitive**, not a copy block: every video, essay, book, author and milestone carries one or two pillar tags, and each pillar has a landing view.

| Pillar | EN / ES | What it covers | Glyph | Accent |
| --- | --- | --- | --- | --- |
| **Mestizaje** | Mestizaje / Mestizaje | Castas, *La raza cósmica*, transculturación, Indo-American thought, the Black Legend on race | Two rivers joining into one — abstracted from the casta-painting grid, not a portrait | Terracotta `--pillar-mestizaje` |
| **Catolicismo** | Catholicism / Catolicismo | Guadalupe, evangelisation, Salamanca theology, Catholic political thought | The Guadalupe mandorla reduced to a rayed oval; no face, no figure | Burgundy `--pillar-catolicismo` |
| **Lengua** | Language / Lengua | Spanish and Portuguese, the academies, Iberofonía, Nebrija, translation itself | A ligature: the `Ñ` tilde drawn as a long diacritic over two stems | Talavera blue `--pillar-lengua` |

Why abstract glyphs and not paintings: the pillars appear as 24px tags next to hundreds of items. A cropped Guadalupe at 24px is unreadable and, worse, irreverent. Devotional imagery gets full size and full respect or it does not appear — see [`imagery-and-rights.md`](imagery-and-rights.md).

Open: the exact glyph drawings are an issue of their own (iconography set). The decision locked here is *abstract line glyph, one per pillar, same stroke weight as the UI icons*.

## Three landscapes: the colour registers

He named three imaginative settings [02:03], [02:57] and the mechanism to use them: shift the register per section. The constant that makes this a brand and not a mood swing:

**Constants across the whole site** — never change per section:
- Type system (below).
- `--ink` for text, `--burgundy` for the brand mark and primary action, `--gold` as the single accent for emphasis.
- Layout, grid, radii (none: square corners), stroke weight, motion budget.

**Variables per section** — background temperature and one secondary accent only.

### Tokens

```css
:root {
  /* identity — constant everywhere */
  --ink:            #1E1D1A;  /* text; from his own canon chart */
  --ink-muted:      #696259;
  --paper:          #F5EFE2;  /* ground; from his own canon chart */
  --paper-deep:     #EBE1CE;
  --burgundy:       #470B15;  /* already live on hispanostudies.com */
  --burgundy-dark:  #2F070D;
  --gold:           #AD8220;  /* from his canon chart, not a brighter leaf gold */
  --rupture:        #B42E35;  /* ruptures, alerts, the militant register */

  /* register 1 · Southwest / cowboys / Castilla profunda */
  --sw-ground:      #DCCDB2;  /* sun-bleached adobe */
  --sw-accent:      #A8502F;  /* terracotta */
  --sw-shade:       #6E7F63;  /* cactus sage */

  /* register 2 · Caribbean / Miami */
  --cb-ground:      #0E2C38;  /* night water */
  --cb-accent:      #1FA89C;  /* aqua */
  --cb-neon:        #FF5C8A;  /* the only neon in the system */

  /* register 3 · Virreinal city / baroque */
  --vr-ground:      #16100F;  /* El Escorial vault */
  --vr-accent:      #1F3E8C;  /* talavera blue */
  --vr-stone:       #E3D9C6;  /* limestone */
}
```

Two deliberate choices worth defending at the next meeting:

- **The neutral palette is lifted from his own chart.** `docs/provided-documentation/Hispanic_Reunification_Canon_data.json` carries a `layout.palette` that someone already tuned for exactly this content: warm paper, near-black ink, muted band colours, one red for ruptures, one ochre gold. Adopting it means the Atlas and Canon views are natively on-brand, and it is a palette *he* commissioned.
- **Burgundy stays.** It is already on hispanostudies.com, on the logo, and in the Substack mark. Changing the primary colour would throw away the only brand equity he has.

### Register per section

| Section | Register | Ground | Secondary accent | Why |
| --- | --- | --- | --- | --- |
| Hero + Atlas (map, timeline) | **Atlas** (neutral) | `--paper` | `--rupture` for ruptures, `--gold` for routes | The map is the image. Anything else competes with it. |
| Canon (50 authors) | **Atlas** (neutral) | `--paper` | Bueno band colours from his JSON | Data view; needs eight distinguishable, muted hues and his chart already has them. |
| Watch (videos, shorts) | **Southwest** | `--sw-ground` | `--sw-accent` | His thumbnails are loud and high-contrast; a warm bleached ground frames them instead of fighting them. Also his most "creator" surface, and the Southwest is his most personal setting. |
| Read (essays, Substack) | **Atlas** (neutral) | `--paper` | `--gold` | Long-form bilingual reading. Maximum legibility, nothing else. |
| Books · De Indiis Editions | **Virreinal / baroque** | `--vr-ground` | `--gold` + `--vr-stone` | His explicit instruction: "para los libros, para De Indiis Editions, lo que más pega es el barroco […] la biblioteca del monasterio de El Escorial" [02:57]. |
| About / mission | **Virreinal** | `--vr-ground` | `--vr-accent` | Continues from Books; the "tradition and depth" argument [04:01]. |
| Community (Discord, Patreon) | **Militant** | `--burgundy-dark` | `--rupture` | "Como haciendo el ejército, únete al ejército" [13:29]. Highest contrast block on the site. |
| Merch | **Caribbean / Miami** | `--cb-ground` | `--cb-neon` | The commercial, playful register, and the one place neon belongs. Also solves the imagery gap: merch is product mockups, not historical art, so it needs no Caribbean painting we do not have. |

Transitions between registers are **hard cuts at section boundaries**, not gradients. He praised exactly that in a reference site: "se integra muy bien con el resto de la página […] es como una transición muy, ¿sabes? No hay como salto directo" [10:22] — read in context he liked continuity of *material*, not crossfades. Continuity here comes from type, stroke and layout staying identical across the cut.

## Type

Three families, all Google Fonts, all already used in this repo. This is continuity with the live site, not a reinvention.

| Role | Family | Why |
| --- | --- | --- |
| Display, headlines, book titles | **Ibarra Real Nova** | A revival of the types of the Imprenta Real de Madrid (Joaquín Ibarra, 1780s) — the printing house of the late Hispanic monarchy. Already the display face on hispanostudies.com. The brand story writes itself, and it is sober without being generic. |
| Body, UI, map place labels | **Inter** | Already in his WordPress theme. Neutral, excellent diacritics for ES/PT, and it holds up at 11–13px for map labels in small caps with open tracking. |
| Data, legends, years, figures, captions | **IBM Plex Mono** | The "instrument" voice: coordinates, dates, author codes, Bueno class tags. Used across the existing proposals, so there is continuity with what he already saw and liked. |

Rules:
- Headlines in Ibarra Real Nova, tight (`line-height: 1.05`), never letterspaced, never all-caps.
- Small caps + `0.12em` tracking in Inter for map labels and section eyebrows. That is the whole "atlas" flavour; no condensed fourth font.
- Mono is for things that are *values* (1898, B2.6, A043, 41°24′N). Never for prose.
- ES text sets 2–5% longer than EN. Reserve the space in the layout from the start; do not shrink the ES type to fit.

## Motion budget

He rejected both extremes: not "excesivamente dinámica", but "sin ser aburrido". A written budget so this is reviewable rather than a matter of taste.

| Surface | Allowed | Hard limits |
| --- | --- | --- |
| Hero map | One ambient effect: routes drawing themselves once on load, then still | ≤ 6s, runs once, no loop, no parallax |
| Atlas timeline | Motion **only on user action** — step forward/back, Prezi-style pan-and-zoom between frames | 450ms per step, eased, one transform at a time |
| Canon chart | Hover highlight and filter transitions only | 150ms |
| Section reveals | None | No scroll-triggered cascades anywhere |
| Video | One muted loop maximum on the whole site, and not in the hero | Never autoplays with sound |
| Hover states | Colour and underline only | No scale, no lift, no shadow bloom |
| `prefers-reduced-motion` | Every effect above has a designed still state, not just `animation: none` | Routes drawn complete; timeline becomes a list |

The things Beltrán liked in M/N (painted heroes dissolving, living painting video) are *not* in this budget. They move to the Community block as a single static backdrop, which is where he himself put them [13:29].

## Information architecture

Keeps the brief's homepage order so it stays comparable to A–N, with the map as the hero and the Atlas promoted to a top-level destination.

```
Nav:  Atlas · Watch · Read · Books · About · Merch        EN/ES · cart

Home
 1  Hero: the Iberofonía map + pamphlet signup
 2  The three pillars (trunks) — three entry points
 3  Atlas teaser: 60 milestones, stepped → /atlas
 4  Books: De Indiis Editions, priority titles → /books
 5  Watch: shorts + long videos
 6  Read: Substack essays
 7  Mission (the three pillars argued, not listed)
 8  Community: Discord "Reconquista Syndicate" + Patreon
 9  Footer: every channel, EN/ES, legal

/atlas    the map + the 60 milestones, stepped
/canon    the 50 authors, filterable by pillar, Bueno class, operation, region
/books    De Indiis catalogue, by series
```

Why the Atlas gets its own route: it is the thing that makes the site a *reference* rather than a link dump — goal #1 in his list [17:24] — and it is the only part a reader can send to someone else as a standalone argument.

## What we are explicitly not doing

- No glyph-field hero. The `shared/glyph-field.js` engine is a beautiful effect and it reads as "tech startup", which is the opposite of institute. Keep the code; do not ship it on the hero.
- No Unicorn Studio in production. Free plan is non-commercial and watermarked, and nothing in this plan needs WebGL. (`docs/research/unicorn-inspiration.md` stays as research.)
- No AI-generated historical scenes. See [`imagery-and-rights.md`](imagery-and-rights.md).
- No 3D globe. He floated it ("incluso un modelo 3D", [21:18]) but a flat projection is more legible, loads faster, labels better and is what every atlas he admires actually uses. Worth showing him the flat version and letting him argue.
- No 267-author chart. 50, by his own concession [34:23].
