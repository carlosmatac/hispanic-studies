"""Fetch OHM relations with geometry and stitch outer/inner rings into GeoJSON."""
import json, sys, urllib.parse, urllib.request, os
out = sys.argv[1]; ids = sys.argv[2:]
q = "[out:json][timeout:300]; rel(id:%s); out geom;" % ",".join(ids)
req = urllib.request.Request("https://overpass-api.openhistoricalmap.org/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent":"atlas-feasibility/0.1"})
raw = urllib.request.urlopen(req, timeout=400).read()
d = json.loads(raw)
feats = []
def stitch(ways):
    ways = [list(w) for w in ways if len(w) > 1]
    rings = []
    while ways:
        cur = ways.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == cur[-1]: cur += w[1:]
                elif w[-1] == cur[-1]: cur += w[::-1][1:]
                elif w[-1] == cur[0]: cur = w + cur[1:]
                elif w[0] == cur[0]: cur = w[::-1] + cur[1:]
                else: continue
                ways.pop(i); changed = True; break
        rings.append(cur)
    return rings
for e in d['elements']:
    outer, inner = [], []
    for m in e.get('members', []):
        if m['type'] != 'way' or 'geometry' not in m: continue
        pts = [(round(p['lon'], 5), round(p['lat'], 5)) for p in m['geometry']]
        (inner if m.get('role') == 'inner' else outer).append(pts)
    o = stitch(outer); i = stitch(inner)
    openr = sum(1 for r in o if r[0] != r[-1])
    npts = sum(len(r) for r in o)
    polys = [[r] for r in o if r[0] == r[-1] and len(r) > 3]
    feats.append({"type": "Feature", "properties": {**e['tags'], "_open_rings": openr, "_points": npts, "_members": len(e.get('members', []))},
                  "geometry": {"type": "MultiPolygon", "coordinates": polys}})
    print(e['id'], e['tags'].get('name'), e['tags'].get('start_date'), e['tags'].get('end_date'), 'members', len(e.get('members', [])), 'rings', len(o), 'open', openr, 'pts', npts)
json.dump({"type": "FeatureCollection", "features": feats}, open(out, 'w'))
print('bytes raw', len(raw), '→', os.path.getsize(out))
