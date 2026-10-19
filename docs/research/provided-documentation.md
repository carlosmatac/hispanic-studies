# What Beltrán gave us, and what each file is for

Five files in [`docs/provided-documentation/`](../provided-documentation/), handed over after the first meeting. He described the chart in the meeting ("le pedí a ChatGPT […] me hizo un timeline cronológico", [28:25]) and was candid that it is unreviewed: "obviamente lo tengo que mirar bien y revisarlo bien" [24:25], "visualmente está muy mal hecho" [31:18].

**Treat all of it as a draft of his own making, not as verified scholarship.** The files themselves say so repeatedly: "research cut-off 1 September 2026", "this is a triage framework, not a legal opinion", "these are not 267 complete bibliographies". Our job is to build the vessel, flag what needs his review, and never silently promote a research lead into a published claim.

---

## 1. `Hispanic_Reunification_Canon_data.json` (512 KB)

**The single most valuable file.** It is already a clean relational dataset — not prose we have to parse — and it is the backbone of the Atlas and Canon views.

| Collection | Count | Shape |
| --- | --- | --- |
| `authors` | 267 | `id`, `name`, `short_name`, `life_dates`, `birth_year`, `death_year`, `region`, `region_code`, `camp`, `primary_texts`, `position`, `influence_reception`, `evidence_level`, `source_lead`, `intervention_year`, `bueno_classes`, `primary_bueno_class`, `operations`, `unity_type`, `center_of_gravity`, `role`, `visual_priority`, `plotted`, `plot{x,y,band}` |
| `texts` | 50 | author, title, year, `bueno_class`, `unity_type`, `operations`, `plot` |
| `movements` | 22 | name, origin span, authors, core thesis, internal division |
| `events` | 94 | date, year, event, movement, authors/texts, historical significance |
| `venues` | 41 | periodicals and institutions with place, dates, network, kind |
| `relationships` | 30 | from, to, evidence mechanism, confidence, methodological control, relation type |
| `chart_events` | 42 | year + label + kind, for the timeline axis |
| `movement_visualization` | 25 | movement spans with start/end year, bands, operations |
| `bueno_classes` / `operations` / `unity_types` / `foundational_origin` | 8 / 5 / 3 / 5 | the taxonomy |
| `layout` | — | `viewBox`, broken chronology axis, **`palette`**, band `y0`/`y1` coordinates |

What makes it directly usable:

- **138 of the 267 authors already carry `plot{x,y,band}` coordinates** in a 6912×4608 viewBox. We can render his chart faithfully as an SVG on day one, then improve the layout he himself called badly done.
- **`visual_priority`** is 1 / 2 / 3 across 40 / 94 / 133 authors. That is our ready-made answer to "yo creo que con 50 autores" [34:23]: priority 1 = 40 authors, plus the 10 whose canonical text is in the Priority50 list. No editorial guesswork needed, and he can override it.
- **`region_code`** is a clean ISO-ish code (ES 50, PT 23, PH 18, AR 17, BR 17, PE 14, MX 11, AO 8, CL 8, GQ 8, …) — so **every author can be placed on the map**, which is exactly the fusion he asked for: "este timeline podría servir para enterrarlo en un mapa" [25:57].
- **`layout.palette`** is a tuned eight-band muted palette with one rupture red and one gold. Adopted as the site's neutral palette — see [`../brand/brand-plan.md`](../brand/brand-plan.md).
- **`relationships`** carry an explicit `confidence` and `methodological_control`. These must surface in the UI (solid line vs dashed vs dotted, as the legend specifies). Collapsing them into one "influence" line would misrepresent his own method.

Caveats to carry into the UI: `evidence_level` on most authors says titles "require work-level collation"; `bueno_classes` is a list, so an author can sit in several bands (the legend calls these "repeated author codes"); and `role` marks 35 authors as **counter-tradition** — people who argued *against* Hispanic unity. The legend is explicit that inclusion "does not imply their assent to a Hispanic or Iberophone project". That disclaimer has to appear on the page, not just in the repo.

**Used by:** `/canon` (the chart and author cards), `/atlas` (authors placed on the map), the pillar tags, and book cross-links.

---

## 2. `Hispanic_Reunification_Canon_legend.md` (6.6 KB)

The reading key: the Bueno classification (A1, A2, B1, B2.4–B2.8), the three forms of unity (isological / synalogical / attempted reunification), the five operations (restoration, recomposition, transfiguration, refoundation, rearticulation) **each with a prescribed visual form**, and a full entity grammar mapping entity → diagram form (author = filled circle, book = outlined rectangle, periodical = diamond, institution = ochre hexagon, rupture = red vertical band, movement = translucent territory, influence = solid line, probable = dashed, shared climate = dotted, opposition = opposed broken red, operation = gold trajectory).

**This is a design specification, and we should follow it rather than invent our own.** It is coherent, it is his, and he can read our chart against the same key he already has. It also tells us exactly which legend the `/canon` page needs.

Two things to lift verbatim into the page (shortened, credited): the "governing proposition" paragraph and the sentence beginning "Portuguese, Brazilian, Lusophone African, Asian, Indigenous, Black Atlantic, Equatoguinean, and Filipino traditions remain historically distinct." That sentence is what keeps the project from reading as annexationist, and it is the kind of care that makes an institute credible.

---

## 3. `Hispanic_Reunification_Canon.pdf` (138 KB, the chart)

The rendered version of the JSON, 72×48 inches. This is the artefact he showed us on screen. Useful as a reference for what his layout attempted; **not** a source we re-use, both because it is a flat render and because he asked for it to be redone better. Keep it for comparison screenshots in the next meeting ("this is what you had, this is what it looks like now").

---

## 4. `Brief_History_of_Iberofonia_60_Milestones_Bilingual.pdf` (33 pages)

He undersold this one. It is not a summary — **it is a cartographic storyboard**, and it is the best thing in the folder for the Atlas.

Structure:
- **60 numbered milestones**, c. 722 → 2026, in one chronological sequence, grouped in seven chapters: *Foundations of two Iberian worlds · Oceanic routes and world systems · Separation, reform and new sovereignties · Congresses, federations and shared names · Literary generations and rival programs · State networks and continental diplomacy · Institutions and Iberofonía today*.
- **Every milestone ends with an explicit `MAP` directive.** For example, milestone 01: *"MAP Place a small Asturian nucleus and a Covadonga marker; expand its successor kingdoms in later frames, not in this one. [A1]"* — and milestone 02: *"Show Portugal as a distinct crown, with Guimarães and Zamora as points; do not project a modern fixed frontier backward. [A1, A2]"*
- **The bracketed keys are a bibliography, not Bueno classes.** `A1`–`A20`, `B1`–`B30` and `C1`–`C3` resolve against a source list at the end of the document: UNESCO and UNESCO Memory of the World, the US Library of Congress, the US National Archives, the Spanish Congreso de los Diputados, the BNE, the Biblioteca Nacional do Brasil, the RAE, the OAS, SEGIB and CPLP. Every one of the 60 milestones carries at least one. That is better than a classification tag would have been: each map frame can cite its source, which is exactly the register an institute needs.
- **Fully bilingual**: the same 60 entries in EN and in ES, which covers the whole Atlas section's copy in both languages at no translation cost.
- **Ten book profiles** (Maeztu, Ganivet, Vasconcelos ×2, Rodó, García Morente, Oliveira Martins, Freyre, Bueno) — ready-made editorial copy for the Books section.
- A front-matter note on cartographic honesty: *"A treaty, a cultural network, a voyage and an actual sovereignty change have different map treatments. Proposals are labeled as proposals, not drawn as completed political unions."* That is the rule the Atlas renders by.

So the Atlas is not something we have to invent: **60 frames, each with its own prescribed map state, caption in two languages, and classification tag.** That maps one-to-one onto the stepped Prezi navigation he asked for [27:32].

**Used by:** `/atlas` (every frame), Books (the ten profiles), and the Home timeline teaser.

---

## 5. `panhispanic_paniberian_acquisitions.xlsm` (18 sheets)

The publishing programme for De Indiis Editions. Converted sheet by sheet, the useful ones:

| Sheet | Rows | What it gives us |
| --- | --- | --- |
| `Priority50` | 50 | **The books section.** Rank, author, title, source year, language, country, series, launch window, market/risk ratings, US rights triage, format, *suggested English/Spanish/Portuguese titles*, proposed introducer, text focus, edition and translation actions, difficulty, estimated pages, source URL, bibliographic evidence |
| `Series` | 120 slots | **10 series lines** with per-slot editorial rationale — e.g. *Classics and Critics of Hispanidad*, *Patria Grande and Anti-Imperialism*, *Race, Mixture and Difference*, *Pan-Iberian and Lusophone Thought* |
| `AnthologyPlans` | 15 | Anthology volumes with organising principle, audience, proposed editor, languages |
| `AnthologySelections` | 234 | Proposed contents of those anthologies |
| `Roadmap` | 50 | Five-year commissioning plan 2027–2031, ten slots a year |
| `Rights50` / `RightsNotes` / `ExtendedRights` / `TermRules` | 50 / 500 / 482 / 10 | Territorial rights triage per work across ten jurisdictions, with a copyright-term framework |
| `Authors` / `TextLeads` / `Timeline` / `Movements` / `Influence` / `Periodicals` / `Sources` | 267 / 482 / 94 / 22 / 30 / 41 / 319 | The same records as the JSON, in spreadsheet form |
| `Translation50` | 50 | Translation commissions |
| `Start` | — | The workbook's own reading instructions and evidence-label legend |

Two cautions, from the workbook itself:
- **"Accepted for commissioning: 0"** and every decision field reads `Unreviewed`. Nothing here is an editorial decision he has made. So the site cannot announce forthcoming titles. We show the *programme* — ten series, the canon, the five-year plan — and the books that actually exist.
- **"Introducers, endorsers and partners are suggestions, not agreements."** The sheet names real scholars (Sepúlveda, Castelo, Faber, Bergel, Moraña…). None of those names may appear on the site. This is the biggest hazard in the whole folder: publishing a proposed introducer as an actual one would be a false claim about a real person.

**Used by:** `/books` (series architecture + the canon-to-book link), and the Canon view's "if you want to understand more, start here" hand-off that he described [32:43].

---

## How the five files become the site

```
60 milestones  ──→  /atlas       60 stepped map frames, EN/ES, MAP directives rendered
canon JSON     ──→  /canon       50 authors on the Bueno field + on the map
   legend      ──→  /canon       the visual grammar and the disclaimers
Priority50     ──→  /books       10 series, the canon-to-book hand-off
  + 10 profiles from the PDF
rights sheets  ──→  internal     never published; they decide what we can show
```

What is missing and only he can supply: which ~50 authors if he disagrees with `visual_priority`, Caribbean/Miami reference material, and a decision on whether to approach Atlas Hispano / Durántez Prados.

## Reproducing the conversions

The spreadsheet was read with a stdlib-only XLSX reader (no npm, no new dependency — see AGENTS.md). The extraction script and the per-sheet CSVs are not committed; the data pipeline that produces the web-ready JSON is its own issue, and *that* output does get committed under `proposals/shared/data/`.
