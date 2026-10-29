# tools

One-off conversion scripts. They read the documents Beltrán handed over in
`docs/provided-documentation/` and write the datasets the pages load from
`proposals/shared/data/`. **The committed output is what the site uses**; these
scripts exist so the conversion is reproducible and auditable, not as a build
step. Nothing here runs at page load, and there is no npm (see AGENTS.md).

```bash
# the 60 bilingual milestones, with their MAP directives and source keys
pdftotext -layout \
  docs/provided-documentation/Brief_History_of_Iberofonia_60_Milestones_Bilingual.pdf /tmp/ib.txt
python3 tools/build-milestones.py /tmp/ib.txt

# the map base, the Iberophone country list, the routes, the canon and the books
curl -sL https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json -o /tmp/countries-110m.json
python3 tools/build-map-data.py /tmp/countries-110m.json /tmp/Priority50.csv
```

`Priority50.csv` is the `Priority50` sheet of `panhispanic_paniberian_acquisitions.xlsm`
exported to CSV. `build-map-data.py` runs without it and simply skips `books.json`.

## The Atlas's historical borders (`build-atlas-eras.py`)

```bash
python3 tools/build-atlas-eras.py                   # fetch the pinned OHM relations, build the TopoJSON
python3 tools/build-atlas-eras.py --list 1790-10-29 # curation aid: OHM units valid on a day
```

Reads the keyframes in `site/data/atlas-eras.json` (each with its OpenHistoricalMap
relation ids) and `tools/atlas-eras-drawn.json`, fetches the relations from the OHM
Overpass API (cached in `tools/.cache/`, not committed), clips them to the plate's
Natural Earth coast and writes `site/public/data/atlas-eras.topo.json`. Needs network
and `npx` (it runs `mapshaper@0.6.113`); everything else is stdlib.

## The Atlas's finer coast (`site/public/data/land-50m.json`)

Natural Earth 1:50m land from `world-atlas@2.0.2`, thinned for the page (issue #71):

```bash
curl -sL -o land-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json
npx --yes mapshaper@0.6.113 land-50m.json -simplify 25% keep-shapes -filter-islands min-area=40km2   -o format=topojson quantization=1e5 site/public/data/land-50m.json
```

Simplification can leave a ring with no area, which d3 would read as the whole
sphere; `lib/atlas-engine.ts` (`rewind`) drops such rings when it loads the file.
The voyages (`site/data/atlas-voyages.json`) are edited by hand; their sources
are in `docs/research/atlas-voyages.md`.

## The archive (`site/content/archive/`)

The archive's files are the source of truth (edited by hand or in the CMS,
`docs/cms.md`). Two scripts feed them:

```bash
# once, on 2026-10-29: the compiler's fifty works (+ the prelude) as content files;
# it never overwrites an existing file unless asked (--force T012, or --force all)
python3 tools/migrate-canon-to-archive.py

# the rights research (docs/research/archive-rights/) into the records: verdicts,
# links, corrections, the prelude (Node, uses site/node_modules/js-yaml)
node tools/apply-archive-research.mjs

# a public-domain text into a work's file (body + source fields); every command
# used so far is in docs/archive-sources.md
python3 tools/ingest-text.py T013 --wikisource "Nuestra América" --edition "…"
python3 tools/ingest-text.py T018 --gutenberg 22899 --number-class top --number-class top1 --start "## I"
python3 tools/ingest-text.py T007 --tei https://raw.githubusercontent.com/…/POR0084_FraLGom_Bramanes.xml --demote
```

Log every hosted text in `docs/archive-sources.md`.

## What is deliberately dropped

`build-map-data.py` keeps only safe fields from the acquisitions workbook. It
drops the proposed introducers and editors — real scholars who have agreed to
nothing — along with market and risk ratings, rights columns and decision
fields. See `docs/research/provided-documentation.md`.

## `blender/`

3D columns tried for the pillars section and set aside (not on the site): see
[`blender/README.md`](blender/README.md). Needs Blender with its MCP extension,
and Pillow for packing the frames.

## Sources and licences

- **Natural Earth** (via `world-atlas` 2.0.2): public domain, no attribution
  required. Credited on the page anyway.
- **OpenHistoricalMap** (the historical borders): CC0 1.0; attribution is
  requested and given on the Atlas page.
- Everything else comes from `docs/provided-documentation/`, which is Beltrán's
  own material.
