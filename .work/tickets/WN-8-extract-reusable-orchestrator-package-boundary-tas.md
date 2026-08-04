---
id: WN-8
title: "Extract reusable orchestrator package boundary (TASKS.md 12.2)"
status: needs-research
kind: feature
priority: low
created: 2026-08-04
deps: [WN-7]
blocked_by: []
---

## Goal
Execute the extraction the WN-7 ADR decides: move generic party-game orchestration helpers
into a monorepo-local reusable package, keeping wing-night-specific scoring/phase adapters in
the app, preserving behavior while flipping the dependency direction (TASKS.md 12.2).
Architectural work — `needs-research` until WN-7's ADR lands; do not promote unsupervised.

Audit evidence (2026-08-04) of what would move vs stay (to be confirmed by the ADR):
- Candidate to extract: `apps/server/src/minigames/runtime` (registry-driven
  init/reduce/select/project/clear adapter, plugin-failure isolation) and the generic parts of
  `apps/server/src/roomState` (phase machine, timer lifecycle, turn cursor).
- Stays in-app: wing scoring (`wingParticipationByPlayerId`, pending points maps), sauce/round
  config semantics, host/display copy.
- Contracts already live in `packages/minigames/core` and `packages/shared` — the extraction
  largely re-homes orchestration, not contracts.

## Acceptance Criteria
- [ ] Orchestration helpers live in a monorepo-local package per the WN-7 ADR module map;
      wing-night adapters remain in `apps/server`
- [ ] No behavior change: socket contract and room-state invariants unchanged
- [ ] TASKS.md 12.2 ticked with a pointer to this ticket
- [ ] `pnpm typecheck` and `pnpm test` pass; `CI=1 pnpm test:e2e` passes

## Plan
<filled at GATE 1 — this is what the human approves>

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- TASKS.md §12.2; deps: [[WN-7]]
