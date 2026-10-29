'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { docToMarkdown, type PMNode } from '@/lib/markdown';
import { markdownToHtml, WORDS_PER_MINUTE } from '@/lib/text';
import { adminDict, type Lang } from '@/lib/i18n';

/* The text of a work, edited as it will read: the editing surface wears the
   reader's own styles (.reader__text). Only what the reader can show is
   allowed: chapters and headings, quotations, lists, a separator, bold,
   italics and links. Pasting from Word or Google Docs keeps those and drops
   the rest. What is stored is Markdown (lib/markdown.ts), read back by the
   same code as the reader (lib/text.ts). */

export type TextEditorHandle = { getMarkdown: () => string; clear: () => void };

type Props = {
  initial: string;
  lang: string;
  ui: Lang;
  onDirty: () => void;
  onCount: (words: number) => void;
  label: string;
};

/** Word and Google Docs paste their own HTML; keep its meaning, drop its noise. */
function cleanPaste(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Google Docs wraps everything in <b style="font-weight:normal">
  doc.querySelectorAll('b').forEach((b) => {
    if (/font-weight\s*:\s*(normal|400)/i.test(b.getAttribute('style') ?? '')) b.replaceWith(...Array.from(b.childNodes));
  });
  // the text has two levels of heading: chapter (h2) and heading (h3)
  doc.querySelectorAll('h1').forEach((h) => { const n = doc.createElement('h2'); n.append(...Array.from(h.childNodes)); h.replaceWith(n); });
  doc.querySelectorAll('h4, h5, h6').forEach((h) => { const n = doc.createElement('h3'); n.append(...Array.from(h.childNodes)); h.replaceWith(n); });
  // Word's comments, styles and empty paragraphs
  doc.querySelectorAll('style, meta, link, script, o\\:p').forEach((n) => n.remove());
  return doc.body.innerHTML;
}

function B({ on, label, active, children, disabled }: { on: () => void; label: string; active?: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" className="adm-tb__btn" onMouseDown={(e) => e.preventDefault()} onClick={on} aria-pressed={active} title={label} aria-label={label} disabled={disabled}>{children}</button>
  );
}

const countOf = (text: string) => text.split(/\s+/).filter(Boolean).length;

const TextEditor = forwardRef<TextEditorHandle, Props>(function TextEditor({ initial, lang, ui, onDirty, onCount, label }, ref) {
  const t = adminDict(ui).work.tb;
  const content = useMemo(() => (initial.trim() ? markdownToHtml(initial) : ''), [initial]);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'], HTMLAttributes: { rel: 'noopener', target: null } },
      }),
    ],
    content,
    editorProps: {
      attributes: { class: 'reader__text adm-editor__surface', lang, 'aria-label': label, spellcheck: 'true' },
      transformPastedHTML: cleanPaste,
    },
    onUpdate: () => onDirty(),
  });

  // a rough count while typing; the exact one is worked out on saving
  useEffect(() => {
    if (!editor) return;
    let timer = 0;
    const update = () => { window.clearTimeout(timer); timer = window.setTimeout(() => onCount(countOf(editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ', ' '))), 400); };
    update();
    editor.on('update', update);
    return () => { window.clearTimeout(timer); editor.off('update', update); };
  }, [editor, onCount]);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => (editor ? docToMarkdown(editor.getJSON() as PMNode) : initial),
    clear: () => { editor?.commands.clearContent(true); },
  }), [editor, initial]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => e ? {
      h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }), p: e.isActive('paragraph'),
      bold: e.isActive('bold'), italic: e.isActive('italic'), quote: e.isActive('blockquote'),
      bullets: e.isActive('bulletList'), numbers: e.isActive('orderedList'), link: e.isActive('link'),
      undo: e.can().undo(), redo: e.can().redo(),
    } : null,
  });

  const [linkOpen, setLinkOpen] = useState(false);
  if (!editor) return <div className="adm-editor adm-editor--loading" aria-busy="true" />;
  const c = () => editor.chain().focus();
  const link = () => {
    if (state?.link) { c().extendMarkRange('link').unsetLink().run(); return; }
    setLinkOpen(true);
    const url = window.prompt(t.linkPrompt, 'https://');
    setLinkOpen(false);
    if (!url || url === 'https://') return;
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    c().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="adm-editor">
      <div className="adm-tb" role="toolbar" aria-label={t.tools}>
        <B on={() => c().setParagraph().run()} label={t.paragraph} active={state?.p && !state.quote && !state.bullets && !state.numbers}>¶</B>
        <B on={() => c().toggleHeading({ level: 2 }).run()} label={t.chapter} active={state?.h2}><span className="adm-tb__word">{t.chapter}</span></B>
        <B on={() => c().toggleHeading({ level: 3 }).run()} label={t.section} active={state?.h3}><span className="adm-tb__word adm-tb__word--i">{t.section}</span></B>
        <span className="adm-tb__sep" aria-hidden="true" />
        <B on={() => c().toggleBold().run()} label={t.bold} active={state?.bold}><b>B</b></B>
        <B on={() => c().toggleItalic().run()} label={t.italic} active={state?.italic}><i>I</i></B>
        <B on={link} label={state?.link ? t.unlink : t.link} active={state?.link || linkOpen}>🔗</B>
        <span className="adm-tb__sep" aria-hidden="true" />
        <B on={() => c().toggleBlockquote().run()} label={t.quote} active={state?.quote}>❝</B>
        <B on={() => c().toggleBulletList().run()} label={t.bullets} active={state?.bullets}>•</B>
        <B on={() => c().toggleOrderedList().run()} label={t.numbers} active={state?.numbers}>1.</B>
        <B on={() => c().setHorizontalRule().run()} label={t.rule}>⁂</B>
        <span className="adm-tb__sep" aria-hidden="true" />
        <B on={() => c().undo().run()} label={t.undo} disabled={!state?.undo}>↶</B>
        <B on={() => c().redo().run()} label={t.redo} disabled={!state?.redo}>↷</B>
      </div>
      <EditorContent editor={editor} className="adm-editor__frame" />
    </div>
  );
});

export default TextEditor;

export const minutesFor = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));
