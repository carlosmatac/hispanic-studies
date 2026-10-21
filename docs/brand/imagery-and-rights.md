# Imagery and rights policy

Decided with the user on 2026-10-19. Applies to everything that ships in `proposals/o-atlas/` and to any production site after it.

## The rule

> On the page: **only images whose original we have located and whose licence we have logged.** AI is allowed for abstract texture and for the Caribbean/Miami register. Never for anything a reader could mistake for a historical document, painting or photograph.

Three reasons, in order of weight:

1. **The product is historical credibility.** The entire pitch is that the Black Legend is a falsification and that this institute deals in sources — 319 source records, a rights triage sheet, "bibliographic evidence" columns. A hallucinated 18th-century painting on that page is not a shortcut, it is the one mistake that discredits everything else on it. One screenshot of a fake casta painting on X and the argument is over.
2. **His own documents set the standard.** The acquisitions workbook distinguishes "verified fact / supported interpretation / inference / recommendation / research lead" and refuses to call anything cleared without a title page. Our imagery cannot be looser than his metadata.
3. **Practical.** The real art is public domain, free, and higher resolution than anything we would generate: Pradilla's *Rendición de Granada* in his own folder is 8133px.

## The four tiers

### Tier 1 — Ships: public domain, original located

Requirements, all of them:
- The original identified: artist, title, date, holding institution.
- Downloaded from Wikimedia Commons, a museum's open-access programme, the BNE/Biblioteca Digital Hispánica, the David Rumsey Map Collection, the Library of Congress, HathiTrust or an equivalent.
- Pre-1900 work, or otherwise confirmed public domain in both the US and Spain.
- ≥1800px on the long edge for anything full-bleed.
- Saved in `assets/art/` and logged in `assets/art/SOURCES.md` with the source URL and licence.

This is already how the repo works — eight files in `assets/art/` with sources. Nothing changes except volume.

### Tier 2 — Moodboard only: Beltrán's Drive folder

His 145-image folder ([`beltran-image-folder.md`](../research/beltran-image-folder.md)) is the best statement of his visual imagination we will ever get, and we use it as exactly that. It does **not** ship, because most of it is anonymous Pinterest/X downloads with no attribution, it contains press photography and 20th-century murals that are plainly under copyright, and one file is watermarked with the site it was scraped from.

What we do with it: for each image we want, find the original and promote it to Tier 1. The catalogue already marks 40-odd candidates with ★ (public domain *and* large enough). Priority list for sourcing is in the issue.

Worth saying to him plainly: the folder shows his imagination is **virreinal and mestizo** — Guadalupe, castas, biombos, the Mexico City Plaza Mayor, Cuzco school — while proposals A–N leaned on peninsular Velázquez and Zurbarán. That gap is probably a real part of why they felt like "un museo" to him. Correcting it costs nothing and is the single highest-leverage change to the imagery.

### Tier 3 — AI, allowed: texture and the Caribbean

Allowed uses, each one abstract or non-documentary:
- Paper, vellum, linen and canvas grain; map-fold creases; ink bleed; plate tone.
- Gradient and noise fields used as section grounds.
- The **Caribbean / Miami register**, which has essentially no usable material in his folder (one item, Albizu Campos) and no public-domain tradition to draw on — because the thing he is pointing at, "tropical, fresco, neón", is a *contemporary* Miami mood, not a historical one. Generated imagery here is honest: there is no original it could be mistaken for. It lives in Merch, which is the commercial register.
- Product mockups for merch (a tee, a print, a tote), clearly a mockup.
- **Architectural illustration of no particular building**, as a ground for our own content (amended 2026-10-21 for the pillars' portico): an idealised order or elevation that depicts no real monument, carries no generated text, and on which every word is ours, laid over it in HTML. It must not be presented, captioned or dated as a historical print.

Rules when we do use it:
- Logged in `assets/art/SOURCES.md` as `AI-generated` with the model and the prompt. No ambiguity in the repo about what is real.
- Never captioned, titled or dated as if it were a work.
- Never a person's face, never a named historical figure, never a "painting".

### Tier 4 — Never

- AI-generated historical scenes, paintings, portraits, documents, maps or photographs.
- Devotional images used as texture, pattern, glyph fill, or run through glitch/dither/meme effects. Guadalupe appears at full size with her title and date, or not at all. (Also: ask him before using her at all — the existing note in `iconography.md` stands.)
- Press photographs, Chicano murals and posters, Rivera, O'Gorman, Helguera-style calendar art: all in his folder, all under copyright.
- Anything from Atlas Hispano without written permission (below).
- The sensitive items flagged in the folder catalogue (Rizi's *Auto de fe*, the three-faced Trinity, the Evo Morales/Pope photo) without asking him first.

## Cartography

Covered in full in [`../research/cartography.md`](../research/cartography.md). The short version:

- The Atlas Hispano maps Beltrán pointed at are **not cleared**. The blog's feed mentions CC0 and CC BY-SA, but the two key posts — *La Iberofonía* and *El Mundo Ibérico* — carry no licence text we could verify, and the Iberofonía map is credited to **Álvaro Durántez Prados**, who is a third party and the originator of the term. "Coger la base de un mapa y hacerlo" [19:44] is not something we can do on that basis.
- So: **we draw our own**, from Natural Earth (public domain, CC0) plus the David Rumsey collection for historical plates. That also gives us data-driven layers, which a flattened PNG never could.
- In parallel, ask. Durántez Prados is a credible collaborator for the institute, not just a source — he appears in the 60-milestones document as the author of the Iberofonía proposal. An email from Beltrán asking to use or adapt the maps with credit is far more likely to succeed than one from us, and it is the kind of ask that could turn into an endorsement.

## Checklist before any image lands in a PR

- [ ] Original identified: artist / author, title, date, institution
- [ ] Licence confirmed public domain in US **and** Spain, or AI-generated and labelled as such
- [ ] Source URL recorded in `assets/art/SOURCES.md`
- [ ] ≥1800px if used full-bleed; `srcset` for anything over 1200px
- [ ] Not on the Tier 4 list
- [ ] If devotional or sensitive: asked Beltrán
