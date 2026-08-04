---
id: WN-6
title: "Docs alignment: README plugin architecture (D8, 12.3 remainder) + AGENTS envelope/takeover guardrails (D9)"
status: needs-planning
kind: chore
priority: low
created: 2026-08-04
deps: []
blocked_by: []
---

## Goal
Close the two remaining docs-alignment items from TASKS.md (D8, D9) plus the documentation
remainder of 12.3. Docs-only diff; no code changes.

Audit evidence (2026-08-04):
- **D8 open:** `README.md` has **zero** mentions of `minigame-authoring-guide`, `plugin`, or
  `registry` (grep confirmed). Yet the plugin architecture is fully shipped: runtime registry
  at `apps/server/src/minigames/registry/index.ts`, client registry at
  `apps/client/src/minigames/registry/index.ts`, three shipped plugins (TRIVIA, GEO, DRAWING —
  all real implementations, contra TASKS.md 11.8's "unsupported states" note).
- **12.3 remainder:** `docs/minigame-authoring-guide.md` exists and is current (documents the
  `MINIGAME_DEFINITIONS` discovery invariant in
  `packages/shared/src/content/gameConfig/index.ts`), and the GEO "scaffold" was overtaken by
  a full GEO implementation. The only unmet 12.3 verification line is "Docs and scaffold
  referenced from `README.md`".
- **D9 partially absorbed:** `AGENTS.md` already carries snapshot-privacy guardrails (lines
  45, 62–67: display views never include answer/secret fields; server-owned projections only).
  Missing: guardrails for the generic minigame **action envelope** (`minigameId`/`actionType`/
  `actionPayload` validation, shipped in 11.2) and **full-screen takeover shell** rules
  (shipped in 11.5–11.7: shell-level override overlay, PASS_AND_PLAY lock preservation).

Scope: update `README.md` (architecture/monorepo sections + link the authoring guide and
`docs/minigames/README.md` roadmap) and `AGENTS.md` (envelope + takeover guardrails). Then
tick D8/D9/12.3 in TASKS.md with pointers here.

## Acceptance Criteria
- [ ] `README.md` architecture section describes the plugin registry/runtime and links
      `docs/minigame-authoring-guide.md`
- [ ] `AGENTS.md` gains action-envelope validation + takeover-shell guardrails
- [ ] TASKS.md D8, D9, and 12.3 ticked with pointers to this ticket
- [ ] `pnpm typecheck` and `pnpm test` pass (docs-only diff sanity)

## Plan
<filled at GATE 1 — this is what the human approves>

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- TASKS.md §D8, §D9, §12.3; `docs/minigame-authoring-guide.md`; `docs/minigames/README.md`
- [[WN-7]] (the cross-title ADR may later supersede parts of the README architecture story)
