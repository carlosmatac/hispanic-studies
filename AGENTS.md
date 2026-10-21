# AGENTS.md: Institute for Hispano Studies (IHS) website

Instructions for every coding agent (Claude Code, Codex, Cursor, Devin…) and for both humans working in this repo. Read it fully at the start of every session.

## What this is

The website for **Beltrán Arellanes** and his **Institute for Hispano Studies** (hispanostudies.com, @hispano_studies). The mockup phase is over: since 2026-10-20 we build **the real site**, a Next.js app in `site/`, deployed later on Vercel (decision in issue #8).

Decided (handoff: `docs/handoff/2026-10-20-real-project.md`):
- **Direction: O · Atlas** (`proposals/o-atlas/` on the mockup branches): the sober reference-work register Beltrán asked for.
- **Colours: his existing brand, unchanged** — burgundy `#470B15` / `#2F070D`, paper `#F9F3DD` / `#EDE3C8`, ink `#28231E` (plus his `leather` `#8B5E4B`, used only on the map). Tints of these are fine; new hues are not. **No theme switcher.** One exception, decided 2026-10-21: **gold leaf** (`--gold*` tokens) for the gilding of the pillars and the motto on their frieze, nowhere else.
- From P · Tornaviaje only two things came over: the **footer** and the **canon as a React Flow graph**.

Still parked (do not build on a guess): CMS/editing, payments and merch (#9), the newsletter provider behind the pamphlet signup, the Discord invite link.

| Folder | What | Owner |
| --- | --- | --- |
| `site/` | **The real site**: Next.js (App Router, TypeScript) | both, through PRs |
| `site/app/[lang]/` | Routes, one tree per language (`/en`, `/es`) | both |
| `site/components/` | Page components; `canon/` is the React Flow canon graph | both |
| `site/lib/` | `i18n.ts` (every string, EN + ES), `content.ts` (real videos, essays, channels), `atlas-map.js` (the map plate) | both |
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

- **Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, plain CSS (custom properties, no CSS framework). `@xyflow/react` for the canon graph, `d3-geo` + `topojson-client` for the map. Versions are pinned exactly in `site/package.json`; upgrade deliberately, in its own PR.
- **Colours and fonts** are tokens at the top of `site/app/globals.css`. Only the brand colours above, or `color-mix()` tints of them. Fonts (Ibarra Real Nova, Inter, IBM Plex Mono) come from `next/font` in `app/[lang]/layout.tsx`.
- **EN/ES**: every string we author lives in `site/lib/i18n.ts`; the Spanish table is typed against the English one, so a missing translation fails the build. Third-party content (video and essay titles, the compiler's canon records) stays in its original language.
- **Real content only**: Beltrán's videos, essays and numbers (`site/lib/content.ts`, `docs/research/context.md`); never invent books, people, prices, numbers or quotes. Followings we have: YouTube 13.5K, Instagram 19K, X 22K, Substack 587; none for TikTok or Patreon. Placeholder copy must look like placeholder (`[The store is not connected yet]`).
- **Never show the proposed introducers/editors** from the acquisitions workbook: they are real scholars who agreed to nothing.
- **Images**: only public-domain or properly licensed sources, logged in `assets/art/SOURCES.md` before they ship. Beltrán's Drive folder is a moodboard only.
- **Motion**: respect `prefers-reduced-motion` everywhere; every animation has a still state; reveals must fail open (content can never stay hidden because a script or a feature is missing).
- **Homepage order** follows the Atlas direction: map hero + pamphlet signup → three pillars → Atlas → canon → books → watch → read → about → community → merch → footer.
- **Deploys**: the target is Vercel (project root `site/`). Do not connect or deploy until the user asks for it.

## The canon graph (`site/components/canon/`)

- `layout.ts` builds the field: **x = year, y = Bueno band**, nothing auto-arranged (a card may slide ≤ 2.5 years right to avoid a new lane; it always prints its own date).
- Background layers (bands, decade rules, ruptures, movements) are **not React Flow nodes**; they are drawn in `FieldUnderlay` under the graph. In the HTML mockup they were nodes, and a hover rule lifted a band over every card in its row, which is why clicks stopped working after the first one. Keep it that way; the full story is in `canon.css`.
- Selection is our own state keyed by id (`elementsSelectable={false}`); clicking a neighbour in the panel moves the camera to it.
- Edge strokes use `vector-effect: non-scaling-stroke`, and the graph's SVGs are exempt from the global `svg { max-width: 100% }` (it squashes React Flow's edge layer to zero width and nothing paints).

## The pillars (`site/components/Pillars.tsx`, `site/components/pillars/`, `tools/blender/`)

- Three **column types** of the Hispanic world, one per pillar, modelled by us in Blender by code: the Andean barroco mestizo column (mestizaje), the Solomonic column with the eucharistic vine (catolicismo), the plateresque balaustre after Sagredo (lengua). Types, not copies of one building; the page says so (`pillars.method` in `i18n.ts`). Change them in `tools/blender/`, never by hand-editing frames, and never with generated imagery.
- Each plate is a 36-frame turntable (gilded render + clay pass). `EngravedPlate.tsx` turns the column with the scroll, engraves it from the clay pass, then gilds it; the pointer turns it a little more. Underneath, `still.webp` is all that shows with reduced motion, without WebGL2, or before the frames load.
- In headless tests, launch Chrome with `--enable-unsafe-swiftshader` and scroll with `behavior: 'instant'` (the page smooth-scrolls).

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
- For the canon graph: click several nodes in a row (across empty band space), jump to a neighbour from the panel, open and close full screen (Esc).
- Screenshot it and attach it to the PR.

## When you finish a session

- Push your branch and leave the PR in a clear state (draft with what is left, or ready).
- Comment on the issue with progress or blockers.
- If the plan changed, update `ROADMAP.md` in a small PR and create or edit the issue. Issue state (open/closed) is the source of truth for progress.

## Conventions

- Code, comments, commits, PRs and issues in English. Talk to the user in the language they use. Site copy in English and Spanish (`site/lib/i18n.ts`).
- CSS custom properties for every colour and font, at the top of `site/app/globals.css`.
- File names in kebab-case.
