---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-24
title: "CONTRAPTION lab: re-find piece-set presets against the fixed physics and picked visual direction"
status: ready
kind: spike
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-23, WN-25, WN-28]
blocked_by: []
---

## Goal
Re-find the WN-18 lab's piece-set presets against WN-23's sliding physics and WN-25's picked visual
direction, so WN-15's questions 2, 3 and 4 can finally be driven against routes that mean something.
This ticket produces the presets; the judgements stay human.

## Acceptance Criteria
- [ ] `apps/client/src/components/ContraptionLab/pieceSets/index.ts` presets are re-found by search
      against the **fixed** integrator, keeping the module's existing standard: a set is kept only if
      the wing LANDS and physically CONTACTS every piece it was given, checked at every one of the
      240 integration steps rather than at the 30Hz display sampling. An uncontacted piece is
      scenery, and a set full of scenery makes the piece-count question unanswerable.
- [ ] **The sets must stop nesting.** Today `four = two + 2` and `six = four + 2`, which is why 2 and
      4 pieces produced a byte-identical track and an identical 1.27s settle — the added ramps were
      near-bucket deflectors that barely altered the run. Each set is re-found independently so piece
      count is a real variable rather than a suffix.
- [ ] At least one set exploits **sliding** — a route that is only solvable because a body now travels
      along a ramp instead of deflecting off it. Without this the ticket cannot demonstrate that
      WN-23 changed anything a player would notice.
- [ ] Level geometry follows WN-25's picked direction (target placement, thrower position, scale)
      rather than the current abstract bucket, so the routes are designing toward the real scene.
- [ ] The lab's per-set `hint` copy is rewritten to ask the re-framed question honestly, as the
      current hints do ("does a sixth piece add cleverness, or just fiddling?").
- [ ] The **creep caveat is either removed or made true.** `pieceSets/index.ts:98-100` documents the
      per-step-slip creep and claims `contraptionLabCopy.creepNote` "carries that up to the room" —
      but `creepNote` does not exist in `copy.ts` (qa-reviewer flagged this dangling reference at
      WN-18 review). After WN-23 the caveat is obsolete anyway: delete it rather than wiring it up.
- [ ] The benchmark preset entry still points at `CONTRAPTION_BENCHMARK_LAYOUT` and now reaches a
      verdict, since WN-23 re-tunes that fixture to settle. Its lab hint stops describing it as a
      control that never resolves.
- [ ] Existing colocated tests still hold: the contact-guard assertion that proves each preset's
      ramps are genuinely touched must be re-pointed at the new sets and must still **fail loudly**
      when a ramp is shifted out of the flight path (WN-18's QA pass mutation-probed exactly this —
      min contact distance moved from ~2.60 to 15.97/9.25/10.86 and the assertion went red). Do not
      relax it to fit new geometry.
- [ ] `pnpm lint` → `pnpm typecheck` → `pnpm test` all pass, with output pasted into `## Evidence`.

## Plan
Grilled 2026-08-15 (plan-work Mode A). This is the `apps/client` half of the friction work — the same
seam WN-17/WN-18 split on, and the same seam whose combined version gate1 rejected for bundling
separable deliverables. WN-23 is the headless module half.

**Why it waits on both deps.** WN-23 because every current preset was search-found against physics
that is about to change, so any route kept now is void. WN-25 because level geometry is a design
question — where the target sits and how the scene is framed decide what a "route" even is, and
re-finding presets against an abstract box means doing the work twice.

**What this unblocks.** WN-15's questions 2 (piece set and count), 3 (one shot vs best-of-N) and 4
(sim length) — none of which could be answered on 2026-08-15, because with no sliding and no
body-vs-body contact the entire buildable vocabulary was *drop, bounce, deflect*, and there was not
enough physics for a sixth piece to be clever with. Q1 (failure readability) **is** already answered
— ship `Trail` — and does not need re-driving unless WN-25 changes the scene enough to invalidate it.
Evidence table and reasoning are in WN-15's `## Plan`.

**Scope guardrail (inherited from WN-16/WN-18, restated because it is the whole risk):** do NOT create
a package under `packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, or touch either registry.
The lab stays a canvas over the integrator: no server, no teams, no scoring, no phases.

**Throwaway, still.** The lab and its eslint carve-out are deleted by WN-15. This ticket does not port
anything into production.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshots of each re-found set, recorded before `done`>

## Links
Rationale + the Q1 answer + the evidence table: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`.
Physics dep: [WN-23](WN-23-contraption-integrator-impulse-bounded-coulomb-fri.md). Visual dep: [WN-25](WN-25-contraption-ui-direction-prototype-the-thrower-the.md).
Lab built by: [WN-18](WN-18-contraption-visual-harness-canvas-over-the-wn-17-i.md).
