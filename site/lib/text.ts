import Markdoc, { Tag, type RenderableTreeNode } from '@markdoc/markdoc';
import type { Section } from '@/lib/canon';

/* A work's text is Markdown (written by the back office's editor, or imported
   from the old files). The reader renders it with Markdoc, exactly as it did
   when the texts were files; the back office's preview uses the same code, and
   the word count behind the reading time comes from the same tree, so the
   three never disagree. Isomorphic: the editor imports it in the browser. */

/** Where an ad may go later (#70): an empty, hidden marker. No ad code yet. */
export const AD_SLOT_IN_TEXT = 'reader-in-text';

/** Words a minute, for the reading time ("about 12 min of reading"). */
export const WORDS_PER_MINUTE = 230;

const textOf = (n: RenderableTreeNode): string =>
  typeof n === 'string' ? n : Tag.isTag(n) ? n.children.map(textOf).join('') : '';

const wordsOf = (n: RenderableTreeNode): number =>
  typeof n === 'string' ? n.split(/\s+/).filter(Boolean).length : Tag.isTag(n) ? n.children.reduce<number>((k, c) => k + wordsOf(c), 0) : 0;

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 's';

/**
 * The text as a render tree, its chapters (the "## " headings) for the
 * contents, its length in words, and a marker for the future in-text ad slot
 * after the sixth paragraph of a long text.
 */
export function renderMarkdown(md: string, { adSlot = true } = {}) {
  const node = Markdoc.parse(md);
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
      if (adSlot && Tag.isTag(child) && child.name === 'p' && ++paragraphs === 6 && node.children.length > 20) {
        children.push(new Tag('div', { className: 'ad-slot', 'data-ad-slot': AD_SLOT_IN_TEXT, hidden: true, 'aria-hidden': 'true' }, []));
      }
    }
    tree.children = children;
    tree.name = 'div';
    tree.attributes = { ...tree.attributes, className: 'reader__text' };
  }
  return { tree, sections, words: wordsOf(tree) };
}

export const countWords = (md: string) => (md.trim() ? renderMarkdown(md, { adSlot: false }).words : 0);
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

export const renderTree = (tree: RenderableTreeNode, React: Parameters<typeof Markdoc.renderers.react>[1]) =>
  Markdoc.renderers.react(tree, React);

/** The text as HTML (what the editor loads). */
export const markdownToHtml = (md: string) => Markdoc.renderers.html(Markdoc.transform(Markdoc.parse(md)));
