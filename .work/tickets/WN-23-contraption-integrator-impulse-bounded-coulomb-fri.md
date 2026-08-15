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
creeping to a dead stop — carrying along **everything the verify gate proves red under the new
physics**: the WN-18 lab's piece-set routes (re-found minimally), the benchmark fixture (re-tuned
to actually settle, now machine-checked), and the byte figures WN-15's architecture decision cites.

## Acceptance Criteria
- [ ] `resolveSegmentContacts` applies friction as a bound on the tangential change —
      `min(|tangential|, slip * |normalImpulse|)`, where `normalImpulse` is the normal velocity
      change the contact applies, `|approach| * (1 + restitution)` — rather than scaling tangential
      velocity by a flat factor. The reduction **must clamp**: friction can never reverse
      tangential direction, only remove it. Today's defect is at
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
- [ ] **Settle predicate extracted to the shared package** so settling is machine-checkable where
      the fixture lives: the lab's `resolveSettleIndex` + `maxDisplacement`
      (`apps/client/src/components/ContraptionLab/runOutcome/index.ts:91-124`) move to a new
      `packages/shared/src/contraption/resolveSettleIndex/` module (colocated tests; exported via
      `contraption/index.ts` following its `Contraption*` renaming convention; the 0.05
      settle-epsilon stays the default). The lab's `runOutcome` is re-pointed at the shared module
      and its existing tests pass unchanged.
- [ ] `CONTRAPTION_BENCHMARK_LAYOUT` is **re-tuned so the run actually settles** — geometry AND
      material values (`slip` inverts meaning under Coulomb: 0.86 flips from *nearly frictionless*
      to *nearly maximum friction*, so every value is consciously re-chosen, not carried). Proven by
      a **new colocated test** at `benchmarkLayout/` asserting, via the shared settle predicate,
      that a `seed: 1234, durationSeconds: 4, stepHz: 240` run (the byte-measure parameters)
      settles — settle index non-null. Today it grades `restless` because the five marbles never
      stop; this AC is what makes WN-24's "the benchmark preset now reaches a verdict" assumption
      true.
- [ ] `measureTrackBytes/index.test.ts:52-72` figures re-recorded at **both 30fps and 20fps** from
      the re-tuned fixture, and `## Evidence` states plainly that **WN-17's published table is
      superseded, not extended** — the geometry AND the physics both changed, so the numbers are not
      comparable. Record encoding (JSON/UTF-8), body count, and the per-whole-run basis, as WN-17 did.
- [ ] **Lab repair rides along** (the breakage this ticket itself causes — gate1 proved 5 of the
      pieceSets tests red under the new model): the `two`/`four`/`six` routes in
      `apps/client/src/components/ContraptionLab/pieceSets/index.ts` are **re-found minimally**
      against the fixed physics, keeping every existing test standard un-relaxed — each route LANDS,
      CONTACTS every placed ramp at all 240 integration steps, settles ≤ 4s, and **nesting is
      preserved** (the un-nesting re-design stays WN-24's; the nesting test at
      `pieceSets/index.test.ts:103-110` is untouched). The lab `WING` material is consciously
      re-tuned under the inverted `slip` semantics. The now-false creep commentary
      (`pieceSets/index.ts:96-100`, including the dangling `creepNote` reference qa flagged at
      WN-18) is deleted, and the hints' factual settle figures are updated to measured values —
      hint copy itself is *judgment-only* (no test asserts copy, per `rules/testing.md`).
- [ ] The diff touches `apps/client/src/**`, so the handoff's verify run **includes the full `e2e`
      suite** (manifest `verify_extra`) — expected green: no Playwright spec references the lab, so
      this is regression coverage of /admin, /host, /display, and the minigame sandbox.
- [ ] `pnpm lint` → `pnpm typecheck` → `pnpm test` all pass, with output pasted into `## Evidence`.

## Plan
Re-grilled 2026-08-15 (plan-work Mode B, autonomous run) after the gate1 `needs-changes` verdict
(`.work/verdicts/WN-23.gate1.json`) and against the new pre-ready checklist
(claude-dev-system `docs/ticket-readiness.md` §3). The three findings and their resolutions:

**Blocker — sequencing contradiction, checklist (f)+(g).** The verify gate runs the WN-18 lab's
suites (`pnpm test` → `pnpm -r` → @wingnight/client), and gate1 *demonstrated* the Coulomb model
turns 5 pieceSets tests red (routes flip `landed → perched`). The sanctioned repair was WN-24 —
sequenced *after* this ticket, an unexpressible-in-the-DAG contradiction. **Resolution (directed by
the user, 2026-08-15): the repair rides along here.** The lab routes are re-found *minimally* —
same scene, same nesting, same test standards — purely to keep the gate honestly green.
`(self-answered — autonomous run)`: WN-23 and WN-24 stay **separate slices** rather than merging —
WN-24's real scope (re-find against WN-25's picked direction, un-nesting, a sliding showcase, hint
re-framing, human question-driving) is a full context window by itself; merging would fail sizing.
The cost accepted: the minimal routes found here are throwaway — WN-24 re-finds them properly.

**Major — unverifiable settle AC, checklist (h).** The only settling predicate in the tree lived in
the lab (`resolveSettleIndex`, apps/client), so "re-tuned so the run actually settles" had no
runnable check in packages/shared and a half-tune would land silently. **Resolution: extract the
predicate to `packages/shared/src/contraption/resolveSettleIndex/` and add a colocated
benchmark-settles test.** `(self-answered — autonomous run)`: the lab is re-pointed at the shared
module rather than keeping a duplicate — two settle definitions would drift, the extraction meets
the house extraction bar (independently testable + reused across the benchmark test and the lab),
and WN-15's production reducer will need a settle predicate anyway. The predicate stays
goal-agnostic (settle only); outcome classification (`landed`/`perched`/…) stays lab-local.

**Minor — the false re-tune claim.** The old Plan claimed safety from "every layout value being
consciously re-tuned", while the lab's `slip: 0.86` was out of scope. Now true by construction:
both value sites in the tree (`benchmarkLayout` and the lab `WING`) are in scope and re-tuned under
the inverted semantics. (Also fixed: the byte-figure citation drift, 52-71 → 52-72.)

**Model chosen: impulse-bounded Coulomb** (unchanged from the first grill). Reduce tangential
velocity by `min(|tangential|, slip * |normalImpulse|)`. A hard impact bites hard; a resting body
gets a small bite proportional to gravity, so sliding survives. It also makes ramp *angle*
meaningful for the first time — steep slides fast, shallow slides slow — which is what gives a team
something to be clever with. Two alternatives were considered and rejected: applying the existing
multiplier only on the contact-entry step (simpler, but leaves a resting body frictionless forever —
the opposite unphysical extreme), and a step-rate-normalised per-second decay (needs `Math.pow`,
which the module's portability guarantee bans).

**Edge cases specified here so they are not rediscovered mid-build:**
- Friction clamps at `min(...)` — never reverses tangential direction.
- A corner-wedged body takes friction once per segment it resolves against, in layout order; the
  existing corner test pins that ordering.
- The zero-length-segment guard (`alongLengthSquared === 0`) is unchanged.

**The two searches are scriptable, which is what keeps this one-context-sized.** Both the benchmark
re-tune and the route re-find are parameter searches against the real integrator with runnable
predicates (the shared settle test; the pieceSets land/contact/settle standard) — write a throwaway
search script in the session scratchpad, as WN-18 did. Sliding physics should make routes *easier*
to find than WN-18's creep physics did. If the searches still blow the window, the restart-safe
Progress log is the fallback — do not cut the repair loose into a later ticket; that recreates the
sequencing contradiction this re-plan exists to fix.

**Deferred — the `slip` rename.** Under the new model the field's meaning inverts: today `slip: 0.9`
means *nearly frictionless*, whereas a Coulomb coefficient of 0.9 means *nearly maximum friction*.
Renaming it to `friction` would make typecheck force every call-site to be revisited. **Held
deliberately at the user's call (2026-08-15): the name should follow the piece vocabulary, which is
not settled until WN-15 is planned** (WN-25's direction is picked, but the piece vocabulary lands
with WN-15). Protection against silent reinterpretation comes instead from every value site being
re-tuned inside this ticket plus the two behavioural pins. Revisit the rename in WN-15.

**Out of scope:** body-vs-body contact (circles still resolve against segments only — decided
2026-08-15; not a defect, a deferral). The design-driven preset work — un-nesting, the sliding
showcase, WN-25-direction geometry, hint re-framing — all WN-24.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + the re-recorded 30fps/20fps byte table, recorded before `done`>

## Links
Rationale + lab evidence: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`.
Module built by: [WN-17](WN-17-contraption-prototype-lab-pure-integrator-module-h.md) (whose byte table this supersedes).
Gate1 verdict this re-plan answers: `.work/verdicts/WN-23.gate1.json`.
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
