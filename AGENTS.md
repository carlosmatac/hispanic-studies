# AGENTS.md: Institute for Hispano Studies (IHS) proposals

Instructions for every coding agent (Claude Code, Codex, Cursor, Devin…) and for both humans working in this repo. Read it fully at the start of every session.

## What this is

Pitch material for **Beltrán Arellanes** and his **Institute for Hispano Studies** (hispanostudies.com, @hispano_studies): website, payments, merch and brand. Right now we **only mock up**: self-contained HTML pages, each one a different brand/design direction, to show at our first meeting with him. Nothing here is production code yet, and we do not build anything that depends on decisions Beltrán has not made (stack, CMS, payments, merch catalogue). Those issues carry the `parked` label.

Every decision should serve the meeting: three strong, clearly different directions that open in a browser and look finished beat a half-built app.

| Folder | What | Owner |
| --- | --- | --- |
| `proposals/<id>/` | One design direction per folder (`a-archivo/`, `b-barroco/`, `c-galeon/`…): `index.html` plus its own CSS/JS/images | the **assignee of that proposal's issue** |
| `proposals/shared/` | Code used by several proposals (glyph-field engine, fonts, shared content) | **shared**: changes need the other person's review |
| `proposals/index.html` | Gallery linking every proposal | shared |
| `docs/research/` | Context, brand audit, iconography | both |
| `docs/meeting/` | Questions and notes for/from Beltrán | both |
| `docs/brief/` | The developer brief Beltrán received (reference, do not edit) | nobody |
| `assets/` | Brand files, research screenshots, public-domain art sources | both (add, don't overwrite) |

## Start of every session (do this before writing anything)

1. Who am I working for? `gh api user --jq .login`.
2. Sync: `git fetch origin --prune` and `git status`. If you are on a branch, merge main into it (see "Staying in sync").
3. Context: read `ROADMAP.md`, then the open work:
   - `gh issue list --assignee @me --state open`
   - `gh pr list --state open` (what the other person has in flight)
   - `git log --oneline origin/main -15` (what landed recently)
4. Pick up the issue the user asks for, or the lowest-numbered open issue assigned to them whose dependencies are closed. The issue's checklist is the scope. Skip `parked` issues.
5. Work only inside the folders you own (table above). Need a change in someone else's proposal or in `proposals/shared/`? Stop and tell the user; propose a small separate PR or an issue comment instead of editing it silently.

## Git workflow (mandatory)

- **Never commit to `main` directly.** Every change goes through a branch and a pull request.
- **One issue = one branch = one PR.** Branch from the latest `origin/main`:
  `git switch -c <type>/<issue>-<slug> origin/main`, e.g. `feat/4-proposal-archivo`, `docs/2-research`, `chore/1-repo-methodology`.
  Types: `feat`, `fix`, `chore`, `docs`, `refactor`.
- Commit small and often, with clear messages (`proposal-a: hero with the Guadalupe glyph field`). Push early: `git push -u origin HEAD`, so the other person can see the work.
- Open the PR as soon as there is something to look at (draft is fine): `gh pr create --fill --draft`, then fill in the template. The body must include `Closes #<issue>`.
- Before marking the PR ready: merge main in again and check the pages in the browser (see "Verification").
- **Merging**: squash merge (`gh pr merge --squash --delete-branch`).
  - PRs that only touch your own proposal (or docs) can be merged by you.
  - PRs touching `proposals/shared/` get the `area:shared` label and need the other person's approval.
- Never force-push to `main`. Never rewrite someone else's branch. Never commit secrets.

## Staying in sync with the other person's work

There is no staging environment: `main` is the only place our work meets. **Integrate early and often:**

- Merge main into your branch at the start of every session, before opening or updating a PR, and whenever the other person merges something you depend on: `git fetch origin && git merge origin/main`
- Use merge, not rebase, on branches that are already pushed.
- Resolve conflicts keeping both people's intent. If a conflict is in the other person's folder, ask before choosing a side.
- Keep PRs small so they land fast.

## Issues are the documentation

- Every piece of work has an issue with a checklist. Decisions, links, screenshots and open questions go in issue comments: `gh issue comment <n> --body "..."`.
- Anything that depends on Beltrán goes in an issue labelled `parked` (or `meeting` for meeting input/output) instead of being built on a guess.
- After the meeting, write the notes in `docs/meeting/` and turn every decision into an issue.

Labels: `area:proposals`, `area:shared`, `area:research`, `area:infra`, `meeting`, `parked`.

## Mockups: rules of the game

- **Plain HTML, CSS and JS. No frameworks, no build step, no npm.** A proposal must open with `make serve` and nothing else. Google Fonts and pinned CDN files are fine.
- **No deploys.** Do not connect the repo to Vercel or any host until a decision issue says so.
- Each proposal is self-contained: its own `style.css`/`main.js`/images inside its folder, plus whatever it imports from `proposals/shared/`.
- Use **real content** (Beltrán's video titles, Substack essays, numbers from `docs/research/context.md`); never invent books, people, prices or quotes. Placeholder copy must look like placeholder (`[Pamphlet cover]`).
- Images: only public-domain or properly licensed sources, saved in `assets/art/` with their source and licence in `assets/art/SOURCES.md`.
- Respect `prefers-reduced-motion`; every animation has a still fallback.
- Follow the brief's homepage order (hero + pamphlet signup → books → videos/essays → mission → community → footer) and navigation (Watch · Read · Books · About · Merch, EN/ES switch, cart) so proposals are comparable.

## Unicorn Studio (WebGL scenes)

Some proposals are built as Unicorn Studio scenes and embedded with `<div data-us-project="ID">` + the SDK. Inspiration and plan: `docs/research/unicorn-inspiration.md`.

- Connect the MCP (each person, each tool, logs in separately):
  - Devin: `devin mcp add unicorn-studio https://agentmcp-qbght5huyq-uc.a.run.app/mcp` (saved to `.devin/mcp_config.local.json`, not committed)
  - Claude Code: `claude mcp add --transport http unicorn-studio https://agentmcp-qbght5huyq-uc.a.run.app/mcp`
- The agent only works on a design open in the browser with **Allow agents** on (lock icon on the "Connected" button in the editor's top bar).
- The Free plan has **200 agent changes a month** and 8 branded publishes, non-commercial only. Read-only calls are free. Before a large build, check `agentChanges` in `get_editor_state`; one scene per proposal, one Unicorn design per proposal (`IHS · <id>`); write the scene's project ID and editor URL in the proposal's issue.
- Production: publish the final scenes from a Legend account (commercial licence, no watermark; one month is enough, published scenes survive cancellation) and self-host the exported JSON with the site. Details in `docs/research/unicorn-inspiration.md`.

## Local preview

```bash
make serve          # http://localhost:8000 → proposals/index.html (gallery)
make serve PORT=8080
```

WebGL can't read images from `file://`, so always open pages through `make serve`.

## Verification before you say "done"

- Open the page through `make serve` in a desktop width (1440) and a mobile width (390); no console errors.
- Check the animation with reduced motion on (DevTools → Rendering → prefers-reduced-motion).
- Screenshot it and attach it to the PR.

## When you finish a session

- Push your branch and leave the PR in a clear state (draft with what is left, or ready).
- Comment on the issue with progress or blockers.
- If the plan changed, update `ROADMAP.md` in a small PR and create or edit the issue. Issue state (open/closed) is the source of truth for progress.

## Conventions

- Code, comments, commits, PRs and issues in English. Talk to the user in the language they use. Copy on the mockups in English (Beltrán's audience), with Spanish where the proposal is about bilingualism.
- CSS custom properties for every colour and font, at the top of each proposal's `style.css`.
- File names in kebab-case.
