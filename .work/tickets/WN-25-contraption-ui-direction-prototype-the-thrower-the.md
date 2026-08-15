---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-25
title: "CONTRAPTION UI direction prototype: the thrower, the throw, the target, and the miss beat"
status: ready
kind: ui
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []
blocked_by: []
needs_prototype: false   # this ticket IS the prototype — it builds the lab; the PICK stays human
                         # (WN-16/WN-18 precedent). Do not route it through a prototype detour.
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

## Evidence
<variant screenshots + preview URL + the projectile/rotation answer, recorded before `done`>

## Links
Rationale: [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md) `## Plan`; idea doc [contraption.md](../../docs/minigames/ideas/contraption.md).
Likeness convention: `apps/client/public/mockups/petmon-sprite-booth.html`, [petmon-design.md](../../docs/petmon-design.md).
Route + carve-out precedent: [WN-16](WN-16-anamorph-prototype-lab-answer-the-jitter-curve-dia.md), [WN-18](WN-18-contraption-visual-harness-canvas-over-the-wn-17-i.md).
Blocks: [WN-24](WN-24-contraption-lab-re-find-piece-set-presets-against.md) → [WN-15](WN-15-contraption-minigame-build-a-physics-contraption-o.md).
