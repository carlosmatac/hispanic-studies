# Iberofonía: Beltrán's curated 80 (source of record)

Sent by Beltrán on 2026-11-22 as one PDF (`DEI_Iberofonia_Archive_v3.pdf`) with these files attached. They are kept here as they came; the site's database is built from them by `npm run iberofonia:import` (issue #93, `site/scripts/iberofonia-import.mts`).

| File | What |
| --- | --- |
| `DEI_Iberofonia_Developer_Brief.md` | The spec: landing copy ES/EN, archive structure, article template, edition display rules, translation appeal, U.S. rights workflow, launch checks |
| `DEI_Iberofonia_Archive_80.json` | The data (schema 3.0): 80 works, 160 article drafts, editions, eras, regions, labels |
| `DEI_Iberofonia_Edition_Inventory.md` | Per work: which edition can be read, which is a bibliographic route, what still needs a local asset |
| `DEI_Iberofonia_Posts_Review.md` | The full editorial drafts, for reading |
| `DEI_Iberofonia_Approved_Assets.example.json`, `DEI_Iberofonia_Apply_Approved_Assets.mjs` | The staging handoff for approved local HTML/PDF assets (not used by the import; see `docs/cms.md`) |

Beltrán's message with it (2026-11-22, translated): no user system on the website; paid content goes on Substack; the archive is free and without registration. The "pending translation" notice leads to "Collaborate", which links to Substack. Each of the 80 works has its own record with an introduction in ES and EN and links to the editions; texts we can host are read in the record or in the PDF viewer; the rest get an external link. This overrides the brief's "Support us on Patreon".
