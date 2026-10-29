#!/usr/bin/env python3
"""Put a public-domain text into the archive (issue #68).

    python3 tools/ingest-text.py <id> --wikisource "<page>" [options]
    python3 tools/ingest-text.py <id> --gutenberg <ebook number> [options]
    python3 tools/ingest-text.py <id> --tei <url of a TEI XML file> [options]

Fetches the text from a legitimate source, turns it into clean Markdown and
writes it as the body of site/content/archive/<id>.md, which must already
exist (its record). It records where the text came from in the file's
frontmatter (sourceUrl, sourceRevision, sourceEdition, sourceLicence) and sets
rights to public-domain; nothing else in the record is touched.

Sources
  --wikisource PAGE   a Wikisource page, through the MediaWiki API (the rendered
                      HTML of one exact revision). With --section, only that section;
                      with --subpages, every subpage (PAGE/…) the page links, in order;
                      with --pages A B C, those pages, each under a "## " heading.
  --gutenberg N       a Project Gutenberg ebook (its HTML), without Gutenberg's
                      header, footer and licence, page numbers and tables.
  --tei URL           a TEI XML file (e.g. an ELTeC novel): the <text>, its
                      <head>s as chapters, its notes numbered and listed at the end
                      (under --notes-heading, default "Notas"); the header and page
                      breaks dropped.

Shaping the text
  --start TEXT / --stop TEXT   keep from the block that starts with START; stop
                               before the one that starts with STOP
  --drop REGEX                 drop every line that matches (repeatable)
  --h2 REGEX                   a block whose first line matches becomes a chapter
                               heading ("## "), with that line as its title (repeatable)
  --h3 REGEX                   the same, for a section heading ("### ")
  --demote                     the source's own headings become "### " (sub-chapters)
  --number-class CLASS         an element with this class starts a new section: a
                               "## I", "## II"… heading is put before it (repeatable;
                               for editions that mark sections by spacing only)
  --br-paragraphs              a line break inside a block starts a new paragraph
                               (pages that use <br> instead of paragraphs)
  --append                     add to the body instead of replacing it (a second volume)
  --edition TEXT               the printed edition the transcription follows
  --licence TEXT               the licence line (a default per source is used)
  --wiki es.wikisource.org     the wiki (default es.wikisource.org)
  --dry-run                    print the Markdown instead of writing it

Before you run it, check that the work is in the public domain (US, Spain and
its own country) and that the copy is the original text: not a modern
translation, not an annotated or abridged edition. Then log the source in
docs/archive-sources.md. Standard library only. Wikimedia and Gutenberg ask for
a descriptive User-Agent and a modest pace: one request at a time.
"""
import argparse
import html
import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / 'site/content/archive'
UA = 'IHS-archive-ingest/1.1 (https://github.com/carlosmatac/hispanic-studies)'
LICENCES = {
    'wikisource': 'Text in the public domain. Transcription from Wikisource, available under CC BY-SA 4.0.',
    'gutenberg': 'Text in the public domain. Transcription from Project Gutenberg (proofread by Distributed Proofreaders).',
    'tei': 'Text in the public domain. Transcription from the source named above.',
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode('utf-8')


def api(wiki, **params):
    params.update(format='json', formatversion='2')
    data = json.loads(get(f'https://{wiki}/w/api.php?' + urllib.parse.urlencode(params)))
    if 'error' in data:
        sys.exit(f'{wiki}: {data["error"].get("info")}')
    return data


# ---------------------------------------------------------------- HTML (and TEI) → blocks

SKIP_TAGS = {'style', 'script', 'table', 'noscript', 'img', 'figure', 'link', 'meta', 'head',
             # TEI
             'teiheader', 'note', 'pb', 'fw', 'figdesc', 'back'}
SKIP_CLASSES = {'ws-noexport', 'noprint', 'mw-editsection', 'reference', 'references', 'mw-references-wrap',
                'ambox', 'navbox', 'metadata', 'toc', 'pagenum', 'ws-pagenum', 'mw-empty-elt', 'wst-pagenum',
                'pg-boilerplate', 'x-ebookmaker-drop', 'tnote', 'transnote'}
SKIP_IDS = {'headertemplate', 'footertemplate', 'toc', 'pg-header', 'pg-footer'}
BLOCKS = {'p', 'div', 'center', 'blockquote', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dd', 'dt', 'section',
          'poem', 'l', 'lg', 'trailer', 'closer', 'opener', 'salute', 'signed', 'dateline', 'byline'}
HEADS = {'h1': 'h2', 'h2': 'h2', 'h3': 'h3', 'h4': 'h3', 'h5': 'h3', 'h6': 'h3'}
VOID = {'br', 'hr', 'img', 'wbr', 'meta', 'link', 'input', 'lb', 'pb'}
ITALIC = {'i', 'em', 'cite'}
BOLD = {'b', 'strong'}


class Blocks(HTMLParser):
    """Collects (kind, lines) blocks: kind is 'p', 'quote', 'h2' or 'h3'. Everything
    editorial (notices, Gutenberg's boilerplate, references, page numbers) is skipped;
    italics and bold are kept as \\x01 / \\x02 marks."""

    def __init__(self, demote=False, tei=False, number_classes=()):
        super().__init__(convert_charrefs=True)
        self.number_classes = set(number_classes)
        self.blocks, self.buf, self.stack = [], [], []
        self.skip = 0
        self.heading = None
        self.quote = 0
        self.skipped = set()
        self.demote = demote
        self.tei = tei

    def flush(self):
        text = ''.join(self.buf)
        self.buf = []
        lines = [re.sub(r'[ \t\u00a0]+', ' ', l.replace('\u00ad', '').replace('\ufeff', '')).strip() for l in text.split('\n')]
        lines = [l for l in lines if l]
        if lines:
            self.blocks.append((self.heading or ('quote' if self.quote else 'p'), lines))

    def starttag(self, tag, a):
        if self.tei and tag == 'head':
            tag = 'h2'
        if self.tei and tag == 'hi':
            rend = a.get('rend') or ''
            tag = 'i' if 'italic' in rend else 'b' if 'bold' in rend else 'span'
        return tag

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        tag = self.starttag(tag, a)
        classes = set((a.get('class') or '').split())
        if tag in VOID:
            if tag in ('br', 'lb') and not self.skip:
                self.buf.append('\n')
            return
        skip = (tag in SKIP_TAGS and not (self.tei and tag == 'head')) or bool(classes & SKIP_CLASSES) \
            or a.get('id') in SKIP_IDS or 'display:none' in (a.get('style') or '').replace(' ', '')
        if skip and not self.skip:
            self.skipped.add(tag + ''.join('.' + c for c in sorted(classes)) + ('#' + a['id'] if a.get('id') else ''))
        quote = bool(classes & {'footnotes', 'footnote', 'foot'}) or tag == 'blockquote'
        if tag == 'p' and classes & self.number_classes and not self.skip:
            self.flush()
            self.blocks.append(('number', []))
        self.stack.append((tag, skip, quote))
        if skip:
            self.skip += 1
            return
        if self.skip:
            return
        if tag in BLOCKS:
            self.flush()
            if tag in HEADS:
                self.heading = 'h3' if self.demote else HEADS[tag]
        if quote:
            self.flush()
            self.quote += 1
        if tag in ITALIC:
            self.buf.append('\x01')
        elif tag in BOLD:
            self.buf.append('\x02')

    def handle_endtag(self, tag):
        if self.tei and tag == 'head':
            tag = 'h2'
        if tag in VOID:
            return
        while self.stack:
            t, skip, quote = self.stack.pop()
            if skip:
                self.skip -= 1
            elif not self.skip:
                if t in BLOCKS:
                    self.flush()
                    if t in HEADS:
                        self.heading = None
                if quote:
                    self.flush()
                    self.quote -= 1
                if t in ITALIC:
                    self.buf.append('\x01')
                elif t in BOLD:
                    self.buf.append('\x02')
            if t == tag or (self.tei and t in ('i', 'b', 'span') and tag == 'hi'):
                break

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(re.sub(r'[\r\n]+', ' ', data))

    def close(self):
        super().close()
        self.flush()


def blocks_of(fragment, demote=False, tei=False, number_classes=()):
    p = Blocks(demote=demote, tei=tei, number_classes=number_classes)
    p.feed(fragment)
    p.close()
    return p.blocks, p.skipped


# ---------------------------------------------------------------- blocks → Markdown

def escape(text):
    """Escape what Markdown or Markdoc would read as markup."""
    text = text.replace('\\', '\\\\')
    return re.sub(r'([*_`\[\]<>{}])', r'\\\1', text)


def inline(text):
    text = escape(text)
    for mark, md in (('\x01', '_'), ('\x02', '**')):
        parts = text.split(mark)
        if len(parts) % 2 == 0:  # unbalanced: drop the marks
            text = ''.join(parts)
            continue
        out = []
        for i, p in enumerate(parts):
            if i % 2 == 1 and p.strip():
                lead, trail = p[:len(p) - len(p.lstrip())], p[len(p.rstrip()):]
                out.append(f'{lead}{md}{p.strip()}{md}{trail}')
            else:
                out.append(p)
        text = ''.join(out)
    return text


def plain(text):
    return text.replace('\x01', '').replace('\x02', '').strip()


ROMAN = re.compile(r'^[IVXLCDM]+[.,:]?$')


def tidy_heading(text):
    """'CAPÍTULO XII' → 'Capítulo XII'; mixed-case headings are left alone."""
    text = re.sub(r'\s+', ' ', text).strip().rstrip('.')
    if text.upper() != text or not re.search('[A-ZÁÉÍÓÚÑ]', text):
        return text
    words = [w if ROMAN.match(w) else w.lower() for w in text.split(' ')]
    first = words[0]
    words[0] = first if ROMAN.match(first) else first[:1].upper() + first[1:]
    return ' '.join(words)


def block_start(line):
    line = re.sub(r'^(\d+)([.)])(\s)', r'\1\\\2\3', line)
    return re.sub(r'^([#>+\-=])', r'\\\1', line)


def roman(n):
    out = ''
    for v, r in ((1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')):
        while n >= v:
            out, n = out + r, n - v
    return out


def to_markdown(blocks, drop=(), h2=(), h3=(), br_paragraphs=False):
    out = []
    numbered = 0
    if br_paragraphs:  # every line of a paragraph block is a paragraph of its own
        blocks = [x for k, ls in blocks for x in ([(k, [l]) for l in ls] if k in ('p', 'quote') else [(k, ls)])]
    for kind, lines in blocks:
        if kind == 'number':
            numbered += 1
            out.append(f'## {roman(numbered)}')
            continue
        lines = [l for l in lines if not any(re.search(d, plain(l)) for d in drop)]
        if not lines:
            continue
        if kind in ('p', 'h2', 'h3') and any(re.search(h, plain(lines[0])) for h in h2):
            kind, lines = 'h2', lines[:1]
        elif kind == 'p' and any(re.search(h, plain(lines[0])) for h in h3):
            kind, lines = 'h3', lines[:1]
        if kind in ('h2', 'h3'):
            title = tidy_heading(' '.join(plain(l) for l in lines))
            if title:
                out.append(('## ' if kind == 'h2' else '### ') + escape(title))
            continue
        for g in [lines]:
            g = [inline(l) for l in g]
            g = [l for l in g if l.strip()]
            if not g:
                continue
            body = ' \\\n'.join(block_start(l) if i == 0 else l for i, l in enumerate(g))
            out.append(('> ' + body.replace('\n', '\n> ')) if kind == 'quote' else body)
    return out


def cut(paragraphs, start, stop):
    def key(p):
        return re.sub(r'[\\*_#> ]', '', p).lower()
    if start:
        idx = next((i for i, p in enumerate(paragraphs) if key(p).startswith(key(start))), None)
        if idx is None:
            sys.exit(f'--start "{start}" not found')
        paragraphs = paragraphs[idx:]
    if stop:
        idx = next((i for i, p in enumerate(paragraphs) if key(p).startswith(key(stop))), None)
        if idx is None:
            sys.exit(f'--stop "{stop}" not found')
        paragraphs = paragraphs[:idx]
    return paragraphs


# ---------------------------------------------------------------- sources

def wikisource_page(wiki, page, section_title=None):
    params = {'action': 'parse', 'page': page, 'prop': 'text|revid|sections|displaytitle',
              'disableeditsection': '1', 'redirects': '1'}
    d = api(wiki, **params)['parse']
    if section_title:
        secs = [s for s in d['sections'] if html.unescape(re.sub('<[^>]+>', '', s['line'])).strip() == section_title]
        if not secs:
            sys.exit(f'{page}: no section "{section_title}"; there are: ' + ', '.join(s['line'] for s in d['sections']))
        time.sleep(1)
        d = api(wiki, **params, section=secs[0]['index'])['parse']
    return d


def wikisource_subpages(wiki, page):
    d = api(wiki, action='parse', page=page, prop='links')['parse']
    seen, ordered = set(), []
    for l in d['links']:
        t = l['title']
        if l['ns'] == 0 and t.startswith(page + '/') and l.get('exists', True) and t not in seen:
            seen.add(t)
            ordered.append(t)
    if not ordered:
        sys.exit(f'{page}: no subpages linked')
    return ordered


def permalink(wiki, title, revid):
    return f'https://{wiki}/w/index.php?' + urllib.parse.urlencode({'title': title.replace(' ', '_'), 'oldid': revid})


def from_wikisource(args, shape):
    wiki = args.wiki
    chapters = None
    if args.subpages:
        chapters = [(t, t.split('/')[-1]) for t in wikisource_subpages(wiki, args.wikisource)]
    elif args.pages:
        chapters = [(t, t) for t in args.pages]
    if chapters is None:
        d = wikisource_page(wiki, args.wikisource, args.section)
        blocks, skipped = blocks_of(d['text'], demote=args.demote)
        rev = str(d['revid']) + (f' (section "{args.section}")' if args.section else '')
        return shape(blocks), skipped, permalink(wiki, d['title'], d['revid']), rev
    parts, revs, skipped = [], [], set()
    for title, heading in chapters:
        time.sleep(1)
        d = wikisource_page(wiki, title)
        blocks, sk = blocks_of(d['text'], demote=True)
        skipped |= sk
        paras = shape(blocks)
        # the chapter's own heading, if it starts with one, gives way to ours
        if paras and paras[0].startswith('#') and paras[0].lstrip('# ').strip().lower() == heading.lower():
            paras = paras[1:]
        parts += [f'## {escape(heading)}'] + paras
        revs.append(f'{title}@{d["revid"]}')
        print(f'  {title}: revision {d["revid"]}, {len(paras)} blocks', file=sys.stderr)
    url = f'https://{wiki}/wiki/' + urllib.parse.quote(args.wikisource.replace(' ', '_')) if args.wikisource else ''
    return parts, skipped, url, '; '.join(revs)


def from_gutenberg(args, shape):
    n = args.gutenberg
    url = f'https://www.gutenberg.org/cache/epub/{n}/pg{n}-images.html'
    page = get(url)
    m = re.search(r'<body[^>]*>(.*)</body>', page, re.S)
    blocks, skipped = blocks_of(m.group(1) if m else page, demote=args.demote, number_classes=args.number_class)
    return shape(blocks), skipped, f'https://www.gutenberg.org/ebooks/{n}', f'Project Gutenberg #{n}'


def from_tei(args, shape):
    xml = get(args.tei)
    # the notes in <back> are numbered into the text ([1], [2]…) and listed at the end
    notes = re.findall(r'<note xml:id="([^"]+)"[^>]*>(.*?)</note>', xml, re.S)
    number = {nid: i for i, (nid, _) in enumerate(notes, 1)}
    xml = re.sub(r'\s*<ref target="#([^"]+)"\s*/>', lambda m: f' [{number[m.group(1)]}]' if m.group(1) in number else '', xml)
    if notes:
        listed = ''.join(f'<p>[{i}] {re.sub(r"</?p>", "", body).strip()}</p>' for i, (_, body) in enumerate(notes, 1))
        xml = xml.replace('</body>', f'<div><head>{args.notes_heading}</head>{listed}</div></body>', 1)
    m = re.search(r'<text[\s>].*</text>', xml, re.S)
    blocks, skipped = blocks_of(m.group(0) if m else xml, demote=args.demote, tei=True)
    return shape(blocks), skipped, args.tei, ''


# ---------------------------------------------------------------- the content file

def set_key(front, key, value):
    """Replace (or add) one top-level key of the YAML frontmatter, value as a JSON string."""
    line = f'{key}: {json.dumps(value, ensure_ascii=False)}'
    pattern = re.compile(rf'^{re.escape(key)}:.*(?:\n[ \t]+.*)*', re.M)
    if pattern.search(front):
        return pattern.sub(lambda _: line, front, count=1)
    return front.rstrip('\n') + '\n' + line + '\n'


def get_key(front, key):
    m = re.search(rf'^{re.escape(key)}: "(.*)"$', front, re.M)
    return json.loads(f'"{m.group(1)}"') if m else ''


def write_entry(entry_id, body, fields, append=False):
    path = ARCHIVE / f'{entry_id}.md'
    if not path.exists():
        sys.exit(f'{path.relative_to(ROOT)} does not exist: create the record first (in the CMS or by hand)')
    raw = path.read_text()
    m = re.match(r'^---\n(.*?\n)---\n?(.*)$', raw, re.S)
    if not m:
        sys.exit(f'{path.relative_to(ROOT)}: no frontmatter')
    front, old = m.group(1), m.group(2)
    if append and old.strip():
        body = old.rstrip('\n') + '\n\n' + body
        for k in ('sourceUrl', 'sourceRevision'):
            prev = get_key(front, k)
            if prev and fields.get(k) and fields[k] not in prev:
                fields[k] = f'{prev}; {fields[k]}'
    for k, v in fields.items():
        if v:
            front = set_key(front, k, v)
    path.write_text(f'---\n{front}---\n{body}')
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('id')
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument('--wikisource')
    src.add_argument('--gutenberg')
    src.add_argument('--tei')
    ap.add_argument('--wiki', default='es.wikisource.org')
    ap.add_argument('--section')
    ap.add_argument('--subpages', action='store_true')
    ap.add_argument('--pages', nargs='+')
    ap.add_argument('--start')
    ap.add_argument('--stop')
    ap.add_argument('--drop', action='append', default=[])
    ap.add_argument('--h2', action='append', default=[])
    ap.add_argument('--h3', action='append', default=[])
    ap.add_argument('--demote', action='store_true')
    ap.add_argument('--number-class', action='append', default=[])
    ap.add_argument('--notes-heading', default='Notas')
    ap.add_argument('--br-paragraphs', action='store_true')
    ap.add_argument('--append', action='store_true')
    ap.add_argument('--edition', default='')
    ap.add_argument('--licence')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    shape = lambda blocks: to_markdown(blocks, drop=args.drop, h2=args.h2, h3=args.h3, br_paragraphs=args.br_paragraphs)
    kind = 'wikisource' if args.wikisource else 'gutenberg' if args.gutenberg else 'tei'
    parts, skipped, url, revision = {'wikisource': from_wikisource, 'gutenberg': from_gutenberg, 'tei': from_tei}[kind](args, shape)
    parts = cut(parts, args.start, args.stop)
    body = '\n\n'.join(parts) + '\n'
    # stray image addresses pasted into a wiki text by an editing accident ("oficialhttp://…png mente")
    body = re.sub(r'https?://\S+?\.(?:png|jpe?g|gif|svg)', '', body)
    for word in sorted(set(w for w in re.findall(r'\S{40,}', body))):
        print(f'check this long word: {word[:80]}', file=sys.stderr)
    if skipped:
        print('dropped as editorial: ' + ', '.join(sorted(skipped)[:30]), file=sys.stderr)
    words = len(re.findall(r'\w+', body))
    if args.dry_run:
        print(body)
        print(f'[{len(parts)} blocks, {words} words, {revision}]', file=sys.stderr)
        return
    path = write_entry(args.id, body, {
        'rights': 'public-domain',
        'sourceEdition': args.edition,
        'sourceUrl': url,
        'sourceRevision': revision,
        'sourceLicence': args.licence or LICENCES[kind],
    }, append=args.append)
    print(f'wrote {path.relative_to(ROOT)}: {len(parts)} blocks, {words} words, from {url}')
    print(f'log it in docs/archive-sources.md: | {args.id} | {url} | {revision} | {args.edition} |')


if __name__ == '__main__':
    main()
