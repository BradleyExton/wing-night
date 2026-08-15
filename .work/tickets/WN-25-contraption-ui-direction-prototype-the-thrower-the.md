---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-25
title: "CONTRAPTION UI direction prototype: the thrower, the throw, the target, and the miss beat"
status: in-progress
kind: ui
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
needs_prototype: false   # this ticket IS the prototype — it builds the lab; the PICK stays human
                         # (WN-16/WN-18 precedent). Do not route it through a prototype detour.
worktree: "/Users/bradleyexton/Projects/wing-night-WN-25"
---

## Goal
Settle what CONTRAPTION actually *looks* like — who throws, what gets thrown, what it lands in, and
what a miss looks like — as structurally-different variants on a dev route, so the level geometry
WN-24 has to re-find is designing toward a decided picture instead of an abstract box.

## Acceptance Criteria
- [ ] A dev-only route renders the prototype with `?variant=` switching and a floating switcher,
      per the `prototype` skill's UI branch. Reuse the existing `/dev/lab/<name>` route added by
      WN-16/WN-18 (`resolveClientRoute`) rather than adding a third route shape.
- [ ] **Scope guardrail (same one WN-16/WN-18 carried, restated because it is the whole risk):** do
      NOT create a package under `packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, or touch
      either registry. Adding a `MinigameType` is a type-level fan-out that breaks every
      `Record<MinigameType, …>` in the repo until fully wired — there is no throwaway half-state.
- [ ] Variants are **structurally different**, not restyled: they must differ in where the thrower
      sits relative to the field, how much of the scene the throw occupies, and whether the target is
      foregrounded or embedded in the scene. Three is the target count.
- [ ] The **thrower** is rendered: a character carrying a player likeness, mid-eat, releasing the
      projectile when the eat finishes. Follow the existing likeness convention rather than inventing
      one — `apps/client/public/mockups/petmon-sprite-booth.html` (photo → sprite) and
      `docs/petmon-design.md` (`spriteSrc` + taunt on `leaders[]`). Placeholder art is fine; the
      *convention* is what is being decided.
- [ ] The **projectile question is answered explicitly, because it reaches back into the physics:**
      the integrator models circles with position only — **no angular velocity, no rotation.** A flat
      wing-bone sprite would slide down a ramp without ever tumbling, which reads as broken; a
      drumette reads round and survives. The prototype must show both so the call is made on sight.
      Record which, and whether rotation is therefore needed — that answer is an input to WN-15's
      scope, and potentially a follow-up ticket against the WN-23 module.
- [ ] The **miss beat** is prototyped, not just the landing: projectile ends up on the floor, and a
      second character walks on and picks it up. This is load-bearing, not decoration — WN-15 says
      the game dies if failure feels arbitrary, and a miss that ends in a punchline stays legible
      even when the physics is not.
- [ ] The **hand-off from the `EATING` phase** is shown. `EATING` already exists
      (`packages/shared/src/phase/index.ts:5`) with the timer as its dominant element (DESIGN.md
      §109), so the throw is a phase transition out of a real phase, not a cold open.
- [ ] Reads at TV distance per DESIGN.md — `100dvh`, no scroll, fluid `clamp` typography, party-first
      glanceability.
- [ ] **Lint is pre-authorized to be handled, not discovered.** This lands under
      `apps/client/src/components/**`, where `eslint.config.mjs` enables the wingnight component
      rules (`no-hardcoded-component-jsx-text`, `no-inline-style-prop`,
      `require-styles-import-in-component-entry`, `component-entry-file-name`, `max-lines`). A
      variant lab violates these by construction. **Decision made here so the implementer does not
      halt at the fork:** add a mirrored `ignores` entry for this prototype's folder in
      `eslint.config.mjs`, with an inline comment naming **WN-15** as the ticket that deletes both
      the prototype and the entry. A scope carve-out for throwaway code — no rule definition changes,
      no `eslint-disable` comment anywhere.
- [ ] **No bare `window` / `import.meta.env` at module or render scope**, proven by a colocated unit
      test that **imports the prototype module**. Do not treat a green `pnpm test` as the proof:
      nothing imports `App`, so an unimported module's bare `window` passes green and the guard never
      fires — gate1 called that "false comfort" on WN-16.
- [ ] `pnpm lint` → `pnpm typecheck` → `pnpm test` all pass, with output pasted into `## Evidence`.

## Plan
Grilled 2026-08-15 alongside WN-23/WN-24. This ticket exists because of a call made while driving the
WN-18 lab: the UI is not downstream decoration, it decides the level geometry, the piece vocabulary,
and how long a run should feel — so re-finding presets (WN-24) before the visual direction is picked
means doing that work twice.

**Runs in parallel with WN-23.** The friction fix is theme-independent — whether a body can slide is
a mechanic, not a skin — so neither blocks the other. WN-24 waits on both.

**The brief, from the 2026-08-15 session (this is content, not a spec — the prototype's job is to
make it concrete enough to judge):** a character carrying a friend's likeness is eating wings; when
the eating finishes they throw the bone; the team's ramps have to deflect it into a **trash can**;
a miss leaves it on the floor, and the girlfriend walks on and picks it up, because she always cleans
up after him.

**What this ticket does NOT do.** It explores; it does not port. The winner is folded into production
by `port-variant` (rewritten properly — prototype code ships without tests or real data), and the
prototype route plus its eslint carve-out are deleted in WN-15.

**Open question this prototype is expected to answer, flagged for WN-15's scope:** whether the picked
projectile needs rotation. If it does, that is new physics in the WN-23 module (angular velocity in a
position-only Verlet integrator) and wants its own ticket — do not silently absorb it.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-15T17:16:23.902Z gate1: pass (product-owner, confidence high) — advancing to implement. Baseline verify chain confirmed green on HEAD (lint/typecheck/test all exit 0), so the WN-23 unsatisfiable-gate failure mode does not apply. e2e key correctly omitted: no spec in tests/e2e/ references /dev/lab, DEV_LAB or resolveClientRoute, and AC-1 forbids changing the route module. Blast radius verified additive past the 'does production import this' test: eslint.config.mjs has no test-bearing consumer in the repo-wide gate, and resolveClientRoute's two test-bearing consumers stay valid because the existing DEV_LAB route is reused rather than widened. Four minors carried to the implementer: (1) the likeness citation is doc-only — PETMON is unbuilt, so spriteSrc/leaders[] does not exist in code; the landed player-likeness field is avatarSrc on players[] (contentLoader/loadPlayers, AdminConfigWizard/RosterStep) — read both refs, the sprite-booth mockup half IS accurate; (2) largest of the three labs and the ticket omits its compression lever — build the scene primitives (thrower, projectile, ramps, can, cleaner) ONCE and vary composition, since AC-3's differences are placement/scene-share/foregrounding (shared sub-components are allowed, a shared Layout is not); (3) restore the colocated resolveClientRoute name-pin assert that WN-18 landed — nothing imports App, so a typo'd lab name passes the whole gate green; (4) AC-5 must record the OBSERVATION (flat bone slides without tumbling vs drumette reads round) and leave the aesthetic call to the human pick — do not manufacture a projectile decision. Full verdict: .work/verdicts/WN-25.gate1.json
- 2026-08-15T17:16:59.216Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-25
- 2026-08-15T17:26:53.521Z Built the lab at apps/client/src/components/ContraptionUiLab/ behind /dev/lab/contraption-ui. Applied the gate1 compression lever: shared scene primitives (Thrower, ProjectileSprite, Ramp, TrashCan, Cleaner, EatingTimer, Floor) built once in scene/, composed differently by three sibling variant folders — no shared Layout. Pure modules extracted and colocated-tested: variants/ (resolveVariantId + the three structural axes), sequence/ (five beats, resolveSequencePosition, resolveVisibleBeats), projectile/ (both candidates + requiresAngularVelocity), scene/flightPath/ (waypoint-driven arc). Wired one App.tsx dispatch arm and one eslint ignores entry naming WN-15 as the deleter. Restored the resolveClientRoute name-pin test gate1 flagged as dropped (minor 3), using the hyphenated name so the segment matcher is exercised too. Followed gate1 minor 1: the likeness prop is avatarSrc (the landed players[] field), not the doc-only spriteSrc. Followed gate1 minor 4: projectile/ records the OBSERVATION and the physics implication; it does not make the pick. Deliberate call recorded for QA: the scene is SCRIPTED, not a run of the real integrator — WN-23's friction fix is not landed, so a live run would creep to a dead stop and actively mislead the judgement; the fixed-orientation constraint (no angular state in CircleBody) IS faithfully reproduced, which is the part AC-5 asks a human to judge. Gate green: lint + typecheck + test all pass (52/52 on the new and touched suites).
- 2026-08-15T17:50:17.687Z qa attempt 1 on c916948: PASS (qa-reviewer, high confidence) — no reward-hacking (test diff is +0 deleted lines; the resolveClientRoute change is +9/-0), AC-2 scope guardrail held, AC-3 verified structurally distinct by reading all three variants, AC-9 proof non-vacuous, and the reviewer re-ran the gate itself. It also graded the scripted-scene judgement call SOUND. Acted on the advisory minors rather than only riding them into evidence, because the first one is a real AC gap: AC-6 says the cleaner PICKS IT UP, but the bone was pinned to the floor for the whole beat so the gag never completed. Fixed by extracting scene/cleanerWalk/ (walk-on → stoop → pick up → carry off, colocated-tested) which also kills the 3x copy-pasted walk interpolation the reviewer flagged; the projectile stops being drawn once she has it, pinned by a test that renders before/after pick-up. Also took: removed the lerpPoint dead no-op (and the now-unused lerp), removed the unused projectileLegend export, replaced the trivially-true /Throw/ assertion (a substring of 'Thrower') with assertions on the axis VALUES, added direct render coverage for the two variants only typecheck was exercising, and added resolveSequenceDuration(outcome) so a landed run no longer overruns onto a frame with no beat highlighted. Left as-is: the metadata-string distinctness test (structural check would need DOM diffing for throwaway code), the unexercised avatarSrc branch, and the two >150-line files (WN-15 deletes the folder wholesale). Verify re-run green after the fix.
- 2026-08-15T18:00:29.748Z qa attempt 2 on d9c9185: PASS (qa-reviewer, high confidence), recorded with --supersede. Verified the AC-6 fix is real and falsifiable (under the old released-only guard the sprite still renders at cleanup progress 0.8, so the negative assertion would have failed), confirmed the modified assertion is strictly STRONGER not merely different, confirmed the settle-branch removal is value-identical with its test file untouched, and confirmed no TDZ on resolveSequenceDuration. It also corrected my previous note: resolveSequenceDuration does NOT fully remove the no-beat-highlighted frame on a landed run, it only shortens it — that overstatement is fixed in ## Evidence. browser-verify: PASS — drove all three variants at 1440x810, 14 screenshots in .work/verdicts/WN-25-browser/. Evidence written: dev route, the three-axis variant table, the screenshot index, the AC-5 observation + implication (drumette needs no new physics; a flat bone would need angular velocity and its own ticket), the verify paste (374/374 apps/client), and the known-imperfect list. Ready for the human pick — the lab does not choose.

## Evidence

### The pick is still open — this is what you drive

```
pnpm --filter @wingnight/client dev
http://localhost:5173/dev/lab/contraption-ui
```

`?variant=sidestage` · `?variant=arena` · `?variant=character-first`, or the floating switcher
top-left of the stage. Panel controls: outcome (landed / missed), projectile (drumette / wing bone),
and Replay. **Nothing here picks a variant — that is yours.**

| Variant | Thrower | Throw | Target |
|---|---|---|---|
| A · Sidestage | Left edge, in profile, outside the field | Full-width traverse — the throw is the whole scene | Foregrounded: oversized, in front of the ramps |
| B · Arena | Bottom-centre, small, camera pulled back | Short arc into a large field — the field dominates | Embedded: one object among the ramps |
| C · Character-first | Foreground panel, large — the eat is the hero | Small — reads as an exit from the character's panel | Embedded at the far end of a backdrop strip |

### Screenshots

`.work/verdicts/WN-25-browser/` (1440×810, captured from the running route):

- `sidestage-1-eating.png` · `arena-1-eating.png` · `character-first-1-eating.png` — the EATING
  hand-off, timer dominant (AC-7)
- `sidestage-2-flight.png` · `arena-2-flight.png` · `character-first-2-flight.png` — flight and
  deflection
- `sidestage-3-miss-cleanup.png` · `arena-3-miss-cleanup.png` ·
  `character-first-3-miss-cleanup.png` — the cleaner stooping over the bone
- `sidestage-4-miss-carried-off.png` — the miss beat completing: empty floor, she carries it off
- `sidestage-landed.png` — the landed ending, for contrast
- `projectile-drumette-flight.png` · `projectile-wingbone-flight.png` ·
  `projectile-wingbone-settled.png` — the AC-5 comparison

### AC-5 — the projectile question, answered as an observation

**The observation, which is what the lab is qualified to give:**

- **Drumette — reads correctly.** Roughly radially symmetric, so a fixed orientation is invisible.
  Sliding without tumbling never contradicts the eye.
- **Wing bone (flat) — reads broken.** It holds one angle the whole way and comes to rest on the
  floor still tilted at its flight angle, looking pinned rather than tumbled. The longer the slide,
  the more wrong it looks. See `projectile-wingbone-settled.png`.

**The implication, stated but not decided:** the integrator models bodies as circles with position
only — `CircleBody` is origin/radius/restitution/slip, and a grep for `angular|rotation|torque|omega`
across `packages/shared/src/contraption/` returns nothing. So **if the flat bone is picked, angular
velocity is new physics in the WN-23 module and needs its own ticket.** If the drumette is picked,
no new physics is needed. Nothing in this change adds rotation to that module.

**Why the scene is scripted rather than a run of the real integrator.** WN-23's friction fix has not
landed, so a live run today creeps to a dead stop and would mislead exactly the judgement being made.
The constraint AC-5 turns on — fixed sprite orientation, because there is no angular state — is
reproduced faithfully, and that is the part a human is being asked to judge. WN-18's `ContraptionLab`
remains the harness over the real integrator.

### Verify

```
$ work verify
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ verify passed (3 step(s))
```

`apps/client`: **374 tests, 374 pass, 0 fail, 0 skipped, 0 todo** — including the four new colocated
suites (`variants/`, `sequence/`, `projectile/`, `scene/flightPath/`, `scene/cleanerWalk/`), the lab
entry suite, and the restored `resolveClientRoute` name pin.

### Verdicts

- `gate1`: **pass** — `.work/verdicts/WN-25.gate1.json` (4 minors, all acted on or recorded)
- `qa`: **pass** (attempt 2, superseding attempt 1 on `c916948`) — `.work/verdicts/WN-25.qa.json`
- `browser`: **pass** — `.work/verdicts/WN-25.browser.json`

### Known-imperfect, recorded rather than fixed

- `resolveSequenceDuration` is narrower than its docstring claims: a landed run now stops at 6300ms,
  but the held final frame still highlights no beat chip. The artifact is shortened, not removed.
  Cosmetic, outside every AC. (qa attempt 2, minor 1 — the earlier Progress note overstated this.)
- `resolveSequenceDuration` has no direct colocated test.
- `clampProgress` is duplicated between `scene/flightPath/` and `scene/cleanerWalk/`.
- The carried bone is drawn as a round blob regardless of projectile kind.
- The `avatarSrc` likeness branch is never exercised — every variant shows the placeholder head. The
  prop follows the landed `players[].avatarSrc` field (not the doc-only PETMON `spriteSrc`), so the
  convention question is answerable, but a broken href would not be caught.

WN-15 deletes this folder and its eslint carve-out wholesale, which is why none of the above was
worth more churn.

## Links
Rationale: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`; idea doc [contraption.md](../../docs/minigames/ideas/contraption.md).
Likeness convention: `apps/client/public/mockups/petmon-sprite-booth.html`, [petmon-design.md](../../docs/petmon-design.md).
Route + carve-out precedent: [WN-16](WN-16-anamorph-prototype-lab-answer-the-jitter-curve-dia.md), [WN-18](WN-18-contraption-visual-harness-canvas-over-the-wn-17-i.md).
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
