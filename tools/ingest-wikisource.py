#!/usr/bin/env python3
"""Put a public-domain text from Wikisource into the archive (issue #68).

    python3 tools/ingest-wikisource.py <id> <page> [options]

Fetches the page through the MediaWiki API (the rendered HTML of one exact
revision), turns it into clean Markdown and writes it as the body of
site/content/archive/<id>.md, which must already exist (its record). It also
records where the text came from, in the file's frontmatter: the permanent link
to the revision, the revision id, the edition and the licence line. Nothing
else in the record is touched.

Before you run it, check by hand that the work is in the public domain and that
the page is the original text: not a modern translation, not an annotated or
abridged edition. Then log the source in docs/archive-sources.md.

Options
  --wiki es.wikisource.org   the wiki (default es.wikisource.org)
  --section TITLE            take only this section of the page (its heading)
  --start TEXT / --stop TEXT keep the text from the paragraph that starts with
                             START, and stop before the one that starts with STOP
  --subpages                 the page is an index of chapters: take every
                             subpage (Page/…) in order, each under a "## " heading
  --edition TEXT             the printed edition the transcription follows
  --licence TEXT             the licence line (a sensible default is used)
  --dry-run                  print the Markdown instead of writing it

Examples (the three first texts, 2026-10-29):
  python3 tools/ingest-wikisource.py T001 "Carta de Jamaica" --section "Copia 2/2: auténtica" \\
      --start "CONTESTACIÓN" --stop "Nota de Vicente Lecuna" --edition "…"
  python3 tools/ingest-wikisource.py T013 "Nuestra América" --edition "…"
  python3 tools/ingest-wikisource.py T018 "Ariel" --subpages --edition "…"

Standard library only. Wikimedia asks API clients for a descriptive
User-Agent and a modest pace: one request at a time, a pause between pages.
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
UA = 'IHS-archive-ingest/1.0 (https://github.com/carlosmatac/hispanic-studies)'
DEFAULT_LICENCE = 'Text in the public domain. Transcription from Wikisource, available under CC BY-SA 4.0.'


def api(wiki, **params):
    params.update(format='json', formatversion='2')
    url = f'https://{wiki}/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if 'error' in data:
        sys.exit(f'{wiki}: {data["error"].get("info")}')
    return data


# ---------------------------------------------------------------- HTML → Markdown

SKIP_TAGS = {'style', 'script', 'table', 'noscript', 'img', 'figure', 'link', 'meta'}
SKIP_CLASSES = {'ws-noexport', 'noprint', 'mw-editsection', 'reference', 'references', 'mw-references-wrap',
                'ambox', 'navbox', 'metadata', 'toc', 'pagenum', 'ws-pagenum', 'mw-empty-elt', 'wst-pagenum'}
SKIP_IDS = {'headertemplate', 'footertemplate', 'toc'}
BLOCKS = {'p', 'div', 'center', 'blockquote', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dd', 'dt', 'section', 'poem'}
VOID = {'br', 'hr', 'img', 'wbr', 'meta', 'link', 'input'}


class ToMarkdown(HTMLParser):
    """Blocks become paragraphs, headings become ## / ###, italics and bold are kept,
    line breaks inside a block become hard breaks, links keep only their text, and
    everything editorial (notices, headers, references, page numbers) is dropped."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []        # (kind, text)
        self.buf = []
        self.skip = 0           # depth inside a skipped element
        self.stack = []         # open tags (only non-void), with their skip flag
        self.heading = None
        self.quote = 0
        self.skipped = set()

    def flush(self):
        text = ''.join(self.buf)
        self.buf = []
        lines = [re.sub(r'[ \t ]+', ' ', l).strip() for l in text.split('\n')]
        lines = [l for l in lines if l]
        if not lines:
            return
        kind = self.heading or ('quote' if self.quote else 'p')
        self.blocks.append((kind, lines))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = set((a.get('class') or '').split())
        skip = tag in SKIP_TAGS or bool(classes & SKIP_CLASSES) or a.get('id') in SKIP_IDS \
            or (a.get('style') or '').replace(' ', '').find('display:none') >= 0
        if tag in VOID:
            if tag == 'br' and not self.skip:
                self.buf.append('\n')
            return
        if skip and not self.skip:
            self.skipped.add(tag + ('.' + '.'.join(sorted(classes)) if classes else '') + ('#' + a['id'] if a.get('id') else ''))
        self.stack.append((tag, skip))
        if skip:
            self.skip += 1
            return
        if self.skip:
            return
        if tag in BLOCKS:
            self.flush()
            if re.fullmatch(r'h[1-6]', tag):
                self.heading = 'h2' if tag in ('h1', 'h2') else 'h3'
            if tag == 'blockquote':
                self.quote += 1
        elif tag in ('i', 'em', 'cite'):
            self.buf.append('\x01')
        elif tag in ('b', 'strong'):
            self.buf.append('\x02')

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        # close up to the matching tag (HTML from MediaWiki is well formed, but be safe)
        while self.stack:
            t, skip = self.stack.pop()
            if skip:
                self.skip -= 1
            elif not self.skip:
                if t in BLOCKS:
                    self.flush()
                    if re.fullmatch(r'h[1-6]', t):
                        self.heading = None
                    if t == 'blockquote':
                        self.quote -= 1
                elif t in ('i', 'em', 'cite'):
                    self.buf.append('\x01')
                elif t in ('b', 'strong'):
                    self.buf.append('\x02')
            if t == tag:
                break

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data.replace('\n', ' '))

    def close(self):
        super().close()
        self.flush()


def escape(text):
    """Escape what Markdown or Markdoc would read as markup."""
    text = text.replace('\\', '\\\\')
    text = re.sub(r'([*_`\[\]<>{}])', r'\\\1', text)
    return text


def inline(text):
    text = escape(text)
    # \x01 … \x01 → _…_, \x02 … \x02 → **…**; drop empty or unbalanced pairs
    for mark, md in (('\x01', '_'), ('\x02', '**')):
        parts = text.split(mark)
        if len(parts) % 2 == 0:  # unbalanced: drop the marks
            text = ''.join(parts)
            continue
        out = []
        for i, p in enumerate(parts):
            if i % 2 == 1 and p.strip():
                lead = p[:len(p) - len(p.lstrip())]
                trail = p[len(p.rstrip()):]
                out.append(f'{lead}{md}{p.strip()}{md}{trail}')
            else:
                out.append(p)
        text = ''.join(out)
    return text


def block_start(line):
    # a paragraph that starts like a list item, a heading or a quote is escaped
    line = re.sub(r'^(\d+)([.)])(\s)', r'\1\\\2\3', line)
    return re.sub(r'^([#>+\-=])', r'\\\1', line)


def to_markdown(fragment):
    p = ToMarkdown()
    p.feed(fragment)
    p.close()
    out = []
    for kind, lines in p.blocks:
        lines = [inline(l) for l in lines]
        lines = [l for l in lines if l.strip()]
        if not lines:
            continue
        if kind in ('h2', 'h3'):
            title = re.sub(r'[\\*_]', '', ' '.join(lines)).strip().rstrip('.')
            out.append(('#' if kind == 'h2' else '##') + '# ' + title)
        else:
            body = ' \\\n'.join(block_start(l) if i == 0 else l for i, l in enumerate(lines))
            out.append(('> ' + body.replace('\n', '\n> ')) if kind == 'quote' else body)
    return out, p.skipped


# ---------------------------------------------------------------- pages

def fetch(wiki, page, section_title=None):
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


def subpages(wiki, page):
    """The chapters, in the order the index page links them."""
    d = api(wiki, action='parse', page=page, prop='links')['parse']
    titles = [l['title'] for l in d['links'] if l['ns'] == 0 and l['title'].startswith(page + '/') and l.get('exists', True)]
    seen, ordered = set(), []
    for t in titles:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    if not ordered:
        sys.exit(f'{page}: no subpages linked')
    return ordered


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


def permalink(wiki, title, revid):
    return f'https://{wiki}/w/index.php?' + urllib.parse.urlencode({'title': title.replace(' ', '_'), 'oldid': revid})


# ---------------------------------------------------------------- the content file

def set_key(front, key, value):
    """Replace (or add) one top-level key of the YAML frontmatter, value as a JSON string."""
    line = f'{key}: {json.dumps(value, ensure_ascii=False)}'
    pattern = re.compile(rf'^{re.escape(key)}:.*(?:\n[ \t]+.*)*', re.M)
    if pattern.search(front):
        return pattern.sub(lambda _: line, front, count=1)
    return front.rstrip('\n') + '\n' + line + '\n'


def write_entry(entry_id, body, fields):
    path = ARCHIVE / f'{entry_id}.md'
    if not path.exists():
        sys.exit(f'{path.relative_to(ROOT)} does not exist: create the record first (in the CMS or by hand)')
    raw = path.read_text()
    m = re.match(r'^---\n(.*?\n)---\n?', raw, re.S)
    if not m:
        sys.exit(f'{path.relative_to(ROOT)}: no frontmatter')
    front = m.group(1)
    for k, v in fields.items():
        if v:
            front = set_key(front, k, v)
    path.write_text(f'---\n{front}---\n{body}')
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('id')
    ap.add_argument('page')
    ap.add_argument('--wiki', default='es.wikisource.org')
    ap.add_argument('--section')
    ap.add_argument('--start')
    ap.add_argument('--stop')
    ap.add_argument('--subpages', action='store_true')
    ap.add_argument('--edition', default='')
    ap.add_argument('--licence', default=DEFAULT_LICENCE)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    parts, revisions, skipped = [], [], set()
    if args.subpages:
        for i, title in enumerate(subpages(args.wiki, args.page)):
            time.sleep(1)
            d = fetch(args.wiki, title)
            paras, sk = to_markdown(d['text'])
            skipped |= sk
            heading = title.split('/')[-1]
            # the chapter's own heading, if the page starts with one, gives way to ours
            if paras and paras[0].startswith('## ') and paras[0][3:].strip().lower() == heading.lower():
                paras = paras[1:]
            parts += [f'## {heading}'] + paras
            revisions.append(f'{title}@{d["revid"]}')
            print(f'  {title}: revision {d["revid"]}, {len(paras)} paragraphs', file=sys.stderr)
        url = f'https://{args.wiki}/wiki/' + urllib.parse.quote(args.page.replace(' ', '_'))
        revision = '; '.join(revisions)
    else:
        d = fetch(args.wiki, args.page, args.section)
        parts, skipped = to_markdown(d['text'])
        url = permalink(args.wiki, d['title'], d['revid'])
        revision = str(d['revid'])
        if args.section:
            revision += f' (section "{args.section}")'
    parts = cut(parts, args.start, args.stop)
    body = '\n\n'.join(parts) + '\n'

    if skipped:
        print('dropped as editorial: ' + ', '.join(sorted(skipped)), file=sys.stderr)
    words = len(re.findall(r'\w+', body))
    if args.dry_run:
        print(body)
        print(f'[{words} words, revision {revision}]', file=sys.stderr)
        return
    path = write_entry(args.id, body, {
        'rights': 'public-domain',
        'sourceEdition': args.edition,
        'sourceUrl': url,
        'sourceRevision': revision,
        'sourceLicence': args.licence,
    })
    print(f'wrote {path.relative_to(ROOT)}: {len(parts)} blocks, {words} words, from {url}')
    print(f'log it in docs/archive-sources.md: | {args.id} | {args.page} | {args.wiki} | {revision} | {args.edition} |')


if __name__ == '__main__':
    main()
