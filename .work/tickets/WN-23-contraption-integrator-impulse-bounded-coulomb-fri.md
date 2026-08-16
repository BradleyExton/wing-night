---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-23
title: "CONTRAPTION integrator: impulse-bounded Coulomb friction so bodies can slide"
status: done
kind: bug
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-23"
landed_range: 1775e077c2c1bb1524c3b693c703b2105c075fc2..5fa99ebce7de2dbfcf66468e39e7bca4b6ee0fab
review: pending
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
- 2026-08-15T22:39:32.200Z gate1 attempt 2: PASS (product-owner, confidence high), recorded with --supersede — the attempt-1 needs-changes graded pre-re-plan content and no longer binds. The critic verified empirically rather than trusting the Plan: it reproduced the Coulomb model in a scratch tree and RAN both parameter searches. Sizing (the principal re-plan risk) is resolved by measurement — a nested two/four/six set satisfying the un-relaxed pieceSets standard found in ~2s; against the fuller real constraint set (adding the component default-landing and labRun seed-invariance/rebuild-variance) 4.1s / ~25k samples (TWO 22932 tries, FOUR 804, SIX 1368). Blocker (g) confirmed resolved: the nesting test compares segment IDs only, so a re-found nested set leaves it literally untouched, and the contact guard + <=4s settle guard need no relaxation — a legal green path exists with every existing assertion intact. Enumeration totality confirmed by execution: packages/shared goes exactly 4 red (2 slip tests, 2 byte-figure tests), apps/client exactly 5 red pieceSets tests — precisely what AC-5/AC-10/AC-11 name.

THREE MINORS TO CARRY INTO THE BUILD: (1) AC-11 names only the pieceSets predicate, but the re-found geometry must ALSO satisfy labRun/index.test.ts (seed-varied attempts within 0.1 units, a 0.6-unit nudge exceeding it; BASE pieceSetId 'four', seed 20260807) and the component test's default 'two' set landing ('LANDED — in the bucket'). Encode ALL THREE predicates in the search script from the start or the session iterates blind. (2) AC-8's re-point also needs a re-export from packages/shared/src/index.ts — @wingnight/shared exposes only the '.' subpath, so exporting via contraption/index.ts alone leaves the lab unable to import it (typecheck catches it, but loudly and late). (3) AC-11's 'CONTACTS every placed ramp at all 240 integration steps' is loose — the guard requires contact at SOME 240Hz-sampled frame, not every step; a literal reading sends the search after an impossible predicate.

USEFUL: the benchmark ALREADY settles under the new model with its current values (settleIndex 27 patched vs null unpatched), so the AC-9 re-tune carries near-zero search cost while the new settle test is still genuinely discriminating red-before/green-after. Full verdict: .work/verdicts/WN-23.gate1.json
- 2026-08-15T22:40:05.523Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-23
- 2026-08-15T22:43:08.163Z AC-1/2/3/4/5 done. Coulomb model landed in resolveSegmentContacts: tangentSpeed=sqrt(tx^2+ty^2), normalImpulse=|approach|*(1+restitution), reduction=min(tangentSpeed, slip*normalImpulse), scale=(tangentSpeed-reduction)/tangentSpeed. The min IS the clamp — scale is in [0,1] so friction can only remove tangential motion, never reverse it. Zero-tangent guard avoids a 0/0. Uses sqrt/abs/min only, all outside BANNED_MEMBERS; noTranscendentals untouched. The approach>=0 early-return is KEPT per AC-2.

AC-3 PROOF, by stashing not asserting — stashed ONLY resolveSegmentContacts/index.ts (keeping the new tests) and ran the pins against the old resolver: sliding pin travelled 0.155 units against a >20 threshold (RED — the creep-to-dead-stop defect exactly as described); friction pin travelled 67320 units against a <5 threshold (RED — under the old retention semantics slip:5 AMPLIFIES tangential 5x per step). Restored via stash pop, both green. Both pins are red against the current implementation, so neither is vacuous.

AC-5: the two slip tests are re-specified, not deleted or weakened. Under Coulomb the field inverts, so the SAME two situations now assert the opposite values: 'keeps the circle sliding when the friction coefficient is zero' (was: when slip is total) and 'drops the tangential velocity when the friction bound exceeds it' (was: when slip is zero). Added two more cases the old model could not express: the clamp pinned alone (slip 1000 must still only remove, never reverse) and the partial regime (bound 0.15 against tangential 0.5 leaves 0.35) — the regime a body sliding down a ramp actually lives in.

Also corrected the now-false CircleBody.slip doc comment in types.ts, which still read '0 grips, 1 slides frictionlessly' — exactly backwards under the new model and actively misleading if left.
- 2026-08-15T22:49:58.459Z AC-8/9/10/11 done; full gate green (lint + typecheck + test).

AC-8 settle extraction: new packages/shared/src/contraption/resolveSettleIndex/ (resolveSettleIndex + maxDisplacement + SETTLE_EPSILON_UNITS, 8 colocated tests incl. the walk-backwards case where a stalled body is knocked loose). Exported from contraption/index.ts under the Contraption* convention AND re-exported from packages/shared/src/index.ts — gate1 minor 2 was right that AC-8 omitted the root re-export, and @wingnight/shared exposes only the '.' subpath so the lab could not have imported it otherwise. The lab's runOutcome now delegates to the shared predicate instead of keeping a duplicate; its own tests pass unchanged.

AC-9 benchmark: re-tuned CONSCIOUSLY, not carried. Probed the settle behaviour across candidates — wing/marble slip 0.2/0.25 and 0.3/0.35 NEVER settle in 4s, 0.4/0.45 settles at 1.20s, 0.5/0.5 at 0.90s. Chose 0.4 (wing) / 0.45 (marbles): mid-range, physically defensible, and meaningfully different from carrying 0.86/0.9 across the semantic inversion, which would have silently re-read 'nearly frictionless' as 'very grippy'. New colocated benchmarkLayout/index.test.ts asserts settle is non-null, lands in the first half of the run, and that the pre-Coulomb values have not crept back.

AC-10 byte figures re-recorded from the re-tuned fixture: 30fps {jsonObjectBytes 34068, jsonFlatRoundedBytes 8599, packedFloat32Bytes 5808, keyframeCount 121}; 20fps {22794, 5757, 3888, keyframeCount 81}; bodyCount 6 both. The test's comment now states these SUPERSEDE WN-17's table rather than extending it.

AC-11 lab repair: re-found two/four/six by search against ALL THREE predicate sets gate1 named — pieceSets (landed + settle<=4s + every ramp contacted at 240Hz, seed 7 / 6s), the component default ('two' lands at seed 20260807 / 4s), and labRun ('four' seed-invariant within 0.1 units but rebuild-variant under the 0.6 nudge). Encoding all three up front was the right call: TWO found in 2451 tries / 0.4s, FOUR 408 / 0.1s, SIX 219 / 0.1s. Nesting preserved by construction so the nesting test is untouched; no assertion relaxed anywhere. Measured settles: two 2.3s, four 2.9s, six 3.17s — hints updated to those figures. WING slip re-tuned 0.86 → 0.4 for the same inversion reason. The false creep commentary and its dangling creepNote reference are deleted and replaced with what is now true.

Whole ContraptionLab suite 47/47; packages/shared contraption suite 39/39.
- 2026-08-15T23:10:38.269Z qa: PASS (qa-reviewer, high confidence) at 3448f28, recorded. The reviewer verified rather than trusted at every point: a 28,800-case sweep over segment orientations x penetrations x slip in [0..Infinity] x restitution x velocities found ZERO direction reversals, zero magnitude growth, zero non-finite results (and zero-tangent with slip Infinity returns 0, no 0/0); it independently re-derived every byte figure WITHOUT importing measureTrackBytes and matched to the digit; it mutation-probed the contact guard (+25x on each of the 12 ramps turns it red every time, and baseline contacts are true resting contacts at minDist-radius ~1e-15, so the 0.05 slack is not load-bearing); and it reproduced the red-before proof by restoring the base resolver into a scratch tree, finding 8 tests red. It also ran the verify_extra e2e key itself: 14 specs pass.

Acted on its one substantive finding before the re-grade: my comment on the benchmark settle test claimed red-before on the PHYSICS change, and that was false. Because the fixture was re-tuned in the same commit, the old resolver settles it too (index 28); the old resolver only returns null against the OLD 0.86/0.9 fixture. The test still discriminates a bad re-tune under the new physics (0/0, 0.1/0.1, 0.2/0.25, 0.3/0.35 all null) and the physics is red-before-guarded by the two pins, which is where that proof belongs — the comment now says exactly that. Also fixed the ContraptionUiLab on-screen note that told the room WN-23 was unlanded, which this commit falsifies. The re-grade confirmed the delta was genuinely documentation-only by comment-stripping both files and diffing the residue: byte-identical in the test, only the copy string changed.

NOTE on its carried-forward Evidence finding: that was accurate at 3448f28 but is now stale — ## Evidence was filled at 21bbf28, the commit after the graded sha, and carries the verify paste, the superseded byte table with encoding/body-count/per-run basis, the stash-proven red-before figures, the settle-candidate matrix, the route-search results and the clamp sweep.

Declined three advisory minors deliberately (duplicated 0.05 epsilon + the lab's pass-through wrapper, two unused package-root exports, the literal-valued re-tune tripwire). The reviewer explicitly agreed none should have blocked and said fixing them here would have widened a diff whose discipline is carrying exactly its own blast radius. All recorded in ## Evidence for post-merge review.

NEW, not caused by this change: tests/e2e/intro-countdown.spec.ts is a pre-existing timing flake (2.5s window to catch one countdown tick; red once on a contended 1.1m run, green on 3 subsequent runs). Recorded in ## Evidence and flagged for its own ticket — the manifest routes every apps/client/src/** diff through the e2e key, so it can redden unrelated gates.
- 2026-08-15T23:10:46.486Z handed off → in-review (verify green); awaiting land
- 2026-08-16T00:46:25.920Z auto-landed on green verdicts + attestation (in-review → done); review: pending

## Evidence
### Verify

```
$ work verify
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ verify passed (3 step(s))
```

Whole tree **746 tests, 0 fail, 0 skipped, 0 todo**. `packages/shared` contraption suite 39/39;
`apps/client` 374/374 — including the five `pieceSets` tests this change would otherwise have turned
red. AC-12's `verify_extra` `e2e` key was run by the QA pass at this sha: **14 Playwright specs
passed**, regression coverage of /admin, /host, /display and the minigame sandbox, none of which
reference the lab.

### AC-3 — the sliding pin is red against the old implementation, proven by stashing

Stashed **only** `resolveSegmentContacts/index.ts`, keeping the new tests, and ran them against the
pre-WN-23 resolver:

| pin | threshold | old resolver | verdict |
|---|---|---|---|
| slides a low-friction body down a shallow ramp | travel > 20 | **0.155** | RED — the creep-to-dead-stop defect |
| brings a high-friction body to rest | travel < 5 | **67320** | RED — old semantics amplify tangential 5×/step |

Restored via `git stash pop`; both green after. The QA pass independently reproduced this by
restoring the base resolver into a scratch tree and found **8 tests red** — both re-specified slip
tests, both new clamp cases, both pins, and both byte-figure tests.

Travel is monotone in the coefficient (slip 0 → 50.2, 0.1 → 37.7, 0.3 → 12.7, ≥0.5 → 0.14), so both
thresholds have a real failure band on either side rather than sitting at an extreme.

### AC-10 — byte figures, re-recorded

**WN-17's published table is SUPERSEDED, not extended.** The geometry's materials AND the contact
physics both changed, so the two sets of numbers are not comparable and must not be diffed.

Basis: `CONTRAPTION_BENCHMARK_LAYOUT`, **6 bodies**, seed 1234, `durationSeconds: 4`, `stepHz: 240`,
measured **per whole run**, JSON serialised as UTF-8.

| keyframeHz | keyframes | jsonObjectBytes | jsonFlatRoundedBytes | packedFloat32Bytes |
|---|---|---|---|---|
| 30 | 121 | 34068 | 8599 | 5808 |
| 20 | 81 | 22794 | 5757 | 3888 |

The QA pass re-derived every figure independently, without importing `measureTrackBytes`, and
matched to the digit — confirming all coordinates finite, so the smaller JSON is not a degenerate or
NaN run.

### AC-9 — the benchmark now reaches a verdict

Before this change the fixture **never settled** (`resolveSettleIndex` → `null`): the five marbles
crept forever, so it could not be graded at all. Re-tuned consciously rather than carried, because
`slip` inverted meaning — candidates measured at the byte-measure parameters:

| wing / marble slip | settle |
|---|---|
| 0.86 / 0.9 (the pre-Coulomb values) | 0.90s — but as "very grippy", not the "nearly frictionless" they were authored as |
| 0.2 / 0.25 | **never settles** |
| 0.3 / 0.35 | **never settles** |
| **0.4 / 0.45 (chosen)** | **1.20s** |
| 0.5 / 0.5 | 0.90s |

WN-24's assumption that "the benchmark preset now reaches a verdict" is true.

### AC-11 — lab routes re-found

Searched against all three predicate sets the gate actually runs, not just the `pieceSets` one: its
own suite (landed + settle ≤ 4s + every ramp contacted at 240Hz), the component's default `two`-set
landing, and `labRun`'s seed-invariance / rebuild-variance pair. **TWO** found in 2451 tries (0.4s),
**FOUR** 408 (0.1s), **SIX** 219 (0.1s). Measured settles: two 2.3s, four 2.9s, six 3.17s — the
hints now carry those figures.

Nesting is preserved by construction, so the nesting test is untouched. **No standard was relaxed.**
The QA pass mutation-probed the contact guard: shifting each of the 12 ramps by +25x turns it red
every time, and baseline contacts are true resting contacts (`minDist − radius` ≈ 1e-15), so the
0.05 slack is not load-bearing.

### The clamp, verified exhaustively

The QA pass swept **28,800 cases** — 4 segment orientations × penetrations × `slip` ∈ [0 … Infinity]
× restitution × tangential/normal velocities — and found **0 direction reversals, 0 magnitude
growth, 0 non-finite results**. Zero-tangent contacts with `slip: Infinity` return 0 rather than 0/0.

### Verdicts

- `gate1`: **pass** (attempt 2, superseding the pre-re-plan grade) — `.work/verdicts/WN-23.gate1.json`
- `qa`: **pass** — `.work/verdicts/WN-23.qa.json`

### Known-imperfect, recorded rather than fixed

Acted on: a comment on the benchmark settle test that overclaimed red-before (it gates the fixture,
not the physics — corrected to say so), and the ContraptionUiLab note that said WN-23 was unlanded.

Left, all advisory and all surfaced for post-merge review:

- The `0.05` settle epsilon is now duplicated between the lab and the shared module, and the lab's
  local `resolveSettleIndex` is a pass-through wrapper.
- `contraptionMaxDisplacement` and `CONTRAPTION_SETTLE_EPSILON_UNITS` are exported from the package
  root with no consumer outside the new module's own test.
- The re-tune guard asserts on literal values (`!slips.includes(0.86)`), so it is a revert tripwire
  rather than a behavioural assertion. The load-bearing guard is the settle assertion above it.
- `slip` remains a misleading name post-inversion. Deliberately deferred to WN-15 with the piece
  vocabulary; every value site in the tree is re-tuned here so nothing is silently reinterpreted.
- A comment in the moved `resolveSettleIndex` test says skipping a body missing from the earlier
  frame "keeps it from reading as zero motion", while the assertion is exactly that it reads as
  zero. Behaviour is correct and unchanged from the lab original; only the rationale is wrong —
  same class as the benchmark comment fixed here, worth the same treatment next pass.

### Pre-existing flake, surfaced by this ticket's e2e run but NOT caused by it

`tests/e2e/intro-countdown.spec.ts:31` asserts the display catches the "1" tick of a 3-2-1
countdown inside a 2.5s window. The QA pass saw it go red once on a contended machine (that run took
1.1m against the 24.3s a clean run takes), then pass on two isolated re-runs and a full clean
re-run (14/14). `git diff 832d6eb..HEAD -- tests/` is empty — this ticket never touches the spec.

Worth its own ticket rather than a retry habit: the manifest routes every `apps/client/src/**`
change through the `e2e` key, so this flake can redden an unrelated gate on load.

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (4 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ e2e: CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e
```

**Anti-blind-spot grep:** 15 symbol(s) with external call-sites reviewed (2 low-signal name(s) skipped: first, last):

- `after` → apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:70, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:108, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:126, apps/client/src/components/ContraptionUiLab/index.test.tsx:122, apps/client/src/components/ContraptionUiLab/index.test.tsx:128, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:202, apps/client/src/components/HostControlPanel/MinigameSurface/index.test.tsx:105, apps/client/src/components/HostControlPanel/MinigameSurface/index.tsx:60, … 24 more (run `work grep`)
- `alongX` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:52, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:54, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:60, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:61, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:55, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:57, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:63, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:64
- `alongY` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:53, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:54, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:60, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:62, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:56, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:57, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:63, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:65
- `as` → apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:7, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/styles.ts:3, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:3, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:8, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:11, apps/client/src/components/AdminConfigWizard/EntryListEditor/styles.ts:12, apps/client/src/components/AdminConfigWizard/EntryListEditor/styles.ts:13, apps/client/src/components/AdminConfigWizard/FieldIssue/index.tsx:2, … 430 more (run `work grep`)
- `before` → apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:80, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.ts:5, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:81, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:82, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:124, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:22, apps/client/src/components/ContraptionUiLab/index.test.tsx:119, apps/client/src/components/ContraptionUiLab/index.test.tsx:127, … 31 more (run `work grep`)
- `drift` → apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:12, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:12, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:15, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:16, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:17, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:18, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:19, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/Embers/styles.ts:20, … 6 more (run `work grep`)
- `index` → apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:13, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:4, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:21, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:53, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:62, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:17, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:41, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:61, … 445 more (run `work grep`)
- `length` → apps/client/src/components/AdminConfigWizard/ReviewStep/index.tsx:65, apps/client/src/components/AdminConfigWizard/ReviewStep/index.tsx:66, apps/client/src/components/AdminConfigWizard/ReviewStep/index.tsx:72, apps/client/src/components/AdminConfigWizard/ReviewStep/index.tsx:73, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:87, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:109, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:143, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:73, … 276 more (run `work grep`)
- `previous` → apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:41, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:80, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:139, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:143, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:147, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:105, apps/client/src/components/AdminConfigWizard/index.tsx:105, apps/client/src/components/AdminConfigWizard/index.tsx:106, … 35 more (run `work grep`)
- `resolved` → apps/client/src/components/AnamorphLab/index.tsx:17, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:15, packages/minigames/drawing/src/runtime/views/index.ts:69, tests/e2e/minigame-sandbox.spec.ts:183, tools/playwright-ports/index.mjs:16
- `run` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:10, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:22, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:75, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:87, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:101, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:107, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:117, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:118, … 117 more (run `work grep`)
- `runOf` → apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:14, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:28, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:35
- `settleSeconds` → apps/client/src/components/ContraptionLab/index.tsx:41, apps/client/src/components/ContraptionLab/index.tsx:43, apps/client/src/components/ContraptionLab/index.tsx:48, apps/client/src/components/ContraptionLab/index.tsx:50, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:37, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:39, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:40, apps/client/src/components/ContraptionLab/runOutcome/index.test.ts:123, … 3 more (run `work grep`)
- `step` → apps/client/src/components/AdminConfigWizard/FieldIssue/index.tsx:9, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:128, apps/client/src/components/AdminConfigWizard/fieldTokens/index.ts:1, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:50, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.ts:7, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:32, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:154, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:155, … 22 more (run `work grep`)
- `still` → apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:70, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:128, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:107, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:99, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:223, apps/client/src/components/ContraptionLab/copy.ts:19, apps/client/src/components/ContraptionLab/copy.ts:62, apps/client/src/components/ContraptionLab/runOutcome/index.test.ts:113, … 21 more (run `work grep`)

**QA findings (advisory):** 6 finding(s) carried from the passing verdict:
- **minor** — CARRIED FORWARD, unchanged. The ticket's `## Evidence` section is still the unfilled template placeholder, while AC-10 requires it to state plainly that WN-17's published table is superseded, not extended, and AC-13 requires the lint/typecheck/test output pasted into it. The substance exists elsewhere — the supersession statement is in the measureTrackBytes test comment, and the full 30fps/20fps table is in `## Progress`, where every figure matches my independent re-derivation exactly. Also note this documentation commit appended no `## Progress` entry, so the restart-safe log does not yet record the two corrections it makes. Both are recording gaps whose deadline is the done-flip (the placeholder itself reads 'recorded before done' and the ticket is still in-progress), which is downstream of this gate — hence minor rather than a partial-AC major. Must be filled before done.
    evidence: .work/tickets/WN-23-contraption-integrator-impulse-bounded-coulomb-fri.md:181-182 — '## Evidence' followed by the placeholder. `git diff 4f1abcd..HEAD --stat -- .work/` is empty.
- **minor** — CARRIED FORWARD, consciously not actioned by the coordinator — and I agree it should not have blocked. The settle epsilon is a duplicated constant and the lab's local wrapper is a pass-through: apps/client's runOutcome keeps its own `const SETTLE_EPSILON_UNITS = 0.05` (with the same docstring the shared module now also carries) and passes it explicitly, while the shared module's exported `CONTRAPTION_SETTLE_EPSILON_UNITS = 0.05` has zero importers anywhere in the tree; the local `resolveSettleIndex` fails the deletion test, since deleting it makes its single caller call `resolveContraptionSettleIndex(run, ...)` directly with no complexity reappearing. This is the closest of the three unactioned minors to structural, but it stays minor because the settle ALGORITHM is genuinely single-sourced — which is what the plan promised and what prevents the drift it was worried about — and only a documented default literal is duplicated.
    evidence: apps/client/src/components/ContraptionLab/runOutcome/index.ts:31 vs packages/shared/src/contraption/resolveSettleIndex/index.ts:19, and runOutcome/index.ts:96-98. rules/code-design.md Modules: 'Deletion test: imagine deleting the module. If complexity vanishes, it was a pass-through.'
- **minor** — CARRIED FORWARD, consciously not actioned — correctly non-blocking. `contraptionMaxDisplacement` and `CONTRAPTION_SETTLE_EPSILON_UNITS` are re-exported from the package root with no consumer outside the new module's own colocated test; grep across apps/**, packages/** finds only the two export lines and the internal test. `maxDisplacement` is an implementation helper of `resolveSettleIndex`, so exporting it widens the package's public interface for a test that could cross the module's real seam instead.
    evidence: packages/shared/src/contraption/index.ts:4-8 and packages/shared/src/index.ts:4-5; the only reads are packages/shared/src/contraption/resolveSettleIndex/index.test.ts:60,71. rules/code-design.md Modules: 'don't re-export a symbol only used inside.'
- **info** — CARRIED FORWARD, consciously not actioned — correctly non-blocking. The re-tune guard test asserts on literal values rather than behaviour: `assert.ok(!slips.includes(0.86))` / `!slips.includes(0.9)`. It passes for slip 0.861 and fails for any future fixture that legitimately lands on 0.9, so it can fail for the wrong reason in both directions. The genuinely load-bearing guard is the settle assertion above it — which the corrected comment now, accurately, identifies as a fixture gate — so this one is a revert tripwire and nothing more.
    evidence: packages/shared/src/contraption/benchmarkLayout/index.test.ts:57-61. rules/testing.md What to assert: 'assert on stable structural signals'.
- **info** — CARRIED FORWARD. A moved-code test carries a comment that contradicts its own assertion: it says skipping a body missing from the earlier frame 'keeps it from reading as zero motion', but the assertion is `maxDisplacement(before, after) === 0` — i.e. it does read as zero motion. The behaviour pinned is unchanged from the lab original and is correct; only the rationale is wrong. This is the same class of defect as the benchmark comment the delta just fixed, so it may be worth the same treatment on the next pass.
    evidence: packages/shared/src/contraption/resolveSettleIndex/index.test.ts:64-72.
- **info** — NEW, and not caused by this change. My first full e2e run at this sha went red on tests/e2e/intro-countdown.spec.ts — `expect(getByText(/^1$/)).toBeVisible({ timeout: 2_500 })`, i.e. the display must catch the '1' tick of a 3-2-1 countdown inside a 2.5s window. That run took 1.1m against the 24.3s a clean run takes, so the machine was contended and the tick was missed. It passed on two isolated re-runs (8.4s, 6.9s) and on a full clean re-run (14 passed). The spec is untouched by this ticket (`git diff 832d6eb..HEAD -- tests/` is empty) and the only client-side change in the delta is a copy string in a lab route the spec never renders. Recording it because the manifest routes apps/client/src/** changes through the e2e key, so this flake can redden a WN-23-adjacent gate for reasons that have nothing to do with the diff — worth its own ticket rather than a retry habit.
    evidence: tests/e2e/intro-countdown.spec.ts:31 — failed once at 1.1m wall-clock, passed 3/3 subsequently including a full-suite 14/14.

- verify_extra: step `e2e` required — the diff touched `apps/client/src/components/ContraptionLab/pieceSets/index.ts`

_Captured 2026-08-15T23:10:46.486Z._
<!-- captured-evidence:end -->

## Links
Rationale + lab evidence: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`.
Module built by: [WN-17](WN-17-contraption-prototype-lab-pure-integrator-module-h.md) (whose byte table this supersedes).
Gate1 verdict this re-plan answers: `.work/verdicts/WN-23.gate1.json`.
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
