---
id: WN-2
title: Playwright display refresh-rehydrate coverage (TASKS.md 9.2)
status: done
kind: chore
priority: medium
created: 2026-08-01
deps: [WN-1, WN-5]   # WN-5: test_one/e2e must boot isolated servers first — until then a Playwright green may be verifying a foreign dev server's code
worktree: "/Users/bradleyexton/Projects/wing-night-WN-2"
landed_range: e142dadb2b63008313acb24744b97a7b34c05173..a66bb6805f87f2e69841bea06b2dcd6ddb2a9598
review: pending
---

## Goal
E2E-prove a display refresh mid-game rehydrates to consistent state: advance to a mid-game milestone, reload the display page, assert the same surface renders with no error screen.

## Acceptance Criteria
- [ ] New spec `tests/e2e/refresh-rehydrate.spec.ts`: advance host to a mid-game milestone (eating or mini-game) with the display open, then `displayPage.reload()`
- [ ] Post-reload the display re-renders the same milestone surface (same phase content visible). Assert the **pre-snapshot placeholder is absent** — that is the real post-reload failure mode, because `wireRoomStateRehydration` guards its request with `if (socket.connected)`, which is false on a fresh page load, so rehydration depends entirely on the server's unsolicited `emitSnapshot()`. (A `Content Load Error` count of 0 is near-decorative here: that surface renders only on server-side `roomState.fatalError !== null`, which a client reload cannot introduce — keep it if you like, but it is not the assertion that earns this ticket.)
- [ ] Reuses the phase-advance helpers from `tests/e2e/hostShell.ts` (added in WN-1) — no duplicated advance logic
- [ ] No app code changes — test-only diff
- [ ] The manifest `test_one` command with pattern `tests/e2e/refresh-rehydrate.spec.ts` passes — i.e.
      `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts`.
      **Never the bare `pnpm test:e2e <spec>` form**: without `CI=1` and the port pins, `playwright.config.ts`
      resolves 5173/3000 and honors `reuseExistingServer: !process.env.CI`, so it attaches to whatever dev
      server holds those ports. For a display refresh-rehydrate spec the reused client *is* the subject under
      test, so that green would be silent and unearned. (WN-5 created this pinned form; it also means the run
      no longer resets the developer's live room state on port 3000.)

## Plan
Grill summary:
- **Scope:** display-side refresh only (host rehydrate is covered by the 11.9 takeover-recovery work). One milestone is the spine; a second (minigame surface) only if cheap. Cut: socket-drop simulation, server restarts.
- **Edge cases:** reload during a countdown is flaky — reload only after a stable milestone surface is visible; reset state at spec start via `ensureSetupPhase`.
- **Architecture:** depends on WN-1's `hostShell.ts` advance helpers; same one-context/two-pages structure.
- **Verification:** the spec is the machine check, run through the manifest `test_one` form; full gate stays green.

Re-planned 2026-08-07 after the gate1 park (WN-2.gate1.json):
- AC5 re-keyed to the pinned `test_one` command. The PO caught this live — vite and the server were
  holding 5173/3000 at grading time, so the bare command would have attached to them.
- AC2 re-pointed at the pre-snapshot placeholder, which is the failure mode a reload can actually
  produce; the `Content Load Error` assertion could never fail from a client reload.
- Unchanged and re-confirmed by the PO: deps really are done, WN-1 really did ship the
  `hostShell.ts` advance helpers AC3 assumes, "no app code changes" is realistic, and this is not
  redundant with WN-4 (`reload(` has zero hits across `tests/`).

## Progress
- 2026-08-07T02:44:27.631Z gate1 (product-owner critic): needs-changes — recorded at .work/verdicts/WN-2.gate1.json. Summary: "Well-formed, tightly scoped, genuinely buildable test-only ticket covering a real gap — but its final machine check (AC5) names the one e2e command form WN-5 deliberately left un-pinned, so the spec can go green against a reused foreign dev server." MAJOR (machine-checkable-finish, ok:false): AC5 declares `pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts`, which sets no CI=1 and no port overrides, so playwright.config.ts resolves defaults 5173/3000 and honors `reuseExistingServer: !process.env.CI` (playwright.config.ts:9-10,33,49) — it attaches to whatever holds those ports instead of booting the worktree stack. For a display refresh-rehydrate spec the reused client IS the subject under test, so the green is silent and unearned; AC5 is also the spec sole execution path because the default gate `test` key excludes e2e. Both ports are occupied right now (vite pid 90654 on 5173, server pid 90679 on 3000) alongside three stale worktrees. Fix: re-key AC5 to the manifest test_one form — `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts` — or state it as "the manifest test_one command with pattern tests/e2e/refresh-rehydrate.spec.ts". MINOR: AC2 `Content Load Error` count 0 is near-decorative — that surface renders only on server-side `roomState.fatalError !== null` (CONTENT_LOAD_FAILED), which a client reload cannot introduce. The real post-reload failure mode is the display stuck on the pre-snapshot placeholder, because wireRoomStateRehydration guards its request with `if (socket.connected)` (dead on fresh page load, no connect-fallback), leaving rehydration wholly dependent on the server unsolicited emitSnapshot(). Assert the placeholder is absent to make the intent legible. INFO: running AC5 literally also wipes the developer live room state (ensureSetupPhase clicks Reset Game → Confirm on port 3000). INFO: deps verified genuinely done and AC3 premise holds — WN-1 shipped tests/e2e/hostShell.ts with the assumed advance helpers; AC4 "no app code changes" is realistic. INFO: not redundant with WN-4; `reload(` has zero hits across tests/. Every other rubric check passed (well-formed, scope, blast radius, hidden constraints, worth-doing) — the ticket is worth building, it just needs AC5 re-keyed. Routing per ship-next gate1: explicit rejection ⇒ demote ready → needs-planning and re-plan via plan-work. Pipeline halted before implement; no code was written.
- 2026-08-07T05:23:52.598Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-2
- 2026-08-07T05:27:40.374Z Added tests/e2e/refresh-rehydrate.spec.ts (test-only, no app code changes): two specs reloading the display at a stable milestone. Shared local helpers advanceToEatingMilestone + expectRehydratesTo reuse WN-1's hostShell.ts advance helpers — no duplicated advance logic. Non-vacuity proven two ways before shipping: (1) a scratch run aborting **/socket.io/** on a fresh /display load confirmed 'Waiting for room state...' is a real rendered string (FallbackStageBody, apps/client/src/copy/display.ts:9), so the toHaveCount(0) negative cannot pass vacuously; (2) a mutation run aborting socket.io just before displayPage.reload() made the post-reload positive assertion fail as required. Both scratch/mutation edits reverted. AC machine check green: CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/refresh-rehydrate.spec.ts -> 2 passed (5.4s).
- 2026-08-07T05:30:51.404Z Caught and fixed a cross-spec regression my own spec introduced: the full e2e suite went 8 passed (baseline, spec removed) -> 1 failed/9 passed with the spec added. Cause: room state is one in-memory singleton and Playwright runs files alphabetically, so refresh-rehydrate ran just before smoke.spec.ts and left the server in MINIGAME_PLAY — the full-screen takeover that replaces the host header smoke asserts on. Fix stayed inside my own spec (no sibling spec edited, no assertion weakened): both tests now call ensureSetupPhase(hostPage) before closing the context, restoring the fixture they mutated. Full suite now 10 passed (20.3s); test_one 2 passed (5.5s); work verify green (lint, typecheck, test). NOTE for plan-work: smoke.spec.ts is fragile by construction — it is the only spec that asserts on inherited global state without calling ensureSetupPhase first. Out of scope here; worth a follow-up ticket.
- 2026-08-07T05:36:57.038Z Correction to the V-5 record: my first 'work grep --since main' ran pre-commit against a staged-only tree and reported 'no touched symbols (nothing to survey)'. The qa-reviewer flagged that as an inaccurate sweep record. Re-run post-commit it reports 7 touched symbols, warning on displayPage (29 call-sites) and hostPage (66). I opened all of them: tests/e2e/host-display-sync.spec.ts, intro-countdown.spec.ts, overrides.spec.ts, smoke.spec.ts, hostShell.ts. Both are local const names declared per-spec, not shared symbols — lexical false positives of the sweep. The new spec exports nothing, so no downstream call-site could need updating. No blind spot. qa-reviewer verdict: pass (b58162f), no blocker/major; it independently re-proved non-vacuity and teeth by its own mutation runs and cleared the ensureSetupPhase restoration as genuine fixture hygiene. Two advisory minors ride forward per the work-on contract (minor/info are not loop fodder): (1) restoration is a plain statement, not test.afterEach/finally, so a mid-test failure leaves the singleton dirty and can cascade a second failure into smoke.spec.ts — noise-on-red only, never a false green; (2) 'Eating - Frank's' / 'On the clock:' literals are duplicated from host-display-sync.spec.ts (pre-existing house idiom) and could be lifted into a shared module.
- 2026-08-07T05:37:56.611Z browser-verify: skipped (non-UI — kind: chore; the deliverable is a Playwright spec, and its own e2e run is the browser evidence)
- 2026-08-07T05:38:01.141Z handed off → in-review (verify green); awaiting land
- 2026-08-07T05:38:58.034Z auto-landed on green verdicts + attestation (in-review → done); review: pending

## Evidence
<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 2 symbol(s) with external call-sites reviewed (1 low-signal name(s) skipped: context):

- `displayPage` → tests/e2e/host-display-sync.spec.ts:17, tests/e2e/host-display-sync.spec.ts:20, tests/e2e/host-display-sync.spec.ts:25, tests/e2e/host-display-sync.spec.ts:30, tests/e2e/host-display-sync.spec.ts:33, tests/e2e/host-display-sync.spec.ts:34, tests/e2e/host-display-sync.spec.ts:39, tests/e2e/host-display-sync.spec.ts:40, … 21 more (run `work grep`)
- `hostPage` → tests/e2e/host-display-sync.spec.ts:16, tests/e2e/host-display-sync.spec.ts:19, tests/e2e/host-display-sync.spec.ts:22, tests/e2e/host-display-sync.spec.ts:23, tests/e2e/host-display-sync.spec.ts:27, tests/e2e/host-display-sync.spec.ts:37, tests/e2e/host-display-sync.spec.ts:43, tests/e2e/host-display-sync.spec.ts:49, … 58 more (run `work grep`)

**QA findings (advisory):** 4 finding(s) carried from the passing verdict:
- **minor** — The shared-fixture restoration `ensureSetupPhase(hostPage)` runs as a plain statement after the assertions, not in `test.afterEach` / a `finally`. If any assertion in either test throws, the restoration is skipped and the in-memory room-state singleton is left in EATING/MINIGAME_PLAY — precisely the condition the implementer's own Progress log identifies as what makes `smoke.spec.ts` fail. One genuine failure here therefore cascades into a second, unrelated-looking failure in a sibling spec, obscuring the real cause. It can only ever add a failure, never remove one (and CI `retries: 1` re-enters via `ensureSetupPhase` at the top of `advanceToEatingMilestone`), so this is noise-on-red, not a false green. Cites testing.md §Test quality: "Keep tests deterministic. No implicit dependency on time, randomness, ordering, or network."
    evidence: tests/e2e/refresh-rehydrate.spec.ts:79-80 and :90-91 — `await expectRehydratesTo(...); await ensureSetupPhase(hostPage); await context.close();`. playwright.config.ts:15-16 confirms `fullyParallel: false`, `workers: 1`, `retries: process.env.CI ? 1 : 0`. Fix: wrap in `test.afterEach` or `try { ... } finally { await ensureSetupPhase(hostPage); }`.
- **minor** — The two display-surface literals are now a second copy of strings already asserted in a sibling spec, so a content-config change to round 1's sauce must be edited in two files. `"Eating · Frank's"` is `displayCopy.eatingPhaseLabel(sauce)` interpolated with `content/sample/gameConfig.json` round-1 `sauce: "Frank's"`; `"On the clock:"` is the trivia surface's `activeTeamLabel`. This matches the pre-existing house idiom in host-display-sync.spec.ts (so it is inherited rather than invented) and fails loudly rather than silently, hence minor. Cites code-design §Utilities & extraction: "Extract a utility when the logic is independently testable, single-responsibility, OR reused" and testing.md §What to assert: "assert on stable structural signals, not incidental copy". Lifting both into `tests/e2e/hostShell.ts` (or a sibling `displaySurfaces.ts`) alongside the existing shared `HOST_PRIMARY_ACTION_LABEL` would collapse the pair.
    evidence: tests/e2e/refresh-rehydrate.spec.ts:18-19 vs tests/e2e/host-display-sync.spec.ts:45,51,52. Sources: apps/client/src/copy/display.ts:37 `eatingPhaseLabel: (sauce) => `Eating · ${sauce}``; content/sample/gameConfig.json:8 `"sauce": "Frank's"`; packages/minigames/trivia/src/client/DisplayTriviaSurface/copy.ts:3 `activeTeamLabel: "On the clock:"`.
- **info** — The negative assertion `expect(displayPage.getByText(PRE_SNAPSHOT_PLACEHOLDER)).toHaveCount(0)` is not vacuous (the string genuinely renders — I verified this) but it is *subsumed* by the positive assertion two lines above it: `StageSurface` dispatches through a single `STAGE_BODY_BY_MODE[effectiveStageMode]`, so `FallbackStageBody` (the only render site of `waitingForStateLabel`) and the eating/minigame bodies are mutually exclusive. Once the milestone surface is visible, the placeholder cannot be present. AC2 explicitly mandates the assertion and its comment documents intent, so this is not a defect — recorded only so a future reader does not mistake it for an independent failure detector. The post-reload positive assertion is the one carrying the teeth.
    evidence: tests/e2e/refresh-rehydrate.spec.ts:56-57. apps/client/src/components/DisplayBoard/StageSurface/index.tsx (STAGE_BODY_BY_MODE dispatch; `fallback` mode only when `phase === null`) and .../FallbackStageBody/index.tsx:17 (`hasRoomState ? roundFallbackLabel : waitingForStateLabel`). My mutation run confirmed the ordering: with socket.io aborted the positive assertion failed first and the negative never executed.
- **info** — The V-5 anti-blind-spot sweep is not recorded in the ticket's `## Progress`, and the handoff framing that it "found no touched symbols" does not match what the tool actually reports. `work grep --since main` reports 7 touched symbols and flags two with external call-sites: `displayPage` (29) and `hostPage` (66). Both are local variable names in sibling spec files — lexical false positives of the sweep, not shared symbols. I discharged the sweep myself: the new file exports nothing, and I opened every flagged call-site (all four sibling specs plus hostShell.ts). No call-site required updating, so there is no real blind spot; the finding is about the missing/inaccurate record, not a defect in the diff.
    evidence: `work grep --since main` in /Users/bradleyexton/Projects/wing-night-WN-2 → "grep: 7 touched symbol(s) via git-grep (since main)" with `⚠ displayPage — 29 call-site(s)` and `⚠ hostPage — 66 call-site(s)`. Call-sites reviewed: tests/e2e/host-display-sync.spec.ts, tests/e2e/intro-countdown.spec.ts, tests/e2e/overrides.spec.ts, tests/e2e/smoke.spec.ts, tests/e2e/hostShell.ts.

_Captured 2026-08-07T05:38:01.141Z._
<!-- captured-evidence:end -->

## Links
- TASKS.md §9.2 (Phase 9 — E2E Milestone); depends on WN-1's helpers.
