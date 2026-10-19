#!/usr/bin/env python3
"""Build the canon as a graph: nodes, edges and movement territories.

The chart Beltrán commissioned connects things to each other; our first
rendering of it drew the dots and dropped every line. The connections are in
the data — thirty evidence-graded relationship records, each with the
mechanism that justifies it and how confident the compiler was — so this turns
them into an actual graph and keeps the grading on every edge.

Endpoints are written as short names ("Ganivet", "Maeztu / Acción Española"),
so they are resolved against the corpus by name. Ten of the sixty endpoints
are corpora or ideas rather than people ("Vitoria and scholastic corpus"):
those become their own nodes, which is what the legend already calls for.

Writes proposals/shared/data/canon-graph.json.
"""
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/provided-documentation/Hispanic_Reunification_Canon_data.json'
OUT = ROOT / 'proposals/shared/data/canon-graph.json'

EDGE_KIND = {
    'documented reception or direct relation': 'documented',
    'probable or actor-specific': 'probable',
    'polemical opposition': 'opposition',
}

# words that carry no identity and would match half the corpus
STOP = {
    'and', 'the', 'later', 'early', 'corpus', 'tradition', 'school', 'century',
    'twentieth', 'nineteenth', 'generation', 'repertoire', 'problem', 'revivals',
    'international', 'catholic', 'democracy', 'reception', 'network', 'networks',
    'thought', 'press', 'review', 'group', 'circle', 'program', 'programme',
}


def words(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return [w for w in re.split(r'[^a-z]+', s) if len(w) > 3 and w not in STOP]


def build():
    d = json.loads(SRC.read_text())
    authors = {a['id']: a for a in d['authors']}
    texts = d['texts']
    venues = {v['id']: v for v in d['venues']}

    # --- name indexes -------------------------------------------------------
    by_word = {}
    for a in d['authors']:
        for key in (a.get('short_name') or '', a.get('name') or ''):
            for w in words(key):
                by_word.setdefault(w, set()).add(('author', a['id']))
    for v in d['venues']:
        for w in words(v['name']):
            by_word.setdefault(w, set()).add(('venue', v['id']))
    # titles too: several endpoints name a work that is already in the fifty
    # ("Rodó's Ariel", "Darío's El triunfo de Calibán"), and matching them
    # keeps the graph from carrying a second, dateless copy of the same book
    for t in texts:
        for w in words(re.sub(r'\s*\(\d{4}\)\s*$', '', t['title'])):
            by_word.setdefault(w, set()).add(('text', t['id']))

    def resolve(text):
        """The most specific match wins: a word that names one person beats a
        word that names six."""
        best = None
        for w in words(text):
            hits = by_word.get(w)
            if not hits:
                continue
            if best is None or len(hits) < len(best[1]):
                best = (w, hits)
        if not best or len(best[1]) > 2:
            return None
        return sorted(best[1])[0]

    # --- nodes --------------------------------------------------------------
    nodes = {}

    def add(nid, **kw):
        nodes.setdefault(nid, {'id': nid, **kw})
        return nid

    # every canonical text is a node
    text_by_author = {}
    for t in texts:
        nid = f't:{t["id"]}'
        a = authors.get(t.get('author_id'), {})
        add(nid, kind='text', label=re.sub(r'\s*\(\d{4}\)\s*$', '', t['title']),
            year=t['year'], band=t['bueno_class'], unity=t['unity_type'],
            operations=t.get('operations', []),
            author=a.get('short_name') or t['author'],
            region=a.get('region', ''), life=a.get('life_dates', ''),
            role=a.get('role', ''))
        if t.get('author_id'):
            text_by_author.setdefault(t['author_id'], nid)

    def author_node(aid):
        a = authors[aid]
        nid = f'a:{aid}'
        add(nid, kind='author', label=a.get('short_name') or a['name'],
            year=a.get('intervention_year'), band=a.get('primary_bueno_class'),
            life=a.get('life_dates', ''), region=a.get('region', ''),
            camp=a.get('camp', ''), position=a.get('position', ''),
            role=a.get('role', ''), unity=a.get('unity_type', ''),
            operations=a.get('operations', []))
        return nid

    def venue_node(vid):
        v = venues[vid]
        nid = f'v:{vid}'
        add(nid, kind=v['kind'], label=v['name'], year=v.get('year'),
            place=v.get('place_dates', ''), network=v.get('network', ''))
        return nid

    # --- edges --------------------------------------------------------------
    edges = []
    unresolved = []
    for n, r in enumerate(d['relationships']):
        ends = []
        for side in ('from', 'to'):
            hit = resolve(r[side])
            if hit is None:
                nid = f'c:{n}:{side}'
                add(nid, kind='corpus', label=r[side], year=None, band=None)
                unresolved.append(r[side])
            elif hit[0] == 'author':
                nid = author_node(hit[1])
            elif hit[0] == 'text':
                nid = f't:{hit[1]}'
            else:
                nid = venue_node(hit[1])
            ends.append(nid)
        edges.append({
            'id': r['id'], 'source': ends[0], 'target': ends[1],
            'kind': EDGE_KIND.get(r['relation_type'], 'documented'),
            'mechanism': r['evidence_mechanism'],
            'confidence': r['confidence'],
            'control': r['methodological_control'],
        })

    # an author and the text they wrote belong together on the field
    for aid, tnid in text_by_author.items():
        anid = f'a:{aid}'
        if anid in nodes:
            edges.append({'id': f'w:{aid}', 'source': anid, 'target': tnid,
                          'kind': 'wrote', 'mechanism': '', 'confidence': '', 'control': ''})

    doc = {
        'note': 'Thirty evidence-graded relationship records from '
                'Hispanic_Reunification_Canon_data.json, resolved against the corpus by '
                'name. Every edge keeps the compiler\'s own mechanism, confidence and '
                'methodological control: a line here is a claim about evidence, not a '
                'decoration. Endpoints that name a corpus or an idea rather than a person '
                'are their own nodes.',
        'bands': d['layout']['bands'],
        'palette': d['layout']['palette'],
        'ruptures': [e for e in d['chart_events'] if e.get('kind') == 'rupture'],
        'movements': d['movement_visualization'],
        'nodes': list(nodes.values()),
        'edges': edges,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')

    kinds = {}
    for v in nodes.values():
        kinds[v['kind']] = kinds.get(v['kind'], 0) + 1
    ekinds = {}
    for e in edges:
        ekinds[e['kind']] = ekinds.get(e['kind'], 0) + 1
    print(f'{OUT}')
    print('  nodes:', kinds)
    print('  edges:', ekinds)
    print(f'  endpoints kept as corpus nodes: {len(unresolved)}')
    print('  movements:', len(doc['movements']), '| ruptures:', len(doc['ruptures']))


if __name__ == '__main__':
    build()
