---
id: WN-18
title: "CONTRAPTION visual harness: canvas over the WN-17 integrator for the readability/piece-set/length questions"
status: in-progress
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

## Links
- Headless half: WN-17 (dep). Consumer: WN-15.
- Route-surface sibling: WN-16 (same dev-lab route; whichever lands first adds it).
- Prior combined rejection: `.work/verdicts/WN-17.gate1.json` major 3 (scope split).
