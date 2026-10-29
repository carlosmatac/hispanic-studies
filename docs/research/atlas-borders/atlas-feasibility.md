# Atlas: historical borders 1492–1898, and the fog of war

Feasibility study and plan for issue #71, 2026-10-29. Prepared by the `atlas` agent. No changes to the repo.

Samples, scripts and renders are in
`/tmp/claude-1000/-home-carlos-Escritorio-Carlos-Projects-hispanic-studies/f5ffb550-5e01-4742-9820-5774a83c2f43/scratchpad/agents/atlas/`
(`ohm-1750.png`, `ohm-1790.png`, `hb-1783.png`, `hb-1700.png`, `dl/`, `ohm-geom.py`, `render.mjs`).

---

## 0. The short answer

- **It can be built now, and it should be.** OpenHistoricalMap (OHM) already holds dated polygons for almost every unit Beltrán names: New Spain in 70 dated versions, Peru in 16, New Granada, Río de la Plata, Chile, Guatemala, Venezuela, Cuba, Puerto Rico, Santo Domingo, the Provincias Internas, Spanish Louisiana, the Floridas, the Philippines, the states and captaincies of Brazil, French Saint-Domingue and British Jamaica. The data is **CC0**, so it is safe for a commercial site, and every ring I downloaded closed cleanly.
- OHM is community data with uneven sources, so we still have to **curate it**: pick one level per keyframe, check it against primary sources, hatch the claims and hand-draw the few lines OHM lacks (Tordesillas, Zaragoza, Nootka).
- **The academic dataset (HGIS de las Indias) is better but carries a non-commercial licence.** Its gazetteer is the best reconstruction of the audiencias and intendencias for 1701–1808, but it is CC BY-NC-SA 4.0. We should write to its author for permission and use it as a reference in the meantime.
- **historical-basemaps (aourednik) should not be used.** It is GPL-3.0, gives only one level (viceroyalties), has long gaps between years, and has clear errors: Louisiana French in 1783, Spain still in Cuba and the Philippines in 1900, "Kingdom of Brazil" under Portugal in 1900, Dutch Brazil and New Amsterdam in 1700.
- **Estimate:** (a) historical borders alone take about **6 agent-days**; (b) adding the fog of war takes about **+4–5 agent-days**. Beltrán needs to confirm the keyframe list (below) and three framing questions. His decade maps help as review references, but we don't need to wait for them.

---

## 1. Data sources

| Source | 1492–1898 coverage | Granularity | Format | Licence | Quality / notes | Verdict |
|---|---|---|---|---|---|---|
| **OpenHistoricalMap** (openhistoricalmap.org, via Overpass `overpass-api.openhistoricalmap.org`) | Continuous, with each version dated to the day (`start_date`/`end_date`): Viceroyalty of the Indies 1492–1521; New Spain 1521–1821 (≈70 versions); Peru 1542–1821; New Granada 1717–23, 1739–1822; Río de la Plata 1776–1810; captaincies of Guatemala, Cuba, Puerto Rico, Santo Domingo, Venezuela, Chile, Yucatán, Philippines (1574–1899), Provincias Internas (1776–1821); Spanish Louisiana 1762–1801; Floridas; Brazil from the 1534 captaincies to the Empire; Saint-Domingue, Jamaica, Trinidad, Mosquito Kingdom, Tawantinsuyu, Purépecha | Viceroyalty, captaincy-general, gobernación, a few audiencias (Santo Domingo, 17 versions), Brazilian captaincies | Vector relations, from Overpass as JSON (`out geom`); I stitch them to GeoJSON (`ohm-geom.py`) | **CC0**. Attribution is requested, not required. Caveats: some ways carry their own `license` tag, and some lines were traced from Wikipedia/Commons images, one from a DeviantArt image | Coastlines are very detailed (raw: 80–120k points per viceroyalty); after simplification one keyframe is **52 KB of TopoJSON, 18 KB gzipped**. Levels overlap: Cuba's captaincy contains Louisiana and Florida, the Provincias Internas sit inside New Spain, Peru 1739–76 overlaps New Granada at Quito. So each keyframe needs one chosen level. The Amazon is left blank between the empires, which is fair. No hatched "claims" (Alaska, Patagonia) | **Use as the base geometry** |
| **HGIS de las Indias** (Werner Stangl, Univ. Graz; FWF P-26379-G18). Datasets: *Territorial gazetteer for Spanish America 1701–1808* (doi:10.7910/DVN/YPEU5E), *Boundary lines…* (doi:10.7910/DVN/KJPNFJ), *Basemaps of jurisdictions 1701–1808* (doi:10.7910/DVN/HZJGKA), *Treaty Lines 1494–1808* (doi:10.7910/DVN/CN5MBG) | **1701–1808 only** (treaty lines 1494–1808) | 11 levels: principal divisions, audiencias, intendencias, provinces, jurisdictions (alcaldías mayores, corregimientos), bishoprics, frontiers, plus foreign claims. Every object is dated with START/END | Shapefile and GeoPackage in .rar (137–626 MB). Treaty lines: zipped shapefile, 0.9 MB, downloaded and read | **CC BY-NC-SA 4.0** on Dataverse. The treaty-lines zip's own metadata says **CC BY-SA 4.0**, which conflicts with Dataverse | The best scholarly reconstruction there is, built from archival sources. The treaty lines give three readings of each line: Spanish maximum (`Esp`), neutral (`Neu`) and foreign maximum (`For`), for Tordesillas, Madrid 1750, San Ildefonso 1777, Paris 1783, San Lorenzo 1795, Nootka 1794, Louisiana 1803, Münster 1648 and the Hispaniola line of 1776 | **Reference now. Ask Stangl for permission** (or a clarification of the licence) to ship the treaty lines and the 1701–1808 audiencia/intendencia layer |
| **historical-basemaps** (github.com/aourednik/historical-basemaps) | Snapshots: 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900 | Viceroyalty or colony only; no audiencias or captaincies | GeoJSON per year (1–3.5 MB) | **GPL-3.0**. Shipping it would make our derived data file GPL. Commercial use is allowed, but the copyleft makes it messy | Errors found by inspection: Louisiana "France" in 1783/1800 (it was Spanish 1762–1800/03); Quebec "France" in 1783; Spain still holding Cuba, Puerto Rico and the Philippines in **1900**; "Kingdom of Brazil" under Portugal in 1900; Dutch Brazil and New Amsterdam still in 1700; Hispaniola wholly Spanish in 1700; Patagonia not Spanish. `BORDERPRECISION` is 1 (approximate) in the early years | **Do not use** |
| **Euratlas** (euratlas.com) | One map per century, 1–2000 | Sovereign states, provinces | Shapefile | Paid: simple or **extended (commercial) licence on request**. FAQ price ≈ €150 simple / €600 extended per century | **Europe and the Mediterranean only**; no Americas | Only if Beltrán wants the European possessions (Italy, the Netherlands) |
| **Atlas of Historical County Boundaries** (Newberry Library) | US states and counties, 1629–2000 | County/state | Shapefile | Reusable without restriction (OHM imports it as CC0) | Good for the US side of Florida, Louisiana and Adams–Onís, but not for Spanish units | Indirect: OHM already uses it |
| **CShapes 2.0** (ETH/ICR) | 1886–2019 | States and dependencies | Shapefile/GeoJSON | CC BY-NC-SA 4.0 | Covers only the 1898 frame | No |
| **Wikimedia Commons** viceroyalty maps (e.g. *Mapa de la América Española en 1800*, CC BY 4.0; *Map of the Viceroyalty of New Spain*, CC BY-SA 3.0; TRAJAN 117 1795 maps, GFDL; Goran_tek-en 1800 USA/New Spain, CC BY-SA 4.0) | Isolated years | Varies | PNG/SVG, not georeferenced | CC BY / BY-SA / GFDL. Usable with attribution; share-alike would apply to a traced derivative | Hobbyist work, unsourced, with frequent anachronisms. Not georeferenced, so tracing is manual and inherits their errors | Cross-check only |
| **David Rumsey, Biblioteca Digital Hispánica, Library of Congress, AGI Mapas y Planos (PARES)** | Period maps, 1500–1900 | Whatever the cartographer drew | Raster scans | Rumsey: mostly CC BY-NC-SA (per item). BDH, LoC and PARES scans of old maps: public domain | Primary evidence of what was *claimed*; also a texture for the plates (see `docs/research/cartography.md`) | Reference and texture. Use the PD scans in the UI, not as vector sources |
| **Natural Earth** | Today only | States | Shapefile | Public domain | — | Keep as the **land and coast base** (already in `world-110m.json`) |
| GeaCron, Thomas Lessman's World History Maps | World, many years | States | Proprietary app / images | GeaCron: commercial licence. Lessman: CC BY-SA images on Commons; licence for the shapefiles not stated | Unsourced | No |

**Primary and scholarly references for checking the geometry and the dates** (none needs to be shipped):
- *Recopilación de Leyes de los Reynos de las Indias* (1681), libro II título XV (the audiencias and their districts, as of 1680) and libro III título III (the viceroys). Public domain; facsimiles at BNE/BDH and Biblioteca Virtual Miguel de Cervantes.
- Frances G. Davenport (ed.), *European Treaties bearing on the History of the United States and its Dependencies*, 4 vols., Carnegie Institution, 1917–1937. Texts and commentary for Tordesillas, Zaragoza, Madrid 1670, Ryswick, Utrecht and others; public domain (HathiTrust / Internet Archive).
- Yale Law School, **Avalon Project**: texts of Paris 1763, Paris 1783, San Lorenzo 1795, the Louisiana Purchase 1803, Adams–Onís 1819 and Paris 1898.
- Peter Gerhard, *A Guide to the Historical Geography of New Spain* (1972), *The North Frontier of New Spain* (1982), *The Southeast Frontier of New Spain* (1979). The standard reference for New Spain's internal divisions.
- HGIS de las Indias (above) for 1701–1808.
- Atlas digital da América Lusa (lhs.unb.br/atlas) for Brazil and the Spanish–Portuguese lines.

---

## 2. Proposed keyframes (to send to Beltrán)

The rule for these keyframes: real, dated acts only (a law, a royal cédula or a treaty), each with a source we can cite on the card. Where historians disagree, the row says so. **Bold** marks what changes on the map.

| # | Year | What changes on the map | Act | Reliable source |
|---|---|---|---|---|
| 1 | 1492 | Columbus is named viceroy and governor of the lands he discovers. **Hispaniola** (La Navidad) is the first Castilian foothold. The rest of the map is unknown to Castile (fog starts here) | Capitulaciones de Santa Fe, 17 Apr 1492 | Archivo de la Corona de Aragón, Cancillería reg. 3569; Library of Congress, *1492: An Ongoing Voyage* (milestone ref A6) |
| 2 | 1494 | **Tordesillas meridian**, 370 leagues west of Cape Verde, drawn as a *claimed* line (dashed, with the Spanish/neutral/Portuguese readings as a band) | Treaty of Tordesillas, 7 Jun 1494 | UNESCO Memory of the World (ref A7); Davenport vol. 1; HGIS treaty lines |
| 3 | 1511 | First **Audiencia, at Santo Domingo**, over the settled islands: Hispaniola, **Puerto Rico** (1508), **Jamaica** (1509), **Cuba** (1511) | Real provisión, Burgos, 5 Oct 1511 | *Recopilación* II.XV; OHM "Real Audiencia de Santo Domingo" |
| 4 | 1529 | **Antimeridian of Zaragoza** in the Pacific (Moluccas to Portugal); drawn as a line | Treaty of Zaragoza, 22 Apr 1529 | Davenport vol. 1 |
| 5 | 1535 | **Viceroyalty of New Spain** (Antonio de Mendoza), over the Audiencia of Mexico (1527) | Appointment of 17 Apr 1535 | *Recopilación* III.III; Gerhard 1972 |
| 6 | 1542 | **Viceroyalty of Peru**; audiencias of **Lima** and **los Confines (Guatemala)**. Portuguese side: **Governorate-General of Brazil** at Salvador (1549) over the 1534 captaincies | Leyes Nuevas, Barcelona, 20 Nov 1542; Regimento of Tomé de Sousa, 1548 | Leyes Nuevas (milestone ref A8, LoC); OHM "Governo-Geral do Brasil" |
| 7 | 1565–1583 | **The Philippines** under New Spain: Legazpi at Cebu (1565), **Manila** founded (24 Jun 1571), **Audiencia de Manila** (1583) | Real cédula, 5 May 1583 | LoC *Negotiating Empire* (ref A11); *Recopilación* II.XV |
| 8 | 1580–1640 | **Iberian Union**: one crown, both empires; drawn as an overlay, with **no border change** (milestones 19–20). Ends 1 Dec 1640; Spain recognises Portugal's separation at Lisbon, 13 Feb 1668 | Cortes of Tomar 1581; Treaty of Lisbon 1668 | Portuguese Parliament (ref A12) |
| 9 | 1655 / 1670 | **Jamaica** taken by England (1655); Spain recognises English possessions in America | Treaty of Madrid ("Godolphin"), 18 Jul 1670 | Davenport vol. 2 |
| 10 | 1697 | **Western Hispaniola French** (Saint-Domingue). *Caveat for Beltrán:* Ryswick does not name the island. It ended the war in which France held the west, and the boundary was fixed only in 1776–77 (Atalaya, Aranjuez). The card should say "recognised in practice after Ryswick, formalised at Aranjuez 1777" | Peace of Ryswick, 20 Sep 1697; Treaty of Aranjuez, 3 Jun 1777 | Davenport vol. 2; HGIS treaty line "San Miguel de Atalaya 1776" |
| 11 | 1715 | **Colonia del Sacramento** returned to Portugal (the Spanish Netherlands and Italian losses of 1713–14 too, if Europe is in scope) | Treaty of Utrecht between Spain and Portugal, 6 Feb 1715 | Davenport vol. 3 |
| 12 | 1717 / 1739 | **Viceroyalty of New Granada** carved from Peru (1717), suppressed (1723), re-established for good (1739) | Reales cédulas of 27 May 1717 and 20 Aug 1739 | OHM (dated to these days); Real Academia de la Historia |
| 13 | 1750 | **Treaty of Madrid**: the Tordesillas line is abandoned for *uti possidetis*; Colonia swapped for the Seven Missions. Annulled at El Pardo, 12 Feb 1761 | Treaty of Madrid, 13 Jan 1750 | Milestone 21; HGIS treaty lines (three readings) |
| 14 | 1762–63 | **Louisiana** (west of the Mississippi, plus New Orleans) comes to Spain; **Florida** goes to Britain; Havana and Manila, occupied by the British in 1762, return | Treaty of Fontainebleau, 3 Nov 1762; Treaty of Paris, 10 Feb 1763 | Avalon (Paris 1763); OHM "Provincia de La Luisiana" 1762-11-23 |
| 15 | 1776–77 | Bourbon reorganisation: **Viceroyalty of the Río de la Plata** (provisional 1 Aug 1776, definitive 1777); **Comandancia of the Provincias Internas** (22 Aug 1776); **Captaincy-General of Venezuela** (8 Sep 1777). With Portugal: **First Treaty of San Ildefonso**, 1 Oct 1777 (Spain keeps Colonia and the Seven Missions); El Pardo, 11 Mar 1778 (**Fernando Póo and Annobón** to Spain) | Reales cédulas 1776–77; San Ildefonso 1777; El Pardo 1778 | OHM (each unit dated); HGIS; Davenport vol. 4 |
| 16 | 1783 | **East and West Florida return to Spain**; Belize log-cutting rights to Britain; the Bahamas back to Britain | Peace of Versailles (Spain–Britain), 3 Sep 1783 | Avalon; OHM "La Florida" 1784-05-12; HGIS "Tratado de París 1783" |
| 17 | 1790 | **Northwest coast**: Spain's claims up to Alaska (expeditions of Pérez 1774, Bodega y Quadra 1775, Arteaga 1779, Martínez 1788) are hatched as claims. The Nootka Convention opens the coast to Britain | Nootka Convention, 28 Oct 1790 (and 1794) | HGIS "Convención de Nutca"; Davenport vol. 4 |
| 18 | 1795 | **Santo Domingo ceded to France**; **31st parallel** border with the United States | Peace of Basel, 22 Jul 1795; Treaty of San Lorenzo (Pinckney), 27 Oct 1795 | Avalon (San Lorenzo); OHM Santo Domingo ends 1795-07-22 |
| 19 | 1797–1803 | **Trinidad** taken by Britain (1797; ceded at Amiens, 25 Mar 1802). **Chile** separated from the Viceroyalty of Peru (1798, *date to confirm*). **Louisiana retroceded to France** (1800) and sold to the United States (1803) | Third Treaty of San Ildefonso, 1 Oct 1800; Louisiana Purchase, 30 Apr 1803 | Avalon (Louisiana Purchase); HGIS treaty lines |
| 20 | 1819–21 | **Florida ceded to the United States**; the Transcontinental line (Sabine, Red River, Arkansas, 42° N) | Adams–Onís Treaty, 22 Feb 1819 (in force 22 Feb 1821) | Avalon; OHM New Spain 1819-02-22 |
| 21 | 1810–1826 | **The continental empire becomes successor states** (one keyframe, or three sub-frames 1816 / 1821 / 1826): Mexico (Treaty of Córdoba, 24 Aug 1821), Central America (15 Sep 1821), Peru (28 Jul 1821), Ayacucho (9 Dec 1824), last strongholds at **Callao** (23 Jan 1826) and **Chiloé** (Tantauco, 15 Jan 1826). **Brazil** independent (7 Sep 1822; recognised at Rio de Janeiro, 29 Aug 1825). Spain keeps **Cuba, Puerto Rico, the Philippines and the Pacific islands** | Acts of independence; Tantauco; Rio 1825 | Milestones 27–28 (refs A13, A16) |
| 22 | 1861–65 | **Santo Domingo re-annexed** to Spain, then abandoned | Annexation proclaimed 18 Mar 1861; repealed 1865 | Spanish Congress records; OHM |
| 23 | 1898–99 | **Cuba** relinquished; **Puerto Rico, Guam and the Philippines** ceded to the United States; the **Carolines, Marianas and Palau** sold to Germany. End of the sequence | Treaty of Paris, 10 Dec 1898; German–Spanish Treaty, 30 Jun 1899 | Avalon; LoC (milestone ref A18) |

Notes for Beltrán:
- There are 23 rows. Rows 4, 8, 9 and 22 are the easiest to drop if he wants exactly 20.
- **One level of detail across the board**: viceroyalties plus captaincies-general (as he listed them). Audiencias add a lot of lines and can be a second level that appears only when zoomed in (1701–1808 only if HGIS allows it).
- **Claims are hatched, control is filled**: Patagonia, the Amazon, the northwest coast to Alaska and the Tordesillas zone are hatched. This is the convention the map already uses for *submersa*, and it is what the milestone notes ask for ("draw the meridian as a claimed jurisdictional line, not a surveyed border").
- Milestones 8 and 1–7 (Granada, Asturias, Portugal…) fall before 1492, and 40–60 fall after 1898. Those frames keep today's states. (Optionally, add a simple Iberian frame for 722–1492 later.)

---

## 3. Technical plan

### 3.1 Data pipeline (build time, committed artefact)
1. `tools/build-eras.py` (stdlib):
   - reads `tools/eras.json`, the curated list: for each keyframe, the year, the OHM relation ids to use (one level), the hand-drawn extras, and the EN/ES card text with its source;
   - fetches each relation from the OHM Overpass API (`rel(id:…); out geom;`) and stitches the ways into rings (the stitcher in `ohm-geom.py` already does this; every ring closed in my tests);
   - writes one GeoJSON per keyframe into a cache folder (not committed).
2. Simplify and merge into **one shared TopoJSON** with `mapshaper`. It is a node tool, so this is the only non-stdlib step. Run it with `npx mapshaper@<pinned>` and document it in the script header:
   `-simplify 2% keep-shapes -clean -o format=topojson quantization=1e5`.
   Arcs are shared between keyframes, so 23 frames should come to roughly **150–250 KB raw / 60–90 KB gzipped**. My one-frame test was 52 KB raw / 18 KB gzipped. For comparison, `world-110m.json` is 108 KB / 38 KB gzipped.
3. **Hand-drawn extras** go in `site/data/eras-extra.geojson`, built from treaty texts and coordinates, not traced from anyone's map:
   - lines: Tordesillas (meridian ~46°37′W in the neutral reading), Zaragoza (297.5 leagues east of the Moluccas), Paris 1783 / San Lorenzo 31° N, Adams–Onís;
   - polygons: the northwest-coast claim to 60° N; Patagonia as a claim.
   If Stangl allows it, his three-reading treaty lines replace ours.
4. Output: `site/public/data/eras.topo.json` (fetched with the map) and `site/data/eras.json` (card texts, imported at build). Log OHM and the treaty sources in a `SOURCES` note, as for the images. OHM asks for attribution: one line in the Atlas cartouche ("Historical borders: OpenHistoricalMap contributors, CC0").

### 3.2 Drawing on the existing plate (`site/lib/atlas-map.js`)
- **Coasts stay Natural Earth.** OHM coastlines (from OSM) do not match the 110m land. So the historical fills are **clipped to the Natural Earth land path** (`<clipPath>` built from the land the plate already draws), and the internal borders are drawn as a `topojson.mesh(…, (a, b) => a !== b)` hairline. One coast, one engraving style, and no slivers.
  - Optionally, upgrade the base to 50m for the Americas, as `cartography.md` already proposes. Small Antilles and the Philippines read better at 50m, and `MIN_W` could then come down.
- **A new layer `g.eras`** sits between `.rest`/`.ib` and `.routes`. While a historical keyframe is active, the modern `.ib` fills fade to the "rest" style and the eras layer shows.
- **One keyframe is two `<g>`s**: the current one and the next. Switching is a CSS opacity crossfade of ~600 ms. Nothing is interpolated: borders do not morph, which would also be historically false. Under reduced motion it is a cut.
- **The change is made legible**: precompute, for each keyframe, the set of unit ids that appear or disappear relative to the previous one. Those get a brief burgundy-dark stroke pulse and a label. That is the "what changed in 1763" moment.
- **Colours are brand only**: Spanish units are burgundy (a tint per viceroyalty: `color-mix(burgundy, paper)` at 100/80/65/50 %); Portuguese units are leather; other empires (France, Britain, the Netherlands, the United States) are `--grid`/ink hairline with a light ink tint. Claims use the existing hatch pattern. No new hues.
- **Labels** for each unit (EN/ES names in `i18n.ts` or `eras.json`) are placed by the same centroid-plus-nudge scheme the plate already uses. Six to eight labels per frame at most; the rest are on hover.
- **API additions**: `setEra(year | null)`, which picks the latest keyframe ≤ year and cross-fades, and `highlightUnits(ids)`. `flyTo` already takes ISO ids. It would gain unit ids, or the stop would simply keep its ISO `frame` for the camera, which still works because the camera only needs a box.

### 3.3 How the milestones attach
- Each milestone has a `year`. The Atlas resolves `era = latest keyframe with year ≤ milestone.year`, if 1492 ≤ year ≤ 1898; otherwise it shows today's states. No per-milestone data entry is needed.
- `TOUR` stops (in `site/lib/map-tour.ts`) get an optional `era?: number` and `lightUnits?: string[]` for historical stops. For example, `atlantic` (milestone 9) gets era 1492 and lights Hispaniola; `andes` (16) gets 1542 and lights Peru; `pacific` (18) gets 1565 and lights the Philippines; `caribbean` (39) gets 1898.
- **A year scrubber** (a 1492–1898 timeline with ticks at the keyframes) sits under the plate. It is a native `<input type="range">` with `aria-valuetext` giving the year and the act, and it is keyboard operable. Next to it, a plain **list of the keyframes** (year, act, source) serves as the text alternative and the citations.
- The sixty milestones list on the page stays as it is. Optionally, each 1492–1898 milestone gets a "see on the map" link that sets the era.

### 3.4 The fog of war (optional, phase 2)
- **Editorial framing first.** The fog must mean "*not yet on Castilian/Portuguese charts*" (the Padrón Real), not "empty land". So it is drawn as the **blank paper of a period chart** (paper, laid lines, a faint "TERRA INCOGNITA" in the plate's own lettering), not as black. Indigenous polities of the time (Tawantinsuyu and Purépecha are in OHM; the Mexica would be hand-drawn) can show *through* the fog as named places, as the milestone notes ask ("keep Indigenous polities visible").
- **Mechanism (SVG, no canvas needed):**
  - one `<mask id="known">`: a black rect (everything hidden) plus white shapes for what is charted;
  - the fog layer is a paper-coloured rect over the land, with `mask="url(#known-inverse)"`.
  - **Reveal along routes**: each expedition is a great-circle path (the plate already builds them, `greatCircle()`), drawn *into the mask* with a wide stroke (≈ 14–20 user units, about 300 km) and `stroke-dasharray`/`dashoffset`, animated in step with the visible route being drawn. The fog therefore opens along the ship's wake.
  - **Soft edge without a blur filter** (blur in a mask is the costly part on phones): stack three strokes of decreasing width at opacities 0.35/0.6/1. This fakes a feather and costs only three paths per route.
  - **Reveal by keyframe**: everything inside the keyframe's administered polygons is also written into the mask. By definition, a viceroyalty is charted.
- **Data**: about 20 expeditions with documented waypoints: Columbus I–IV (1492–1504), Ponce de León 1513, Balboa 1513, Magellan–Elcano 1519–22, Cortés 1519, Pizarro 1531–33, Orellana 1541–42, De Soto 1539–43, Coronado 1540–42, Urdaneta/Legazpi 1565, Mendaña 1567, Cabral 1500 (Portuguese), Pérez/Bodega/Malaspina 1774–94. Waypoints come from standard sources: Morison's *Admiral of the Ocean Sea* for Columbus, Pigafetta, HGIS "Routes of flotas y galeones" (reference). These would live in `site/public/data/expeditions.json`, alongside `routes.json`.
- **Performance**:
  - the mask is re-rasterised on every viewBox frame of a camera flight. With ≤ 60 mask paths and no filters this stays fast on mid-range phones; I would measure it with a Playwright trace at 390 px, CPU ×4 throttle;
  - safety valve: during a `flyTo` the reveal animation is paused, and the static mask only re-rasterises.
- **Fail open (AGENTS.md):** the fog is created only by script, after the data has loaded. If anything fails, or with `prefers-reduced-motion`, the map is fully visible: no fog, or the fog of the current keyframe drawn statically with no animation. Nothing is ever hidden without a working reveal.

### 3.5 What is taken from datasets, and what is drawn by hand
| From OHM (CC0), curated | Hand-drawn from treaty texts | Reference only |
|---|---|---|
| Viceroyalties, captaincies-general, gobernaciones, Brazilian states, the Floridas, Louisiana, Saint-Domingue, Jamaica, Trinidad, the Philippines, the post-1821 successor states | Tordesillas and Zaragoza lines, the 31° N and Adams–Onís lines (or Stangl's, with permission), the northwest-coast claim, the Patagonia claim, the expedition routes | HGIS (1701–1808, audiencias), Gerhard, *Recopilación*, Davenport, Avalon, period maps, Beltrán's decade maps |

---

## 4. Effort estimate (agent-days)

**(a) Historical borders only: ≈ 6 agent-days**

| Task | Days |
|---|---|
| `build-eras.py` (Overpass fetch, stitch, cache) + mapshaper step + TopoJSON; check sizes | 1 |
| Curate 23 keyframes: choose relations and level, check each against sources, fix overlaps and gaps, hand-draw lines and claims, write EN/ES card text with sources | 2–2.5 |
| `atlas-map.js`: eras layer, land clipping, crossfade, change pulse, labels, `setEra` | 1.5 |
| Timeline scrubber + keyframe list + milestone and tour linkage (`map-tour.ts`, `atlas.ts`, `i18n.ts`) | 1 |
| Verification (1440/390, EN/ES, reduced motion, Lighthouse on mobile), screenshots, PR | 0.5 |

**(b) With the fog of war: +4–5 agent-days (≈ 10–11 in total)**

| Task | Days |
|---|---|
| Expedition dataset (~20 routes with sourced waypoints, EN/ES names) | 1.5–2 |
| Mask rendering, feathered strokes, synchronised reveal, keyframe masks, pause during flights | 1.5 |
| Terra-incognita styling, Indigenous polities through the fog, tour integration | 0.5–1 |
| Performance pass on throttled mobile; reduced-motion and fail-open checks | 0.5 |

Plus one review round with Beltrán, about half a day of fixes per round.

**Needed from Beltrán (and Carlos):**
1. **Confirm or edit the keyframe table** in §2: keep or drop rows, especially 4, 8, 9, 10 (the Ryswick nuance), 19 (Chile 1798) and 22.
2. **Level of detail**: viceroyalties and captaincies only, or audiencias too (we can do audiencias for 1701–1808 only with Stangl's permission).
3. **Scope**: the Americas and the Philippines only, or also Spanish Africa and Europe (Italy, the Netherlands, Gibraltar/Menorca)? And the Portuguese side at the same detail (Brazil, Angola, Mozambique, Goa, Macau) or only in the Americas?
4. **How to show claims**: is hatching for Alaska, Patagonia and the Amazon acceptable to him?
5. **Fog of war**: the framing (period-chart paper, Indigenous polities visible through it) and the list of expeditions.
6. **His decade maps**: welcome as checking references. We will not trace them unless they are his own work or public domain; we need to know their source.
7. **Carlos**: whether to email Werner Stangl (HGIS de las Indias, University of Graz) to ask for permission for commercial use of the treaty lines and the 1701–1808 territorial layer. I can draft the email.

---

## 5. Recommendation

**Build now with OpenHistoricalMap (CC0) as the geometry and the keyframe list above, and send Beltrán the table to confirm, rather than waiting for his decade maps.** Reasons:

- OHM already has nearly every unit and date he named, with a licence that is safe for a commercial site. His decade maps would only tell us what OHM plus the primary sources already give, and a scanned map cannot be shipped or traced anyway.
- The work that remains is curation and design, not data. A keyframe table he confirms by email is quicker to collect than maps, and it is exactly what the cards need: real acts with sources.
- Phase the work: **(a) borders first** (≈ 6 days, in its own PR), then **(b) fog of war** once he has seen the borders, because the fog's framing is an editorial decision of its own.
- In parallel, write to Stangl. If he agrees, add audiencias for 1701–1808 and the three-reading treaty lines as a later improvement.
- **Do not use historical-basemaps.** It has a GPL licence and visible errors in exactly our period.

Order of work once he confirms: data pipeline and three test frames (1542, 1790, 1826) as a draft PR with screenshots; then the remaining frames; then the timeline and the milestone linkage.

---

### Sources consulted
- OpenHistoricalMap licence: https://www.openhistoricalmap.org/copyright
- OHM Overpass API: https://overpass-api.openhistoricalmap.org/api/interpreter (queries in `ohm.py`, `ohm-geom.py`, `ohm-ways.py`)
- historical-basemaps: https://github.com/aourednik/historical-basemaps (licence GPL-3.0 per GitHub API; files `geojson/world_*.geojson`)
- HGIS de las Indias: https://www.hgis-indias.net/ ; Yale Dataverse https://dataverse.yale.edu/dataverse/indias-hgis ; Harvard Dataverse DOIs 10.7910/DVN/YPEU5E, 10.7910/DVN/KJPNFJ, 10.7910/DVN/HZJGKA, 10.7910/DVN/CN5MBG (licence fields read through the Dataverse API)
- Euratlas GIS shop and licences: https://euratlas.com/shop/1_gis_1800.html , https://www.euratlas.net/shop/licences/licence_gis_site_gb.pdf
- Wikimedia Commons file licences (Commons API): *Mapa de la América Española en 1800.png* (CC BY 4.0), *Map of the Viceroyalty of New Spain.svg* (CC BY-SA 3.0), *Viceroyalty of New Granada (1795).svg* (GFDL), *Viceroyalty of New Spain and the United States of America 1800.svg* (CC BY-SA 4.0), *Mapa de la América española (1800).png* (CC BY-SA 3.0)
- Thomas Lessman maps: https://commons.wikimedia.org/wiki/User:Talessman/Maps
- Avalon Project (treaty texts): https://avalon.law.yale.edu/
- Davenport, *European Treaties…* (Carnegie Institution, 1917–37), via HathiTrust / Internet Archive
- *Recopilación de Leyes de los Reynos de las Indias* (1681), Biblioteca Virtual Miguel de Cervantes / BDH
- Gerhard, *A Guide to the Historical Geography of New Spain* (Cambridge UP, 1972)
- Repo: `site/lib/atlas-map.js`, `site/components/MapTour.tsx`, `site/lib/map-tour.ts`, `site/lib/atlas.ts`, `site/data/milestones.json`, `docs/research/cartography.md`; issue #71
