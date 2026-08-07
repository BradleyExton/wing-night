---
id: WN-2
title: Playwright display refresh-rehydrate coverage (TASKS.md 9.2)
status: needs-planning
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
- 2026-08-07T02:44:27.631Z gate1 (product-owner critic): needs-changes — recorded at .work/verdicts/WN-2.gate1.json. Summary: "Well-formed, tightly scoped, genuinely buildable test-only ticket covering a real gap — but its final machine check (AC5) names the one e2e command form WN-5 deliberately left un-pinned, so the spec can go green against a reused foreign dev server." MAJOR (machine-checkable-finish, ok:false): AC5 declares `pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts`, which sets no CI=1 and no port overrides, so playwright.config.ts resolves defaults 5173/3000 and honors `reuseExistingServer: !process.env.CI` (playwright.config.ts:9-10,33,49) — it attaches to whatever holds those ports instead of booting the worktree stack. For a display refresh-rehydrate spec the reused client IS the subject under test, so the green is silent and unearned; AC5 is also the spec sole execution path because the default gate `test` key excludes e2e. Both ports are occupied right now (vite pid 90654 on 5173, server pid 90679 on 3000) alongside three stale worktrees. Fix: re-key AC5 to the manifest test_one form — `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts` — or state it as "the manifest test_one command with pattern tests/e2e/refresh-rehydrate.spec.ts". MINOR: AC2 `Content Load Error` count 0 is near-decorative — that surface renders only on server-side `roomState.fatalError !== null` (CONTENT_LOAD_FAILED), which a client reload cannot introduce. The real post-reload failure mode is the display stuck on the pre-snapshot placeholder, because wireRoomStateRehydration guards its request with `if (socket.connected)` (dead on fresh page load, no connect-fallback), leaving rehydration wholly dependent on the server unsolicited emitSnapshot(). Assert the placeholder is absent to make the intent legible. INFO: running AC5 literally also wipes the developer live room state (ensureSetupPhase clicks Reset Game → Confirm on port 3000). INFO: deps verified genuinely done and AC3 premise holds — WN-1 shipped tests/e2e/hostShell.ts with the assumed advance helpers; AC4 "no app code changes" is realistic. INFO: not redundant with WN-4; `reload(` has zero hits across tests/. Every other rubric check passed (well-formed, scope, blast radius, hidden constraints, worth-doing) — the ticket is worth building, it just needs AC5 re-keyed. Routing per ship-next gate1: explicit rejection ⇒ demote ready → needs-planning and re-plan via plan-work. Pipeline halted before implement; no code was written.

## Evidence
_pending_

## Links
- TASKS.md §9.2 (Phase 9 — E2E Milestone); depends on WN-1's helpers.
