---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-15
title: "CONTRAPTION minigame: build a physics contraption on the tablet, watch the run on the TV"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-18, WN-24]     # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
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

### Prototype findings — WN-18 lab driven 2026-08-15

Driven at `/dev/lab/contraption` against the WN-17 integrator. **Q1 is answered; Q2/Q3/Q4 are
deliberately NOT, and must be re-driven after the friction fix (see below) — every preset was
search-found against physics that is about to change, so any answer taken now would be void.**

**Q1 — failure readability: ship `Trail`.** Graded on a real miss (6-piece set, attempt 3,
`MISSED — settled past the bucket`, 2.58s) at 0.5× playback:

| Aid level | Does the miss read? |
| --- | --- |
| Trail + contacts | Yes, completely — path plus the exact ramp that over-kicked it |
| **Trail** | **Yes — trail kinks imply the contacts; the arc over the bucket is plain** |
| Bare | Only if watching the exact instant; the settled frame explains nothing |

`Trail` is the minimum level that still carries the *why*, which is the bar the lab sets. Bare fails
it: after settle it is just a wing on the floor, and half the room is eating.

**Architecture — decision (a), settled, not leaning.** WN-17 measured the keyframe track at
**8,610 B @30fps / 5,770 B @20fps** (JSON, 6 bodies, whole ~4s run). The lab's own telemetry
corroborates at real piece counts: **1,571 B** (2 and 4 pieces) and **1,655 B** (6 pieces) per run.
Track weight is a non-issue at any piece count, so option (a) — server emits the track, display
replays it, mirroring drawing — wins outright. Option (b) is struck as an unnecessary optimization
that would have bound us to the transcendental ban forever.

**Blocking finding — the integrator cannot slide, and it decides the piece question.**
`resolveSegmentContacts/index.ts:88` multiplies tangential velocity by `slip` (0.86) on **every
integration step in sustained contact**, not per impact. A body resting on a ramp is in contact at
all 240 steps/s, and `0.86^240` is effectively zero — so the wing creeps to a dead stop instead of
sliding. Every route is therefore free-fall plus glancing deflections. Combined with the existing
segments-only contact model (circles pass through each other), the entire buildable vocabulary is
*drop, bounce, deflect* — no slides, no knock-on chains.

This is why Q2 could not be answered: the lab's sets **nest** (four = two + 2, six = four + 2) and
every added ramp is a near-bucket deflector, so the runs barely differ —

| Set | Settle | Track bytes | Miss from centre |
| --- | --- | --- | --- |
| 2 pieces | 1.27s | 1,571 | 6.40 |
| 4 pieces | 1.27s | 1,571 | 5.20 |
| 6 pieces | 1.23s | 1,655 | 5.08 |

— byte-identical track from 2 → 4 pieces. There is not enough physics for a sixth piece to be
clever with, so a piece count chosen now would be measuring the defect, not the game.

**Decision (2026-08-15): fix friction in the WN-17 module BEFORE WN-15 is scoped** — see WN-23.
The alternative considered and rejected was constraining the offered ramp angles so a shelf can
never be built; rejected because it locks the game to pachinko and does not restore the
ramp-and-track vocabulary the pitch rests on. The failure mode being bought off: a team places a
shallow ramp expecting a slide, the wing dies on it, and that reads as a bug rather than a wrong
decision — precisely the arbitrary-failure outcome this ticket says kills the game.

**Lab defect noted in passing (dies with the lab in this ticket, no action):** the `pieceSets`
docstring claims `contraptionLabCopy.creepNote` surfaces the creep caveat to the room, but
`creepNote` does not exist in `copy.ts` — flagged by qa-reviewer at WN-18 review and still dangling,
so nobody driving the lab learns why the routes look ballistic.

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
