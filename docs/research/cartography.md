# Cartography: how we build the map

The map is the hero and a top-level destination, because it is the one thing Beltrán singled out twice: "es que lo del mapa sería lo mejor, yo creo" [16:38] and "la cartografía me parece espectacular" [18:58]. This file decides what we draw it from.

## What he asked for

He showed us <https://atlashispano.blogspot.com/> and said:

> "Este tío hace unos mapas espectaculares, y no sé si sería posible coger la base de un mapa y hacerlo." — [19:44]

> "Esto es muy potente, porque es como: esto es lo que nos mola, esto es lo que defendemos, esta unidad, estos países." — [20:31]

He compared two of them: the phased one ("este es quizá un poco esquemático porque está dividido en fases: primero se tienen que unir Sudamérica, México, incorporar a España, Portugal") and the Iberofonía one ("este es más neutro"). **He preferred the neutral one.** That is a useful editorial signal: the map states what the Iberophone world *is*, not a programme for assembling it.

He also wanted it to explain itself: "yo, por ejemplo, que no entiendo del tema, no entiendo qué es lo que se ve ahí; pero un vídeo o un modelo que te lo diga" [21:18]. Hence the 60 stepped frames rather than one dense static plate.

## Atlas Hispano: not cleared

| Post | What it shows | Licence status |
| --- | --- | --- |
| *La Iberofonía* (2022) | Three tiers: *Iberia Emersa* (official Spanish/Portuguese), *Iberia Submersa* (historical presence, displaced), ultraperiphery. Credited to **Álvaro Durántez Prados** | No licence text found on the page |
| *El Mundo Ibérico: articulación geopolítica* (2022) | ~30 nations on five continental platforms, colour-coded by population, Catholic percentage, Latin-language hatching, diaspora circles, five responsibility zones (Brazil, Mexico, Spain, Angola, Philippines) | No licence text found on the page. PNG + PDF via Google Drive |
| *Atlas Geopolítico del Mundo Ibérico* | Combined index and download | Not verified |

The blog's Atom feed mentions CC0 and CC BY-SA "on individual posts", but we could not verify a licence on either of the two posts that matter. And the Iberofonía map is attributed to a named third party — Durántez Prados is the diplomat and author who coined *iberofonía* as a term, and he appears in Beltrán's own 60-milestones document as the author of the contemporary pan-Iberian proposal (milestone 60).

**Conclusion: we do not trace, adapt or re-upload these.** Even under CC BY-SA, SA would force a share-alike licence onto our map layer, which is not a decision to make by accident.

Two things to do instead, in parallel:

1. **Draw our own** (below). No permission needed, better output, data-driven.
2. **Ask** — and have Beltrán ask, not us. Durántez Prados is a plausible *collaborator* for the institute rather than merely a source: an endorsement or a commissioned map from the person who coined the term is worth more than a borrowed PNG. Added to [`../meeting/questions.md`](../meeting/questions.md).

## What we draw from

### Base geometry — Natural Earth

<https://www.naturalearthdata.com/> — explicitly **public domain**, no attribution required (we will credit it anyway). It is the base layer of most professional reference maps.

- `ne_50m_admin_0_countries` for the main map; `110m` for the hero (smaller payload).
- `ne_50m_coastline`, `ne_50m_land`, `ne_50m_ocean`, `ne_50m_graticules_15`.
- `ne_50m_admin_0_countries` carries ISO A2 codes, which join directly to the `region_code` field on all 267 authors. That join is what puts the canon on the map with no manual placement.

Pipeline: download the shapefiles once, convert to a trimmed GeoJSON/TopoJSON keeping only the fields we use, commit the result under `proposals/shared/data/`. No runtime dependency, no npm at build time either — a one-off Python script with the stdlib plus a vendored shapefile reader, run by hand and documented. The committed artefact is what the page loads.

### Historical plates — David Rumsey, BNE, Commons

For the early frames (1479 Alcáçovas, 1494 Tordesillas, 1529 Ribero) a modern outline is anachronistic and ugly. Use scanned period plates as a texture layer under our vectors:

- `assets/art/ribero-carta-universal-1529.jpg` — already in the repo, already sourced.
- David Rumsey Map Collection (CC BY-NC-SA on most scans — **check per item**, and NC is fine for mockups but not for a commercial site; prefer Commons or LoC equivalents for anything that ships).
- Biblioteca Digital Hispánica and the Library of Congress for public-domain scans with no NC clause.

### Projection

**Equal Earth** (Šavrič, Patterson & Jenny 2018) or **Equirectangular**, not Web Mercator.

Reasons, and they are editorial as much as technical: Mercator inflates Europe and North America and shrinks the equatorial band, which is where most of the Iberophone world lives — Brazil, Angola, Mozambique, Equatorial Guinea, the Philippines, the Caribbean. Using Mercator to argue that this is a major civilisational space would be arguing against ourselves. Equal Earth is equal-area, looks like a reference atlas, and is trivial to implement as a pure function (no projection library needed).

Equirectangular is the fallback if we want the simplest possible maths for the stepped zoom; it is what the historical plates use anyway.

### Rendering

Inline **SVG**, not canvas and not a map library.

- 60 frames mean 60 different *states* of the same geometry: countries entering, markers appearing, routes drawing, labels swapping language. SVG gives us CSS transitions per element, real text (selectable, translatable, accessible), and `<title>`/`<desc>` for screen readers, all for free.
- No Leaflet, no Mapbox, no D3. No tiles means no API key, no network dependency, no cost, and it works offline from `file://` — except that WebGL/image loading needs `make serve` anyway.
- A trimmed 110m TopoJSON of countries is ~60–100 KB. That is cheaper than one hero photograph.
- Stepped zoom = one `viewBox` animation. That is literally the Prezi effect he described, in one attribute.

## The three map layers

Each frame of the Atlas composes from these:

1. **Base** — land, ocean, graticule, coastline. Constant.
2. **Political state at that date** — which crowns, colonies, republics or institutions exist. Driven by the `MAP` directive of each of the 60 milestones, which is explicit about what *not* to draw ("do not project a modern fixed frontier backward").
3. **Overlays** — routes (Flota de Indias, Cape route, Manila galleon), markers (treaties, congresses, universities, periodicals), ruptures (1808, 1898, 1974), and author dots joined by `region_code`.

The honesty rule comes from his own document and is non-negotiable in the renderer: *"a treaty, a cultural network, a voyage and an actual sovereignty change have different map treatments. Proposals are labeled as proposals, not drawn as completed political unions."* So: sovereignty = filled area; treaty = line with a label; network = dotted link; voyage = arrowed route; **proposal = hatched area with the word "proposal" in the legend**, never a solid fill. Milestone 60 (Iberofonía) is a proposal and must look like one.

## The hero map

Not one of the 60 frames. A single, still, legible statement of the present: the ~30 Iberophone states, Equal Earth, paper ground, ink coastlines, gold routes drawn once over 6 seconds then left still. Figures beside it from the dataset, not invented: 267 authors in the corpus, 60 milestones, 1898, ~600M speakers.

Labels in small-caps Inter; values in IBM Plex Mono. One legend line. No tooltip hover on the hero — that is what `/atlas` is for.

## Checklist for the map issues

- [ ] Natural Earth files pinned by version and checksum in the conversion script
- [ ] Projection implemented as a pure function with a unit test against known coordinates
- [ ] `region_code` → ISO A2 join covers all 267 authors; unmatched codes (`GOA`, `MAC`, and compound regions) listed and hand-mapped
- [ ] Every frame's treatment matches the kind of thing it depicts (sovereignty / treaty / network / voyage / proposal)
- [ ] Reduced motion: routes drawn complete, no viewBox animation, timeline readable as a list
- [ ] Mobile 390px: the map stays legible or degrades to a region-cropped view, never a 300px world map
