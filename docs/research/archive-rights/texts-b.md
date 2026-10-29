# texts-b: canon works T026–T050 and the prelude period

Research only, 2026-10-29. The full data is in `texts-b.json` in the same folder; it is built by `build.py`.

## Rules used
- **US:** anything published before 1 Jan 1931 is PD. A foreign work published 1931–1977 that was still protected at home on 1 Jan 1996 had its copyright restored (URAA) for 95 years from publication.
- **Spain:** an author who died before 7 Dec 1987 gets life+80, so anyone who died in 1945 or earlier is PD in 2026. Later deaths get life+70. Terms run to 31 Dec.
- **Verdicts:**
  - `pd`: safe to host.
  - `pd-us-only`: PD in the US but not yet in Spain.
  - `pd-outside-us`: a category I added. PD in Spain or the author's country, but in copyright or unverified in the US. Treat it as not hostable from Vercel.
  - `copyright`: link to a legitimate copy only.

## Counts
| Verdict | T026–T050 | Prelude |
| --- | --- | --- |
| pd | 4 (T027 Sardinha, T028 Mariátegui, T033 Masferrer, T034 Pedreira) | 9 |
| pd-us-only | 4 (T026 Ugarte, T029 Rojas, T030 Vasconcelos, T031 Henríquez Ureña) | – |
| pd-outside-us | 2 (T032 Sandino, T035 Maeztu) | – |
| copyright | 15 (T036–T050) | – |

## T026–T050
| id | Work | 1st pub. | Lang | Author died | Verdict | Best source | Region |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T026 | Ugarte, *El destino de un continente* | 1923 Madrid, Mundo Latino | es | 1951 | pd-us-only (Spain 2032; PD in Argentina) | HathiTrust 000277589 (scan, US only) | South America |
| T027 | Sardinha, *A aliança peninsular* | 1924 Porto, Civilização | pt | 1925 | **pd** (but not Maura's preface: Spain © to 2043) | HathiTrust 001859735 (1930 2nd ed., US only); IA user scan | Lusophone world |
| T028 | Mariátegui, *La unidad de la América Indo-Española* | *Variedades*, 6 Dec 1924 | es | 1930 | **pd** | Wikisource (clean, complete, c. 1,300 words); marxists.org OC | South America |
| T029 | Rojas, *Eurindia* | 1924 BA, La Facultad | es | 1957 | pd-us-only (Argentina 2028, Spain 2038) | HathiTrust 102919873 (full view scan) | South America |
| T030 | Vasconcelos, *La raza cósmica* | [1925] Agencia Mundial de Librería | es | 1959 | pd-us-only (Spain 2040, Mexico 2060) | HathiTrust 007032796 (US only) | North America |
| T031 | Henríquez Ureña, *Seis ensayos…* | 1928 BA, Babel | es | 1946 | pd-us-only, **PD in Spain on 1 Jan 2027** | HathiTrust 007030310 (US only) | Caribbean |
| T032 | Sandino, *Plan de realización…* | **written** 20 Mar 1929; print history unverified | es | 1934 | pd-outside-us (US unverified) | *Geopolítica(s)* 12(2) 2021 (complete, c. 5,000 words) | North America (Central Am.) |
| T033 | Masferrer, *El mínimum vital* | 1929 (pamphlet, Guatemala) | es | 1932 | **pd** | HathiTrust 101044251 (US only) | North America (Central Am.) |
| T034 | Pedreira, *Insularismo* | 1934 Madrid | es | 1939 | **pd** (US: renewal not found; HathiTrust opened the 1942 ed.) | HathiTrust 001447701 (1942 ed., full view) | Caribbean |
| T035 | Maeztu, *Defensa de la Hispanidad* | 1934 Madrid | es | 1936 | pd-outside-us (PD in Spain; US © to end of 2029) | IA scan of 1934 ed. with BNE stamps | Spain |
| T036 | Haya, *El antimperialismo y el Apra* | **Dec 1935** (2nd ed. Ercilla 1936) | es | 1979 | copyright | Free PDF of the 2010 Congreso del Perú ed. (mirrored by marxists.org) | South America |
| T037 | Zambrano, *Pensamiento y poesía…* | 1939 México, Casa de España | es | 1991 | copyright | Alianza (OC text) / Galaxia Gutenberg OC I | Spain |
| T038 | Ortiz, *Contrapunteo cubano…* | 1940 La Habana, Montero | es | 1969 | copyright (PD only in Cuba) | IA lending (Ayacucho 1978); Cátedra 2002 | Caribbean |
| T039 | Freyre, *O mundo que o português criou* | 1940 Rio, José Olympio (from *Conferências na Europa*, 1938) | pt | 1987 | copyright | É Realizações 2010 | Lusophone world |
| T040 | Eyzaguirre, *Hispanoamérica del dolor* | 1947 (publisher unverified) | es | 1968 | copyright | Editorial Universitaria | South America |
| T041 | Zea, *América como conciencia* | 1953 Cuadernos Americanos no. 30 | es | 2004 | copyright | UNAM 1972 ed. (libraries) | North America |
| T042 | Andrade, *Qu'est-ce que le luso-tropicalisme?* | *Présence Africaine* 4, 1955 | fr | 1990 | copyright | Présence Africaine back issues / libraries | Lusophone world |
| T043 | B. Lopes, *Cabo Verde visto por Gilberto Freyre* | 1956 Praia, Imprensa Nacional, 52 pp. | pt | 1989 | copyright | BNP holding | Lusophone world |
| T044 | Agostinho da Silva, *Um Fernando Pessoa* | 1959 (imprint conflicting) | pt | 1994 | copyright | Guimarães Editores / libraries | Lusophone world |
| T045 | Methol Ferré, *El Uruguay como problema* | 1967 Montevideo | es | 2009 | copyright | Clásicos Uruguayos (Biblioteca Artigas) | South America |
| T046 | Ramos, *Historia de la nación latinoamericana* | 1968 BA, Peña Lillo | es | 1994 | copyright | Ediciones Continente 2011 | South America |
| T047 | Cabral, *National Liberation and Culture* | 1970 Syracuse lecture/pamphlet | fr (probably) | 1973 | copyright | IA lending: *Return to the Source* | Lusophone world |
| T048 | Ndongo, *Historia y tragedia de Guinea Ecuatorial* | 1977 Madrid, Cambio 16 | es | living | copyright | libraries (out of print) | **none fits**; Spain provisional |
| T049 | Joaquín, *Culture and History* | 1988 Manila, Solar | en | 2004 | copyright | Anvil 2004 (Yuchengco Museum shop) | Ibero-Asia |
| T050 | Lourenço, *A nau de Ícaro…* | 1999 Lisboa, Gradiva | pt | 2020 | copyright | Gradiva; Companhia das Letras 2001 | Lusophone world |

Practical state:
- Only **Mariátegui** (Wikisource) and **Sandino** (*Geopolítica(s)*) have a clean, complete transcription.
- Every other PD work is a scan and needs OCR.
- Most HathiTrust copies can only be read from the US.

## Corrections to `canon-works.json`
- **T036 year 1936 → 1935.** The first edition came out in December 1935, and Ercilla's 1936 printing is the 2nd edition. Sources: the front matter of the Congreso del Perú 2010 edition, and the Penn and SIU catalogue records ("2. ed.").
- **T036 title:** the original is spelled *El antimperialismo y el Apra*, not "antiimperialismo".
- **T032:** 1929 is when the Plan was **written** (El Chipotón, 20 March 1929). It circulated as a typescript, and García Laguardia later published it as "documento inédito". Label the date "written". Source: the editorial note in *Geopolítica(s)* 2021.
- **T047:** the 1970 Syracuse printing says it was "translated from the French". The original language is probably French; to confirm against the 1970 pamphlet.
- **T039:** note that the 1940 text is a revised form of *Conferências na Europa* (1938).
- **T044:** 1959 stands, but sources disagree on the first imprint (Porto Alegre IEL, Lisbon Guimarães, or a claimed 1958 edition).
- **T048:** none of the six regions fits Equatorial Guinea. Either add a seventh region or Carlos decides.
- **Sandino and Masferrer (Central America)** were placed in "North America". This needs a decision.

## Prelude: the Empire's own thought (P01–P09, all `pd`)
| id | Work | Date | Lang | Best source | Region | Why |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | Vitoria, *Relectio de Indis* | lectured 1539, printed Lyon 1557 | la | School of Salamanca W0013 (TEI/txt of the 1557 ed.) | Spain | Named by Beltrán; the rights of the Indians |
| P02 | Las Casas, *Brevísima relación* | Sevilla 1552 | es | IA 1552 princeps (JCB). Wikisource is incomplete; BVMC has a modern © edition (link only) | Spain | Named by Beltrán |
| P03 | Sepúlveda, *Democrates secundus* | written c. 1545; printed 1892 | la (+ Menéndez Pelayo's Spanish) | *Boletín RAH* 21 (1892) at BVMC | Spain | The other side of Valladolid |
| P04 | Acosta, *Historia natural y moral de las Indias* | Sevilla 1590 | es | **Project Gutenberg #70219 + #50430 (clean)** | South America | The Empire's natural and moral account of the Indies |
| P05 | Inca Garcilaso, *Comentarios reales* | Lisboa 1609 | es | IA 1609 princeps; Urteaga 1918 ed.; Wikisource has an anthology only | South America | The mestizo voice |
| P06 | Guaman Poma, *Nueva corónica y buen gobierno* | c. 1615; printed 1936 | es (+ Quechua) | Royal Danish Library facsimile (poma.kb.dk); Wikisource is incomplete | South America | An Indigenous programme of good government |
| P07 | Solórzano, *Política indiana* | Madrid 1647/48 | es | BVMC and IA scans | Spain | The Empire's legal summa of the Indies |
| P08 | Clavijero, *Storia antica del Messico* | Cesena 1780–81 | it (Spanish trans. by Mora, London 1826, PD) | IA (Wellcome; Mora 1826) | North America | The Creole defence of the New World |
| P09 | Viscardo, *Lettre aux Espagnols-Américains* | 1799 (Spanish by Miranda, 1801) | fr | IA 1799 (JCB); BVMC for the 1801 text | South America | The hinge to independence |

### Vitoria in Spanish
No Spanish translation is PD in both countries in 2026:
- **Torrubiano Ripoll, 1917, vol. 1** (De Indis, De iure belli, De matrimonio): IA `releccionesteol01vito`. It is PD in the US, but in Spain it is protected until the end of 2043 (the translator died in 1963).
- **Getino, 1933–35:** the translator died in 1946 (unverified), so it becomes PD in Spain in 2027. It is not yet PD in the US.

### Considered and left out
- **Sor Juana:** the *Respuesta* is off-theme. The *Loa* to *El divino Narciso* (1690) fits and could be an optional P10.
- **Sahagún:** the Florentine Codex is already used on a pillar. A good later addition.
- **Recopilación de Indias (1680):** a law code rather than a work of thought. Solórzano covers it.

## Open points for Carlos / Beltrán
1. Hosting from Vercel (US) when a work is PD in Spain but not in the US: Maeztu until 2030, and Sandino, whose US status is unverified.
2. A region for Equatorial Guinea and for Central America.
3. Whether to host US-only-PD works (Ugarte, Rojas, Vasconcelos, Henríquez Ureña) or wait. Henríquez Ureña becomes PD in Spain on 1 Jan 2027.
4. Sardinha: host his text without Maura's 1924 preface.
5. Unverified: the Plan's first publication, the publishers of the first editions of T034, T035, T040 and T045, the first imprint of T044, the "Buanga Fele" pseudonym (T042), and the School of Salamanca licence.
