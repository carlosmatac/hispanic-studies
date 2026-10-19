#!/usr/bin/env python3
"""Extract the 60 bilingual milestones from Beltran's Brief_History_of_Iberofonia PDF.

Needs `pdftotext -layout` (poppler-utils). Writes proposals/shared/data/milestones.json.
Each milestone keeps its own MAP directive: the PDF is a cartographic storyboard, and
those directives are what the /atlas frames render. See docs/research/cartography.md.

The bracketed keys after each MAP directive ([A1], [B30], ...) are the document's own
bibliography keys, NOT Bueno classes - they resolve to UNESCO, Library of Congress, US
National Archives, BNE, RAE, OAS, SEGIB and CPLP records. They are parsed and attached
so every map frame can cite its source.

Usage:  pdftotext -layout docs/provided-documentation/Brief_History_of_Iberofonia_60_Milestones_Bilingual.pdf /tmp/ib.txt
        python3 tools/build-milestones.py /tmp/ib.txt
"""
import json, re, sys, pathlib

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ib.txt'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'proposals/shared/data/milestones.json'

# Chapter headings, in order, as they appear in each language run.
CHAPTERS_EN = [
    'Foundations of two Iberian worlds', 'Oceanic routes and world systems',
    'Separation, reform and new sovereignties', 'Congresses, federations and shared names',
    'Literary generations and rival programs', 'State networks and continental diplomacy',
    'Institutions and Iberofonía today',
]
CHAPTERS_ES = [
    'Fundamentos de dos mundos ibéricos', 'Rutas oceánicas y sistemas mundiales',
    'Separación, reforma y nuevas soberanías', 'Congresos, federaciones y nombres comunes',
    'Generaciones literarias y programas rivales', 'Redes estatales y diplomacia continental',
    'Instituciones e Iberofonía hoy',
]


def load(path):
    txt = pathlib.Path(path).read_text().replace('\x0c', '')
    return re.sub(r'\nIBEROFON[ÍI]A •[^\n]*\n', '\n', txt).split('\n')


def parse(lines, chapters, map_kw, stop_re):
    hdr = re.compile(r'^\s{2}(\d{2}) ([^|]+?) \| (.+?)\s*$')
    marks = [(i, m.group(1), m.group(2).strip(), m.group(3).strip())
             for i, l in enumerate(lines) if (m := hdr.match(l))]
    marks = marks[:60]
    chap_at = {}
    for ci, name in enumerate(chapters):
        for i, l in enumerate(lines):
            if l.strip() == name:
                chap_at[i] = ci
                break

    out = []
    for n, (i, num, datelabel, title) in enumerate(marks):
        end = marks[n + 1][0] if n + 1 < len(marks) else len(lines)
        block = []
        for l in lines[i + 1:end]:
            # the milestone run is followed by the book-profile section; stop there
            if re.match(stop_re, l):
                break
            block.append(l)
        body, directive, tags = [], '', []
        for l in block:
            s = l.strip()
            if not s or s in chapters:
                continue
            if re.match(r'^(A|B|C)\d{1,2} ', s):
                break                          # ran into the bibliography
            if s.startswith(map_kw + ' '):
                directive = s[len(map_kw) + 1:].strip()
                if (m := re.search(r'\[([A-Z0-9., ]+)\]\s*$', directive)):
                    tags = [t.strip() for t in m.group(1).split(',') if t.strip()]
                    directive = directive[:m.start()].strip()
            elif directive:
                directive += ' ' + s          # wrapped MAP line
            else:
                body.append(s)
        # which chapter is this milestone in
        chapter = 0
        for ci_line, ci in sorted(chap_at.items()):
            if ci_line < i:
                chapter = ci
        if (m := re.search(r'\[([A-Z0-9., ]+)\]', directive)):
            tags = [t.strip() for t in m.group(1).split(',') if t.strip()]
            directive = (directive[:m.start()] + ' ' + directive[m.end():]).strip()
        out.append({
            'n': int(num), 'date': datelabel, 'title': title,
            'body': ' '.join(body), 'map': directive, 'sources': tags, 'chapter': chapter,
        })
    return out


def year_of(datelabel):
    """First 3-4 digit year in the label; 'c. 722' -> 722, '1230-1249' -> 1230."""
    m = re.search(r'(\d{3,4})', datelabel)
    return int(m.group(1)) if m else None


def parse_sources(lines):
    """A1..A20, B1..B30, C1..C3 - bilingual, split on ' / '. Entries wrap over lines."""
    out, key = {}, None
    start = re.compile(r'^\s{2}((?:A|B|C)\d{1,2}) (.+)$')
    for l in lines:
        if (m := start.match(l)):
            key = m.group(1)
            out[key] = m.group(2).strip()
        elif key and l.startswith('   ') and l.strip() and not l.strip().startswith('IBEROFON'):
            out[key] += ' ' + l.strip()
        elif not l.strip():
            key = None
    refs = {}
    for k, v in out.items():
        v = re.sub(r'\s+', ' ', v).strip()
        en_es = v.split(' / ', 1)
        refs[k] = {'en': en_es[0].strip(), 'es': (en_es[1] if len(en_es) > 1 else en_es[0]).strip()}
    return refs


lines = load(SRC)
en = parse(lines, CHAPTERS_EN, 'MAP', r'^\s{2}(Ten books|Sources)')
# the Spanish run starts after the English one ends
es_start = next(i for i, l in enumerate(lines) if l.strip() == CHAPTERS_ES[0])
es = parse(lines[es_start - 8:], CHAPTERS_ES, 'MAPA', r'^\s{2}(Diez libros|Fuentes)')

assert len(en) == 60 and len(es) == 60, (len(en), len(es))

milestones = []
for a, b in zip(en, es):
    assert a['n'] == b['n'], (a['n'], b['n'])
    milestones.append({
        'n': a['n'],
        'year': year_of(a['date']),
        'date': {'en': a['date'], 'es': b['date']},
        'title': {'en': a['title'], 'es': b['title']},
        'body': {'en': a['body'], 'es': b['body']},
        'map': {'en': a['map'], 'es': b['map']},
        'sources': a['sources'] or b['sources'],
        'chapter': a['chapter'],
    })

doc = {
    'source': 'Brief_History_of_Iberofonia_60_Milestones_Bilingual.pdf (provided by Beltran Arellanes)',
    'note': 'Bueno-class tags and MAP directives are the document\'s own. Proposals are labelled as '
            'proposals and never drawn as completed political unions.',
    'chapters': [{'en': a, 'es': b} for a, b in zip(CHAPTERS_EN, CHAPTERS_ES)],
    'references': parse_sources(lines),
    'milestones': milestones,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
print(f'{OUT}: {len(milestones)} milestones, {len(doc["chapters"])} chapters, '
      f'{len(doc["references"])} references')
missing = [m['n'] for m in milestones if not m['sources']]
if missing:
    print(f'  milestones with no source key: {missing}')
