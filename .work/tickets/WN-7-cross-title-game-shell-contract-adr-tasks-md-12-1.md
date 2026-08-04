---
id: WN-7
title: "Cross-title game shell contract ADR (TASKS.md 12.1)"
status: needs-research
kind: feature
priority: low
created: 2026-08-04
deps: []
blocked_by: []
---

## Goal
Write the ADR that defines the boundary between reusable party-game orchestration and
wing-night-specific gameplay, per TASKS.md 12.1. This is direction-setting architectural work —
kept at `needs-research` deliberately; do not promote without a supervised planning session.

Audit evidence (2026-08-04):
- No such ADR exists — `docs/adr/` holds only ADR-0001 (minigame modular boundary),
  ADR-0002/0003 (readability epics).
- The de-facto boundary today: contracts in `packages/minigames/core` (plugin interface),
  shared registration via `MINIGAME_DEFINITIONS` in
  `packages/shared/src/content/gameConfig/index.ts` (typecheck-enforced registry maps),
  orchestration in `apps/server/src/minigames/runtime` + `apps/server/src/roomState` (i.e.
  the reusable engine still lives inside the wing-night app).
- Real cross-title consumers already exist as unmerged branches: book-club game variants
  (e.g. `claude/blood-meridian-book-club-games-39072b`, `claude/1984-book-club-games-454c7c`,
  `claude/enders-game-book-club-6f87e4`, `claude/starship-troopers-book-club-d2c29a`) built
  for the July 2026 book-club night — they are the concrete evidence of what varies per title
  and should ground the ADR instead of hypotheticals.

Open questions to resolve in research (write answers into the ADR):
1. What exactly varies per title, judged from the book-club branches — phases? scoring?
   copy/theming? minigame roster? All of it?
2. Package targets and dependency direction: does `roomState`/phase machine move to a
   `packages/` boundary, or do titles fork the app shell and share only `packages/minigames/*`?
3. Compatibility/versioning policy between shell and minigame plugins
   (`minigameApiVersion` from 11.2 — is it actually enforced anywhere today?).
4. Migration sequence + checkpoints, and explicit non-goals (no persistence/network changes).

## Acceptance Criteria
- [ ] ADR-0004 accepted in `docs/adr/` with target module map, compatibility matrix,
      deprecation policy, phased migration checkpoints, and explicit non-goals
- [ ] ADR grounded in at least one real second title (book-club branches) — what it had to
      change is the boundary evidence
- [ ] TASKS.md 12.1 ticked with a pointer to this ticket
- [ ] `pnpm typecheck` passes (docs-only diff sanity)

## Plan
<filled at GATE 1 — this is what the human approves>

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- TASKS.md §12.1; `docs/adr/ADR-0001-minigame-modular-boundary.md`
- [[WN-8]] depends on this ADR
