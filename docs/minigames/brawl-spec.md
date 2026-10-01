# Streets of Barrie (BRAWL) Minigame Spec

Status: **Shipped** — `packages/minigames/brawl/`

Last updated: 2026-10-01 (as built: the sim's tuning, both surfaces, the beats and the sound; the TV's camera and the spawn lead)

> **§0 is the build plan; §1–§3 are the reasoning it rests on.** Adding a `MinigameType`
> breaks every `Record<MinigameType, …>` in the repo until fully wired (authoring guide §1),
> so there is no useful half-state: the whole checklist lands in one change.

## 0) Build plan

### 0.1 What ships

One `MinigameRuntimePlugin` package, `@wingnight/minigames-brawl`, registered on server and
client like SCHLONIC. A side-scrolling beat 'em up relay: the active team's players take the
tablet in roster order, one **block** each, and walk their own cast bird (the `@wingnight/cast`
hen wearing their head, in the team colour and genre silhouette) down a Barrie street that is
owned by geese. Left thumb walks, right thumb pecks. Goons step in from both edges of the
screen in waves; the camera locks until the wave is down, then the **GO ▶** arrow flashes and the
hen walks on. The last wave of a block ends at the handoff, where the next teammate's bird is
waiting and the tablet changes hands. Three hearts; out of hearts and the geese carry the hen off
to Kempenfelt Bay, and the next teammate starts the next block. The team's points are the worth
of every goon it put down against the worth of the whole course.

No content file (the course is seeded from the rules), no room timer (host-paced like SCHLONIC;
the block has its own tick cap, and it is the game's, not the room's). The TV carries the game's
sound through `@wingnight/audio` (§0.10).

### 0.2 Order of work (each step ends with the gate green)

Gate for every step: `pnpm lint && pnpm typecheck && pnpm test`. Client, minigame `.tsx` and
`tests/e2e` changes also need
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` (CLAUDE.md).
Steps 1–8 are all done (§0.11 lists where the build moved off the plan).

1. **Shared sim.** `packages/shared/src/brawl/{types,world,simulate}` + `index.ts`, exported
   from `packages/shared/src/index.ts`. Pure, tick-stepped, seeded, and covered by a copy of
   SCHLONIC's `noTranscendentals.test.ts`: three parties re-run this sim from the same inputs
   (§0.4) and must land on the same bits. `types.ts` is the contract and is written first.
2. **Cast poses.** `peck`, `hurt` and `ko` on the hen rig in `packages/cast` (§0.8). A new
   motion is a new pose in the cast, never a sprite or a private redraw.
3. **Shared contracts.** `MINIGAME_DEFINITIONS.BRAWL` (`slug: "brawl"`,
   `displayName: "Streets of Barrie"`, `timerKey: null`, `rulesKey: "brawl"`).
   `BrawlMinigameHostView` / `BrawlMinigameDisplayView` in the room-state unions (§0.5).
4. **Runtime package.** Scaffold from SCHLONIC (closest sibling: rules-backed, host-paced,
   relay of legs, input log refereed by re-running the sim).
   `src/runtime/{types,guards,rules,scoring,views}/index.ts` + `index.ts` + tests.
5. **Registries + config.** Both registries, `minigameBriefings` (+ `brawl-illustration.svg`),
   workspace deps, `content/sample/gameConfig.json` `minigameRules.brawl` defaults. **Not
   scheduled in a sample round** (FAPPY precedent; round 1 is an e2e fixture).
6. **Surfaces.** `HostBrawlSurface` (the street canvas with the two thumb zones) and
   `DisplayBrawlSurface` (the mirror + marquee), sharing one `BrawlScene`. Copy in `copy.ts`,
   styles in `styles.ts`. `DESIGN.md` §2.14 paragraph in the same change.
7. **E2E.** `tests/e2e/brawl-sandbox.spec.ts` against `/dev/minigame/brawl`.
8. **Docs.** Flip this file to Shipped with an as-built list; README row.

### 0.3 Locked decisions

- **Name and id:** "Streets of Barrie", `BRAWL`, slug `brawl`. One name (authoring guide §1).
- **Fixed course, a block each.** `blocksPerTurn` blocks (default 3), the same for every team
  regardless of size; a short roster cycles. Block `k` belongs to `playerIds[k % playerIds.length]`.
  Block `k` is harder than block `k − 1`: more goons, more at once, a raccoon from block 1 and
  the boss goose closing every block from index 2 on (block 3 of a default turn).
- **Two thumbs, no aim.** The arena is the controller. The left ~35% of the body is the walk
  pad: hold it to walk, the side of the pad's centre you are on is the direction, slide across
  the centre to turn. The rest is the peck zone: any tap pecks. No jump, no block, no combos.
  Facing follows the last walk direction, never the peck — a goon behind you needs a step
  back, which is the beat 'em up's own "BEHIND YOU".
- **Three hearts, then the bay.** A hit costs a heart, knocks the hen back, reels her for
  a few ticks and shuts any peck she had out, then she is invulnerable for a short window. Out of hearts, the block ends
  `ko`: the geese carry her off (the wipeout punchline). What she put down stays banked.
- **The camera locks per wave.** Classic shape: goons in, camera held, wave down, GO ▶,
  walk on. The hen cannot leave the window the camera frames, and neither can a goon that has
  stepped in. Between waves the camera follows her once she is past 40% of the window, so
  there is more street ahead of her than behind. The block ends `cleared` when
  the last wave is down and the hen reaches `handoffX`.
- **A block has a tick cap** (`blockTicks`, default 75 s). Reaching it ends the block
  `timeout` with what was banked. Nothing auto-advances the phase: the host still ends the
  turn.
- **Worth, not count.** Goose 1, gull 1, raccoon 2, boss 4. Points are the team's worth down
  over the course's total worth (34 on the default seed and three blocks), times the round's
  max, rounded. Near misses are built in (§1).
- **No ghost.** A brawl has nothing to race. The round remembers the best turn's worth and
  name instead, and both surfaces show it as the number to beat.
- **Escape hatches:** `skipBlock` (banks nothing, moves on) and `resetTurn` (back to block
  one, hands back exactly the turn's points), the SCHLONIC pair.
- **The TV sees more street.** The tablet's camera is the sim's 160×90 box. The TV draws a
  wider window on the same `cameraX` (a `fill` camera with `split: true`, `BrawlScene/camera`):
  the extra width is split either side of the tablet's window, not laid all on the right. Goons
  step in `BRAWL_WORLD.spawnLead` past the tablet's edges, so a goon is on the wall before it is
  on the tablet from either side. That is the room's job (§3).

### 0.4 The sim (`packages/shared/src/brawl`)

`types.ts` is already written and is the contract; it does not change without changing this
section. Public API, exported from `packages/shared/src/brawl/index.ts` and re-exported from
`packages/shared/src/index.ts`:

```ts
export const BRAWL_WORLD: {
  width: 160; height: 90;            // the tablet's camera box, world units
  groundY: number;                   // the line every foot stands on
  tickHz: 60;
  blockTicks: number;                // the cap, 75 s × 60
  henRadius: number;                 // half the hen's box width
  henHeight: number;                 // the peck's box and a goon's attack are this tall
  henStartX: number;                 // where she stands on the line
  spawnLead: number;                 // how far past the tablet's edge a goon is born (30)
  henWalkSpeed: number;              // units per tick
  henMargin: number;                 // how close to the camera's edges the hen may stand
  peckDelayTicks, peckActiveTicks, peckCooldownTicks: number;
  peckReach: number;                 // how far in front of the hen a peck lands
  hurtTicks, invulnerableTicks: number;
  hitKnockback: number;              // units the hen is shoved per hit
  heartsMax: 3;
  koFallTicks: number;               // how long a goon lies there before `gone`
  cameraUnlockSpeed: number;         // how fast the camera follows the hen between waves
  cameraLeadShare: number;           // she is followed once past this share of the window (0.4)
  goonSpacing: number;               // walkers queue this far apart rather than stack
  gullCruiseY, gullClimb, gullDiveGravity: number;   // the gull's height and its parabola
  goons: Record<BrawlGoonKind, {
    hp: number; worth: number; halfWidth: number; height: number;
    speed: number; reach: number;
    telegraphTicks: number; attackTicks: number; recoverTicks: number; stunTicks: number;
    knockback: number;               // how far a peck shoves it
    lunge: number;                   // units a tick through its attack
  }>;
};

export const resolveBrawlBlock = (course: BrawlCourse) => BrawlBlock;
export const resolveBrawlCourseTotal = (course: { seed: number; blocks: number }) => number; // sum of goonsTotal
export const resolveBrawlGoonBox = (kind: BrawlGoonKind) => { halfWidth: number; height: number };
export const resolveBrawlTickCap = () => number;

export const createBrawlRunStart = (block: BrawlBlock) => BrawlFrame;
export const createBrawlRunSkip = (block: BrawlBlock) => BrawlFrame;   // on the line, outcome "timeout", nothing banked
export const stepBrawl = (frame: BrawlFrame, block: BrawlBlock, inputs: readonly BrawlInput[]) => BrawlFrame; // one tick
export const advanceBrawl = (frame, block, inputs, toTick: number) => BrawlFrame;   // steps until toTick or a terminal frame
export const runBrawlRun = (course: BrawlCourse, inputs: readonly BrawlInput[]) => BrawlRun;  // the referee: whole block from the top
```

Rules the sim keeps:

- **Deterministic.** Integer-friendly arithmetic; no `Math.random`, no transcendental or
  implementation-defined `Math` member (`noTranscendentals.test.ts` copied from SCHLONIC and
  scanning this module). The gull's dive is a parabola by `vy += g`, never a sine.
- **Inputs are a log, not a state.** `stepBrawl` reads every input whose `tick` equals the
  frame's tick (there may be several) and applies them before moving: a `walk` sets
  `walking`, a `peck` opens a peck if the cooldown allows and the hen is not reeling. The
  log is non-decreasing in `tick`; a frame never looks backwards through it.
- **Goon script**, per tick, in `BRAWL_WORLD.goons[kind]` numbers: `entering` is born
  `spawnLead` (30) plus its own half-width past the tablet's edge on its `side` and walks in at
  `speed` until it is inside the window (about a second of goose walk, `createGoon`/`enterGoon`
  in `simulate/`; the walk-in cannot be pecked); `approach` walks toward the hen; within
  `reach` it goes `telegraph` for `telegraphTicks` (the honk — it stands still and the room
  sees it coming), then `attack` for `attackTicks` (its own box hurts the
  hen on overlap if she is not invulnerable), then `recover` for `recoverTicks`, then
  `approach` again. A peck that lands takes one hp, shoves it `knockback` away from the hen
  and puts it in `stunned` for `stunTicks` (it cannot attack); at nought hp it goes `ko`
  (`koTick` set, `goonsDown += worth`, tick pushed on `kos`) and after `koFallTicks` it is
  `gone` and dropped from `goons`. The **gull** arrives in the air and swoops: its `y` is a
  dive toward the hen's height and back up, and it is only in a peck's box while low; it
  hurts on the way through. The **raccoon** has 2 hp and its attack is a charge: it moves at
  twice its walking speed through `attackTicks` (`lunge` 1.2 against `speed` 0.6). The **boss**
  is a goose with 4 hp, twice a goose's reach and a quicker shrug (a peck stuns it 12 ticks, not
  24), and it is `worth` 4. Every kind lunges: an attack only hurts by the goon's own box
  overlapping hers, so it has to travel from `reach` away, through her, and out the other side.
  Walkers queue `goonSpacing` behind the nearest one on their side of her rather than stacking,
  so the TV reads each one and a beak meets them in turn.
- **Waves.** The block opens on wave 0 with `cameraX = waves[0].lockX` and `cameraLocked`.
  A wave's spawns step in at `atTick` after the wave opened; `BrawlFrame.waveOpenedTick` is
  the tick the camera locked on the wave in hand, and nothing else in the frame remembers it. The wave is down when every
  one of its spawns has stepped in and gone (`ko` counts as down; `gone` just tidies). Then
  `cameraLocked` is false and the camera follows the hen rightward (never left, and only once
  she is past `cameraLeadShare` of the window) at up to `cameraUnlockSpeed` until its left edge
  reaches the next wave's `lockX`, where it locks and the next wave opens. After the last wave, the camera follows until `handoffX` is in
  frame; the hen reaching `handoffX` is `cleared`.
- **The hen** walks at `henWalkSpeed` while `walking ≠ 0` and not reeling, clamped to
  `[cameraX + henMargin, cameraX + width − henMargin]`. A peck opens `peckDelayTicks` after
  the press and stays live for `peckActiveTicks`. **Its box runs from her back edge to
  `peckReach` past her front, her height tall**: a peck is the whole bird jabbing, so a goon
  lunging into her back while the beak is out meets it, which is the one way a mashing hen
  answers "BEHIND YOU". The nearest standing goon it overlaps per peck is hit (one peck, one
  goon); a goon still walking in from off the tablet's frame (`entering`) cannot be pecked.
  A hit on her: `hearts −= 1`, shoved `hitKnockback` away from the goon, `hurtUntilTick`,
  `invulnerableUntilTick`, **a peck already out is shut** (`peckUntilTick` clamped to the hit's
  tick), tick pushed on `hits`. At nought hearts the frame is terminal
  with `outcome: "ko"`. `tick ≥ blockTicks` is terminal with `outcome: "timeout"`.
- **Layout from the seed.** `resolveBrawlBlock` seeds
  `createMulberry32((seed ^ Math.imul(block + 1, 0x9e3779b9)) | 0)`, a different stream per
  block, so block 2 is the same street on a three-block course and a five-block one. **The mix
  is a rule and only the order is dealt**: gull and raccoon counts are fixed per wave, never
  rolled, and the seed picks their slots, so no seed hands one team a sky of gulls in the easy
  block. Block 0 is two waves, 3 geese and then 4 with 1 gull. Block 1 is 4 with 1 gull and
  then 5 with 1 gull and 1 raccoon. Block 2 and every block past it is three waves: 4 with
  1 gull and 1 raccoon, 5 with 2 gulls and 1 raccoon, then 2 with 1 gull and **the boss**,
  one more goose a wave for every block beyond 2. Spawn sides alternate from a seeded start,
  and from the third goon on one in four keeps the side of the one before, so no wave arrives
  from one side only. A wave's first goon steps in 45 ticks after it opens and the rest are
  spread over about four seconds, jittered, never two on the same tick; **the boss steps in
  120 ticks after the last of its escort**. `length` is `(waves + 1) × width`; `lockX` of
  wave `i` is `i × width`; `handoffX = length − henMargin × 3`. The sandbox manifest and the
  sample rules both use `courseSeed: 20261001`, which deals 7, 10 and 17 worth for blocks 0,
  1 and 2.

### 0.5 Views and actions

Mirrors SCHLONIC's shapes. `BrawlPlayerFigure` is `SchlonicPlayerFigure`'s twin (playerId,
name, avatarSrc, teamId, genre). Nothing about a block is secret, so host and display views
carry the same fields:

```ts
type BrawlBlockStatus = "ready" | "running" | "done";
type BrawlPhase = "ready" | "running" | "finished";
type BrawlBlockResult = { outcome: BrawlOutcome; endTick: number; goons: number; hearts: number };
type BrawlMinigameBlock = {
  blockIndex: number; player: BrawlPlayerFigure | null; status: BrawlBlockStatus;
  inputs: BrawlInput[]; skipped: boolean; result: BrawlBlockResult | null;
};
type BrawlBestTurn = { teamId: string | null; teamName: string | null; goons: number };
type BrawlMinigameViewFields = {
  minigame: "BRAWL"; phase: BrawlPhase; blockIndex: number; blocksPerTurn: number;
  courseSeed: number; blocks: BrawlMinigameBlock[];
  goonsDown: number;      // banked over the turn so far
  goonsTotal: number;     // the course's whole worth
  points: number | null;  // once finished
  bestTurn: BrawlBestTurn | null;
};
```

Actions (bare names, `transientActionTypes: ["walk", "peck"]`): `walk` `{ tick, dir }`,
`peck` `{ tick }`, `endBlock` `{}`, `skipBlock` `{}`, `resetTurn` `{}`. The reducer refuses a
`walk`/`peck` whose tick is below the log's last tick, and `endBlock` re-runs the log with
`runBrawlRun({ seed, blocks: blocksPerTurn, block: blockIndex }, inputs)` — the only reading
that scores. Rules (`minigameRules.brawl`, every field optional, positive integers):
`blocksPerTurn` (3), `courseSeed` (20261001). Round memory: `{ bestTurn }`, the finished turn
with the most worth down, from any team before this one.

### 0.6 The host surface

A `<TakeoverCanvas>` (the body's meaning is spread evenly: a street). `rail` and `clock`
forwarded untouched; BRAWL is `timerKey: null`, so `clock` is empty. The three slots, as built:

- `counter`, read-only in the chrome row: "Block 1 of 3" with the block's player under it;
  **hearts** as three glyphs (`data-brawl-hearts`), lit and dimmed by the paint loop; **the
  worth down** over the course total, "12 / 34 Down" (`data-brawl-goons`), written by the same
  loop; and the number to beat with the team that set it, when there is one. Hearts and worth
  are the two numbers the chrome carries, and they are the two the thumbs are playing for.
  The hearts leave the row once the team is through.
- `actions`, floating bottom-left: Skip block and Reset turn (SCHLONIC's pair; solo there is
  nobody to skip for, so Skip goes and Reset reads Restart), then the one hint line. Skip is
  disabled through the handoff: the street still shows the block just ended, and a tap there
  would skip the NEXT player's block before they held the tablet. The hint says whose block it
  is and where the thumbs go while the block is ready ("Caitlin is on the line — hold left to
  walk, tap right to peck"), and says nothing while a block runs or a beat plays: a brawling
  hen's holder is not reading.
- `readout`, floating bottom-right above the dock, **only while a block's ending is on screen
  or once the team is through**, because the right of the street is where goons walk in from:
  the finish card ("Street clear", the points), the block list (`BlockHistory`: who fought
  each block and how it ended, the block in hand lit) and `RunningTotals` with "Full points
  at 34 down" under it.

The body is `[data-brawl-arena]` (`HostBrawlSurface/Street`): the scene SVG full-bleed, and
over it two pointer zones that take `touch-action: none` and track pointers by id, so a held
walk and a tapped peck coexist. The walk pad is the left 35% (`[data-brawl-walk-pad]`); a held
thumb walks toward the side of the pad's centre it is on, and keeps walking if it slides off
the pad's edge (pointer capture). The peck zone is the rest (`[data-brawl-peck-zone]`) and any
tap pecks. Each shows a ghosted glyph (◀ ▶, a PECK ring) that fades after the first touch of
the block. The peck zone stops 5.5rem short of the arena's bottom edge, so a mashed peck never
lands on the corner dock; nothing in the arena reaches the bottom-right corner. The arena
dims to 80% when it is not armed (a hold, a finished team, a tablet that may not act) and
ignores both zones. The handoff callout ("Hand it to *name*") drops over the street for the
beat, client-only.

`useBrawlRunner` is `useSchlonicRunner`'s twin: a fixed-step sim on the local clock, painted
every animation frame through a `BrawlSceneHandle`, the clock started by the first touch of
either thumb, inputs logged at the tick they land on (a walk that stays on one side logs
nothing) and each sent as one action, `endBlock` when the local sim reaches an outcome, then a
beat (`cleared` / `ko` / `timeout`) held before the next block is drawn. The server's echo
never drives the loop. A hit pauses the clock `HIT_PAUSE_MS` and shakes the scene. The hearts
and the worth down are written by the same paint loop, not by React: the tally is the turn's
banked worth plus the block's live count, so it climbs as the goons fall. Poses are mounted
once and switched, and the goon layer re-renders only when a goon's drawing frame or state
changes (about four times a second), never per tick.

### 0.7 The display surface

As built. `DisplayBrawlSurface` is the house `<NeonMarquee>` (`clock` and `clockLine` seated,
the game name as kicker) over the street, with a status line under the stage (DESIGN.md §2.2D).
The marquee's readout (`MarqueeReadout`) is the block ("Block 1 of 3 · Caitlin"), the hearts
(`data-brawl-hearts`), the worth down over the course ("12 / 34 Down", `data-brawl-goons`) and,
once the round has one, the number to beat with the team that set it. The hearts and the tally
are written by the mirror's paint loop, not by React, and they are the replay's: the view only
banks a block once the server has refereed it, and the room is watching it now. Once the team
is through, the marquee carries the turn's final tally and the street holds on the last block
under a `<ResultPlaque>` ("Street clear", "N of M down", the points), `silent` because the
board has just rung the last beat. `RunningTotals` is never on the TV mid-turn; standings are
the results screens' job. `requiresDisplayAudio: true`; the TV is the speaker (§0.10).

**The street.** The same `BrawlScene` through `TV_CAMERA_FIT` (`BrawlScene/camera`), a `fill`
camera with `split: true`: the window is the sim's 160×90 box widened to the arena's aspect
(about 186–200 units wide on the arena as measured, never narrower than 160), and the extra is
split either side of the tablet's window, so a goon is on the wall before it is on the tablet
from the left as much as from the right. It is wider than the tablet on both sides, which is
what makes the room the lookout (§3).

**`useBrawlMirror`** is `useSchlonicMirror`'s twin: it re-runs the tablet's block from the
view's input log on a local clock `MIRROR_DELAY_TICKS` (6, a tenth of a second) behind, which
starts with the first thumb. It only rebuilds from the top when an input lands on a tick it has
already drawn (`isLogAppendedFrom`); an input for a tick it has not reached just joins the log.
It finishes the block it has before drawing the one the tablet is on, plays the ending beat, and
a wall that missed a block (a reload) takes the referee's reading of it (`runBrawlRun`) and its
ending; under reduced motion it draws that reading without the fighting. A hit pauses the
mirror's clock `HIT_PAUSE_MS` and shakes the scene, as the tablet does. Its loops live on refs
and are stopped on purpose, never by an effect's cleanup, so a block the tablet has already
moved past still plays out.

**The hold.** `useHeldBlock` (shared with the host surface) keeps the ended block on screen for
its beat while the view's cursor has already moved on; the wall adds `MIRROR_HOLD_SLACK_MS`
(700) because its replay runs behind. The hold is worked out during the render that sees the
cursor move, not in an effect: an effect committed one frame on the next block with no hold,
which remounted the street on both surfaces and replayed the ended block's slide-in under its
beat.

**The wave meter** (`WaveMeter`, `waveMeter/`): a strip over the sky, one pip per goon in the
current wave, scaled by worth (a raccoon's pip is heavier, the boss's heaviest), each waiting
(not on the street yet), in, or down, and **GO ▶** in the strip when the wave is down and the
camera has let go (the scene's own arrow still flashes at the street's edge). React draws every wave's pips once per block and the mirror's paint loop
picks the wave and lights them, so the strip costs nothing per frame. It hides during a hold
and once the team is finished: the beat has the room's eyes.

**The beat callout** (`BeatCallout`) is driven by the hold, not by the mirror's beat event, so
it appears under reduced motion and in `renderToStaticMarkup` tests alike. It hangs low over
the pavement on a dark pool, under the hen's feet, so no beat covers her: the handoff reads
"Hand it to *name*", the bay "Into the bay!" (with who takes the tablet a size down) and the
bell "Time!"; a cleared last block reads "Last block / Street clear!"; a skipped block shows
only who is next.

Beats (client-only holds, FAPPY's convention): **GO ▶** whenever the camera is unlocked and the
block is live, a flashing arrow at the right edge of whatever window the surface draws, the
camera already following the hen under it. It shows after the last wave too, because the
handoff is off the tablet's right edge; **handoff** on `cleared` (the hen walks up to the next
teammate waiting past `handoffX` and the tablet changes hands, 2 s); **the bay** on `ko` (the
geese lift the hen off the top of the frame, a splash sound, 2.4 s); **bell** on `timeout` (a
boxing bell, the hen slumps, 1.6 s). A hit's hit-pause is 120 ms; the GO constant is 1.2 s
(`beats/`). Every beat ends on the hen, never a hard cut (principles §7, §9).

**Sound.** `useBrawlSounds` hangs the whole board off the display. Every event the mirror reads
off its replay (`mirrorEvents/`: `peck`, `land`, `honk`, `boss`, `hurt`, `ko`, `go`) is its own
cue; a `honk` sounds at `BRAWL_HONK_GOON_INTENSITY` for a goose-sized goon and at 1 for the
boss; and the start of each ending beat fires its own cue (`handoff`, `bay`, `bell`). The
`boss` event fires when the boss steps in, once a block. The handler's identity is stable for
the life of the surface, because the mirror's loop closes over it.

### 0.8 The scene (`BrawlScene`)

One component, both surfaces, imperative handle like SCHLONIC's:

```ts
type BrawlSceneHandle = {
  paint: (frame: BrawlFrame) => void;
  paintCleared: (frame: BrawlFrame, progress: number) => void;
  paintKo: (frame: BrawlFrame, progress: number) => void;
  paintTimeout: (frame: BrawlFrame, progress: number) => void;
  shake: () => void;
};
```

Props: `block`, `hen` (the player's figure resolved to a cast appearance by
`resolveHenFigure`, SCHLONIC's `resolveRunnerFigure`), `sceneId`, `label`, `cameraFit`, `relay`
(the last and next teammates' figures, stood at the start line and the handoff). The hen is
`<CharacterFigure>` under a transform, pose by frame: reeling wins over everything (`hurt`),
then `peck` from the press until the beak's box closes, then `walk` while the thumb is down,
`idle` standing, and `ko` on the KO beat. Her foot is the cast's `CHARACTER_FOOT` on the
ground line and the figure is scaled so foot-to-head-middle is the sim's `henHeight`; she
flickers through the invulnerable window so the room sees the mercy. Goons are bare `<g>`
components under `BrawlScene/Goons/{Goose,Gull,Raccoon,Boss}` with a `state` prop; a KO'd
goon falls with stars; a telegraphing one is drawn honking. `data-brawl-*` attributes on the
scene (camera x, wave, locked), the hen (`data-brawl-x`, `data-brawl-pecking`), each goon
(`data-brawl-goon-kind`, `data-brawl-goon-state`), the GO arrow (`data-brawl-go`), the handoff
and the hearts, for the e2e spec. Backdrop from `@wingnight/scenery` in a night palette:
block 0 is Dunlop Street (Souldiers, Storefronts, the Queen's), block 1 the waterfront
(WaterfrontCondos, the bay), block 2 Centennial Beach ending at the SpiritCatcher. Blocks beyond
repeat block 2. The palette is `--bn-*` custom properties set on the scene's root and handed to
the scenery as `var(--bn-…)` (`BrawlScene/palette.ts`), because the scenery takes its colours as
presentation attributes and a class cannot reach one; no hex lives in the scene's code.

### 0.9 Sandbox and e2e

`createDevManifest({ rules: { blocksPerTurn: 2, courseSeed: 20261001 }, content: null })`.
`tests/e2e/brawl-sandbox.spec.ts`: both previews draw the block (scene count 2, goons by kind
present after the first wave opens, hearts at 3, "Block 1 of 2" and the ready hint visible),
the first peck-zone tap logs a peck and the hen's `data-brawl-pecking` flips, a held walk-pad
pointer moves the hen's `data-brawl-x`, and no socket request leaves the sandbox.
The TV's half of the asymmetry is asserted too: for a goon from each side the wall's scene has it
on the street before the tablet's does (§3).

### 0.10 Sound

`packages/minigames/brawl/src/client/audio/index.ts`: a `createBrawlSoundboard` cue table on
`@wingnight/audio` — `peck`, `land` (a peck connecting), `honk` (telegraph), `hurt`, `ko`
(a goon down), `go`, `handoff`, `bay` (the splash), `bell`, `boss`. Synthesised voices with
`BRAWL_CUE_MIN_GAP_MS` per cue (60 ms for `peck` up to 2.5 s for `boss`, so a mashed zone is a
run of ticks and a beat told twice sounds once) and `BRAWL_MASTER_GAIN` 0.25. `honk` takes an
`intensity` for the goose's heft: `BRAWL_HONK_GOON_INTENSITY` (0.3) for a goose, 1 for the
boss, so the boss honks lower and longer. Recorded takes from `assets/sfx/brawl/<cue>-N.mp3`
(`BRAWL_SFX_FOLDER`) replace a cue's synthesis once they exist; none are recorded yet. Played
by the display through `useGameSoundboard`; the tablet is silent unless `solo`.

### 0.11 As built

What the code does where the plan above was written before it. Sections 0.3 to 0.8 were edited
in place to match; this is the list of the decisions that moved.

- **Sim: `waveOpenedTick`.** `BrawlFrame` gained it. A spawn's `atTick` counts from the tick
  the wave opened, and nothing else in the frame remembered that.
- **Sim: the peck is the whole bird.** The first cut's box ran only `peckReach` in front of her.
  A mashing hen could not answer "BEHIND YOU", and a masher cleared block 0 on 13% of seeds.
  The box now runs from her back edge to `peckReach` past her front, and the same masher clears
  it on 66%. Goons still walking in from off the tablet's frame cannot be pecked.
- **Sim: a hit shuts a peck already out**, so a beak in flight does not land from the floor.
- **Sim: goons stay inside the locked window**, and the camera follows the hen once she is past
  40% of it (`cameraLeadShare`), never left.
- **Sim: counts are fixed per wave, not rolled.** Gull and raccoon counts are a table in
  `world/` (block 0: 0 then 1 gull; block 1: 1 gull, then 1 gull and 1 raccoon; block 2 and
  on: 1 gull and 1 raccoon, 2 gulls and 1 raccoon, 1 gull and the boss), and the seed only
  deals the order. The boss closes every block from index 2 on, 120 ticks after the last of its
  escort, and each block is seeded `seed ^ imul(block + 1, 0x9e3779b9)`.
- **Sim: `spawnLead`.** A goon is born `spawnLead` (30) plus its half-width past the tablet's
  edge and walks in (`createGoon`), where the first cut put it half a body past the edge. With
  the TV's window wider only on the right, the wall saw a right-side goon about 42 ms before the
  tablet and a left-side one 108 ms *after* it, so the room was the lookout from one side only.
  Both halves of the fix landed together: the lead, and the split camera below.
- **Display: the TV's camera is split.** `TV_CAMERA_FIT` is `fill` with `split: true`, so the
  window's extra width goes half to each side of the tablet's box instead of all to the right.
  It resolves to about 186–200 units wide at the arena's aspect (a 200.83-wide window starts
  at x −20.42 in `camera/index.test.ts`).
- **Display: the mirror, callouts, wave meter and status line** are specified in §0.7. In short:
  `useBrawlMirror` runs `MIRROR_DELAY_TICKS` (6) behind and rebuilds from the top only when an
  input lands on a tick it has already drawn; `useHeldBlock` works the hold out during render
  (`MIRROR_HOLD_SLACK_MS` 700 on the wall); the beat callout is driven by the hold, so it works
  under reduced motion and in static-markup tests, and sits low over the pavement so it never
  covers the hen; the wave meter hides during holds and when finished; the finish is a
  `ResultPlaque`; `RunningTotals` is never on the TV mid-turn.
- **Sim: `lunge`.** Every goon moves `lunge` units a tick through its attack, because an
  attack only hurts by overlapping her and has to travel through her to do it. That is what
  makes a goon behind a mashing hen end up in front of her beak, a heart later. The raccoon's
  charge is its `lunge` at twice its walking speed.
- **Balance, pinned in `simulate/index.test.ts`.** A masher (holds right, pecks every ten
  ticks) gets wave 0 of block 0 down inside twenty seconds and loses at least two hearts on block
  2 of the default seed. A brawler bot (turns to the nearest goon, pecks in reach) clears all
  three blocks. The rest is pinned over 200 seeds ("does let a masher through most block 0
  streets and almost no block 2 streets"), not the default seed's luck: block 0 cleared on at
  least 55% with fewer than 2.5 hearts left on average, block 2 on at most 10%. As measured
  after `spawnLead`, the masher clears block 0 on 133 of 200 seeds (66%, 1.5 hearts left on
  average), block 1 on 68 (34%) and block 2 on 8 (4%), nearly always on her last heart. The
  levers are the peck's rhythm and the goons' lunge; retune `BRAWL_WORLD` at a table.
- **Tuned numbers**, from `BRAWL_WORLD` (ticks at 60 Hz, units in the 160×90 box):

  | Kind | hp | worth | half-width × height | speed | reach | telegraph | attack | recover | stun | knockback | lunge |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | goose | 1 | 1 | 5×14 | 0.5 | 14 | 30 | 16 | 30 | 24 | 8 | 2 |
  | gull | 1 | 1 | 5×8 | 0.7 | 24 | 24 | 40 | 30 | 20 | 6 | 1.2 |
  | raccoon | 2 | 2 | 6×10 | 0.6 | 32 | 36 | 36 | 40 | 24 | 10 | 1.2 |
  | boss | 4 | 4 | 8×22 | 0.45 | 28 | 36 | 20 | 40 | 12 | 5 | 2.4 |

  A goon's box is the half-width either side of its x. The hen: half-width 5, height 16, walk 0.9 a tick, margin
  10 from the camera's edges, start 30, peck delay 4 / live 10 / cooldown 14 / reach 10, hurt
  18, invulnerable 90, knockback 10, three hearts, koFall 45, camera unlock 1.5.
- **Scoring.** The default seed and three blocks put 7, 10 and 17 worth on the street, 34 in all
  (the first draft said 27). 29 of 34 is 13 of 15 points.
- **Cast: peck, hurt and ko** shipped on the hen rig, with a **stance layer**: the whole bird
  turned about its foot for the three poses a part alone cannot say (DESIGN.md §2.8). `rig.html`
  names them.
- **Host: GO ▶ is not a timed flash.** It shows whenever the camera is unlocked and the block is
  live, after the last wave too, because the handoff is off the tablet's right edge.
- **Host: the body measured 89.9% of the tablet** (the Canvas figure, same as FAPPY's). The peck
  zone stops 5.5rem short of the arena's bottom edge so the dock's circle is clear of it.
- **Host: the paint loop owns the chrome numbers.** The hearts and the "Down" tally are written
  by the runner each frame (the tally is the turn's banked worth plus the block's live count), so
  React never re-renders at 60 Hz. The goon layer re-renders only when a goon's drawing frame or
  state changes, about four times a second; every pose is mounted once and switched.
- **Beats** (`beats/`): hit-pause 120 ms, GO 1200, cleared 2000, ko 2400, timeout 1600.
- **The night palette** is `--bn-*` custom properties handed to `@wingnight/scenery`.
- **Sound:** the cue table is `client/audio/index.ts` (§0.10); the `boss` event fires when the
  boss steps in.
- **Display surface:** as built in §0.7.

## 1) Principles check (docs/minigame-design-principles.md §11)

1. Clock on the TV: the block's own cap is drawn as the marquee's clock line; no room timer.
2. ★ Commit: every peck is a commit with a visible telegraph before it; `endBlock` is the
   hard one.
3. Hold beats: GO ▶, handoff, the bay, the bell — all client holds before the next demand.
4. Near miss: 29 of 34 worth is 13 of 15 points (the default seed's whole course is 34).
5. No hidden modifiers: the course is a published seed and the same for every team.
6. ★ A terrible answer is plausible: walking into a goose is what everyone does; the KO is
   the geese carrying you to the bay, which is the joke.
7. Human judge: n/a (physics game); the host keeps skip, reset and override.
8. Failure is a punchline: the bay, the bell.
9. ★ Whole team: a block each, and the room is the lookout (10, 13).
10. ★ Information asymmetry: spectator-only. The TV's camera is wider than the tablet's on
    both sides, so the wall sees a goon step in from either edge before the holder does, and
    the telegraph before the lunge lands. It collapses goon by goon as each enters the tablet's frame, and hard at the KO.
11. Frame while playing: hearts, worth down, block of N, whose hands.
12. Standings on results only: `RunningTotals` in the readout once finished.
13. ★ Spectators' job: shout the side ("BEHIND YOU"), count the wave down.
14. Points land on the TV within a second: the worth tally in the marquee, written each frame.
15. ★ One verb line: "Walk with your left thumb, peck with your right. Clear the block, pass
    the tablet."
16. First team disadvantaged: block 0 is the easy one for everyone; opener rotation is the
    engine's.
17. One decision at a time: walk or peck, never a menu.
18. First gate easier: wave 0 of block 0 is three geese, and a masher clears block 0 on one or
    two hearts.
19. Host waiting: the hint line says whose block it is and that the tablet is waiting.
20. Every body is the player's own bird.
21. Team colour and name throughout: rail and marquee.
22. Fail costs ≤5 s: a hit is a reel; a KO ends the block and the next teammate is already
    waiting.
23. ★ Sauce: two coarse zones, no aim; mashing is the comedy.
24. Reveal-and-react: every block ends on a beat.
25. Shape: twitch, two thumbs, relay. Different from GEO/SONG_GUESS either side of it.
26. Finale: not this one (JOUST stays).

## 2) Why a beat 'em up

The roster has a one-button runner (Dunlop Dash), a one-button flier (Fappy Bird) and an aim
game (Slingshlong). None of them has an enemy that comes at you, and none of them has the
genre's signature spectator moment: the room seeing the thing behind the player before the
player does. Geese are Barrie's own goons; the waterfront is theirs and everyone in the room
has been chased by one. The beat 'em up's structure — wave, GO ▶, walk on, next teammate — is
already the relay shape the night runs on.

## 3) Information asymmetry

Spectator-only, by camera. The tablet's window is the sim's 160×90 box. The TV's is wider on
**both** sides (`TV_CAMERA_FIT`, `split: true`: about 186–200 units wide, the extra split half
and half), and goons are born `spawnLead` past the tablet's edges on either side and walk in
(`createGoon`). From spawn to the tablet's edge is 30 units plus the goon's half-width: about
70 ticks, a second and a bit of goose walk. The wall sees only the part of that walk inside its
own margin, 13 to 20 units a side at those widths, so the room's real lead is the aspect's: a
goose is on the wall roughly 0.4 to 0.7 s before it reaches the holder's frame, and a gull,
which is quicker, a little less. The spawn lead is what makes that lead the same from both
sides and means the goon is already walking, never popping into the wall's view (a wall wider
than about 230 units would see the pop). Every telegraph is seen at wall size, and the honk is
heard on the wall alone. The asymmetry collapses goon by goon as each enters the tablet's
frame, and hard at the bay or the bell. `tests/e2e/brawl-sandbox.spec.ts` asserts that the wall
sees a goon from each side before the tablet does.
