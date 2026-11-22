#!/usr/bin/env python3
"""Build the Atlas records (site/data/atlas-records.json) from Beltrán's manuscript.

Source: docs/research/atlas-v3/IHS-Atlas-Expansion-and-Developer-Handoff.md
(16 November 2026), section 6 ("Expansion chronology and map records") and
section 7 (the playback staging queue). Stdlib only:

    py tools/build-atlas-records.py            # writes the JSON and prints the report
    py tools/build-atlas-records.py --report docs/research/atlas-v3/import-report.md

What it does, per the manuscript's import contract (section 5):

- every `#### A<ID> · <date> · <title>` record keeps its four paragraphs, its
  Type / Regions / Map anchor lines, its Wikipedia, Book and Further reading
  links and its Commons plate with the plate's stated role;
- English is the only locale supplied: `es` stays null and is marked pending
  (the site shows the English text and says so; nothing is machine-translated);
- geometry, effective dates and validity intervals stay null: nothing in a
  record draws or unlocks a territory, route or border;
- the "Map anchor" text is geocoded against tools/atlas-gazetteer.json into
  approximate camera anchors (`approx: true`): camera targets only;
- records that expand an existing card keep that card's identity: aliases to
  the sixty milestones ("editorial #N") and to the voyage / border beats;
- A01-A06 and A101 are retired (logged, never reassigned);
- interpretive records (Bueno's thesis) are flagged as interpretation.

The Commons plates' licences are checked separately (tools/fetch-atlas-plates.py)
and merged in from site/data/atlas-plates.json when it exists.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/research/atlas-v3/IHS-Atlas-Expansion-and-Developer-Handoff.md"
GAZ = ROOT / "tools/atlas-gazetteer.json"
PLATES = ROOT / "site/data/atlas-plates.json"
OUT = ROOT / "site/data/atlas-records.json"

RETIRED = ["A01", "A02", "A03", "A04", "A05", "A06", "A101"]

# Regional tracks (the manuscript: "Iberia, islands, Africa, Asia and Oceania
# get their own regional tracks"; the Americas are split north and south).
TRACKS = {
    "iberia": ["iberia", "mediterranean", "western-pyrenees", "north-africa", "east-mediterranean"],
    "islands": ["atlantic", "atlantic-islands", "south-atlantic"],
    "north-america": ["antilles", "florida-gulf", "southwest", "mexican-core", "mexico-north", "california",
                      "northwest", "north-interior", "arctic", "maya", "central-america", "isthmus"],
    "south-america": ["andes", "plata", "brazil-coast", "brazil-interior", "patagonia", "amazon", "paraguay",
                      "chile", "orinoco", "guianas", "pampas", "caribbean-mainland"],
    "africa": ["west-africa", "southeast-africa"],
    "asia": ["indian-ocean", "west-india", "south-china", "japan", "southeast-asia", "philippines", "timor"],
    "oceania": ["pacific", "marianas", "melanesia", "south-pacific"],
    "world": ["iberophone-world", "iberian-world", "science-world", "americas"],
}
TRACK_OF = {r: t for t, rs in TRACKS.items() for r in rs}

# Records that tell the same story as an existing beat of the playback (a
# voyage or a border keyframe): the beat stays the parent and keeps its id and
# deep link; the record becomes its editorial text. Matched by hand on title,
# dates, place and subject (the contract's dry-run step); every pair is in the
# import report for review.
BEAT_ALIASES = {
    "A78": ["columbus-1"],     # the 1492 crossing (its Tordesillas branch stays with era-1494)
    "A99": ["magellan"],       # the linked log of Magellan and Elcano
    "A100": ["legazpi"],       # Urdaneta's return route and the galleon
    "A23": ["era-1535"],       # New Spain's viceregal court (Mendoza, 1535)
    "A27": ["era-1542"],       # the New Laws and Peru's viceroyalty
    "A42": ["era-1739"],       # Bourbon reorganization, New Granada 1717/1723/1739
    "A45": ["era-1750"],       # Madrid 1750, its commissions and the 1761 repeal
    "A57": ["era-1848"],       # Texas, the war and Guadalupe Hidalgo
    "A65": ["era-1898"],       # 1898 and the differentiated Paris settlement
}

# Interpretive layers: shown with the author and a visible label, never as a fact.
INTERPRETATION = {"A138": "Gustavo Bueno"}

PLATE_ROLES = {
    "contextual plate, not a depiction of the event itself": "contextual",
    "associated image or historical object": "associated",
    "image of the site, not of the event date": "site",
}

LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def links(s: str) -> list[dict]:
    return [{"label": a.strip(), "url": b.strip()} for a, b in LINK.findall(s)]


def parse_year(tok: str, bce: bool) -> int | None:
    m = re.search(r"(\d{1,4})", tok)
    if not m:
        return None
    y = int(m.group(1))
    return -y if bce else y


def parse_date(label: str) -> dict:
    """A date label as written ('218–19 BCE', 'c. 722–910', '1530s–1492',
    '1531 tradition; 1648 onward', '1969–present') -> a sort key and an explicit
    era axis. Years are historical years (no year 0); BCE is negative. The
    label is never made more precise than it is."""
    raw = label.strip()
    precision = "range"
    tradition = None
    s = raw
    if "tradition" in s and "onward" in s:
        # the date of transmission governs: sort at the documented date
        a, b = s.split(";", 1)
        tradition = parse_year(a, False)
        s = b.replace("onward", "").strip()
        precision = "documented-from"
    circa = "c." in s
    bce_all = s.endswith("BCE") and "CE" not in s.replace("BCE", "")
    parts = [p.strip() for p in re.split(r"–|—", s)]
    start_tok = parts[0]
    end_tok = parts[1] if len(parts) > 1 else None
    start_bce = "BCE" in start_tok or bce_all
    start = parse_year(start_tok, start_bce)
    end = None
    open_end = False
    if end_tok:
        if "present" in end_tok:
            open_end = True
        else:
            end = parse_year(end_tok, "BCE" in end_tok or (bce_all and "CE" not in end_tok.replace("BCE", "")))
    decade = bool(re.search(r"\d0s", start_tok))
    if precision != "documented-from":
        precision = "circa" if circa else "decade" if decade else "range" if end_tok else "year"
    return {
        "label": raw,
        "start": start,
        "end": end,
        "open": open_end,
        "precision": precision,
        "tradition": tradition,
        "era": "BCE" if (start or 0) < 0 else "CE",
        # sort key: the start, then a small nudge so a decade ('1530s') sorts
        # after a plain year of the same number
        "sort": (start or 0) + (0.5 if decade else 0),
    }


def geocode(anchor: str, regions: list[str], gaz: dict) -> tuple[list[dict], list[str]]:
    places: dict = gaz["places"]
    context: dict = {k: v for k, v in gaz["context"].items() if not k.startswith("_")}
    names = sorted([k for k in places if not k.startswith("_")] + list(context), key=len, reverse=True)
    found: list[tuple[int, str, str]] = []
    taken = [False] * len(anchor)
    for n in names:
        # match a whole name, not inside a longer word; names are matched with
        # the plain part before any parenthesis ('León (Nicaragua)' is chosen by context)
        base = n.split(" (")[0]
        for m in re.finditer(r"(?<![\w])" + re.escape(base) + r"(?![\w])", anchor):
            if any(taken[m.start():m.end()]):
                continue
            key = n
            if base in context:
                ctx = context[base]
                key = next((ctx[r] for r in regions if r in ctx), ctx.get("*", base))
            elif "(" in n:
                continue
            for i in range(m.start(), m.end()):
                taken[i] = True
            found.append((m.start(), base, key))
    found.sort()
    out, seen = [], set()
    for _, base, key in found:
        if key in seen or key not in places:
            continue
        seen.add(key)
        lon, lat = places[key]
        out.append({"name": base, "at": [lon, lat], "approx": True})
    # what was left over: words that named no place we know
    rest = "".join(" " if t else c for c, t in zip(anchor, taken))
    left = [w.strip(" .") for w in re.split(r",|→|;|\band\b|/", rest) if re.search(r"[A-Z]", w.strip())]
    return out, [w for w in left if w]


def camera(anchors: list[dict]) -> dict | None:
    if not anchors:
        return None
    import math
    xs = [math.cos(math.radians(a["at"][1])) * math.cos(math.radians(a["at"][0])) for a in anchors]
    ys = [math.cos(math.radians(a["at"][1])) * math.sin(math.radians(a["at"][0])) for a in anchors]
    zs = [math.sin(math.radians(a["at"][1])) for a in anchors]
    x, y, z = sum(xs) / len(xs), sum(ys) / len(ys), sum(zs) / len(zs)
    lon = math.degrees(math.atan2(y, x))
    lat = math.degrees(math.atan2(z, math.hypot(x, y)))
    # the angular radius that holds every anchor, for the zoom

    def dist(a, b):
        la1, lo1, la2, lo2 = map(math.radians, (a[1], a[0], b[1], b[0]))
        return math.degrees(math.acos(max(-1, min(1, math.sin(la1) * math.sin(la2) + math.cos(la1) * math.cos(la2) * math.cos(lo1 - lo2)))))
    span = max(dist([lon, lat], a["at"]) for a in anchors)
    return {"at": [round(lon, 2), round(lat, 2)], "span": round(max(span, 2.5), 1), "approx": True}


def parse(text: str, gaz: dict) -> list[dict]:
    sec = text.split("### 6. Expansion chronology and map records", 1)[1].split("### 7.", 1)[0]
    blocks = re.split(r"^#### ", sec, flags=re.M)[1:]
    records = []
    for b in blocks:
        lines = b.strip("\n").split("\n")
        head = lines[0].strip()
        m = re.match(r"(A\d+)\s+·\s+(.+?)\s+·\s+(.+)$", head)
        if not m:
            raise SystemExit(f"bad heading: {head}")
        rid, dlabel, title = m.groups()
        body = "\n".join(lines[1:])
        field = lambda name: (re.search(r"^\*\*" + re.escape(name) + r":\*\*\s*(.+?)\s*$", body, flags=re.M) or [None, None])[1]
        typ = field("Type")
        regions = [r.strip() for r in (field("Regions") or "").split(";") if r.strip()]
        anchor = field("Map anchor") or ""
        # paragraphs: the plain blocks between the fields and the links
        chunks = [c.strip() for c in re.split(r"\n\s*\n", body) if c.strip()]
        paras = [c for c in chunks if not c.startswith("**")]
        wiki = field("Wikipedia") or ""
        book = field("Book") or ""
        further = field("Further reading and sources") or ""
        pm = re.search(r"^\*\*Wikimedia Commons \(([^)]+)\):\*\*\s*(.+?)\s*$", body, flags=re.M)
        plate = None
        if pm:
            role_text, rest = pm.groups()
            pl = links(rest)
            if pl:
                url = pl[0]["url"]
                fname = url.split("/wiki/", 1)[1] if "/wiki/" in url else None
                plate = {
                    "role": PLATE_ROLES.get(role_text.strip(), "contextual"),
                    "roleText": role_text.strip(),
                    "caption": pl[0]["label"],
                    "page": url,
                    "file": fname,
                }
        wl = links(wiki)
        anchors, unresolved = geocode(anchor, regions, gaz)
        milestones = sorted({int(n) for n in re.findall(r"editorial #(\d+)", body)})
        date = parse_date(dlabel)
        rec = {
            "id": rid,
            "title": {"en": title.strip(), "es": None},
            "date": date,
            "type": typ,
            "regions": regions,
            "tracks": sorted({TRACK_OF[r] for r in regions if r in TRACK_OF}, key=list(TRACKS).index),
            "anchorText": anchor,
            "anchors": anchors,
            "unresolved": unresolved,
            "camera": camera(anchors),
            "paragraphs": {"en": paras, "es": None},
            "links": {
                "wikipedia": next((l["url"] for l in wl if l["label"].lower().startswith("topic")), wl[0]["url"] if wl else None),
                "wikipediaRefs": [l for l in wl if not l["label"].lower().startswith("topic")],
                "book": (links(book) or [None])[0],
                "further": links(further),
            },
            "plate": plate,
            "aliases": {"milestones": milestones, "beats": BEAT_ALIASES.get(rid, [])},
            "interpretation": INTERPRETATION.get(rid),
            # the contract: unsupplied geometry, effective dates and translations stay null
            "geometry": None,
            "effective": None,
            "translations": {"es": "pending"},
            "sourceStatus": "manuscript-2026-11-16",
        }
        records.append(rec)
    return records


def parse_staging(text: str) -> list[dict]:
    sec = text.split("### 7.", 1)[1].split("### 8.", 1)[0]
    rows = []
    for line in sec.splitlines():
        if not line.startswith("| ") or line.startswith("| Date") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 3:
            continue
        when, step, action = cells
        kind, _, parents = action.partition("/")
        ids = []
        for tok in re.findall(r"A\d+(?:–\d+)?", parents):
            if "–" in tok:
                a, b = tok[1:].split("–")
                ids += [f"A{i:02d}" if i < 100 else f"A{i}" for i in range(int(a), int(b) + 1)]
            else:
                ids.append(tok)
        rows.append({"when": when, "step": step, "kind": kind.strip(), "parents": ids, "parentText": parents.strip(), "status": "staged"})
    return rows


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    gaz = json.loads(GAZ.read_text(encoding="utf-8"))
    records = parse(text, gaz)
    staging = parse_staging(text)
    plates = json.loads(PLATES.read_text(encoding="utf-8")) if PLATES.exists() else {}
    for r in records:
        p = r["plate"]
        if p and p.get("file") in plates:
            p.update(plates[p["file"]])
    ids = [r["id"] for r in records]
    assert len(ids) == len(set(ids)), "duplicate ids"
    assert not set(ids) & set(RETIRED), "a retired id came back"
    records.sort(key=lambda r: (r["date"]["sort"], int(r["id"][1:])))
    out = {
        "about": "Beltrán's Atlas records (manuscript of 16 November 2026), parsed by tools/build-atlas-records.py. English only; Spanish pending. Geometry, effective dates and translations are null unless evidenced. Camera anchors are approximate and never unlock territory.",
        "source": {
            "file": str(SRC.relative_to(ROOT)).replace("\\", "/"),
            "sha256": hashlib.sha256(SRC.read_bytes()).hexdigest(),
            "date": "2026-11-16",
        },
        "retired": RETIRED,
        "tracks": TRACKS,
        "records": records,
        "staging": staging,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    rep = report(records, staging)
    if "--report" in sys.argv:
        Path(ROOT / sys.argv[sys.argv.index("--report") + 1]).write_text(rep, encoding="utf-8")
    sys.stdout.buffer.write(rep.encode("utf-8"))


def report(records: list[dict], staging: list[dict]) -> str:
    n = len(records)
    def count(f):
        return sum(1 for r in records if f(r))
    lines = [
        "# Atlas v3 import report",
        "",
        "Generated by `tools/build-atlas-records.py` from the manuscript of 16 November 2026.",
        "",
        "## Validation",
        "",
        f"- Records parsed: **{n}** (expected 139)",
        f"- Retired and absent from the import: {', '.join(RETIRED)}",
        f"- Four paragraphs: {count(lambda r: len(r['paragraphs']['en']) == 4)} / {n}",
        f"- Type, regions and map anchor lines: {count(lambda r: r['type'] and r['regions'] and r['anchorText'])} / {n}",
        f"- Topic article (Wikipedia): {count(lambda r: r['links']['wikipedia'])} / {n}",
        f"- Book link: {count(lambda r: r['links']['book'])} / {n}",
        f"- Further reading: {count(lambda r: r['links']['further'])} / {n}",
        f"- Commons plate with a stated role: {count(lambda r: r['plate'] and r['plate']['role'])} / {n}",
        f"- Plates checked through the Commons API: {count(lambda r: r['plate'] and r['plate'].get('licence'))} / {n}",
        f"- Plates shipped (free licence, file downloaded): {count(lambda r: r['plate'] and r['plate'].get('src'))} / {n}",
        f"- Spanish text: 0 / {n} (pending; English shown, marked)",
        f"- Geometry or effective dates set: {count(lambda r: r['geometry'] or r['effective'])} / {n} (null by contract)",
        "",
        "## Coverage",
        "",
        f"- Usable camera anchors (at least one place geocoded): **{count(lambda r: r['camera'])} / {n}**",
        f"- Every place in the anchor line geocoded: {count(lambda r: r['camera'] and not r['unresolved'])} / {n}",
        f"- Earliest record: {records[0]['id']} ({records[0]['date']['label']}); latest start: {records[-1]['id']} ({records[-1]['date']['label']})",
        f"- Aliases to the sixty milestones: {count(lambda r: r['aliases']['milestones'])} records",
        f"- Merged into an existing beat (voyage or keyframe): {count(lambda r: r['aliases']['beats'])} records",
        f"- Labelled as interpretation: {', '.join(r['id'] for r in records if r['interpretation'])}",
        f"- Staged child actions (section 7, not playback): {len(staging)}",
        "",
        "### By regional track",
        "",
        "| Track | Records |",
        "|---|---|",
    ]
    for t in TRACKS:
        lines.append(f"| {t} | {count(lambda r, t=t: t in r['tracks'])} |")
    lines += ["", "### Types", "", "| Type | Records |", "|---|---|"]
    types: dict = {}
    for r in records:
        types[r["type"]] = types.get(r["type"], 0) + 1
    for k, v in sorted(types.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines += ["", "## Merges (dry-run manifest)", "", "| Record | Existing card | Title |", "|---|---|---|"]
    for r in records:
        for b in r["aliases"]["beats"]:
            lines.append(f"| {r['id']} | beat `{b}` | {r['title']['en']} |")
        for m in r["aliases"]["milestones"]:
            lines.append(f"| {r['id']} | milestone #{m} | {r['title']['en']} |")
    lines += ["", "## Unresolved anchor text", "", "Phrases in a Map anchor line that name no single place (camera falls back to the places that did resolve).", "", "| Record | Unresolved | Anchors used |", "|---|---|---|"]
    for r in records:
        if r["unresolved"]:
            lines.append(f"| {r['id']} | {'; '.join(r['unresolved'])} | {len(r['anchors'])} |")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
