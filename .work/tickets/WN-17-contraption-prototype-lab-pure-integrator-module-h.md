---
id: WN-17
title: "CONTRAPTION prototype lab: pure integrator module + harness; settle readability, piece set, and keyframe byte cost"
status: ready
kind: spike
priority: medium
created: 2026-08-07
deps: []
blocked_by: []
---

## Goal
Build the lab that answers WN-15's feel questions **and produces the byte measurement its
architecture decision is explicitly waiting on**. This ticket builds and measures; the judgement
calls stay human, made by driving the harness afterwards.

## Acceptance Criteria
- [ ] **A pure, portable integrator module with colocated unit tests.** Unlike WN-14's lab, WN-15
      says what survives here is *a module* — it ends up running inside the server-side reducer, so
      write it as the real thing behind a throwaway harness. It must not import anything
      browser-only. Tests assert **determinism**: identical seed + identical layout ⇒ byte-identical
      output across runs. That is the property the whole (a)-vs-(b) architecture question rests on.
- [ ] **No transcendental functions in the integrator** (`Math.sin/cos/exp/pow`…). WN-15's option (b)
      is sound only "with the transcendental ban above holding forever" — plain IEEE-754 double
      arithmetic is fully specified, transcendentals are not cross-platform reproducible. Enforce it
      with a test or a lint-style assertion over the module, not a comment.
- [ ] **Measure the keyframe track byte cost and record the real number.** WN-15 leans option (a)
      (server emits a keyframe track, display replays) but states outright: *"Needs a real byte count
      before committing."* Serialize a representative ~4s run and record the actual size, at both
      30fps and 20fps, in this ticket's Evidence. This is the deliverable that converts a leaning
      into a decision — and it is fully machine-producible, no human judgement required.
- [ ] A canvas harness over the integrator makes WN-15's questions answerable by driving it:
      failure **readability** (can the room see *why* a run failed), the **piece set and count**
      (smallest set that still allows a clever solution), **one shot vs best-of-N**, and **sim
      length** against the ~4s watchable target. Note WN-15 is the skill's *logic* branch but
      explicitly must NOT be a TUI — "do failures read as understandable" is a visual question.
- [ ] **Scope guardrail (from WN-15):** no package under `packages/minigames/`, no
      `MINIGAME_DEFINITIONS` entry, no registry changes — adding a `MinigameType` breaks every
      `Record<MinigameType, …>` in the repo until fully wired. The harness reuses the dev-lab route
      WN-16 adds if that has landed; otherwise it adds it the same way (see WN-16 AC1 for why
      `/dev/minigame/<slug>` is unavailable).
- [ ] **No bare `window` / `import.meta.env` at module or render scope** — the WN-3 crash class.
      Confirm with `pnpm test` run with the harness present.
- [ ] `pnpm typecheck` and `pnpm test` pass, with the integrator's determinism tests reported as
      executed (not merely zero failures — the WN-9 lesson).

## Plan
This one is genuinely different from WN-16 and should not be treated as its twin: WN-16 throws
everything away and keeps numbers; **WN-17 keeps a module**. Write the integrator to production
standard with real tests, and let only the harness around it be disposable.

The byte-count AC is the highest-value autonomous item across both labs — it settles a recorded
architecture leaning with a measurement rather than an opinion, and needs no human at all.

No dep on WN-16 despite the shared route: if WN-16 lands first this reuses the route, otherwise it
adds it. Forcing a dep would serialize two independent labs for a few lines of routing. If both run
in the same batch and both touch `resolveClientRoute`, expect a small merge conflict there and
resolve it in favour of one shared route.

Pre-verified 2026-08-07: `MinigameDevSandbox/index.tsx:14` imports `../../minigames/registry` and
`App.tsx:38` gates on `devMinigameType !== null`, so the existing dev route requires registration —
confirming the guardrail's premise.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- Answers + the byte number feed WN-15 (re-planned via plan-work Mode B after the human review).
- Question source: WN-15's `**Why needs_prototype: true**` and `**Architecture decision to confirm
  at GATE 1**` sections. Idea doc: `docs/minigames/ideas/contraption.md`.
- Pattern precedent named by WN-15: `docs/minigames/drawing-spec.md` (server records, display
  projects read-only).
