import json, sys, glob, os
D = sys.argv[1]
def bbox(g):
    xs=[];ys=[]
    def walk(c):
        if isinstance(c[0],(int,float)): xs.append(c[0]); ys.append(c[1]); return
        for k in c: walk(k)
    walk(g['coordinates']); return min(xs),min(ys),max(xs),max(ys)
for f in sorted(glob.glob(os.path.join(D,'world_*.geojson'))):
    j=json.load(open(f))
    print('==', os.path.basename(f), len(j['features']), 'features; props keys', list(j['features'][0]['properties'].keys()))
    for ft in j['features']:
        p=ft['properties']; g=ft['geometry']
        if not g: continue
        b=bbox(g)
        # Americas or Philippines or Iberia
        s=json.dumps(p,ensure_ascii=False)
        if (b[0]<-30 and b[2]<-30) or 'Spa' in s or 'Portug' in s or 'Philipp' in s or 'Castil' in s or 'Viceroy' in s or 'New ' in s:
            if 'Spa' in s or 'Portug' in s or 'Castil' in s or 'Viceroy' in s or 'New ' in s or 'Philipp' in s or 'France' in s or 'Brit' in s or 'Dutch' in s or 'Neth' in s:
                print('  ', {k:v for k,v in p.items() if v}, [round(x) for x in b])
