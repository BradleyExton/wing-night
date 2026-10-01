# Streets of Barrie (BRAWL) Minigame Spec

Status: **Building** — `packages/minigames/brawl/`

Last updated: 2026-10-01

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
  Block `k` is harder than block `k − 1`: more goons, more at once, the raccoon from block 2 and
  the boss goose closing block 3.
- **Two thumbs, no aim.** The arena is the controller. The left ~35% of the body is the walk
  pad: hold it to walk, the side of the pad's centre you are on is the direction, slide across
  the centre to turn. The rest is the peck zone: any tap pecks. No jump, no block, no combos.
  Facing follows the last walk direction, never the peck — a goon behind you needs a step
  back, which is the beat 'em up's own "BEHIND YOU".
- **Three hearts, then the bay.** A hit costs a heart, knocks the hen back and reels her for
  a few ticks, then she is invulnerable for a short window. Out of hearts, the block ends
  `ko`: the geese carry her off (the wipeout punchline). What she put down stays banked.
- **The camera locks per wave.** Classic shape: goons in, camera held, wave down, GO ▶,
  walk on. The hen cannot leave the window the camera frames. The block ends `cleared` when
  the last wave is down and the hen reaches `handoffX`.
- **A block has a tick cap** (`blockTicks`, default 75 s). Reaching it ends the block
  `timeout` with what was banked. Nothing auto-advances the phase: the host still ends the
  turn.
- **Worth, not count.** Goose 1, gull 1, raccoon 2, boss 4. Points are the team's worth down
  over the course's total worth, times the round's max, rounded. Near misses are built in
  (§1).
- **No ghost.** A brawl has nothing to race. The round remembers the best turn's worth and
  name instead, and both surfaces show it as the number to beat.
- **Escape hatches:** `skipBlock` (banks nothing, moves on) and `resetTurn` (back to block
  one, hands back exactly the turn's points), the SCHLONIC pair.
- **The TV sees more street.** The tablet's camera is the sim's 160×90 box. The TV draws a
  wider window on the same `cameraX` (a `fill` camera, SCHLONIC's `camera/index.ts`), so a
  goon stepping in is on the wall before it is on the tablet. That is the room's job (§3).

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
  henWalkSpeed: number;              // units per tick
  henMargin: number;                 // how close to the camera's edges the hen may stand
  peckDelayTicks, peckActiveTicks, peckCooldownTicks: number;
  peckReach: number;                 // how far in front of the hen a peck lands
  hurtTicks, invulnerableTicks: number;
  hitKnockback: number;              // units the hen is shoved per hit
  heartsMax: 3;
  koFallTicks: number;               // how long a goon lies there before `gone`
  cameraUnlockSpeed: number;         // how fast the camera follows the hen between waves
  goons: Record<BrawlGoonKind, {
    hp: number; worth: number; halfWidth: number; height: number;
    speed: number; reach: number;
    telegraphTicks: number; attackTicks: number; recoverTicks: number; stunTicks: number;
    knockback: number;               // how far a peck shoves it
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
- **Goon script**, per tick, in `BRAWL_WORLD.goons[kind]` numbers: `entering` walks in from
  `side` beyond the camera's edge at `speed` until inside the window; `approach` walks toward
  the hen; within `reach` it goes `telegraph` for `telegraphTicks` (the honk — it stands
  still and the room sees it coming), then `attack` for `attackTicks` (its own box hurts the
  hen on overlap if she is not invulnerable), then `recover` for `recoverTicks`, then
  `approach` again. A peck that lands takes one hp, shoves it `knockback` away from the hen
  and puts it in `stunned` for `stunTicks` (it cannot attack); at nought hp it goes `ko`
  (`koTick` set, `goonsDown += worth`, tick pushed on `kos`) and after `koFallTicks` it is
  `gone` and dropped from `goons`. The **gull** arrives in the air and swoops: its `y` is a
  dive toward the hen's height and back up, and it is only in a peck's box while low; it
  hurts on the way through. The **raccoon** has 2 hp and its attack is a charge: it moves at
  twice its speed through `attackTicks`. The **boss** is a goose with 4 hp and double reach,
  spawned alone as the last spawn of the last wave of the last block, and it is `worth` 4.
- **Waves.** The block opens on wave 0 with `cameraX = waves[0].lockX` and `cameraLocked`.
  A wave's spawns step in at `atTick` after the wave opened. The wave is down when every
  one of its spawns has stepped in and gone (`ko` counts as down; `gone` just tidies). Then
  `cameraLocked` is false and the camera follows the hen rightward (never left) at up to
  `cameraUnlockSpeed` until its left edge reaches the next wave's `lockX`, where it locks
  and the next wave opens. After the last wave, the camera follows until `handoffX` is in
  frame; the hen reaching `handoffX` is `cleared`.
- **The hen** walks at `henWalkSpeed` while `walking ≠ 0` and not reeling, clamped to
  `[cameraX + henMargin, cameraX + width − henMargin]`. A peck opens `peckDelayTicks` after
  the press and stays live for `peckActiveTicks`; its box is `peckReach` in front of her
  facing, her height tall. The first goon it overlaps per peck is hit (one peck, one goon).
  A hit on her: `hearts −= 1`, shoved `hitKnockback` away from the goon, `hurtUntilTick`,
  `invulnerableUntilTick`, tick pushed on `hits`. At nought hearts the frame is terminal
  with `outcome: "ko"`. `tick ≥ blockTicks` is terminal with `outcome: "timeout"`.
- **Layout from the seed.** `resolveBrawlBlock` seeds `createMulberry32(seed ^ (block * 0x9e37))`
  (or similar; the point is a different stream per block) and lays out: block 0 two waves of
  3 and 4 (geese and gulls only), block 1 two waves of 4 and 5 (one raccoon in the second),
  block 2 three waves of 4, 5 and 2 + boss. Beyond block 2 the pattern of block 2 repeats
  with one more goon a wave. Spawn sides alternate with jitter so no wave arrives from one
  side only; `atTick` spreads a wave's goons over about four seconds. `length` is
  `(waves + 1) × width`; `lockX` of wave `i` is `i × width`; `handoffX = length − henMargin × 3`.
  The sandbox manifest and the sample rules both use `courseSeed: 20261001`.

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
forwarded untouched. `counter`: "Block 1 of 3", the block's player name, hearts as three
glyphs written by the paint loop, the worth down over the course total, and the number to
beat. `actions`: Skip block, Reset turn, and the one hint line (SCHLONIC's set). `readout`
only during a hold or once finished: the block list and `RunningTotals`.

The body is `[data-brawl-arena]`: the scene SVG full-bleed, and over it two pointer zones
that take `touch-action: none` and track pointers by id so a held walk and a tapped peck
coexist. The walk pad is the left 35% (`[data-brawl-walk-pad]`); the peck zone the rest
(`[data-brawl-peck-zone]`). Each shows a ghosted glyph (◀ ▶, and a PECK ring) that fades
after the first touch of the block. Neither reaches the bottom-right corner (the dock's).

`useBrawlRunner` is `useSchlonicRunner`'s twin: a fixed-step sim on the local clock, painted
every animation frame through a `BrawlSceneHandle`, inputs logged at the tick they land on
and each sent as one action, `endBlock` when the local sim reaches an outcome, then a beat
(`cleared` / `ko` / `timeout`) held before the next block is drawn. The server's echo never
drives the loop. A hit pauses the clock `HIT_PAUSE_MS` and shakes the scene.

### 0.7 The display surface

`<NeonMarquee>` with `clock` and `clockLine` seated, the game name as kicker, hearts and the
worth down as the readout, the number to beat beside it. The body is the same `BrawlScene`
with the `fill` camera. `useBrawlMirror` is `useSchlonicMirror`'s twin: re-runs the block's
log on a local clock `MIRROR_DELAY_TICKS` behind, rebuilds from the top when the log
changes under it, finishes the block it has before switching, and plays the ending beat.
`requiresDisplayAudio: true`; the TV is the speaker.

Beats (client-only holds, FAPPY's convention): **GO ▶** when a wave goes down (a flashing
arrow at the right edge for ~1.2 s, the camera already unlocking under it); **handoff** on
`cleared` (the next teammate's bird waiting at `handoffX` takes the tablet; ~2 s);
**the bay** on `ko` (the geese lift the hen off the top of the frame, a splash sound; ~2.4 s);
**bell** on `timeout` (a boxing bell, the hen slumps; ~1.6 s). Every beat ends on the hen,
never a hard cut (principles §7, §9).

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

Props: `block`, `hen` (the player's figure resolved to a cast appearance, SCHLONIC's
`resolveRunnerFigure`), `sceneId`, `label`, `cameraFit`, `relay` (the last and next
teammates' figures, stood at the start line and the handoff). The hen is `<CharacterFigure>`
under a transform, pose by frame: `walk` while walking, `idle` standing, `peck` while
`peckUntilTick > tick`, `hurt` while reeling, `ko` on the KO beat. Goons are bare `<g>`
components under `BrawlScene/Goons/{Goose,Gull,Raccoon,Boss}` with a `state` prop; a KO'd
goon falls with stars. `data-brawl-*` attributes on the scene, the hen, each goon
(`data-brawl-goon-kind`, `data-brawl-goon-state`), the GO arrow, the handoff and the hearts,
for the e2e spec. Backdrop from `@wingnight/scenery` in a night palette: block 0 is Dunlop
Street (Souldiers, Storefronts, the Queen's), block 1 the waterfront (WaterfrontCondos, the
bay), block 2 Centennial Beach ending at the SpiritCatcher. Blocks beyond repeat block 2.

### 0.9 Sandbox and e2e

`createDevManifest({ rules: { blocksPerTurn: 2, courseSeed: 20261001 }, content: null })`.
`tests/e2e/brawl-sandbox.spec.ts`: both previews draw the block (scene count 2, goons by kind
present after the first wave opens, hearts at 3, "Block 1 of 2" and the ready hint visible),
the first peck-zone tap logs a peck and the hen's `data-brawl-pecking` flips, a held walk-pad
pointer moves the hen's `data-brawl-x`, and no socket request leaves the sandbox.

### 0.10 Sound

`packages/minigames/brawl/src/client/audio/index.ts`: a `createBrawlSoundboard` cue table on
`@wingnight/audio` — `peck`, `land` (a peck connecting), `honk` (telegraph), `hurt`, `ko`
(a goon down), `go`, `handoff`, `bay` (the splash), `bell`, `boss`. Played by the display
through `useGameSoundboard` with takes from `assets/sfx/brawl/`; the tablet is silent unless
`solo`.

## 1) Principles check (docs/minigame-design-principles.md §11)

1. Clock on the TV: the block's own cap is drawn as the marquee's clock line; no room timer.
2. ★ Commit: every peck is a commit with a visible telegraph before it; `endBlock` is the
   hard one.
3. Hold beats: GO ▶, handoff, the bay, the bell — all client holds before the next demand.
4. Near miss: 24 of 27 worth is 13 of 15 points.
5. No hidden modifiers: the course is a published seed and the same for every team.
6. ★ A terrible answer is plausible: walking into a goose is what everyone does; the KO is
   the geese carrying you to the bay, which is the joke.
7. Human judge: n/a (physics game); the host keeps skip, reset and override.
8. Failure is a punchline: the bay, the bell.
9. ★ Whole team: a block each, and the room is the lookout (10, 13).
10. ★ Information asymmetry: spectator-only. The TV's camera is wider than the tablet's, so
    the wall sees a goon step in before the holder does, and the telegraph before the lunge
    lands. It collapses goon by goon as each enters the tablet's frame, and hard at the KO.
11. Frame while playing: hearts, worth down, block of N, whose hands.
12. Standings on results only: `RunningTotals` in the readout once finished.
13. ★ Spectators' job: shout the side ("BEHIND YOU"), count the wave down.
14. Points land on the TV within a second: the worth tally in the marquee, written each frame.
15. ★ One verb line: "Walk with your left thumb, peck with your right. Clear the block, pass
    the tablet."
16. First team disadvantaged: block 0 is the easy one for everyone; opener rotation is the
    engine's.
17. One decision at a time: walk or peck, never a menu.
18. First gate easier: wave 0 of block 0 is three geese.
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

Spectator-only, by camera. The tablet's window is the sim's box; the TV's is wider on the
same left edge, so the wall sees a goon step in from the edge about thirty units before it
reaches the tablet's frame, and sees every telegraph at wall size. It collapses goon by goon,
and hard at the KO beat.
