---
id: WN-17
title: "CONTRAPTION integrator module + keyframe byte measurement (headless half)"
status: in-progress
kind: spike
priority: medium
created: 2026-08-07
deps: []
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-17"
---

## Goal
The **headless** half of the CONTRAPTION prototype: a pure, portable, deterministic integrator plus
the keyframe byte measurement WN-15's architecture decision is explicitly waiting on. No React, no
route, no canvas — the visual harness is WN-18.

## Why this shape (re-planned 2026-08-07 after the gate1 rejection)
gate1 rejected the combined ticket for bundling three separable deliverables, and was right: the
module + measurement touch no React, no route, no `window`, and **no component lint rules**, while
the harness exists only to serve questions that stay human anyway. This half is fully autonomous and
carries the highest-value output. WN-18 takes the harness and depends on this.

## Acceptance Criteria
- [ ] **Module home: `packages/shared/src/`.** That is the only workspace both a client harness and
      the server-side reducer can reach (`packages/minigames/core` depends on `@wingnight/shared`,
      not the reverse). It must import nothing browser-only. Note `packages/shared` gained a runtime
      test runner in WN-9 (`tsc --noEmit -p tsconfig.test.json && tsx --test "src/**/*.test.ts"`), so
      colocated `.test.ts` files here **do** execute — verify they are reported, per the WN-9 lesson.
- [ ] A pure integrator with colocated determinism tests: identical seed + identical layout ⇒
      byte-identical output across runs. **Do not claim this proves option (b)'s cross-engine
      portability** — same-process reproducibility is a necessary but not sufficient condition, and
      the previous ticket overstated it. State the limit in the test's name or a comment.
- [ ] **No transcendental functions** (`Math.sin/cos/exp/pow`…) in the integrator — plain IEEE-754
      double arithmetic is fully specified, transcendentals are not reproducible across engines.
      Enforce with a **colocated unit test** that scans the module source for those identifiers. Do
      NOT author a custom rule under `tools/eslint-plugin-wingnight/` — gate1 flagged that as the
      expensive reading of "lint-style assertion"; the unit test is the intended default.
- [ ] **The byte measurement is fully specified, because an under-specified number is worse than no
      number.** Record, in `## Evidence`: the encoding (**JSON, matching how minigame runtime state
      actually crosses socket.io as `SerializableValue`** — measure packed-binary only as a clearly
      labelled secondary figure), the **body count** and layout used, and the basis (**per whole
      ~4s run**, not per emit). Report at **both 30fps and 20fps**. WN-15 leans architecture (a) and
      says outright it "needs a real byte count before committing" — so the number must be
      apples-to-apples with the transport it is deciding about.
- [ ] Scope guardrail: no package under `packages/minigames/`, no `MINIGAME_DEFINITIONS` entry, no
      registry changes — adding a `MinigameType` breaks every `Record<MinigameType, …>` until fully
      wired.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys.
      `lint` has been in the default gate since WN-3 landed; omitting it from the finish line is the
      exact defect that got WN-16, WN-17 and WN-11 rejected on 2026-08-07. Lint risk here is low by
      construction (the wingnight component rules are scoped to `apps/client/src/components/**`,
      `eslint.config.mjs:113-146`, which this ticket does not touch) — but it is named, not assumed.

## Plan
What survives this ticket is a **module**, not numbers — the integrator ends up inside the
server-side reducer, so write it to production standard with real tests. The disposable part all
lives in WN-18.

Sequence the byte measurement after the determinism tests: a measurement taken from a
non-deterministic integrator is meaningless.

Pre-verified 2026-08-07: `packages/shared/package.json` gained `tsx --test "src/**/*.test.ts"` in
WN-9 (quoted glob — `/bin/sh` collapses an unquoted `**`); the wingnight component lint rules are
scoped to `apps/client/src/components/**` at `eslint.config.mjs:113-146`, so a `packages/shared`
module does not touch them.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T15:12:31.390Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-17
- 2026-08-07T15:21:12.447Z Built packages/shared/src/contraption/: types.ts, simulate/ (position-Verlet, xorshift32 seed jitter, keyframe emission) + simulate/resolveSegmentContacts/ (circle-vs-static-segment, restitution + slip), measureTrackBytes/, benchmarkLayout/ (6 bodies, 7 segments), and the module entry re-exporting under Contraption* names from packages/shared/src/index.ts (so WN-18 can import from the package's single '.' export — the gate1 minor). 24 colocated tests pass. The transcendental scan proved non-vacuous on first run: it caught 'Math.random' written in a doc comment in simulate/index.ts, which I reworded rather than narrowing the scan.

## Evidence
<test output + the byte measurement table (30fps / 20fps, JSON, body count, per-run basis)>

## Links
- Visual half: WN-18 (deps on this). Consumer: WN-15 (architecture decision (a) vs (b)).
- Question source: WN-15's `**Architecture decision to confirm at GATE 1**` section.
- Prior rejection: `.work/verdicts/WN-17.gate1.json` (three majors, all addressed above).
