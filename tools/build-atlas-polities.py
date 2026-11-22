#!/usr/bin/env python3
"""The world's polities for the Atlas globe, from Cliopatria (Seshat).

    curl -sL -o /tmp/cliopatria.geojson.zip https://github.com/Seshat-Global-History-Databank/cliopatria/raw/main/cliopatria.geojson.zip
    py tools/build-atlas-polities.py /tmp/cliopatria.geojson.zip

Cliopatria v0.2.1 (Seshat Global History Databank; CC BY 4.0,
https://github.com/Seshat-Global-History-Databank/cliopatria, Zenodo
10.5281/zenodo.13363121) maps ~1,600 polities from 3400 BCE to 2024 CE, one
row per polity and span of years. This script keeps what the Atlas can show
(218 BCE to 2024) and makes it light enough for a phone:

- snapshot years: every 50 years to 1000, every 25 to 1800, every 20 after,
  plus the year every stop of the Atlas begins (records, voyages, keyframes): only rows in force at
  one of them are kept, and the globe shows, for any year, the rows in force
  at the last snapshot at or before it;
- relations (names in parentheses: personal unions, alliances) are left out,
  so no territory is filled twice;
- each polygon is simplified (Douglas-Peucker, ~0.1 degrees), rings smaller
  than a few pixels at full zoom dropped, holes dropped, and coordinates
  quantized to 0.01 degrees and delta-encoded;
- each row gets a label point (the centroid of its largest ring) and a colour
  key: Castile, León and Spain burgundy, Portugal leather, Aragon a second
  burgundy, everyone else one of the map palette's hues by a stable hash.

Changes from the original (as CC BY asks us to say): simplified, quantized,
relations removed, time-sampled, split by period. Output:
site/public/data/atlas-polities/ (index.json and one file per period).
Stdlib only.
"""
from __future__ import annotations

import hashlib
import io
import json
import math
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "site/public/data/atlas-polities"
TOL = 0.1           # degrees, Douglas-Peucker
Q = 100             # quantization: 1/100 of a degree
MIN_AREA = 0.04     # square degrees: smaller rings are dropped (a few pixels on a phone)
PALETTE = 16        # hues of the map palette (lib/atlas-globe.ts, POLITY)


def stop_years() -> set[int]:
    ys: set[int] = set()
    recs = json.loads((ROOT / "site/data/atlas-records.json").read_text(encoding="utf-8"))["records"]
    for r in recs:
        if r["date"]["start"] is not None:
            ys.add(int(math.floor(r["date"]["sort"])))
    for v in json.loads((ROOT / "site/data/atlas-voyages.json").read_text(encoding="utf-8"))["voyages"]:
        ys.add(int(next(w["date"] for w in v["route"] if w.get("date"))[:4]))
    for e in json.loads((ROOT / "site/data/atlas-eras.json").read_text(encoding="utf-8"))["eras"]:
        ys.add(int(e["date"][:4]))
        ys.add(int(e["year"]))
    return ys


def dp(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    """Douglas-Peucker on an open polyline (iterative)."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        n = math.hypot(dx, dy) or 1e-12
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / n if (dx or dy) else math.hypot(px - ax, py - ay)
            if d > best:
                best, idx = d, i
        if best > tol and idx > 0:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, k in zip(pts, keep) if k]


def shoelace(r: list[tuple[float, float]]) -> float:
    s = 0.0
    for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
        s += x0 * y1 - x1 * y0
    return s / 2


def colour_key(name: str) -> str | int:
    n = name.lower()
    if any(k in n for k in ("castil", "spain", "spanish", "león", "leon", "asturias")):
        return "es"
    if "portug" in n or "portucal" in n:
        return "pt"
    if "aragon" in n:
        return "es2"
    return int(hashlib.md5(name.encode("utf-8")).hexdigest(), 16) % PALETTE


def encode(ring: list[tuple[float, float]]) -> list[int]:
    out: list[int] = []
    px = py = 0
    for x, y in ring:
        qx, qy = round(x * Q), round(y * Q)
        out += [qx - px, qy - py]
        px, py = qx, qy
    return out


def main() -> None:
    src = Path(sys.argv[1])
    with zipfile.ZipFile(src) as z:
        name = [n for n in z.namelist() if n.endswith(".geojson")][0]
        data = json.load(io.TextIOWrapper(z.open(name), encoding="utf-8"))
    years = sorted(set(range(-200, 1000, 50)) | set(range(1000, 1800, 25)) | set(range(1800, 2021, 20)) | {-218, 2024} | {y for y in stop_years() if -218 <= y <= 2024})
    rows = []
    kept_pts = 0
    for f in data["features"]:
        p = f["properties"]
        if p["Name"].startswith("(") or p.get("Type", "POLITY") != "POLITY":
            continue
        a, b = int(p["FromYear"]), int(p["ToYear"])
        if b < -218 or not any(a <= y <= b for y in years):
            continue
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        rings = []
        for poly in polys:
            ext = [(float(x), float(y)) for x, y, *_ in poly[0]]
            if ext and ext[0] == ext[-1]:
                ext = ext[:-1]
            if len(ext) < 3 or abs(shoelace(ext)) < MIN_AREA:
                continue
            s = dp(ext + [ext[0]], TOL)[:-1]
            if len(s) < 3 or abs(shoelace(s)) < MIN_AREA:
                continue
            # d3-geo wants exterior rings clockwise (with latitude up)
            if shoelace(s) > 0:
                s.reverse()
            rings.append(s)
        if not rings:
            continue
        big = max(rings, key=lambda r: abs(shoelace(r)))
        cx = sum(x for x, _ in big) / len(big)
        cy = sum(y for _, y in big) / len(big)
        kept_pts += sum(len(r) for r in rings)
        rows.append({
            "n": p["Name"], "f": a, "t": b, "a": round(float(p.get("Area") or 0)),
            "w": p.get("Wikipedia") or None, "k": colour_key(p["Name"]),
            "l": [round(cx, 2), round(cy, 2)],
            "g": [encode(r) for r in rings],
        })
    rows.sort(key=lambda r: (r["f"], r["n"]))
    # chunks by period, so the globe fetches only the centuries it shows
    edges = [-218, 0, 500, 1000, 1200, 1400, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900, 1950, 2025]
    OUTDIR.mkdir(parents=True, exist_ok=True)
    for old in OUTDIR.glob("*.json"):
        old.unlink()
    chunks = []
    total = 0
    for lo, hi in zip(edges, edges[1:]):
        ys = [y for y in years if lo <= y < hi]
        if not ys:
            continue
        rs = [r for r in rows if any(r["f"] <= y <= r["t"] for y in ys)]
        name = f"{lo}_{hi - 1}.json"
        (OUTDIR / name).write_text(json.dumps({"years": ys, "polities": rs}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        size = (OUTDIR / name).stat().st_size
        total += size
        chunks.append({"from": lo, "to": hi - 1, "file": name, "rows": len(rs), "bytes": size})
    index = {
        "about": "World polities for the Atlas globe, sampled from Cliopatria v0.2.1 (Seshat Global History Databank), CC BY 4.0. Changes: time-sampled to the snapshot years, relations removed, polygons simplified (~0.1°), holes dropped, coordinates quantized to 0.01° and delta-encoded, split by period. Built by tools/build-atlas-polities.py.",
        "source": {"name": "Cliopatria", "version": "0.2.1", "by": "Seshat Global History Databank", "licence": "CC BY 4.0", "licenceUrl": "https://creativecommons.org/licenses/by/4.0/", "url": "https://github.com/Seshat-Global-History-Databank/cliopatria", "doi": "10.1038/s41597-025-04516-9"},
        "q": Q,
        "chunks": chunks,
    }
    (OUTDIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"snapshots {len(years)}  rows {len(rows)}  points {kept_pts}  chunks {len(chunks)}  bytes {total}")
    for c in chunks:
        print(f"  {c['file']:>14}  rows {c['rows']:>5}  {c['bytes'] // 1024} KB")

if __name__ == "__main__":
    main()
