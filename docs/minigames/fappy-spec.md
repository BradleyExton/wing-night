# Fappy Bird (FAPPY) Minigame Spec

Status: **Shipped** — `packages/minigames/fappy/`

Last updated: 2026-09-23 (line-up pass, the balance pass, then the pressure pass)

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

No content file, no room timer (host-paced like JOUST; the relay clock is the game's own). The
TV carries the game's sound: a soundboard of synthesised cues, no audio files (§0.10).

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
- **Spit is a bump too.** A spitter's glob that lands is spent and shoves the bird down
  (`spitSplatVelocity`, harder than an eagle) towards the things that do kill; it never kills
  on its own. Same reasoning: the corridor stays kind, the hazard is in what it sets up.
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
  straight down to a tenth at `limitSeconds`. At the limit the relay ends; an unfinished
  team keeps that tenth scaled by the gates it got through.
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
- **Obstacles from the floor.** Every gate is a schlong standing on the sand — the cast's
  `resolveSchlongPaths` drawing, the same one JOUST fires, in one of three kinds the course
  deals (`champKind`: pink, ebony, ivory; a look, never a hitbox) — growing and shrinking on a
  bounded triangle-wave bob (the sim's `champTop` is the top of its head) with the shaft re-bent
  each frame so the tip sways and the middle lags, whipping in the wake of a bird gone past, and
  a face that watches the bird come; about two in five spit on a seeded beat
  (`spitPeriodTicks`/`spitPhaseTicks`), the head opening as the tell; about half the gates hang a
  bald eagle in the sky as the thing to duck under. Nothing hangs from the ceiling. The e2e autopilot reads the head's height off `data-champ-top`, which the loop
  writes every frame, never off the drawing.
  Thrown shooters as moving hazards are a v2 layer, not in this build.
- **No mockup pass.** JOUST shipped without one; the surfaces reuse its marquee and deck
  language and the cast's own drawing. Noted here so the as-built list is honest.

### 0.4 Shared sim (`packages/shared/src/fappy`)

World is a fixed 160×90 box (JOUST's), y down, floor at 84, the bird's x pinned at 40. Gates
for a leg come from `resolveFappyGates({ seed, legIndex, gatesPerLeg })`: a mulberry32 stream
seeded from the leg; each gate has a champ whose head rests at `champTop` and rises `champBob`
above it on a `champPeriodTicks` triangle wave (`resolveFappyChampTop`), a `champKind` dealt
from `champKinds`, with `spitterOdds` a spitting beat (`spitPeriodTicks` in
`[spitPeriodMin, spitPeriodMax]`, longer than `spitLifeTicks` so one glob is out at a time, and a
`spitPhaseTicks`), and with even odds an `eagleBottom` placed so the gap at the champ's full
stretch is at least `gapHeight`. `resolveFappySpit(gate, tick)` is the glob a champ has in the
air at a tick, or null: it leaves the mouth `spitMouthDepth` under the head on the beat, moves
`spitSpeedX` a tick towards the bird, rises at `spitRiseVelocity` and falls on `spitGravity`,
gone at `spitLifeTicks` or the sand — pure arithmetic in launch tick and age.
`stepFappy(frame, gates, gatesPerLeg, didFlap)` is the whole physics: gravity, flap sets `vy`,
ceiling clamps, the start cliff (to `startCliffEnd`) holds the bird up, floor kills, the
champ's head at this tick kills, an eagle kills, a gate counts once its trailing edge is
behind the bird, an eagle bumped is knocked away (`knockedEagles` on the frame, carried into
the next attempt's start with tick `-1`) and the bird shoved down `eagleBumpVelocity`, a glob
within `spitRadius + birdRadius` of the bird is a splat (`splats` on the frame, keyed by gate and
launch tick so it lands once; not carried across attempts) that shoves the bird down
`spitSplatVelocity`, and at
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
  elapsedMs: number | null;     // set once the relay is over; the SCORED time (wall + skip penalty)
  points: number | null;        // set once the relay is over
  pointsMax: number;            // what a finish at or under par pays, from initialize()
};
```

`pointsMax` is carried so a surface can run the runtime's own `resolveFinishPoints` forwards
(what a finish RIGHT NOW would pay) and `resolveTimeToBeat` backwards (the slowest finish that
still tops a rival) without inventing a score curve of its own — the maths is the runtime's, the
numbers are the server's, and AGENTS.md §6 still holds.

Nothing is secret, so host and display carry the same fields (JOUST precedent). The
answer-safety test asserts the display view is exactly the host view.

### 0.6 Rules (`minigameRules.fappy`)

```json
{ "legsPerTurn": 4, "gatesPerLeg": 6, "parSeconds": 50, "limitSeconds": 100 }
```

All positive integers, all optional, `parSeconds < limitSeconds`, validated by `isRules` at
config load. Measured on a greedy autopilot over the shared sim, a flawless six-gate leg takes
**8.8 s** (eight gates took 11.1 s, five 7.7 s) and each handoff costs a further **1.4 s** of
client-side beat that the relay clock is running through (`HANDOFF_BEAT_MS`, §0.10). So a
perfect four-leg relay is about **39 s** before a human reacts: par is a target a good team
reaches, not a floor everyone clears, and the limit leaves room for a crash or two a leg. These
are the sample's numbers; a pack whose teams are deeper carries its own `legsPerTurn` (the night
pack flies five legs of six with a 60 s par and a 110 s limit).

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
  the last leg it finishes the relay. The clock keeps running, and the relay is **charged
  `parSeconds / legsPerTurn` seconds for every skipped leg** — the time a leg of the course is
  worth. The penalty is added by `resolveSkipPenaltyMs` inside `resolveElapsedMs`, so the
  `elapsedMs` the scoring reads is the same one the deck and the TV show; it never feeds
  `isPastLimit`, which stays on the raw wall clock. A relay where nobody ever flapped still
  scores zero outright (`startedAtMs` is null), which is the older, stronger rule.
- `resetTurn` — every leg fresh, `legIndex` 0, clocks cleared, pending points back to
  `turnStartPoints`.

Scoring (`runtime/scoring`): `resolveFinishPoints(elapsedMs)` = `pointsMax` at or under par,
then linear down to `FAPPY_LIMIT_POINTS_SHARE × pointsMax` (a tenth) at the limit;
`resolveTimeoutPoints` = `0.1 × pointsMax × gatesCleared / gatesTotal`. The `elapsedMs` is the
penalised one above, not the raw wall clock. Added to `turnStartPoints`, clamped at
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
- **UX pass (same day, after Brad played it).** Three things: the handoff was a hard cut (the
  TV never even drew the landing — its mirror runs six ticks behind and the view moved on
  first), a crash was a hard cut too, and the assets were flat. So: two client-side beats
  the sim never sees — the handoff (`HANDOFF_BEAT_MS`, 1.4 s: land, squash, puff, the
  waiter hops, a callout names whose tablet it is, taps ignored, then the next leg slides
  in) and the crash (`CRASH_BEAT_MS`, 0.55 s: tumble, sink, puff, a shake, taps ignored).
  `useHeldLeg` keeps a cleared leg on screen for the beat (the TV adds
  `MIRROR_HOLD_SLACK_MS`), the runner and the mirror play the outcome they reach locally, and
  the mirror keeps its own copy of the flap log because the server wipes a crashed attempt's
  log the instant it respawns the bird. The mirror lets a flight the tablet has moved past
  finish before it switches (its loops are stopped on purpose, never by an effect cleanup —
  the first cut cancelled the replay the moment the respawn arrived). The hen's wing became a
  cast layer (`<CharacterWing>`, `wing="none"` on the figure) so it can beat per tap without
  repainting the costume head's halo; the wingbeat is read off `vy`. The scene grew a
  starfield, a sun, two parallax dune bands, lit champs, a feathered eagle whose wings beat
  on the shoulders, strata and tufts on the cliffs and a gold landing strip. The landing
  plateau widened from 44 to 56 units and the waiter moved from its middle to 78% of it,
  because two 16-unit birds could not stand on a 44-unit plateau without one drawn over the
  other; the waiter also steps towards the wall on its first hop when a landing comes down
  close (`BIRD_GAP_UNITS` in the scene). A slightly longer plateau is a slightly kinder
  landing, which is the direction to err in. The beats cost
  clock — about four seconds a relay of handoffs — so `parSeconds` may want a few seconds
  back at the table.
- **Not scheduled** in `content/sample/gameConfig.json`; its rules block is there with the
  §0.6 defaults. Schedule it via local config or `/admin`.
- **Line-up pass (2026-09-23).** Brad asked for variety, detail, more jiggle and something to
  dodge: "big black ones and white ones", veins, heads that open and spit. So the course deals
  each gate a `champKind` (pink half the time, ebony — bigger build — and ivory — slimmer — a
  quarter each; `CHAMP_LOOKS` in `FappyScene/champPaint`), the cast drawing grew veins
  (`resolveSchlongPaths().veins`, which SCHLONIC's badniks and springboards draw too, and
  SCHLONIC's badniks now come in the same three skins), a champ whips in the wake of a passing
  bird with its balls squashing along (`resolveWakeWobble`, client-only, read off the bird's
  position so a replay rings the same), and two in five champs spit on a seeded beat: the head
  is a hinged lid over a dark cavity through the windup (`resolveMouthOpen`, the tell), the
  glob is the sim's (`resolveFappySpit`) and a hit is a shove, not a crash, with goo on the
  bird's face for a second (`Goo`, `resolveGooOpacity`) and a kick on the scene. The scene
  file split for it: `champPaint` (the maths), `paintGate` (the per-gate attribute writes),
  the splat helpers in `pose`. Sample-fixture e2e was unchanged: the autopilot takes a splat
  as a shove and flies on.
- **Balance pass (2026-09-23).** A greedy autopilot over the shared sim put real numbers on the
  course for the first time: a flawless leg takes **11.1 s at eight gates, 8.8 s at six, 7.7 s at
  five**, and every handoff burns another **1.4 s** of `HANDOFF_BEAT_MS` with the relay clock
  running. Against the old `{ 4, 8, 45, 120 }` a perfect relay was **48.8 s before anybody
  reacted** — par was unreachable, so nobody was ever paid for flying well; and a 25 % share
  spread over a 75 s slide meant a four-second crash cost **under one point out of twenty**, so
  the clock the whole game is built on did not reach the board. Three fixes. (1) **A skipped leg
  now costs `parSeconds / legsPerTurn` seconds** (`resolveSkipPenaltyMs`, folded into
  `resolveElapsedMs`): the escape hatch used to be the fastest way through the course — one flap
  to start the clock, then skip everything and finish in twenty seconds for the whole round — and
  the only guard was the all-skipped-scores-zero rule, which one flap defeated. (2) **Defaults are
  `{ 4, 6, 50, 100 }`**, a perfect relay near 39 s, with `content/sample/gameConfig.json` and the
  briefing's `DEFAULT_FAPPY_GATES_PER_LEG` moved to match. (3) **`FAPPY_LIMIT_POINTS_SHARE` is
  0.1**, which makes that same four-second crash worth a visible point. The night pack got
  `{ 5, 6, 60, 110 }` separately: its teams are five deep and at four legs the fifth player never
  flew.

- **Sound (2026-09-23).** §0.1 said "no audio" and the corridor was silent. It now has a
  soundboard: `client/audio`, pure Web Audio — oscillators, one buffer of deterministic noise
  and gain envelopes, no assets, no dependency. Nine cues: `flap` (a 60 ms fwip, the quietest
  thing on the board bar the next one), `gateCleared` (a tiny blip, so thirty-two of them read
  as a rhythm picking up), `crash` (splat plus thud), `bump` (the eagle's shove and the glob's
  landing share a squelch), `handoff` (two bright notes), `finish` (an air horn), `timedOut`
  (three notes down), and the clock's `tick` once a second past par, replaced by a low
  double-thump `heartbeat` for the last 15 s that swells as the limit closes
  (`resolveClockCue`, `resolveHeartbeatGain`). **Display only** — the tablet sits on a table
  and the TV is the room's speaker. ONE module-level `AudioContext` for the package, resumed on
  every cue rather than made and closed per cue as `useTimesUpChime` does, because a game that
  flaps ten times a second would burn through contexts; nothing ever closes it. Every cue is
  best-effort: no `AudioContext`, or one the room has not unlocked with the display's
  `AudioUnlockOverlay` tap yet, is silence and a retry on the next cue, never an exception —
  which is also why a headless Playwright run is clean. The TV's master music volume is **not**
  applied: it lives in room state and reaches the display's `<audio>` element, while a minigame
  renderer's props carry no volume and reaching past them would break the minigame boundary, so
  the board runs at a fixed modest master gain instead. Wiring is one reader: `useFappyMirror`
  already steps every frame of the TV's replay, so it gained an additive `onEvent`, and
  `mirrorEvents` diffs two frames into what the room should hear (flaps come from the log, since
  a frame carries no record of one). `useFappySounds` maps those to cues and owns the phase,
  handoff and clock edges.

- **Pressure pass (2026-09-23).** The clock ran but the room could not price it. Six changes, all
  reading the runtime's own scoring maths rather than a second copy of it (`client/pressure`).
  (1) **The finish clock shows the SCORED time.** `useRelayClock` measures the wall between the
  server's stamps; `view.elapsedMs` carries the skip penalty and is what `resolveFinishPoints` was
  handed. Once the phase is `finished`/`timedOut` both the host's FinishCard and the TV's
  ResultPlaque read the view, and when the two differ by more than a second they say why
  ("+0:12 for 1 skipped leg") — a host who watched 0:38 run past was otherwise left to guess why it
  paid like 0:50. (2) **`pointsMax` rides in the view** (§0.5), stored on `FappyRuntimeState` at
  `initialize`. (3) **Points draining live**: what a finish on this tick would pay, big on the TV
  marquee and in a chip next to the host's relay clock — the round's max with `par 0:50` under it
  while par holds, then heat-coloured and dropping a point at a time. It charges legs already
  skipped, so the escape hatch's cost lands the moment it is taken. (4) **Time to beat**:
  `resolveTimeToBeat` inverts the slide (unit-tested against `resolveFinishPoints` itself, with a
  bounded walk over the rounding boundary that floating point otherwise decides by its last bit) to
  the slowest finish that still tops the best rival in `pendingPointsByTeamId` — the one field that
  survives the per-turn re-initialisation, which is why points and not times are what get inverted.
  The tablet names the rival (`teamNameByTeamId`); the TV says "to take the lead", because
  `MinigameDisplayRendererProps` carries only `activeTeamName`. Null when topping them needs better
  than par, and then the instruction is "beat par". (5) **The pace strip** (`PaceTrack`) under the
  TV's line-up: a bar spanning 0 to the limit with a tick at par, the flyer's own head placed by
  course cleared and a faint drawn hen placed by the clock — both running at the par tick, because a
  par-pace relay finishes exactly there — so ahead-or-behind is which face is in front rather than a
  subtraction. Past par the ghost parks and the bar beyond it fills heat toward the limit. One
  bird-head tall (~30px at 1080p) so the letterboxed corridor keeps its height. (6) The sandbox's
  dev manifest banks one rival 9 points, because a fixture with a zeroed board has no target to draw.

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
- A ready countdown or a "go" cue for the player who just took the tablet, if the room wants
  one; today their first tap is the go.
- Anthem sting on a cleared relay.
