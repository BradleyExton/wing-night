---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-29
title: "De-flake intro-countdown e2e: capture the countdown frame sequence instead of polling for transient frames"
status: in-review
kind: bug
priority: medium
created: 2026-08-16

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night/.claude/worktrees/flamboyant-pasteur-d861ba"
---

## Goal
Stop `tests/e2e/intro-countdown.spec.ts` from reddening the gate on contended machines, without weakening what it proves — replace the poll-for-a-transient-frame assertions with a push-based capture of the countdown's full frame sequence.

## Acceptance Criteria
- [ ] `apps/client/src/components/DisplayBoard/GameLockedOverlay/index.tsx` puts a `data-countdown-value` attribute on the countdown number element (`styles.countdownNumber`), following the existing `data-display-atmosphere` hook precedent; no other production behaviour changes
- [ ] `tests/e2e/intro-countdown.spec.ts` installs a `MutationObserver` on the display page **before** clicking "Start Game", recording every committed value of `[data-countdown-value]` into an array (consecutive duplicates deduped, observing `document.body` with `subtree`/`childList`/`characterData`)
- [ ] The three `getByText(/^3$/)` / `/^2$/` / `/^1$/` assertions are gone; the spec instead asserts the captured sequence equals exactly `["3","2","1"]` and that `"Game starts in"` reaches `toHaveCount(0)` within `10_000`ms
- [ ] The observer helper stays inline in the spec (single consumer — not promoted to `hostShell.ts`)
- [ ] The rest of the spec (lock-in surfaces, host `Open Team Briefing` / `Round 1 of 3`, display `Coming up` / `Warm Up` / `Frank's` / `TRIVIA`) is unchanged
- [ ] **Stability:** `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/intro-countdown.spec.ts` passes on 3 consecutive runs; paste all 3 into `## Evidence`
- [ ] **Teeth (regression proof):** temporarily regress `useGameStartCountdown` so the tick returns `null` immediately (skipping 2 and 1), confirm the spec goes **red** naming the missing frames, then restore the hook and confirm green. Paste the red output into `## Evidence`. The working tree must be clean of this probe before handoff
- [ ] **Full e2e suite** green (`verify_extra` forces the `e2e` key — the diff touches both `apps/client/src/**` and `tests/e2e/**`): `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e`
- [ ] Default gate green: `pnpm lint` → `pnpm typecheck` → `pnpm test`

## Plan

Grill summary (scope/edges/architecture/testing). Empirical claims below were **verified during planning** by a throwaway probe spec (written, run, deleted; working tree left clean).

**The defect.** `intro-countdown.spec.ts:29-31` polls for `/^3$/`, `/^2$/`, `/^1$/`. Each digit is on screen for exactly `COUNTDOWN_TICK_MS` = 1000ms and never returns once passed (`useGameStartCountdown` walks `3 → 2 → 1 → null`). Polling is a *sampling* strategy against a 1-second window: one slow cycle under contention misses the frame permanently and the 2.5s timeout expires. Observed 2026-08-15 on WN-23's run — 1.1m red vs ~24.3s clean, then green on two isolated re-runs (8.4s, 6.9s) and a full clean re-run. Note the red run *already consumed its `retries: 1`* (the config sets `retries: 1` under `CI`), so sustained contention defeats a retry — widening the windows is not a reliable fix either.

**Why not just widen the timeout.** The assertion is testing the wrong *thing*, not the wrong *duration*. Catching one transient animation frame is inherently racy at any bound; a bound large enough to be safe (>3s) would swallow the whole countdown and assert nothing.

**Scope & cuts:**
- **In:** the one spec + a one-attribute production hook. One context window, comfortably.
- **Cut — extracting a pure tick-stepper** from the hook and unit-testing it. The frame capture proves the descent end-to-end, so a pure `advanceGameStartCountdown` test is redundant for this Goal; the hook's `countdownSeconds` prop has no non-default caller, so seeding other values is unmotivated scope. Deletion test: a 5-line reducer with one call-site leaves nothing behind when inlined (`rules/code-design.md` — don't pre-extract speculatively).
- **Cut — adding jsdom / react-dom/client.** Verified: client unit tests run `tsx --test` over `renderToStaticMarkup`, so effects and timers never run — a hook-level fake-timer test is impossible today. Buying that would mean adding a DOM environment and a client renderer to a repo that has deliberately stayed on `react-dom/server`; the frame capture already covers the cadence wiring it would purchase.
- **Cut — correcting WN-1's `## Plan`,** which claims the "wait for the countdown to clear" pattern lives in `intro-countdown.spec.ts` (it doesn't; it lives in `host-display-sync.spec.ts:29-31`). WN-1 is `done` — a done ticket is a historical record, not a doc to edit. This spec becomes the honest exemplar going forward.
- **Cut — the rest of the suite.** Grep-verified that `intro-countdown.spec.ts:29-31` is the only transient-frame chain in `tests/e2e`; `host-display-sync.spec.ts:30` (`toHaveCount(0)`) and `minigame-sandbox.spec.ts:185` (`toBeHidden`) are terminal-state assertions, which fail safe under contention.

**Edge cases & failure modes:**
- **No frame can be dropped, by construction.** Each tick's `setTimeout` is scheduled by the effect that runs *after* the previous render commits — so `render(3)` must commit before the `2` timeout exists. Contention delays frames; it cannot skip them. `MutationObserver` fires on DOM mutation regardless of paint, so it records every committed render. Verified: clean run captured `["3","2","1"]`.
- The observer must install **before** the Start Game click. During `INTRO` the overlay renders `readyLabel` and no countdown node exists, so the initial read is a no-op and the array fills from `"3"`.
- Dedupe consecutive equal reads — `childList` and `characterData` can both fire for a single commit.
- Observe `document.body` with `subtree: true` so React unmounting/replacing the node is still tracked.
- **Latent correctness bug fixed in passing:** `StandingsSurface` renders bare team scores on the display *concurrently* with the overlay, so today's `getByText(/^1$/)` can also match a team score of `1` — a spurious pass, or a strict-mode violation if two nodes match. The dedicated attribute removes the ambiguity.
- **The 10s terminal bound is not the reflex widen.** A terminal assertion is fail-safe: a genuinely broken countdown either never terminates (red at any bound) or terminates instantly (caught by the frames array). A longer bound cannot hide a real break — whereas the 2.5s frame windows could only ever *invent* failures. This is the same shape as the existing 6s bound in `host-display-sync.spec.ts`.

**Architecture & reuse:**
- `data-countdown-value` follows `data-display-atmosphere` (`DisplayBoard/index.tsx:39`, asserted at `DisplayBoard/index.test.tsx:30`) — a bare `data-*` attribute as a stable test hook is already house style here. Checked: no rule in `tools/eslint-plugin-wingnight` touches data attributes.
- The observer stays inline in the spec. Only one spec needs it, and `hostShell.ts` is host-side *advance* helpers — wrong module, and `rules/code-design.md` says a function used in one place stays inline.
- No change to the hook, to `GameLockedOverlay`'s `copy.ts`, or to the overlay's structure beyond the attribute.

**Testing & verification:**
- The new assertion is **strictly stronger** than the one it replaces: it asserts frame *ordering* and *totality*, which the current chain never did (three independent `toBeVisible` calls can't detect a wrong order). This is the anti-reward-hacking argument — the diff tightens the check while removing the race.
- **Teeth are pre-proven.** Regressing the hook's tick to return `null` immediately produced captured `["3"]` and a red run on *both* attempts — deterministic red, with a diff naming the two missing frames (much better diagnostics than `timeout waiting for /^2$/`). The build re-runs this as an AC and captures the output.
- `verify_extra` fires the `e2e` key automatically at handoff for this diff; the AC names it explicitly so it isn't left to the mechanism alone.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-16T00:47:44.645Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night/.claude/worktrees/flamboyant-pasteur-d861ba
- 2026-08-16T00:51:31.896Z implemented: data-countdown-value hook on GameLockedOverlay's number element + MutationObserver frame recorder inline in intro-countdown.spec.ts. Replaced the 3 transient-frame polls with expect.poll over the append-only frames array (race-free: a late poll still sees the full history) plus the fail-safe 10s terminal toHaveCount(0). Stability 3/3 green (11.3s/8.9s/9.2s). Teeth AC: hook regressed to 3->null went red on BOTH attempts naming the two missing frames; restored, green (8.4s).
- 2026-08-16T00:51:55.654Z DELIBERATE ASSERTION REMOVAL, flagged for review: dropped 'await expect(displayPage.getByText("Game starts in")).toBeVisible()'. It was itself a poll against the same 3s window (the last sampling assertion in the file), and without a started-edge the terminal toHaveCount(0) could pass vacuously at t=0 — the frames poll now supplies that edge race-free. Not a weakening: the prefix and the digit render in the SAME isCountdownVisible branch of GameLockedOverlay, so proving the digit sequence rendered proves that branch rendered; 'Game starts in' is still asserted at toHaveCount(0) on both host and display. Net assertion strength is UP — frame ordering and totality are now checked, which three independent toBeVisible calls never could. testing.md ('assert stable structural signals, not incidental copy') backs the trade.
- 2026-08-16T01:16:40.366Z qa-reviewer returned needs-changes (major). Reviewer was RIGHT and my earlier justification was factually wrong: the prefix renders in a SIBLING node of the recorded digit, not the same node, so the frames array could not detect its removal — and I had missed that host-display-sync.spec.ts:30 uses that copy as its countdown-settled SYNC GATE, so deleting it would have silently turned that spec into a race. Fixed by recording the prefix in the same observer: added data-countdown-label to the prefix span and a second append-only 'labels' array; the assertion is now toEqual({values:[3,2,1], labels:['Game starts in']}). Proved the closure: deleting the prefix now goes RED (labels: []) where it was GREEN before. Also addressed the minor (Evidence now holds pasted output, not summaries) and info-1 (comment on live-DOM sampling vs MutationRecords being safe at 1s cadence). Re-verified at the new shape: 3/3 stability (7.1/7.7/7.9s), both regressions red, full gate green, full suite 14/14 (28.7s).
- 2026-08-16T01:22:10.921Z handed off → in-review (verify green); awaiting land
- 2026-08-16T01:38:30.861Z re-attested at in-review (verify + qa re-run green) for 46f899c1
- 2026-08-16T01:43:44.755Z Landed on LOCAL main at 8c355d6 (ff-merge, 4 commits); NOT pushed — user chose local-main-only. Ticket deliberately left in-review rather than hand-flipped to done: the re-attest refused because the qa verdict binds to 9efd239e and the rebase pulled in another session's .work/templates/ticket.md commit that is on local main but not origin/main. That is the binding gate doing its job, and flipping status by hand would be bypassing it. Code IS fully verified at this tree — full default gate green and full Playwright suite 14/14 (51.5s) re-run AFTER rebasing onto WN-26's client changes (DevBoard, resolveClientRoute); the only delta since the graded sha is a comment in a ticket template, which cannot affect behaviour. To close out: either push (origin/main catches up, then 'work land WN-29'), or re-run qa-reviewer to re-bind at the current sha.

## Evidence
### AC6 — stability, 3 consecutive runs of the single spec
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e tests/e2e/intro-countdown.spec.ts`

```
Running 1 test using 1 worker
·
  1 passed (7.1s)

Running 1 test using 1 worker
·
  1 passed (7.7s)

Running 1 test using 1 worker
·
  1 passed (7.9s)
```

### AC7 — teeth, part 1: countdown stops counting down
`useGameStartCountdown`'s tick regressed to return `null` immediately (skipping 2 and 1). Red on the
first attempt **and** the retry — deterministic red, not a flaky one:

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 0

@@ -2,9 +2,7 @@
    "labels": Array [
      "Game starts in",
    ],
    "values": Array [
      "3",
-     "2",
-     "1",
    ],
  }

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate

  > 100 |   await expect
        |   ^
    101 |     .poll(() => readCountdownRecord(displayPage), { timeout: 10_000 })
    102 |     .toEqual({ values: ["3", "2", "1"], labels: ["Game starts in"] });

  1 failed
```

### AC7 — teeth, part 2: countdown prefix deleted
Added after the qa-reviewer's major finding. The `countdownPrefix` span deleted from
`GameLockedOverlay`. **This exact regression was GREEN before the `labels` array was added** — that
was the hole the reviewer caught, and this is the proof it is closed:

```
- Expected  - 3
+ Received  + 1

-   "labels": Array [
-     "Game starts in",
-   ],
+   "labels": Array [],

    102 |     .toEqual({ values: ["3", "2", "1"], labels: ["Game starts in"] });
```

Both probes reverted; `git status` clean of them before handoff.

### AC8 — full Playwright suite (forced by `verify_extra`)
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e`

```
Running 14 tests using 1 worker
···
  14 passed (28.7s)
```

### AC9 — default verify gate
```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ verify passed (3 step(s))
```

### Anti-blind-spot sweep
`work grep --since 9016a61` → 6 touched symbols. Only `frames` had external call-sites, all three in
`packages/shared/src/contraption/resolveSettleIndex/` (physics keyframes from WN-23) — opened and
confirmed a bare-name collision, not a real call-site. Symbol since renamed to `record`/`values`.

### Baseline for comparison
The pre-fix flake: one red run at 1.1m wall-clock against ~24.3s clean, which had **already consumed
its `retries: 1`** — sustained contention defeats a retry, so widening the frame windows would not
have been a reliable fix either.

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (4 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ e2e: CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e
```

**Anti-blind-spot grep:** 1 symbol(s) with external call-sites reviewed (1 low-signal name(s) skipped: text):

- `record` → apps/client/src/components/AnamorphLab/copy.ts:4, apps/client/src/components/AnamorphLab/copy.ts:33, apps/client/src/components/ContraptionLab/copy.ts:4, apps/client/src/components/ContraptionLab/pieceSets/index.ts:13, apps/server/src/socketServer/registerRoomStateHandlers/payloadGuards/index.ts:27, apps/server/src/socketServer/registerRoomStateHandlers/payloadGuards/index.ts:30

**QA findings (advisory):** 3 finding(s) carried from the passing verdict:
- **info** — Residual delta vs the pre-diff baseline: the recorder proves the countdown nodes were COMMITTED to the DOM (textContent via MutationObserver), not that they were VISIBLE. The old toBeVisible calls on the digits and the prefix would have caught a display:none / zero-size regression on the countdown branch; nothing does now. Narrow: the overlay container's visibility is still proven at line 87 (getByText("Locked In")).toBeVisible() - the same overlay div - so only the inner countdown nodes are unproven, and styles.ts is plain Tailwind strings. Explicitly NOT worth fixing with a toBeVisible on the countdown node: that would reintroduce exactly the 3-second sampling window this ticket exists to remove. If it is ever wanted, the race-free form is to capture getBoundingClientRect().width > 0 inside the same appendIfChanged sample.
    evidence: tests/e2e/intro-countdown.spec.ts:38-49 (appendIfChanged reads ?.textContent?.trim() only) vs the removed toBeVisible on /^3$/ in the same diff. Presence-only assertion; the overlay-level visibility check that remains is at :87.
- **info** — The ticket's AC text is now slightly stale relative to the shipped diff, which is strictly additive: AC1 names only data-countdown-value on the number element and says 'no other production behaviour changes' (the diff also adds data-countdown-label to the prefix span), AC2 describes recording only [data-countdown-value] (also records labels), and AC3 says the spec asserts the sequence equals ["3","2","1"] (now an object superset). Every deviation is a non-behavioural test hook added at reviewer direction to close the major, and the ## Progress entry documents the change and the reasoning, so the audit trail is intact. Recorded only so the AC-vs-diff drift is on the record; no action required.
    evidence: Ticket AC1/AC2/AC3 vs GameLockedOverlay/index.tsx:39 (data-countdown-label) and intro-countdown.spec.ts:48, :102.
- **info** — Carried forward unchanged from the previous grade and correctly left as a residual: expect.poll(...).toEqual(...) passes on the first matching sample, so a countdown that continued past '1' could be caught mid-sequence. Still not reachable - useGameStartCountdown returns null at currentValue <= 1 so no '0' frame exists, and a lingering countdown is caught by the terminal toHaveCount(0). The new shape actually improves this: the recorded state is a FIXED POINT (the nodes unmount, so nothing more can be appended), so the poll now converges on a stable terminal value rather than a transient one.
    evidence: tests/e2e/intro-countdown.spec.ts:100-102; apps/client/src/components/DisplayBoard/useGameStartCountdown/index.ts:60-62.

- verify_extra: step `e2e` required — the diff touched `apps/client/src/components/DisplayBoard/GameLockedOverlay/index.tsx`

_Captured 2026-08-16T01:38:30.861Z._
<!-- captured-evidence:end -->

## Links
- The flake surfaced (not caused) by WN-23's e2e run, 2026-08-15.
- Terminal-state precedent: `tests/e2e/host-display-sync.spec.ts:29-31`. Data-hook precedent: `apps/client/src/components/DisplayBoard/index.tsx:39`.
- `.work/rules/verification.md` — a flaky gate trains a retry habit, which is the discipline this rule exists to protect.
