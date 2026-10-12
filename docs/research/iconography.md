# Iconography: Beltrán's obsession and the images we can animate

## His obsession, in one sentence

**The Hispanic world is one civilization, Catholic and mestizo, that Spain *generated* (not plundered), that was broken up after 1810/1898 and that should be reunited**, and the Black Legend is the lie that keeps it divided.

Evidence:

- Intellectual line: the **Gustavo Bueno school** (Spanish philosophical materialism: Spain as a "generating empire" vs "predatory" empires). Most Substack posts are Bueno, Armesilla, Carvallo, Vélez translations. Plus **José Vasconcelos** (*La raza cósmica*) and **Elías de Tejada**.
- The pamphlet: *Hispanic **Reunification**: 200 Years of Theory and Praxis*.
- Video titles: "You Were Given a History With 300 Years Cut Out of It", "There Was No Mexico Before Cortes", "You Can't Erase Spain From the Party", "LATINO vs. HISPANIC", "The Black Legend".
- His own coinages: **Hispanorientalism** (Spain as the West that went so far west it became the East: al-Andalus, the Manila galleon) and **Baroque Modernity**.
- X location field: "**Our Lady of Guadalupe Empire**".

## The four iconic images

Ranked by how instantly his audience would recognise them, and how well they survive being turned into glyphs.

### 1. The Cross of Burgundy (Aspa de Borgoña)

- **Why:** his **most-viewed video** (203K, "The Flag That Connected the World") and the 151K one about Bolivians waving it. It flew from Flanders to Florida, Manila and Potosí. Hispanist internet uses it as a badge.
- **Glyph-friendly:** a red ragged saltire on white. Readable at any resolution, and it can be **animated procedurally** (waving cloth), no footage needed.
- **Source:** `assets/art/cross-of-burgundy.svg` (public domain, Wikimedia Commons).
- **Caution:** also used by Carlist and far-right groups in Spain. Ask Beltrán before putting it on merch.

### 2. Our Lady of Guadalupe (the 1531 tilma)

- **Why:** the single most recognised image among Mexican-Americans and US Hispanics (his target), Patroness of the Americas, explicitly in his manifesto and on his X profile. The perfect symbol of Catholic mestizaje.
- **Glyph-friendly:** iconic silhouette, mandorla of rays, strong contrast. The rays animate beautifully.
- **Source:** `assets/art/guadalupe-tilma.jpg` (public domain, Wikimedia Commons "Virgen de guadalupe1.jpg").
- **Caution:** it is a devotional image. Treat it with reverence (no glitchy/meme effects), and ask him.

### 3. Velázquez, *The Surrender of Breda* / *Las Lanzas* (1635)

- **Why:** the most famous image of the Spanish Tercios, with the forest of pikes; also a lesson in magnanimity (Spinola refuses to humiliate Justin of Nassau), which fits the "generating empire" thesis. This is our version of castle.tech's marching knights.
- **Glyph-friendly:** the vertical lances become columns of characters.
- **Source:** `assets/art/velazquez-las-lanzas.jpg` and `-crop-lances.jpg` (public domain).

### 4. The Manila galleon (Nao de China)

- **Why:** the visual of **Hispanorientalism**: Acapulco–Manila 1565–1815, the first globalisation, silver for silk. Short: "The West went so far West… it became the East."
- **Glyph-friendly:** the 1734 engraving from Cabrera Bueno's *Navegación especulativa y práctica* (printed in Manila) is pure line work, ideal for glyphs, and comes with its own motto: *"Por golfos más procelosos, con valor, arresto y zelo, haze gala de Neptuno esta nave con su vuelo."*
- **Source:** `assets/art/galleon-cabrera-bueno-1734.jpg` (public domain).

### Others worth keeping in mind

Hernán Cortés's ships, the Columbus Pillars / *Plus Ultra* (already on the Spanish arms and the dollar sign), the Habsburg eagle (already in his logo), Philip II's "empire on which the sun never sets" (the 𖤓 in his tagline?), Bolívar.

## How to animate them (state of the art)

castle.tech's "knights marching away" is a 6-second grayscale video (likely AI-generated) run through **Unicorn Studio**'s WebGL `glyphDither` effect: each cell of a grid samples the video's luminance and draws the glyph whose ink density matches (`· - : + * # % @`), then a duotone and a mouse effect. Frames: `assets/research/castle-tech-manifesto-video-frames.jpg`.

We reproduce that **without a SaaS dependency** in `proposals/shared/glyph-field.js` (issue #3): WebGL2, any source (image, video or procedural shader), any charset (digits, years, IHS, Roman numerals), brand palette.

For the final product, the hero clip would be a short generated video (e.g. Google Veo 3, Kling or Runway): *Tercios marching away from the camera with their pikes, toward Breda*, *the galleon sailing into the sunset seen from the stern*, *the Burgundy flag on a ship's mast*. The video then goes through the same glyph shader in the brand colours. We can't generate those clips from this repo; the mockups use public-domain art plus procedural motion.

## Sources and licences

See `assets/art/SOURCES.md`.
