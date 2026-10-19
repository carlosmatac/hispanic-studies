#!/usr/bin/env python3
"""Build the datasets the o-atlas map and book sections render.

  proposals/shared/data/world-110m.json   trimmed Natural Earth via world-atlas (public domain)
  proposals/shared/data/iberophone.json   country tiers + author counts from the canon corpus
  proposals/shared/data/routes.json       the historical route waypoints drawn over the map
  proposals/shared/data/books.json        De Indiis priority titles, safe fields only

Run from the repo root. Needs world-110m.json already downloaded next to this script, or
pass a path:  python3 tools/build-map-data.py [countries-110m.json]

Natural Earth is public domain (no attribution required; we credit it anyway). world-atlas
is the pre-built TopoJSON of it, pinned to 2.0.2.
"""
import csv, json, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'proposals/shared/data'
CANON = ROOT / 'docs/provided-documentation/Hispanic_Reunification_Canon_data.json'

# --- the Iberophone world ------------------------------------------------------------
# tier follows the distinction on the map Beltran preferred (the "neutral" one):
#   emersa   - Spanish or Portuguese is an official language today
#   submersa - large Iberophone population or historical presence, language not official
# "iso" is the ISO 3166-1 numeric id used by the TopoJSON; "code" joins to region_code
# in the canon corpus.
COUNTRIES = [
    # Spanish official
    ('724', 'ES', 'Spain',               'España',              'emersa', 'eu'),
    ('484', 'MX', 'Mexico',              'México',              'emersa', 'na'),
    ('320', 'GT', 'Guatemala',           'Guatemala',           'emersa', 'na'),
    ('340', 'HN', 'Honduras',            'Honduras',            'emersa', 'na'),
    ('222', 'SV', 'El Salvador',         'El Salvador',         'emersa', 'na'),
    ('558', 'NI', 'Nicaragua',           'Nicaragua',           'emersa', 'na'),
    ('188', 'CR', 'Costa Rica',          'Costa Rica',          'emersa', 'na'),
    ('591', 'PA', 'Panama',              'Panamá',              'emersa', 'na'),
    ('192', 'CU', 'Cuba',                'Cuba',                'emersa', 'ca'),
    ('214', 'DO', 'Dominican Republic',  'República Dominicana','emersa', 'ca'),
    ('630', 'PR', 'Puerto Rico',         'Puerto Rico',         'emersa', 'ca'),
    ('862', 'VE', 'Venezuela',           'Venezuela',           'emersa', 'sa'),
    ('170', 'CO', 'Colombia',            'Colombia',            'emersa', 'sa'),
    ('218', 'EC', 'Ecuador',             'Ecuador',             'emersa', 'sa'),
    ('604', 'PE', 'Peru',                'Perú',                'emersa', 'sa'),
    ('068', 'BO', 'Bolivia',             'Bolivia',             'emersa', 'sa'),
    ('152', 'CL', 'Chile',               'Chile',               'emersa', 'sa'),
    ('032', 'AR', 'Argentina',           'Argentina',           'emersa', 'sa'),
    ('600', 'PY', 'Paraguay',            'Paraguay',            'emersa', 'sa'),
    ('858', 'UY', 'Uruguay',             'Uruguay',             'emersa', 'sa'),
    ('226', 'GQ', 'Equatorial Guinea',   'Guinea Ecuatorial',   'emersa', 'af'),
    # Portuguese official
    ('620', 'PT', 'Portugal',            'Portugal',            'emersa', 'eu'),
    ('076', 'BR', 'Brazil',              'Brasil',              'emersa', 'sa'),
    ('024', 'AO', 'Angola',              'Angola',              'emersa', 'af'),
    ('508', 'MZ', 'Mozambique',          'Mozambique',          'emersa', 'af'),
    ('624', 'GW', 'Guinea-Bissau',       'Guinea-Bisáu',        'emersa', 'af'),
    ('626', 'TL', 'Timor-Leste',         'Timor Oriental',      'emersa', 'as'),
    # language not official, Iberophone population or historical presence
    ('840', 'US', 'United States',       'Estados Unidos',      'submersa', 'na'),
    ('608', 'PH', 'Philippines',         'Filipinas',           'submersa', 'as'),
]

# States and territories too small to read at world scale, or absent from the 110m file.
# A reference atlas marks these with a point and a label, which is also more legible than
# a two-pixel polygon.
POINTS = [
    ('CV',  'Cabo Verde',  'Cabo Verde',  -23.51,  14.93, 'emersa'),
    ('ST',  'Sao Tome and Principe', 'Santo Tomé y Príncipe', 6.73, 0.33, 'emersa'),
    ('MAC', 'Macao',       'Macao',       113.54,  22.20, 'submersa'),
    ('GOA', 'Goa',         'Goa',          73.88,  15.30, 'submersa'),
]

# --- the routes ----------------------------------------------------------------------
# Waypoints only; the page interpolates great circles between them, so the curves are
# projection-correct instead of hand-drawn.
ROUTES = [
    {'id': 'indias', 'name': {'en': 'Flota de Indias', 'es': 'Flota de Indias'},
     'years': '1566-1778', 'ocean': 'atlantic',
     'waypoints': [[-6.00, 37.39], [-15.42, 28.12], [-66.10, 18.47], [-82.38, 23.13], [-96.13, 19.20]],
     'ports': {'en': 'Seville - Canaries - San Juan - Havana - Veracruz',
               'es': 'Sevilla - Canarias - San Juan - La Habana - Veracruz'}},
    {'id': 'manila', 'name': {'en': 'Manila galleon', 'es': 'Galeón de Manila'},
     'years': '1565-1815', 'ocean': 'pacific',
     'waypoints': [[-99.90, 16.85], [-160.00, 13.00], [144.75, 13.44], [120.98, 14.60]],
     'ports': {'en': 'Acapulco - Guam - Manila', 'es': 'Acapulco - Guam - Manila'}},
    {'id': 'tornaviaje', 'name': {'en': 'Tornaviaje', 'es': 'Tornaviaje'},
     'years': 'from 1565', 'ocean': 'pacific',
     'waypoints': [[120.98, 14.60], [140.00, 34.00], [180.00, 39.00], [-150.00, 38.00], [-99.90, 16.85]],
     'ports': {'en': 'Manila - the northern Pacific - Acapulco',
               'es': 'Manila - el Pacífico norte - Acapulco'}},
    {'id': 'india', 'name': {'en': 'Carreira da Índia', 'es': 'Carreira da Índia'},
     'years': '1498-1833', 'ocean': 'atlantic',
     'waypoints': [[-9.14, 38.72], [-23.51, 14.93], [-10.00, -20.00], [18.47, -34.36], [73.88, 15.30]],
     'ports': {'en': 'Lisbon - Cabo Verde - Cape of Good Hope - Goa',
               'es': 'Lisboa - Cabo Verde - Cabo de Buena Esperanza - Goa'}},
    {'id': 'brasil', 'name': {'en': 'Carreira do Brasil', 'es': 'Carreira do Brasil'},
     'years': '1500-1808', 'ocean': 'atlantic',
     'waypoints': [[-9.14, 38.72], [-23.51, 14.93], [-38.50, -12.97]],
     'ports': {'en': 'Lisbon - Cabo Verde - Salvador da Bahia',
               'es': 'Lisboa - Cabo Verde - Salvador de Bahía'}},
    {'id': 'macao', 'name': {'en': 'Goa - Macao', 'es': 'Goa - Macao'},
     'years': '1557-1999', 'ocean': 'pacific',
     'waypoints': [[73.88, 15.30], [100.00, 5.00], [113.54, 22.20]],
     'ports': {'en': 'Goa - Malacca - Macao', 'es': 'Goa - Malaca - Macao'}},
]


def author_counts():
    d = json.loads(CANON.read_text())
    counts = {}
    for a in d['authors']:
        c = (a.get('region_code') or '').strip()
        if c:
            counts[c] = counts.get(c, 0) + 1
    return counts, d


def build_world(src):
    topo = json.loads(pathlib.Path(src).read_text())
    have = {g.get('id') for g in topo['objects']['countries']['geometries']}
    missing = [c[0] for c in COUNTRIES if c[0] not in have]
    if missing:
        print(f'  WARNING ids absent from the TopoJSON: {missing}')
    (OUT / 'world-110m.json').write_text(json.dumps(topo, separators=(',', ':')))
    return len(have)


def build_iberophone(counts):
    rows = []
    for iso, code, en, es, tier, region in COUNTRIES:
        rows.append({'iso': iso, 'code': code, 'name': {'en': en, 'es': es},
                     'tier': tier, 'region': region, 'authors': counts.get(code, 0)})
    pts = [{'code': c, 'name': {'en': en, 'es': es}, 'lon': lon, 'lat': lat,
            'tier': tier, 'authors': counts.get(c, 0)}
           for c, en, es, lon, lat, tier in POINTS]
    doc = {
        'note': 'Tier follows the Iberia Emersa / Iberia Submersa distinction: emersa = Spanish or '
                'Portuguese official today, submersa = Iberophone population or historical presence '
                'without official status. Author counts are from the 267-entry corpus in '
                'Hispanic_Reunification_Canon_data.json, by region_code.',
        'basemap': 'Natural Earth 110m via world-atlas 2.0.2 (public domain)',
        'countries': rows, 'points': pts,
    }
    (OUT / 'iberophone.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
    return len(rows), len(pts)


def build_routes():
    (OUT / 'routes.json').write_text(json.dumps(
        {'note': 'Waypoints only; the page interpolates great circles between them.',
         'routes': ROUTES}, ensure_ascii=False, indent=1) + '\n')
    return len(ROUTES)


def build_books(priority_csv):
    """Priority50 -> books.json. Drops every field that is a planning assumption or names a
    person who has not agreed to anything: introducer/editor leads, market and risk ratings,
    rights columns, decision fields, page counts. See docs/research/provided-documentation.md."""
    rows = list(csv.reader(pathlib.Path(priority_csv).open()))
    hdr = rows[2]
    idx = {name: i for i, name in enumerate(hdr)}
    keep = ('Rank', 'Author', 'Title', 'Source year', 'Language', 'Country / region',
            'Series', 'Suggested English title', 'Text focus')
    books = []
    for r in rows[3:]:
        if not r or not r[idx['Author']].strip():
            continue
        b = {}
        for k in keep:
            v = r[idx[k]].strip() if idx[k] < len(r) else ''
            b[k.split(' /')[0].lower().replace(' ', '_')] = v
        try:
            b['rank'] = int(float(b['rank']))
        except ValueError:
            continue
        b['source_year'] = int(b['source_year']) if b['source_year'].isdigit() else None
        books.append(b)
    books.sort(key=lambda b: b['rank'])
    doc = {
        'note': 'From the Priority50 sheet of panhispanic_paniberian_acquisitions.xlsm. Ranks are '
                'editorial recommendations, NOT commissioning decisions - every decision field in '
                'the source reads Unreviewed and "accepted for commissioning" is 0. Suggested '
                'titles are suggestions. Proposed introducers and editors are deliberately not '
                'included: they are real scholars who have agreed to nothing.',
        'books': books,
    }
    (OUT / 'books.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
    return len(books)


def build_canon(canon):
    """The 50 canonical texts on the Bueno field, plus the band and palette definitions.
    Author `camp` and `position` come along so a card can say what each one argued."""
    by_id = {a['id']: a for a in canon['authors']}
    texts = []
    for t in canon['texts']:
        a = by_id.get(t.get('author_id'), {})
        texts.append({
            'id': t['id'], 'title': t['title'], 'year': t['year'],
            'author': a.get('short_name') or t['author'], 'life': a.get('life_dates', ''),
            'region': a.get('region', ''), 'code': a.get('region_code', ''),
            'bueno': t['bueno_class'], 'unity': t['unity_type'],
            'operations': t.get('operations', []), 'camp': a.get('camp', ''),
            'role': a.get('role', ''),
        })
    texts.sort(key=lambda t: t['year'])
    doc = {
        'note': 'Classification adapted from Gustavo Bueno, "Espana y America" (2001). Inclusion in '
                'the field does not imply an author assented to a Hispanic or Iberophone project: '
                '35 of the 267 are recorded as counter-tradition. See '
                'Hispanic_Reunification_Canon_legend.md.',
        'bands': canon['layout']['bands'],
        'palette': canon['layout']['palette'],
        'classes': canon['bueno_classes'],
        'operations': canon['operations'],
        'corpusTotal': len(canon['authors']),
        'texts': texts,
    }
    (OUT / 'canon.json').write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
    return len(texts)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    counts, canon = author_counts()
    src = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'countries-110m.json')
    n = build_world(src)
    print(f'world-110m.json: {n} countries')
    print('iberophone.json: %d countries, %d point markers' % build_iberophone(counts))
    print(f'routes.json: {build_routes()} routes')
    print(f'canon.json: {build_canon(canon)} canonical texts')
    if len(sys.argv) > 2:
        print(f'books.json: {build_books(sys.argv[2])} titles')
    print(f'corpus: {len(canon["authors"])} authors, {len(canon["texts"])} texts, '
          f'{len(canon["events"])} events, {len(canon["movements"])} movements')
