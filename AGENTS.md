# AGENTS.md: Institute for Hispano Studies (IHS) website

Instructions for every coding agent (Claude Code, Codex, Cursor, Devin…) and for both humans working in this repo. Read it fully at the start of every session.

## What this is

The website for **Beltrán Arellanes** and his **Institute for Hispano Studies** (hispanostudies.com, @hispano_studies). The mockup phase is over: since 2026-10-20 we build **the real site**, a Next.js app in `site/`, deployed later on Vercel (decision in issue #8).

Decided (handoff: `docs/handoff/2026-10-20-real-project.md`):
- **Direction: O · Atlas** (`proposals/o-atlas/` on the mockup branches): the sober reference-work register Beltrán asked for.
- **Colours: his existing brand, unchanged** — burgundy `#470B15` / `#2F070D`, paper `#F9F3DD` / `#EDE3C8`, ink `#28231E` (plus his `leather` `#8B5E4B`, used only on the map). Tints of these are fine; new hues are not. **No theme switcher.**
- From P · Tornaviaje only the **footer** came over. (The canon as a React Flow graph came too, and was dropped on 2026-10-25 at Beltrán's request; see "The archive".)
- **One paper, burgundy as ornament** (Beltrán and Carlos, 2026-10-24/26): every section of the home sits on the same paper (`--paper`); no section changes ground (they tried paper, leather, burgundy and ink grounds on 2026-10-25 and the page jumped). Sections part with a rule and a small leather lozenge; titles are burgundy, labels leather; a paper grain over everything and warm shadows (`--lift-1/2/3`). The colour comes from the art, in its own colours (the pillars, the Villalpando plate, the valley behind the epigraph). The only burgundy panel is the footer.

Still parked (do not build on a guess): payments and merch (#9), the newsletter provider behind the pamphlet signup, the Discord invite link.

| Folder | What | Owner |
| --- | --- | --- |
| `site/` | **The real site**: Next.js (App Router, TypeScript) | both, through PRs |
| `site/app/[lang]/` | Routes, one tree per language (`/en`, `/es`) | both |
| `site/components/` | Page components; `canon/` is the archive's cards, records and reader contents | both |
| `site/app/admin/`, `site/components/admin/`, `site/lib/admin/` | **The back office** at `/admin` (#69): Beltrán edits the archive there | both, and Beltrán through `/admin` |
| `site/lib/db/`, `site/db/migrations/`, `site/scripts/` | The archive's database (Drizzle schema, SQL migrations) and its npm scripts (migrate, import, export, users) | both |
| `site/lib/` | `i18n.ts` (every string, EN + ES; the back office's at the end, `adminDict`), `content.ts` (real videos, essays, channels), `archive.ts` (the archive, read from the database), `palette.ts` (the region colours), `atlas-map.js` (the map plate) | both |
| `site/data/`, `site/public/data/` | Datasets built from Beltrán's documents (see `tools/`). `public/data` is fetched by the browser; `data/` is imported at build time | both |
| `proposals/` | The mockups Beltrán saw (archive, not maintained) | nobody |
| `tools/` | Stdlib Python scripts that build the datasets | both |
| `docs/research/`, `docs/meeting/`, `docs/brand/`, `docs/handoff/` | Context, decisions, brand, handoffs | both |
| `docs/brief/` | The developer brief Beltrán received (reference, do not edit) | nobody |
| `assets/` | Brand files, public-domain art sources (`assets/art/SOURCES.md`) | both (add, don't overwrite) |

## Start of every session (do this before writing anything)

1. Who am I working for? `gh api user --jq .login`.
2. Sync: `git fetch origin --prune` and `git status`. If you are on a branch, merge main into it (see "Staying in sync").
3. Context: read `ROADMAP.md`, then the open work:
   - `gh issue list --assignee @me --state open`
   - `gh pr list --state open` (what the other person has in flight)
   - `git log --oneline origin/main -15` (what landed recently)
4. Pick up the issue the user asks for, or the lowest-numbered open issue assigned to them whose dependencies are closed. The issue's checklist is the scope. Skip `parked` issues.
5. Keep the PR to the issue's scope. Shared pieces (`site/lib/`, `site/app/globals.css`, the datasets) are everyone's: say in the PR what you changed there and why.

## Git workflow (mandatory)

- **Never commit to `main` directly.** Every change goes through a branch and a pull request.
- **One issue = one branch = one PR.** Branch from the latest `origin/main`:
  `git switch -c <type>/<issue>-<slug> origin/main`, e.g. `feat/42-canon-page`, `fix/60-map-labels`, `docs/47-meeting-notes`.
  Types: `feat`, `fix`, `chore`, `docs`, `refactor`.
- Commit small and often, with clear messages (`canon: jump to a neighbour from the panel`). Push early: `git push -u origin HEAD`, so the other person can see the work.
- Open the PR as soon as there is something to look at (draft is fine): `gh pr create --fill --draft`, then fill in the template. The body must include `Closes #<issue>`.
- Before marking the PR ready: merge main in again and check the pages in the browser (see "Verification").
- **Merging**: squash merge (`gh pr merge --squash --delete-branch`).
  - PRs that only touch one section of the site (or docs) can be merged by their author.
  - PRs touching shared pieces (`site/lib/`, `site/app/globals.css`, datasets, `AGENTS.md`) get the `area:shared` label and need the other person's approval.
- Never force-push to `main`. Never rewrite someone else's branch. Never commit secrets.

## Staying in sync with the other person's work

There is no staging environment: `main` is the only place our work meets. **Integrate early and often:**

- Merge main into your branch at the start of every session, before opening or updating a PR, and whenever the other person merges something you depend on: `git fetch origin && git merge origin/main`
- Use merge, not rebase, on branches that are already pushed.
- Resolve conflicts keeping both people's intent. If a conflict touches work the other person is doing, ask before choosing a side.
- Keep PRs small so they land fast.

## Issues are the documentation

- Every piece of work has an issue with a checklist. Decisions, links, screenshots and open questions go in issue comments: `gh issue comment <n> --body "..."`.
- Anything that depends on Beltrán goes in an issue labelled `parked` (or `meeting` for meeting input/output) instead of being built on a guess.
- After the meeting, write the notes in `docs/meeting/` and turn every decision into an issue.

Labels: `area:site`, `area:data`, `area:brand`, `area:shared`, `area:research`, `area:infra`, `meeting`, `parked`.

## The site: rules of the game

- **Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, plain CSS (custom properties, no CSS framework). `d3-geo` + `topojson-client` for the map. Versions are pinned exactly in `site/package.json`; upgrade deliberately, in its own PR.
- **Colours and fonts** are tokens at the top of `site/app/globals.css`. Only the brand colours above, or `color-mix()` tints of them. Fonts (Ibarra Real Nova, Inter, IBM Plex Mono) come from `next/font` in `app/[lang]/layout.tsx`.
- **EN/ES**: every string we author lives in `site/lib/i18n.ts`; the Spanish table is typed against the English one, so a missing translation fails the build. Third-party content (video and essay titles, the compiler's canon records) stays in its original language.
- **Real content only**: Beltrán's videos, essays and numbers (`site/lib/content.ts`, `docs/research/context.md`); never invent books, people, prices, numbers or quotes. Followings we have: YouTube 13.5K, Instagram 19K, X 22K, Substack 587; none for TikTok or Patreon. Placeholder copy must look like placeholder (`[The store is not connected yet]`).
- **Never show the proposed introducers/editors** from the acquisitions workbook: they are real scholars who agreed to nothing.
- **Images**: only public-domain or properly licensed sources, logged in `assets/art/SOURCES.md` before they ship. Beltrán's Drive folder is a moodboard only.
- **Motion**: respect `prefers-reduced-motion` everywhere; every animation has a still state; reveals must fail open (content can never stay hidden because a script or a feature is missing).
- **Pages**: the home, `/[lang]/atlas` (the map, its tour, the sixty milestones), `/[lang]/archive` (the archive of Hispanic thought; `/[lang]/canon` redirects there) and `/[lang]/archive/<id>` (a work's page: the reader, or its record). Beltrán found the home too busy with the map and the canon live on it (2026-10-24), so the home shows them as two plates that open their pages. The back office is at `/admin` (see `docs/cms.md`).
- **Homepage order** (since 2026-10-25, issue #64): title page (the eagle and the name, nothing else) → the reel → the epigraph (Lewis Hanke, inked word by word as it scrolls) → three pillars → where to find us (the channel grid, a light band; moved up from About in round 3, issue #66) → the two plates, Atlas and archive → books → watch → read → about → community (with the pamphlet signup) → merch → footer.
- **The title page** (since 2026-10-26): two layers. Behind, seven shapes in tints of burgundy and leather drift, turn and stretch on the paper (cycles of 10 to 17 s); in front, a frosted glass over the whole title page (`.title__page::before`: a light backdrop blur, a cream wash, a lit top edge) carries the eagle and the name, so the shapes come through as soft moving colour; cream stays on top. No frame or inset pane (tried and rejected 2026-10-26). CSS only, still with reduced motion. It answers the footer's glass.
- **The epigraph** (since 2026-10-26): Hanke's sentence over a wide view of the Valley of Mexico that fills the section (`site/public/art/epigraph-valley.jpg`, AI-generated in Velasco's manner, credited as a generated image; its false signature was painted out). A paper veil from the left (from the top on phones) keeps the words readable.
- **The footer** (since 2026-10-26): a blind. The page ends with a frosted glass laid out as a grid of cells parted by hairlines (the eagle; Explore, Channels, Community; the motto and blurb above the sources), and a bottom line with © Hispano Studies LLC, the version and "Made by algoreto" with its logo, linking to https://algoreto.com; under it lies Carlos's picture of HISPANO STUDIES with a painting in every letter (`site/public/art/footer-name.jpg`, its cream strip cut off), fixed to the bottom of the window and seen blurred through the glass. Scrolling on lifts the glass and shows the name, heavily: past the bottom of the glass the wheel or finger lifts it less and less, damped. Letting go, it falls back by its weight, a quick smooth scroll (`site/components/FooterBlind.tsx`; never while a finger is down; a touchpad's inertia never holds it up). The footer's ground (`--wine`) is the picture's own burgundy.
- **Deploys**: Vercel (project root `site/`). Previews for Beltrán sit behind a password: `site/proxy.ts` asks for one whenever the `SITE_PASSWORD` env var is set (any user name; Vercel's own password protection is a paid add-on). Locally, without the variable, the site is open. Deploy only when the user asks.

## The archive (`/[lang]/archive`, issues #68 and #69)

- **The canon became an archive of Hispanic thought** (Beltrán, 2026-10-29: it matters more than the Atlas): a reference site where people come to read the primary sources of the great debates of the Hispanic world. Public-domain texts are readable in full, comfortably on a phone (most reading will be on phones, and long reading will carry AdSense later, #70). Texts still under copyright are **never hosted**: their page is the record plus links to legitimate copies only (publisher, library, Internet Archive lending), never unlicensed PDFs.
- **It lives in a database** (since 2026-10-29, #69; Carlos: no GitHub for Beltrán): Neon Postgres on Vercel, through Drizzle (`site/lib/db/schema.ts`, migrations in `site/db/migrations/`). A work is a record (title, author, year, section, region, language, rights, source edition/URL/revision/licence, links, the compiler's camp/position/Bueno class, draft or published), its texts (Markdown, one per language: Spanish and/or English, and the original language when it is another; shown only when the rights are `public-domain`; reading time computed on save), its references (formatted as citations by `lib/cite.ts`) and its history (a snapshot before every change). The sections (periods), the regions and the archive page's own words are in the database too. The site reads it in `site/lib/archive.ts` (static pages, cache tag `archive`); the shared shapes and the languages are in `site/lib/canon.ts`. The fifty works from the compiler keep their ids (`T001`…`T050`); new works get readable ids (`las-casas-brevisima`). The Markdown files it came from are in git history (`246fe7e`).
- **Beltrán edits it himself** in the back office at **`/admin`** (user name and password; Spanish, with English): works, texts (a WYSIWYG editor that pastes cleanly from Word and Google Docs, with a preview in the reader's own style), references, sections, regions, the page's words, history and restore, backup. Every save shows on the site at once (no deploy). Accounts are made with `npm run user:create -- <name>`. Everything else, for both of us: `docs/cms.md`. **Never wipe or reimport over the Neon database**: it is shared by the preview and our laptops; tests use throwaway rows or a local PGlite (`npm run db:local`).
- **Rights** (research of 2026-10-29, `docs/research/archive-rights/`, applied by `tools/apply-archive-research.mjs`): a full text is hosted only when the work is in the public domain **in the US (where the site is served), in Spain and in its own country** (`rights: public-domain`). `pd-us-only` and `pd-outside-us` works get the record, legitimate links and the year they come free (`pdSpainYear`, `pdUsYear`); `in-copyright` works get the record and links. Public-domain works that exist online only as scans carry `needsTranscription: true`: they go in once someone has transcribed and proofread them (no raw OCR on the site).
- **Full texts** come in through the back office (typed or pasted), or through `tools/ingest-text.py` (Wikisource: one exact revision; Project Gutenberg; TEI such as ELTeC), which cleans the text to Markdown for `npm run text:import -- <id>` (source fields included). Before ingesting, check the work is in the public domain and the copy is the original text (not a modern translation, not an annotated or abridged edition), and log it in `docs/archive-sources.md`.
- **Periods**: six boxes, dates only (ours): a **prelude** (1492–1799, the Empire's own thought: Vitoria, Las Casas, Sepúlveda, Acosta, the Inca Garcilaso, Guaman Poma, Solórzano, Clavijero, Viscardo), then the compiler's five. Beltrán can add, rename, reorder and delete sections in `/admin`. **Regions** colour the cards (Beltrán: "by region, not at random"): Spain = burgundy, South America = leather, North America (Mexico and Central America) = ink, Caribbean = a muted sea (`--region-sea`), Lusophone world (Portugal, Brazil, Lusophone Africa) = a muted olive (`--region-olive`), Ibero-Asia (the Philippines, Goa) = paper. A region's colour is one swatch of the fixed palette in `site/lib/palette.ts` (the brand colours, four mixes of them, and sea and olive), each pair at least 0.08 apart in OKLab and with 4.5:1 text contrast (`npm run palette:check`); no colour is used twice. Do not add hues outside it. A work goes where its author worked or what it is about; the per-work calls are in `tools/migrate-canon-to-archive.py`. The page shows a legend.
- Authors are named as they are known (the compiler's short names cut many Spanish names wrong: "Miguel y Jugo" is Unamuno); the mapping is in the migration script.
- **The reader** (`/[lang]/archive/<id>`): Ibarra Real Nova on the paper, one column of ~65 characters, chapters (`## ` headings) as contents (folded on phones, beside the text on wide screens), a scroll-drawn progress line, the source and licence at the foot, earlier/later works. The ad slots for #70 are marked in the layout (`.ad-slot[data-ad-slot]`, empty and hidden; no ad code yet).
- Links into the archive are `/[lang]/archive#T030` (the work's id): the page scrolls to the card and opens its record; old `/[lang]/canon#T030` links redirect and keep the hash. A work's own page is `/[lang]/archive/T030`.
- The old React Flow graph is in git history (before #64) if the chronology comes back.

## The Atlas map (`site/lib/atlas-map.js`, `site/components/MapTour.tsx`, `/[lang]/atlas`)

- One engraved plate (Equal Earth, Natural Earth 1:110m) with a tour of about ten milestones (`site/lib/map-tour.ts`) and, since issue #71, **historical borders 1492–1898**: twenty keyframes in `site/data/atlas-eras.json`, each a dated act (law, cédula, treaty) with a source we can cite, in EN and ES. A milestone shows the latest keyframe at or before its year (`eraYear` in `site/lib/atlas.ts`); before 1492 and after 1898 the map shows today's states.
- Level: **viceroyalties and captaincies-general** (no audiencias), the Americas and the Philippines. Spain in burgundy tints, Portugal in leather, every other crown and state in a neutral grey of ink (context only), successor states in a faint burgundy, Indigenous states dashed; claims hatched, treaty lines dashed. Spain and Portugal themselves keep their colour as the two crowns' home.
- Geometry: **OpenHistoricalMap (CC0)** relations, pinned by id per keyframe, built into `site/public/data/atlas-eras.topo.json` by `tools/build-atlas-eras.py` (clipped to the Natural Earth coast so the plate keeps one coastline; `--list <date>` shows the OHM units valid on a day). Lines and claims OHM lacks are drawn from the treaty texts in `tools/atlas-eras-drawn.json`. **HGIS de las Indias is reference only** (non-commercial licence); historical-basemaps is not used (GPL, errors). Sources logged in `assets/art/SOURCES.md`.
- Motion: keyframes cross-fade (nothing morphs), the units that changed pulse twice; with reduced motion the swap is a cut and changed units keep a still outline. Under the map, `EraPanel` is the scrubber and the text version: the year, the act, what changed, the source, and the twenty keyframes as a list.
- Not built yet: the fog of war (the map discovered by the expeditions), parked until Beltrán has seen the borders (#71).

## The pillars (`site/components/Pillars.tsx`, `site/components/pillars/Fresco.tsx`)

- The idea: **everything the Institute does rests on three pillars**, mestizaje, catolicismo and lengua. Since 2026-10-26 (after Carlos's mock-ups) it is **one fresco** across the full width: three public-domain paintings melted into one band (`site/public/art/pillars/fresco.jpg`, built by `tools/build-fresco.py`: Miguel Cabrera's casta painting *De español e india, mestiza* (1763; since 2026-10-29, replacing Morlete's, which Beltrán said showed no mestizaje; Arellano's *Mujer chichimeca* is wanted instead if the Museo de América allows it), Cabrera's Guadalupe altarpiece, the Florentine Codex folio 80 in Spanish and Nahuatl). Under it the three pillars are tabs; pointing at one lights its third of the fresco, opening one unfolds a panel under the tabs (the painting's detail on the left; numeral, a heading, what it covers and the rows of what rests on it on the right: the book series, the Atlas for lengua, and `PILLAR_LINKS` in `site/lib/content.ts`). Esc or "Close" folds it.
- On phones the fresco crops to its middle and the tabs become a list.
- Rejected, so nobody re-proposes them: photographed columns engraved in WebGL; 3D gilded columns from Blender (pipeline kept in `tools/blender/`); gold of any kind; the engraved portico with the words laid over it and a list beside it (2026-10-21 to 25); a temple in HTML and CSS with a painting in each shaft, on burgundy and then drawn in burgundy on paper (2026-10-25 to 26: "no me termina de convencer"). Generated "viceregal" paintings for the fresco: it uses real ones.

## The reel (`film/`, `site/components/Reel.tsx`)

- The second section is a one-minute film about the Institute, after tigranz.com: full width, silent and looping, graded on the page's own paper so it reads as part of the page. It never shrinks or moves: a `Sound on` / `Sound off` switch (it follows the pointer over the film) turns the sound on in place.
- It is made in **HyperFrames** (HTML + GSAP rendered to MP4) in `film/reel/`. Read `film/reel/SPEC.md` before touching it.
- **About the Hispanic world, not about Beltrán** (his feedback, 2026-10-24): it is built from viceregal architecture, baroque paintings and period maps (`film/reel/assets/img/period/`, sources in `assets/art/SOURCES.md`; only public-domain and CC0 files in the film). Beltrán appears only in three short windows, from his **latest** Shorts (September 2026), never the first long video. Catalogue of his footage: `film/MATERIAL.md` (raw files in `film/media/`, never committed).
- **Cinematic, not slides**: every picture moves (push, tilt, pan), cuts arrive on whips with motion blur, the pillars each enter differently (a flight through the word, a climb up a façade, a pan across the Codex). No layout of "picture on one side, title on the other".
- **No numbers that go stale**: the end shows the channels' logos and one total that stays true as they grow ("50,000+ followers on five channels"; the verified followings add up to about 55,000). Never put a single channel's count in the film.
- **The music comes first** and the edit follows it: the track (ElevenLabs, `film/reel/assets/audio/music.mp3`), the hits every scene is cut on, and the brief are in `film/MUSIC.md`. The sound is mixed after the render by `film/tools/mix-reel.py`: music dipping under Beltrán's voice, plus sound effects from earshot's code-made bank (MIT).
- After the pillars, every shot of the works leaves the same way: the frieze of the portico slides in from the right and the camera dives into the next metope (in the film the metopes are in the film's order: Watch, Read, Canon, Atlas, Books, Community).
- Every picture is printed in the duotone (`film/tools/grade-period.py` for stills, the LUT `film/reel/assets/luts/ihs-duotone.cube` for video): burgundy ink on the site's paper. The film's grounds follow the site's: paper, burgundy, leather, burgundy-dark. Only real titles, numbers and his own words on screen.
- The delivered cut (the mixed file) is encoded to `site/public/video/reel.mp4` (+ `reel-poster.jpg`).

## Unicorn Studio (WebGL scenes)

(Mockup-phase tooling, kept for reference.) Some proposals are built as Unicorn Studio scenes and embedded with `<div data-us-project="ID">` + the SDK. Inspiration and plan: `docs/research/unicorn-inspiration.md`.

- Connect the MCP (each person, each tool, logs in separately):
  - Devin: `devin mcp add unicorn-studio https://agentmcp-qbght5huyq-uc.a.run.app/mcp` (saved to `.devin/mcp_config.local.json`, not committed)
  - Claude Code: `claude mcp add --transport http unicorn-studio https://agentmcp-qbght5huyq-uc.a.run.app/mcp`
- The agent only works on a design open in the browser with **Allow agents** on (lock icon on the "Connected" button in the editor's top bar).
- The Free plan has **200 agent changes a month** and 8 branded publishes, non-commercial only. Read-only calls are free. Before a large build, check `agentChanges` in `get_editor_state`; one scene per proposal, one Unicorn design per proposal (`IHS · <id>`); write the scene's project ID and editor URL in the proposal's issue.
- Production: publish the final scenes from a Legend account (commercial licence, no watermark; one month is enough, published scenes survive cancellation) and self-host the exported JSON with the site. Details in `docs/research/unicorn-inspiration.md`.

## Local preview

```bash
cd site
npm ci              # first time
npm run dev         # http://localhost:3000 → redirects to /en
npm run build && npm start   # what Vercel will serve
npm run lint && npm run typecheck
```

The old mockups still open with `make serve` (http://localhost:8000/proposals/) on the branches that have them.

## Verification before you say "done"

- `npm run lint`, `npm run typecheck` and `npm run build` pass with no errors.
- Open the production build (`npm start`) at a desktop width (1440) and a mobile width (390), in **EN and ES**; no console errors, no horizontal scroll.
- Check with reduced motion on (DevTools → Rendering → prefers-reduced-motion).
- For the archive: open several records in a row, close with Esc and with a click outside, open one from a link (`/en/archive#T030`, and the old `/en/canon#T030`), and read a long text at 390 wide.
- Screenshot it and attach it to the PR.

## When you finish a session

- Push your branch and leave the PR in a clear state (draft with what is left, or ready).
- Comment on the issue with progress or blockers.
- If the plan changed, update `ROADMAP.md` in a small PR and create or edit the issue. Issue state (open/closed) is the source of truth for progress.

## Conventions

- Code, comments, commits, PRs and issues in English. Talk to the user in the language they use. Site copy in English and Spanish (`site/lib/i18n.ts`).
- CSS custom properties for every colour and font, at the top of `site/app/globals.css`.
- File names in kebab-case.
