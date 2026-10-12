# Roadmap

Progress lives in the GitHub issues (open/closed) and their PRs. This file is the plan: what, who, in which order. Update it in a PR when the plan changes.

**Goal this week:** walk into the first meeting with Beltrán with context and three clickable design directions. No stack, CMS, payments or merch work until he has told us what he wants.

## Phase 1: before the meeting

| Order | # | Task | Area | Depends on |
| --- | --- | --- | --- | --- |
| 1 | [#1](https://github.com/carlosmatac/hispanic-studies/issues/1) | Repo methodology: branches, PRs, issues, lanes | infra | nothing |
| 2 | [#2](https://github.com/carlosmatac/hispanic-studies/issues/2) | Research: context, brand audit, iconography, meeting questions | research | nothing |
| 3 | [#3](https://github.com/carlosmatac/hispanic-studies/issues/3) | Shared glyph-field engine (castle.tech-style) | shared | nothing |
| 4 | [#4](https://github.com/carlosmatac/hispanic-studies/issues/4) | Proposal A: Archivo de Indias | proposals | #3 |
| 4 | [#5](https://github.com/carlosmatac/hispanic-studies/issues/5) | Proposal B: Baroque Modernity | proposals | #3 |
| 4 | [#6](https://github.com/carlosmatac/hispanic-studies/issues/6) | Proposal C: Hispanorientalism | proposals | #3 |
| 5 | [#7](https://github.com/carlosmatac/hispanic-studies/issues/7) | Proposals gallery and meeting kit | proposals, meeting | #4, #5, #6 |

Status (2026-10-12): #1–#7 done. Open `make serve` → http://localhost:8000/proposals/ for the gallery.

### Unicorn Studio directions (D–K)

Eight concept pages from `docs/research/unicorn-inspiration.md`, shown as a second row in the gallery. Lighter than A–C: hero + pamphlet signup, then the idea, effect stack, palette, type, merch spin-off and the without-Unicorn viability.

| Order | # | Task | Area | Depends on |
| --- | --- | --- | --- | --- |
| 6 | [#17](https://github.com/carlosmatac/hispanic-studies/issues/17) | Unicorn Studio research: eight directions D–K | research | nothing |
| 7 | [#20](https://github.com/carlosmatac/hispanic-studies/issues/20) | E Real de a Ocho, F Retablo, G La Tela as Unicorn scenes + pages | proposals | #17 |
| 7 | [#21](https://github.com/carlosmatac/hispanic-studies/issues/21) | D Tenebrismo, H Azulejo (own code) | proposals | #17 |
| 7 | [#22](https://github.com/carlosmatac/hispanic-studies/issues/22) | I Códice, J Meninas 2.5D, K Carta Universal (own code) | proposals | #17 |
| 8 | [#23](https://github.com/carlosmatac/hispanic-studies/issues/23) | Gallery row for D–K, viability without Unicorn, roadmap | proposals, research | #20, #21, #22 |

Unicorn scenes (design "IHS · Retablo"): F `i3aobKyq9iTzOiIxTUmC`, G `UJRE2hLiycqZZq3f0FSI`, E `l6rw6IMwqGGf3MEJJc9B`. Editor links in #20.

Proposals A, B and C are independent: each person can take one (reassign the issue) and work in its folder without touching the others.

## Parked until the meeting

| # | Decision |
| --- | --- |
| [#8](https://github.com/carlosmatac/hispanic-studies/issues/8) | Stack: keep WordPress on Hostinger, move to Next.js on Vercel, or Shopify for the store |
| [#9](https://github.com/carlosmatac/hispanic-studies/issues/9) | Payments, merch catalogue and fulfilment (Printify / Tapstitch) |

## Phase 2: after the meeting

Write the notes in `docs/meeting/`, turn every decision into an issue, unpark #8 and #9, and pick one direction (or a mix) to develop.
