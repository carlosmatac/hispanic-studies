# Handoff: round 3, moving to Windows (2026-10-29)

Carlos is moving from Linux to Windows (the Linux disk kept filling up). This file is the state of the work at the end of round 3, how Carlos likes to work, what is waiting on whom, and how to set the project up again. Read it after `AGENTS.md`, which stays the source of truth for the rules.

The previous handoff is `docs/handoff/2026-10-20-real-project.md`.

## 1. How Carlos works (read this first)

- **Language.** Carlos speaks Spanish: talk to him in Spanish. Code, comments, commits, PRs, issues and docs are in English. Site copy is EN + ES (`site/lib/i18n.ts`).
- **Don't fill him with questions.** "Decide con criterio, entrega y yo corrijo." Take reasonable decisions, say which ones you took, and list only what truly needs him or Beltrán. When you do need answers, give one ordered, short list.
- **Short updates.** Start every reply with the outcome. Plain words, no jargon he would have to decode, no padding. He is often busy or away.
- **Real content only.** Never invent figures, books, names, quotes or prices. Never show the proposed introducers/editors from the acquisitions workbook.
- **Images** only with source and licence logged in `assets/art/SOURCES.md` (texts in `docs/archive-sources.md`). AI images are allowed for places and atmospheres, never as fake historical scenes; credit them as generated.
- **Verify before saying "done".** Real screenshots at 1440 and 390 wide, EN and ES, production build, reduced motion, no console errors, no horizontal scroll. Look at the screenshots yourself.
- **Merge as work lands.** Squash-merge each verified round promptly once Carlos is happy, so `main` is always current. Deploy only when he asks.
- **Orchestrate.** Rounds are big. Carlos expects the main agent to stay an orchestrator and keep its own context light: launch subagents (in parallel, in git worktrees, one issue = one branch = one PR each) with a full brief, check their screenshots, relay results to Carlos in short. Sessions are very long; don't wrap up early.
- **He reviews by looking.** Keep the site running on localhost for him (`site/`, `npm run dev`, http://localhost:3000). If a branch is not merged yet, he will not see it on :3000: run that branch's dev server on another port and tell him the URL.
- **Never print the preview password.** It lives only in Vercel (`SITE_PASSWORD`, secret). Carlos knows it.
- **Style he likes and has rejected** is recorded per section in `AGENTS.md` (one cream paper all the way down with burgundy/leather as ornament; the pillars fresco; the glass title page; the footer blind; and the "rejected" lists). Respect those lists.

## 2. Where we are (end of round 3)

Round 3 came from Beltrán's three voice notes after he saw the preview (he loved it: "súper profesional, exquisito").

### Merged into `main`
- **#65** round 2 (lighter home, glass title page, epigraph over the Valley of Mexico, pillars fresco, footer blind, one-paper page).
- **#74** home fixes (#66): title glyphs no longer clipped; channels band right under the pillars; one serif for all video titles; Substack cover per essay; Mestizaje now Cabrera's *De español e india, mestiza*.
- **#75** reel (#67): Beltrán's whole pueblos mágicos sentence plays; the film is 75.35 s (a music phrase loops once; seam at about 20.8 s — **a human should listen to it**). The clip `pueblos.mp4` is git-ignored (see §4).

### Open PRs (finished by their agents; review, then merge on Carlos's ok)
- **#76 Archive of Hispanic thought** (#68 + #69), still a draft only because the CMS's GitHub mode waits for Beltrán's account; the archive itself is complete and verified (240 page loads, EN/ES, 390/1440). The canon became an archive: one Markdown file per work in `site/content/archive/`, `/[lang]/archive` shelf and `/[lang]/archive/<id>` reader, `/canon` redirects. **59 works**: 50 from the compiler + 9 in a new Prelude (Vitoria, Las Casas, Sepúlveda, Acosta, Inca Garcilaso, Guaman Poma, Solórzano, Clavijero, Viscardo).
  - **9 full texts hosted**: Acosta, Bolívar (*Carta de Jamaica*, 1833 text), Bello (prologue only), *Os brahamanes* (ELTeC, CC BY), Rizal, Martí (to collate with the *Obras completas* vol. 6), Unamuno, Mariátegui, Rodó (*Ariel*, Gutenberg 1920).
  - **25 public domain but scans only** (`needsTranscription`), **25 records with legitimate links only** (in copyright, or free only in the US or only outside it; each record says when it becomes free in Spain, e.g. Henríquez Ureña 1 Jan 2027).
  - Cards coloured by region with a legend; Keystatic CMS at `/keystatic` (local mode works, see `docs/cms.md`); tools `tools/ingest-text.py` (Wikisource, Gutenberg, TEI) and `tools/apply-archive-research.mjs`; every hosted text logged in `docs/archive-sources.md`; research in `docs/research/archive-rights/`.
  - Known quirks: the CMS Year field shows "1,891" while typing (saves 1891); Acosta's page is heavy (2.1 MB, 0.7 MB compressed), one page per book later.
- **#77 Atlas historical borders** (refs #71), ready. 20 keyframes 1492–1898 (Santa Fe, Tordesillas … Guadalupe Hidalgo 1848, Paris 1898) from OpenHistoricalMap (CC0), pinned ids in `site/data/atlas-eras.json`, built by `tools/build-atlas-eras.py`; cross-fades and pulses, a year slider with act + source under the map (the accessible version), reduced motion = instant swaps. HGIS not used. The fog-of-war reveal is for later (#71 stays open). Known: on desktop the Philippines sit under the tour card at the right edge.
- Both PRs touch shared pieces (`area:shared`) and both already merged main (#74, #75). Merge one, then `git merge origin/main` into the other (expect conflicts only in `AGENTS.md`, `i18n.ts`, `globals.css`, `assets/art/SOURCES.md`).

### Open issues of this round
- #68 archive, #69 CMS, #71 Atlas (in the PRs above).
- **#70 AdSense** — not started; waits for the publisher id. Plan: ad slots in the archive reader (places already marked), `ads.txt`, script behind an env var, Google's own consent message (AdSense Privacy & messaging) for EEA/UK.
- **#72 Patreon-only PDF downloads** — parked (Carlos: "déjalo como un todo"). **Remind Carlos about it at the end of the next round.**
- **#73 custom typeface** — parked until Beltrán's designer sends it.

### The last deploy
Preview for Beltrán: https://hispanostudies-preview.vercel.app (password gate, `site/proxy.ts`). Vercel project `hispanostudies-preview`, team `carlos-projects-3203b073`. Deploy from `site/`: `vercel deploy --prod --yes` (only when Carlos asks). The deploy on 2026-10-26 had round 2; round 3 is not deployed yet.

## 3. Waiting on Carlos or Beltrán (give Carlos one ordered list)

**Needed to continue**
1. **Beltrán's manifesto / mission statement** (EN + ES). Not in any Drive folder we can see; Carlos is asking Beltrán. Then: a short summary in About and the full text on `/[lang]/mission` (space marked in the code). Don't write any copy for it.
2. **Beltrán's GitHub username**, so he can edit the archive in Keystatic; Carlos creates the GitHub App and the Vercel env vars (`docs/cms.md`).
3. **Decision:** Beltrán's CMS saves go straight to `main` (only `site/content/`) or through branches + PRs. Recommendation: straight to `main` for content only. For saves to appear on the site by themselves, connect the Vercel project to the GitHub repo (today we deploy by hand).
4. **AdSense publisher id** (`ca-pub-…`) for #70.

**To confirm (Beltrán)**
5. Regions: Ndongo (Equatorial Guinea) is under Spain — or a seventh region "Hispanic Africa"? Las Casas under Spain (moved from the Caribbean on the research's advice)? Goa under Ibero-Asia? Central America (Arosemena, Sandino, Masferrer) under North America?
6. Atlas (also in the PR #77 body): the 20 keyframes (dropped from the study: Zaragoza 1529, the Iberian Union, Utrecht 1715, Santo Domingo 1861–65); Ryswick 1697 (the Hispaniola border was only fixed in 1776–77); the exact date Chile left Peru (1798?); level of detail (viceroyalties/captaincies only, or audiencias); hatching for claimed lands (Alaska, Patagonia); where his decade maps come from.
7. The Substack cover of "Aryan Indigenismo and Manifest Destiny" is a 1938 Nazi youth magazine (*Der Pimpf*), now visible on the home's Read section. Beltrán's own choice; confirm it is fine there.

**Rights calls (Carlos)**
8. Works public domain only in the US or only outside it (Tamayo, García Calderón, Altamira, Ugarte, Rojas, Vasconcelos, Henríquez Ureña — PD in Spain on 1 Jan 2027 —, Maeztu, Sandino): today records with links only. Tamayo could be hosted under the EU "rule of the shorter term" (PD in Bolivia since 2007). Keep the prudent rule unless Carlos says otherwise.
9. Optional: ask the Museo de América for permission to use Arellano's *Mujer chichimeca* (the painting Beltrán wanted for Mestizaje): `docs/research/mestizaje-painting.md`.
10. Optional: email Werner Stangl (HGIS de las Indias, Graz) about commercial use of his data (used today only as a reference). An agent can draft it.

**To check by ear or eye**
11. Listen to the reel around 20.8 s (music loop seam).
12. The prompts of the two AI images (the valley behind the epigraph, the footer's HISPANO STUDIES picture) were not recorded: `assets/art/SOURCES.md` has **[check]** on them. Ask Carlos for tool and prompt.

**Later work**
13. Archive: 25 public-domain texts still to transcribe (flagged `needsTranscription`, Las Casas 1552 among them); Bello's and Darío's "related writings" and Hostos's selection need an editorial choice; Martí to collate.
14. Fog-of-war Atlas (after Beltrán reviews the borders).
15. #72 Patreon PDFs (remind), #73 typeface (when it arrives).
16. When #76 and #77 are merged: deploy the preview for Beltrán (on Carlos's word).

## 4. Setting up again on Windows

Git only carries what is committed. **Before wiping Linux, copy these git-ignored folders** (the 872 GB NTFS partition on the same disk is the easiest place; Windows can read it):
- `film/media/` (1.8 GB, Beltrán's raw footage, catalogued in `film/MATERIAL.md`)
- `film/reel/assets/clips/` (cropped clips, incl. the new `pueblos.mp4`; `film/tools/fetch-clips.sh` can rebuild most of them)
- `film/reel/assets/img/period/` (originals of the period images; every URL is in `assets/art/SOURCES.md`)
- `film/reel/renders/v7-mix.mp4` (the last mixed render, optional)

Then on Windows:
1. Git, GitHub CLI (`gh auth login`), Node 22 LTS (the site needs ≥ 20.9; HyperFrames wants 22). Clone `carlosmatac/hispanic-studies`.
2. Site: `cd site && npm ci && npm run dev` → http://localhost:3000 (redirects to /en). Checks: `npm run lint`, `npm run typecheck`, `npx next build`, `npx next start -p 3100`.
3. Vercel: `npm i -g vercel`, `vercel login`, then in `site/`: `vercel link --project hispanostudies-preview` (team `carlos-projects-3203b073`).
4. Screenshots for verification: Playwright (`npm i -D playwright` in a scratch folder + `npx playwright install chromium`, or point it at the installed Chrome).
5. Film (only if the reel needs work): Python 3.12+ with a venv holding `numpy scipy pillow soundfile pyloudnorm faster-whisper librosa`; `ffmpeg` on PATH; HyperFrames via `npx --yes hyperframes@0.8.185` with `DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1` (see `film/reel/SPEC.md`). The Linux venv path `~/.venvs/film` in old notes becomes wherever you create it. Bash scripts (`fetch-clips.sh`) need Git Bash or WSL.
6. Claude Code memory does not travel: everything it remembered about Carlos is in §1 of this file.

## 5. Prompt for the next agent

See `docs/handoff/next-agent-prompt.md` (the same text Carlos pastes to start the next session).
