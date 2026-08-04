---
id: WN-4
title: "Close out 11.1: reconnect/recovery snapshot coverage decision"
status: needs-planning
kind: chore
priority: low
created: 2026-08-04
deps: []
blocked_by: []
---

## Goal
TASKS.md 11.1 (role-scoped snapshot contract) is ~90% shipped already — this ticket closes the
remaining 10%: decide and test the reconnect/recovery path, then tick 11.1 in TASKS.md.

Audit evidence (2026-08-04):
- **Done:** `toRoleScopedSnapshotEnvelope` + `toDisplayRoomStateSnapshot` live in
  `packages/shared/src/roomState/index.ts:264-320`; the display projection allowlists
  display-safe keys (no `minigameHostView`, no answer fields). Server emits per-role via
  socket.io rooms (`emitRoleScopedSnapshotToRoom`, `apps/server/src/socketServer/index.ts:59`).
  Tests exist: `apps/server/src/socketServer/roleScopedSnapshots.test.ts` (host intact /
  display stripped / display-key allowlist).
- **Not done:** the 11.1 sub-item "explicit behavior when transport recovery is unavailable
  (`socket.recovered === false`)". There is **no reference to `recovered` anywhere** in client
  or server, and `connectionStateRecovery` is not enabled — so every reconnect is a fresh
  connection, and `registerRoomStateHandlers` calls `emitSnapshot()` unconditionally on
  connection (`apps/server/src/socketServer/registerRoomStateHandlers/index.ts:222`). The
  spec'd behavior (full role-scoped snapshot on non-recovered reconnect) therefore holds *by
  construction*, but is undocumented and has no regression test pinning it.

Likely shape (decide at planning): do NOT enable connectionStateRecovery; instead document
"full role-scoped snapshot on every (re)connection" as the contract (AGENTS.md already states
it at line 45) and add a server test asserting a fresh connection receives a role-scoped
snapshot without a `REQUEST_STATE` round-trip. Client-side refresh coverage lands via WN-2.

## Acceptance Criteria
- [ ] A written decision (in this ticket + AGENTS.md if changed) on recovered vs non-recovered
      reconnect behavior — either document full-snapshot-always or implement recovery handling
- [ ] Regression test pins snapshot emission on new connection per role
- [ ] TASKS.md 11.1 ticked with a pointer to this ticket
- [ ] `pnpm test` passes

## Plan
<filled at GATE 1 — this is what the human approves>

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- TASKS.md §11.1; [[WN-2]] (display refresh-rehydrate e2e)
- `apps/server/src/socketServer/roleScopedSnapshots.test.ts` (existing coverage)
