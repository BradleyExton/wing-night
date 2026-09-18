# Fappy Bird (FAPPY) Minigame Spec

Status: **Shipped** — `packages/minigames/fappy/`

Last updated: 2026-09-18

> **§0 is the build plan; §1–§3 are the reasoning it rests on.** Adding a `MinigameType`
> breaks every `Record<MinigameType, …>` in the repo until fully wired (authoring guide §1),
> so there is no useful half-state: the whole checklist lands in one change.

## 0) Build plan

### 0.1 What ships

One `MinigameRuntimePlugin` package, `@wingnight/minigames-fappy`, registered on server and
client like JOUST. A relay: the active team's players take the tablet in roster order, one
**leg** each, and fly their own cast bird (the `@wingnight/cast` hen wearing their head, in the
team colour and genre apparel) through a section of **gates** — a champ standing up from the
floor and one hanging from the ceiling, with a gap between. Tap anywhere to flap. A crash ends
the leg where it is; clearing the section ends it on a perch. The team scores the gates it
cleared across every leg.

No content file, no timer (host-paced like JOUST), no audio.

### 0.2 Order of work (each step ends with the gate green)

Gate for every step: `pnpm lint && pnpm typecheck && pnpm test`. Client, minigame `.tsx` and
`tests/e2e` changes also need
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` (CLAUDE.md).

1. **Prerequisite (shipped separately, 29473ed):** the cast lives in `packages/cast` so a
   minigame package can draw a player's bird.
2. **Shared sim.** `packages/shared/src/fappy/{types,world,simulate}` + `index.ts`, exported
   from `packages/shared/src/index.ts`. Pure, tick-stepped, seeded, and covered by a copy of
   JOUST's `noTranscendentals.test.ts` — three parties re-run this sim from the same inputs
   (§0.4) and must land on the same bits.
3. **Shared contracts.** `MINIGAME_DEFINITIONS.FAPPY` (`slug: "fappy"`, `timerKey: null`,
   `rulesKey: "fappy"`, `capabilityFlags: ["flap","endLeg","nextLeg","skipLeg","redoLeg",
   "resetTurn"]`). `FappyMinigameHostView` / `FappyMinigameDisplayView` in the room-state unions
   (§0.5).
4. **Engine plumbing (additive).** `MinigameRuntimeInitializationInput.playerIdsByTeamId` so a
   relay can name whose leg it is; the server fills it from `roomState.teams`. `players` and
   `teams` on both renderer prop types so a surface can draw the named player; the host shell,
   display shell and dev sandbox pass them. `MinigameDevManifest` carries a two-player-per-team
   fixture so every sandbox has a roster.
5. **Runtime package.** Scaffold from JOUST (closest sibling: rules-backed, host-paced, no
   timer). `src/runtime/{types,guards,rules,views}/index.ts` + `index.ts` + tests. No content
   adapter.
6. **Registries + config.** Both registries, `minigameBriefings` (+ `fappy-illustration.svg`),
   workspace deps, `content/sample/gameConfig.json` `minigameRules.fappy` defaults. **Not
   scheduled in a sample round** (song-guess precedent).
7. **Surfaces.** `HostFappySurface` (the flap canvas + deck) and `DisplayFappySurface` (the
   mirror + marquee), sharing one `FappyScene`. Copy in `copy.ts`, styles in `styles.ts`.
   `DESIGN.md` §2.9 paragraph in the same change.
8. **E2E.** `tests/e2e/fappy-sandbox.spec.ts` against `/dev/minigame/fappy`.
9. **Docs.** Flip this file to Shipped with an as-built list; README row.

### 0.3 Locked decisions

- **Name and id:** "Fappy Bird", `FAPPY`, slug `fappy`.
- **Relay by legs, roster order.** `legsPerTurn` legs per team, the same for every team
  regardless of size (SEAR's fairness stance); a short roster cycles, so on a three-player team
  the first player flies twice. Leg `k` belongs to `playerIds[k % playerIds.length]`; a team
  with no roster flies the drawn hen.
- **Crash ends the leg.** No lives, no respawn. Gates cleared so far are banked.
- **One point per gate**, `pointsPerGate` in rules, capped at `pointsMax` like every game.
- **Inputs, not positions, cross the wire.** Each flap is one action carrying its tick. The
  runtime holds a seed and the flap log; nobody streams bird positions.
- **Server is the referee.** On `endLeg` the server re-runs the sim from the log and computes
  the gates cleared itself. The tablet's own count is never sent.
- **The tablet is the game screen; the TV is a mirror ~100 ms behind.** No clock-sync
  protocol (JOUST and SEAR both chose this). The display runs the same sim from the flap log
  on a local clock that starts when the first flap arrives.
- **Sixty ticks a second, fixed step.** A flap logged at tick `T` applies to the step that
  produces `T + 1`, on every party.
- **Obstacles are champs, not pipes.** Drawn in JOUST's champ cyan so the room recognises
  them. Thrown shooters as moving hazards are a v2 layer, not in this build.
- **No mockup pass.** JOUST shipped without one; the surfaces reuse its marquee and deck
  language and the cast's own drawing. Noted here so the as-built list is honest.

### 0.4 Shared sim (`packages/shared/src/fappy`)

World is a fixed 160×90 box (JOUST's), y down, floor at 84, the bird's x pinned at 40. Gates
for a leg come from `resolveFappyGates({ seed, legIndex, gatesPerLeg })`: a mulberry32 stream
seeded from the leg, first gap centre uniform in `[gapCentreMin, gapCentreMax]`, each next
centre drifting at most `gapMaxDrift` so a section is flyable. `stepFappy(frame, gates,
gatesPerLeg, didFlap)` is the whole physics: gravity, flap sets `vy`, ceiling clamps, floor
kills, a gate kills when the bird's circle overlaps the champ column outside the gap, a gate
counts once its trailing edge is behind the bird. `advanceFappy` steps a frame to a tick
applying the logged flaps; `runFappyLeg` runs a log to its outcome under a tick cap.

### 0.5 View shapes

```ts
type FappyLegStatus = "ready" | "flying" | "landed";
type FappyLegOutcome = "cleared" | "crashed" | "skipped";

type FappyLegView = {
  legIndex: number;
  playerId: string | null;     // whose bird; null flies the drawn hen
  seed: number;
  status: FappyLegStatus;
  flapTicks: number[];         // the log; the display re-runs the sim from it
  gatesCleared: number;        // server-computed once landed
  endTick: number | null;      // server-computed once landed
  outcome: FappyLegOutcome | null;
};

type FappyMinigameViewFields = {
  minigame: "FAPPY";
  phase: "ready" | "flying" | "landed" | "done";
  legIndex: number;
  legsPerTurn: number;
  gatesPerLeg: number;
  pointsPerGate: number;
  legs: FappyLegView[];
  totalGatesCleared: number;
};
```

Nothing is secret, so host and display carry the same fields (JOUST precedent). The
answer-safety test asserts the display view is exactly the host view minus nothing extra.

### 0.6 Rules (`minigameRules.fappy`)

```json
{ "legsPerTurn": 4, "gatesPerLeg": 8, "pointsPerGate": 1 }
```

All positive integers, all optional, validated by `isRules` at config load. Defaults give
32 gates, so a perfect turn lands just over `finalRoundMax`.

### 0.7 Runtime state and reducer

State: `activeTurnTeamId`, `legsPerTurn`, `gatesPerLeg`, `pointsPerGate`, `legIndex`,
`legs[]` (fixed length, §0.5 shape), `turnStartPoints`, `pendingPointsByTeamId`. `phase` is
derived in the selectors, never stored: `done` when `legIndex === legsPerTurn`, else the
current leg's status. Seeds are hashed from the team id and leg index (FNV, like JOUST's shot
seed) so a reconnect re-derives the same course.

Actions (all `didMutate: false` outside their phase or on a malformed payload):

- `flap { tick }` — in `ready` or `flying`; `tick` a non-negative integer strictly greater
  than the last logged one. Appends; `ready` becomes `flying`.
- `endLeg` — in `flying`. Runs `runFappyLeg` on the log; stores `gatesCleared`, `endTick`,
  `outcome`; status `landed`; pending points = `turnStartPoints + pointsPerGate × total`,
  clamped at `pointsMax`. A tablet that mounts into `flying` with no local run dispatches this
  once (SEAR's `redoShot`-on-mount pattern), which settles the leg from the log.
- `nextLeg` — in `landed`. Advances `legIndex`; the next leg is `ready`.
- `skipLeg` — in `ready` or `flying`. Lands the leg as `skipped` with no gates and moves the
  relay on at once (one tap, like JOUST's `skipShot`); the slot is consumed so leg counts stay
  equal across teams.
- `redoLeg` — in `flying` or `landed`: resets that leg to `ready` with an empty log and
  recomputes pending points from the remaining landed legs.
- `resetTurn` — every leg back to `ready`, `legIndex` 0, pending points back to
  `turnStartPoints`.

Score override is the shell's generic pending-points hatch, as JOUST relies on.

### 0.8 Surfaces

Both draw one `FappyScene`: a 16:9 box letterboxed into its container with CSS container
units, a floor strip, the gate layer (every champ pair for the leg, translated by `scrollX`),
and the bird (a `<Character>` in a wrapper translated and tilted by `vy`). The scene is driven
imperatively from a `requestAnimationFrame` loop writing transforms to refs — React never
re-renders per frame, and the halo filter on a costume head is rasterised once and composited
(the spike measured no cost).

**Host.** JOUST's rail + arena + deck. The arena is the flap surface: `pointerdown` anywhere
flaps. `ready`: the bird hovers with a "tap to launch" hint and the player's name. `flying`:
the local sim runs; on a terminal frame the surface dispatches `endLeg`. `landed`: outcome
card with gates cleared, then **Pass the tablet** (`nextLeg`) naming the next player. Deck
rows: skip leg, redo leg, reset turn; leg chips; round totals.

**Display.** JOUST's marquee (team, "Fappy Bird", leg counter, pending points), the scene,
a status line. `flying`: `useFappyMirror` starts a local clock on the first flap's arrival and
renders `localTick − 6`, re-simulating from tick 0 whenever a flap arrives for a tick already
passed. `landed`: plays out to `endTick` and holds the pose; result plaque over the scene.

### 0.9 E2E (`tests/e2e/fappy-sandbox.spec.ts`)

Against `/dev/minigame/fappy`, no sockets: both previews draw the scene; a tap on the host
arena starts the leg and the display shows it flying; with no further taps the bird crashes,
the host shows the outcome card and enables **Pass the tablet**; clicking it advances the leg
counter on both previews; **Skip leg** consumes a leg; sandbox Reset restores leg 1.

### 0.10 As built (divergences from §0)

- **Physics constants** were retuned after the first sandbox flight: a flap lifts about a
  third of the gap (`flapVelocity: -1.6`, `gravity: 0.12`), the corridor scrolls at `0.95`
  units a tick with gates `66` apart, and the first gate stands at `150` so the player has
  about 1.75 s from the first tap to find the gap. All in `FAPPY_WORLD`; retune at a table.
- **`skipLeg` advances the relay itself** rather than leaving a landed leg for `nextLeg`.
- **The host's hint line** when the relay is over has its own copy, so the done note and the
  hint do not say the same sentence twice.
- **No mockup pass**, as §0.3 said; the surfaces are JOUST's chrome around the cast's drawing.
- **Not scheduled** in `content/sample/gameConfig.json`; its rules block is there with the
  §0.6 defaults. Schedule it via local config or `/admin`.

## 1) One-liner

Your team's chickens, wearing your faces, fly a relay through a corridor of champs. Tap to
flap, crash to pass the tablet, and the TV watches every leg.

## 2) Why this shape

- **The cast is the payoff.** Step 2 of the character system was "reuse the bird as a
  minigame target"; this makes the bird the thing you fly, and the head on it is whoever is
  holding the tablet.
- **Relay over one long run.** One player flying for two minutes is a spectator sport for
  one; four short legs pass the tablet and the tension around the table.
- **Crash ends the leg.** Lives mean respawn rules, invulnerability windows and a bigger
  state shape for very little extra fun; a crash *is* the handoff beat.
- **Inputs over positions.** A flap log is tiny, replays identically on three machines, and
  rehydrates a reconnect or an undo for free. Streaming positions would cost a whole room
  snapshot per frame.

## 3) Open for a v2

- Thrown shooters as moving hazards (the JOUST projectile crossing the corridor).
- A per-gate difficulty ramp across legs.
- Anthem sting on a cleared section.
