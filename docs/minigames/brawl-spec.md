# Streets of Barrie (BRAWL) Minigame Spec

Status: **Shipped** — `packages/minigames/brawl/`

Last updated: 2026-10-02 (depth pass, tier 3: the handoff pick — buy a fourth heart with banked worth, or keep the three — §0.11; tiers 1 and 2 landed the same day)

Next: the depth pass is built. What it added, and why, is argued from primary sources in
[docs/research/brawl-depth-and-strategy.md](../research/brawl-depth-and-strategy.md) (its
"Recommended package" was the plan; `BACKLOG.md` carries the tiers). Tiers 1, 2 and 3 (features
1–5 and 7–10) are built and described below as built; phone-held spectator reinforcements stay an
idea in `BACKLOG.md`.

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
  Block `k` is harder than block `k − 1`: more goons, more at once, a swan and a raccoon from
  block 1, the helmet goose from block 2, and the boss goose closing every block from index 2 on
  (block 3 of a default turn).
- **Two thumbs, no aim.** The arena is the controller, split in halves. The left half is the
  walk pad, a floating one-axis stick: wherever the thumb lands is its centre, and holding walks
  the hen the way she faces; pulling back about 30 px turns her, and the turn re-centres, so the
  next pull back turns her again. The right half is the peck zone: any touch pecks, and a held
  thumb keeps pecking at the sim's own rate. No jump, no block, no combos. Facing follows the
  last walk direction, never the peck — a goon behind you needs a turn, which is the beat 'em
  up's own "BEHIND YOU" (docs/research/tablet-brawler-controls.md, scheme B).
- **Three hearts, then the bay.** A hit costs a heart, knocks the hen back, reels her for
  a few ticks and shuts any peck she had out, then she is invulnerable for a short window. Out of hearts, the block ends
  `ko`: the geese carry her off (the wipeout punchline). What she put down stays banked. A block
  the team bought a heart for (the handoff pick, below) starts on four.
- **The camera locks per wave.** Classic shape: goons in, camera held, wave down, GO ▶,
  walk on. The hen cannot leave the window the camera frames, and neither can a goon that has
  stepped in. Between waves the camera follows her once she is past 40% of the window, so
  there is more street ahead of her than behind. The block ends `cleared` when
  the last wave is down and the hen reaches `handoffX`.
- **A block has a tick cap** (`blockTicks`, default 75 s). Reaching it ends the block
  `timeout` with what was banked. Nothing auto-advances the phase: the host still ends the
  turn.
- **Worth, not count.** Goose 1, gull 1, raccoon 2, swan 2, helmet goose 2, boss 4; a wave taken
  down with no hit on her banks `cleanWaveBonus` (2) the moment it goes down; and each heart she
  walks off a CLEARED block with is `heartWorth` (1) to the team, up to three — the bay and the
  bell bank no hearts. Points are the team's worth banked over the course's total worth, which counts every
  goon, every wave's bonus and every block's three hearts (61 on any seed and three blocks: 38 of
  goons, 14 of waves, 9 of hearts — the kit is a rule, so the total does not move with the seed),
  times the round's max, rounded. The bonuses are INSIDE the max, not
  on top: a perfect course is full points and nothing above it, and a team that clears everything
  but is hit in every wave scores under one that is not. Near misses are built in (§1).
- **Goons bowl each other.** A pecked goon is shoved `knockback` away from her whether it is
  stunned or KO'd (a KO is sent flying the same distance and falls where it lands), and every
  standing walker its path crosses is stunned too — no hp lost, one pass, never a chain of chains.
  Let them queue, then bowl (§0.4).
- **The swan stalks the hen who faces it** (SoR2's Signal: it punishes facing away). In reach
  and faced, it stands still at its reach and waits — no advance, no attack, and peckable. The
  tick she turns her back it hisses (its telegraph) and then lunges, and once hissing it is
  committed. Turning to face it is always the answer, so it is never unanswerable (research
  E.3.2). From block 1.
- **The helmet goose clanks a mash** (SoR2's Donovan: it punishes the mash). Its guard is down
  while it walks in and reels, and a peck that lands then is a CLANK: no hp, shoved its knockback,
  no stun, the peck spent. Its guard is up through the honk, the lunge and the slump after, and a
  peck then lands as normal. Peck into the honk; a held peck still lands in the honk sooner or
  later, so mashing is the floor, not a wall. The cage flipped up over the dome is the room's
  "now". From block 2.
- **A hazard per block.** Dunlop's patio railing, the waterfront's bay, Centennial Beach's plinth:
  24 units of street in wave 1's window (never wave 0's — principles §18), in its left or right
  third. Anything walks over it; a goon a PECK shoves into or across it is dunked — down at once
  whatever its hp, its whole worth banked. Not a gull (it flies), not the boss (too heavy).
- **The wing drop.** A goon worth two or more that goes down — pecked or dunked — drops a wing
  where it lands: one a wave, one on the street at a time, six seconds. She eats it by STANDING
  on it (thumb up) with a heart to fill: a heart back, up to the cap. Stopping in the fight is the
  price (Mother Russia Bleeds' harvest); it is also what keeps the wing off a masher pinned to the
  window's edge (§0.11).
- **The handoff pick: buy a fourth heart, or keep the three.** On every block after the first,
  while it is `ready`, if the team's banked worth is at least `heartPrice` (a rule, default 3), the
  teammate holding the tablet may tap **Buy a heart** before their first touch of the street: the
  block starts with four hearts and the price comes off the bank. Doing nothing and starting to
  play is keeping the three — the first thumb on the street closes the offer — and nothing
  auto-advances; there is no timer. A carried heart is worth `heartWorth` only up to three, so the
  bought heart never earns worth back: pay 3, and the most it can hand back is the heart she would
  otherwise have lost (Double Dragon Gaiden's spend-or-save, research S.4.1–S.4.2). The course
  total does not move (61 on the default seed); a purchase only lowers the numerator. A bought
  block that is then skipped stays paid; `resetTurn` unbuys every heart and refunds it with the
  turn. The wing heals a bought block back up to four. Solo, the one player gets the same offer.
- **No ghost.** A brawl has nothing to race. The round remembers the best turn's worth and
  name instead, and both surfaces show it as the number to beat.
- **Escape hatches:** `skipBlock` (banks nothing, moves on; a heart bought for the block stays
  paid) and `resetTurn` (back to block one, hands back exactly the turn's points, bought hearts
  refunded with them), the SCHLONIC pair.
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
  heartsMax: 3;                      // the hearts a block starts on unless the team bought a fourth
  cleanWaveBonus: 2;                 // banked when a wave goes down with no hit on her since it opened
  heartWorth: 1;                     // what each heart she walks off a CLEARED block with is worth, up to three (runtime banks it)
  wingTicks: 360;                    // how long a dropped wing lies on the pavement (6 s)
  wingReach: 3;                      // she eats it standing within henRadius + this of it
  hazardWidth: 24;                   // each block's hazard span
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

export const resolveBrawlBlock = (course: BrawlCourse) => BrawlBlock;     // goonsTotal = goons' worth + waves × cleanWaveBonus; hearts = course.hearts ?? heartsMax
export const resolveBrawlHeartsTotal = () => number;                      // heartsMax × heartWorth
export const resolveBrawlHeartsCarried = (hearts: number) => number;     // the carried hearts that bank: min(hearts, heartsMax)
export const resolveBrawlBlockWorth = (result: { outcome; goons; hearts }) => number; // goons, + carried hearts × heartWorth if cleared
export const resolveBrawlCourseTotal = (course: { seed: number; blocks: number }) => number; // Σ (goonsTotal + hearts total)
export const resolveBrawlGoonBox = (kind: BrawlGoonKind) => { halfWidth: number; height: number };
export const resolveBrawlTickCap = () => number;
export const resolveBrawlStartHearts = (heartBought: boolean) => number;  // heartsMax, + 1 when the team bought a heart
export const resolveBrawlHeartsCap = (block: { hearts }) => number;    // what a wing restores up to: the block's starting hearts
export const isBrawlGoonGuarded = (goon: { kind; state }) => boolean;  // a helmet goose not in telegraph/attack/recover: a peck clanks

export const createBrawlRunStart = (block: BrawlBlock) => BrawlFrame;  // on the line with block.hearts
export const createBrawlRunSkip = (block: BrawlBlock) => BrawlFrame;   // on the line, outcome "timeout", nothing banked
export const isBrawlWaveClean = (frame: BrawlFrame) => boolean;        // no hit since waveOpenedTick: the star's rule
export const stepBrawl = (frame: BrawlFrame, block: BrawlBlock, inputs: readonly BrawlInput[]) => BrawlFrame; // one tick
export const advanceBrawl = (frame, block, inputs, toTick: number) => BrawlFrame;   // steps until toTick or a terminal frame
export const runBrawlRun = (course: BrawlCourse, inputs: readonly BrawlInput[]) => BrawlRun;  // the referee: whole block from the top
```

The types it adds (tier 2): `BrawlGoonKind` is `"goose" | "gull" | "raccoon" | "swan" | "helmet" |
"boss"`; `BrawlGoonState` gains `"stalk"`; `BrawlHazard = { kind: "railing" | "bay" | "plinth"; x;
width }` and `BrawlBlock.hazard: BrawlHazard | null`; `BrawlGoonMark = { tick; spawnIndex }`;
`BrawlPickup = { x; untilTick }`. Tier 3 adds `BrawlCourse.hearts?: number` (default
`heartsMax`, never below one) and `BrawlBlock.hearts`, the hearts the block starts on: four on a
block the team bought a heart for. `resolveBrawlBlock` copies it from the course and nothing else
about the street moves; `createBrawlRunStart`, the skip frame (`createBrawlRunSkip`) and the
referee (`runBrawlRun`) all start from it, so the server, the tablet and the TV start a bought
block alike. `BrawlFrame` gains `clanks: BrawlGoonMark[]` (every peck that
bounced off a guard — also in `landed`), `dunks: BrawlGoonMark[]` (every goon shoved into the
hazard — also in `kos`), `pickups: BrawlPickup[]` (the wing on the street, at most one), `drops:
number[]` (the tick of every wing dropped, so a wave drops one at most) and `wings: number[]` (the
tick of every wing eaten).

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
  `approach` again. **The swan** (`stalk`): in `approach`, once within `reach`, if the hen faces it
(`frame.facing === sign(swan.x − frame.x)`) it goes `stalk` instead of `telegraph` — it stands at
that distance, does not advance, does not attack, and is a standing state for pecks, chaining
and the hazard. Every tick it re-checks: the moment she faces away it goes straight to
`telegraph` (the hiss) — checked first, so the turn that steps her out of its reach is still a
turn away — and faced but out of its reach it goes back to `approach`. Once in `telegraph` it is
committed. Swans queue like walkers. A peck that lands takes one hp and shoves it `knockback` away from the hen
  — stunned or KO'd alike — then puts it in `stunned` for `stunTicks` (it cannot attack), or
  at nought hp `ko` where it landed (`koTick` set, `goonsDown += worth`, tick pushed on `kos`),
  and after `koFallTicks` it is `gone` and dropped from `goons`. `clampGoon` still pins the
  shoved goon inside the locked window. **The chain** (`chainKnockback`): every OTHER goon in
  `approach`, `telegraph`, `attack` or `recover` — not a gull, not `entering`, not already
  `stunned`/`ko`/`gone` — whose box overlaps the shoved goon's path from its old x to its new
  clamped x, widened by both half-widths, is put in `stunned` for ITS OWN `stunTicks` with no hp
  lost and no movement, and a tick is pushed on `bumps` for each. Chained goons do not chain
  further: one pass, no recursion. **The clank**: a peck on a helmet goose whose guard is down
(`isBrawlGoonGuarded` — any state but `telegraph`, `attack`, `recover`) takes no hp and does not
stun; the goose is shoved its `knockback` and keeps its state, the peck is spent (pushed on
`landed`, one peck one goon) and `{ tick, spawnIndex }` is pushed on `clanks`. A clank's shove
chains and can dunk like any other. **The dunk**: when the struck goon's shove — stunned, KO'd or
clanked — runs from its old x to its new clamped x through any of the block's hazard span
(`min ≤ hazard.x + width && max ≥ hazard.x`: into, across or out of it), the goon goes `ko` at
once whatever its hp, its whole `worth` is banked, and the mark is pushed on `dunks` (and the tick
on `kos`). Gulls and the boss are never dunked; a goon bowled by the chain is not moved, so it
cannot be; walking over the span is free. **The wing**: a goon of worth ≥ 2 that goes `ko`
(pecked or dunked) pushes `{ x, untilTick: tick + wingTicks }` on `pickups` at its x, clamped to
where she can stand in the window, and the tick on `drops` — unless a wing is already on the
street or `drops` has a tick ≥ `waveOpenedTick`. After the hits, a wing past its `untilTick` is
dropped, and one within `henRadius + wingReach` of her while she STANDS (`walking === 0`) with
`0 < hearts < resolveBrawlHeartsCap(block)` — the block's starting hearts, so a bought fourth
heart can be eaten back — is eaten: `hearts += 1`, the tick pushed on `wings`. The
**gull** arrives in the air and swoops: its `y` is a
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
  one of its spawns has stepped in and gone (`ko` counts as down; `gone` just tidies). **If
  `hits` has no tick ≥ `waveOpenedTick` at that moment the wave is clean**
  (`isBrawlWaveClean`): `goonsDown += cleanWaveBonus` and the tick is pushed on `bonuses`, on
  the same frame the camera lets go (so a KO that empties the wave banks goon and bonus
  together). Then
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
  block. The swans and helmet geese are dealt into seeded slots the same way. The course:

  | Block | Wave 0 | Wave 1 | Wave 2 | Hazard |
  |---|---|---|---|---|
  | 0 (Dunlop) | 3: geese | 4: 1 gull | — | railing |
  | 1 (waterfront) | 4: 1 gull, **1 swan** | 5: 1 gull, 1 raccoon | — | bay |
  | 2+ (beach) | 4+e: 1 gull, 1 raccoon, **1 helmet** | 5+e: 2 gulls, 1 raccoon, **1 swan** | 2+e: 1 gull, **1 helmet**, then **the boss** | plinth |

  The rest of each wave is geese; `e` is the blocks past 2 (one more goose a wave each). The hazard
  is dealt from the block's stream AFTER its waves, so it never moves a goon: `hazardWidth` 24, at
  `waves[1].lockX` plus a seeded integer in 14..29 (the left third) or 107..122 (the right third)
  — never in wave 0's window, never where she walks into wave 1 (about 40% across it), and 14
  clear of the edges goons step in at. Spawn sides alternate from a seeded start,
  and from the third goon on one in four keeps the side of the one before, so no wave arrives
  from one side only. A wave's first goon steps in 45 ticks after it opens and the rest are
  spread over about four seconds, jittered, never two on the same tick; **the boss steps in
  120 ticks after the last of its escort**. `length` is `(waves + 1) × width`; `lockX` of
  wave `i` is `i × width`; `handoffX = length − henMargin × 3`. The kit fixes the worth on every
  seed: 7, 11 and 20 of goons for blocks 0, 1 and 2; with two, two and three waves at
  `cleanWaveBonus` 2 the blocks' `goonsTotal` are 11, 15 and 26 (52), and with three hearts a
  block the course is 61 (the sandbox's two blocks: 32). The sandbox manifest and the sample rules
  both use `courseSeed: 20261001`, whose hazards land at x 270 (block 0, the railing), 270 (block
  1, the bay) and 276 (block 2, the plinth) — all in the right third.
- **`BrawlFrame.goonsDown` is the worth banked**, goons and clean waves, and `BrawlRun.goons` /
  `BrawlBlockResult.goons` carry the same number for the block. The hearts are not in it: the
  runtime adds them (`resolveBrawlBlockWorth`) when the block is `cleared`, so the sim never has
  to know how a block ended to score it.

### 0.5 Views and actions

Mirrors SCHLONIC's shapes. `BrawlPlayerFigure` is `SchlonicPlayerFigure`'s twin (playerId,
name, avatarSrc, teamId, genre). Nothing about a block is secret, so host and display views
carry the same fields:

```ts
type BrawlBlockStatus = "ready" | "running" | "done";
type BrawlPhase = "ready" | "running" | "finished";
type BrawlBlockResult = { outcome: BrawlOutcome; endTick: number; goons: number; hearts: number };
// `goons` is the sim's banked worth (goons + clean waves); `hearts` is what she walked off with,
// and worth `heartWorth` each only when `outcome` is "cleared" (`resolveBrawlBlockWorth`).
type BrawlMinigameBlock = {
  blockIndex: number; player: BrawlPlayerFigure | null; status: BrawlBlockStatus;
  inputs: BrawlInput[]; skipped: boolean; result: BrawlBlockResult | null;
  heartBought: boolean;   // the handoff pick: four hearts on this block, `heartPrice` off the bank
};
type BrawlBestTurn = { teamId: string | null; teamName: string | null; goons: number };
type BrawlMinigameViewFields = {
  minigame: "BRAWL"; phase: BrawlPhase; blockIndex: number; blocksPerTurn: number;
  courseSeed: number; blocks: BrawlMinigameBlock[];
  goonsDown: number;      // the worth banked over the turn so far: Σ resolveBrawlBlockWorth(result) − heartPrice × bought blocks
  goonsTotal: number;     // the course's whole worth: goons, clean waves and hearts (61 by default; a purchase never moves it)
  heartPrice: number;     // what a fourth heart costs at a handoff (the rule)
  points: number | null;  // once finished
  bestTurn: BrawlBestTurn | null;
};
```

Actions (bare names, `transientActionTypes: ["walk", "peck"]`): `walk` `{ tick, dir }`,
`peck` `{ tick }`, `buyHeart` `{}`, `endBlock` `{}`, `skipBlock` `{}`, `resetTurn` `{}`. The
reducer refuses a `walk`/`peck` whose tick is below the log's last tick, and `endBlock` re-runs the
log with `runBrawlRun({ seed, blocks: blocksPerTurn, block: blockIndex, hearts:
resolveBrawlStartHearts(heartBought) }, inputs)` — the only reading that scores. `buyHeart` is not
transient (the host's undo takes it back like any ruling) and is refused unless the block in hand
is `ready`, `blockIndex ≥ 1`, not already bought, and the banked worth (`goonsDown`) is at least
`heartPrice` — `canBuyBrawlHeart` in `runtime/guards`, the same test the tablet draws the cards
on — so the bank never goes below nought. A buy sets `heartBought` and re-scores the turn at once,
so the pending points drop with the bank. Rules (`minigameRules.brawl`, every field optional,
positive integers except the seed): `blocksPerTurn` (3), `courseSeed` (20261001), `heartPrice` (3).
Round memory: `{ bestTurn }`, the finished turn with the most worth down after its purchases, from
any team before this one.

### 0.6 The host surface

A `<TakeoverCanvas>` (the body's meaning is spread evenly: a street). `rail` and `clock`
forwarded untouched; BRAWL is `timerKey: null`, so `clock` is empty. The three slots, as built:

- `counter`, read-only in the chrome row: "Block 1 of 3" with the block's player under it;
  **hearts** as three glyphs, or four on a block the team bought a heart for (`HeartRow`,
  `data-brawl-hearts`), lit and dimmed by the paint loop; **the
  worth banked** over the course total, "12 / 61 Worth" (`data-brawl-goons`), written by the
  same loop; and the number to beat with the team that set it, when there is one. Hearts and
  worth are the two numbers the chrome carries, and they are the two the thumbs are playing
  for. The hearts leave the row once the team is through. No clean star and no sides here: the
  star is a TV thing (the hearts already tell the holder she was hit) and the sides are the
  room's alone (§3).
- `actions`, floating bottom-left: Skip block and Reset turn (SCHLONIC's pair; solo there is
  nobody to skip for, so Skip goes and Reset reads Restart), then the one hint line. Skip is
  disabled through the handoff: the street still shows the block just ended, and a tap there
  would skip the NEXT player's block before they held the tablet. The hint says whose block it
  is and where the thumbs go while the block is ready ("Caitlin is on the line — hold left to
  walk, pull back to turn, tap right to peck"), and says nothing while a block runs or a beat
  plays: a brawling hen's holder is not reading.
- `readout`, floating bottom-right above the dock, **only while a block's ending is on screen
  or once the team is through**, because the right of the street is where goons walk in from:
  the finish card ("Street clear", the points), the block list (`BlockHistory`: who fought
  each block, how it ended and what it banked — "Handed off · 14 worth", hearts included on a
  handoff — the block in hand lit) and `RunningTotals` with "Full points at 57 worth" under it.

The body is `[data-brawl-arena]` (`HostBrawlSurface/Street`): the scene SVG full-bleed, and
over it two pointer zones, each half the arena, that take `touch-action: none` and track
pointers by id, so a held walk and a tapped peck coexist. The walk pad (`Street/WalkPad`,
`[data-brawl-walk-pad]`) is the left half and one pointer owns it: the touch-down x is the
thumb's centre and the hen walks the way she faces (the runner's `getFacing()`); a pull back of
`TURN_PX` (30 CSS px) against the way she is walking turns her, and the turn is the new centre;
inside the dead band she keeps walking, never stops; the centre trails the thumb forward, so
"back" is measured from where the thumb has got to. Lifting stops her, and pointer capture keeps
a thumb that slides off the pad walking. The logic is the pure `thumbWalk/` reducer; a muted
stick (`[data-brawl-thumb]`, ring at the centre, a dot on the pull, the way she walks lit) is
written straight onto the DOM under a held thumb. The peck zone (`Street/PeckZone`,
`[data-brawl-peck-zone]`) is the right half: any touch pecks at once, and while any pointer is
held it pecks again every `PECK_REPEAT_MS` (the cooldown plus two ticks, 267 ms). Both let go when
the arena disarms, so a thumb held through a handoff does not start the next player's clock.
Thumb-rest glyphs sit at mid height on each side (a thumb ring between ◀ ▶ over "hold to walk ·
pull back to turn"; a PECK ring over "tap or hold") and fade after the first touch of the block.
The peck zone stops 5.5rem short of the arena's bottom edge, and the walk pad pads its glyph by
the same, so a mashed peck never lands on the corner dock and the two glyphs sit level; nothing
in the arena reaches the bottom-right corner. The arena dims to 80% when it is not armed (a
hold, a finished team, a tablet that may not act) and ignores both zones. The handoff callout
("Hand it to *name*") drops over the street for the beat, client-only.

**The handoff pick** (`Street/HeartPick`, `[data-brawl-heart-pick]`). Once the handoff's beat is
over and the next block is on the line, if the offer stands (`Street/heartOffer`: the tablet is
armed, the block in hand is after the first, `ready` and not bought, and the bank covers
`heartPrice` — `canBuyBrawlHeart`, the reducer's own test), two big cards float over the middle of
the street, between the two thumb-rest glyphs and clear of the 4.5rem corner gutter, under a
"Before you walk" kicker: **Buy a heart** ("a 4th heart · costs 3 worth · you have N", in the
hearts' heat) and **Keep the three** ("or just start walking", quieter). The hint line stays. The
layer lets every touch through to the thumb zones except on the two cards. Tapping Buy sends
`buyHeart {}` and closes the cards; the hearts row draws four once the echo lands, the tally drops
by the price, and the runner starts the line again on four. Tapping Keep, or touching either thumb
zone, closes the cards with no action at all — client state, keyed on the block, cleared if a
reset takes the team back before it. Nothing shows on block 0, on a bought block, once the block
runs, or when the team is too poor. No timer: the pick is a hold at the handoff, never a decision
in play.

`useBrawlRunner` is `useSchlonicRunner`'s twin: a fixed-step sim on the local clock, painted
every animation frame through a `BrawlSceneHandle`, the clock started by the first touch of
either thumb, inputs logged at the tick they land on (a walk that stays on one side logs
nothing) and each sent as one action, `endBlock` when the local sim reaches an outcome, then a
beat (`cleared` / `ko` / `timeout`) held before the next block is drawn. The server's echo
never drives the loop. A hit pauses the clock `HIT_PAUSE_MS` and shakes the scene. The block it
fights is the view's (`useBrawlBlock`, `resolveViewCourse`): four hearts when `heartBought`. A
heart bought a thumb's width before the first touch, whose echo lands after the clock started, is
caught too: the loop sees the block's hearts change under it and re-runs its own log from the top
on the new block, so the tablet agrees with the referee. The hearts
and the worth banked are written by the same paint loop, not by React: the tally is the turn's
banked worth (`resolveGoonsBanked`, every refereed block at `resolveBrawlBlockWorth`, less
`heartPrice` for every block up to this one that was bought) plus the
block's live `goonsDown`, so it climbs as the goons fall and jumps by 2 as a wave goes down
clean. **The hearts land at the handoff beat**: over the cleared beat's middle (progress 0.2 →
0.6, `resolveHeartsCarried`) the lit hearts go out one at a time and the tally climbs by
`heartWorth` for each — three of them at most (`resolveHeartsWorth`): a bought fourth goes out
with the rest and adds nothing — so the row is dark and the number is the referee's by the time the next
teammate's street is drawn. The bay and the bell carry nothing. Poses are mounted
once and switched, and the goon layer re-renders only when a goon's drawing frame or state
changes (about four times a second), never per tick.

### 0.7 The display surface

As built. `DisplayBrawlSurface` is the house `<NeonMarquee>` (`clock` and `clockLine` seated,
the game name as kicker) over the street, with a status line under the stage (DESIGN.md §2.2D).
The marquee's readout (`MarqueeReadout`) is the block ("Block 1 of 3 · Caitlin"), the hearts
(`HeartRow`, `data-brawl-hearts`: three glyphs, four on a block the team bought a heart for), the
worth banked over the course ("12 / 61 Worth", `data-brawl-goons`, counting up from the bank
after any heart's price)
and, once the round has one, the number to beat with the team that set it. The hearts and the
tally are written by the mirror's paint loop, not by React, and they are the replay's: the view
only banks a block once the server has refereed it, and the room is watching it now. At the
handoff beat the lit hearts fly into the tally as the tablet's do (§0.6). The TV never shows the
handoff pick's cards; it learns of a purchase from the view (`heartBought`), and the mirror starts
that block, and a missed block's referee re-run, on four hearts (`resolveViewCourse`). Once the team
is through, the marquee carries the turn's final tally and the street holds on the last block
under a `<ResultPlaque>` ("Street clear", "N of M worth", the points), `silent` because the
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
current wave, scaled by worth (a raccoon's, a swan's and a helmet goose's pip is heavier, the
boss's heaviest), each waiting
(not on the street yet), in, or down, and **GO ▶** in the strip when the wave is down and the
camera has let go (the scene's own arrow still flashes at the street's edge). **The pips are
grouped by the edge they step in from**: the left-side goons at the strip's left end under a
◀, the right-side ones at its right end under a ▶, in arrival order
(`data-brawl-wave-side`, `data-brawl-wave-side-marker`), so the room can call "GULL, LEFT,
NEXT" for the whole wave instead of the half second the camera gives it. The TV's alone: the
tablet draws no strip and never a side (§3). **The clean star** (`[data-brawl-wave-star]`, ★)
sits between the groups and GO: gold while the wave in hand is clean (`isBrawlWaveClean`, the
sim's own rule), a dim ghost the moment she is hit (`data-clean="false"`), and a pop with a
glow when the wave goes down clean and the bonus banks (`data-banked="true"`); it relights
when the next wave opens. React draws every wave's pips once per block and the mirror's paint
loop picks the wave, lights its pips and works the star, so the strip costs nothing per frame.
It hides during a hold and once the team is finished: the beat has the room's eyes.

**The beat callout** (`BeatCallout`) is driven by the hold, not by the mirror's beat event, so
it appears under reduced motion and in `renderToStaticMarkup` tests alike. It hangs low over
the pavement on a dark pool, under the hen's feet, so no beat covers her: the handoff reads
"Hand it to *name*", the bay "Into the bay!" (with who takes the tablet a size down) and the
bell "Time!"; a cleared last block reads "Last block / Street clear!"; a skipped block shows
only who is next.

**The heart callout** (`HeartCallout`, `[data-brawl-heart-callout]`): "*Caitlin* bought a heart"
in the show's voice under a heat kicker ("Four hearts · −3 worth"), low over the pavement like the
beat callout and a size down, for `HEART_CALLOUT_MS` (2 s) from the first render that shows a
bought block on the wall — after the previous block's hold, never over it, and once per block
(`useHeartCallout`, a reset forgets it). Like the beat callout it is worked out during the render,
not from a mirror event, so it shows under reduced motion and in static-markup tests. It is where
the room sees the tally's three go.

Beats (client-only holds, FAPPY's convention): **GO ▶** whenever the camera is unlocked and the
block is live, a flashing arrow at the right edge of whatever window the surface draws, the
camera already following the hen under it. It shows after the last wave too, because the
handoff is off the tablet's right edge; **handoff** on `cleared` (the hen walks up to the next
teammate waiting past `handoffX` and the tablet changes hands, 2 s); **the bay** on `ko` (the
geese lift the hen off the top of the frame, a splash sound, 2.4 s); **bell** on `timeout` (a
boxing bell, the hen slumps, 1.6 s). A hit's hit-pause is 120 ms; the GO constant is 1.2 s
(`beats/`). Every beat ends on the hen, never a hard cut (principles §7, §9).

**Sound.** `useBrawlSounds` hangs the whole board off the display. Every event the mirror reads
off its replay (`mirrorEvents/`: `peck`, `land`, `clank`, `honk`, `hiss`, `boss`, `hurt`, `ko`,
`dunk`, `bump`, `wing`, `go`, `clean`) is its own cue — a swan's telegraph is a `hiss`, never a
`honk`, and its stalk is silent; a clank is told as `clank` and never also `land`; a dunk as
`dunk { hazard }` (the `splash` cue for the bay, the `dunk` clatter for the railing and the
plinth) and never also `ko`; a `honk` sounds at `BRAWL_HONK_GOON_INTENSITY` for a goose-sized goon
and at 1 for the boss; and the start of each ending beat fires its own cue (`handoff`, `bay`,
`bell`). The `boss` event fires when the boss steps in, once a block; `bump` once per entry
`BrawlFrame.bumps` grew by (a chained stun); `clean` once per entry `bonuses` grew by, right
behind `go`. The handler's identity is stable for the life of the surface, because the
mirror's loop closes over it.

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
components under `BrawlScene/Goons/{Goose,Gull,Raccoon,Swan,Helmet,Boss}` with a `state` prop,
each placed by `resolveGoonPlacement` on its own `BRAWL_WORLD.goons` box; a KO'd goon falls with
stars; a telegraphing one is drawn honking — the swan hissing (`Swan/Hiss`,
`data-brawl-goon-hiss`, still counted as a honk). The swan has a `stalk` pose of its own (drawn
up, still, on one foot); any other kind handed `stalk` is drawn walking. The helmet goose carries
`data-brawl-goon-guard` (`down` / `up` / `off`), the cage over its bill or flipped over the dome,
the same states as `isBrawlGoonGuarded`; for `CLANK_TICKS` (12) after each `clanks` entry it
draws `Goons/Clank` at its cage, handed the ticks since the clank (`GoonProps.clank`), and the
goon layer's signature carries live clanks in two-tick steps, so a clank is six small renders.
The block's hazard (`Hazards/{Railing,BayEdge,Plinth}`, picked by `Hazards/Hazard`,
`data-brawl-hazard`) is part of the memoised `Street`, in the night palette. A wing on the
pavement (`Pickups/Wing`, `data-brawl-pickup="wing"`) is drawn by `PickupLayer` between the
street and the goons, bobbing on the sim's tick redrawn every four ticks, and only while one
lies there. A dunk spreads a ring under the dunked goon for 30 ticks (`DunkSplash`,
`data-brawl-dunk`: water on the bay, dust over the railing and off the plinth), written straight
onto the DOM; the goon's own KO fall is the rest of the beat. The goon palette carries the swan's
legs and the wing's colours (merged from `Swan/palette.ts` and `Pickups/Wing/palette.ts`). **Staged depth, scene only:** the
sim stays one line, but a goon far from the hen is drawn on one of three depth lines (behind
her line, on it, in front; `((spawnIndex × 7) mod 3) − 1`, so both screens agree) and walks onto
her line as it closes (`BrawlScene/goonDepth`). Its share of its line is 0 within its `reach`
plus `DEPTH_NEAR` (10) and ramps to 1 over `DEPTH_RAMP` (40) more (a stalking swan is always on
her line); a whole line is `DEPTH_STEP`
(5) units down the screen and 6% bigger in front, up and smaller behind, scaled about its foot.
So it is on her line before it can honk or lunge, and nobody whiffs on depth. Gulls fly and have
no line; a reeling or KO'd goon keeps the depth it was hit at. The goon layer draws the far line
first and re-renders only when that order changes. `data-brawl-*` attributes on the
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
the first peck-zone tap logs a peck and the hen's `data-brawl-pecking` flips, a hold in the
middle of the walk pad walks her the way she faces, a 50 px pull back turns her
(`data-brawl-facing` −1, `data-brawl-x` falls), lifting stops her, a held peck-zone pointer
moves the scene's `data-brawl-peck-until` on three or more times in a second, and no socket
request leaves the sandbox. The brawler bot walks through the same pad: a hold, and a pull
the way it needs.
The TV's half of the asymmetry is asserted too: for a goon from each side the wall's scene has it
on the street before the tablet's does (§3). Tier 2: both previews draw block 0's railing
(`data-brawl-hazard="railing"`, and no other hazard) and, after the handoff, block 1's bay; one
tap starts block 1 and its swan (`data-brawl-goon-kind="swan"`) walks onto both streets. The
stalk, the clank, the dunk and the wing are pinned by the sim's own tests, not the e2e: the
sandbox's two blocks hold one swan, no helmet goose, and a hazard only in a wave the bot reaches
after a minute of fighting. Tier 3: once the bot has cleared block 1 (banking more than the
default `heartPrice` of 3), the tablet puts the handoff pick's cards up for block 2 — with the
bank in the Buy card's line — and the wall never does; one tap on the street closes them without
buying (hearts stay 3 on both rows, no callout on the wall). A second path clears block 1 again
and taps **Buy a heart**: the cards close, both hearts rows draw four lit glyphs, both tallies
drop by 3, the wall calls out "Caitlin bought a heart", and the first tap starts her on four.

### 0.10 Sound

`packages/minigames/brawl/src/client/audio/index.ts`: a `createBrawlSoundboard` cue table on
`@wingnight/audio` — `peck`, `land` (a peck connecting), `clank` (a peck off a helmet's cage: a
bright inharmonic ping on a click, 80 ms gap so a mashed clank is a run of pings), `honk`
(telegraph), `hiss` (the swan's telegraph: breathy high noise, no note, 500 ms gap like the
honk), `hurt`, `ko` (a goon down), `dunk` (over the railing or off the plinth: three knocks and
a thud, 300 ms), `splash` (into the bay: the bay beat's own splash voice on a 300 ms gap of its
own, so a dunk never swallows the beat's), `bump` (a bowled goon landing: a dull thud, 120 ms gap
so a shove through a queue is one thud), `wing` (a wing eaten: a crunch and two notes up, 400
ms), `go`, `clean` (a clean wave banked: a short bright three-note sting a touch behind GO, 900
ms gap), `handoff`, `bay` (the splash), `bell`, `boss`. Synthesised
voices with `BRAWL_CUE_MIN_GAP_MS` per cue (60 ms for `peck` up to 2.5 s for `boss`, so a
mashed zone is a run of ticks and a beat told twice sounds once) and `BRAWL_MASTER_GAIN` 0.25.
`honk` takes an
`intensity` for the goose's heft: `BRAWL_HONK_GOON_INTENSITY` (0.3) for a goose, 1 for the
boss, so the boss honks lower and longer. Recorded takes from `assets/sfx/brawl/<cue>-N.mp3`
(`BRAWL_SFX_FOLDER`) replace a cue's synthesis once they exist; none are recorded yet. Played
by the display through `useGameSoundboard`; the tablet is silent unless `solo`.

### 0.11 As built

What the code does where the plan above was written before it. Sections 0.3 to 0.8 were edited
in place to match; this is the list of the decisions that moved.

- **Depth pass, tier 1 (2026-10-02).** Features 1, 2, 3 and 9 of
  [docs/research/brawl-depth-and-strategy.md](../research/brawl-depth-and-strategy.md): rules
  only, no new input, no new drawing.
  - *Perfect-wave bonus.* `BRAWL_WORLD.cleanWaveBonus` 2; `BrawlFrame.bonuses` (ticks);
    `resolveWaveDown` banks it on the frame the wave goes down if `hits` has no tick ≥
    `waveOpenedTick` (`isBrawlWaveClean`, exported for the meter). `BrawlBlock.goonsTotal`
    gained `waves × cleanWaveBonus`, so the bonus is inside the max. Mirror event `clean`, cue
    `clean`.
  - *Knockback chaining.* A KO is shoved `knockback` like a stun (it used to fall in place);
    `chainKnockback` stuns every other goon in `approach`/`telegraph`/`attack`/`recover` whose
    box overlaps the shove's path (old x → clamped new x, widened by both half-widths), for its
    own `stunTicks`, no hp, no movement, one pass. Not gulls, not `entering`, not the already
    reeling or fallen. Recorded as `BrawlFrame.bumps` (a tick per goon), which the mirror reads
    as `bump` events — a list on the frame, like `hits`/`kos`, rather than a diff of stun
    transitions, because a chained stun and a pecked stun look the same from the outside. Cue
    `bump`. Chaining was NOT narrowed to `approach`: the masher stayed in its bands (below).
  - *Hearts carried as worth.* `BRAWL_WORLD.heartWorth` 1. `resolveBrawlBlockWorth(result)` =
    `goons` + `hearts × heartWorth` when `outcome` is `cleared`, else `goons`; the runtime's
    `resolveGoonsDown` sums it, `resolveBrawlCourseTotal` adds `resolveBrawlHeartsTotal()` (3)
    per block, and the client's `resolveGoonsBanked` sums the same function so the live tally
    agrees with the referee the moment a block is banked. At the handoff beat the lit hearts go
    out one at a time (`resolveHeartsCarried`, progress 0.2 → 0.6) as the tally climbs by their
    worth, on both surfaces. KO and timeout bank no hearts.
  - *The room sees each waiting goon's side.* The TV's `WaveMeter` groups a wave's pips by
    `spawn.side` — left under ◀ at the strip's left end, right under ▶ at its right
    (`data-brawl-wave-side`, `data-brawl-wave-side-marker`) — and carries the clean star
    (`data-brawl-wave-star`, `data-clean`/`data-banked`). The tablet shows neither; the e2e
    asserts the sides are on the wall and absent from the arena.
  - *Copy.* The tally label is "Worth" (was "Down") on both rows; the finish plaque reads "N of
    M worth", the totals note "Full points at M worth", and `BlockHistory` rows "Handed off ·
    14 worth" with the hearts included.
  - *Totals.* Default seed, three blocks: `goonsTotal` 11 / 14 / 23 (7 + 4, 10 + 4, 17 + 6), the
    course 57 with hearts (was 34); the sandbox's two blocks 31 (was 17).
  - *Balance, before → after*, the masher over 200 seeds (`simulate/index.test.ts`): block 0
    133 → 133 of 200 cleared (66.5%, 1.47 → 1.48 hearts left on a clear), block 1 68 → 71
    (34% → 35.5%), block 2 8 → 12 (4% → 6%); the brawler bot still clears all three blocks on
    every seed. Both pinned bands (block 0 ≥ 55%, block 2 ≤ 10%) hold unchanged. Chaining is
    rare for both bots (0.06–0.25 bumps a block) because walkers queue `goonSpacing` 12 apart
    and a goose's knockback is 8; the brawler banks about two clean waves a block, the masher
    about 0.4 on block 0.
- **Depth pass, tier 2: the roster and the street (2026-10-02).** Features 4, 5, 7 and 8 of
  [docs/research/brawl-depth-and-strategy.md](../research/brawl-depth-and-strategy.md), drawn by
  one agent and wired by another; no new input.
  - *The swan* (`swan`, state `stalk`) and *the helmet goose* (`helmet`, `isBrawlGoonGuarded`,
    `BrawlFrame.clanks`) as §0.3 and §0.4 say. The stalk checks her facing before its reach, so
    the turn that steps her a unit out of reach still draws the hiss (the lunge, 2.2 × 18, covers
    it). A clank stays in `landed` — `landed` is "pecks that connected", which is what spends a
    peck — and the mirror tells it as `clank` instead of `land`.
  - *Hazards* (`BrawlBlock.hazard`, `BrawlFrame.dunks`): one per block by setting, dealt after the
    waves so block 0's goons did not move (the sandbox's first block is the street it was). A dunk
    is any shove of the struck goon whose path touches the span — into, across, or out of it.
  - *The wing* (`pickups`, `drops`, `wings`, `wingTicks` 360, `wingReach` 3,
    `resolveBrawlHeartsCap()` as the seam for a fourth heart). **Eaten standing still, not walked
    over** — the one rule tier 2 changed from the brief. Eaten on contact, the masher (pinned to
    the window's right edge, where every goon she kills lands) ate 1.96 wings a block 2 and
    cleared it on 100 of 200 seeds (was 12) against a band of 20 (10%). Standing (`walking === 0`)
    is Mother Russia Bleeds' own price (research M.4.4), reads on the tablet as "stop on it", and
    puts her back at 14.
  - *The course* (§0.4's table): block 1's first wave trades a goose for a swan; block 2's waves
    trade a goose for a helmet, a goose for a swan and the last wave's goose for a helmet.
    `goonsTotal` 11 / 15 / 26 on every seed (was 11 / 14 / 23 on the default one), course 61 (was
    57), the sandbox 32 (was 31). Tests pinned to the old layout and updated: the totals in
    `world/index.test.ts` and the e2e's "0 / 31"; the hand-built blocks gained `hazard: null`.
  - *Drawing*: `Swan`, `Helmet`, `Clank`, `Pickups/Wing`, `Hazards/*` (drawn by the art pass),
    wired as §0.8 says; `Goons/placeBox` and the provisional box heights deleted for
    `resolveGoonPlacement`; the swan's and the wing's palettes merged into `brawlGoonPalette`.
    New: `Hazards/Hazard`, `PickupLayer`, `DunkSplash`. The wave meter weights the two new kinds'
    pips as two. The host briefing gained one clause ("a goose in a helmet only feels a peck while
    it honks"); the ready hint did not — the TV teaches the swan's stalk and the cage.
  - *Sound*: `clank`, `hiss`, `dunk`, `splash`, `wing` (§0.10).
  - *Bots, over 200 seeds, cleared — before → after* (`simulate/index.test.ts`):

    | Bot | Block 0 | Block 1 | Block 2 |
    |---|---|---|---|
    | masher (holds right, pecks every 10 ticks) | 133 → 133 (66.5%, 1.48 → 1.48 hearts left) | 71 → 84 (35.5% → 42%) | 12 → 14 (6% → 7%) |
    | turner (holds toward the nearest goon, pecks every 10) | 182 → 182 (91%) | 157 → 146 (78.5% → 73%) | 93 → 93 (46.5%) |
    | brawler (faces the nearest, pecks in reach, waits out a guard) | 200 → 200 | 200 → 200 | 200 → 200 |

    The masher's bands (block 0 ≥ 55% with < 2.5 hearts left, block 2 ≤ 10%) hold unchanged; a
    new pin says the turner out-clears the masher on every block. The brawler's helmet rule
    barely fires (0.01 clanks a block before it learnt it) because it walks up to 14, where a
    helmet goose is already honking; it banks 25.9 of 26 on block 2 and eats 0.03 wings (it is
    rarely hurt). Dunks a block: masher 0.26 / 0.19 / 0.14, turner 1.2 / 1.3 / 0.75, brawler 1.3 /
    1.5 / 1.0 — a brawler fighting where the hazard is dunks without trying. The masher drops 1.6
    and 1.8 wings on blocks 1 and 2 and eats none; clanks a block 2: masher 0.36, turner 1.0.
- **Depth pass, tier 3: the handoff pick (2026-10-02).** Feature 10 of
  [docs/research/brawl-depth-and-strategy.md](../research/brawl-depth-and-strategy.md), built as
  its Gaiden-style variant only: spend banked worth on a fourth heart, or keep the three (§0.3).
  - *What was not built.* The research's alternative cards ("+1 worth on every goon this block")
    and its five-second default timer. One spend-or-save choice, at the breather, with no clock:
    keeping the three is what happens when nobody taps, and the first thumb on the street says it
    (principles §17 — the pick is a hold at the handoff, never a second decision mid-play).
  - *The price and the cap.* `heartPrice` is a rule (`minigameRules.brawl`, default 3, in
    `DEFAULT_BRAWL_RULES` and `content/sample/gameConfig.json`), not a `BRAWL_WORLD` number: it is a
    trade, not physics. `resolveBrawlBlockWorth` now counts carried hearts up to three
    (`resolveBrawlHeartsCarried`), so the bought heart never banks back and the course total stays
    61 (the sandbox's 32). A buy is strictly insurance: it costs 3 and can only ever save the heart
    she would have lost, so it is never the dominant pick (research table, row 10's "do not ship a
    pick that is strictly better").
  - *Sim.* `BrawlCourse.hearts` and `BrawlBlock.hearts` (§0.4); `createBrawlRunStart` starts from
    the block's hearts and `resolveBrawlHeartsCap(block)` — tier 2's seam — returns them, so a wing
    heals a bought block back to four. `resolveBrawlStartHearts(heartBought)` is the one place the
    three-or-four is decided. Nothing else in the sim moved, so the bots' bands are unchanged (a
    team that never buys plays the street it played before). On the sandbox seed, the mashing log
    the runtime tests use banks 5 on block 0 and goes to the bay on block 1 after 3 hits, or after
    4 and later with the heart bought.
  - *Runtime.* `buyHeart {}` (non-transient), refused unless the block in hand is `ready`, `blockIndex
    ≥ 1`, not bought, and `goonsDown ≥ heartPrice` (`canBuyBrawlHeart`, exported for the tablet).
    `BrawlMinigameBlock.heartBought`, view field `heartPrice`, `endBlock` re-runs a bought block on
    four. `resolveGoonsDown(blocks, heartPrice)` takes `heartPrice` off for every bought block
    (`resolveHeartsPaid`), a skipped one included; `resetTurn` deals fresh blocks, so every purchase
    is refunded with the turn. The turn to beat is the bank after its purchases.
  - *Client.* The cards (`Street/HeartPick`, `Street/heartOffer`), §0.6; the shared `HeartRow` draws
    three or four glyphs in both chromes; `resolveGoonsBanked` takes the price off so the paint loops'
    tally is the view's `goonsDown`; `resolveHeartsWorth` caps the hearts flying into the tally at
    three; the runner re-runs its log if the block's hearts change under a started clock (a buy whose
    echo lands after the first touch), and the mirror never carries a still on the line into a fight,
    so a buy and a first thumb in one render still start the wall on four. The TV's "*Name* bought
    a heart" callout, §0.7.
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
  | swan | 1 | 2 | 6×18 | 0.35 | 18 | 30 | 18 | 36 | 24 | 6 | 2.2 |
  | helmet | 1 | 2 | 5×14 | 0.5 | 14 | 30 | 16 | 30 | 24 | 8 | 2 |
  | boss | 4 | 4 | 8×22 | 0.45 | 28 | 36 | 20 | 40 | 12 | 5 | 2.4 |

  A goon's box is the half-width either side of its x. The hen: half-width 5, height 16, walk 0.9 a tick, margin
  10 from the camera's edges, start 30, peck delay 4 / live 10 / cooldown 14 / reach 10, hurt
  18, invulnerable 90, knockback 10, three hearts, koFall 45, camera unlock 1.5. The street:
  hazard width 24, a wing lies 360 ticks and is eaten within 5 + 3 standing still.
- **Scoring.** The default seed and three blocks put 7, 10 and 17 of goon worth on the street, 34
  in all (the first draft said 27); since the depth pass the course is 57 with its clean waves
  and hearts, and 49 of 57 is 13 of 15 points. Since tier 2 the kit is 7, 11 and 20 (38) on every
  seed and the course 61.
- **Cast: peck, hurt and ko** shipped on the hen rig, with a **stance layer**: the whole bird
  turned about its foot for the three poses a part alone cannot say (DESIGN.md §2.8). `rig.html`
  names them.
- **Host: GO ▶ is not a timed flash.** It shows whenever the camera is unlocked and the block is
  live, after the last wave too, because the handoff is off the tablet's right edge.
- **Controls: scheme B, halves, staged depth** (2026-10-02, docs/research/tablet-brawler-controls.md).
  The fixed-centre walk pad (left 35%, direction by the side of its centre) became a floating
  one-axis thumb on the left half — a hold walks the way she faces, a 30 px pull back turns her —
  because a resting thumb walked her backwards and a turn depended on a line nobody could feel.
  The peck zone is the right half and a held thumb repeats at the cooldown. The glyphs moved to
  mid height. Depth was not added as an input; goons are staged on three depth lines in the
  scene only and step onto her line before they matter (§0.8). The sim and the action log are
  unchanged.
- **Host: the body measured 89.9% of the tablet** (the Canvas figure, same as FAPPY's). The peck
  zone stops 5.5rem short of the arena's bottom edge so the dock's circle is clear of it.
- **Host: the paint loop owns the chrome numbers.** The hearts and the "Worth" tally are written
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
   hard one. Buying a heart is a commit too: the price leaves the bank on the tap, before a goose
   is in sight, and a skip after it does not give it back.
3. Hold beats: GO ▶, handoff, the bay, the bell — all client holds before the next demand.
4. Near miss: 53 of 61 worth is 13 of 15 points (the default seed's whole course is 61), and
   every wave has a star to lose on its last goose.
5. No hidden modifiers: the course is a published seed and the same for every team. A bought
   heart is on both screens — four glyphs in both chromes, "*Name* bought a heart" on the wall,
   the tally three lower — and the price is a rule, the same for every team.
6. ★ A terrible answer is plausible: walking into a goose is what everyone does; the KO is
   the geese carrying you to the bay, which is the joke.
7. Human judge: n/a (physics game); the host keeps skip, reset and override.
8. Failure is a punchline: the bay, the bell.
9. ★ Whole team: a block each, and the room is the lookout (10, 13). The handoff pick spends the
   whole team's bank — the worth a teammate before earned — so it is the team's call, argued at
   the handoff with the tablet changing hands.
10. ★ Information asymmetry: spectator-only. The TV's camera is wider than the tablet's on
    both sides, so the wall sees a goon step in from either edge before the holder does, and
    the telegraph before the lunge lands. It collapses goon by goon as each enters the tablet's frame, and hard at the KO.
11. Frame while playing: hearts, worth down, block of N, whose hands.
12. Standings on results only: `RunningTotals` in the readout once finished.
13. ★ Spectators' job: shout the side ("BEHIND YOU") — the wave meter tells the room which
    edge each waiting goon comes from before it steps in — and count the wave down.
14. Points land on the TV within a second: the worth tally in the marquee, written each frame.
15. ★ One verb line: "Walk with your left thumb, peck with your right. Clear the block, pass
    the tablet."
16. First team disadvantaged: block 0 is the easy one for everyone; opener rotation is the
    engine's.
17. One decision at a time: walk or peck, never a menu. The handoff pick is the one choice off
    the street and it is a hold, not a competing decision mid-play: it is only offered while the
    block is on the line, and the first thumb on the street closes it. No timer.
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
heard on the wall alone. Since the depth pass the wall's wave meter also says which edge every
WAITING goon of the wave will come from (§0.7), so the room's lead on a goon is the whole wave,
not the half second the camera gives it; the tablet never shows a side. The asymmetry collapses
goon by goon as each enters the tablet's frame, and hard at the bay or the bell.
`tests/e2e/brawl-sandbox.spec.ts` asserts that the wall sees a goon from each side before the
tablet does, and that the sides are on the wall's strip and nowhere on the tablet.
