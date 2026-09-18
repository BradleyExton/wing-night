# Contraption Minigame Spec

Status: **Shipped** — `packages/minigames/contraption/`

Last updated: 2026-09-16

## 0) What shipped, and the calls that were open until it did

The idea doc (now retired) left five questions open. This is how each landed.

- **Host-paced, no timer.** `timerKey: null`, like SONG_GUESS. Build → GO →
  watch → next attempt → the host advances the phase. A build timer would have
  added a required field to every `gameConfig.json` in the repo for a game whose
  drama is the commit point, not a clock.
- **Two attempts, best score counts** (`minigameRules.contraption.attemptsPerTurn`,
  default 2). The physics lab settled *why* it has to be a rebuild: re-running the
  same layout under a new seed produces the same run to within 1e-4 — the
  integrator is damped, not chaotic — so a second go is only worth anything if
  the team moves a piece. The pieces therefore stay on the field between attempts.
- **Authored levels, each shipping a known-good solution.** Content pack
  `minigames/contraption.json`, `{ prompts: [levels] }` so it inherits
  `validatePromptPackFile` and `createPromptContentAdapter` like every other
  bank. Every level carries a `solution`, and `runtime/index.test.ts` reads the
  sample pack from disk and proves each solution still lands, touches every piece
  it spends, and settles inside the 4s watchable window. An unsolvable level fails
  the gate, not the party.
- **The room sees the plan.** Pieces appear on the TV as the team places them.
  Backseat engineering from the other teams is the best part; every team in a
  round plays the same level, so it is also fair.
- **Seated, back-turned thrower.** The Sidestage direction from the UI lab, re-cut
  as decided: the thrower sits at a table well above the field, facing away, and
  tosses the wing backward over their shoulder. To make that a real arc rather
  than a scripted one, `CircleBody` gained an optional `initialVelocity`; each
  level declares `wing.velocity`. The thrower's shoulder is drawn on the wing's
  start point so the release reads as a hand-off.

Also settled from the labs and carried into the shipped game: the **drumette**
projectile (no angular state needed), the **Trail** readability aid on the TV, the
**miss beat** (a cleaner walks on and takes the wing away), and **server-side
simulation with a keyframe-track replay** — the display never predicts.

## 1) Goals

- A hard commit point followed by pure spectator physics — the one emotional
  shape no other game in the roster has.
- Server authoritative for the layout, the run, and the score.
- Deterministic: a display refresh mid-run replays the identical track.
- Coarse enough to be playable with sauce on your fingers.

## 2) Rules

- The active team places up to `pieceBudget` pieces on a **10×10 grid** over the
  100-unit field, one piece per cell. Five kinds: `shelf`, `slope-right`,
  `slope-left`, `steep-right`, `steep-left` — each a single straight segment
  inside its cell.
- **GO** simulates on the server (240Hz Verlet, 30Hz track, 5s) and grades:
  - `pointsLanded` if the wing settles inside the bucket mouth;
  - plus each pickup's `points` if the wing's centre passed within 4 units of it;
  - capped at the round's `pointsMax` when applied to pending points.
- Outcomes, in the room's terms: `landed`, `short`, `long`, `perched`, `restless`.
- `attemptsPerTurn` goes; pending points = the team's baseline + their **best**
  run. Applied at the phase boundary like every minigame.
- Escape hatches: `replayRun` re-plays the track for the room; `clearPieces`
  wipes the field; the host shell's normal phase advance skips a stuck turn.

## 3) Content

`content/sample/minigames/contraption.json` ships three levels — *Over the
Shoulder* (2 pieces), *The Ledge* (3 pieces, a fixed obstacle), *Boomerang*
(2 pieces, the bucket behind the thrower). Level shape:

```json
{
  "id": "over-the-shoulder",
  "title": "Over the Shoulder",
  "wing": { "x": 8, "y": 14, "velocity": { "x": 34, "y": -26 } },
  "bucket": { "x": 68, "width": 16, "height": 14 },
  "obstacles": [],
  "pickups": [{ "id": "mid-air", "x": 50, "y": 65, "points": 2 }],
  "pieceBudget": 2,
  "pointsLanded": 5,
  "solution": [
    { "kind": "slope-right", "column": 3, "row": 6 },
    { "kind": "slope-right", "column": 5, "row": 7 }
  ]
}
```

- Field is 100×100 units; floor at y=98, walls at x=2 and x=98; gravity 180.
- `wing` is the start and the throw. `bucket.x` is its left edge; it stands on
  the floor. `obstacles` are fixed segments. `solution` must fit the budget and
  use no cell twice.
- Rules: `minigameRules.contraption` accepts `attemptsPerTurn` (positive
  integer) and `levelId` (pins a level; default is the first in the pack).
- Finding a solution for a new level: search placements against the real
  integrator (`gradeAttempt` in `runtime/grading`) — the sample levels were
  found that way. Keep only solutions whose `contactedPieceIds` cover every piece.

## 4) Runtime contract

State: `{ levelId, attemptsPerTurn, attemptsUsed, phase: building | ran | done,
pieces, run, bestPoints, pendingPointsBaseline, pendingPointsByTeamId }`.

Actions (bare names, `minigame:action` envelope):

| action | payload | valid when |
|---|---|---|
| `placePiece` | `{ kind, column, row }` | building; swaps kind on a taken cell, refuses past the budget |
| `removePiece` | `{ column, row }` | building |
| `clearPieces` | — | building, field non-empty |
| `runContraption` | — | building, attempts left |
| `replayRun` | — | a run exists (any phase) |
| `nextAttempt` | — | ran → building (pieces kept) or done |

The run stored in state is `{ attemptNumber, track: { keyframeHz, positions:
[x0, y0, x1, y1, …] }, outcome, settleSeconds, collectedPickupIds, points,
replayToken }` — about 1.6 KB per run at 2dp.

## 5) Projections

Host and display views carry the same fields: the level (without its
`solution`), the pieces, the attempt counters, and the run. There is no
answer to hide from the room — the thing to hide is the solution, and the
active team holds the tablet, so it is dropped from **both** views at
`toLevelView`. Tests pin `"solution"` absent from both serialised views.

## 6) Surfaces

- **Host** (`HostContraptionSurface`): mini-rail; square field editor (grid,
  tap-to-place, tap-again-to-remove, the same replay the TV shows once a run
  exists); build deck with level card, five-piece palette, Clear, GO; after a
  run, the verdict card, *Replay for the room*, *Next attempt* / *Finish turn*;
  running totals.
- **Display** (`DisplayContraptionSurface`): the Sidestage stage — table, seated
  thrower, the field one-to-one at 4.4px/unit — with the plan live while
  building, then flight with trail → verdict plaque → (on a miss) the cleaner.
  Playback is a pure function of elapsed time (`runSequence`), restarted by a
  new attempt or the replay token.
- **Reduced motion:** the replay always plays. It is the game, a discrete,
  host-triggered event, not ambient decoration — DESIGN.md §8's infinite-animation
  rule does not apply, and nobody should "fix" it.

## 7) Verification

- `packages/minigames/contraption` — 64 tests: geometry, grading determinism
  (byte-identical), reducer rules, best-of-N, cap, projections, sample-level
  solvability, dev-manifest mirror, surface rendering.
- `packages/shared/src/content/contraption` — schema validation.
- `tests/e2e/contraption-sandbox.spec.ts` — build, mirror, GO, verdict on the
  TV, rebuild, best-run retention, reset, through `/dev/minigame/contraption`.
