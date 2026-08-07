---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-15
title: "CONTRAPTION minigame: build a physics contraption on the tablet, watch the run on the TV"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-18]            # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
needs_prototype: false   # the prototype is now its own ticket (WN-17), not an inline pipeline detour — see Plan
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Ship CONTRAPTION as a minigame package: the active team lays out a handful of physics pieces on the tablet, commits, and the TV replays a server-simulated run of a wing falling through what they built.

## Acceptance Criteria
- [ ] `packages/minigames/contraption/` implements the `MinigameRuntimePlugin` contract (runtime + client + dev manifest), registered on both server and client like trivia/geo/drawing.
- [ ] The simulation runs **server-side** in the reducer and the display replays its recorded output — the display never predicts, mirroring drawing's stroke-replay projection.
- [ ] The integrator is deterministic and dependency-free (hand-rolled verlet; circles vs static segments with restitution), and avoids `Math.sin`/`cos`/`pow` in the hot path — those are implementation-defined and are the classic cross-engine drift source if the sim is ever moved client-side.
- [ ] Determinism is proven by test, not asserted: a fixed layout produces a byte-identical run across repeated reducer invocations, and a known-good layout lands in the bucket.
- [ ] Levels load via the standard local-overrides-sample pipeline (`content/local/minigames/contraption.json` → `content/sample/minigames/contraption.json`); every sample level ships a known-good solution in the content file, with a test asserting the sim still solves it (an unsolvable level is a genuinely bad party moment).
- [ ] Host surface is the layout editor on a coarse placement grid; display shows the static plan pre-commit and the replay post-commit, `100dvh`, no scroll.
- [ ] Scoring covers the bucket landing plus en-route bonus pickups, capped at `pointsMax`; pending points applied at the phase boundary like every other minigame.
- [ ] Host escape hatches: re-run the replay for the room, and skip a stuck turn.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
<filled at GATE 1 — not yet grilled; run plan-work on this ticket>

**Why `needs_prototype: true`.** This is the *logic* branch of the prototype skill, not the UI branch — the question is whether the sim is any fun to build for, and that only answers by driving it by hand:

1. Does a coarse placement grid with N pieces produce runs that are *readable* (the room can see why it failed) rather than arbitrary? If failure feels random, the game dies.
2. Piece set and count — what's the smallest set that still allows a clever solution.
3. One shot vs best-of-N. One shot maximizes tension; best-of-3 flattens it into a puzzle game. Leaning **two attempts, best score counts**.
4. Sim length: ~4s is the target watchable window. Longer and the room's attention breaks.

**Architecture decision to confirm at GATE 1 (leaning recorded, not settled).** Two shapes for getting the run onto the TV:

- **(a) Server emits a keyframe track, display replays it.** The pattern the codebase already trusts (drawing), unit-testable in Node without a browser. Cost: track weight in the snapshot (~5s × 30fps × a few bodies × 2 floats). Mitigation if heavy: 20fps + display-side interpolation, which will look identical on a TV.
- **(b) Ship only layout + seed; both sides run the identical sim.** Much smaller state, and sound in principle since plain IEEE-754 double arithmetic is fully specified — but only with the transcendental ban above holding forever.

**Leaning (a) for MVP**, with (b) as a later optimization if track weight actually bites. Needs a real byte count before committing.

**Prototype scope guardrail — the lab is NOT a minigame.** It must not create a package under
`packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, or touch either registry (authoring
guide §1: adding a `MinigameType` breaks every `Record<MinigameType, …>` in the repo until fully
wired — there is no throwaway half-state). The lab is a canvas over the integrator: no server, no
teams, no scoring, no phases. Note this is the skill's *logic* branch but must not be a TUI — "do
failures read as understandable" is a visual question. What survives here, unlike WN-14, is **a
module**: the integrator must be pure and portable because it ends up running inside the
server-side reducer, so write it as the real thing behind a throwaway harness. The plugin itself
gets built in this ticket's implement phase and iterated in `MinigameDevSandbox`.

Open scope questions for the grill: whether the room sees the plan before GO (invites backseat engineering from other teams — probably the best part, but it is a fairness call), and authored levels vs seeded procedural generation (leaning authored — tunable and solvable-by-construction).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Idea doc: [docs/minigames/ideas/contraption.md](../../docs/minigames/ideas/contraption.md). Roadmap: [docs/minigames/README.md](../../docs/minigames/README.md).
Patterns reused: [drawing-spec.md](../../docs/minigames/drawing-spec.md) (server records, display projects read-only), [geo-spec.md](../../docs/minigames/geo-spec.md) (content loading, phase-timer expiry precedent), [petmon-design.md](../../docs/petmon-design.md) (deterministic seeded reducers for testability/replay).
Sibling concept minted alongside this one: WN-14 (ANAMORPH). Independent — no dep edge.
