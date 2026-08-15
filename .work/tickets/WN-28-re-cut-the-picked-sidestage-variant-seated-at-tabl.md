---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-28
title: "Re-cut the picked Sidestage variant: seated-at-table thrower throwing back over the shoulder"
status: ready
kind: ui
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-25]
blocked_by: []
needs_prototype: false   # this IS lab work, same as WN-25 — it revises the lab, it does not need
                         # a prototype detour to decide whether to.
---

## Goal
Re-cut variant A (Sidestage) of the CONTRAPTION UI lab to the geometry the user actually picked —
the thrower **sits at a table** eating wings, **well above** the contraption field, and throws the
wing **backward over their shoulder**, so the contraption sits behind and below them instead of
laid out in front — so WN-24 re-finds level geometry against a picture that has been looked at
rather than against prose.

## Acceptance Criteria
- [ ] Variant A at `/dev/lab/contraption-ui?variant=sidestage` renders the revised composition: the
      thrower is **seated at a table**, their eye-line is **clearly above** the contraption field
      (not at floor level), and they face **away** from the field. The existing standing,
      field-facing, throws-forward-across composition is gone.
- [ ] The throw travels **backward over the shoulder** — the projectile leaves the hand heading away
      from the direction the thrower faces, then arcs **down** into the field behind and below them.
      Reuse `scene/flightPath/` by supplying new waypoints; do not fork the flight model. If the
      existing `apexLift` reads wrong for a throw that starts high, tune the waypoints — **do not**
      add a second arc implementation.
- [ ] A **table** and a **seated, back-turned thrower** are added as primitives in
      `scene/`, used **only** by variant A. `Thrower` keeps its current standing form for the other
      two variants — do not add a `seated` flag to the shared primitive and thread it everywhere.
- [ ] **Variants B · Arena and C · Character-first are untouched.** Their composition, waypoints and
      metadata are byte-identical after this change. The lab keeps three variants; this ticket
      revises exactly one.
- [ ] The projectile is the **drumette**, which the WN-25 pick settled. **No angular velocity, no
      rotation, and no change to any module under `packages/shared/src/contraption/`.** The flat
      wing bone stays available in the projectile toggle as the rejected option — do not delete it.
- [ ] **The coupled test repair rides along in this ticket, not a later one.** Variant A's three axis
      strings in `variants/index.ts` describe the OLD geometry
      (`"Left edge, in profile, outside the field"` / `"Full-width traverse — the throw is the whole
      scene"` / `"Foregrounded: the can sits in front of the ramps, oversized"`) and are asserted at
      four places in `ContraptionUiLab/index.test.tsx` (lines 32, 48, 49, 50). Rewrite the strings to
      describe the new geometry and update those assertions **in the same change**. This is a
      deliberate re-spec of a changed picture, not a weakened test — the assertions must still fail
      if the axis rows are deleted, so keep asserting on axis VALUES rather than the labels
      (`/Throw/` is a substring of `Thrower` and pins nothing).
- [ ] The two invariants the `variants/` suite already pins still hold after the rewrite: all three
      variants remain distinct on all three axes, and **exactly one** variant's `targetTreatment`
      still starts with `"Foregrounded"`. If variant A stays the foregrounded one, say so; if not,
      move it deliberately and update the suite in the same change.
- [ ] The five beats still play end to end for the revised composition, including the **miss beat
      completing** — bone on the floor, cleaner walks on, picks it up, carries it off, floor empty.
      `scene/cleanerWalk/` is parameterised by `sceneWidth`/`restX`, so re-aim it rather than
      reimplementing the walk.
- [ ] **Guardrails carried forward verbatim from WN-25:** do NOT create a package under
      `packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, add a `MinigameType`, or touch
      either registry. The `eslint.config.mjs` `ignores` entry for
      `apps/client/src/components/ContraptionUiLab/**` stays exactly as-is — no rule definition
      changes and no `eslint-disable` anywhere. WN-15 still deletes the folder and the entry.
- [ ] **No bare `window` / `import.meta.env` at module or render scope**, still proven by the
      colocated test that IMPORTS the module (`index.test.tsx` asserts
      `typeof globalThis.window === "undefined"`). Do not treat a green `pnpm test` as the proof —
      nothing imports `App`, so an unimported module's bare `window` sails through.
- [ ] Reads at TV distance per DESIGN.md — `100dvh`, no page scroll, fluid `clamp` typography.
- [ ] Screenshots of the revised variant A recorded in `## Evidence` (the EATING hand-off, the
      backward throw mid-flight, and the completed miss beat), alongside the dev route.
- [ ] `pnpm lint` → `pnpm typecheck` → `pnpm test` all pass, with output pasted into `## Evidence`.

## Plan
Planned 2026-08-15 (plan-work Mode A) immediately after the WN-25 human pick. This is a small,
well-bounded revision to a lab that already exists and was shipped an hour earlier, so the plan is
short by design.

**Why this exists.** WN-25 built the lab and the user picked **A · Sidestage** — but with a
structural revision the lab does not render: the thrower should sit at a table, much higher than
the field, throwing the wing backward over their shoulder. WN-24's job is re-finding level geometry
against the picked visual direction; if it runs against the shipped sidestage layout (floor-level
thrower facing the field, throwing forward across it) it designs to a stale picture and the search
is done twice. That is the same double-work argument that justified WN-25 existing at all, which is
why WN-24 now declares `deps: [WN-23, WN-25, WN-28]`.

**Projectile is settled — do not reopen it.** The WN-25 pick chose the **drumette**. It reads
correctly under the position-only integrator, so no angular velocity is needed and no ticket exists
against the WN-23 module. The flat wing bone stays in the toggle as the recorded rejected option.
A backward throw from height means a longer fall and a longer slide, which would have made a flat
bone's fixed orientation *more* visible — that consideration is already spent, and the drumette is
immune to it.

**The blast radius is inside the verify gate, and its repair is in scope here.** This is the
pre-ready checklist item that gate1 rejected WN-23 over. Variant A's axis metadata is asserted in
four places in the lab's own colocated suite, which `pnpm test` runs. Rewriting the composition
without rewriting those assertions leaves the gate red with no legal way to green; deferring the
repair to a later ticket recreates the WN-23 trap exactly. So both halves land together, and AC-6
says so explicitly and tells the implementer to keep the assertions strong (assert on axis VALUES,
not the labels) so the QA pass can tell a specified re-spec from a weakened test.

**Reuse, not re-fork.** `scene/flightPath/`, `scene/cleanerWalk/`, `sequence/`, `projectile/` and
the `variants/` metadata shape all survive unchanged — they were built parameterised (waypoints,
`sceneWidth`/`restX`) precisely so one model serves several compositions. The only genuinely new
code is a table and a seated, back-turned thrower, scoped to variant A so the other two keep the
standing primitive rather than growing a flag that threads through everything.

**Out of scope, deliberately.** General UI-quality polish. The user has said they intend to iterate
on the look long-term; that is polish against a settled picture and belongs at port time
(WN-15 / `port-variant`), not in throwaway lab code that WN-15 deletes. This ticket changes the
*geometry* that WN-24 designs against, nothing else.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<revised variant A screenshots + dev route + the verify paste, recorded before `done`>

## Links
The pick this implements: [WN-25](WN-25-contraption-ui-direction-prototype-the-thrower-the.md) `## Progress` (human pick, 2026-08-15).
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
