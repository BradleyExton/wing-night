---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-14
title: "ANAMORPH minigame: rotate a 3D point cloud until it snaps into a silhouette"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-07

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-16]            # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
needs_prototype: false   # the prototype is now its own ticket (WN-16), not an inline pipeline detour — see Plan
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Ship ANAMORPH as a minigame package: the TV renders a seeded 3D point cloud that resolves into a silhouette from exactly one viewing angle, and the active team hunts that angle with two dials on the tablet.

## Acceptance Criteria
- [ ] `packages/minigames/anamorph/` implements the `MinigameRuntimePlugin` contract (runtime + client + dev manifest), registered on both server and client like trivia/geo/drawing.
- [ ] Runtime state is seed-derived and tiny (`{ promptId, seed, currentYaw, currentPitch, lockedAngle }`) — no geometry crosses the wire; the point cloud is derived client-side from `(promptId, seed)` so a display refresh mid-turn rehydrates the identical frame.
- [ ] The hidden true angle never appears in `minigameDisplayView` **or** `minigameHostView` before lock-in (the active team holds the tablet — this is stricter than drawing's answer-safety, where the host is the drawer).
- [ ] Display surface is TV-only rendering at `100dvh` with no scroll; host surface is the two dials + LOCK IN (controller split per `docs/petmon-design.md`).
- [ ] Proximity scoring by angular error in configurable bands, mirroring geo's `scoreBandsKm` shape (ascending normalization, inclusive boundaries, malformed rules fall back to defaults, points capped at `pointsMax`), with `isRules` wired for load-time validation.
- [ ] Content loads via the standard local-overrides-sample pipeline (`content/local/minigames/anamorph.json` → `content/sample/minigames/anamorph.json`); sample content ships committable inline SVG path strings, no binary assets.
- [ ] Phase-timer expiry mid-turn is specified and covered (abandon-vs-score, following geo-spec §2's precedent).
- [ ] `prefers-reduced-motion` disables the idle tumble; the dial-driven rotation itself remains (it is user-initiated, not ambient — DESIGN.md §8).
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
<filled at GATE 1 — not yet grilled; run plan-work on this ticket>

**Why `needs_prototype: true`.** The ray-jitter constant is the entire game and cannot be settled on paper: too little and the silhouette is legible from every angle (trivial), too much and it never resolves (infuriating). The good band is narrow. The prototype must answer, in one throwaway lab:

1. The jitter magnitude, and the shape of the legibility curve as angular error → 0 (linear ramp vs late hard snap — the snap is more dramatic, the ramp gives the team something to hill-climb).
2. Whether the antipodal mirror image is an acceptable second solution (cheapest fix: score against whichever of the two angles is nearer).
3. Two dials vs drag-to-orbit on a sauce-covered tablet.
4. Whether the tablet needs its own small preview of the cloud, or TV-only holds up across a living room.

**Prototype scope guardrail — the lab is NOT a minigame.** It must not create a package under
`packages/minigames/`, add a `MINIGAME_DEFINITIONS` entry, or touch either registry. Adding a
`MinigameType` is a type-level fan-out (authoring guide §1: every `Record<MinigameType, …>` in the
repo stops compiling until fully wired), so there is no throwaway half-state — a contract-shaped
"prototype" is a full implementation you then have to unwind. The lab is a canvas, a point array
and two sliders: no server, no teams, no scoring, no phases, no content pipeline. What survives is
**numbers** (jitter constant, curve shape, dial idiom), not code. The real plugin gets built in this
ticket's implement phase and iterated in `MinigameDevSandbox` (`DEV_MINIGAME` route) — that sandbox
is the harness for implementation, not for this question, since it resolves by `MinigameType` and
so needs registration first.

Open scope questions for the grill (not prototype questions): prompts per turn, whether a naming bonus is host-judged via the existing manual-score escape hatch, and whether non-active teams can steal on a whiff (MVP leans active-team-only, consistent with the current loop).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Idea doc: [docs/minigames/ideas/anamorph.md](../../docs/minigames/ideas/anamorph.md). Roadmap: [docs/minigames/README.md](../../docs/minigames/README.md).
Patterns reused: [geo-spec.md](../../docs/minigames/geo-spec.md) (proximity score bands, `promptsPerTurn`, deterministic prompt cursor, content loading), [petmon-design.md](../../docs/petmon-design.md) (TV-renders / tablet-is-controller; seeded PRNG in state for deterministic replayable reducers), [drawing-spec.md](../../docs/minigames/drawing-spec.md) (read-only display projection).
Sibling concept minted alongside this one: WN-15 (CONTRAPTION). Independent — no dep edge.
