---
id: WN-2
title: Playwright display refresh-rehydrate coverage (TASKS.md 9.2)
status: ready
kind: chore
priority: medium
created: 2026-08-01
deps: [WN-1, WN-5]   # WN-5: test_one/e2e must boot isolated servers first — until then a Playwright green may be verifying a foreign dev server's code
---

## Goal
E2E-prove a display refresh mid-game rehydrates to consistent state: advance to a mid-game milestone, reload the display page, assert the same surface renders with no error screen.

## Acceptance Criteria
- [ ] New spec `tests/e2e/refresh-rehydrate.spec.ts`: advance host to a mid-game milestone (eating or mini-game) with the display open, then `displayPage.reload()`
- [ ] Post-reload the display re-renders the same milestone surface (same phase content visible, `Content Load Error` count 0)
- [ ] Reuses the phase-advance helpers from `tests/e2e/hostShell.ts` (added in WN-1) — no duplicated advance logic
- [ ] No app code changes — test-only diff
- [ ] `pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts` passes

## Plan
Grill summary:
- **Scope:** display-side refresh only (host rehydrate is covered by the 11.9 takeover-recovery work). One milestone is the spine; a second (minigame surface) only if cheap. Cut: socket-drop simulation, server restarts.
- **Edge cases:** reload during a countdown is flaky — reload only after a stable milestone surface is visible; reset state at spec start via `ensureSetupPhase`.
- **Architecture:** depends on WN-1's `hostShell.ts` advance helpers; same one-context/two-pages structure.
- **Verification:** the spec is the machine check; full gate stays green.

## Progress
_Not started._

## Evidence
_pending_

## Links
- TASKS.md §9.2 (Phase 9 — E2E Milestone); depends on WN-1's helpers.
