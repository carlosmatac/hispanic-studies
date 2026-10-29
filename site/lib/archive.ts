import { cache } from 'react';
import { createReader } from '@keystatic/core/reader';
import Markdoc, { Tag, type RenderableTreeNode } from '@markdoc/markdoc';
import keystaticConfig from '@/keystatic.config';
import { PERIODS, REGIONS, RIGHTS, type CanonWork, type PeriodId, type RegionId, type Rights, type Section } from '@/lib/canon';

/* The archive's files (content/archive/<id>.md), read on the server at build
   time through Keystatic's own reader, so the site and the CMS always agree
   on the format. Pages are static: nothing here runs on a visitor's request. */

const reader = createReader(process.cwd(), keystaticConfig);
type Raw = NonNullable<Awaited<ReturnType<typeof reader.collections.archive.read>>>;

const oneOf = <T extends string>(list: readonly T[], v: string | null | undefined, fallback: T): T =>
  (list as readonly string[]).includes(v ?? '') ? (v as T) : fallback;

function toWork(id: string, e: Raw, hasText: boolean): CanonWork {
  return {
    id,
    title: e.title,
    author: e.author,
    fullName: e.fullName || e.author,
    life: e.life,
    year: e.year ?? 0,
    period: oneOf<PeriodId>(PERIODS.map((p) => p.id), e.period, 'continent'),
    region: oneOf<RegionId>(REGIONS.map((r) => r.id), e.region, 'south-america'),
    place: e.place,
    code: e.code,
    language: e.language,
    rights: oneOf<Rights>(RIGHTS, e.rights, 'unverified'),
    counter: e.counter,
    camp: e.camp,
    position: e.position,
    bueno: { code: e.buenoCode, name: e.buenoName },
    note: { en: e.noteEn, es: e.noteEs },
    summary: { en: e.summaryEn, es: e.summaryEs },
    source: { edition: e.sourceEdition, url: e.sourceUrl ?? '', revision: e.sourceRevision, licence: e.sourceLicence },
    links: e.links.filter((l) => l.url).map((l) => ({ label: l.label || l.url!, url: l.url! })),
    // a text is only ever shown for a public-domain work
    hasText: hasText && e.rights === 'public-domain',
  };
}

// the reader hands the body over lazily (a function) unless asked to resolve it
const bodyOf = async (e: Raw) => (typeof e.body === 'function' ? await e.body() : e.body).node;
const hasBody = async (e: Raw) => (await bodyOf(e)).children.length > 0;

/** Every work, in the order of the shelf: by year, then by id. */
export const getWorks = cache(async (): Promise<CanonWork[]> => {
  const all = await reader.collections.archive.all();
  const works = await Promise.all(all.map(async ({ slug, entry }) => toWork(slug, entry, await hasBody(entry))));
  return works.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
});

export const getWork = async (id: string) => (await getWorks()).find((w) => w.id === id);


const textOf = (n: RenderableTreeNode): string =>
  typeof n === 'string' ? n : Tag.isTag(n) ? n.children.map(textOf).join('') : '';

const wordsOf = (n: RenderableTreeNode): number =>
  typeof n === 'string' ? n.split(/\s+/).filter(Boolean).length : Tag.isTag(n) ? n.children.reduce<number>((k, c) => k + wordsOf(c), 0) : 0;

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 's';

/** Where an ad may go later (#70): an empty, hidden marker. No ad code yet. */
export const AD_SLOT_IN_TEXT = 'reader-in-text';

/**
 * The work's text as a render tree, its chapters (the "## " headings) for the
 * contents, and a marker for the future in-text ad slot after the sixth
 * paragraph of a long text.
 */
export const getText = cache(async (id: string) => {
  const e = await reader.collections.archive.read(id);
  if (!e || e.rights !== 'public-domain') return null;
  const node = await bodyOf(e);
  if (!node.children.length) return null;
  const tree = Markdoc.transform(node);
  const sections: Section[] = [];
  let paragraphs = 0;
  if (Tag.isTag(tree)) {
    const used = new Set<string>();
    const children: RenderableTreeNode[] = [];
    for (const child of tree.children) {
      if (Tag.isTag(child) && child.name === 'h2') {
        let sid = slugify(textOf(child));
        while (used.has(sid)) sid += '-';
        used.add(sid);
        child.attributes = { ...child.attributes, id: sid };
        sections.push({ id: sid, title: textOf(child) });
      }
      children.push(child);
      if (Tag.isTag(child) && child.name === 'p' && ++paragraphs === 6 && node.children.length > 20) {
        children.push(new Tag('div', { className: 'ad-slot', 'data-ad-slot': AD_SLOT_IN_TEXT, hidden: true, 'aria-hidden': 'true' }, []));
      }
    }
    tree.children = children;
    tree.name = 'div';
    tree.attributes = { ...tree.attributes, className: 'reader__text' };
  }
  const words = wordsOf(tree);
  return { tree, sections, words };
});

export const renderText = (tree: RenderableTreeNode, React: Parameters<typeof Markdoc.renderers.react>[1]) =>
  Markdoc.renderers.react(tree, React);
