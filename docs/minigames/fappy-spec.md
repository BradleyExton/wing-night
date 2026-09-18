# Fappy Bird (FAPPY) Minigame Spec

Status: **Shipped** — `packages/minigames/fappy/`

Last updated: 2026-09-18

> **§0 is the build plan; §1–§3 are the reasoning it rests on.** Adding a `MinigameType`
> breaks every `Record<MinigameType, …>` in the repo until fully wired (authoring guide §1),
> so there is no useful half-state: the whole checklist lands in one change.

## 0) Build plan

### 0.1 What ships

One `MinigameRuntimePlugin` package, `@wingnight/minigames-fappy`, registered on server and
client like JOUST. A timed relay: the active team's players take the tablet in roster order,
one **leg** each, and fly their own cast bird (the `@wingnight/cast` hen wearing their head,
in the team colour and genre apparel) through a section of **gates** — a champ standing up
from the floor, bobbing, with sometimes an eagle hanging in the sky above. Each leg takes off
from a cliff and ends on another, where the next player's bird stands waiting: tap anywhere
to flap, come down on that plateau and the tablet changes hands. A crash sends the bird back
to the perch of the last gate it cleared. One clock runs from the first tap to the last
landing, handoffs included, and the team's points come from that time.

No content file, no room timer (host-paced like JOUST; the relay clock is the game's own),
no audio.

### 0.2 Order of work (each step ends with the gate green)

Gate for every step: `pnpm lint && pnpm typecheck && pnpm test`. Client, minigame `.tsx` and
`tests/e2e` changes also need
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` (CLAUDE.md).

1. **Prerequisite (shipped separately, 29473ed):** the cast lives in `packages/cast` so a
   minigame package can draw a player's bird.
2. **Engine plumbing (additive).** `receivedAtMs` on the action envelope, stamped by
   `dispatchMinigameAction` (the SEAR plan's step 1, landed here first) and by the sandbox.
   `MinigameRuntimeInitializationInput.playerIdsByTeamId` so a relay can name whose leg it
   is; the server fills it from `roomState.teams`. `players` and `teams` on both renderer prop
   types so a surface can draw the named player; the host shell, display shell and dev
   sandbox pass them. `MinigameDevManifest` carries a two-player-per-team fixture.
3. **Shared sim.** `packages/shared/src/fappy/{types,world,simulate}` + `index.ts`, exported
   from `packages/shared/src/index.ts`. Pure, tick-stepped, seeded, and covered by a copy of
   JOUST's `noTranscendentals.test.ts` — three parties re-run this sim from the same inputs
   (§0.4) and must land on the same bits.
4. **Shared contracts.** `MINIGAME_DEFINITIONS.FAPPY` (`slug: "fappy"`, `timerKey: null`,
   `rulesKey: "fappy"`, `capabilityFlags: ["flap","endLeg","timeOut","skipLeg","resetTurn"]`).
   `FappyMinigameHostView` / `FappyMinigameDisplayView` in the room-state unions (§0.5).
5. **Runtime package.** Scaffold from JOUST (closest sibling: rules-backed, host-paced).
   `src/runtime/{types,guards,rules,scoring,views}/index.ts` + `index.ts` + tests. No content
   adapter.
6. **Registries + config.** Both registries, `minigameBriefings` (+ `fappy-illustration.svg`),
   workspace deps, `content/sample/gameConfig.json` `minigameRules.fappy` defaults. **Not
   scheduled in a sample round** (song-guess precedent).
7. **Surfaces.** `HostFappySurface` (the flap canvas + deck) and `DisplayFappySurface` (the
   mirror + marquee), sharing one `FappyScene`, one `useRelayClock`. Copy in `copy.ts`, styles
   in `styles.ts`. `DESIGN.md` §2.9 paragraph in the same change.
8. **E2E.** `tests/e2e/fappy-sandbox.spec.ts` against `/dev/minigame/fappy`.
9. **Docs.** Flip this file to Shipped with an as-built list; README row.

### 0.3 Locked decisions

- **Name and id:** "Fappy Bird", `FAPPY`, slug `fappy`.
- **Fixed course, must finish.** `legsPerTurn` legs of `gatesPerLeg` gates, the same for
  every team regardless of size (SEAR's fairness stance); a short roster cycles. Leg `k`
  belongs to `playerIds[k % playerIds.length]`; a team with no roster flies the drawn hen.
- **A crash costs time, never points.** The bird respawns on the perch of the last gate it
  cleared in that leg, hovering, waiting for a tap. The clock does not stop.
- **Eagles are a bump, not a crash.** Hitting one knocks it out of the sky for the rest of the
  leg (every later attempt too) and shoves the bird down. Only the champs, the sand and the
  cliffs kill. Brad's call, to make the corridor kinder.
- **Landing is the handoff.** A leg is cleared by coming down on the landing cliff's
  plateau, not by passing its last gate. The next player's bird stands in the middle of that
  plateau facing the flyer; on the last leg a flag stands there instead. Into the cliff's
  face, or into the rock wall that closes the sky past the plateau, is a crash like any
  other. The start cliff is solid ground: a hop that comes down before the drop just lands.
- **One relay clock, handoffs included.** It starts on the relay's first flap and stops on
  the last landing. There is no pass button and no banner: a cleared leg makes the next leg
  `ready`, its bird already on its own start cliff, and the next player's first tap flies
  it. The handoff is the race.
- **Points from time.** Every point the round offers at or under `parSeconds`, sliding
  straight down to a quarter at `limitSeconds`. At the limit the relay ends; an unfinished
  team keeps that quarter scaled by the gates it got through.
- **Inputs, not positions, cross the wire.** Each flap is one action carrying its tick. The
  runtime holds a seed, a checkpoint and the flap log per attempt; nobody streams bird
  positions.
- **Server is the referee, and the clock.** On `endLeg` the server re-runs the attempt from
  its checkpoint and decides cleared or crashed itself. Time comes from `receivedAtMs`, the
  server's wall clock at receipt; the tablet's clock only decides when to *ask* for a
  timeout, and the server checks that against its own.
- **The tablet is the game screen; the TV is a mirror ~100 ms behind.** No clock-sync
  protocol (JOUST and SEAR both chose this). The display runs the same sim from the flap log
  on a local clock that starts when the first flap arrives, and renders the relay clock from
  the server's start stamp against its own wall clock.
- **Sixty ticks a second, fixed step.** A flap logged at tick `T` applies to the step that
  produces `T + 1`, on every party.
- **Obstacles from the floor.** Every gate is a JOUST champ standing on the sand, growing
  and shrinking on a bounded triangle-wave bob with its head wiggling; about half the gates
  hang a bald eagle in the sky as the thing to duck under. Nothing hangs from the ceiling.
  Thrown shooters as moving hazards are a v2 layer, not in this build.
- **No mockup pass.** JOUST shipped without one; the surfaces reuse its marquee and deck
  language and the cast's own drawing. Noted here so the as-built list is honest.

### 0.4 Shared sim (`packages/shared/src/fappy`)

World is a fixed 160×90 box (JOUST's), y down, floor at 84, the bird's x pinned at 40. Gates
for a leg come from `resolveFappyGates({ seed, legIndex, gatesPerLeg })`: a mulberry32 stream
seeded from the leg; each gate has a champ whose head rests at `champTop` and rises `champBob`
above it on a `champPeriodTicks` triangle wave (`resolveFappyChampTop`), and with even odds an
`eagleBottom` placed so the gap at the champ's full stretch is at least `gapHeight`.
`stepFappy(frame, gates, gatesPerLeg, didFlap)` is the whole physics: gravity, flap sets `vy`,
ceiling clamps, the start cliff (to `startCliffEnd`) holds the bird up, floor kills, the
champ's head at this tick kills, an eagle kills, a gate counts once its trailing edge is
behind the bird, an eagle bumped is knocked away (`knockedEagles` on the frame, carried into
the next attempt's start with tick `-1`) and the bird shoved down `eagleBumpVelocity`, and at
the landing cliff (`resolveFappyLandingX`, `landingCliffGap` past the
last gate) the face below `cliffTop` kills, the wall past `landingZoneWidth` kills, and coming
below `cliffTop` over the plateau ends the leg `cleared`. `createFappyLegStart(gates,
checkpointGate)` starts an attempt standing on the start cliff, or on the perch of gate
`checkpointGate − 1` (`resolveFappyPerchY`, the middle of that gate's gap at full stretch)
with the count intact. `advanceFappy` steps a frame to a tick
applying the logged flaps; `runFappyLeg(course, log, checkpoint)` runs an attempt to its
outcome under a tick cap.

### 0.5 View shapes

```ts
type FappyLegStatus = "ready" | "flying" | "cleared";
type FappyPhase = "ready" | "flying" | "finished" | "timedOut";

type FappyMinigameLeg = {
  legIndex: number;
  playerId: string | null;      // whose bird; null flies the drawn hen
  seed: number;
  status: FappyLegStatus;
  attempt: number;              // 0, then +1 per crash; keys the surfaces' local runs
  checkpointGate: number;       // how many gates the attempt starts behind
  flapTicks: number[];          // this attempt's log; the display re-runs the sim from it
  crashes: number;
  skipped: boolean;
  knockedEagles: number[];      // gates whose eagle is gone for the rest of the leg
  lastRun: { endTick; gatesCleared; outcome: "cleared" | "crashed" } | null;
};

type FappyMinigameViewFields = {
  minigame: "FAPPY";
  phase: FappyPhase;
  legIndex: number;
  legsPerTurn: number;
  gatesPerLeg: number;
  parSeconds: number;
  limitSeconds: number;
  legs: FappyMinigameLeg[];
  totalGatesCleared: number;    // cleared legs count every gate; the leg in hand its checkpoint
  startedAtMs: number | null;   // server wall clock
  finishedAtMs: number | null;
  timedOutAtMs: number | null;
  elapsedMs: number | null;     // set once the relay is over
  points: number | null;        // set once the relay is over
};
```

Nothing is secret, so host and display carry the same fields (JOUST precedent). The
answer-safety test asserts the display view is exactly the host view.

### 0.6 Rules (`minigameRules.fappy`)

```json
{ "legsPerTurn": 4, "gatesPerLeg": 8, "parSeconds": 45, "limitSeconds": 120 }
```

All positive integers, all optional, `parSeconds < limitSeconds`, validated by `isRules` at
config load. Eight gates is about ten seconds of clean flying, so a clean relay with quick
handoffs beats par and a couple of crashes a leg still finishes inside the limit.

### 0.7 Runtime state and reducer

State: the rules, `activeTurnTeamId`, `legIndex`, `legs[]` (§0.5 shape), `startedAtMs`,
`finishedAtMs`, `timedOutAtMs`, `turnStartPoints`, `pendingPointsByTeamId`. `phase` is
derived in the selectors, never stored. Seeds are hashed from the team id and leg index (FNV,
like JOUST's shot seed) so a reconnect re-derives the same course.

Every action needs `envelope.receivedAtMs`; one without it is refused. All are
`didMutate: false` outside their phase or on a malformed payload.

- `flap { tick }` — in `ready` or `flying`; `tick` a non-negative integer strictly greater
  than the last logged one. Sets `startedAtMs` if unset (the relay's first flap), appends,
  `ready` becomes `flying`. Past the limit it times the relay out instead.
- `endLeg` — in `flying`. Runs `runFappyLeg` on the attempt from its checkpoint. Cleared:
  the leg is `cleared`; the next leg becomes the leg in hand, or the last gate sets
  `finishedAtMs` and scores the relay. Crashed: `attempt + 1`, `checkpointGate` raised to the
  gates the run got past, log cleared, `crashes + 1`, status `ready`. A crash past the limit
  times the relay out. A tablet that mounts into `flying` with no local run dispatches this
  once (SEAR's `redoShot`-on-mount pattern), which settles the attempt from the log.
- `timeOut` — in `ready` or `flying`, only when `receivedAtMs − startedAtMs ≥ limit` on the
  server's clock. Sets `timedOutAtMs` and scores by progress.
- `skipLeg` — in `ready` or `flying`. Marks the leg `cleared` and `skipped` and moves on; on
  the last leg it finishes the relay. The clock keeps running.
- `resetTurn` — every leg fresh, `legIndex` 0, clocks cleared, pending points back to
  `turnStartPoints`.

Scoring (`runtime/scoring`): `resolveFinishPoints(elapsedMs)` = `pointsMax` at or under par,
then linear down to `0.25 × pointsMax` at the limit; `resolveTimeoutPoints` =
`0.25 × pointsMax × gatesCleared / gatesTotal`. Added to `turnStartPoints`, clamped at
`pointsMax` like every game. Score override is the shell's pending-points hatch, as JOUST
relies on.

### 0.8 Surfaces

Both draw one `FappyScene`: a 16:9 box letterboxed into its container with CSS container
units, a floor line, the gate layer (both cliffs and the rock wall, every champ and eagle for
the leg, translated by `scrollX`, each champ's shaft and head moved to its bob for the frame),
the bird (a `<Character>` in a wrapper translated and tilted by `vy`) and the waiting bird
(the next leg's player, flipped to face the flyer, placed on the plateau in world units each
frame; a finish flag on the last leg). The scene is driven imperatively
from a `requestAnimationFrame` loop writing attributes and transforms to refs — React never
re-renders per frame.

**Host.** JOUST's rail + arena + deck, with the relay clock on the rail (`useRelayClock`:
the server's start stamp against `Date.now()`, a tenth of a second at a time). The arena is
the flap surface: `pointerdown` anywhere flaps. `ready`: the bird on its cliff or its perch,
a hint naming who to land next to, a respawn hint after a crash.
`flying`: the local sim runs; on a terminal frame the surface dispatches `endLeg`. When the
local clock passes the limit the surface dispatches `timeOut` once. Deck: leg card (player,
gates, crashes), finish card (time or progress, points), skip leg, reset turn, leg chips,
totals.

**Display.** JOUST's marquee (team, "Fappy Bird", leg, gates, the clock), the scene, a
status line naming the flyer and who they must land next to. `useFappyMirror` runs the
attempt from its log on a local clock that starts on the first flap's arrival, six ticks
behind. The plaque drops with the time and the points when the relay is through, or the
progress when the limit caught the team.

### 0.9 E2E (`tests/e2e/fappy-sandbox.spec.ts`)

Against `/dev/minigame/fappy`, no sockets: both previews draw the course; a tap on the host
arena starts the clock and the display shows the bird flying towards the waiting bird; with
no further taps the bird falls off the start cliff and the same player is back on it with a
crash on the board; **Skip leg** hands the tablet on and the last leg's cliff carries the
finish flag; skipping the last leg finishes the relay with a plaque; sandbox Reset restores
leg 1 and the idle clock.

### 0.10 As built

- **First cut (c772d2f) was a distance game**: crash ended the leg, a pass button, one point
  per gate. Brad played it and re-pitched it the same day as a race — the team has to get
  through, the handoff is the tension, the clock is the score — which is the shape above.
- **Physics constants** were tuned once from a sandbox flight: a flap lifts about a third
  of the gap (`flapVelocity: -1.6`, `gravity: 0.12`), the corridor scrolls at `0.95` units a
  tick with gates `66` apart, the first gate at `150`. All in `FAPPY_WORLD`; retune at a table.
- **Eagles became a bump on the third play**: hitting one knocks it away instead of crashing.
- **Cliffs came in on the second play.** Brad's note: the handoff should not pause on a
  banner; the flyer should have to land where the next bird is waiting. So the leg ends on
  the landing plateau, the waiter stands in its middle, and the banners went.
- **The dev sandbox** runs two legs of three gates with a 20 s par and a 60 s limit, so the
  slide and the timeout can be seen without waiting two real minutes.
- **No mockup pass**, as §0.3 said; the surfaces are JOUST's chrome around the cast's drawing.
- **Not scheduled** in `content/sample/gameConfig.json`; its rules block is there with the
  §0.6 defaults. Schedule it via local config or `/admin`.

## 1) One-liner

Your team's chickens, wearing your faces, race a relay through a corridor of bobbing champs
and hanging eagles against one clock. Tap to flap, crash and go again, hand it on fast.

## 2) Why this shape

- **The cast is the payoff.** Step 2 of the character system was "reuse the bird as a
  minigame target"; this makes the bird the thing you fly, and the head on it is whoever is
  holding the tablet.
- **Everyone finishes.** A distance game lets a bad leg score nothing and end early; a race
  with checkpoints means every player gets through their section and the only question is
  how long the team took. Nobody sits out their own leg.
- **The handoff is the game.** No pass button and no pause: the moment a section clears, the
  next player's first tap is the next leg, and the clock is counting the fumble.
- **Time, not lives.** Lives mean respawn rules, invulnerability windows and a bigger state
  shape for very little extra fun; a crash that costs seconds is its own punishment.
- **Inputs over positions.** A flap log is tiny, replays identically on three machines, and
  rehydrates a reconnect or a reset for free. Streaming positions would cost a whole room
  snapshot per frame.

## 3) Open for a v2

- Thrown shooters as moving hazards (the JOUST projectile crossing the corridor).
- Eagles that swoop rather than hover.
- A landing that has to be soft: too fast onto the plateau and the bird bounces.
- Anthem sting on a cleared relay.
