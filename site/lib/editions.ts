/* The curated 80's editions (issue #93): what each access state means, which
   button a reader gets for it, and when an edition may be hosted here. The
   rules are the brief's "Edition display" table
   (docs/research/iberofonia/DEI_Iberofonia_Developer_Brief.md). Client-safe:
   no database here. */

/** The access states of Beltrán's JSON (`extent`), with their labels in lib/i18n.ts (`archive80.access`). */
export const EXTENTS = [
  'complete_html', 'complete_pdf', 'complete_multipart', 'complete_viewer', 'complete_in_collection', 'facsimile',
  'part_html', 'part_pdf', 'partial_uncertain', 'partial_commercial', 'preview',
  'edition_record', 'restricted', 'commercial', 'locator', 'manuscript',
] as const;
export type Extent = (typeof EXTENTS)[number];

/** The whole text can be read online at the source (the brief's `complete_online`). Never a promise that it is free to download. */
export const COMPLETE_ONLINE: readonly string[] = ['complete_html', 'complete_pdf', 'complete_multipart', 'complete_viewer', 'complete_in_collection'];
/** A part, a selection, or a version whose coverage is not confirmed: never presented as the whole work. */
export const PARTIAL: readonly string[] = ['part_html', 'part_pdf', 'partial_uncertain', 'partial_commercial', 'preview'];

/**
 * The button an edition gets (lib/i18n.ts `archive80.button`):
 *   read       "Read at <source>"         a complete text online, not cleared for hosting
 *   facsimile  "See the facsimile at <source>"
 *   part       "Read the part at <source>" (selections, previews, versions of unconfirmed scope)
 *   publisher  "Publisher edition"        commercial editions, partial translations for sale
 *   request    "Request access"           reading rooms, restricted copies
 *   record     "Edition record"           catalogue entries, locators, manuscripts
 * Hosted editions get "Read here" or the PDF viewer instead (see hostedMode).
 */
export type ButtonKind = 'read' | 'facsimile' | 'part' | 'publisher' | 'request' | 'record';
export function buttonKind(extent: string): ButtonKind {
  if (COMPLETE_ONLINE.includes(extent)) return 'read';
  if (extent === 'facsimile') return 'facsimile';
  if (extent === 'partial_commercial' || extent === 'commercial') return 'publisher';
  if (PARTIAL.includes(extent)) return 'part';
  if (extent === 'restricted') return 'request';
  return 'record';
}

/** The reading languages of the archive (the groups on a work's page). Others are credited under the sources. */
export const READING_LANGS = ['es', 'pt', 'en'] as const;
export type ReadingLang = (typeof READING_LANGS)[number];
export const isReadingLang = (l: string): l is ReadingLang => (READING_LANGS as readonly string[]).includes(l);

/* ---------------- U.S. hosting (docs/cms.md, "Rights") ---------------- */

/** The 2026 cutoff of the 95-year term: works published in 1930 or earlier are in the U.S. public domain. Moves on 1 January. */
export const US_PD_CUTOFF_YEAR = new Date().getUTCFullYear() - 96;
export const RIGHTS_BASES = ['US_PUBLIC_DOMAIN_95', 'US_PUBLIC_DOMAIN_OTHER_DOCUMENTED', 'PERMISSION_DOCUMENTED'] as const;
export type RightsBasis = (typeof RIGHTS_BASES)[number];

export type HostingFields = {
  renderMode: string;
  rightsApproved: boolean;
  rightsBasis: string;
  rightsEvidence: string;
  completeSpan: string;
  approvedBy: string;
  approvedOn: string;
  publicationYear: number | null;
  pdfUrl: string;
};

/**
 * What is missing before an edition may be hosted here (empty = it may).
 * The approval must name a documented U.S. basis, who approved it and when,
 * the evidence and the span checked; under the 95-year rule the edition
 * itself must have been published by the cutoff year. A PDF needs its file.
 */
export function hostingProblems(e: HostingFields): ('approval' | 'basis' | 'evidence' | 'year' | 'pdf')[] {
  if (e.renderMode !== 'inline_html' && e.renderMode !== 'local_pdf') return [];
  const out: ('approval' | 'basis' | 'evidence' | 'year' | 'pdf')[] = [];
  if (!e.rightsApproved) out.push('approval');
  if (!(RIGHTS_BASES as readonly string[]).includes(e.rightsBasis)) out.push('basis');
  if (![e.rightsEvidence, e.completeSpan, e.approvedBy].every((s) => s.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(e.approvedOn)) out.push('evidence');
  if (e.rightsBasis === 'US_PUBLIC_DOMAIN_95' && !(e.publicationYear != null && e.publicationYear <= US_PD_CUTOFF_YEAR)) out.push('year');
  if (e.renderMode === 'local_pdf' && !/^https:\/\/\S+\.pdf(\?\S*)?$/i.test(e.pdfUrl.trim())) out.push('pdf');
  return out;
}

/** How a reader gets this edition: hosted here (only when every check passes) or through its link. */
export function hostedMode(e: HostingFields): 'inline_html' | 'local_pdf' | null {
  if ((e.renderMode === 'inline_html' || e.renderMode === 'local_pdf') && hostingProblems(e).length === 0) return e.renderMode;
  return null;
}

/* ---------------- where an edition is ---------------- */

const SOURCES: [RegExp, string][] = [
  [/(^|\.)wikisource\.org$/, 'Wikisource'],
  [/(^|\.)gutenberg\.org$/, 'Project Gutenberg'],
  [/(^|\.)archive\.org$/, 'Internet Archive'],
  [/(^|\.)cervantesvirtual\.com$/, 'Biblioteca Virtual Miguel de Cervantes'],
  [/(^|\.)vatican\.va$/, 'vatican.va'],
  [/^books\.google\./, 'Google Books'],
  [/(^|\.)hathitrust\.org$/, 'HathiTrust'],
  [/(^|\.)bne\.es$/, 'Biblioteca Nacional de España'],
  [/^pares\.cultura\.gob\.es$/, 'PARES'],
  [/(^|\.)wikimedia\.org$/, 'Wikimedia Commons'],
  [/(^|\.)academia\.edu$/, 'Academia.edu'],
  [/(^|\.)memoriapoliticademexico\.org$/, 'Memoria Política de México'],
  [/(^|\.)scielo\./, 'SciELO'],
  [/(^|\.)openlibrary\.org$/, 'Open Library'],
  [/(^|\.)bnportugal\.gov\.pt$/, 'Biblioteca Nacional de Portugal'],
  [/(^|\.)bndigital\.bn\.gov\.br$|(^|\.)bn\.gov\.br$/, 'Biblioteca Nacional do Brasil'],
  [/(^|\.)jstor\.org$/, 'JSTOR'],
  [/^doi\.org$/, 'DOI'],
  [/(^|\.)worldcat\.org$/, 'WorldCat'],
  [/(^|\.)getty\.edu$/, 'Getty'],
  [/(^|\.)wdl\.org$|(^|\.)loc\.gov$/, 'Library of Congress'],
  [/(^|\.)kb\.dk$/, 'Det Kgl. Bibliotek'],
  [/(^|\.)march\.es$/, 'Fundación Juan March'],
  [/(^|\.)wellcomecollection\.org$/, 'Wellcome Collection'],
  [/(^|\.)funag\.gov\.br$/, 'FUNAG'],
  [/(^|\.)dominiopublico\.gov\.br$/, 'Domínio Público'],
  [/(^|\.)cplp\.org$/, 'CPLP'],
  [/(^|\.)segib\.org$/, 'SEGIB'],
];

/** A readable name for where a link goes ("Project Gutenberg"); the bare host when we have no name for it. */
export function sourceNameFor(url: string): string {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch { return ''; }
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host.replace(/^www\./, '');
}
