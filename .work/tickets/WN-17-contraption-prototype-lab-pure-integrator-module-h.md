---
id: WN-17
title: "CONTRAPTION integrator module + keyframe byte measurement (headless half)"
status: in-review
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
- 2026-08-07T15:12:11.161Z gate1: pass (attempt 2, --supersede). The verdict on disk graded the pre-split combined ticket (needs-changes, 3 majors); plan-work had already re-planned it into WN-17 headless + WN-18 harness, so the critic was re-invoked on the current ticket rather than the ticket being demoted again. Prior grade stays in .work/verdicts/journal.jsonl. New verdict: pass, confidence high, findings all minor/info (packages/shared entry re-export needed by WN-18; transcendental scan should cover all module files and exclude its own; measurement code has no stated home in-tree).
- 2026-08-07T15:12:11.270Z prototype: skipped (not in plan)
- 2026-08-07T15:12:31.390Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-17
- 2026-08-07T15:21:12.447Z Built packages/shared/src/contraption/: types.ts, simulate/ (position-Verlet, xorshift32 seed jitter, keyframe emission) + simulate/resolveSegmentContacts/ (circle-vs-static-segment, restitution + slip), measureTrackBytes/, benchmarkLayout/ (6 bodies, 7 segments), and the module entry re-exporting under Contraption* names from packages/shared/src/index.ts (so WN-18 can import from the package's single '.' export — the gate1 minor). 24 colocated tests pass. The transcendental scan proved non-vacuous on first run: it caught 'Math.random' written in a doc comment in simulate/index.ts, which I reworded rather than narrowing the scan.
- 2026-08-07T15:30:06.077Z qa: pass (qa-reviewer, sha a2920ee, confidence high) — recorded to .work/verdicts/WN-17.qa.json. Reviewer independently re-derived all six byte figures with its own script (Buffer.byteLength instead of TextEncoder) and got an exact match, and proved the transcendental scan non-vacuous by adding Math.pow to a nested source file in a /tmp copy and observing the red. Four advisory findings ride into evidence, none blocking: (1) Evidence still placeholder at the graded sha — written by this handoff; (2) one test title contains 'and' (testing.md one-behaviour rule); (3) the source-text regex cannot see computed/destructured Math access or a helper imported from outside the module — a recorded limit, not a present defect; (4) the sub-unit jitter assertion bounds at 0.01 vs the 0.0005 constant. Per work-on step 7 minors are not loop fodder and were not iterated on.
- 2026-08-07T15:30:06.192Z browser-verify: skipped (non-UI)
- 2026-08-07T15:30:34.587Z handed off → in-review (verify green); awaiting land
- 2026-08-07T15:31:18.164Z re-attested at in-review (verify + qa re-run green) for fd257edd

## Evidence
### Keyframe byte measurement — the number WN-15 is waiting on

**Method, stated in full so the figure is not under-specified.**

| | |
|---|---|
| Layout | `CONTRAPTION_BENCHMARK_LAYOUT` (exported from `@wingnight/shared`, so this is re-derivable) |
| Bodies | **6** circles (1 wing + 5 marbles) against 7 static segments on a 100×100 field |
| Basis | **one whole 4s run**, not per emit |
| Integration | `stepHz: 240` (unchanged between the two rows — only the sampling rate differs) |
| Seed | `1234` |
| Encoding | **JSON, UTF-8 byte count** — matching how minigame runtime state actually crosses socket.io as `SerializableValue` |

| Emit rate | Keyframes | JSON as emitted (`{x,y}`, full precision) | JSON as you'd ship it (flat `[x,y,…]`, 2dp) | *(secondary)* packed float32 |
|---|---|---|---|---|
| **30 fps** | 121 | **33,978 B** (33.2 KiB) | **8,610 B** (8.4 KiB) | 5,808 B |
| **20 fps** | 81 | **22,759 B** (22.2 KiB) | **5,770 B** (5.6 KiB) | 3,888 B |

The packed-float32 column is a clearly-labelled secondary: it is **not** a `SerializableValue` and
would need a second channel, so it is a comparison point, not an option on the table today.

**Reading it for the (a)-vs-(b) decision — a measurement, not a recommendation.** WN-15's option (a)
costs "track weight in the snapshot". At the shape you would actually ship (flat, 2dp JSON) that is
**8.6 KB at 30fps and 5.8 KB at 20fps per run**. Two caveats the number alone does not carry: the
naive shape — emitting `simulate`'s return value verbatim — is ~4× heavier, so option (a)'s cost
depends on a serialization choice that has not been made yet; and this is the cost *per broadcast*,
so whether the track rides every snapshot or is sent once is the larger lever than the frame rate.
Both rows describe **identical motion** (`keyframeHz` only chooses the sampling rate — asserted by
`describes identical motion at 20fps and 30fps when the integration rate is unchanged`), so the
comparison is apples-to-apples.

### What the determinism tests do and do NOT establish

`produces a byte-identical track when the same layout and seed are re-simulated` proves **same-process
replay stability**. It does **not** prove the cross-engine portability WN-15's option (b) needs — that
rests on the module using no implementation-defined `Math` member, which `noTranscendentals.test.ts`
guards, and which is itself **necessary but not sufficient**. The limit is stated in the test file
rather than left to this ticket's prose.

The scan is not vacuous, and that is evidenced twice over. It caught a real occurrence unprompted on
its first run (`Math.random` written in a doc comment in `simulate/index.ts`, reworded rather than
narrowing the scan), and the qa-reviewer independently injected `Math.pow` into the *nested*
`resolveSegmentContacts/index.ts` in a scratch copy outside the repo and observed the expected red.

### Verify gate

```
$ work verify
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ verify passed (3 step(s))
```

24 colocated contraption tests pass inside `packages/shared`'s 74-test run — confirming the WN-9
lesson (that package's `tsx --test "src/**/*.test.ts"` really does execute colocated `.test.ts`).
`pnpm --filter @wingnight/client build` also succeeds (✓ 2046 modules transformed), proving the new
`packages/shared` re-export does not drag anything node-only into the browser bundle — the WN-3
crash class, checked rather than assumed.

Browser-verify: skipped (non-UI — `kind: spike`, no route, no React, no canvas; the visual half is
WN-18).

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 22 symbol(s) with external call-sites reviewed (5 low-signal name(s) skipped: body, files, first, next, path):

- `Run` → apps/client/src/components/RootRouteLanding/copy.ts:18, packages/minigames/trivia/src/client/HostTriviaSurface/copy.ts:3
- `advance` → apps/server/src/roomState/phaseState/index.ts:148, packages/minigames/geo/src/client/HostGeoSurface/copy.ts:8, packages/minigames/trivia/src/client/HostTriviaSurface/copy.ts:2
- `falling` → tools/playwright-ports/index.mjs:8, tools/playwright-ports/index.test.mjs:30, tools/playwright-ports/index.test.mjs:34, tools/playwright-ports/index.test.mjs:38, tools/playwright-ports/index.test.mjs:42
- `fast` → apps/client/src/copy/minigameBriefings.ts:59, apps/server/src/contentLoader/loadGameConfig/index.ts:23, apps/server/src/reloadContentIntoRoomState/index.ts:26, packages/minigames/core/src/index.ts:74
- `flat` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:49, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:57, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:59, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:139, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:56, apps/client/src/components/AnamorphLab/copy.ts:9, apps/client/src/components/AnamorphLab/index.tsx:19, apps/server/src/configService/index.ts:19
- `found` → tests/e2e/refresh-rehydrate.spec.ts:24, tools/import-geo-photos/index.mjs:213
- `gap` → apps/client/src/components/AnamorphLab/styles.ts:10, apps/client/src/components/AnamorphLab/styles.ts:12, apps/client/src/components/AnamorphLab/styles.ts:49, apps/client/src/components/AnamorphLab/styles.ts:53, apps/client/src/components/AnamorphLab/styles.ts:66, apps/client/src/components/AnamorphLab/styles.ts:68, apps/client/src/components/AnamorphLab/styles.ts:72, apps/client/src/components/ContentFatalState/styles.ts:10, … 126 more (run `work grep`)
- `length` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:44, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:62, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:91, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:92, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:137, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:181, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:199, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:246, … 246 more (run `work grep`)
- `moved` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/useConfigDraft.ts:142, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/useConfigDraft.ts:143
- `normal` → apps/client/src/components/HostControlPanel/CompactSummarySurface/styles.ts:22, packages/minigames/drawing/src/client/HostDrawingSurface/styles.ts:14
- `of` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:26, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:79, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:67, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:86, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:114, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:139, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:140, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:7, … 162 more (run `work grep`)
- `options` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:23, apps/client/src/components/AnamorphLab/LabControls/index.tsx:31, apps/client/src/components/AnamorphLab/LabControls/index.tsx:38, apps/client/src/components/AnamorphLab/LabControls/index.tsx:100, apps/client/src/components/AnamorphLab/LabControls/index.tsx:113, apps/client/src/components/AnamorphLab/LabControls/index.tsx:126, apps/client/src/components/AnamorphLab/LabControls/index.tsx:139, apps/client/src/components/AnamorphLab/LabControls/index.tsx:191, … 60 more (run `work grep`)
- `origin` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:117, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:119, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:125, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:126, apps/client/src/components/DisplayBoard/StageSurface/TurnResultsStageBody/styles.ts:25, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/sampleDraft.ts:45, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/sampleDraft.ts:46, apps/client/src/components/MinigameDevSandbox/index.test.tsx:17, … 4 more (run `work grep`)
- `previousX` → apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:94, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:102
- `previousY` → apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:94, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:95, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:102
- `resolved` → apps/client/src/components/AnamorphLab/index.tsx:17, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:11, packages/minigames/drawing/src/runtime/views/index.ts:69, tests/e2e/minigame-sandbox.spec.ts:183, tools/playwright-ports/index.mjs:16
- `run` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantA.tsx:4, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:3, apps/client/src/copy/host.ts:76, apps/client/src/copy/host.ts:143, apps/server/src/configService/index.ts:21, apps/server/src/reloadContentIntoRoomState/index.ts:23, apps/server/src/reloadContentIntoRoomState/index.ts:52, apps/server/src/roomState/baseMutations/index.ts:89, … 37 more (run `work grep`)
- `second` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:155, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:157, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:158, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:193, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:194, apps/client/src/components/AnamorphLab/styles.ts:26, apps/client/src/components/MinigameDevSandbox/index.test.tsx:41, apps/server/src/configService/index.ts:94, … 5 more (run `work grep`)
- `source` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:39, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:41, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:128, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:133, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:134, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:178, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:180, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:196, … 6 more (run `work grep`)
- `step` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:34, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:52, apps/client/src/components/AnamorphLab/LabControls/index.tsx:86, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:2, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:40, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:42, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:55, apps/server/src/roomState/testHarness.ts:171, … 1 more (run `work grep`)
- `stepIndex` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:24, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:27, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:35, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:45, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:47, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:63, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:85, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:186, … 3 more (run `work grep`)
- `steps` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:39, apps/client/src/copy/minigameBriefings.ts:11, apps/client/src/copy/minigameBriefings.ts:41, apps/client/src/copy/minigameBriefings.ts:60, apps/client/src/copy/minigameBriefings.ts:73, apps/server/src/roomState/testHarness.ts:199, tests/e2e/minigame-sandbox.spec.ts:135

**QA findings (advisory):** 4 finding(s) carried from the passing verdict:
- **minor** — AC 4's deliverable is the *recorded* measurement, and at the graded sha `## Evidence` is still the untouched placeholder `<test output + the byte measurement table (30fps / 20fps, JSON, body count, per-run basis)>`. The measurement code is complete and fully specified, so this is a handoff-step gap rather than a code gap — precedent confirms it (at WN-9's own QA sha b00e29b the Evidence section was likewise still the placeholder, and WN-16 recorded evidence in the same commit as the QA pass). Flagging it because `measureTrackBytes/index.test.ts:48` asserts these values 'lock the exact figures recorded in WN-17's ## Evidence' and right now there are no such figures to lock against. The handoff must write: encoding JSON/UTF-8, layout CONTRAPTION_BENCHMARK_LAYOUT, 6 bodies, per-whole-4s-run basis, seed 1234, stepHz 240 — 30fps: 121 keyframes, 33978 B object-JSON / 8610 B flat-2dp-JSON / 5808 B packed-float32 (secondary); 20fps: 81 keyframes, 22759 B / 5770 B / 3888 B.
    evidence: .work/tickets/WN-17-contraption-prototype-lab-pure-integrator-module-h.md `## Evidence` is unchanged in `git diff main...HEAD` (only status/worktree/Progress moved); measureTrackBytes/index.test.ts:48-51 forward-references it.
- **minor** — testing.md's one-behaviour rule ('If the title contains "and", split it into two'): `measureTrackBytes/index.test.ts:22` is titled "reports the layout's body count and the track's own frame count" and asserts two independent projections (`bodyCount` vs `keyframeCount`) in one case.
    evidence: .work/rules/testing.md — 'One behaviour per test. If the title contains "and", split it into two.'; packages/shared/src/contraption/measureTrackBytes/index.test.ts:22-27.
- **info** — The transcendental guard is a source-text regex (`Math\s*\.\s*<member>\b`), so three evasions stay open: computed access (`Math["pow"]`), destructuring (`const { pow } = Math`), and a banned call reached through a helper imported from *outside* `src/contraption/` (the scan's root is the module dir only). None apply today — every import in the module is relative and internal, which I verified — but nothing guards the third case if a future edit reaches for a shared math helper. Recording it as a known limit, not a defect; the AC asked for a source scan and got a good one.
    evidence: packages/shared/src/contraption/noTranscendentals.test.ts:42 (`MODULE_ROOT = dirname(fileURLToPath(import.meta.url))`) and :83 (the regex); all non-test imports under src/contraption resolve to `../types.js` or `./resolveSegmentContacts/index.js`.
- **info** — The 'sub-unit jitter' assertion uses a bound ~20x looser than the constant it guards: `JITTER_UNITS` is 0.0005 (so max displacement is 0.0005 per axis) but the test asserts `< 0.01`. It still fails if jitter ever grows past a hundredth of a unit, so it is not a weakened assertion — just a loose one relative to the invariant it names.
    evidence: packages/shared/src/contraption/simulate/index.ts:12 `JITTER_UNITS = 0.0005`; simulate/index.test.ts:63-64 `assert.ok(Math.abs(point.x - origin.x) < 0.01)`.

_Captured 2026-08-07T15:31:18.164Z._
<!-- captured-evidence:end -->

## Links
- Visual half: WN-18 (deps on this). Consumer: WN-15 (architecture decision (a) vs (b)).
- Question source: WN-15's `**Architecture decision to confirm at GATE 1**` section.
- Prior rejection: `.work/verdicts/WN-17.gate1.json` (three majors, all addressed above).
