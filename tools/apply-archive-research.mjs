#!/usr/bin/env node
/* Apply the rights research of 2026-10-29 (docs/research/archive-rights/) to
   the archive's files (site/content/archive/), and add the prelude.

     node tools/apply-archive-research.mjs        (needs `npm ci` in site/ for js-yaml)

   For each work it sets: the rights verdict (only "public-domain" — free in the
   US, in Spain and in its own country — may carry a full text), when the work
   comes free where the research gives it, whether it needs a transcription
   (public domain, but only scans exist), legitimate links, corrections (with the
   reason in the note) and the region. It never touches a body or the source
   fields the ingest tool writes. It rewrites the frontmatter the way Keystatic
   saves it (js-yaml, schema order), so running it again changes nothing.

   The research itself (verdicts, sources, reasons) is in
   docs/research/archive-rights/texts-a.json and texts-b.json. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(ROOT, 'site/package.json'));
const yaml = require('js-yaml');
const DIR = path.join(ROOT, 'site/content/archive');

// the schema's order (site/keystatic.config.ts)
const KEYS = ['title', 'author', 'fullName', 'life', 'year', 'period', 'region', 'place', 'code', 'language',
  'rights', 'pdSpainYear', 'pdUsYear', 'needsTranscription', 'counter', 'camp', 'position', 'buenoCode', 'buenoName',
  'noteEn', 'noteEs', 'summaryEn', 'summaryEs', 'sourceEdition', 'sourceUrl', 'sourceRevision', 'sourceLicence', 'links'];
const ALWAYS = { counter: false, needsTranscription: false, links: [] };

const PERIODS = [['prelude', 1492, 1799], ['independence', 1800, 1870], ['ninety-eight', 1871, 1900],
  ['continent', 1901, 1930], ['hispanidad', 1931, 1960], ['after-empire', 1961, 2000]];
const periodFor = (y) => (PERIODS.find(([, a, b]) => y >= a && y <= b) ?? PERIODS[PERIODS.length - 1])[0];

const HT = (id) => `https://catalog.hathitrust.org/Record/${id}`;
const IA = (id) => `https://archive.org/details/${id}`;
const USONLY = ' (HathiTrust; viewable from the US only)';
const L = (label, url) => ({ label, url });

/* ------------------------------------------------------------------ the works */

const W = {
  T001: {
    rights: 'public-domain',
    noteEn: 'Written in Kingston, Jamaica, on 6 September 1815. It was first printed in English in 1818 (Jamaica Quarterly Journal and Literary Gazette) and in Spanish in 1833, in Caracas, in the Colección de documentos of Yanes and Mendoza: that 1833 text is the one given here, the Spanish original being lost.',
    noteEs: 'Escrita en Kingston (Jamaica) el 6 de septiembre de 1815. Se imprimió por primera vez en inglés en 1818 (Jamaica Quarterly Journal and Literary Gazette) y en español en 1833, en Caracas, en la Colección de documentos de Yanes y Mendoza: ese texto de 1833 es el que se da aquí, pues el original español se perdió.',
  },
  T002: {
    rights: 'public-domain', needsTranscription: true, life: '1777–1834',
    noteEn: 'First published in Valle’s paper El Amigo de la Patria, Guatemala, on 1 March 1822. (Valle was born in 1777, not 1780 as the compiler has it.)',
    noteEs: 'Publicado en El Amigo de la Patria, el periódico de Valle, en Guatemala, el 1 de marzo de 1822. (Valle nació en 1777, no en 1780 como dice el compilador).',
    links: [L('Obras de José Cecilio del Valle, vol. II: El Amigo de la Patria (Guatemala: Sánchez & de Guise, 1930), pp. 205–209. Scan, repository of the Universidad Nacional Autónoma de Honduras', 'https://tzibalnaah.unah.edu.hn/handle/123456789/109')],
  },
  T003: {
    rights: 'public-domain', title: 'Gramática de la lengua castellana destinada al uso de los americanos: Prólogo',
    noteEn: 'The prologue of Bello’s Gramática (Santiago de Chile, 1847). The compiler’s entry also points to his related cultural writings, such as the address at the founding of the University of Chile (1843); they can be added.',
    noteEs: 'El prólogo de la Gramática de Bello (Santiago de Chile, 1847). La ficha del compilador remite también a otros escritos suyos sobre la cultura, como el discurso de instalación de la Universidad de Chile (1843); se pueden añadir.',
    links: [
      L('The whole Gramática, Wikisource (es)', 'https://es.wikisource.org/wiki/Gram%C3%A1tica_de_la_lengua_castellana_destinada_al_uso_de_los_americanos'),
      L('Discurso en la inauguración de la Universidad de Chile (1843), Wikisource (es)', 'https://es.wikisource.org/wiki/Discurso_en_la_inauguraci%C3%B3n_de_la_Universidad_de_Chile'),
    ],
  },
  T004: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Dated 1 February 1855 and printed in Bogotá the same year, when the Isthmus was a state of New Granada.',
    noteEs: 'Fechado el 1 de febrero de 1855 e impreso en Bogotá ese mismo año, cuando el Istmo era un estado de la Nueva Granada.',
    links: [L('Digital copy, Biblioteca Virtual Miguel de Cervantes (from the Banco de la República, Colombia)', 'https://www.cervantesvirtual.com/obra/el-estado-federal-de-panama-1371138/')],
  },
  T005: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Read in Paris on 22 June 1856 and printed there days later: one of the first uses of the name “América latina”.',
    noteEs: 'Leída en París el 22 de junio de 1856 e impresa allí días después: uno de los primeros usos del nombre «América latina».',
    links: [
      L('Obras completas, ed. Manuel Bilbao, vol. 1 (Buenos Aires, 1866), p. 285. Internet Archive scan', IA('obrascompletasd00bilbgoog')),
      L('Obras completas, ed. P. P. Figueroa, vol. 1 (Santiago, 1897). Internet Archive scan', IA('obrascompletas01bilb')),
    ],
  },
  T006: {
    rights: 'public-domain', needsTranscription: true,
    links: [L('Paris: Rosa y Bouret, 1865 (Harvard copy). Internet Archive scan', IA('unionlatinoamer00caicgoog'))],
  },
  T007: {
    rights: 'public-domain',
    noteEn: 'A novel set in British India, by a Goan deputy to the Portuguese parliament (Lisbon, 1866). The author’s seventeen glossary notes are numbered in the text and listed at the end.',
    noteEs: 'Una novela ambientada en la India británica, de un diputado goés en las Cortes portuguesas (Lisboa, 1866). Las diecisiete notas de glosario del autor van numeradas en el texto y reunidas al final.',
    links: [L('First edition, Lisbon, 1866 (New York Public Library copy). Internet Archive scan', IA('osbrahamanesrom00gomegoog'))],
    sourceUrl: 'https://github.com/COST-ELTeC/ELTeC-por/blob/master/level1/POR0084_FraLGom_Bramanes.xml',
    sourceRevision: 'ELTeC-por POR0084, as on GitHub on 29 October 2026 (release 2.0.0: doi:10.5281/zenodo.4288235)',
  },
  T008: {
    rights: 'public-domain', needsTranscription: true,
    links: [
      L('First edition, Quito: Juan P. Sanz, 1868. Internet Archive scan', IA('OjeadaHistrico-crrticaSobreLaPoeseaEcuatorianaDesdeSuSpocaMcsRemotaHastaNuestrosDras')),
      L('2nd edition, Barcelona: J. Cunill Sala, 1893. HathiTrust', HT('001048994')),
    ],
  },
  T009: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Not a single work: the compiler’s entry is a selection of Hostos’s writings on an Antillean confederation (c. 1868 to the 1890s), still to be chosen. Several of them stayed unpublished until his Obras completas (Havana, 1939).',
    noteEs: 'No es una sola obra: la ficha del compilador es una selección, aún por hacer, de los escritos de Hostos sobre la confederación antillana (de hacia 1868 a la década de 1890). Varios quedaron inéditos hasta sus Obras completas (La Habana, 1939).',
  },
  T010: {
    rights: 'public-domain', needsTranscription: true,
    links: [
      L('2nd edition, Lisbon: Bertrand, 1880. Internet Archive scan', IA('histriadacivil00mart')),
      L('Lisbon: Bertrand, 1880. HathiTrust', HT('100010077')),
    ],
  },
  T011: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Written and printed in London (Abraham Kingdon, 1883).',
    noteEs: 'Escrito e impreso en Londres (Abraham Kingdon, 1883).',
    links: [L('Wikisource (pt), from the scan of the 1883 first edition; most pages not yet proofread', 'https://pt.wikisource.org/wiki/O_Abolicionismo')],
  },
  T012: {
    rights: 'public-domain',
    noteEn: 'Four articles in La Solidaridad (Barcelona and Madrid), September 1889 to January 1890.',
    noteEs: 'Cuatro artículos en La Solidaridad (Barcelona y Madrid), de septiembre de 1889 a enero de 1890.',
    links: [L('Project Gutenberg, the Manila edition of 1905', 'https://www.gutenberg.org/ebooks/14839')],
  },
  T013: {
    rights: 'public-domain',
    noteEn: 'First published in La Revista Ilustrada de Nueva York in January 1891 and in El Partido Liberal, Mexico, on 30 January 1891. The Wikisource text names no printed source; it is to be collated with the Centro de Estudios Martianos edition of the Obras completas, vol. 6.',
    noteEs: 'Publicado en La Revista Ilustrada de Nueva York en enero de 1891 y en El Partido Liberal, de México, el 30 de enero de 1891. El texto de Wikisource no indica su fuente impresa; queda por cotejarlo con la edición de las Obras completas del Centro de Estudios Martianos, t. 6.',
    links: [L('Obras completas, vol. 6 (Centro de Estudios Martianos, digital edition, hosted by CLACSO), p. 15', 'https://biblioteca.clacso.edu.ar/Cuba/cem-cu/20150114041836/Vol06.pdf')],
  },
  T014: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Printed in Paris (Paul Dupont, 1894) in González Prada’s own reformed spelling (“jente”, “i”), which is part of the work: a hosted text will keep it.',
    noteEs: 'Impreso en París (Paul Dupont, 1894) con la ortografía reformada del propio González Prada («jente», «i»), que es parte de la obra: un texto alojado la conservará.',
    links: [
      L('Paris: P. Dupont, 1894 (Harvard copy). Internet Archive scan', IA('pjinaslibres00pradgoog')),
      L('Wikisource (es): 13 of the 21 pieces, in the author’s spelling', 'https://es.wikisource.org/wiki/P%C3%A1jinas_libres'),
    ],
  },
  T015: {
    rights: 'public-domain',
    noteEn: 'Five essays first published in La España Moderna (Madrid), February to June 1895; collected as a book in 1902.',
    noteEs: 'Cinco ensayos publicados en La España Moderna (Madrid) de febrero a junio de 1895; reunidos en libro en 1902.',
  },
  T016: {
    rights: 'public-domain', needsTranscription: true,
    links: [
      L('First edition, Granada, 1897. Internet Archive scan', IA('AE099')),
      L('Facsimile of the Universidad de Granada copy, Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra/idearium-espanol/'),
      L('Granada, 1897. HathiTrust', HT('010943355')),
    ],
  },
  T017: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: '“El triunfo de Calibán” appeared in El Tiempo, Buenos Aires, on 20 May 1898; no transcription of it is online yet. The compiler’s entry also gathers Darío’s other writings on the hemisphere, “A Roosevelt” among them.',
    noteEs: '«El triunfo de Calibán» apareció en El Tiempo de Buenos Aires el 20 de mayo de 1898; aún no hay en línea una transcripción. La ficha del compilador reúne también otros escritos de Darío sobre el hemisferio, entre ellos «A Roosevelt».',
    links: [
      L('Related: “A Roosevelt” (1904), Wikisource (es)', 'https://es.wikisource.org/wiki/A_Roosevelt'),
      L('Related: Cantos de vida y esperanza (1905), Project Gutenberg', 'https://www.gutenberg.org/ebooks/50341'),
    ],
  },
  T018: {
    rights: 'public-domain',
    noteEn: 'First published in Montevideo in 1900. The text here is the Valencia edition of 1920, which marks its eight parts by spacing only; they are numbered I–VIII as in the first edition.',
    noteEs: 'Publicado por primera vez en Montevideo en 1900. El texto es el de la edición de Valencia de 1920, que separa sus ocho partes solo con espacio; van numeradas I–VIII como en la primera edición.',
    links: [
      L('2nd edition, Montevideo, 1900, with Clarín’s review. Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra/ariel--1/'),
      L('Another transcription, in eight chapters: Wikisource (es)', 'https://es.wikisource.org/wiki/Ariel'),
    ],
  },
  T019: {
    rights: 'public-domain', needsTranscription: true,
    links: [
      L('Digital edition, Fundación Ignacio Larramendi (Madrid, 2020). Internet Archive', IA('caracter-de-la-literatura-del-peru-independiente')),
      L('First edition, Lima: E. Rosay, 1905' + USONLY, HT('001519439')),
    ],
  },
  T020: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Written in Paris in 1903 and published in Rio de Janeiro (H. Garnier) in 1905.',
    noteEs: 'Escrito en París en 1903 y publicado en Río de Janeiro (H. Garnier) en 1905.',
    links: [
      L('Rio de Janeiro: Centro Edelstein, 2008 edition, free PDF (SciELO Books)', 'https://static.scielo.org/scielobooks/zg8vf/pdf/bomfim-9788599662786.pdf'),
      L('First edition, Rio de Janeiro: H. Garnier, 1905' + USONLY, HT('008904781')),
    ],
  },
  T021: {
    rights: 'pd-us-only', pdSpainYear: 2037,
    noteEn: 'Fifty-five editorials in El Diario (La Paz), July to September 1910, collected the same year. In the public domain in Bolivia since 2007.',
    noteEs: 'Cincuenta y cinco editoriales de El Diario (La Paz), de julio a septiembre de 1910, reunidos ese mismo año. De dominio público en Bolivia desde 2007.',
    links: [
      L('Free edition, Biblioteca del Bicentenario de Bolivia (La Paz: Ministerio de Culturas, 2014)', 'https://www.boliviabpb.org/IMG/pdf/creacio_n_de_la_pedagogi_a_nacional-_franz_tamayo.pdf'),
      L('La Paz, 1910' + USONLY, HT('100609355')),
    ],
  },
  T022: {
    rights: 'pd-us-only', pdSpainYear: 2034,
    noteEn: 'Published in Paris (Ollendorff) in 1913. No online copy of the Spanish edition is known yet.',
    noteEs: 'Publicado en París (Ollendorff) en 1913. Aún no se conoce una copia en línea de la edición española.',
  },
  T023: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'First published in 1914; an expanded edition followed in 1917.',
    noteEs: 'Publicado en 1914; en 1917 salió una edición ampliada.',
    links: [
      L('First edition, Madrid, 1914. Internet Archive scan', IA('laleyendanegrayl00jude')),
      L('Wikisource (es): transcription of the 1914 scan begun', 'https://es.wikisource.org/wiki/%C3%8Dndice:La_leyenda_negra_y_la_verdad_hist%C3%B3rica_1914.djvu'),
      L('Madrid, 1914. HathiTrust', HT('001858356')),
    ],
  },
  T024: {
    rights: 'pd-us-only', pdSpainYear: 2032,
    links: [L('Madrid: Editorial-América, 1917' + USONLY, HT('000278318'))],
  },
  T025: {
    rights: 'public-domain', needsTranscription: true,
    links: [
      L('San José: Trejos Hnos., 1920. Internet Archive scan', IA('lacadadelguilano00gagi')),
      L('San José, 1920. HathiTrust', HT('103245596')),
    ],
  },
  T026: {
    rights: 'pd-us-only', pdSpainYear: 2032,
    links: [L('Madrid: Editorial Mundo Latino, 1923' + USONLY, HT('000277589'))],
  },
  T027: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Porto: Livraria Civilização, 1924, with a preface by Gabriel Maura Gamazo, which is still in copyright in Spain: a hosted text will be Sardinha’s alone.',
    noteEs: 'Oporto: Livraria Civilização, 1924, con un prefacio de Gabriel Maura Gamazo que sigue protegido en España: un texto alojado será solo el de Sardinha.',
    links: [L('2nd edition, Porto: Civilização, 1930' + USONLY, HT('001859735'))],
  },
  T028: {
    rights: 'public-domain', title: 'La unidad de la América Indo-Española',
    noteEn: 'Published in Variedades (Lima) on 6 December 1924. The compiler’s entry also points to related essays of Temas de nuestra América; they can be added.',
    noteEs: 'Publicado en Variedades (Lima) el 6 de diciembre de 1924. La ficha del compilador remite también a otros ensayos de Temas de nuestra América; se pueden añadir.',
    links: [L('Temas de nuestra América, from the Obras completas: Marxists Internet Archive', 'https://www.marxists.org/espanol/mariateg/oc/temas_de_nuestra_america/paginas/unidad.htm')],
  },
  T029: {
    rights: 'pd-us-only', pdSpainYear: 2038,
    noteEn: 'In the public domain in Argentina from 1 January 2028.',
    noteEs: 'De dominio público en Argentina a partir del 1 de enero de 2028.',
    links: [
      L('Buenos Aires: La Facultad, 1924. HathiTrust', HT('102919873')),
      L('Buenos Aires: Losada, 1951. Internet Archive (borrow)', IA('eurindia0000rica')),
    ],
  },
  T030: {
    rights: 'pd-us-only', pdSpainYear: 2040,
    noteEn: 'Published by the Agencia Mundial de Librería (Paris, Madrid, Barcelona) in 1925. In Mexico it stays in copyright until 2060.',
    noteEs: 'Publicado por la Agencia Mundial de Librería (París, Madrid, Barcelona) en 1925. En México sigue protegido hasta 2060.',
    links: [
      L('Agencia Mundial de Librería, [1925]' + USONLY, HT('007032796')),
      L('Mexico: Espasa-Calpe Mexicana, 1976. Internet Archive (borrow)', IA('larazacosmicamis00vasc')),
    ],
  },
  T031: {
    rights: 'pd-us-only', pdSpainYear: 2027,
    links: [L('Buenos Aires: Babel, 1928' + USONLY, HT('007030310'))],
  },
  T032: {
    rights: 'pd-outside-us',
    noteEn: 'Written at El Chipotón, in Las Segovias, on 20 March 1929, and sent as a signed typescript to the governments of Latin America. When it was first printed is not yet established (by 1974 at the latest), and with it its status in the US.',
    noteEs: 'Escrito en El Chipotón, en Las Segovias, el 20 de marzo de 1929, y enviado como mecanoscrito firmado a los gobiernos de América Latina. Aún no se sabe cuándo se imprimió por primera vez (en 1974 a más tardar), ni por tanto su situación en EE. UU.',
    links: [L('Full text in Geopolítica(s) 12, no. 2 (2021), Universidad Complutense de Madrid, open access', 'https://revistas.ucm.es/index.php/GEOP/article/view/78605')],
  },
  T033: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Developed in editorials of Patria (San Salvador) and printed as a pamphlet in 1929.',
    noteEs: 'Desarrollado en editoriales de Patria (San Salvador) e impreso como folleto en 1929.',
    links: [L('[Guatemala]: Diario de Centro América, 1929' + USONLY, HT('101044251'))],
  },
  T034: {
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'First published in Madrid in 1934; second edition, San Juan, 1942.',
    noteEs: 'Publicado en Madrid en 1934; segunda edición, San Juan, 1942.',
    links: [L('2nd edition, San Juan: Biblioteca de Autores Puertorriqueños, 1942. HathiTrust', HT('001447701'))],
  },
  T035: { rights: 'pd-outside-us', pdUsYear: 2030 },
  T036: {
    rights: 'in-copyright', title: 'El antimperialismo y el Apra', year: 1935,
    noteEn: 'Written in Mexico in 1928; first edition December 1935, second edition Santiago de Chile: Ercilla, 1936 (the compiler dates it 1936 and spells it “antiimperialismo”).',
    noteEs: 'Escrito en México en 1928; primera edición en diciembre de 1935, segunda en Santiago de Chile: Ercilla, 1936 (el compilador la fecha en 1936 y escribe «antiimperialismo»).',
    links: [L('Free edition of the Fondo Editorial del Congreso del Perú (2010), mirrored by the Marxists Internet Archive', 'https://www.marxists.org/espanol/haya/1930s/antimperialismo/el-antimperialismo-y-el-apra.pdf')],
  },
  T037: {
    rights: 'in-copyright',
    links: [
      L('Alianza Editorial edition (first chapter free)', 'https://www.alianzaeditorial.es/primer_capitulo/pensamiento-y-poesia-en-la-vida-espanola.pdf'),
      L('Obras completas, vol. I (Galaxia Gutenberg / Fundación María Zambrano, 2015)', 'https://www.galaxiagutenberg.com'),
    ],
  },
  T038: {
    rights: 'in-copyright',
    links: [
      L('Caracas: Biblioteca Ayacucho, 1978. Internet Archive (borrow)', IA('contrapunteocuba0000orti')),
      L('Biblioteca Ayacucho (publishes its collection as free PDFs)', 'https://www.bibliotecayacucho.gob.ve'),
      L('Madrid: Cátedra, Letras Hispánicas, 2002, ed. Enrico Mario Santí', 'https://www.catedra.com'),
    ],
  },
  T039: {
    rights: 'in-copyright',
    noteEn: 'A revised and enlarged form of his Conferências na Europa (1938).',
    noteEs: 'Versión revisada y ampliada de sus Conferências na Europa (1938).',
    links: [L('São Paulo: É Realizações, 2010', 'https://www.erealizacoes.com.br')],
  },
  T040: { rights: 'in-copyright', links: [L('Santiago: Editorial Universitaria (in print)', 'https://www.universitaria.cl')] },
  T041: { rights: 'in-copyright' },
  T042: {
    rights: 'in-copyright', language: 'fr',
    noteEn: 'Présence Africaine (Paris), no. 4, October–November 1955.',
    noteEs: 'Présence Africaine (París), n.º 4, octubre-noviembre de 1955.',
    links: [L('Présence Africaine (publisher; back issues)', 'https://www.presenceafricaine.com')],
  },
  T043: { rights: 'in-copyright', links: [L('Praia: Imprensa Nacional, 1956. Biblioteca Nacional de Portugal (catalogue)', 'https://urn.bnportugal.gov.pt/bibliografia/unimarc/txt?id=77154')] },
  T044: {
    rights: 'in-copyright',
    noteEn: 'Published in 1959; the sources disagree on the first imprint (Porto Alegre or Lisbon).',
    noteEs: 'Publicado en 1959; las fuentes discrepan sobre el primer pie de imprenta (Porto Alegre o Lisboa).',
    links: [L('Lisbon: Guimarães Editores (reprints)', 'https://www.guimaraes-editores.pt')],
  },
  T045: { rights: 'in-copyright' },
  T046: { rights: 'in-copyright', links: [L('Buenos Aires: Ediciones Continente / Peña Lillo, 2011', 'https://www.edicontinente.com.ar')] },
  T047: {
    rights: 'in-copyright', language: 'fr',
    noteEn: 'The Eduardo Mondlane Memorial Lecture, Syracuse University, 20 February 1970. Its first printing, in English, says it was translated from the French.',
    noteEs: 'Conferencia Eduardo Mondlane, Universidad de Syracuse, 20 de febrero de 1970. Su primera impresión, en inglés, dice estar traducida del francés.',
    links: [
      L('In English, in Return to the Source (Monthly Review Press, 1973). Internet Archive (borrow)', IA('returntosourcese0000cabr')),
      L('In English, in Unity and Struggle (Cambridge)', 'https://www.cambridge.org/core/books/unity-and-struggle/national-liberation-and-culture/57A89005A07414F31EB6C51E69AF3313'),
    ],
  },
  T048: { rights: 'in-copyright' },
  T049: { rights: 'in-copyright', links: [L('Pasig: Anvil, 2004 edition', 'https://yuchengcomuseum.org/product/culture-and-history/')] },
  T050: {
    rights: 'in-copyright',
    links: [
      L('São Paulo: Companhia das Letras, 2001', 'https://www.companhiadasletras.com.br/livro/9788535901887/a-nau-de-icaro-e-imagem-e-miragem-da-lusofonia'),
      L('Lisbon: Gradiva, 1999', 'https://www.gradiva.pt'),
    ],
  },

  /* ---------------------------------------------------------------- the prelude */
  'vitoria-de-indis': {
    rights: 'public-domain',
    noteEn: 'Lectures given at the University of Salamanca in January 1539 and first printed in Lyon in 1557, in his Relectiones. The text is in Latin; no Spanish translation is yet free both in Spain and in the US (Torrubiano’s of 1917 is free in Spain only from 2044), so the archive links to the Latin.',
    noteEs: 'Lecciones dictadas en la Universidad de Salamanca en enero de 1539 e impresas por primera vez en Lyon en 1557, en sus Relectiones. El texto está en latín; aún no hay una traducción española libre a la vez en España y en EE. UU. (la de Torrubiano, de 1917, lo es en España solo desde 2044), así que el archivo enlaza al latín.',
    links: [
      L('Latin text of the 1557 edition, The School of Salamanca digital collection', 'https://id.salamanca.school/works.W0013'),
      L('Relectiones theologicae XII, Lyon: Jacques Boyer, 1557 (first edition; De Indis in vol. 1, pp. 282–374). John Carter Brown Library scan, Internet Archive', IA('reverendipatrisf00vito')),
      L('Relectiones undecim, Salamanca, 1565 (corrected by Alonso Muñoz). Internet Archive scan', IA('bub_gb_vhyZBkpPXQcC')),
      L('De Indis et De iure belli relectiones, ed. Ernest Nys, Latin with an English translation by John Pawley Bate. Washington: Carnegie Institution, 1917. Internet Archive', IA('franciscidevicto0000vito')),
    ],
  },
  'las-casas-brevisima': {
    rights: 'public-domain', needsTranscription: true, region: 'spain',
    noteEn: 'Written in 1542 for the future Philip II and printed in Seville in 1552. Wikisource has only the opening of a reworked version of 1822, not the 1552 text, so the full text will go in once the first edition has been transcribed.',
    noteEs: 'Escrita en 1542 para el futuro Felipe II e impresa en Sevilla en 1552. Wikisource solo tiene el comienzo de una versión rehecha de 1822, no el texto de 1552, así que el texto completo entrará cuando se haya transcrito la primera edición.',
    links: [
      L('First edition, Seville: Sebastián Trujillo, 1552. John Carter Brown Library scan, Internet Archive', IA('breuissimarelaci00casa')),
      L('Cádiz: Sincera Unión, 1821. Universidad de Sevilla scan, Internet Archive', IA('HFA901243')),
      L('Modern critical edition by José Miguel Martínez Torrejón, Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra/brevisima-relacion-de-la-destruccion-de-las-indias/'),
    ],
  },
  'sepulveda-democrates-secundus': {
    create: true,
    title: 'Democrates secundus, sive de iustis belli causis apud Indos', author: 'Juan Ginés de Sepúlveda', fullName: 'Juan Ginés de Sepúlveda',
    life: 'c. 1490–1573', year: 1544, region: 'spain', place: 'Spain (Córdoba, Valladolid)', code: 'ES', language: 'la',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Written c. 1544–1545 and refused a licence to print; it circulated in manuscript and stood behind Sepúlveda’s side of the Valladolid debate with Las Casas (1550–1551). First printed in 1892, by Marcelino Menéndez Pelayo, with a Spanish translation.',
    noteEs: 'Escrito hacia 1544-1545 y sin licencia de impresión; circuló manuscrito y sostiene la posición de Sepúlveda en la controversia de Valladolid con Las Casas (1550-1551). Se imprimió por primera vez en 1892, a cargo de Marcelino Menéndez Pelayo, con traducción española.',
    links: [L('Boletín de la Real Academia de la Historia 21 (1892), pp. 257–369: Latin text and Menéndez Pelayo’s Spanish translation. Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra-visor/boletin-de-la-real-academia-de-la-historia--63/html/')],
  },
  'acosta-historia-natural': {
    create: true,
    title: 'Historia natural y moral de las Indias', author: 'José de Acosta', fullName: 'José de Acosta',
    life: 'c. 1540–1600', year: 1590, region: 'south-america', place: 'Peru; Mexico; Spain', code: 'ES', language: 'es',
    rights: 'public-domain',
    noteEn: 'Printed in Seville in 1590, from fifteen years in Peru and Mexico. The text follows the Madrid reprint of 1894, a faithful copy of the first edition with its spelling; Acosta’s marginal references are given as notes at the end of each chapter.',
    noteEs: 'Impresa en Sevilla en 1590, fruto de quince años en el Perú y México. El texto sigue la reimpresión de Madrid de 1894, copia fiel de la primera edición con su ortografía; las referencias marginales de Acosta van como notas al final de cada capítulo.',
    links: [
      L('First edition, Seville: Juan de León, 1590. John Carter Brown Library scan, Internet Archive', IA('historianaturaly00acos_1')),
      L('The text here, vol. 1 (books I–IV): Project Gutenberg #70219', 'https://www.gutenberg.org/ebooks/70219'),
      L('The text here, vol. 2 (books V–VII): Project Gutenberg #50430', 'https://www.gutenberg.org/ebooks/50430'),
    ],
    sourceUrl: 'https://www.gutenberg.org/ebooks/70219',
    sourceRevision: 'Project Gutenberg #70219 (vol. 1) and #50430 (vol. 2)',
  },
  'garcilaso-comentarios-reales': {
    create: true,
    title: 'Comentarios reales de los Incas', author: 'Inca Garcilaso de la Vega', fullName: 'Inca Garcilaso de la Vega',
    life: '1539–1616', year: 1609, region: 'south-america', place: 'Peru (Cuzco); Spain', code: 'PE', language: 'es',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'The first part, Lisbon, 1609; the second (Historia general del Perú) followed in Córdoba in 1617. The son of an Inca princess and a conquistador, he wrote it in Spain.',
    noteEs: 'La primera parte, Lisboa, 1609; la segunda (Historia general del Perú) salió en Córdoba en 1617. Hijo de una princesa inca y de un conquistador, la escribió en España.',
    links: [
      L('First edition, Lisbon: Pedro Crasbeeck, 1609. Internet Archive scan', IA('bub_gb_7fB7gRxSefEC')),
      L('Lima, 1918 edition (ed. Horacio Urteaga), vol. 1. Internet Archive scan', IA('loscomentariosre01vega')),
    ],
  },
  'guaman-poma-nueva-coronica': {
    create: true,
    title: 'El primer nueva corónica y buen gobierno', author: 'Felipe Guaman Poma de Ayala', fullName: 'Felipe Guaman Poma de Ayala',
    life: 'c. 1535–c. 1616', year: 1615, region: 'south-america', place: 'Peru (Huamanga)', code: 'PE', language: 'es',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Completed c. 1615 and addressed to Philip III: 1,189 pages with 398 drawings, in Spanish with passages in Quechua. The manuscript, now in Copenhagen, was unknown until 1908 and unpublished until a facsimile appeared in 1936.',
    noteEs: 'Terminada hacia 1615 y dirigida a Felipe III: 1189 páginas con 398 dibujos, en español con pasajes en quechua. El manuscrito, hoy en Copenhague, fue desconocido hasta 1908 e inédito hasta el facsímil de 1936.',
    links: [L('The autograph manuscript, full facsimile: The Guaman Poma Website, Royal Danish Library', 'https://poma.kb.dk')],
  },
  'solorzano-politica-indiana': {
    create: true,
    title: 'Política indiana', author: 'Juan de Solórzano Pereira', fullName: 'Juan de Solórzano Pereira',
    life: '1575–1655', year: 1647, region: 'spain', place: 'Spain; Peru (Lima)', code: 'ES', language: 'es',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Madrid, 1647 (some copies dated 1648): the enlarged Spanish version of his Latin De Indiarum iure (1629–1639), from eighteen years as a judge of the Audiencia of Lima.',
    noteEs: 'Madrid, 1647 (algunos ejemplares con fecha de 1648): la versión española, ampliada, de su De Indiarum iure latino (1629-1639), fruto de dieciocho años como oidor de la Audiencia de Lima.',
    links: [
      L('Digital reproduction of the Universidad de Salamanca copy, Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra/politica-indiana/'),
      L('Madrid, 1648, vol. 1 (Universidad de Sevilla copy). Internet Archive scan', IA('A052260028')),
    ],
  },
  'clavijero-historia-antigua': {
    create: true,
    title: 'Storia antica del Messico', author: 'Francisco Javier Clavijero', fullName: 'Francisco Javier Clavijero',
    life: '1731–1787', year: 1780, region: 'north-america', place: 'Mexico (Veracruz); Italy', code: 'MX', language: 'it',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Written in Italian exile after the expulsion of the Jesuits (1767) and published in Cesena in 1780–1781; Spanish translations followed in 1826 (José Joaquín de Mora) and 1853. His own Spanish manuscript was printed only in 1945.',
    noteEs: 'Escrita en el exilio italiano tras la expulsión de los jesuitas (1767) y publicada en Cesena en 1780-1781; siguieron traducciones españolas en 1826 (José Joaquín de Mora) y 1853. Su propio manuscrito español no se imprimió hasta 1945.',
    links: [
      L('First edition, Cesena: Gregorio Biasini, 1780–1781 (Wellcome Collection). Internet Archive scan', IA('b28771965_0001')),
      L('Historia antigua de Mégico, trans. José Joaquín de Mora (London: Ackermann, 1826). Internet Archive scan', IA('historiaantiguad01clav')),
    ],
  },
  'viscardo-carta': {
    create: true,
    title: 'Lettre aux Espagnols-Américains', author: 'Juan Pablo Viscardo y Guzmán', fullName: 'Juan Pablo Viscardo y Guzmán',
    life: '1748–1798', year: 1799, region: 'south-america', place: 'Peru (Arequipa); Italy; London', code: 'PE', language: 'fr',
    rights: 'public-domain', needsTranscription: true,
    noteEn: 'Written c. 1791–1792 by an exiled Jesuit from Arequipa, and published after his death by Francisco de Miranda: in French in 1799 (London, as “Philadelphie”), and in Miranda’s Spanish translation, Carta derijida a los españoles americanos, in 1801.',
    noteEs: 'Escrita hacia 1791-1792 por un jesuita arequipeño desterrado y publicada tras su muerte por Francisco de Miranda: en francés en 1799 (Londres, con pie de «Philadelphie») y en la traducción española de Miranda, Carta derijida a los españoles americanos, en 1801.',
    links: [
      L('First edition, “Philadelphie” [London], 1799 (John Carter Brown Library). Internet Archive scan', IA('lettreauxespagno00vizc')),
      L('Carta dirigida a los españoles americanos, Miranda’s translation of 1801, ed. Georges L. Bastin: Biblioteca Virtual Miguel de Cervantes', 'https://www.cervantesvirtual.com/obra/carta-dirigida-a-los-espanoles-americanos-de-juan-pablo-viscardo-y-guzman-en-la-traduccion-de-francisco-de-miranda-1801/'),
    ],
  },
};

/* ------------------------------------------------------------------ apply */

function read(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?\n)---\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: no frontmatter`);
  return { data: yaml.load(m[1]) ?? {}, body: m[2] };
}

function write(file, data, body) {
  const out = {};
  for (const k of KEYS) {
    const v = data[k] ?? ALWAYS[k];
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  const extra = Object.keys(data).filter((k) => !KEYS.includes(k));
  if (extra.length) throw new Error(`${file}: unknown keys ${extra}`);
  fs.writeFileSync(file, `---\n${yaml.dump(out)}---\n${body}`);
}

let changed = 0, created = 0;
for (const [id, w] of Object.entries(W)) {
  const file = path.join(DIR, `${id}.md`);
  const exists = fs.existsSync(file);
  if (!exists && !w.create) throw new Error(`${id}: no file`);
  const { data, body } = exists ? read(file) : { data: {}, body: '' };
  const { create, ...fields } = w;
  Object.assign(data, fields);
  data.period = periodFor(data.year);
  if (data.rights !== 'public-domain' || body.trim()) data.needsTranscription = !body.trim() && !!w.needsTranscription;
  const before = exists ? fs.readFileSync(file, 'utf8') : '';
  write(file, data, body);
  if (fs.readFileSync(file, 'utf8') !== before) exists ? changed++ : created++;
}

// every other file is only put in the CMS's style
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const id = f.replace(/\.md$/, '');
  if (W[id]) continue;
  const file = path.join(DIR, f);
  const { data, body } = read(file);
  write(file, data, body);
}

const all = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => ({ id: f, ...read(path.join(DIR, f)) }));
const count = (fn) => all.filter(fn).length;
console.log(`${created} created, ${changed} changed; ${all.length} works:`,
  `${count((w) => w.body.trim())} with full text,`,
  `${count((w) => !w.body.trim() && w.data.needsTranscription)} need a transcription,`,
  `${count((w) => !w.body.trim() && !w.data.needsTranscription)} records with links only;`,
  Object.entries(all.reduce((a, w) => ({ ...a, [w.data.rights]: (a[w.data.rights] ?? 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', '));
