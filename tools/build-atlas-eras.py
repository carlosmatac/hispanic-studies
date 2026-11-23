#!/usr/bin/env python3
"""Build the Atlas's historical borders, 1492-1898 (issue #71).

Reads the curated keyframes in site/data/atlas-eras.json (each one a dated act
with its source, and the OpenHistoricalMap relations drawn for it), fetches
those relations from OpenHistoricalMap, and writes one shared TopoJSON for the
map: site/public/data/atlas-eras.topo.json.

    python3 tools/build-atlas-eras.py            # fetch what is missing, build
    python3 tools/build-atlas-eras.py --list 1790-10-29 [max_level] [regex]
                                                 # curation aid: the OHM units
                                                 # valid on a day (Americas and
                                                 # the Philippines)

Sources and licences
- Geometry: OpenHistoricalMap contributors, CC0 1.0
  (https://www.openhistoricalmap.org/copyright), fetched from the OHM Overpass
  API by relation id: `[out:json]; rel(id:<ids>); out geom;`. The ids are pinned
  in atlas-eras.json, with the date they were extracted, so a rebuild draws the
  same units; OHM is a live wiki, so a rebuild on a later day may draw them with
  later edits. The raw answers are cached in tools/.cache/ohm/ (not committed).
- Coast: Natural Earth 1:110m (public domain), the plate's own land
  (site/public/data/world-110m.json). Every historical unit is clipped to it,
  so the plate keeps one coastline.
- Hand-drawn lines and claims (tools/atlas-eras-drawn.json) are drawn from the
  treaty texts, not traced from anyone's map; each says what it rests on.
- Not used: HGIS de las Indias (CC BY-NC-SA, reference only), historical-basemaps
  (GPL-3.0, errors in our period).

The only non-stdlib step is mapshaper (simplify, clip, TopoJSON), run through
npx at a pinned version. Stdlib Python otherwise.
"""
import gzip
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'site/data/atlas-eras.json'
DRAWN = ROOT / 'tools/atlas-eras-drawn.json'
WORLD = ROOT / 'site/public/data/world-110m.json'
OUT = ROOT / 'site/public/data/atlas-eras.topo.json'
CACHE = ROOT / 'tools/.cache/ohm'
WORK = ROOT / 'tools/.cache/eras'

OVERPASS = 'https://overpass-api.openhistoricalmap.org/api/interpreter'
UA = 'ihs-atlas-eras/1.0 (hispanostudies.com; build script)'
MAPSHAPER = 'mapshaper@0.6.113'

# Where the map draws history: the Americas and the western Pacific to the
# Philippines (w, s, e, n). Other crowns' holdings outside it are not drawn.
REGIONS = [(-180, -60, -25, 80), (100, -12, 180, 30)]

# Simplification: Visvalingam with a tolerance of about 6 km, then 1e5 grid.
SIMPLIFY = 'interval=6000'


def overpass(query):
    body = urllib.parse.urlencode({'data': query}).encode()
    req = urllib.request.Request(OVERPASS, data=body, headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.load(r)
        except Exception as err:  # the public endpoint rate-limits; back off
            if attempt == 3:
                raise
            print(f'  overpass: {err}; retrying', file=sys.stderr)
            time.sleep(10 * (attempt + 1))
    return None


def fetch(ids):
    """Cache every relation's raw geometry, a few per request."""
    CACHE.mkdir(parents=True, exist_ok=True)
    todo = [i for i in ids if not (CACHE / f'{i}.json').exists()]
    for k in range(0, len(todo), 6):
        batch = todo[k:k + 6]
        print(f'fetching {len(batch)} relations ({k + len(batch)}/{len(todo)})', file=sys.stderr)
        d = overpass('[out:json][timeout:600]; rel(id:%s); out geom;' % ','.join(map(str, batch)))
        got = {e['id']: e for e in d['elements'] if e['type'] == 'relation'}
        for i in batch:
            if i not in got:
                raise SystemExit(f'OHM relation {i} not returned')
            (CACHE / f'{i}.json').write_text(json.dumps(got[i]))


def stitch(ways):
    """Join a relation's member ways into rings (OHM ways share end nodes)."""
    ways = [list(w) for w in ways if len(w) > 1]
    rings = []
    while ways:
        cur = ways.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == cur[-1]:
                    cur += w[1:]
                elif w[-1] == cur[-1]:
                    cur += w[::-1][1:]
                elif w[-1] == cur[0]:
                    cur = w + cur[1:]
                elif w[0] == cur[0]:
                    cur = w[::-1] + cur[1:]
                else:
                    continue
                ways.pop(i)
                changed = True
                break
        rings.append(cur)
    return rings


def inside(pt, ring):
    x, y = pt
    c = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def geometry(rel):
    outer, inner = [], []
    for m in rel.get('members', []):
        if m['type'] != 'way' or 'geometry' not in m:
            continue
        pts = [(round(p['lon'], 5), round(p['lat'], 5)) for p in m['geometry'] if p]
        (inner if m.get('role') == 'inner' else outer).append(pts)
    o = [r for r in stitch(outer) if r[0] == r[-1] and len(r) > 3]
    i = [r for r in stitch(inner) if r[0] == r[-1] and len(r) > 3]
    if not o:
        raise SystemExit(f"OHM relation {rel['id']} ({rel['tags'].get('name')}): no closed outer ring")
    polys = [[r] for r in o]
    for h in i:  # each hole goes to the outer ring that holds it
        for p in polys:
            if inside(h[0], p[0]):
                p.append(h)
                break
    return {'type': 'MultiPolygon', 'coordinates': polys}


def norm(s, end=False):
    m = re.match(r'^(-?\d{1,4})(?:-(\d\d))?(?:-(\d\d))?', (s or '').strip())
    if not m:
        return None
    return '%04d-%s-%s' % (int(m.group(1)), m.group(2) or ('12' if end else '01'),
                           m.group(3) or ('31' if end else '01'))


def list_units(date, max_level=2, rx=None):
    """Curation aid: the administrative units OHM holds as valid on a day."""
    boxes = ''.join(
        f'rel["boundary"="administrative"]["admin_level"~"^[1-{max_level}]$"]({s},{w},{n},{e});'
        for w, s, e, n in REGIONS)
    d = overpass(f'[out:json][timeout:300]; ({boxes}); out tags;')
    rows = []
    for e in d['elements']:
        t = e.get('tags', {})
        s, en = norm(t.get('start_date')), norm(t.get('end_date'), True)
        if not s or s > date or (en and en < date):
            continue
        name = t.get('name', '') + ' | ' + t.get('name:en', '')
        if rx and not re.search(rx, name, re.I):
            continue
        rows.append((t.get('admin_level'), name, e['id'], t.get('start_date'), t.get('end_date')))
    for lvl, name, rid, s, en in sorted(rows):
        print(f'{lvl}  {rid}  {name}  {s} → {en}')


def run(*args):
    # (npx is npx.cmd on Windows)
    cmd = ['npx.cmd' if sys.platform == 'win32' else 'npx', '--yes', MAPSHAPER, *map(str, args)]
    print('  ' + ' '.join(cmd[3:]), file=sys.stderr)
    subprocess.run(cmd, check=True, cwd=ROOT)


def build():
    data = json.loads(DATA.read_text())
    drawn = json.loads(DRAWN.read_text())
    ids = sorted({u['ohm'] for era in data['eras'] for u in era['units'] if 'ohm' in u})
    fetch(ids)

    WORK.mkdir(parents=True, exist_ok=True)
    feats = []
    for i in ids:
        rel = json.loads((CACHE / f'{i}.json').read_text())
        feats.append({'type': 'Feature', 'id': f'r{i}', 'properties': {'id': f'r{i}'},
                      'geometry': geometry(rel)})
    for f in drawn['features']:
        if f['geometry']['type'] in ('Polygon', 'MultiPolygon'):
            feats.append({'type': 'Feature', 'id': f['id'], 'properties': {'id': f['id']},
                          'geometry': f['geometry']})
    units = WORK / 'units.json'
    units.write_text(json.dumps({'type': 'FeatureCollection', 'features': feats}))

    lines = WORK / 'lines.json'
    lines.write_text(json.dumps({'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'id': f['id'], 'properties': {'id': f['id']}, 'geometry': f['geometry']}
        for f in drawn['features'] if f['geometry']['type'] in ('LineString', 'MultiLineString')]}))

    # the clip: the plate's own land, within the regions the map draws history in
    regions = WORK / 'regions.json'
    regions.write_text(json.dumps({'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Polygon', 'coordinates': [[
            [w, s], [e, s], [e, n], [w, n], [w, s]]]}} for w, s, e, n in REGIONS]}))
    clip = WORK / 'clip.json'
    run('-i', WORLD, '-target', 'land', '-clip', regions, '-o', clip, 'format=geojson', 'force')

    tmp = WORK / 'eras.topo.json'
    run('-i', units, lines, 'combine-files', 'id-field=id',
        '-rename-layers', 'units,lines',
        '-simplify', SIMPLIFY, 'keep-shapes', 'target=units',
        '-clip', clip, 'remove-slivers', 'target=units',
        '-filter-slivers', 'min-area=40km2', 'target=units',
        '-filter', '!this.isNull', 'target=units',
        '-o', tmp, 'format=topojson', 'quantization=100000', 'id-field=id', 'target=*', 'force')

    topo = json.loads(tmp.read_text())
    topo['properties'] = {
        'source': 'OpenHistoricalMap contributors (CC0 1.0); coast: Natural Earth 1:110m (public domain)',
        'extracted': data['extracted'],
        'built_by': 'tools/build-atlas-eras.py',
    }
    OUT.write_text(json.dumps(topo, separators=(',', ':')))
    raw = OUT.read_bytes()
    print(f'{OUT.relative_to(ROOT)}: {len(raw) / 1024:.0f} KB, '
          f'{len(gzip.compress(raw, 9)) / 1024:.0f} KB gzipped, {len(feats)} units', file=sys.stderr)

    # every unit an era names must have come through the clip
    have = {g.get('id') for o in topo['objects'].values() for g in o.get('geometries', [])}
    for era in data['eras']:
        for u in era['units']:
            key = f"r{u['ohm']}" if 'ohm' in u else u['drawn']
            if key not in have:
                print(f"  note: {era['year']} {u['f']} ({key}) is empty after the clip", file=sys.stderr)


REALMS = ROOT / 'tools/atlas-realms.json'
REALMS_DATA = ROOT / 'site/data/atlas-realms.json'
REALMS_OUT = ROOT / 'site/public/data/atlas-realms.topo.json'
LAND50 = ROOT / 'site/public/data/land-50m.json'


def year(s, end=False):
    """An OHM date as a decimal year (BCE negative); an open end is 9999."""
    if not s:
        return 9999.0 if end else -9999.0
    m = re.match(r'^(-?)(\d{1,4})(?:-(\d\d))?(?:-(\d\d))?', s.strip())
    if not m:
        return 9999.0 if end else -9999.0
    y = int(m.group(2)) * (-1 if m.group(1) else 1)
    # an end given as a bare year runs to the end of that year (OHM chains
    # write 1194-1212 then 1213-1229)
    if end and not m.group(3):
        return float(y + 1)
    mo, d = int(m.group(3) or 1), int(m.group(4) or 1)
    return round(y + ((mo - 1) * 30.4 + d - 1) / 365.25, 4)


def clip_ring(ring, box):
    """Sutherland-Hodgman: a ring cut to a box (west, south, east, north)."""
    w, s, e, n = box
    edges = [(lambda p: p[0] >= w, lambda a, b: (w, a[1] + (b[1] - a[1]) * (w - a[0]) / (b[0] - a[0]))),
             (lambda p: p[0] <= e, lambda a, b: (e, a[1] + (b[1] - a[1]) * (e - a[0]) / (b[0] - a[0]))),
             (lambda p: p[1] >= s, lambda a, b: (a[0] + (b[0] - a[0]) * (s - a[1]) / (b[1] - a[1]), s)),
             (lambda p: p[1] <= n, lambda a, b: (a[0] + (b[0] - a[0]) * (n - a[1]) / (b[1] - a[1]), n))]
    pts = ring[:-1]
    for inside_, cut in edges:
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside_(cur):
                if not inside_(prev):
                    out.append(cut(prev, cur))
                out.append(cur)
            elif inside_(prev):
                out.append(cut(prev, cur))
        pts = out
        if not pts:
            return None
    return pts + [pts[0]] if len(pts) > 2 else None


def clip_geom(g, box):
    polys = []
    for poly in g['coordinates']:
        outer = clip_ring(poly[0], box)
        if not outer:
            continue
        polys.append([outer] + [r for r in (clip_ring(h, box) for h in poly[1:]) if r])
    return {'type': 'MultiPolygon', 'coordinates': polys} if polys else None


def build_realms():
    """The realms outside the American keyframes (#104): chains of dated OHM
    relations, drawn each between its own dates, in their own TopoJSON."""
    cur = json.loads(REALMS.read_text(encoding='utf-8'))
    items = []
    for ch in cur['chains']:
        for it in ch['ohm']:
            it = it if isinstance(it, dict) else {'id': it}
            items.append((ch['f'], it))
    fetch(sorted({it['id'] for _, it in items}))

    WORK.mkdir(parents=True, exist_ok=True)
    feats, units, skipped = [], [], []
    for f, it in items:
        rel = json.loads((CACHE / f"{it['id']}.json").read_text())
        t = rel.get('tags', {})
        lo, hi = year(t.get('start_date')), year(t.get('end_date'), True)
        # narrowed, never widened
        if 'from' in it:
            lo = max(lo, float(it['from']))
        if 'to' in it:
            hi = min(hi, float(it['to']))
        if hi <= lo:
            skipped.append((it['id'], 'empty span'))
            continue
        try:
            g = geometry(rel)
        except SystemExit as err:
            skipped.append((it['id'], str(err)))
            continue
        if 'clip' in it:
            g = clip_geom(g, it['clip'])
            if not g:
                skipped.append((it['id'], 'nothing left after the clip'))
                continue
        uid = f"r{it['id']}"
        feats.append({'type': 'Feature', 'id': uid, 'properties': {'id': uid}, 'geometry': g})
        units.append({'id': uid, 'f': f, 'ohm': it['id'], 'from': lo, 'to': hi,
                      'name': t.get('name'), 'start': t.get('start_date'), 'end': t.get('end_date')})
    # the forts and enclaves on a coast (Ceuta, Oran, Mazagan, Elmina, Macau…)
    # are smaller than the 1:50m coast can hold: they keep their own outline
    fams = cur['families']
    coastal = [x for x in feats if fams[next(u['f'] for u in units if u['id'] == x['id'])].get('coast', True)]
    own = [x for x in feats if x not in coastal]
    src, src2 = WORK / 'realms.json', WORK / 'realms-own.json'
    src.write_text(json.dumps({'type': 'FeatureCollection', 'features': coastal}))
    src2.write_text(json.dumps({'type': 'FeatureCollection', 'features': own}))
    land = WORK / 'land50.json'
    run('-i', LAND50, '-o', land, 'format=geojson', 'force')
    a, b = WORK / 'realms-a.json', WORK / 'realms-b.json'
    # coast: Natural Earth 1:50m, so the Balearics, the Canaries and the
    # Atlantic islands keep their shapes even where the plate's 110m land has none
    run('-i', src, 'id-field=id',
        '-simplify', 'interval=3500', 'keep-shapes',
        '-clip', land, 'remove-slivers',
        '-filter-slivers', 'min-area=8km2',
        '-filter', '!this.isNull',
        '-o', a, 'format=geojson', 'id-field=id', 'force')
    run('-i', src2, 'id-field=id', '-simplify', 'interval=600', 'keep-shapes',
        '-o', b, 'format=geojson', 'id-field=id', 'force')
    tmp = WORK / 'realms.topo.json'
    run('-i', a, b, 'combine-files', 'id-field=id', '-merge-layers', 'force', 'name=units',
        '-o', tmp, 'format=topojson', 'quantization=100000', 'id-field=id', 'force')
    topo = json.loads(tmp.read_text())
    topo['properties'] = {
        'source': 'OpenHistoricalMap contributors (CC0 1.0), many boundary ways from IGN/CNIG municipal limits (CC BY 4.0); coast: Natural Earth 1:50m (public domain)',
        'built_by': 'tools/build-atlas-eras.py',
    }
    REALMS_OUT.write_text(json.dumps(topo, separators=(',', ':')))
    have = {g.get('id') for o in topo['objects'].values() for g in o.get('geometries', [])}
    for u in units:
        if u['id'] not in have:
            skipped.append((u['ohm'], 'empty after the coast clip'))
    units = [u for u in units if u['id'] in have]
    out = {
        'about': 'Built by tools/build-atlas-eras.py from tools/atlas-realms.json: the realms outside the American keyframes, each unit an OpenHistoricalMap relation drawn between its own dates (decimal years, BCE negative). Do not edit by hand.',
        'source': topo['properties']['source'],
        'extracted': time.strftime('%Y-%m-%d'),
        'gaps': cur['gaps'],
        'families': cur['families'],
        'units': units,
        'skipped': [{'ohm': i, 'why': w} for i, w in skipped],
    }
    REALMS_DATA.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    raw = REALMS_OUT.read_bytes()
    print(f'{REALMS_OUT.relative_to(ROOT)}: {len(raw) / 1024:.0f} KB, '
          f'{len(gzip.compress(raw, 9)) / 1024:.0f} KB gzipped, {len(units)} units', file=sys.stderr)
    for i, w in skipped:
        print(f'  skipped {i}: {w}', file=sys.stderr)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--realms':
        build_realms()
    elif len(sys.argv) > 2 and sys.argv[1] == '--list':
        list_units(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2,
                   sys.argv[4] if len(sys.argv) > 4 else None)
    else:
        build()
        build_realms()
