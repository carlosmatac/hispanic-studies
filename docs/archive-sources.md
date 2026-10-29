# Archive: where every hosted text comes from

The archive (`site/content/archive/`, issue #68) hosts the full text of a work
only when the work is in the **public domain** and the copy is the **original
text** (not a modern translation, not an annotated, abridged or modernised
critical edition, which can carry its own rights). This file logs every hosted
text: one row per work, added when the text goes in. The same facts are in the
work's own file (`sourceEdition`, `sourceUrl`, `sourceRevision`,
`sourceLicence`) and on its page, under "Source of the text".

Images are logged separately, in `assets/art/SOURCES.md`.

## How a text gets in

1. Check the rights: the author's death year against the strictest term that
   matters to us (Spain: life + 80 for authors who died before 7 December 1987;
   Mexico: life + 100; most of the Americas: life + 50 to 70; the United States:
   published before 1931). A translation has its own translator's rights.
2. Find the copy: Wikisource first (it records each revision), then a scan of
   an early edition. Check that it is the original text and complete.
3. Ingest it: `python3 tools/ingest-wikisource.py <id> "<page>" --edition "…"`
   (see the script's header for `--section`, `--start`/`--stop`, `--subpages`).
   Or paste it into the CMS (`/keystatic`), with the same source fields filled in.
4. Log it below.

## Hosted texts

| Id | Work | Rights | Text from | Revision | Edition the text follows | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T001 | Simón Bolívar, *Carta de Jamaica* (Kingston, 6 September 1815) | Public domain (Bolívar d. 1830; the 1833 edition is long out of copyright) | [es.wikisource, "Carta de Jamaica", section "Copia 2/2: auténtica"](https://es.wikisource.org/w/index.php?title=Carta_de_Jamaica&oldid=1135125) | 1135125 | F. J. Yanes and C. Mendoza, *Colección de documentos relativos a la vida pública del Libertador*, vol. XXII (Caracas: Damiron y Dupuy, 1833), pp. 207–229, as copied by Vicente Lecuna | The page has two copies; we take the second ("auténtica"), which Wikisource sources to the 1833 edition. The original Spanish manuscript is lost: the letter was first printed in English (1818) and the 1833 Spanish text is the standard one. Lecuna's own editorial note (he died in 1954) is **left out**. |
| T013 | José Martí, *Nuestra América* (1891) | Public domain (Martí d. 1895) | [es.wikisource, "Nuestra América"](https://es.wikisource.org/w/index.php?title=Nuestra_Am%C3%A9rica&oldid=1463347) | 1463347 | *El Partido Liberal*, Mexico, 30 January 1891 (the text's own dateline); first published in *La Revista Ilustrada de Nueva York*, 10 January 1891 | Wikisource flags the page as having no stated source (notice of 2018). The text is complete and is the standard one; worth collating once against the *Obras completas* or a scan of either 1891 printing. |
| T018 | José Enrique Rodó, *Ariel* (1900) | Public domain (Rodó d. 1917) | [es.wikisource, "Ariel"](https://es.wikisource.org/wiki/Ariel), chapters I–VIII | I 1302346 · II 1302347 · III 1302348 · IV 1302349 · V 1302350 · VI 1302351 · VII 1302352 · VIII 1302353 | First edition: Montevideo, Dornaleche y Reyes, 1900 | The chapter pages name no printed source; Wikisource is proofreading a scan of the Valencia, Prometeo, 1919 edition (`Índice:Ariel (1919).djvu`) to replace them. The dedication "A la juventud de América" is not on the chapter pages, so it is not in our text yet. |

Licence line on every Wikisource text: *Text in the public domain.
Transcription from Wikisource, available under CC BY-SA 4.0.* (A faithful
transcription of a public-domain text creates no new rights in most
jurisdictions; we credit Wikisource anyway.)

## Checked and not hosted (yet)

| Id | Work | Why | What the page shows |
| --- | --- | --- | --- |
| las-casas-brevisima | Bartolomé de las Casas, *Brevísima relación de la destrucción de las Indias* (Seville, 1552) | Public domain, but es.wikisource has only the exordium of **Llorente's reworked 1822 version** (not the 1552 text) and marks it incomplete. No clean transcription of the original with a known source was found. | The record, and links to the scans of the first edition (Seville, 1552, John Carter Brown Library) and of the Cádiz 1821 edition (Universidad de Sevilla) on the Internet Archive. To host it: proofread a transcription of the 1552 scan. |
| vitoria-de-indis | Francisco de Vitoria, *Relectio de Indis* (1539) | Public domain, but in **Latin**; we host a Spanish text only if the translation is itself in the public domain, and none was confirmed. | The record, and links to the first edition (Lyon, 1557, John Carter Brown Library) and to the Carnegie 1917 edition (Latin with J. P. Bate's English translation). |
