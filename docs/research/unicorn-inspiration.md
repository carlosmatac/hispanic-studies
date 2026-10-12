# Unicorn Studio: inspiration and new directions

Research 2026-10-12. Unicorn Studio is the WebGL editor behind castle.tech (its knights are a 6 s video through the `glyphDither` effect). We now have a free account and its MCP connector, so an agent can build scenes in the editor.

## What the tool gives us (relevant to IHS)

| Capability | Why it matters for IHS |
| --- | --- |
| **Glyph Dither** (presets incl. "redacted", jitter), Dither, Halftone, Outline (Sobel) | The castle.tech look, in brand colours, on any image or video |
| **Cloth Physics** (Aug 2026): hanging fabric with wind and mouse, can project an image or video | A real waving Cross of Burgundy, or the tilma of Guadalupe as cloth |
| **Particle Formation** (Jul 2026): an SVG becomes particles that repel/attract the cursor | The IHS eagle assembling from gold dust |
| **3D models / extruded SVG and text**, glass with backside refraction | The eagle, the Pillars of Hercules or a coin in 3D gold |
| **Video Sequence** (Sep 2026): a video as an image sequence scrubbed by scroll, mouse proximity or "time stretch" | Our generated clips (Tercios marching, galleon) controlled by scroll |
| **process_image**: depth map, normal map, background removal | Relight a Zurbarán with the cursor; 2.5D parallax inside *Las Meninas* |
| God Rays, Bloom, Film Grain, Fluted glass, Chromatic aberration, Mouse Trail | Baroque light, gold, grain of old paper |
| **Scroll Timeline** (Oct 2026), appear/hover/scroll events | Story-telling heroes without code |
| **GPU Text** with 7,000+ fonts | Animated titles in the scene itself |
| **Variables** (3 per scene on Free) | Swap image, colour or text from the website at runtime |

Embed: `<div data-us-project="ID">` + the ~50 KB SDK. Works in plain HTML, Next.js, Framer, Webflow and WordPress.

### Free plan limits (decide before production)

| | Free | Legend ($20/month or $168/year) |
| --- | --- | --- |
| Effects | all 75+ | same |
| Publishes | 8, **with Unicorn branding** | unlimited, no watermark |
| Licence | **personal / non-commercial** | commercial |
| Custom 3D models and fonts | no | yes |
| MCP agent changes | **200 / month** | unlimited |

Pitch mockups fit the Free plan.

### How licensing works in practice

- The plan belongs to **whoever designs and publishes** (our account), not to the website or the client. Beltrán does not need an account and Unicorn does not know he exists.
- **Publish** uploads the scene (a JSON of shaders and settings) to Unicorn's cloud under a project ID. The site only contains `<div data-us-project="ID">` and the SDK; every visitor's browser downloads the scene from Unicorn using that ID. The watermark is baked into scenes published from a Free account.
- **FAQ:** if the subscription expires, published scenes keep working without the watermark; it only comes back if you republish from Free. So the minimum is **one month of Legend ($20) while we publish the final scenes**, then cancel; editing them later means another month. If we use it for other clients too, $168/year as an agency tool.
- **Commercial use** (a client's site) needs Legend at the time of publishing. The FAQ forbids reselling or redistributing the Unicorn code itself, not showing the output on a client's site. Edge cases: george@unicorn.studio.
- **Self-hosting with our stack:** Legend can export the scene as JSON. We commit it to GitHub, Vercel serves it, and the embed uses `data-us-project-src="/scenes/hero.json"` with the SDK (`unicornstudio-react/next` in Next.js). The site then no longer depends on Unicorn's servers.
- For simple effects our own `proposals/shared/glyph-field.js` costs nothing and has no dependency; Unicorn is worth it for what would take days to code (cloth, 3D, particles, depth relighting).

## References that fit IHS

| Reference | What to take |
| --- | --- |
| [castle.tech](https://www.castle.tech/) | Glyph-dithered video hero; restraint: one strong motion, calm UI around it |
| [Getty · Persepolis Reimagined](https://www.awwwards.com/sites/persepolis-reimagined) (Awwwards SOTD) | An empire reconstructed for a general audience; same post-FX (grain, bloom, vignette) across every scene to make it feel like one world |
| [Digital Florentine Codex](https://florentinecodex.getty.edu/) (Getty, 2023) | Spanish + Nahuatl in parallel columns: mestizaje as an interface |
| [Codex Mendoza](https://www.manuvo.com/work/codex-mendoza) (INAH / Oxford / Manuvo) | Old Spanish transcription + modern translations + clickable pictograms |
| [Museo del Prado · Second Canvas](https://museodelprado.es/apps/second-canvas-museo-del-prado) | Gigapixel zoom into *Las Meninas*: stories hidden in details |
| [Loewe Foundation Craft Prize](https://www.awwwards.com/sites/loewe-foundation-craft-prize) | A Spanish house doing craft with a contemporary, editorial web |
| [UNESCO Virtual Museum of Stolen Objects](https://www.awwwards.com/unesco-virtual-museum-of-stolen-cultural-objects.html) | "Technology serves memory rather than spectacle": the right tone for devotional images |
| [Ruinart · Digital fresco](https://www.awwwards.com/sites/ruinart-digital-fresco) | A heritage artwork as the whole navigation |
| Unicorn [example projects](https://www.unicorn.studio/docs/example-projects/): ASCII Dodecahedron, Fluted Gradient | Ready-made scenes to remix (ASCII 3D object, reeded glass) |

## New directions (D–K)

Each one: an image his audience already knows + a Unicorn effect stack. Same rule as A–C: logo and burgundy stay.

### D · Tenebrismo: the cursor is a candle
- **Icon:** Zurbarán, *Agnus Dei* (Prado, c. 1635–40) or Velázquez's *Christ Crucified*. Spanish Golden Age chiaroscuro.
- **Stack:** painting + `process_image` normal map → Lighting with a point light that follows the mouse; Film Grain; Vignette; Bloom on highlights. Black page, ochre type.
- **Why:** the most "Spanish Baroque" thing we can do; feels like walking a dark chapel with a candle. Works for Read and Books (each essay lit by its own painting).

### E · Real de a Ocho: "the dollar is Spanish"
- **Icon:** the 8-reales *columnario* (Mexico City mint, 1732–1772): two hemispheres between the Pillars of Hercules with *PLUS ULTRA*. Legal tender in the US until 1857; the Pillars-and-ribbon are one of the most cited origins of the **$** sign.
- **Stack:** extruded SVG coin in metal, rotating with scroll; Glyph Dither transition into a ledger of numbers; Particle Formation that turns the coin into the **$**.
- **Why:** a perfect hook for English-speaking US Hispanics ("you've carried Spain in your wallet all your life"). Merch: coin pendant, pin, challenge coin.

### F · Retablo: the eagle in gold leaf
- **Icon:** the IHS eagle itself, as the centre of a baroque altarpiece (Seville Cathedral's retablo mayor, Santa Prisca in Taxco, Tonantzintla in Puebla).
- **Stack:** `ihs-logo.svg` extruded in gold (the user already remixed Unicorn's "Extruded 3D Logo" template), God Rays as the *resplandor* (the same rays as Guadalupe's mandorla and a monstrance), Particle Formation so it assembles from gold dust, Fluted glass for depth.
- **Why:** turns the existing logo into the hero; zero new assets; the strongest brand moment.

### G · La Tela: real cloth
- **Icon:** the Cross of Burgundy (203K-view Short) or the tilma of Guadalupe, projected on **Cloth Physics** with wind; the cursor pushes the fabric.
- **Stack:** Cloth Physics (media mode) → optional Glyph Dither for the castle look; Film Grain.
- **Why:** proposal B's procedural flag, but physically simulated and touchable. The most "wow" per effort.

### H · Azulejo: the tile that crossed the ocean
- **Icon:** Talavera (Talavera de la Reina → Puebla; UNESCO intangible heritage 2019, inscribed jointly by Spain and Mexico), Seville azulejos.
- **Stack:** pattern built from the eagle and the cross; Recursive Grid; mouse ripple that "glazes" tiles blue-and-white; Bloom on the glaze.
- **Why:** a shared Spanish-Mexican craft, perfect for merch (tiles, mugs, plates) and for a pattern system across the site.

### I · Códice: two scripts, one civilization
- **Icon:** the Florentine Codex (Sahagún and Nahua scholars, Tlatelolco, 1577): Nahuatl and Spanish side by side, 2,500 images.
- **Stack:** paper texture, Mouse Trail that "inks" the page, Glyph Dither "organic", GPU Text for bilingual titles.
- **Why:** mestizaje made visible, and it supports his thesis: a document made by Spanish friars *and* Nahua authors, not erased by them. Also the right UI pattern for De Indiis Editions (original | translation).

### J · Las Meninas in 2.5D
- **Icon:** Velázquez, *Las Meninas* (1656).
- **Stack:** `process_image` depth map → parallax by mouse; Video Sequence or Scroll Timeline that dollies into the room until the mirror (the king and queen: the viewer is the king).
- **Why:** the most famous Spanish painting, used as an entrance: "step into the Hispanic world".

### K · Carta Universal: the routes
- **Icon:** Diego Ribero's *Carta Universal* (1529, Padrón Real of Seville), the Tordesillas line.
- **Stack:** map + particles flowing along the Flota de Indias and the Manila galleon routes; Glyph Dither for the seas; hover on a port shows a short video.
- **Why:** extends proposal C into a navigable world map for Watch/Read (content by place).

## What to build first

1. **F · Retablo**: uses only the logo, so it makes the case for evolving his brand.
2. **G · La Tela**: the visual "wow", and it reuses the flag that is already his top Short.
3. **E · Real de a Ocho**: the best story hook for the US audience and the strongest merch.

Built on 2026-10-12: E, F and G as published Unicorn scenes (design "IHS · Retablo"), D, H, I, J and K with our own code, all as concept pages in `proposals/` and in the gallery.

## Assets ready

- `assets/brand/ihs-logo.svg`: vector logo traced from the 1280 px PNG (for 3D extrude and Particle Formation).
- Public-domain art in `assets/art/` (Guadalupe, Las Lanzas, galleon, Cross of Burgundy). To add when needed: Zurbarán *Agnus Dei*, *Las Meninas*, the Florentine Codex, Ribero 1529, a columnario photo (check licences and list them in `assets/art/SOURCES.md`).

## Without Unicorn: viability

Every direction can be built with our own code. What it would take, if Beltrán prefers no third-party runtime:

| Dir | How with own code | Effort | Viability |
| --- | --- | --- | --- |
| D Tenebrismo | WebGL shader, normal map precomputed offline (e.g. Depth Anything) or from luminance, point light on the cursor | 1–2 days | High |
| E Real de a Ocho | Three.js `ExtrudeGeometry` from SVG + PBR metal + environment map; points for the $ morph | 2–3 days | High |
| F Retablo | Three.js extruded SVG in gold + post-processing god rays (pmndrs) + particles | 2–3 days | High |
| G La Tela | Verlet cloth (three.js cloth example) with texture and mouse; a GPU cloth like Unicorn's is much harder | 3–4 days | Medium |
| H Azulejo | 2D shader / canvas | < 1 day | Very high |
| I Códice | Canvas ink trail or the MIT-licensed WebGL fluid simulation | 1 day | High |
| J Meninas 2.5D | Depth-map parallax shader + offline depth map; a deep dolly shows artefacts | 1–2 days | Medium-high |
| K Carta Universal | Canvas/SVG routes + particles | 1–2 days | High |

D, H, I, J and K are already built this way (see their pages); the E and F scenes use custom shaders inside Unicorn (sources in `assets/unicorn/`), which is most of the work an own-code version would need.

**Conclusion:** everything is buildable without Unicorn. Unicorn buys iteration speed, polish, visual editing by non-developers, and saves roughly 2–3 weeks of creative-dev work across D–K, at $168/year.

### What we learnt building E, F and G through the MCP

- Agents cannot add files to the media library: effects that need an SVG (3D SDF custom shape, Particle Formation) only take SVGs a human uploaded. We worked around it with custom effects fed by textures we generated (`assets/unicorn/`).
- Custom effects are cheap in agent changes: previews are free and only the commit counts. The three scenes cost 54 of the 200 monthly changes and 3 of 8 publishes.
- Free-plan embeds carry a tiled Unicorn watermark: fine for the pitch, not for production.
- Cloth Physics renders black in headless Chrome (software WebGL); check it in a real browser.
