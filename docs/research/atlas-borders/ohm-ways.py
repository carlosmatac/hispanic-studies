import json, sys, urllib.parse, urllib.request, collections
q = "[out:json][timeout:200]; rel(id:%s); way(r); out tags;" % sys.argv[1]
req = urllib.request.Request("https://overpass-api.openhistoricalmap.org/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent":"atlas-feasibility/0.1"})
d = json.load(urllib.request.urlopen(req, timeout=300))
c = collections.Counter()
for e in d['elements']:
    t = e.get('tags', {})
    c[json.dumps({k: v for k, v in t.items() if k in ('source', 'license', 'natural', 'boundary', 'attribution') or k.startswith('source')}, ensure_ascii=False)[:200]] += 1
for k, v in c.most_common(15): print(v, k)
