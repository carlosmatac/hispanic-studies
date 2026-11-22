# Developer handoff: Iberofonía archive

**ES:** De la Monarquía Universal a la iberofonía: 80 textos sobre nuestra unidad civilizatoria  
**EN:** From Universal Monarchy to Iberofonía: 80 Texts on Civilizational Unity

**To the web team:** Build a bilingual reading archive for the Institute for Hispano Studies and De Indiis Editions. Import the 80 article records as drafts. Each is a place to learn about a work and then read it in the best available edition. Keep the existing Archive and any existing articles intact; connect an existing record when it is the same work. This package is content and implementation guidance, not a change to production.

## Landing-page copy

### Spanish

Mucho se ha dicho de la ficción hispánica, del Quijote al realismo mágico. Mucha menos atención ha recibido la tradición de no ficción: el pensamiento político, la crítica cultural, la teología y los debates jurídicos de los pueblos de lengua española y portuguesa. Fuera de estas lenguas, esa tradición es todavía menos conocida. Queremos cambiarlo.

¿Qué puede unir a pueblos que no comparten un solo Estado? Ochenta textos recorren las respuestas que se han dado en el mundo de lengua española y portuguesa: de la Monarquía Universal de Carlos V y la Unión Ibérica de Felipe II a la Hispanidad, la Patria Grande, la lusofonía y la Iberofonía. El recorrido pasa por el derecho de gentes, la fe, el mestizaje, la lengua y la cooperación entre Estados. No es la historia de una unidad ininterrumpida, sino la de distintas tentativas de construir un mundo común.

Cada artículo presenta al autor, explica qué estaba en discusión cuando escribió y ofrece las ediciones disponibles en español, portugués o inglés. Empieza por un período, un autor o una obra.

### English

Much has been said about Hispanic fiction, from Don Quixote to magical realism. Far less attention has gone to the nonfiction: the political thought, cultural criticism, theology, and legal debates of the Spanish- and Portuguese-speaking worlds. Global readers have had fewer opportunities to encounter this tradition on its own terms. We’re here to change that.

What can unite peoples who do not share a single state? Eighty texts trace the answers offered across the Spanish- and Portuguese-speaking world: from Charles V’s Universal Monarchy and Philip II’s Iberian Union to Hispanidad, Patria Grande, Lusophony, and Iberofonía. The readings move through the law of nations, faith, cultural mixture, language, and cooperation among states. They tell a history of distinct attempts to build a common world, not a story of uninterrupted unity.

Each article introduces the author, explains what was at stake when the work was written, and points to available editions in Spanish, Portuguese, or English. Start with a period, an author, or a work.

## Archive structure

- Browse by era, region, or available reading language; search by author, title, variant title, and issuing institution. Preserve chronological order within periods. There are **no theoretical labels or filters**.
- **Era 05:** Hispanidad, Indoamérica, Patria Grande y Lusotropicalismo: 1934-1959. English: Hispanidad, Indoamérica, Patria Grande, and Lusotropicalism: 1934-1959.
- Keep **Iberofonía** in English display copy. Use the exact lowercase spelling in the Spanish title; do not anglicize historical titles.
- Make the ES/EN **article language** control independent of the ES/PT/EN **reading editions**. A Portuguese original can be the only reading edition even though its introduction is in Spanish and English. Latin, Italian, Nahuatl, Quechua, and other original witnesses may be credited or linked under sources without generating empty reading tabs.
- A language may have an edition record but no open reading copy. If the interface promises **free full text online**, base the filter on `reading.complete_online` only after verifying the link. Show other languages and their access states inside the work record.
- Preserve `canon_id` and stable `slug` when a work is retained. `order` is the new display order, not the old ID number. IDs 081–088 are new. Retire the eight old IDs **from this curated 80 only**; do not delete their existing URLs, archive records, or sources. Upsert by `canon_id`, not `order`. Keep copy in review status by default.

## Article template

1. Original title; author or institution; date and kind of date; scope (work, complete document, chapter, or named bounded section). Use a literal genre label only to tell readers what they can read.
2. **About the author or issuing body.** Identify the person, formation, offices or intellectual work, and their place in the events discussed. For treaties and declarations, explain the issuing institution and participating parties.
3. **The work in its time.** Explain the problem, audience, argument, and what the document actually did or did not do.
4. **Why read it today?** Explain what it helps us understand in Hispanic, Portuguese-speaking, or wider history. Separate historical interpretation from advocacy.
5. **Read the text.** Group by language; show original or translation, edition, translator if known, access state, and primary button. List other verified editions as links, with excerpts, commercial editions, catalog records, and translations with incomplete scope accurately labeled. Add companion documents separately; never present them as editions of the same work.

### Edition display and article-language examples

| When the edition is… | Website behavior |
|---|---|
| Complete, proofed direct text approved for U.S. hosting | Put the historical text within the article, not in the biographical copy. Render it as accessible HTML with chapter and document anchors. Cite the witness and translation separately. |
| Complete, approved for U.S. hosting, scan only | Upload the checked PDF, expose a keyboard-usable viewer and a separate download link. Crop to the named document if it comes in a compilation; include accessible alternative text or a verified transcription if available. |
| Complete online but protected or not cleared for hosting | **Read at [source]**. Do not paste, proxy, embed, or mirror the file. |
| Protected commercial edition, reading-room copy, or catalogue only | Say **Publisher edition**, **Request access**, or **Edition record**. Never label that button free full text. |
| Translation incomplete, abridged, or only partly checked | Describe the covered chapters or edition scope. Do not present a partial copy as a complete translation. |

Test at least: Rizal (ES/EN historical direct text); Rodó (ES direct text and EN historical facsimile); Mendieta (whole five-book HTML with chapters); Oliveira Martins (PT original and ES edition only; suppress English UI); Ganivet (Spanish facsimile and known 1946 English edition record); Lezama (ES/PT/EN protected edition links); Juan Pablo II (ES/PT/EN official reading links). Test Isabel with paired documents, not as one concatenated text with unmarked breaks.

### Translation invitation and collaborator routes

If a complete English translation is known but only a paid, restricted, or catalog entry is available, show that link. Do not show a missing-translation appeal.

If no complete English translation was located, use: **“We’re working to bring this text into English. Help us make it happen sooner!”** Make the second sentence link to the site’s **Work with us / Collaborate** section. Spanish: **“Queremos llevar este texto al inglés. ¡Ayúdanos a hacerlo posible!”** If an abridgment exists, change the first sentence to **“We haven’t located a complete English translation.”**

Resolve the route from the site’s actual setting. This package suggests `/work-with-us#translations` and `/es/colabora#traducciones`; these are defaults, not verified live routes. Pass the work slug as a query parameter where possible. On the destination give distinct actions: **Collaborate as a translator**, **Donate**, and **Support us on Patreon**. Use the owner’s approved form and payment/Patreon URLs, not placeholders in production. An approved English asset or a complete published English edition should turn off the appeal. Do not show it on Oliveira Martins, where English is intentionally omitted.

## U.S. rights and asset workflow

For this U.S.-based release, use **U.S. copyright law** for hosting decisions. In 2026 the usual publication cutoff for the 95-year term is **1930 or earlier**. Do not derive clearance from birth date, composition, a manuscript’s age, or a modern scan’s free accessibility. U.S. treatment of an unpublished manuscript or a later first publication can differ. Analyze each translation, selection, introduction, annotation, image, and edition separately. A 1946 translation does not take the U.S. public-domain date of its 1897 original. Read [U.S. Copyright Office: What is Copyright?](https://www.copyright.gov/what-is-copyright/), [17 U.S.C. § 304](https://uscode.house.gov/us/usc/t17/s304/), [Cornell’s U.S. term chart](https://guides.library.cornell.edu/copyright/publicdomain), and [Copyright Office Circular 14 on derivative works](https://www.copyright.gov/circs/circ14.pdf). Check the source provider’s separate terms before copying its files or website packaging. This packet is not a legal opinion or a rights grant.

For each approved language edition, record publication year and imprint or rights authorization; the exact source URL and pages; original/translator/editor credits; any separate material to exclude; the approval date and approver. Verify both ends of the named text and all volumes or chapters. Do not pull in commentary, platform branding, tracking code, or third-party scripts with a transcription.

- `DEI_Iberofonia_Archive_80.json` contains all 80 works, 160 localized drafts, their edition links and separate `delivery_plan` and `us_hosting_basis` fields. The `html_candidate` and `pdf_candidate` plans are a queue for staff, not permission to host.
- `DEI_Iberofonia_Edition_Inventory.md` lists, work by work, which text can be read, which is a bibliographic route, and where a local asset is still needed.
- `DEI_Iberofonia_Posts_Review.md` gives the whole editorial draft separately from the historical primary text.
- `DEI_Iberofonia_Approved_Assets.example.json` and `DEI_Iberofonia_Apply_Approved_Assets.mjs` provide the staging handoff for reviewed local HTML and for PDF viewer/download paths. The script does not fetch the web or deploy anything.
- This packet **does not include the historical-text files, PDF scans, or proofed transcriptions**. No public site was modified. For immediate staging, use the reading and catalog links. When the editor supplies an approved local text, set `render_mode=inline_html` and import it into the reading block. For a cleared PDF, upload the asset first, then assign its accessible viewer and download routes. A modern link cannot be rendered on-site merely because the author also published an old original.

### Launch checks

- 80 distinct work IDs across six eras; one Spanish and one English article per work. The readiness of a primary edition must not block staging its article.
- Test all links in an ordinary browser, especially archives that restrict downloads or change by region/account. Don't silently replace a source with an unrelated commercial work. If no complete edition can be verified for a discretionary post, replace it only through an editorial decision that keeps the total at 80.
- The modern requested titles with only publisher/catalog routes must be marked accordingly. The archive title says 80 texts; it does not promise every edition is free to read online. No false “PDF download” or “full text” button.
- Compare imported routes, pagination, copyright labels, and edition-language switches with the source inventory. Run the import twice without duplicating anything. Return a staging URL and an edition approval queue, not a live launch.
