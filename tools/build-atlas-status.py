#!/usr/bin/env python3
"""Facts for the Atlas's click-for-info popover (issue #104).

Writes site/data/atlas-units.json from sources only:
- for every unit drawn on the globe (the American keyframes in
  site/data/atlas-eras.json and the realms in site/data/atlas-realms.json):
  its OpenHistoricalMap relation's own tags: name, name:en, name:es,
  start_date, end_date, border_type and wikidata (CC0), fetched by
  `rel(id:...); out tags;` from the OHM Overpass API;
- capitals: Wikidata P36 (CC0) of the Wikidata item each relation names, with
  its start and end qualifiers and the capital's English and Spanish labels;
  a capital is shown only for a date that falls within its qualifiers (or
  when the item has a single capital with no dates);
- iso: ISO 3166-1 numeric to alpha-2 codes (Wikidata P299/P297), so the
  globe can name today's country under the pointer in the reader's language
  (Intl.DisplayNames).

    python3 tools/build-atlas-status.py      # cached in tools/.cache/status/

Stdlib only. Nothing here is written by hand; the statuses themselves are
curated in site/data/atlas-status.json.
"""
import json
import pathlib
import re
import subprocess
import sys
import urllib.error
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / 'tools/.cache/status'
OUT = ROOT / 'site/public/data/atlas-units.json'   # fetched by the page on the first click
OVERPASS = 'https://overpass-api.openhistoricalmap.org/api/interpreter'
UA = 'ihs-atlas-status/1.0 (hispanostudies.com; build script)'


def get(url, data=None, accept='application/json'):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': UA, 'Accept': accept})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.URLError as err:
            # some Python installs cannot verify a host's chain that curl (the
            # system's store) can: ask curl instead
            if 'CERTIFICATE_VERIFY_FAILED' in str(err):
                cmd = ['curl', '-s', '-A', UA, '-H', f'Accept: {accept}', url]
                if data:
                    cmd[1:1] = ['--data-binary', data.decode()]
                return json.loads(subprocess.run(cmd, check=True, capture_output=True).stdout)
            if attempt == 4:
                raise
            print(f'  retry: {err}', file=sys.stderr)
            time.sleep(15 * (attempt + 1))
        except Exception as err:
            if attempt == 4:
                raise
            print(f'  retry: {err}', file=sys.stderr)
            time.sleep(15 * (attempt + 1))
    return None


def cached(name, fn):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / name
    if f.exists():
        return json.loads(f.read_text(encoding='utf-8'))
    v = fn()
    f.write_text(json.dumps(v, ensure_ascii=False), encoding='utf-8')
    return v


def year(s):
    m = re.match(r'^(-?)(\d{1,4})(?:-(\d\d))?(?:-(\d\d))?', s or '')
    if not m:
        return None
    y = int(m.group(2)) * (-1 if m.group(1) else 1)
    return round(y + (max(1, int(m.group(3) or 1)) - 1) / 12 + (max(1, int(m.group(4) or 1)) - 1) / 365.25, 3)


def main():
    eras = json.loads((ROOT / 'site/data/atlas-eras.json').read_text(encoding='utf-8'))
    realms = json.loads((ROOT / 'site/data/atlas-realms.json').read_text(encoding='utf-8'))
    ids = sorted({u['ohm'] for e in eras['eras'] for u in e['units'] if 'ohm' in u} | {u['ohm'] for u in realms['units']})

    def fetch_tags():
        out = {}
        for k in range(0, len(ids), 15):
            batch = ids[k:k + 15]
            print(f'tags {k + len(batch)}/{len(ids)}', file=sys.stderr)
            q = '[out:json][timeout:300]; rel(id:%s); out tags;' % ','.join(map(str, batch))
            d = get(OVERPASS, urllib.parse.urlencode({'data': q}).encode())
            for el in d['elements']:
                out[str(el['id'])] = el.get('tags', {})
            time.sleep(2)
        return out
    tags = cached(f'tags-{len(ids)}.json', fetch_tags)

    qids = sorted({t['wikidata'] for t in tags.values() if re.match(r'^Q\d+$', t.get('wikidata', ''))})

    def fetch_capitals():
        caps = {}
        for k in range(0, len(qids), 40):
            batch = qids[k:k + 40]
            print(f'wikidata {k + len(batch)}/{len(qids)}', file=sys.stderr)
            d = get('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(
                {'action': 'wbgetentities', 'ids': '|'.join(batch), 'props': 'claims', 'format': 'json'}))
            for q, ent in d.get('entities', {}).items():
                rows = []
                for c in ent.get('claims', {}).get('P36', []):
                    v = c.get('mainsnak', {}).get('datavalue', {}).get('value', {})
                    if not v.get('id'):
                        continue
                    ql = c.get('qualifiers', {})
                    t0 = ql.get('P580', [{}])[0].get('datavalue', {}).get('value', {}).get('time')
                    t1 = ql.get('P582', [{}])[0].get('datavalue', {}).get('value', {}).get('time')
                    rows.append({'id': v['id'], 'from': year(t0.lstrip('+')) if t0 else None, 'to': year(t1.lstrip('+')) if t1 else None})
                if rows:
                    caps[q] = rows
            time.sleep(1)
        labels = sorted({r['id'] for rs in caps.values() for r in rs})
        names = {}
        for k in range(0, len(labels), 40):
            d = get('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(
                {'action': 'wbgetentities', 'ids': '|'.join(labels[k:k + 40]), 'props': 'labels', 'languages': 'en|es', 'format': 'json'}))
            for q, ent in d.get('entities', {}).items():
                lb = ent.get('labels', {})
                names[q] = {'en': lb.get('en', {}).get('value'), 'es': lb.get('es', {}).get('value') or lb.get('en', {}).get('value')}
        for rs in caps.values():
            for r in rs:
                r['name'] = names.get(r['id'])
        return caps
    capitals = cached(f'capitals-{len(qids)}.json', fetch_capitals)

    def fetch_iso():
        q = 'SELECT ?num ?a2 WHERE { ?c wdt:P299 ?num; wdt:P297 ?a2. }'
        d = get('https://query.wikidata.org/sparql?' + urllib.parse.urlencode({'query': q}), accept='application/sparql-results+json')
        return {b['num']['value']: b['a2']['value'] for b in d['results']['bindings']}
    iso = cached('iso.json', fetch_iso)

    units = {}
    for i in ids:
        t = tags.get(str(i), {})
        units[f'r{i}'] = {k: v for k, v in {
            'ohm': i, 'name': t.get('name'), 'en': t.get('name:en'), 'es': t.get('name:es'),
            'start': t.get('start_date'), 'end': t.get('end_date'), 'type': t.get('border_type'), 'wikidata': t.get('wikidata'),
        }.items() if v}
    caps = {q: [r for r in rs if r.get('name') and r['name'].get('en')] for q, rs in capitals.items() if any(u.get('wikidata') == q for u in units.values())}
    out = {
        'about': 'Built by tools/build-atlas-status.py: each unit\'s OpenHistoricalMap tags (CC0), capitals from Wikidata P36 with their dates (CC0), and ISO 3166-1 numeric to alpha-2 codes (Wikidata). Do not edit by hand.',
        'units': units,
        'capitals': {q: rs for q, rs in caps.items() if rs},
        'iso': dict(sorted(iso.items())),
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(units)} units, {len(out["capitals"])} items with a capital, {len(iso)} ISO codes', file=sys.stderr)


if __name__ == '__main__':
    main()
