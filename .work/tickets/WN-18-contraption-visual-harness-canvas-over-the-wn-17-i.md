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
grep: no touched symbols found in the diff (nothing to survey)
```

Genuinely empty rather than skipped: the diff adds files and makes two **additive** edits — a new
`CONTRAPTION_LAB_NAME` dispatch arm in `App.tsx` and an `ignores` entry in `eslint.config.mjs`. No
existing symbol changed signature or behaviour. Confirmed by hand with
`grep -rn "DEV_LAB\|resolveDevLabName\|LAB_NAME"` over the manifest `src_globs`: the only consumers
are `App.tsx`, `resolveClientRoute/index.ts` and its test, all of which were opened. Everything
imported from `packages/shared` (`simulateContraption`, `measureContraptionTrackBytes`,
`CONTRAPTION_BENCHMARK_LAYOUT`) is consumed read-only; nothing in `packages/` was modified.

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
