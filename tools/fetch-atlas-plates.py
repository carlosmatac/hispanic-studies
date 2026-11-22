#!/usr/bin/env python3
"""Check and fetch the Wikimedia Commons plates named in Beltrán's Atlas records.

    py tools/fetch-atlas-plates.py           # query the Commons API, download free files
    py tools/fetch-atlas-plates.py --dry     # query only

For every plate in site/data/atlas-records.json (run tools/build-atlas-records.py
first) it asks the Commons API (imageinfo + extmetadata) for the file's licence,
author, credit line and repository, and records the answer in
site/data/atlas-plates.json, keyed by the file name. A plate is shipped
(downloaded as a 560-pixel thumbnail into site/public/art/atlas/<id>.jpg) only
when its licence is public domain, CC0, CC BY or CC BY-SA; anything else, or a
file the API cannot find, is logged and left out. Every shipped plate is also
listed in assets/art/SOURCES.md (the section between the ATLAS-PLATES markers
is rewritten by this script).

The plates are contextual illustrations, labelled with the role the manuscript
gives them; they are never evidence for a date, a shape or an extent.
"""
from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECORDS = ROOT / "site/data/atlas-records.json"
OUT = ROOT / "site/data/atlas-plates.json"
IMG = ROOT / "site/public/art/atlas"
SOURCES = ROOT / "assets/art/SOURCES.md"
API = "https://commons.wikimedia.org/w/api.php"
UA = "IHS-site-build/1.0 (atlas plate licence check; python urllib)"
WIDTH = 560
FREE = re.compile(r"^(public domain|pd\b|pd-|cc0|cc[- ]by(-sa)?( \d\.\d)?|cc by(-sa)? \d\.\d|no restrictions)", re.I)


def get(url: str) -> bytes:
    """Fetch with curl when it is there (it uses the system's certificate
    store; some Python builds on Windows ship a stale one), else urllib."""
    import shutil
    import subprocess
    for attempt in range(4):
        try:
            if shutil.which("curl"):
                return subprocess.run(["curl", "-sSfL", "-A", UA, url], check=True, capture_output=True, timeout=90).stdout
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if attempt == 3:
                raise
            # upload.wikimedia.org answers 429 to quick runs: back off
            time.sleep(20 * (attempt + 1))
    return b""


def strip(s: str | None) -> str | None:
    if not s:
        return None
    t = html.unescape(re.sub(r"<[^>]+>", "", s))
    return re.sub(r"\s+", " ", t).strip() or None


def ftitle(f: str) -> str:
    """A file page name from the manuscript's URL ('File:A_b%2C_c.jpg') as the API titles it."""
    t = urllib.parse.unquote(f).replace("_", " ")
    return t if t.startswith("File:") else "File:" + t


def query(files: list[str]) -> dict:
    titles = "|".join(ftitle(f) for f in files)
    params = {
        "action": "query", "format": "json", "formatversion": "2", "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size", "iiurlwidth": str(WIDTH), "titles": titles,
        "iiextmetadatafilter": "LicenseShortName|License|LicenseUrl|Artist|Credit|UsageTerms|Copyrighted|AttributionRequired|DateTimeOriginal|ObjectName",
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    norm = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
    out = {}
    for p in data["query"]["pages"]:
        title = norm.get(p["title"], p["title"])
        out[title] = p
    return out


def main() -> None:
    dry = "--dry" in sys.argv
    recs = json.loads(RECORDS.read_text(encoding="utf-8"))["records"]
    plates = {}
    by_file: dict[str, list[str]] = {}
    for r in recs:
        p = r.get("plate")
        if p and p.get("file"):
            by_file.setdefault(p["file"], []).append(r["id"])
    files = list(by_file)
    IMG.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        res = query(chunk)
        for f in chunk:
            title = ftitle(f)
            page = res.get(title)
            entry = {"checked": time.strftime("%Y-%m-%d"), "records": by_file[f]}
            if not page or page.get("missing") or not page.get("imageinfo"):
                entry.update({"licence": None, "status": "not found on Commons"})
                plates[f] = entry
                continue
            ii = page["imageinfo"][0]
            md = {k: strip(v.get("value")) for k, v in ii.get("extmetadata", {}).items()}
            lic = md.get("LicenseShortName") or md.get("UsageTerms")
            entry.update({
                "licence": lic,
                "licenceUrl": md.get("LicenseUrl"),
                "author": md.get("Artist"),
                "credit": md.get("Credit"),
                "repository": "Wikimedia Commons",
                "fileUrl": ii.get("descriptionurl"),
                "mime": ii.get("mime"),
            })
            free = bool(lic and FREE.search(lic.strip()))
            entry["status"] = "free" if free else "not shipped: licence not free"
            thumb = ii.get("thumburl")
            if free and thumb:
                rid = by_file[f][0]
                ext = ".png" if thumb.lower().endswith(".png") else ".jpg"
                dest = IMG / f"{rid.lower()}{ext}"
                if not dry and not dest.exists():
                    try:
                        dest.write_bytes(get(thumb))
                    except Exception:
                        entry["status"] = "free, not shipped: download failed (run again)"
                        plates[f] = entry
                        continue
                    time.sleep(3)
                entry["src"] = f"/art/atlas/{dest.name}"
                entry["width"] = ii.get("thumbwidth")
                entry["height"] = ii.get("thumbheight")
            plates[f] = entry
        time.sleep(1)
    OUT.write_text(json.dumps(plates, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    shipped = {f: e for f, e in plates.items() if e.get("src")}
    print(f"plates: {len(plates)}  free and shipped: {len(shipped)}  not shipped: {len(plates) - len(shipped)}")
    for f, e in plates.items():
        if not e.get("src"):
            print("  -", f, "|", e.get("status"), "|", e.get("licence"))
    if not dry:
        write_sources(recs, plates)


def write_sources(recs: list[dict], plates: dict) -> None:
    title = {r["id"]: r["title"]["en"] for r in recs}
    rows = []
    for f, e in sorted(plates.items(), key=lambda x: int(x[1]["records"][0][1:])):
        if not e.get("src"):
            continue
        ids = ", ".join(e["records"])
        rows.append(f"| `site/public/art/atlas/{Path(e['src']).name}` | {ids}: {title[e['records'][0]]} | [{ftitle(f)[5:]}]({e['fileUrl']}) | {e.get('author') or 'unknown'} | {e['licence']} |")
    block = "\n".join([
        "<!-- ATLAS-PLATES:START (written by tools/fetch-atlas-plates.py; do not edit by hand) -->",
        "",
        "### Atlas v3: the records' contextual plates",
        "",
        "Named in Beltrán's manuscript (`docs/research/atlas-v3/`), one per record; each file's licence, author and repository were checked through the Commons API on the date in `site/data/atlas-plates.json`. They are shown as contextual illustrations with the role the manuscript gives them, never as evidence of a date, a shape or an extent. Thumbnails 560 px wide.",
        "",
        "| File | Record | Commons file | Author | Licence |",
        "|---|---|---|---|---|",
        *rows,
        "",
        "<!-- ATLAS-PLATES:END -->",
    ])
    s = SOURCES.read_text(encoding="utf-8")
    if "<!-- ATLAS-PLATES:START" in s:
        s = re.sub(r"<!-- ATLAS-PLATES:START.*?<!-- ATLAS-PLATES:END -->", lambda _: block, s, flags=re.S)
    else:
        s = s.rstrip("\n") + "\n\n" + block + "\n"
    SOURCES.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    main()
