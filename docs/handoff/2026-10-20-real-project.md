# Handoff — the real project (2026-10-20)

For the next agent. Read this after `AGENTS.md`, before writing anything.

## What changed

The HTML mockups are over. They were too limited to show what we can build, and the user does not want to give Beltrán the wrong impression. **We now build the real site on the real stack.**

The user has decided:

1. **Direction: O · Atlas** (`proposals/o-atlas/`). The sober "reference instrument" register Beltrán asked for in the meeting. Proposal P · Tornaviaje is dropped as a direction.
2. **Colours: his existing brand, unchanged** — red (burgundy) and white/cream, exactly what he already uses, so his brand is not diluted. Do not invent a new palette. **No theme switcher** (it changed his colours).
3. **Two pieces come over from P · Tornaviaje** (`proposals/p-tornaviaje/`):
   - **the footer** (oversized SVG wordmark that never clips, channel marquee, columns);
   - **the canon as a React Flow graph** — made more beautiful, and **without bugs**.
4. Scope now: **a first version.** Not the whole site.

## The canon graph — requirements

Port `proposals/p-tornaviaje/canon-graph.js` into the real app as a proper component, and:

- **Fix the selection bug.** In the HTML version, after clicking one node you could not click another. Find the real cause before patching. Suspects, unverified: nodes rebuilt as new objects on every render while React Flow runs controlled without `onNodesChange`; the hover rule that expands a card (`.cg-node:hover { height: auto }` + `z-index: 900`) so the enlarged card sits on top of its neighbours and swallows clicks; dimmed nodes (`is-dim`) or the reading panel intercepting pointer events.
- **A fullscreen button** that enlarges the graph panel to the whole screen (and back; Esc closes it).
- **Clicking a node shows**: its full information, **the list of nodes it is connected to**, and **the type of each connection** (documented reception, probable, polemical opposition, authorship), with each edge's evidence mechanism, confidence and methodological control. Clicking a neighbour in that list navigates to it.
- Keep what worked: the field means something (x = year, y = Bueno band, nothing auto-arranged); node shapes from Beltrán's legend; edge styles by kind; animated sparks along edges (off under reduced motion); neighbour highlighting; pan bounds (`translateExtent`); band rail that does not scale with zoom; titles never cut (hover/expand).
- Make it prettier, in O's register: paper, burgundy, hairlines, Ibarra Real Nova / Inter / IBM Plex Mono — not P's dark room.

Data: `proposals/shared/data/canon-graph.json` (93 nodes, 47 edges: the 30 evidence-graded relationships + authorship), built by `tools/build-canon-graph.py` from `docs/provided-documentation/Hispanic_Reunification_Canon_data.json`.

## Stack

Issue **#8** in the repo is still "parked". The user calls the real stack decided — **confirm which one from their prompt before scaffolding**; if the prompt names it, do not ask again. Notes:
- The current live site is WordPress 7 + WooCommerce + Elementor on Hostinger (prepaid until Apr 2027).
- React Flow is a React library; a React stack (e.g. Next.js on Vercel — the Vercel MCP is connected) fits it naturally.
- AGENTS.md's "plain HTML, no npm, no build step" rule was **for the mockups only**. Update AGENTS.md in a PR for the real project (structure, commands, verification), and close or update #8 with the decision.

## Where things are

| What | Where |
| --- | --- |
| Meeting transcript | `docs/meeting/2026-10-14-first-meeting-transcript.md` |
| What Beltrán decided | `docs/meeting/2026-10-14-decisions.md` — **read this** |
| Brand plan (pillars, type, motion budget) | `docs/brand/brand-plan.md` — ignore its three-register palette now |
| His brand tokens (live site) | `docs/research/context.md`: burgundy `#470B15`, burgundy-dark `#2F070D`, paper `#F9F3DD`, paper-aged `#EDE3C8`, ink `#28231E`; Ibarra Real Nova + Inter. Logo files in `assets/brand/` |
| Imagery and rights policy | `docs/brand/imagery-and-rights.md` |
| Beltrán's source documents | `docs/provided-documentation/` (explained in `docs/research/provided-documentation.md`) |
| Datasets | `proposals/shared/data/*.json` — `milestones`, `canon`, `canon-graph`, `books`, `iberophone`, `routes`, `world-110m` |
| Build scripts | `tools/build-*.py` (stdlib Python), `tools/README.md` |
| Real content (videos, essays, channels) | `proposals/shared/content.js` |
| O · Atlas mockup (the direction) | `proposals/o-atlas/` — `map.js` (Equal Earth plate, viewBox zoom, `--u` sizing), `motion.js`, `main.js` |
| P pieces to port | `proposals/p-tornaviaje/canon-graph.js`, footer in `index.html` + `style.css` |
| Sourced paintings (27, Commons) | `assets/art/corridor/` + `SOURCES.md` |

## Git state

- `main`: planning docs (PR #48).
- **PR #49** `feat/40-o-atlas-draft` → `main`, open: O mockup + `proposals/shared/data/` + `tools/`.
- **PR #51** `feat/50-p-tornaviaje` → `feat/40-o-atlas-draft`, open, stacked: P + `assets/art/corridor/` + canon graph + later edits to O. **This handoff is on that branch; it is the most complete.**
- Decide with the user how to land #49/#51 (merge them as the archive of the mockups, then start the real project on a fresh branch from `main`), per AGENTS.md: one issue = one branch = one PR.

## How the user works

- Speaks Spanish; code, comments, commits, PRs and issues in English.
- **Do not flood them with questions.** Decide with judgement, ship, let them correct.
- Wants honest status: say what is rough. Verify for real (1440 and 390, EN and ES, reduced motion) before calling anything done.

## Non-negotiable content rules

- Real content only: no invented numbers, books, people or quotes. Followings we have: YouTube 13.5K, Instagram 19K, X 22K, Substack 587 — none for TikTok/Patreon, do not invent them.
- **The proposed introducers/editors in the acquisitions workbook are real scholars who agreed to nothing. Never show those names.** Nothing in that workbook is a decision.
- Images: only sourced public-domain or licensed works, logged in `SOURCES.md`. Beltrán's Drive folder is a moodboard only. AI only for texture. Devotional images never as texture or effect.
- EN/ES on all our own copy. `prefers-reduced-motion` respected everywhere.

## Technical lessons from the mockup phase

- Never mix `performance.now()` with requestAnimationFrame timestamps: take t0 from the first frame callback and clamp t to [0,1] (mixing them sent a map viewBox into the billions and counters to −12252).
- Reveal animations must fail open: content can never stay hidden because a script did not run.
- Third-party React from a CDN must not be a static import that can take the whole page down (less relevant once bundled, still true for any runtime-loaded dependency).
- Map labels and strokes must be sized in screen pixels while zooming (`--u` in `map.js`), or they balloon.
- In the canon graph, a card's year is real; lanes may nudge a card ≤2.5 years to avoid a new lane — keep that documented if you keep it.
- Headless Chrome quirks if you verify that way: `scrollTo` dispatches no scroll events, animations don't advance after load, `--dump-dom` returns only the top document, harness iframes must be same-origin.
