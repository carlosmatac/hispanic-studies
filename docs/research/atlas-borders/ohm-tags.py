import json, sys, urllib.parse, urllib.request
ids = sys.argv[1:]
q = "[out:json][timeout:120]; rel(id:%s); out tags;" % ",".join(ids)
req = urllib.request.Request("https://overpass-api.openhistoricalmap.org/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent":"atlas-feasibility/0.1"})
d = json.load(urllib.request.urlopen(req, timeout=180))
for e in d['elements']:
    t = e['tags']
    keep = {k: v for k, v in t.items() if k.startswith(('source','license','wikidata','note','description','start_date:','end_date:','fixme')) or k in ('name','start_date','end_date')}
    print(e['id'], json.dumps(keep, ensure_ascii=False)[:600])
