---
id: WN-18
title: "CONTRAPTION visual harness: canvas over the WN-17 integrator for the readability/piece-set/length questions"
status: in-review
kind: spike
priority: medium
created: 2026-08-07
deps: [WN-17]
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-18"
---

## Goal
The **visual** half of the CONTRAPTION prototype: a throwaway canvas harness over WN-17's integrator,
so WN-15's remaining questions can be answered by driving it. This ticket builds the harness; the
judgements stay human.

## Acceptance Criteria
- [ ] A dev-only route renders the harness. It **cannot** reuse `/dev/minigame/<slug>`: `App.tsx:38`
      gates `DEV_MINIGAME` on `devMinigameType !== null` and `MinigameDevSandbox/index.tsx:14`
      imports `../../minigames/registry`, so that route requires a registered `MinigameType`, which
      the guardrail below forbids. Add a sibling dev route (e.g. `/dev/lab/<name>`) to
      `resolveClientRoute` alongside `resolveDevMinigameSlug`, **with the colocated test case its
      precedent already has** (`utils/resolveClientRoute/index.test.ts`). If WN-16 has already added
      that route, reuse it rather than adding a second.
- [ ] The harness drives WN-17's module — it does **not** reimplement or fork the integrator. Import
      it from `packages/shared`.
- [ ] WN-15's questions are answerable by driving it: failure **readability** (can the room see *why*
      a run failed), **piece set and count** (smallest set still allowing a clever solution), **one
      shot vs best-of-N**, and **sim length** against the ~4s watchable target. WN-15 calls this the
      *logic* branch but explicitly not a TUI — "do failures read as understandable" is visual.
- [ ] **Lint is pre-authorized to be handled, not discovered.** The harness lands under
      `apps/client/src/components/**`, where `eslint.config.mjs:113-146` enables the wingnight
      component rules (`no-hardcoded-component-jsx-text`, `no-inline-style-prop`,
      `require-styles-import-in-component-entry`, `component-entry-file-name`, `max-lines` 260/140).
      A live-control harness violates these by construction — `ConfigSetupPrototype` scored 8 such
      errors. **Decision made here so the implementer does not halt at the fork the way WN-3's agent
      did:** add a mirrored `ignores` entry for this harness's folder in `eslint.config.mjs`, with an
      inline comment naming **WN-15** as the ticket that deletes both the harness and the entry. This
      is a scope carve-out for throwaway code, not a rule disable — no rule definition changes and no
      `eslint-disable` comment anywhere.
- [ ] **No bare `window` / `import.meta.env` at module or render scope**, and prove it with a
      colocated unit test that **imports the harness module**. Do not rely on `pnpm test` passing as
      the proof: nothing in `apps/client/src` imports `App` (`App.tsx:46` already reads bare
      `window.location.pathname` at render scope), so an unimported module's bare `window` sails
      through green — gate1 correctly called that guard "false comfort".
- [ ] Scope guardrail: no package under `packages/minigames/`, no `MINIGAME_DEFINITIONS` entry, no
      registry changes.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys.

## Plan
Split out of WN-17 at gate1's direction: the module + byte measurement are headless and autonomous,
this half is the disposable visual layer serving human judgement. Deps on WN-17 so the integrator
exists to drive.

The lint carve-out above is the deliberate answer to the fork WN-3's agent halted at. It is decided
here at planning time rather than left for the implementer to discover mid-run.

Pre-verified 2026-08-07: `App.tsx:38-39` dispatch; `MinigameDevSandbox/index.tsx:14` registry import;
`eslint.config.mjs:113-146` component rule scope and `:14-16` the ConfigSetupPrototype ignore
precedent; `App.tsx:46` bare `window.location.pathname`.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T15:38:55.387Z gate1: pass (product-owner, attempt 1, confidence high). 3 minors + 4 infos, no blocker/major. Minors worth carrying into the build: (1) WN-16 already landed the generic /dev/lab/<name> route — AC 1's reuse branch fires, so route work is one dispatch branch in App.tsx next to ANAMORPH_LAB_NAME, not a new route; (2) the WN-17 integrator has NO success/failure predicate (types.ts models bodies/segments/gravity/keyframes only), so the harness must define its own lab-local outcome check for the readability + one-shot-vs-best-of-N questions — lab-local, not a fork of the integrator; (3) the piece-set question is the likely overrun — prefer a preset-palette switcher over 2-3 prebuilt Layouts to a full placement editor. Infos: line-citation drift from WN-16 landing (App.tsx:38 -> :47, App.tsx:46 -> :59, eslint.config.mjs:113-146 -> :126-150); eslint.config.mjs:17-22 is now an exact AnamorphLab precedent for the AC 4 carve-out; AnamorphLab/index.test.tsx is a working precedent for the AC 5 bare-window import test.
- 2026-08-07T15:38:58.416Z prototype: skipped (not in plan) — needs_prototype is false; work ship-plan WN-18 --json emits select/gate1/implement/test/qa/browser/gate2/land with no prototype phase.
- 2026-08-07T15:40:33.531Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-18
- 2026-08-07T15:43:17.008Z claimed + worktree /Users/bradleyexton/Projects/wing-night-WN-18 (branch WN-18-contraption-visual-harness), deps installed. Built runOutcome/ first — the lab-local success predicate gate1 minor 2 said the harness would have to define (the WN-17 integrator models bodies/segments/gravity/keyframes and deliberately has no goal, since scoring is the WN-15 reducer's business). It is lab-local, NOT a fork: reason codes landed|short|long|perched|restless, plus settleSeconds (the sim-length signal) and missX. 13 colocated tests green, every case driving the REAL simulateContraption rather than a hand-written track.
- 2026-08-07T15:51:04.114Z pieceSets/ built + 10 tests green. Three nested solved routes (2/4/6 placed ramps on a shared frame) plus the WN-17 benchmark as control; each authored set is asserted to LAND and settle inside WN-15's 4s window (2.13s / 1.40s / 1.37s). Geometry was found by search against the real integrator, requiring the wing to touch EVERY piece — an untouched piece is scenery, not a route step. Three integrator findings fell out of the tuning and are recorded for WN-15: (1) the seed is functionally inert — 5 seeds of one layout differ only in the 5th decimal after 6s, so best-of-N cannot mean re-rolling a seed, it has to mean the team rebuilds; (2) slip is applied per integration STEP not per impact, so a body resting on a shallow ramp has tangential velocity multiplied by slip 240x/sec and creeps instead of sliding — a shelved wing takes 32s to reach the floor, nowhere near watchable, which is why every preset is free-fall-dominant deflectors; (3) routes are sensitive to sub-0.1-unit nudges — rounding a verified 6-piece route's coords to 1dp flipped it from landed to restless, which matters for WN-15's authored-levels plan.
- 2026-08-07T16:14:46.170Z browser-verify: skipped (non-UI) — ticket kind is 'spike', not 'ui', so readBrowserOutcome routes to skip. Note recorded BEFORE the handoff per O-6. A Chromium drive was nonetheless run as evidence, because renderToStaticMarkup never executes the draw effect and nothing else in this diff proves the canvas paints: 7223 non-background pixels sampled via getImageData, zero pageerror/console-error, and both readings of the best-of-N control exercised live. Recorded in ## Evidence.
- 2026-08-07T16:14:53.649Z qa: pass (qa-reviewer, attempt 1, confidence high, sha b7a4ae3). 5 minors + 2 infos, no blocker/major. The reviewer mutation-probed the load-bearing claim rather than trusting it: shifting each preset's last ramp 25 units out of the flight path drives the min contact distance from ~2.60 (true surface contact at radius 2.6) to 15.97/9.25/10.86 and the assertion fails loudly — so the contact guard genuinely fixes the earlier proximity-based revision rather than being relaxed to match. It also adjudicated the mid-run attemptsDiffer change as a legitimate sharpening (a whole-track comparison is a superset of the endpoint one at the same threshold), not a test bent to fit. Acted on ONE finding in-run — minor #2, that the ## Evidence blind-spot paste was captured pre-staging and so surveyed an empty diff; the real 200-symbol output and a review of every flagged call-site now replace it, per verification.md 'report faithfully'. The other four minors + two infos are advisory, are NOT loop fodder per the work-on contract, and ride into review; the three that change how the lab should be READ (generous rim LANDED grade, the benchmark control never settling, the dangling creepNote) are surfaced in ## Evidence for whoever drives it.
- 2026-08-07T16:15:15.392Z handed off → in-review (verify green); awaiting land

## Evidence
### Verify gate (worktree `/Users/bradleyexton/Projects/wing-night-WN-18`)

```
$ work verify
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ verify passed (3 step(s))
```

All three manifest verify keys, per the last AC. Client suite: **267 tests, 267 pass, 0 fail**
(`pnpm --filter @wingnight/client test`) — 32 of them new in this diff.

### Anti-blind-spot (V-5)

```
$ work grep --since b1b93b5
grep: 200 touched symbol(s) via node-walk (since b1b93b5)
  (skipped 5 low-signal name(s): body, context, first, xs, ys)
  ⚠ BACKGROUND_FILL — 2 call-site(s) to review (not in the diff)
  ⚠ DEFAULT_SETTINGS — 2 …   ⚠ FLOOR — 10 …   ⚠ FLOOR_Y — 4 …
  ⚠ LabControls — 3 …   ⚠ LabControlsProps — 2 …   ⚠ LabSettings — 7 …
  ⚠ Segmented — 6 …   ⚠ canvas / width / wing — …
Open these before claiming done — anything you never opened is a blind spot (DESIGN §6.4).
```

**Correction (qa-reviewer minor #2).** An earlier revision of this section pasted
`no touched symbols found in the diff (nothing to survey)` and called the sweep empty. That output
was real but was captured **before the new files were staged**, so the walk saw an empty diff — it
did not survey this change at all. The true output is above; the claim has been replaced rather
than re-worded, per `verification.md` ("Evidence, not assertion" / "Report faithfully").

Every flagged call-site was opened, and all of them are **coincidental name collisions in unrelated
modules**, not coupling:

- `LabControls`, `LabControlsProps`, `LabSettings`, `Segmented`, `DEFAULT_SETTINGS`,
  `BACKGROUND_FILL` — AnamorphLab's own module-local versions. Two labs each having a
  `LabControls` is `code-design` §Naming working as intended (path-relative names, no module
  prefix); neither imports the other.
- `FLOOR`, `FLOOR_Y` — test-local constants inside `packages/shared`'s own contraption tests.
- `canvas`, `width` — the drawing minigame's unrelated canvas code.
- `wing` — the string appears as copy ("Ate wing") in the host panel, and as
  `benchmarkLayout/index.ts:25 id: "wing"`. That last one is **not** incidental: it is exactly the
  body-id convention `runOutcome`'s `WING_BODY_ID` depends on, read deliberately.

No exported symbol changed signature or behaviour. The only edits to existing files are additive: a
`CONTRAPTION_LAB_NAME` dispatch arm in `App.tsx`, one `ignores` entry in `eslint.config.mjs`, and
one added route test case. Everything imported from `packages/shared` (`simulateContraption`,
`measureContraptionTrackBytes`, `CONTRAPTION_BENCHMARK_LAYOUT`) is consumed read-only; `git diff
--name-only` touches nothing under `packages/` at all.

### AC 5 — the bare-`window` guard is non-vacuous

`ContraptionLab/index.test.tsx` **imports the harness module** under `tsx --test` (no DOM, no Vite)
and asserts `typeof globalThis.window === "undefined"` while calling `renderToStaticMarkup`, so a
bare `window` / `import.meta.env` read at module *or render* scope throws there. This is the proof
the AC demanded instead of leaning on a green `pnpm test` — nothing in `apps/client/src` imports
`App`, whose own render scope reads bare `window.location.pathname` (`App.tsx:59`), so an unimported
module's bare `window` would otherwise sail through. Every `window` read in the lab
(`devicePixelRatio`, `requestAnimationFrame`) is inside `RunCanvas`'s `useEffect`, which SSR never
runs.

### Browser drive (2026-08-07, Chromium 1600×1000, zero pageerror / console-error)

Screenshots are ephemeral run artifacts under `/tmp/` (`wn18-lab-default.png`,
`wn18-lab-six-bestof3.png`, `wn18-lab-seed-identical.png`); the reproducible evidence is the lab.
This drive was **not** required by the pipeline — the ticket is `kind: spike`, so browser-verify
skips — but `renderToStaticMarkup` never runs the draw effect, so nothing else in this diff proves
the canvas paints. It does:

| Check | Result |
|---|---|
| Canvas present and painted | 1174×660 backing store, **7223 non-background pixels** sampled via `getImageData` |
| Console / page errors | **none** |
| 2-piece route (default) | `LANDED — in the bucket`, settle **1.27s**, 121 keyframes, 1571 track bytes |
| 6-piece route, best-of-3, team-rebuilds | Attempt 1 `landed` (**best**), 2 `restless`, 3 `long` → "Attempts diverge — best-of-N is a real choice." |
| Same, switched to seed-only | "**All attempts identical — best-of-N wins nothing here.**" |

### Findings for WN-15 (what driving the harness established)

These are properties of **WN-17's integrator**, surfaced by building this harness on it. They are
inputs to WN-15's planning, not defects in this ticket.

1. **The seed is functionally inert.** Five seeds of one layout diverge only in the 5th decimal
   after 6s (`33.718056…` vs `33.718371…`): the 0.0005-unit symmetry-breaking jitter never
   amplifies, because the system is heavily damped rather than chaotic. **Best-of-N cannot mean
   "press GO again"** — there is nothing to win. It has to mean the team rebuilds. The lab ships
   both readings side by side (`3b · What changes between goes`) and says so on screen.
2. **`slip` is applied per integration step, not per impact.** A body resting on a shallow ramp has
   its tangential velocity multiplied by `slip` 240×/second, so it *creeps* rather than slides — a
   shelved wing needs **32s** to reach the floor, and the usable band is a cliff, not a dial
   (slip 0.86/0.96 → creep; 0.99 → lands at 4.8s; 1.0 → slides forever). Every preset here is
   therefore free-fall-dominant deflectors, which is also the more readable shape.
3. **Routes are sensitive to sub-0.1-unit nudges.** Rounding a verified 6-piece route's coordinates
   to one decimal flipped it from `landed` to `restless`. This is the sharpest warning for WN-15's
   authored-levels plan: a level author moving a ramp by 0.05 units can silently break a shipped
   solution, so sample levels need the solvability test WN-15 already plans — and it needs to run on
   the exact authored coordinates.
4. **Bodies never collide with each other** — `resolveSegmentContacts` reduces over
   `layout.segments` only. A marble cannot deflect the wing, so every "clever solution" available
   today is ramp geometry. Surfaced in the lab's own controls panel.
5. **Track weight is not the constraint.** A 4s 30Hz single-body run is **1571 bytes** of realistic
   JSON (flat, 2dp); the 6-body benchmark at the same settings is well under 10KB. WN-15's leaning
   toward option (a) — emit a keyframe track and replay it — is not threatened by size.

### Known limits of the instrument (qa-reviewer advisory findings — read before driving)

The qa pass returned **pass** with five minors and two infos, no blocker/major
(`.work/verdicts/WN-18.qa.json`). Per the pipeline contract minor/info findings are advisory and
are not iterated on in-run, but three of them change how the lab should be *read*, so they are
surfaced here rather than left in the verdict file:

1. **`LANDED` is graded generously at the rim.** `classify` checks `landed` before `perched` and
   puts no lower bound on depth, so a wing wedged at the bucket mouth still reads `LANDED`. All
   three presets settle within ~1.5 units of the mouth line (y 85.53 / 84.69 / 84.33 against
   `topY` 84). Trust the canvas over the banner when judging a marginal landing.
2. **The `WN-17 benchmark` control never produces a verdict.** `resolveSettleIndex` reduces over
   *all* bodies, and the benchmark's five loose marbles keep rolling, so it grades `restless` at
   every duration tried (4s / 6s / 12s). It is still useful as a visual control; it just will not
   give you a landed/missed answer.
3. **`creepNote` is a dangling reference.** `pieceSets/index.ts` says the slip-creep finding is
   "carried up to the room" via `contraptionLabCopy.creepNote`, but no such copy key exists — that
   finding lives only here and in `## Progress`, not on screen.

The remaining two minors are code-quality nits scoped to throwaway code (`distanceToSegment`
duplicated between `RunCanvas` and the `pieceSets` test; the benchmark test's reason-code assertion
is tautological against its own union type), plus two infos (four lab files cross the ~150-line
prompt; `index.test.tsx` asserts on copy). All are deleted with the lab in WN-15.

### How to reproduce

`pnpm --filter @wingnight/client dev`, then open `/dev/lab/contraption`. Seed `20260807` is the
default and is deterministic. Every control is labelled with the WN-15 question it answers
(`1 · Failure readability` … `4 · Sim length`).

### Delete targets for WN-15 (the carve-out this lab was granted)

1. `apps/client/src/components/ContraptionLab/` — the whole folder (10 files).
2. `eslint.config.mjs` — the `"apps/client/src/components/ContraptionLab/**"` entry in the top-level
   `ignores` block (carries an inline comment naming WN-15).
3. `apps/client/src/App.tsx` — the `ContraptionLab` import, the `CONTRAPTION_LAB_NAME` constant, and
   its `DEV_LAB` arm.
4. `apps/client/src/utils/resolveClientRoute/index.test.ts` — the
   `"resolves the contraption lab name to DEV_LAB"` case.

The `DEV_LAB` route itself belongs to WN-16/WN-14 — leave it while the ANAMORPH lab still uses it.

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 77 symbol(s) with external call-sites reviewed (5 low-signal name(s) skipped: body, context, first, xs, ys):

- `BACKGROUND_FILL` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:22, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:69
- `DEFAULT_SETTINGS` → apps/client/src/components/AnamorphLab/index.tsx:22, apps/client/src/components/AnamorphLab/index.tsx:42
- `FLOOR` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:8, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:21, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:25, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:33, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:42, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:50, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:58, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:68, … 2 more (run `work grep`)
- `FLOOR_Y` → packages/shared/src/contraption/simulate/index.test.ts:8, packages/shared/src/contraption/simulate/index.test.ts:15, packages/shared/src/contraption/simulate/index.test.ts:73, packages/shared/src/contraption/simulate/index.test.ts:74
- `LabControls` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:65, apps/client/src/components/AnamorphLab/index.tsx:5, apps/client/src/components/AnamorphLab/index.tsx:149
- `LabControlsProps` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:59, apps/client/src/components/AnamorphLab/LabControls/index.tsx:69
- `LabSettings` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:8, apps/client/src/components/AnamorphLab/LabControls/index.tsx:60, apps/client/src/components/AnamorphLab/LabControls/index.tsx:61, apps/client/src/components/AnamorphLab/LabControls/index.tsx:70, apps/client/src/components/AnamorphLab/index.tsx:5, apps/client/src/components/AnamorphLab/index.tsx:22, apps/client/src/components/AnamorphLab/index.tsx:42
- `Segmented` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:27, apps/client/src/components/AnamorphLab/LabControls/index.tsx:96, apps/client/src/components/AnamorphLab/LabControls/index.tsx:109, apps/client/src/components/AnamorphLab/LabControls/index.tsx:122, apps/client/src/components/AnamorphLab/LabControls/index.tsx:135, apps/client/src/components/AnamorphLab/LabControls/index.tsx:187
- `SegmentedProps` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:19, apps/client/src/components/AnamorphLab/LabControls/index.tsx:33
- `alongX` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:37, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:39, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:43, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:51, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:53, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:59, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:60
- `alongY` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:38, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:39, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:43, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:52, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:53, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:59, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:61
- `attempts` → apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:134, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:136, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:137, apps/server/src/roomState/minigamePlayMutations.test.ts:287
- `best` → apps/client/src/components/HostControlPanel/useHostWakeLock/index.ts:25, apps/client/src/components/HostControlPanel/useTimesUpChime/index.ts:47
- `bucket` → packages/shared/src/contraption/benchmarkLayout/index.ts:6, packages/shared/src/contraption/benchmarkLayout/index.ts:20, packages/shared/src/contraption/benchmarkLayout/index.ts:21
- `button` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:39, apps/client/src/components/AnamorphLab/LabControls/index.tsx:41, apps/client/src/components/AnamorphLab/LabControls/index.tsx:51, apps/client/src/components/AnamorphLab/LabControls/index.tsx:181, apps/client/src/components/AnamorphLab/LabControls/index.tsx:183, apps/client/src/components/AnamorphLab/index.tsx:124, apps/client/src/components/AnamorphLab/index.tsx:125, apps/client/src/components/AnamorphLab/index.tsx:126, … 223 more (run `work grep`)
- `buttonRow` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:171, apps/client/src/components/AnamorphLab/index.tsx:123, apps/client/src/components/AnamorphLab/styles.ts:66
- `canvas` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:18, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:44, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:46, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:50, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:57, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:58, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:66, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:67, … 64 more (run `work grep`)
- `canvasRef` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:40, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:44, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:105, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:110, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:25, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:32, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:41, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:80, … 4 more (run `work grep`)
- `card` → apps/client/src/components/AnamorphLab/index.tsx:71, apps/client/src/components/AnamorphLab/styles.ts:14, apps/client/src/components/DisplayBoard/StageSurface/styles.ts:1, apps/client/src/components/HostControlPanel/MinigameSurface/index.test.tsx:105, apps/client/src/components/HostControlPanel/OverrideActionsSurface/index.tsx:123, apps/client/src/components/HostControlPanel/OverrideActionsSurface/styles.ts:7, apps/client/src/components/HostControlPanel/OverrideConfirmDialog/index.tsx:27, apps/client/src/components/HostControlPanel/OverrideConfirmDialog/styles.ts:1, … 7 more (run `work grep`)
- `cardHeader` → apps/client/src/components/AnamorphLab/index.tsx:72, apps/client/src/components/AnamorphLab/index.tsx:93, apps/client/src/components/AnamorphLab/styles.ts:16
- `cardHeaderLabel` → apps/client/src/components/AnamorphLab/index.tsx:73, apps/client/src/components/AnamorphLab/index.tsx:94, apps/client/src/components/AnamorphLab/index.tsx:148, apps/client/src/components/AnamorphLab/styles.ts:19
- `cardHeaderMeta` → apps/client/src/components/AnamorphLab/index.tsx:74, apps/client/src/components/AnamorphLab/styles.ts:21
- `container` → apps/client/src/components/AnamorphLab/index.tsx:63, apps/client/src/components/AnamorphLab/styles.ts:1, apps/client/src/components/ContentFatalState/index.tsx:14, apps/client/src/components/ContentFatalState/styles.ts:1, apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/index.tsx:34, apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/styles.ts:1, apps/client/src/components/DisplayBoard/StageSurface/FinalResultsStageBody/index.tsx:23, apps/client/src/components/DisplayBoard/StageSurface/FinalResultsStageBody/styles.ts:1, … 56 more (run `work grep`)
- `controlBlock` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:24, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:42, apps/client/src/components/AnamorphLab/LabControls/index.tsx:35, apps/client/src/components/AnamorphLab/LabControls/index.tsx:76, apps/client/src/components/AnamorphLab/LabControls/index.tsx:148, apps/client/src/components/AnamorphLab/LabControls/index.tsx:166, apps/client/src/components/AnamorphLab/styles.ts:41, apps/client/src/components/MinigameDevSandbox/SandboxControls/index.tsx:23, … 4 more (run `work grep`)
- `controlHint` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:54, apps/client/src/components/AnamorphLab/LabControls/index.tsx:93, apps/client/src/components/AnamorphLab/styles.ts:45
- `controlLabel` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:26, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:44, apps/client/src/components/AnamorphLab/LabControls/index.tsx:36, apps/client/src/components/AnamorphLab/LabControls/index.tsx:78, apps/client/src/components/AnamorphLab/LabControls/index.tsx:149, apps/client/src/components/AnamorphLab/LabControls/index.tsx:168, apps/client/src/components/AnamorphLab/styles.ts:43, apps/client/src/components/MinigameDevSandbox/SandboxControls/index.tsx:24, … 4 more (run `work grep`)
- `controlRow` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:25, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:43, apps/client/src/components/AnamorphLab/LabControls/index.tsx:77, apps/client/src/components/AnamorphLab/LabControls/index.tsx:167, apps/client/src/components/AnamorphLab/styles.ts:49
- `controlValue` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:27, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:45, apps/client/src/components/AnamorphLab/LabControls/index.tsx:79, apps/client/src/components/AnamorphLab/LabControls/index.tsx:169, apps/client/src/components/AnamorphLab/styles.ts:47
- `controlsCard` → apps/client/src/components/AnamorphLab/index.tsx:110, apps/client/src/components/AnamorphLab/index.tsx:116, apps/client/src/components/AnamorphLab/index.tsx:147, apps/client/src/components/AnamorphLab/styles.ts:36, apps/client/src/components/MinigameDevSandbox/SandboxControls/index.tsx:21, apps/client/src/components/MinigameDevSandbox/SandboxControls/styles.ts:4, apps/client/src/components/MinigameDevSandbox/styles.ts:9
- `controlsList` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:75, apps/client/src/components/AnamorphLab/styles.ts:39
- `description` → apps/client/src/components/AnamorphLab/copy.ts:3, apps/client/src/components/AnamorphLab/index.tsx:66, apps/client/src/components/AnamorphLab/styles.ts:7, apps/client/src/components/ContentFatalState/copy.ts:5, apps/client/src/components/ContentFatalState/index.tsx:17, apps/client/src/components/ContentFatalState/styles.ts:8, apps/client/src/components/HostControlPanel/MinigameSurface/index.tsx:39, apps/client/src/components/HostControlPanel/MinigameSurface/index.tsx:52, … 31 more (run `work grep`)
- `differ` → packages/shared/src/content/promptPack/index.ts:8
- `draw` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:56, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:93, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:95, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:392, packages/minigames/drawing/src/client/HostDrawingSurface/copy.ts:7, packages/minigames/drawing/src/client/strokeRendering/index.ts:5
- `four` → apps/client/src/components/AnamorphLab/copy.ts:4, apps/client/src/components/AnamorphLab/index.test.tsx:25, apps/client/src/components/DisplayBoard/GameLockedOverlay/copy.ts:5, apps/server/src/reloadContentIntoRoomState/index.test.ts:144, apps/server/src/reloadContentIntoRoomState/index.ts:85, packages/shared/src/contraption/noTranscendentals.test.ts:13
- `gapX` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:60, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:62, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:69
- `gapY` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:61, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:62, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:69
- `heading` → apps/client/src/components/AnamorphLab/index.tsx:65, apps/client/src/components/AnamorphLab/styles.ts:5, apps/client/src/components/ContentFatalState/index.tsx:16, apps/client/src/components/ContentFatalState/styles.ts:6, apps/client/src/components/DisplayBoard/GameLockedOverlay/index.tsx:22, apps/client/src/components/DisplayBoard/GameLockedOverlay/styles.ts:14, apps/client/src/components/DisplayBoard/StageSurface/RoundResultsStageBody/index.tsx:27, apps/client/src/components/DisplayBoard/StageSurface/RoundResultsStageBody/styles.ts:13, … 13 more (run `work grep`)
- `headingBlock` → apps/client/src/components/AnamorphLab/index.tsx:64, apps/client/src/components/AnamorphLab/styles.ts:3, apps/client/src/components/MinigameDevSandbox/index.tsx:58, apps/client/src/components/MinigameDevSandbox/index.tsx:101, apps/client/src/components/MinigameDevSandbox/styles.ts:3
- `height` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:58, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:60, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:67, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:70, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:72, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:74, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:12, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:29, … 26 more (run `work grep`)
- `html` → apps/client/src/components/AnamorphLab/index.test.tsx:19, apps/client/src/components/AnamorphLab/index.test.tsx:21, apps/client/src/components/AnamorphLab/index.test.tsx:22, apps/client/src/components/AnamorphLab/index.test.tsx:26, apps/client/src/components/AnamorphLab/index.test.tsx:28, apps/client/src/components/AnamorphLab/index.test.tsx:29, apps/client/src/components/AnamorphLab/index.test.tsx:30, apps/client/src/components/AnamorphLab/index.test.tsx:31, … 429 more (run `work grep`)
- `index` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:14, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:38, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:39, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:58, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:59, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:127, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:128, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:177, … 486 more (run `work grep`)
- `input` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:29, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:47, apps/client/src/components/AnamorphLab/LabControls/index.tsx:81, apps/client/src/components/AnamorphLab/LabControls/index.tsx:151, apps/client/src/components/AnamorphLab/LabControls/index.tsx:172, apps/client/src/components/AnamorphLab/LabControls/index.tsx:174, apps/client/src/components/AnamorphLab/styles.ts:60, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantA.tsx:111, … 166 more (run `work grep`)
- `keyframeCount` → packages/shared/src/contraption/measureTrackBytes/index.test.ts:26, packages/shared/src/contraption/measureTrackBytes/index.test.ts:56, packages/shared/src/contraption/measureTrackBytes/index.test.ts:67, packages/shared/src/contraption/measureTrackBytes/index.ts:14, packages/shared/src/contraption/measureTrackBytes/index.ts:51
- `layout` → apps/client/src/components/AnamorphLab/index.tsx:69, apps/client/src/components/AnamorphLab/styles.ts:9, apps/client/src/components/HostControlPanel/styles.ts:19, packages/shared/src/contraption/benchmarkLayout/index.ts:4, packages/shared/src/contraption/measureTrackBytes/index.test.ts:22, packages/shared/src/contraption/measureTrackBytes/index.test.ts:52, packages/shared/src/contraption/measureTrackBytes/index.test.ts:63, packages/shared/src/contraption/simulate/index.test.ts:41, … 15 more (run `work grep`)
- `moved` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/useConfigDraft.ts:142, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/useConfigDraft.ts:143, packages/shared/src/contraption/simulate/index.ts:114, packages/shared/src/contraption/simulate/index.ts:116
- `observer` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:95, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:97, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:100
- `offsetX` → packages/shared/src/contraption/simulate/index.ts:65, packages/shared/src/contraption/simulate/index.ts:66, packages/shared/src/contraption/simulate/index.ts:104, packages/shared/src/contraption/simulate/index.ts:107, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:54, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:59
- `offsetY` → packages/shared/src/contraption/simulate/index.ts:65, packages/shared/src/contraption/simulate/index.ts:67, packages/shared/src/contraption/simulate/index.ts:106, packages/shared/src/contraption/simulate/index.ts:107, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:55, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:59
- `outcome` → packages/minigames/drawing/src/client/DisplayDrawingSurface/index.tsx:44, packages/minigames/drawing/src/client/HostDrawingSurface/index.tsx:181, packages/minigames/drawing/src/runtime/guards/index.ts:91, packages/minigames/drawing/src/runtime/index.test.ts:305, packages/minigames/drawing/src/runtime/index.test.ts:336, packages/minigames/drawing/src/runtime/index.test.ts:462, packages/minigames/drawing/src/runtime/index.ts:259, packages/shared/src/roomState/index.ts:126
- `patch` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:70, apps/client/src/components/AnamorphLab/LabControls/index.tsx:90, apps/client/src/components/AnamorphLab/LabControls/index.tsx:105, apps/client/src/components/AnamorphLab/LabControls/index.tsx:118, apps/client/src/components/AnamorphLab/LabControls/index.tsx:131, apps/client/src/components/AnamorphLab/LabControls/index.tsx:144, apps/client/src/components/AnamorphLab/LabControls/index.tsx:155, apps/client/src/components/AnamorphLab/LabControls/index.tsx:178, … 10 more (run `work grep`)
- `pixelRatio` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:64, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:66, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:67, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:68, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:75, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:54, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:57, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:58, … 3 more (run `work grep`)
- `position` → apps/client/src/copy/minigameBriefings.ts:40, tools/import-geo-photos/index.mjs:6, tools/import-geo-photos/index.mjs:192, tools/import-geo-photos/index.mjs:194, tools/import-geo-photos/index.mjs:195, tools/import-geo-photos/index.mjs:196, tools/import-geo-photos/index.mjs:197
- `previous` → apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:89, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:91, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:94, apps/client/src/components/AnamorphLab/index.tsx:54, apps/client/src/components/AnamorphLab/index.tsx:55, apps/client/src/components/AnamorphLab/index.tsx:56, apps/client/src/components/AnamorphLab/index.tsx:153, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:439, … 10 more (run `work grep`)
- `ramp` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:205, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:214, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:200, apps/client/src/components/AnamorphLab/copy.ts:12, apps/client/src/components/AnamorphLab/index.test.tsx:38, packages/shared/src/contraption/benchmarkLayout/index.ts:18, packages/shared/src/contraption/benchmarkLayout/index.ts:19, packages/shared/src/contraption/types.ts:25
- `ramps` → packages/shared/src/contraption/benchmarkLayout/index.ts:6
- `reason` → apps/server/src/configService/index.test.ts:22, apps/server/src/configService/index.ts:54, apps/server/src/configService/index.ts:66, apps/server/src/configService/index.ts:88, apps/server/src/contentWriter/index.test.ts:85, apps/server/src/contentWriter/index.test.ts:110, apps/server/src/contentWriter/index.test.ts:167, apps/server/src/contentWriter/index.ts:24, … 17 more (run `work grep`)
- `reference` → apps/client/src/vite-env.d.ts:2
- `run` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantA.tsx:4, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:3, apps/client/src/copy/host.ts:76, apps/client/src/copy/host.ts:143, apps/server/src/configService/index.ts:21, apps/server/src/reloadContentIntoRoomState/index.ts:23, apps/server/src/reloadContentIntoRoomState/index.ts:52, apps/server/src/roomState/baseMutations/index.ts:89, … 63 more (run `work grep`)
- `scale` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:72, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:85, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:86, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:263, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:265, apps/client/src/components/AnamorphLab/copy.ts:9, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:27, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:44, … 17 more (run `work grep`)
- `segmented` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:37, apps/client/src/components/AnamorphLab/styles.ts:53
- `segmentedOption` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:43, apps/client/src/components/AnamorphLab/styles.ts:55
- `segmentedOptionActive` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:44, apps/client/src/components/AnamorphLab/styles.ts:58
- `six` → apps/client/src/components/DisplayBoard/GameLockedOverlay/copy.ts:7, apps/server/src/contentLoader/testHarness.ts:117
- `slider` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:31, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:49, apps/client/src/components/AnamorphLab/LabControls/index.tsx:83, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:28, apps/client/src/components/AnamorphLab/styles.ts:51
- `span` → apps/client/src/components/AnamorphLab/AngleDials/index.tsx:26, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:27, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:44, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:45, apps/client/src/components/AnamorphLab/LabControls/index.tsx:36, apps/client/src/components/AnamorphLab/LabControls/index.tsx:78, apps/client/src/components/AnamorphLab/LabControls/index.tsx:79, apps/client/src/components/AnamorphLab/LabControls/index.tsx:149, … 325 more (run `work grep`)
- `stageColumn` → apps/client/src/components/AnamorphLab/index.tsx:70, apps/client/src/components/AnamorphLab/styles.ts:12
- `stageViewport` → apps/client/src/components/AnamorphLab/index.tsx:78, apps/client/src/components/AnamorphLab/styles.ts:23
- `startedAt` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:261, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:285, apps/client/src/components/HostControlPanel/HostPhaseBody/index.test.tsx:54, apps/client/src/components/HostControlPanel/TimerControlsSurface/index.test.tsx:13, apps/client/src/components/HostControlPanel/TimerControlsSurface/index.test.tsx:43, apps/client/src/components/HostControlPanel/TimerControlsSurface/index.test.tsx:70, apps/client/src/components/HostControlPanel/index.test.tsx:66, apps/client/src/components/HostControlPanel/index.test.tsx:93, … 9 more (run `work grep`)
- `telemetryGrid` → apps/client/src/components/AnamorphLab/index.tsx:117, apps/client/src/components/AnamorphLab/styles.ts:68
- `telemetryKey` → apps/client/src/components/AnamorphLab/index.tsx:118, apps/client/src/components/AnamorphLab/index.tsx:120, apps/client/src/components/AnamorphLab/styles.ts:70
- `third` → packages/minigames/trivia/src/runtime/index.test.ts:100, packages/minigames/trivia/src/runtime/index.test.ts:101
- `tick` → packages/minigames/drawing/src/client/DisplayDrawingSurface/index.tsx:26, packages/minigames/drawing/src/client/HostDrawingSurface/index.tsx:43
- `travel` → packages/shared/src/contraption/simulate/resolveSegmentContacts/index.test.ts:35, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:56, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:60, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:61
- `two` → apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:3, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:51, apps/client/src/components/DisplayBoard/GameLockedOverlay/copy.ts:3, apps/server/src/configService/index.test.ts:20, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:10, apps/server/src/contentWriter/index.ts:112, apps/server/src/reloadContentIntoRoomState/index.ts:27, packages/minigames/core/src/index.ts:132, … 8 more (run `work grep`)
- `walls` → packages/shared/src/contraption/benchmarkLayout/index.ts:6
- `width` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:57, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:60, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:66, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:70, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:72, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:73, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:51, apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/styles.test.ts:6, … 44 more (run `work grep`)
- `wing` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantB.tsx:250, apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx:154, apps/client/src/components/HostControlPanel/PlayersSurface/EatingPlayersSurface/index.test.tsx:39, apps/client/src/components/HostControlPanel/PlayersSurface/index.test.tsx:74, apps/client/src/components/HostControlPanel/index.test.tsx:81, apps/client/src/components/HostControlPanel/index.test.tsx:85, apps/client/src/copy/host.ts:76, apps/client/src/copy/host.ts:159, … 7 more (run `work grep`)

**QA findings (advisory):** 7 finding(s) carried from the passing verdict:
- **minor** — `perched` is unreachable for any wing that settles inside the bucket's x-range, and all three authored presets exercise exactly that case — they grade LANDED while resting 12.5-13.7 units above the bucket floor, straddling the mouth line. runOutcome/index.ts checks `landed` (insideMouth && y > topY) before `perched` (y < floorY - 6), and `landed` has no lower bound, so a wing hung up at the rim outranks the branch written for it. I drove the real integrator against the shipped presets: two -> final (55.40, 85.53); four -> (54.20, 84.69); six -> (54.08, 84.33), against bucket topY 84 / floorY 98 and wing radius 2.6. The four- and six-piece wings settle 0.69 and 0.33 units below the mouth line, i.e. wedged on the ramp tip against the right wall with most of the ball above the rim, and the banner says "LANDED — in the bucket". pieceSets/index.test.ts asserts `outcome?.reason === "landed"` for all three, so the generous grade is locked in by the test. This is the readability instrument mis-stating the very verdict WN-15 is meant to judge. Non-blocking: the lab is deleted by WN-15, the human driving it sees the canvas, and the reason codes are lab-local.
    evidence: apps/client/src/components/ContraptionLab/runOutcome/index.ts (classify): `if (insideMouth && position.y > bucket.topY) { return "landed"; }` precedes `if (position.y < bucket.floorY - PERCH_CLEARANCE_UNITS) { return "perched"; }`. Measured via the shipped modules: two/four/six settle at y 85.53 / 84.69 / 84.33 with floorY 98. Locked in by apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:31 `assert.equal(outcome?.reason, "landed")`.
- **minor** — The ticket's `## Evidence` pastes an anti-blind-spot output that does not reproduce at the graded sha. It records `work grep --since b1b93b5` returning "grep: no touched symbols found in the diff (nothing to survey)" and calls that "genuinely empty rather than skipped". Running the same command in the same worktree at b7a4ae3 (and from the main checkout) reports `grep: 200 touched symbol(s) via node-walk` plus call-site warnings. verification.md ("Evidence, not assertion" / "Report faithfully") makes the pasted output load-bearing, and this one overstates the check. Graded minor, not major, because I ran the real survey myself and the substance is clean: every flagged call-site is a coincidental local-constant name collision (BACKGROUND_FILL and DEFAULT_SETTINGS in AnamorphLab, FLOOR in packages/shared tests, the string "wing"), no existing exported symbol changed signature or behaviour, and the two edits to existing files (App.tsx dispatch arm, eslint ignores entry) are purely additive. The hand-grep reasoning recorded alongside it is sound and I confirmed it.
    evidence: Ticket `## Evidence` > "Anti-blind-spot (V-5)" claims `grep: no touched symbols found in the diff (nothing to survey)`. Actual, reproduced twice: `grep: 200 touched symbol(s) via node-walk (since b1b93b5)` ... `Open these before claiming done`. Independent confirmation of the substance: `grep -rn "DEV_LAB\|resolveDevLabName"` over src_globs yields only App.tsx, resolveClientRoute/index.ts and its test — all opened in the diff.
- **minor** — Dangling copy reference: pieceSets/index.ts:100 states "`contraptionLabCopy.creepNote` carries that up to the room", but `creepNote` is not defined in copy.ts and appears nowhere else in the tree. The slip-creep finding (the implementer's finding #2, and the stated reason every preset is a free-fall deflector) is therefore NOT surfaced anywhere on screen, despite the module docstring asserting it is. The sibling `bodyContactNote` is real and is rendered by LabControls, so this reads as a rename that lost its other half. Cosmetic in code terms, but it is a false claim inside the module whose job is to explain itself to WN-15.
    evidence: `grep -rn "creepNote" apps/client/src/` returns exactly one hit — the comment at apps/client/src/components/ContraptionLab/pieceSets/index.ts:100. apps/client/src/components/ContraptionLab/copy.ts defines bodyContactNote but no creepNote.
- **minor** — `distanceToSegment` — a 15-line point-to-segment projection — is duplicated verbatim between RunCanvas/index.tsx:47 and pieceSets/index.test.ts:33. Only the slack constant differs (MARKER_SLACK_UNITS 0.6 vs CONTACT_SLACK 0.05), and that difference is the caller's, not the geometry's. code-design §Utilities & extraction: extract when logic is "independently testable, single-responsibility, OR reused" — this is all three. A shared lab-local helper taking the slack as an argument would remove the copy without adding a speculative seam.
    evidence: code-design §Utilities & extraction. Identical bodies at apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:47-64 and apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:33-51.
- **minor** — The benchmark-layout test is tautological on the property it names. `assert.ok(["landed","short","long","perched","restless"].includes(outcome.reason), "the benchmark layout must reduce to one of the room-readable reason codes")` cannot fail: `reason` is typed `RunOutcomeReason`, which is exactly that union. The preceding `assert.notEqual(outcome, null)` is the only part that can break. testing.md: "A test exists to fail when the behaviour breaks." Pinning the actual reason would make it bite — and would document a real property of the control preset: the benchmark grades `restless` at every duration I tried (4s, 6s, 12s; settleSeconds null) because `resolveSettleIndex` reduces over ALL bodies, so the five rolling marbles keep the six-body control permanently at "NO VERDICT — still moving when the window closed". That is consistent with the documented "until every body stopped moving", but it means the lab's control preset never produces a verdict, which is worth knowing when driving it.
    evidence: testing.md §Test quality / "Don't game the check". apps/client/src/components/ContraptionLab/runOutcome/index.test.ts:172-185. Measured: benchmark @4s/@6s/@12s -> reason "restless", settleSeconds null, final wing (24.93, 29.83) / (28.26, 30.99) / (38.23, 34.46).
- **info** — Four lab files cross code-design's ~150-line prompt: RunCanvas/index.tsx 258, LabControls/index.tsx 212, runOutcome/index.ts 191, labRun/index.ts 181. The rule is explicit that this is "a prompt to look, not a hard cap", and each is a coherent unit (one draw loop; one control panel; one predicate; one attempt builder), so I am flagging rather than faulting. Worth naming only because the eslint carve-out also suspends the project's own max-lines 260/140 for this folder, so nothing mechanical is watching it.
    evidence: code-design §File & folder structure ("If a file exceeds ~150 lines, look for a split... the heuristic is a prompt to look"). wc -l over apps/client/src/components/ContraptionLab/.
- **info** — index.test.tsx asserts almost entirely on incidental copy (`/LANDED — in the bucket/`, `/Trail \+ contacts/`, `/2 pieces/`, `/never with each other/`) and repeats `renderToStaticMarkup(<ContraptionLab />)` in eight separate tests without a local helper. testing.md prefers "stable structural signals, not incidental copy" and says to "extract repeated setup into local helpers". Defensible here — the copy IS the artifact under judgement for the readability question, and every string is sourced from copy.ts — so this is a note, not a fault. It does mean a copy tweak in WN-15 will redden the suite.
    evidence: testing.md §What to assert, §Test quality. apps/client/src/components/ContraptionLab/index.test.tsx:18-78.

_Captured 2026-08-07T16:15:15.392Z._
<!-- captured-evidence:end -->

## Links
- Headless half: WN-17 (dep). Consumer: WN-15.
- Route-surface sibling: WN-16 (same dev-lab route; whichever lands first adds it).
- Prior combined rejection: `.work/verdicts/WN-17.gate1.json` major 3 (scope split).
