import json, sys, urllib.parse, urllib.request, time
titles = sys.argv[1:]
for t in titles:
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action":"query","prop":"imageinfo","iiprop":"extmetadata|url|size","format":"json","titles":t})
    req = urllib.request.Request(url, headers={"User-Agent":"atlas-feasibility/0.1 (research; caarlosmatac)"})
    try:
        d = json.load(urllib.request.urlopen(req))
    except Exception as e:
        print(t, 'ERR', e); continue
    for p in d['query']['pages'].values():
        ii=p.get('imageinfo',[{}])[0]; m=ii.get('extmetadata',{})
        g=lambda k:(m.get(k,{}).get('value','') or '').replace('\n',' ')[:160]
        print(p['title'],'|',g('LicenseShortName'),'|',g('Artist'),'|',ii.get('width'),'x',ii.get('height'),'|',ii.get('url'))
    time.sleep(0.5)
