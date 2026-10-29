# Archive: where every hosted text comes from

The archive (`site/content/archive/`, issue #68) hosts the full text of a work
only when the work is in the **public domain in the US (where the site is
served), in Spain and in its own country**, and the copy is the **original
text** (not a modern translation, not an annotated, abridged or modernised
critical edition, which can carry its own rights). This file logs every hosted
text: one row per work, added when the text goes in. The same facts are in the
work's own file (`sourceEdition`, `sourceUrl`, `sourceRevision`,
`sourceLicence`) and on its page, under "Source of the text".

The verdict for every work, with its reasons and sources, is the rights
research of 2026-10-29 in `docs/research/archive-rights/` (texts-a: T001–T025;
texts-b: T026–T050 and the prelude), applied to the records by
`tools/apply-archive-research.mjs`. Images are logged separately, in
`assets/art/SOURCES.md`.

## How a text gets in

1. Check the rights: the author's death year against the strictest term that
   matters to us (US: published before 1931, with the URAA restorations for
   foreign works of 1931–1977; Spain: life + 80 for authors who died before
   7 December 1987, otherwise life + 70; the country of origin). A translation
   has its own translator's rights.
2. Find the copy: Wikisource, Project Gutenberg or a scholarly corpus (ELTeC)
   first; a scan of an early edition only once someone has transcribed and
   proofread it (no raw OCR on the site: such works carry `needsTranscription`).
3. Ingest it with `tools/ingest-text.py` (the commands used so far are below),
   or paste it into the CMS (`/keystatic`) with the same source fields filled in.
4. Log it below.

## Hosted texts (9)

| Id | Work | Rights | Text from | Revision | Edition the text follows | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| acosta-historia-natural | José de Acosta, *Historia natural y moral de las Indias* (Seville, 1590) | PD (d. 1600) | [Project Gutenberg #70219](https://www.gutenberg.org/ebooks/70219) (vol. 1) and [#50430](https://www.gutenberg.org/ebooks/50430) (vol. 2) | the ebooks as of 29 Oct 2026 | Madrid: Ramón Anglés, 1894, "fielmente reimpresa de la primera edición" | Dedication, Proemio, books I–VII; the 1894 editor's preface, the licences and the subject index are left out; Acosta's marginal references are kept as notes after each chapter. c. 171,000 words: the longest page of the site. |
| T001 | Simón Bolívar, *Carta de Jamaica* (Kingston, 6 Sept 1815) | PD (d. 1830) | [es.wikisource, "Carta de Jamaica", section "Copia 2/2: auténtica"](https://es.wikisource.org/w/index.php?title=Carta_de_Jamaica&oldid=1135125) | 1135125 | F. J. Yanes and C. Mendoza, *Colección de documentos relativos a la vida pública del Libertador*, vol. XXII (Caracas: Damiron y Dupuy, 1833), pp. 207–229, as copied by Vicente Lecuna | The second, sourced copy on the page (texts-a confirms it). First printed in English in 1818; the Spanish original is lost. Lecuna's editorial note (he died in 1954) is **left out**. |
| T003 | Andrés Bello, *Gramática … destinada al uso de los americanos: Prólogo* (1847) | PD (d. 1865) | [es.wikisource](https://es.wikisource.org/w/index.php?title=Gram%C3%A1tica_de_la_lengua_castellana_destinada_al_uso_de_los_americanos%2FPr%C3%B3logo&oldid=1518075) | 1518075 | Santiago de Chile, 1847 (first edition); the page names no printed source | Only the prologue; the "related cultural writings" of the compiler's entry are still to be chosen. |
| T007 | Francisco Luís Gomes, *Os brahamanes* (Lisbon, 1866) | PD (d. 1869) | [ELTeC-por POR0084 (TEI)](https://github.com/COST-ELTeC/ELTeC-por/blob/master/level1/POR0084_FraLGom_Bramanes.xml) | GitHub master on 29 Oct 2026 (release 2.0.0, doi:10.5281/zenodo.4288235) | First edition, Lisbon, 1866 | **CC BY 4.0: attribution to ELTeC (COST Action CA16204) is on the page.** The author's 17 glossary notes are numbered in the text and listed at the end. Chapter numbering as in the source (it skips VI and XIII–XIV and repeats XII in the first part). |
| T012 | José Rizal, *Filipinas dentro de cien años* (1889–1890) | PD (d. 1896) | [es.wikisource](https://es.wikisource.org/wiki/Filipinas_dentro_de_cien_a%C3%B1os%3B_estudio_pol%C3%ADtico-social), four parts | I 976536 · II 976539 · III 976533 · IV 976534 | Manila, 1905 (scan-backed and **validated** on Wikisource); first in *La Solidaridad* nos. 16, 18, 21, 24 | The edition's own lines citing each issue of *La Solidaridad* are kept. |
| T013 | José Martí, *Nuestra América* (1891) | PD (d. 1895) | [es.wikisource](https://es.wikisource.org/w/index.php?title=Nuestra_Am%C3%A9rica&oldid=1463347) | 1463347 | *El Partido Liberal*, Mexico, 30 Jan 1891 (dateline); first in *La Revista Ilustrada de Nueva York*, Jan 1891 | Wikisource flags the page as having no stated source. **To do: collate with the Centro de Estudios Martianos *Obras completas*, vol. 6, p. 15** ([PDF, CLACSO](https://biblioteca.clacso.edu.ar/Cuba/cem-cu/20150114041836/Vol06.pdf)); the record says so. |
| T015 | Miguel de Unamuno, *En torno al casticismo* (1895) | PD (d. 1936; free in Spain since 2017) | es.wikisource, the five essays: "La tradición eterna", "La casta histórica castellana", "El espíritu castellano", "De mística y humanismo", "Sobre el marasmo actual de España" | 1629055 · 1298236 · 1350298 · 862617 · 862618 | *La España Moderna* (Madrid), nos. LXXIV–LXXVIII, Feb–June 1895, as cited on each page | The pages' citation lines (Prensa Histórica) are left out; the essays' sections I–VI become sub-headings. |
| T018 | José Enrique Rodó, *Ariel* (1900) | PD (d. 1917) | [Project Gutenberg #22899](https://www.gutenberg.org/ebooks/22899) | the ebook as of 29 Oct 2026 | Valencia: Editorial Cervantes, 1920 | **Replaces the earlier Wikisource text** (unsourced): Gutenberg's is proofread and names its edition (texts-a's recommendation). That edition marks its eight parts by spacing only; they are numbered I–VIII as in the first edition (Montevideo, 1900). Rodó's three footnotes are kept. |
| T028 | José Carlos Mariátegui, *La unidad de la América Indo-Española* (1924) | PD (d. 1930) | [es.wikisource](https://es.wikisource.org/w/index.php?title=La_Unidad_de_la_Am%C3%A9rica_Indo-Espa%C3%B1ola&oldid=1643306) | 1643306 | *Variedades* (Lima), 6 Dec 1924; *Temas de nuestra América* (Amauta, 1960) | Compared with the Marxists Internet Archive copy of the *Obras completas*: same text; Wikisource's is the cleaner (no soft hyphens, no typos), so it is the one used. Only this essay; related essays of *Temas de nuestra América* can be added. |

Licence lines on the pages: Wikisource texts, *Text in the public domain.
Transcription from Wikisource, available under CC BY-SA 4.0.*; Gutenberg
texts, *Transcription from Project Gutenberg (proofread by Distributed
Proofreaders)*; ELTeC, *Transcription by the ELTeC project (COST Action CA16204),
CC BY 4.0*. (A faithful transcription of a public-domain text creates no new
rights in most jurisdictions; we credit the transcribers anyway, and ELTeC's
licence asks for it.)

### The commands

```bash
python3 tools/ingest-text.py T001 --wikisource "Carta de Jamaica" --section "Copia 2/2: auténtica" \
  --start "CONTESTACIÓN" --stop "Nota de Vicente Lecuna" --edition "…"
python3 tools/ingest-text.py T003 --wikisource "Gramática de la lengua castellana destinada al uso de los americanos/Prólogo" --edition "…"
python3 tools/ingest-text.py T007 --tei https://raw.githubusercontent.com/COST-ELTeC/ELTeC-por/master/level1/POR0084_FraLGom_Bramanes.xml \
  --demote --h2 '^SEGUNDA PARTE$' --edition "…" --licence "…"
python3 tools/ingest-text.py T012 --wikisource "Filipinas dentro de cien años; estudio político-social" --subpages \
  --drop '^(FILIPINAS|DENTRO DE CIEN AÑOS|I|II|III|IV)\.?$' --edition "…"
python3 tools/ingest-text.py T013 --wikisource "Nuestra América" --edition "…"
python3 tools/ingest-text.py T015 --wikisource "En torno al casticismo" --pages "La tradición eterna" "La casta histórica castellana" \
  "El espíritu castellano" "De mística y humanismo" "Sobre el marasmo actual de España" --br-paragraphs \
  --drop '^\[1\] Biblioteca Virtual de Prensa' --drop '^La España Moderna\. Núm' --drop '^Páginas \d+ a \d+\.$' --h3 '^[IVX]+\.?$' --edition "…"
python3 tools/ingest-text.py T018 --gutenberg 22899 --number-class top --number-class top1 --start "## I" --edition "…"
python3 tools/ingest-text.py T028 --wikisource "La Unidad de la América Indo-Española" --edition "…"
python3 tools/ingest-text.py acosta-historia-natural --gutenberg 70219 --demote --h2 '^A LA SERENISIMA INFANTA$' --h2 '^PROEMIO DEL AUTOR$' \
  --h2 '^LIBRO (PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO)\.?$' --drop '^FIN DEL' --drop '^ÍNDICE$' \
  --drop '^DE LOS LIBROS Y CAPÍTULOS' --start '## A la serenisima infanta' --stop 'TABLA' --edition "…"
python3 tools/ingest-text.py acosta-historia-natural --gutenberg 50430 --append --demote --h2 '^PR[ÓO]LOGO DEL AUTOR$' \
  --h2 '^LIBRO (PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO)\.?$' --drop '^FIN DEL' --drop '^FIN$' --drop '^ÍNDICE$' \
  --drop '^DE LOS LIBROS Y CAPÍTULOS' --drop '^ESTE TOMO SEGUNDO$' --drop '^Libro (quinto|sexto|s[ée]ptimo)\.$' \
  --start '## Prólogo del autor' --stop 'TABLA' --edition "…"
node tools/apply-archive-research.mjs   # then: records, links and source fields in the CMS's style
```

## Public domain, needs a transcription (25)

These are free everywhere, but online they exist only as scans (or as an
unproofread or incomplete transcription). Each record links the scans and is
flagged `needsTranscription: true`; the page says the text will go in once it
has been transcribed and proofread.

| Id | Work | Scans / partial texts |
| --- | --- | --- |
| sepulveda-democrates-secundus | Juan Ginés de Sepúlveda, *Democrates secundus* (c. 1544; printed 1892, Latin with Menéndez Pelayo's translation) | BVMC (Boletín de la RAH 21) |
| las-casas-brevisima | Bartolomé de las Casas, *Brevísima relación* (1552) | Seville 1552 (JCB), Cádiz 1821 (U. Sevilla); BVMC's modern critical edition, link only. es.wikisource has only the opening of Llorente's 1822 reworking. |
| garcilaso-comentarios-reales | Inca Garcilaso, *Comentarios reales* (1609) | Lisbon 1609; Lima 1918 (Urteaga) |
| guaman-poma-nueva-coronica | Guaman Poma, *Nueva corónica y buen gobierno* (c. 1615) | Royal Danish Library facsimile |
| solorzano-politica-indiana | Solórzano Pereira, *Política indiana* (1647) | BVMC; Madrid 1648 (U. Sevilla) |
| clavijero-historia-antigua | Clavijero, *Storia antica del Messico* (1780) | Cesena 1780 (Wellcome); Mora's Spanish translation, 1826 |
| viscardo-carta | Viscardo, *Lettre aux Espagnols-Américains* (1799) | 1799 (JCB); Miranda's 1801 translation (BVMC) |
| T002 | del Valle, *Soñaba el abad de San Pedro* (1822) | UNAH repository (1930 *Obras*) |
| T004 | Arosemena, *El Estado federal de Panamá* (1855) | BVMC |
| T005 | Bilbao, *Iniciativa de la América* (1856) | IA (1866 and 1897 *Obras completas*) |
| T006 | Torres Caicedo, *Unión latino-americana* (1865) | IA |
| T008 | Mera, *Ojeada histórico-crítica* (1868) | IA (1868), HathiTrust (1893) |
| T009 | Hostos, Antillean confederation writings (a selection still to be made) | none yet |
| T010 | Oliveira Martins, *História da civilização ibérica* (1879) | IA, HathiTrust (1880) |
| T011 | Nabuco, *O abolicionismo* (1883) | pt.wikisource, mostly unproofread |
| T014 | González Prada, *Pájinas libres* (1894) | IA (1894); es.wikisource has 13 of 21 pieces |
| T016 | Ganivet, *Idearium español* (1897) | IA, BVMC, HathiTrust |
| T017 | Darío, *El triunfo de Calibán* (1898) and related writings | related texts only (Wikisource, Gutenberg) |
| T019 | Riva-Agüero, *Carácter de la literatura del Perú independiente* (1905) | Larramendi digital edition (NC-ND: reference only), HathiTrust |
| T020 | Bomfim, *A América Latina: males de origem* (1905) | SciELO 2008 edition (take the text, not the apparatus), HathiTrust |
| T023 | Juderías, *La leyenda negra y la verdad histórica* (1914) | IA, Wikisource (begun), HathiTrust |
| T025 | Gagini, *La caída del águila* (1920) | IA, HathiTrust |
| T027 | Sardinha, *A aliança peninsular* (1924) | HathiTrust (1930); Maura's preface excluded |
| T033 | Masferrer, *El mínimum vital* (1929) | HathiTrust |
| T034 | Pedreira, *Insularismo* (1934) | HathiTrust (1942) |

## Not hosted: records with legitimate links (25)

| Id | Work | Verdict | Comes free |
| --- | --- | --- | --- |
| vitoria-de-indis | Vitoria, *Relectio de Indis* (1539) | PD, but Latin: no Spanish translation free in both Spain and the US (Torrubiano 1917 free in Spain from 2044) | links to the Latin text (School of Salamanca) and the 1557/1565/1917 editions |
| T021 | Tamayo, *Creación de la pedagogía nacional* (1910) | PD in the US only | Spain 2037 (perhaps earlier under the rule of the shorter term: a decision for Carlos) |
| T022 | García Calderón, *La creación de un continente* (1913) | PD in the US only | Spain 2034; no online copy known (Gutenberg's *Latin America: Its Rise and Progress* is a different book and is not linked) |
| T024 | Altamira, *España y el programa americanista* (1917) | PD in the US only | Spain 2032 |
| T026 | Ugarte, *El destino de un continente* (1923) | PD in the US only | Spain 2032 |
| T029 | Rojas, *Eurindia* (1924) | PD in the US only | Argentina 2028, Spain 2038 |
| T030 | Vasconcelos, *La raza cósmica* (1925) | PD in the US only | Spain 2040, Mexico 2060 |
| T031 | Henríquez Ureña, *Seis ensayos* (1928) | PD in the US only | **Spain 1 Jan 2027**: schedule it |
| T032 | Sandino, *Plan de realización del supremo sueño de Bolívar* (written 1929) | PD outside the US (first printing unverified) | US unknown |
| T035 | Maeztu, *Defensa de la Hispanidad* (1934) | PD outside the US | US 2030 |
| T036–T050 | Haya (1935), Zambrano, Ortiz, Freyre, Eyzaguirre, Zea, Pinto de Andrade, Baltasar Lopes, Agostinho da Silva, Methol Ferré, Ramos, Cabral, Ndongo, Nick Joaquín, Lourenço | in copyright | links to publishers, libraries or Internet Archive lending where one exists |
