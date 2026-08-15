---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-25
title: "CONTRAPTION UI direction prototype: the thrower, the throw, the target, and the miss beat"
status: in-review
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
- 2026-08-15T18:00:42.389Z handed off → in-review (verify green); awaiting land

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

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 27 symbol(s) with external call-sites reviewed (4 low-signal name(s) skipped: end, next, note, start):

- `RunOutcome` → apps/client/src/components/ContraptionLab/labRun/index.ts:10, apps/client/src/components/ContraptionLab/labRun/index.ts:42, apps/client/src/components/ContraptionLab/runOutcome/index.ts:59, apps/client/src/components/ContraptionLab/runOutcome/index.ts:162
- `after` → apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:70, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:108, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:126, apps/client/src/components/ContraptionLab/runOutcome/index.ts:93, apps/client/src/components/ContraptionLab/runOutcome/index.ts:95, apps/client/src/components/ContraptionLab/runOutcome/index.ts:110, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:202, apps/client/src/components/HostControlPanel/MinigameSurface/index.test.tsx:105, … 25 more (run `work grep`)
- `arc` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:206, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:226
- `beat` → apps/client/src/components/DisplayBoard/StageSurface/MinigameIntroStageBody/index.test.tsx:7, apps/client/src/components/DisplayBoard/StageSurface/RoundIntroStageBody/index.test.tsx:16, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:47, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:313, apps/client/src/components/HostControlPanel/MinigameSurface/index.tsx:60
- `before` → apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:80, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.ts:5, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:81, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:82, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:124, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:22, apps/client/src/components/ContraptionLab/runOutcome/index.ts:34, apps/client/src/components/ContraptionLab/runOutcome/index.ts:92, … 32 more (run `work grep`)
- `button` → apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:60, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:61, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:70, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:111, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:112, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:118, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:44, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:45, … 188 more (run `work grep`)
- `buttonRow` → apps/client/src/components/AnamorphLab/LabControls/index.tsx:171, apps/client/src/components/AnamorphLab/index.tsx:123, apps/client/src/components/AnamorphLab/styles.ts:66, apps/client/src/components/ContraptionLab/LabControls/index.tsx:190, apps/client/src/components/ContraptionLab/styles.ts:57
- `container` → apps/client/src/components/AnamorphLab/index.tsx:63, apps/client/src/components/AnamorphLab/styles.ts:1, apps/client/src/components/ContentFatalState/index.tsx:14, apps/client/src/components/ContentFatalState/styles.ts:1, apps/client/src/components/ContraptionLab/index.tsx:65, apps/client/src/components/ContraptionLab/styles.ts:1, apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/index.tsx:34, apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/styles.ts:1, … 56 more (run `work grep`)
- `control` → apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:18, apps/client/src/components/AnamorphLab/anamorphCloud/index.ts:281, apps/client/src/components/AnamorphLab/index.test.tsx:25, apps/client/src/components/ContraptionLab/index.test.tsx:24, apps/client/src/components/ContraptionLab/index.test.tsx:66, apps/client/src/components/ContraptionLab/pieceSets/index.ts:144, apps/client/src/components/HostControlPanel/styleTokens/index.ts:106, apps/client/src/copy/admin.ts:127, … 15 more (run `work grep`)
- `description` → apps/client/src/components/AdminConfigWizard/PromptPacksStep/styles.ts:8, apps/client/src/components/AnamorphLab/copy.ts:3, apps/client/src/components/AnamorphLab/index.tsx:66, apps/client/src/components/AnamorphLab/styles.ts:7, apps/client/src/components/ContentFatalState/copy.ts:5, apps/client/src/components/ContentFatalState/index.tsx:17, apps/client/src/components/ContentFatalState/styles.ts:8, apps/client/src/components/ContraptionLab/copy.ts:3, … 36 more (run `work grep`)
- `ending` → tools/eslint-plugin-wingnight/rules/no-class-name-suffix-in-styles-exports.mjs:62
- `found` → apps/client/src/components/ContraptionLab/labRun/index.ts:64, apps/client/src/components/ContraptionLab/labRun/index.ts:65, apps/client/src/components/ContraptionLab/pieceSets/index.ts:87, apps/client/src/components/ContraptionLab/runOutcome/index.ts:110, packages/shared/src/contraption/noTranscendentals.test.ts:46, packages/shared/src/contraption/noTranscendentals.test.ts:50, packages/shared/src/contraption/noTranscendentals.test.ts:58, packages/shared/src/contraption/noTranscendentals.test.ts:61, … 2 more (run `work grep`)
- `frame` → apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:96, apps/client/src/components/ContraptionLab/pieceSets/index.ts:13, apps/client/src/components/ContraptionLab/pieceSets/index.ts:81, apps/client/src/components/ContraptionLab/pieceSets/index.ts:144, apps/client/src/components/ContraptionLab/runOutcome/index.ts:111, apps/client/src/components/ContraptionLab/runOutcome/index.ts:112, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:10, packages/minigames/drawing/src/client/DisplayDrawingSurface/StrokeReplayCanvas/index.tsx:11, … 9 more (run `work grep`)
- `heading` → apps/client/src/components/AnamorphLab/index.tsx:65, apps/client/src/components/AnamorphLab/styles.ts:5, apps/client/src/components/ContentFatalState/index.tsx:16, apps/client/src/components/ContentFatalState/styles.ts:6, apps/client/src/components/ContraptionLab/index.tsx:67, apps/client/src/components/ContraptionLab/styles.ts:5, apps/client/src/components/DisplayBoard/GameLockedOverlay/index.tsx:22, apps/client/src/components/DisplayBoard/GameLockedOverlay/styles.ts:14, … 15 more (run `work grep`)
- `html` → apps/client/src/components/AnamorphLab/index.test.tsx:19, apps/client/src/components/AnamorphLab/index.test.tsx:21, apps/client/src/components/AnamorphLab/index.test.tsx:22, apps/client/src/components/AnamorphLab/index.test.tsx:26, apps/client/src/components/AnamorphLab/index.test.tsx:28, apps/client/src/components/AnamorphLab/index.test.tsx:29, apps/client/src/components/AnamorphLab/index.test.tsx:30, apps/client/src/components/AnamorphLab/index.test.tsx:31, … 455 more (run `work grep`)
- `ids` → apps/client/src/components/AdminConfigWizard/PromptPacksStep/index.tsx:26, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:100, apps/client/src/utils/hostRequests/index.test.ts:230, apps/client/src/utils/hostRequests/index.test.ts:234, apps/client/src/utils/hostRequests/index.test.ts:246, apps/client/src/utils/resolveTeamColorVariant/index.test.ts:13, apps/client/src/utils/resolveTeamColorVariant/index.test.ts:23, apps/server/src/contentLoader/loadTeams/index.test.ts:7, … 8 more (run `work grep`)
- `index` → apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:13, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:4, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:21, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:53, apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:62, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:17, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:41, apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:61, … 476 more (run `work grep`)
- `inverse` → apps/server/src/roomState/baseMutations/index.ts:134
- `normalized` → packages/minigames/drawing/src/client/strokeRendering/index.ts:5, packages/minigames/drawing/src/client/strokeRendering/index.ts:10, packages/minigames/drawing/src/runtime/guards/index.ts:205, packages/minigames/geo/src/runtime/index.test.ts:173, packages/shared/src/roomState/index.ts:117
- `point` → apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.test.ts:18, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:79, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:85, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:86, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:30, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:38, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:41, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:47, … 89 more (run `work grep`)
- `position` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:69, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:88, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:91, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:92, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:101, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:186, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:189, apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:191, … 25 more (run `work grep`)
- `remaining` → apps/client/src/components/DisplayBoard/StageSurface/EatingStageBody/styles.test.ts:12, apps/client/src/components/HostControlPanel/HostPhaseBody/EatingStage/styles.test.ts:12, apps/client/src/utils/resolveRemainingTimerSeconds/index.test.ts:6, apps/client/src/utils/resolveRemainingTimerSeconds/index.test.ts:20, apps/client/src/utils/resolveRemainingTimerSeconds/index.test.ts:34, apps/server/src/roomState/phaseTurnFlow.test.ts:211, packages/minigames/trivia/src/client/HostTriviaSurface/styles.ts:2
- `stage` → apps/client/src/components/HostControlPanel/styleTokens/index.ts:28, apps/client/src/components/HostControlPanel/styles.ts:10, packages/minigames/drawing/src/client/DisplayDrawingSurface/index.tsx:121, packages/minigames/drawing/src/client/DisplayDrawingSurface/styles.ts:1, packages/minigames/drawing/src/client/DisplayDrawingSurface/styles.ts:19, packages/minigames/geo/src/client/DisplayGeoSurface/index.tsx:23, packages/minigames/geo/src/client/DisplayGeoSurface/styles.ts:1
- `step` → apps/client/src/components/AdminConfigWizard/FieldIssue/index.tsx:9, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:128, apps/client/src/components/AdminConfigWizard/fieldTokens/index.ts:1, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:50, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.ts:7, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:32, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:154, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:155, … 50 more (run `work grep`)
- `targets` → apps/client/src/components/AdminConfigWizard/entryListDraft/index.test.ts:21, apps/client/src/components/ContraptionLab/copy.ts:37
- `url` → apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:83, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:88, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:93, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/HeroFlame/index.tsx:98, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:13, apps/server/src/contentLoader/contentLoaderUtils/index.ts:2, apps/server/src/contentLoader/contentLoaderUtils/index.ts:5, apps/server/src/contentLoader/contentLoaderUtils/index.ts:13, … 10 more (run `work grep`)
- `visible` → apps/client/src/components/AdminConfigWizard/fieldTokens/index.ts:11, apps/client/src/components/AdminConfigWizard/fieldTokens/index.ts:13, apps/client/src/components/AdminConfigWizard/fieldTokens/index.ts:49, apps/client/src/components/ContraptionLab/runOutcome/index.ts:29, apps/client/src/components/HostControlPanel/OverrideActionsSurface/styles.ts:16, apps/client/src/components/HostControlPanel/OverrideConfirmDialog/styles.ts:10, apps/client/src/components/HostControlPanel/OverrideConfirmDialog/styles.ts:13, apps/client/src/components/HostControlPanel/OverrideDock/styles.ts:4, … 18 more (run `work grep`)

**QA findings (advisory):** 10 finding(s) carried from the passing verdict:
- **minor** — resolveSequenceDuration does not fully achieve its stated purpose. Its docstring says running for the full SEQUENCE_DURATION_MS 'would leave it sitting on a static frame with no beat highlighted' — but the rAF loop's final setElapsedMs(next) always fires with next >= duration, and resolveSequencePosition(6300) walks past settle (2200+700+2000+1400=6300) into the cleanup beat at progress ~0. For outcome 'landed', visibleBeats excludes cleanup, so the held terminal frame STILL highlights no beat chip — the artifact is shortened from 2600ms to a permanently-held final frame, not removed. The ticket's Progress note claiming 'a landed run no longer overruns onto a frame with no beat highlighted' overstates the fix. Cosmetic, prototype-only, outside every AC.
    evidence: apps/client/src/components/ContraptionUiLab/sequence/index.ts:24-31 (docstring + `resolveVisibleBeats(outcome).reduce(...)`); index.tsx:67 `if (next < resolveSequenceDuration(outcome)) { frame = window.requestAnimationFrame(step); }` — next is set before the guard, so the last committed elapsedMs is >= 6300; sequence/index.ts:52-64 maps that onto `{ beat: BEATS[4] /* cleanup */, progress: ~0 }`; index.tsx:157-164 highlights only `visibleBeats` where `beat.id === position.beat.id`.
- **minor** — New exported behaviour with no direct test (rubric 3). resolveSequenceDuration is a new public export of sequence/ and its colocated suite was not extended — sequence/index.test.ts imports SEQUENCE_DURATION_MS, resolveSequencePosition and resolveVisibleBeats but never resolveSequenceDuration. Nothing exercises it: renderToStaticMarkup never runs the effect that calls it. Held to minor rather than major because it is a one-line fold over the already-tested resolveVisibleBeats, in a folder WN-15 deletes wholesale, and a wrong result is cosmetic (animation length) rather than silent corruption of an AC.
    evidence: apps/client/src/components/ContraptionUiLab/sequence/index.test.ts:5-8 imports `{ SEQUENCE_DURATION_MS, resolveSequencePosition, resolveVisibleBeats }` only; grep for resolveSequenceDuration across apps/ packages/ returns exactly two hits: the declaration (sequence/index.ts:29) and the call in index.tsx:67. Contrast with cleanerWalk/, which the same commit shipped with a full colocated suite.
- **minor** — Duplicated helper across sibling modules under scene/. The follow-up deleted `lerp` from scene/flightPath/index.ts and re-created a byte-identical `lerp` in scene/cleanerWalk/index.ts, and `clampProgress` now exists twice — an identical 9-line implementation in both modules. code-design Utilities: 'Extract a utility when the logic is independently testable, single-responsibility, OR reused' — this is now reused across two modules, so it has crossed that trigger. Two places that must be kept in sync on any clamping change, though both are module-private and trivially correct.
    evidence: scene/cleanerWalk/index.ts:6-22 clampProgress + lerp vs scene/flightPath/index.ts:37-47, the identical clampProgress; the follow-up hunk removed `const lerp` from flightPath/index.ts while the same body was added at cleanerWalk/index.ts:24-26.
- **info** — The pick-up half of AC#6 is pinned only by the projectile's disappearance, not by the cleaner visibly holding it. The `carrying` branch renders a circle r=6 regardless of projectile kind — so the flat wing-bone becomes a round blob the moment she picks it up, which slightly muddies the very fixed-orientation/shape reading AC#5 asks a human to judge. No test asserts the carried bone is drawn at all.
    evidence: scene/index.tsx:173 `{carrying ? <circle cx={-14.5} cy={46} r={6} fill={PALETTE.bone} /> : null}` — unconditional circle, while ProjectileSprite (scene/index.tsx:100-119) branches on `kind`. index.test.tsx:115-129 asserts only the absence of width=44 after pick-up.
- **info** — The cleaner exits to x = sceneWidth (960) in a 960-wide viewBox, i.e. her origin lands ON the edge, so roughly 19 scene-units of her sprite remain visible in the frame the run holds on forever. 'The beat ends on an empty floor' is true of the bone but approximate for the character. Symmetric with her entry, which has always had the same property.
    evidence: scene/cleanerWalk/index.ts:43 returns 960 at t=1; Cleaner body spans x=-19..+15 (scene/index.tsx:164-172); VariantSidestage/index.tsx:44 viewBox 0 0 960 540. resolveSequencePosition clamps at cleanup progress 1, so that frame is the permanent resting frame.
- **info** — SCENE_WIDTH = 960 is now declared in all three variant files, each alongside a hardcoded 960 in the same file's viewBox and background rect. Incidental, same-file-local duplication of a constant rather than of logic — flagged, not faulted.
    evidence: VariantSidestage/index.tsx:14 + :44-45, VariantArena/index.tsx:12, VariantCharacterFirst/index.tsx:14 + :45-46.
- **info** — The two new variant render tests assert only /<svg/, so a variant that regressed into rendering an empty stage would still pass. Adequate for their stated purpose (catching a crash in the two variants only typecheck was exercising) and honestly described as such in the comment, but they are smoke tests, not behaviour tests.
    evidence: index.test.tsx:96-110 — assert.match(html, /<svg/) is the sole assertion in both variant render tests.
- **info** — Side effect of the (net-stronger) assertion swap: the axis dt LABELS are now asserted by no test. Deleting copy.axisLabel.throwScale would leave the suite green, where the old /Throw/ would have caught it. The swap is still a clear net gain — the old triple could not detect a deleted axis ROW at all, which is the failure that matters — and the new first assertion now duplicates the one in 'renders the default variant when no effect has run'.
    evidence: index.test.tsx:45-51 asserts values from variants/index.ts:24-26; copy.ts:13-17 axisLabel is now unreferenced by any assertion. Line 48 duplicates line 32.
- **info** — AC#11's Evidence half is not yet satisfied at this sha: the ticket's ## Evidence section still holds its placeholder. The gate itself is genuinely green (I re-ran all three), and the ticket's own wording defers evidence to 'before done', so this is a pending step rather than a defect — but the pasted lint/typecheck/test output, the variant screenshots, and the projectile/rotation answer must land there before the status flips.
    evidence: .work/tickets/WN-25-contraption-ui-direction-prototype-the-thrower-the.md:99-100 — '## Evidence' followed by the placeholder.
- **info** — Two files remain over the ~150-line prompt (scene/index.tsx at 214, index.tsx at 206). Both are coherent units, the folder carries an eslint carve-out that WN-15 deletes wholesale, and the implementer recorded the deliberate decision to leave them. A prompt to look, not a cap.
    evidence: wc -l: scene/index.tsx 214, index.tsx 206; eslint.config.mjs:26-31 carve-out naming WN-15 as the deleter.

_Captured 2026-08-15T18:00:42.389Z._
<!-- captured-evidence:end -->

## Links
Rationale: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`; idea doc [contraption.md](../../docs/minigames/ideas/contraption.md).
Likeness convention: `apps/client/public/mockups/petmon-sprite-booth.html`, [petmon-design.md](../../docs/petmon-design.md).
Route + carve-out precedent: [WN-16](WN-16-anamorph-prototype-lab-answer-the-jitter-curve-dia.md), [WN-18](WN-18-contraption-visual-harness-canvas-over-the-wn-17-i.md).
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
