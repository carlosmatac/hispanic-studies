# Roadmap

Progress lives in the GitHub issues (open/closed) and their PRs. This file is the plan: what, who, in which order. Update it in a PR when the plan changes.

**Goal now:** one consolidated, functional, map-led direction (`proposals/o-atlas/`) built on the data Beltrán handed over. The first meeting happened on 2026-10-14; see [`docs/meeting/2026-10-14-decisions.md`](docs/meeting/2026-10-14-decisions.md). Stack, CMS, payments and merch are still parked.

## Phase 1: before the first meeting — done

| Order | # | Task | Area | Depends on |
| --- | --- | --- | --- | --- |
| 1 | [#1](https://github.com/carlosmatac/hispanic-studies/issues/1) | Repo methodology: branches, PRs, issues, lanes | infra | nothing |
| 2 | [#2](https://github.com/carlosmatac/hispanic-studies/issues/2) | Research: context, brand audit, iconography, meeting questions | research | nothing |
| 3 | [#3](https://github.com/carlosmatac/hispanic-studies/issues/3) | Shared glyph-field engine (castle.tech-style) | shared | nothing |
| 4 | [#4](https://github.com/carlosmatac/hispanic-studies/issues/4) | Proposal A: Archivo de Indias | proposals | #3 |
| 4 | [#5](https://github.com/carlosmatac/hispanic-studies/issues/5) | Proposal B: Baroque Modernity | proposals | #3 |
| 4 | [#6](https://github.com/carlosmatac/hispanic-studies/issues/6) | Proposal C: Hispanorientalism | proposals | #3 |
| 5 | [#7](https://github.com/carlosmatac/hispanic-studies/issues/7) | Proposals gallery and meeting kit | proposals, meeting | #4, #5, #6 |

Status: #1–#7, #17, #20–#23, #29 and #31 all done and merged. Open `make serve` → http://localhost:8000/proposals/ for the gallery.

### Unicorn Studio directions (D–K) and the video/painted heroes (L–N)

Eight concept pages from `docs/research/unicorn-inspiration.md`, shown as a second row in the gallery. Lighter than A–C: hero + pamphlet signup, then the idea, effect stack, palette, type, merch spin-off and the without-Unicorn viability.

| Order | # | Task | Area | Depends on |
| --- | --- | --- | --- | --- |
| 6 | [#17](https://github.com/carlosmatac/hispanic-studies/issues/17) | Unicorn Studio research: eight directions D–K | research | nothing |
| 7 | [#20](https://github.com/carlosmatac/hispanic-studies/issues/20) | E Real de a Ocho, F Retablo, G La Tela as Unicorn scenes + pages | proposals | #17 |
| 7 | [#21](https://github.com/carlosmatac/hispanic-studies/issues/21) | D Tenebrismo, H Azulejo (own code) | proposals | #17 |
| 7 | [#22](https://github.com/carlosmatac/hispanic-studies/issues/22) | I Códice, J Meninas 2.5D, K Carta Universal (own code) | proposals | #17 |
| 8 | [#23](https://github.com/carlosmatac/hispanic-studies/issues/23) | Gallery row for D–K, viability without Unicorn, roadmap | proposals, research | #20, #21, #22 |
| 9 | [#29](https://github.com/carlosmatac/hispanic-studies/issues/29) | L Tercios: full-bleed video hero | proposals | #23 |
| 9 | [#31](https://github.com/carlosmatac/hispanic-studies/issues/31) | M painted heroes, N living painting | proposals | #23 |

Unicorn scenes (design "IHS · Retablo"): F `i3aobKyq9iTzOiIxTUmC`, G `UJRE2hLiycqZZq3f0FSI`, E `l6rw6IMwqGGf3MEJJc9B`. Editor links in #20.

All fourteen directions were shown to Beltrán on 2026-10-14. They stay in the repo as the record of what he saw and are no longer maintained; what he kept from each is in [`docs/meeting/2026-10-14-decisions.md`](docs/meeting/2026-10-14-decisions.md#what-survives-from-an).

## Phase 2: the consolidated direction (current)

Beltrán liked every direction A–N and rejected the register: *"demasiado bonito… lo veo para un museo, para una galería"*, *"yo quiero algo más militante"*. He asked for a mix rather than a winner — *"piensa en las cosas que te han gustado de cada uno, las coges y lo montas tú"* — with the **map** as the first screen and the **canon** as the proof. He also handed over five documents (`docs/provided-documentation/`) that between them contain the whole content spine: 267 authors, 60 map-storyboarded milestones, 94 events and a 50-book publishing programme.

Read before starting anything:

| Document | What it settles |
| --- | --- |
| [`docs/meeting/2026-10-14-decisions.md`](docs/meeting/2026-10-14-decisions.md) | What he decided, quoted, with timestamps |
| [`docs/brand/brand-plan.md`](docs/brand/brand-plan.md) | Three pillars, three colour registers, type, motion budget, IA |
| [`docs/brand/imagery-and-rights.md`](docs/brand/imagery-and-rights.md) | What may ship as an image, and what may not |
| [`docs/research/provided-documentation.md`](docs/research/provided-documentation.md) | The five files and what each is for |
| [`docs/research/cartography.md`](docs/research/cartography.md) | Why we draw our own map, and from what |

| Order | # | Task | Area | Depends on |
| --- | --- | --- | --- | --- |
| 1 | [#34](https://github.com/carlosmatac/hispanic-studies/issues/34) | Phase 2 kickoff: decisions, brand plan, backlog | research, brand | nothing |
| 2 | [#47](https://github.com/carlosmatac/hispanic-studies/issues/47) | Ask Beltrán the twelve open questions | meeting | #34 |
| 2 | [#35](https://github.com/carlosmatac/hispanic-studies/issues/35) | Canon dataset → web-ready data | data, shared | #34 |
| 2 | [#36](https://github.com/carlosmatac/hispanic-studies/issues/36) | Cartographic base: Natural Earth, Equal Earth | data, shared | #34 |
| 2 | [#38](https://github.com/carlosmatac/hispanic-studies/issues/38) | Brand tokens, type scale, pillar glyphs | brand, shared | #34 |
| 3 | [#37](https://github.com/carlosmatac/hispanic-studies/issues/37) | Source the Tier-1 image set | research | #34 |
| 3 | [#39](https://github.com/carlosmatac/hispanic-studies/issues/39) | O Atlas: shell, nav, EN/ES, pamphlet signup | site | #38 |
| 4 | [#40](https://github.com/carlosmatac/hispanic-studies/issues/40) | O Atlas: hero map | site | #36, #39 |
| 4 | [#41](https://github.com/carlosmatac/hispanic-studies/issues/41) | O Atlas: `/atlas` — 60 stepped map frames | site | #35, #36, #39 |
| 4 | [#42](https://github.com/carlosmatac/hispanic-studies/issues/42) | O Atlas: `/canon` — the 50 authors | site | #35, #39 |
| 4 | [#43](https://github.com/carlosmatac/hispanic-studies/issues/43) | O Atlas: `/books` — De Indiis Editions | site | #35, #37, #39 |
| 4 | [#44](https://github.com/carlosmatac/hispanic-studies/issues/44) | O Atlas: Watch, Read, three pillars | site | #38, #39 |
| 4 | [#45](https://github.com/carlosmatac/hispanic-studies/issues/45) | O Atlas: Mission, Community, Merch | site | #38, #39 |
| 5 | [#46](https://github.com/carlosmatac/hispanic-studies/issues/46) | Verification: mobile, reduced motion, a11y, perf | site | #39–#45 |

#35, #36 and #38 are independent of each other and can run in parallel. #40–#45 are each self-contained inside `proposals/o-atlas/`, so they can be split between us once #39 has landed the shell.

Proposals A–N stay in the repo as the record of what he was shown. They are not maintained.

## Parked until he decides

| # | Decision |
| --- | --- |
| [#8](https://github.com/carlosmatac/hispanic-studies/issues/8) | Stack: keep WordPress on Hostinger, move to Next.js on Vercel, or Shopify for the store |
| [#9](https://github.com/carlosmatac/hispanic-studies/issues/9) | Payments, merch catalogue and fulfilment (Printify / Tapstitch) |

He gave no opinion on either in the first meeting. He did raise migrating the Substack here and parked it himself — *"da igual, eso es otro tema"* — so that belongs to #8 when it unparks.

## Phase 3: after he sees the consolidated direction

Turn his reaction into issues. The likely shape: content entry for real books and the pamphlet, the stack decision, then payments. His own pacing instruction: *"velo como una carrera de fondo, más que como un sprint"*.
