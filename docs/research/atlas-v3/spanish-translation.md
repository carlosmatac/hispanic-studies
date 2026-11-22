# The Atlas records in Spanish: machine translations, pending Beltrán's review (issue #98)

`site/data/atlas-records.es.json` holds the Spanish of the 139 Atlas records that
`tools/build-atlas-records.py` parses from Beltrán's English manuscript of
16 November 2026 into `site/data/atlas-records.json` (issue #95). It is a
**machine translation** (made by Claude, 22 November 2026) and **has not been
reviewed by Beltrán**: every entry carries `machine: true` until he approves it.
The site should say so wherever it shows the Spanish (for instance "Traducción
automática, pendiente de revisión").

## Shape

An object keyed by record id (`A07` … `A146`), in the order of the English file:

```json
"A07": {
  "title": "La conquista romana de Hispania",
  "dateLabel": "218–19 a. C.",
  "anchorText": "Emporion, Tarraco, Carthago Nova, Numancia y la cordillera Cantábrica",
  "paragraphs": ["…", "…", "…", "…"],
  "machine": true
}
```

- `title`, the four `paragraphs` (in the English order) and `anchorText` (the
  manuscript's "Map anchor") are on every record.
- `dateLabel` appears only where the English label has words ("BCE", "1520s",
  "present", "tradition"); otherwise use the English label as it is.
- Nothing else is translated. Ids, dates, geometry, anchors' names on the map,
  links and plates stay in the English file. The label "Interpretación
  geopolítica: Gustavo Bueno" comes from the UI strings (`atlas.interpretation`
  in `site/lib/i18n.ts`), not from this file.

## How it was translated

- Peninsular Spanish, in the register of a historical atlas. The fourth
  paragraph of each record is an instruction to the map's builders ("Open
  playback with…"), so it is rendered with infinitives ("Abrir la reproducción
  con…").
- Proper names in their established Spanish forms: Hispania, Tarraco, Carthago
  Nova, Numancia, Emporion, Viriato, Escipión, Covadonga, al-Ándalus, Táriq ibn
  Ziyad, el rey Rodrigo, Recaredo, Leovigildo, las Navas de Tolosa, Alfonso
  Enríquez, San Mamede, Santarén, Dionís, Elcano, Magallanes, Mactán, La
  Española, Nutca, Malvinas…; Portuguese and Brazilian places keep their own
  spelling (Guimarães, Alcácer do Sal, São Vicente, Belém).
- Dates: "BCE" is "a. C.", "CE" is "d. C.", "1520s" is "década de 1520",
  "1500s" (a century) is "siglo XVI", "present" is "actualidad".
- No fact added or dropped; numbers and years are as in the English.

## Validation (run on 2026-11-22 against `origin/feat/95-atlas-globe`)

- The JSON parses; all 139 ids of `atlas-records.json` are present, and no
  others.
- Every record has a title and exactly four non-empty paragraphs.
- Numbers and years are unchanged: for every title, date label, anchor text and
  paragraph, the multiset of numbers in the Spanish equals the English one
  ("1500s" written as "siglo XVI" counts as 1500). 0 differences.

## For Beltrán

Correct anything that reads wrong, then set `machine` to `false` (or remove it)
for the records he approves. If the English manuscript changes, the records
whose English changed need translating again.
