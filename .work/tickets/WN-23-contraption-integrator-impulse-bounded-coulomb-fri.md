---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-23
title: "CONTRAPTION integrator: impulse-bounded Coulomb friction so bodies can slide"
status: ready
kind: bug
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
---

## Goal
Replace the per-step tangential multiplier in the CONTRAPTION contact resolver with an
impulse-bounded Coulomb friction term, so a body released on a ramp slides down it instead of
creeping to a dead stop — and re-record the byte figures WN-15's architecture decision cites.

## Acceptance Criteria
- [ ] `resolveSegmentContacts` applies friction as a bound on the tangential change —
      `min(|tangential|, mu * |normalImpulse|)` — rather than scaling tangential velocity by a flat
      factor. The reduction **must clamp**: friction can never reverse tangential direction, only
      remove it. Today's defect is at
      `packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:88`, where
      `tangentX * material.slip` runs on every step a body is in contact and approaching — at 240Hz,
      `0.86^240` is effectively zero.
- [ ] The `approach >= 0` early-return is **kept**. A body resting on a ramp is pressed into it by
      gravity every step, so it still receives a small bite proportional to that impulse. Do not
      "fix" this into an unconditional friction pass.
- [ ] **Behavioural pin — sliding works:** a colocated test asserts a body released on a shallow ramp
      travels a meaningful distance *along* the ramp. This is the regression test and **it must be
      red against the current implementation** — state that in the test name or a comment, and
      confirm it by stashing the change, not by assertion.
- [ ] **Behavioural pin — friction still exists:** a colocated test asserts a high-friction body
      comes to rest rather than sliding forever. The two pins together fence both failure modes;
      neither alone does.
- [ ] The two existing per-step tests (`resolveSegmentContacts/index.test.ts:39-53`,
      "keeps the circle sliding along a segment when slip is total" / "drops the tangential velocity
      when slip is zero") are **deliberately re-specified**, not deleted or weakened — they encode
      the semantics being replaced. Rewrite them to express the new model, and expect the QA pass to
      grade this diff specifically (`rules/verification.md`: don't reward-hack the check).
- [ ] `noTranscendentals.test.ts` still passes untouched — the new maths uses only
      `abs`/`min`/`sign`/`sqrt`, all outside the ban. **Do not add to `BANNED_MEMBERS` or exempt a
      file**; if the model needs a banned member, the model is wrong.
- [ ] Same-process determinism still holds: identical seed + layout ⇒ byte-identical track. The
      existing determinism tests must pass unchanged, and their stated limit (same-process
      reproducibility is necessary, not sufficient, for cross-engine portability) stays recorded.
- [ ] `CONTRAPTION_BENCHMARK_LAYOUT` is **re-tuned so the run actually settles**. Today it grades
      `restless` at 4s/6s/12s because `resolveSettleIndex` reduces over all six bodies and the five
      marbles never stop — so the fixture never reaches a verdict. Re-tune geometry, then measure.
- [ ] `measureTrackBytes/index.test.ts:52-71` figures re-recorded at **both 30fps and 20fps** from
      the re-tuned fixture, and `## Evidence` states plainly that **WN-17's published table is
      superseded, not extended** — the geometry AND the physics both changed, so the numbers are not
      comparable. Record encoding (JSON/UTF-8), body count, and the per-whole-run basis, as WN-17 did.
- [ ] `pnpm lint` → `pnpm typecheck` → `pnpm test` all pass, with output pasted into `## Evidence`.

## Plan
Grilled 2026-08-15 (plan-work Mode A, four lenses). Evidence for the defect and the decision to fix
it before WN-15 is scoped lives in WN-15's `## Plan`.

**Why this is safe to do now.** The module has **no production consumers** — `apps/server` and
`packages/minigames` contain zero references to it. The only consumers are `benchmarkLayout` (the
byte fixture) and the WN-18 lab. This is a change to a module that has not shipped, not a physics
change under a live game.

**Model chosen: impulse-bounded Coulomb.** Reduce tangential velocity by
`min(|tangential|, mu * |normalImpulse|)`. A hard impact bites hard; a resting body gets a small bite
proportional to gravity, so sliding survives. It also makes ramp *angle* meaningful for the first
time — steep slides fast, shallow slides slow — which is what gives a team something to be clever
with. Two alternatives were considered and rejected: applying the existing multiplier only on the
contact-entry step (simpler, but leaves a resting body frictionless forever — the opposite
unphysical extreme), and a step-rate-normalised per-second decay (needs `Math.pow`, which the
module's portability guarantee bans).

**Edge cases specified here so they are not rediscovered mid-build:**
- Friction clamps at `min(...)` — never reverses tangential direction.
- A corner-wedged body takes friction once per segment it resolves against, in layout order; the
  existing corner test pins that ordering.
- The zero-length-segment guard (`alongLengthSquared === 0`) is unchanged.

**Deferred — the `slip` rename.** Under the new model the field's meaning inverts: today `slip: 0.9`
means *nearly frictionless*, whereas a Coulomb coefficient of 0.9 means *nearly maximum friction*.
Renaming it to `friction` would make typecheck force every call-site to be revisited. **Held
deliberately at the user's call (2026-08-15): the name should follow the piece vocabulary, which is
not settled until WN-25/WN-15.** The field keeps its current name here. Protection against silent
reinterpretation comes instead from (a) every layout value being consciously re-tuned as part of
this ticket, and (b) the two behavioural pins, which fail if a value is reinterpreted rather than
re-tuned. Revisit the rename in WN-15.

**Out of scope:** body-vs-body contact. Circles still resolve against segments only and pass through
each other, so every solution stays ramp geometry. Decided 2026-08-15; not a defect, a deferral.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + the re-recorded 30fps/20fps byte table, recorded before `done`>

## Links
Rationale + lab evidence: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`.
Module built by: [WN-17](WN-17-contraption-prototype-lab-pure-integrator-module-h.md) (whose byte table this supersedes).
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
