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

## What is deliberately dropped

`build-map-data.py` keeps only safe fields from the acquisitions workbook. It
drops the proposed introducers and editors — real scholars who have agreed to
nothing — along with market and risk ratings, rights columns and decision
fields. See `docs/research/provided-documentation.md`.

## `blender/`

The 3D columns of the pillars section and their turntable renders: see
[`blender/README.md`](blender/README.md). Needs Blender with its MCP extension,
and Pillow for packing the frames.

## Sources and licences

- **Natural Earth** (via `world-atlas` 2.0.2): public domain, no attribution
  required. Credited on the page anyway.
- Everything else comes from `docs/provided-documentation/`, which is Beltrán's
  own material.
