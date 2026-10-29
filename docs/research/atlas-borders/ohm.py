import json, sys, urllib.parse, urllib.request
q = sys.argv[1]
url = "https://overpass-api.openhistoricalmap.org/api/interpreter"
data = urllib.parse.urlencode({"data": q}).encode()
req = urllib.request.Request(url, data=data, headers={"User-Agent":"atlas-feasibility/0.1"})
d = json.load(urllib.request.urlopen(req, timeout=180))
for e in d['elements']:
    t = e.get('tags', {})
    print(e['type'], e['id'], '|', t.get('name'), '|', t.get('name:en'), '|', t.get('start_date'), '→', t.get('end_date'), '|', t.get('boundary'), t.get('admin_level'), '| members:', len(e.get('members', [])))
