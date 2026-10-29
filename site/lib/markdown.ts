/* The back office's editor (TipTap) keeps a text as a ProseMirror document;
   the database keeps Markdown, which the reader renders with Markdoc
   (lib/text.ts). This turns the editor's document (editor.getJSON()) into
   that Markdown. Only what the editor allows can occur: paragraphs, chapter
   and section headings (## / ###), quotations, lists, a separator, line
   breaks, and bold, italic and links. Every character Markdown would read as
   syntax is escaped, so what Beltrán types is what the reader shows. */

export type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type Mark = { key: string; open: string; close: string };

const ORDER = ['link', 'bold', 'italic'];

function marksOf(n: PMNode): Mark[] {
  const out: Mark[] = [];
  for (const type of ORDER) {
    const m = n.marks?.find((x) => x.type === type);
    if (!m) continue;
    if (type === 'link') {
      const href = String(m.attrs?.href ?? '').replace(/[()\s]/g, (c) => encodeURIComponent(c));
      out.push({ key: `link:${href}`, open: '[', close: `](${href})` });
    } else if (type === 'bold') out.push({ key: 'bold', open: '**', close: '**' });
    else out.push({ key: 'italic', open: '*', close: '*' });
  }
  return out;
}

/** Escape what Markdown or Markdoc would take for syntax inside a line. */
const escapeInline = (s: string) => s.replace(/[\\*_[\]`{}<>]/g, (c) => `\\${c}`);

/** Escape what would start a block at the beginning of a line. */
function escapeLineStart(line: string) {
  return line
    .replace(/^(\s*)([#>+-])(?=\s|$)/, '$1\\$2')
    .replace(/^(\s*)(#{1,6})/, '$1\\$2')
    .replace(/^(\s*\d+)([.)])(?=\s|$)/, '$1\\$2')
    .replace(/^(\s*)(=+|-{3,})\s*$/, '$1\\$2');
}

function inline(nodes: PMNode[] = []): string {
  let out = '';
  let active: Mark[] = [];
  let pending = ''; // whitespace held back until the marks around it are settled
  const settle = (target: Mark[]) => {
    let k = 0;
    while (k < active.length && k < target.length && active[k].key === target[k].key) k++;
    for (let i = active.length - 1; i >= k; i--) out += active[i].close;
    out += pending;
    pending = '';
    for (let i = k; i < target.length; i++) out += target[i].open;
    active = target;
  };
  for (const n of nodes) {
    if (n.type === 'hardBreak') {
      settle([]);
      out += '\\\n';
      continue;
    }
    if (n.type !== 'text' || !n.text) continue;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.text)!;
    const [, lead, core, trail] = m;
    const target = marksOf(n);
    const same = target.length === active.length && target.every((t, i) => t.key === active[i].key);
    // a bare space between two italic runs stays outside them ("*a* *b*", not "*a b*")
    if (!core) { if (!same) settle(target); pending += n.text; continue; }
    if (same) { out += pending + lead; pending = ''; }
    else { pending += lead; settle(target); }
    out += escapeInline(core);
    pending = trail;
  }
  settle([]);
  return out.split('\n').map(escapeLineStart).join('\n');
}

function block(n: PMNode): string {
  switch (n.type) {
    case 'paragraph':
      return inline(n.content);
    case 'heading': {
      const level = Math.min(3, Math.max(2, Number(n.attrs?.level) || 2));
      return `${'#'.repeat(level)} ${inline(n.content).replace(/\\\n/g, ' ')}`;
    }
    case 'blockquote':
      return blocks(n.content).split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
    case 'bulletList':
    case 'orderedList': {
      const start = Number(n.attrs?.start) || 1;
      return (n.content ?? []).map((item, i) => {
        const marker = n.type === 'bulletList' ? '- ' : `${start + i}. `;
        const pad = ' '.repeat(marker.length);
        // a paragraph followed only by nested lists stays tight; several paragraphs need blank lines
        const tight = (item.content ?? []).slice(1).every((c) => c.type === 'bulletList' || c.type === 'orderedList');
        const body = blocks(item.content, tight);
        return body.split('\n').map((l, j) => (j === 0 ? marker + l : l ? pad + l : '')).join('\n');
      }).join('\n');
    }
    case 'horizontalRule':
      return '---';
    default:
      return n.content ? blocks(n.content) : '';
  }
}

function blocks(nodes: PMNode[] = [], tight = false): string {
  const parts = nodes.map(block).filter((s) => s.trim() !== '');
  return parts.join(tight ? '\n' : '\n\n');
}

/** The editor's document as Markdown (ending in one newline, or empty). */
export function docToMarkdown(doc: PMNode): string {
  const md = blocks(doc.content).replace(/\n{3,}/g, '\n\n').trim();
  return md ? md + '\n' : '';
}
