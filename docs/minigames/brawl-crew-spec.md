# Streets of Barrie (BRAWL) — the whole team at once

Status: **Spec (draft)** — replaces the relay in [brawl-spec.md](brawl-spec.md) when built. Same
game, same id (`BRAWL`), same name; the relay's spec stays the record of what is in the code
until step 8 below folds this file into it.

Last updated: 2026-11-17 (steps 1–5 of §0.8 built: a team plays it from its own phones on the real street, with the wall's crew strip, wave meter, endings, sound and results — §0.10. Unplayed on real phones, the TV or the tablet. Steps 6–9 remain.)

> **§0 is the build plan; §1–§3 are the reasoning it rests on; §4 is what is still open.**
> Decisions are marked with whose they are: **(Brad)** is a call he made on 2026-11-16, in chat or
> on a question card; **(prototype)** is a value he played and called fine; everything else is
> mine and is his to overrule. The ones I most want overruled or confirmed are collected in §4.

## 0) Build plan

### 0.1 What ships

The active team's players are all on the street at once, each steering their own cast hen from
their own phone, eyes on the TV — the four-player arcade cabinet, with the phones as the sticks
**(Brad)**. Hens move left, right, up and down a shallow band of street **(Brad: free movement,
not lanes)**. Left thumb walks, right thumb pecks; there is still no third verb. Geese come in
waves from both edges, the camera locks until the wave is down, **GO ▶**, walk on. A hen out of
hearts lies where she fell until a teammate stands over her **(Brad)**. A player with no phone
sits the fight out and the street is furnished for the hens that showed up **(Brad)**.

Three blocks a turn (Dunlop, the waterfront, Centennial Beach), each harder than the last, as
today. The team's points are the worth it banked over the worth of the course it was dealt.

What goes: the tablet passing from hand to hand, the handoff line, the buy-a-heart pick, the
TV's wider-than-the-tablet camera, the input log and its referee. What stays: the goon roster and
its rules, the hazards, the wing drop, the wave lock, worth-not-count scoring, the bay.

### 0.2 What the prototype settled

`/dev/lab/brawl-street` and `/dev/lab/brawl-pad`: a throwaway prototype, since removed — it is in
the history at commit `fbce4b18` (`apps/client/src/components/BrawlProtoLab`, and a relay in
`apps/server/src/socketServer/protoBrawlPad`). Brad played it on 2026-11-16.

- **Free 2-D movement, not three lanes (Brad).**
- **The lag is fine as it is (Brad).** The prototype relays a pad's state through the server to
  the page that runs the fight, with no buffering: about 10 ms round trip on the laptop alone
  (measured headless), unmeasured as a number on his phone and screen. §0.5 keeps the same hops
  and adds no buffer, so the build should feel like the prototype did.
- **The forgiving rules remove the genre's failure (measured, headless, a hen holding peck for
  12 s per setting).** Reach ±7 in depth with auto-align and geese lining up: 6 of 20 pecks
  landed, **0 missed on depth**. Reach ±2 with neither: 4 of 19 landed, **12 missed on depth**.
  The October research predicted exactly this (docs/research/tablet-brawler-controls.md 3.1–3.3,
  scheme C); the reversal of its "no depth input" recommendation is §2.
- **The pad (prototype):** a floating stick on the left half — the centre is wherever the thumb
  lands and follows a thumb that outruns it, 56 px to full speed, the inner 20% is standing — and
  the whole right half is PECK, on touch and repeating while held.

Not settled by it: anything about five pads at once (it was played with one or two), the size of
the window, and the 8-way stick of §0.3.

### 0.3 Locked decisions

- **The crew is who taps in.** While a block is `ready`, every phone on the active team shows
  one button: **STEP OUT**. Tapping it walks that player's hen onto the street on the TV. The
  crew is the hens on the street when the block starts, in the order they stepped out (slot 0,
  1, 2 …); a phone that arrives late steps out before the next block. Nobody is dealt in by a
  connection flag, so the sim never has to know who is connected, and the room watches the team
  assemble. A player who never taps is the player with no phone: she sits out **(Brad)**.
- **The host starts block one; the crew starts the rest.** Block 0 begins on the host's
  **Start** (the room's commit, with the crew on the wall). Blocks 1 and 2 begin on the first
  crew thumb after the block-end beat has held for `readyHoldMs` (2.5 s, on the server's clock),
  the relay's "first thumb on the street" rule. Nothing advances the phase.
- **A stick with eight directions, at full speed.** The pad quantises the thumb to one of eight
  directions or standing, and sends only when that changes. Arcade brawlers were eight-way; it
  keeps the sim free of square roots (two fixed diagonal components, §0.4) and it keeps a
  thumb's traffic to a few messages a second instead of sixty. The prototype is analog — this
  is the one control decision Brad has not felt (§4.3).
- **Facing follows the stick's left or right, never the peck.** Unchanged. A goose behind a hen
  still needs a turn, and the peck's box still runs from her back edge to `peckReach` past her
  front, so a mashing hen still answers "BEHIND YOU" by accident.
- **A peck reaches ±7 in depth and slides her onto the goose's line (prototype).** On the
  press, the nearest standing goon in the peck's reach and within `peckDepthBand` of her line is
  her target for that peck, and she moves toward its line at `alignSpeed` while the peck is out.
  One peck, one goon, as today.
- **Goons line up, then close.** Every goon has a target hen. It gets onto her line from a
  standoff (`reach + 8` away) and only then walks in, telegraphs and lunges along that line; its
  lunge hurts any hen within ±4 of its line. This is the classic script (research 3.3) and it
  is what makes a goon readable on a street with depth. A goon picks the up, awake hen with the
  fewest goons already on her (ties: nearest), and re-picks only when its target goes down or
  away. Everyone gets geese.
- **Three hearts, then down.** A hit costs a heart, shoves her, reels her, shuts her peck and
  leaves her invulnerable for the window, all as today. Out of hearts she is **down** where she
  fell. Geese ignore a downed hen.
- **A teammate revives her by standing over her (Brad).** An up hen who stands still (stick
  centred, not pecking, not reeling) within reach of a downed one for `reviveTicks` (90, a second
  and a half) gets her up on one heart, invulnerable for the window. A hit on the reviver starts
  the count again. Standing still in a fight is the price, the same price the wing drop charges.
  There is no limit on revives.
- **Everyone down at once loses the block, not the turn (Brad).** The geese carry the whole
  crew to the bay (the punchline, now a group shot), what the block banked stays, and the next
  block starts with every hen up on three hearts. On the last block it ends the turn. A crew of
  one has nobody to revive her, so going down is the wipe — which is exactly today's relay rule.
- **Away, not abandoned.** A hen whose pad has been neutral (stick centred, peck up) with no
  message for `awayTicks` (600, ten seconds) sits down: untargeted, unhurt, not counted toward
  "everyone down". Any input stands her up. It is read off the inputs alone, so it needs no
  connection flag, and a phone that dies mid-fight costs the team a hen, not the block.
- **The street is furnished for the crew.** A block's kit is fixed by its index and the crew's
  size `n` when it starts; the seed still only deals the order (§0.4). Scoring is against that
  kit's own total, so a crew of three and a crew of five are each marked out of what they were
  dealt. No hidden modifier: the count is on the wave meter.
- **Worth, not count — per hen where it used to be per player.** Goon worth is unchanged. A
  wave banks `cleanWaveBonus` (2) for **each hen up at its end who was not hit in it** (it was 2
  for the one hen). A cleared block banks `heartWorth` (1) per heart for each hen up at the
  clear, to three each. A lost block banks no hearts.
- **No friendly fire, no hen collisions.** Hens walk through each other; a peck never touches a
  teammate. The depth is what lets them share a street; a body-block between drunk friends is
  a different game.
- **The camera follows the lead hen and nobody blocks it.** Locked per wave, as today. Between
  waves it follows the up hen furthest along once she is past `cameraLeadShare`, and every hen
  is kept inside the window: one at the left edge is walked along by it, a downed one is slid
  along it, so nobody is ever left behind where she cannot be revived. The block is cleared when
  the last wave is down and **any** up hen reaches the exit line.
- **Phones are pads; the wall is the game.** A crew phone draws no street (§0.6). The TV is the
  one picture, and the only speaker.
- **A team with no phones plays the relay on the new street.** A round the host set to `tablet`,
  or a team with nobody stepped out when the host presses Start, plays one hen per block on the
  tablet, a block each in roster order, with the pad drawn over the scene — today's shape, on the
  street with depth. It is also what the teaser site runs (§0.7). The tablet is never a pad
  beside phones. §4.2.
- **Escape hatches:** `skipBlock` and `resetTurn`, the host's, as today. `buyHeart` and
  `endBlock` are gone (the server sees the block end itself, §0.5).

### 0.4 The sim (`packages/shared/src/brawl`)

Built **beside** the relay's sim, in `packages/shared/src/brawl/crew/` under `BrawlCrew*` names
(`BRAWL_CREW_WORLD`, `stepBrawlCrew` …), so every step's gate stays green while the runtime and
the surfaces still run the relay; the relay's sim is deleted, and the names shortened, when the
last of them has moved (step 8). `types.ts` is written first and is the contract. Still pure, tick-stepped at
60 Hz, seeded, integer-friendly and under `noTranscendentals.test.ts` — the server and every
screen step this sim and must land on the same bits.

```ts
BRAWL_WORLD (changed or new; everything not listed keeps its value)
  width: 192; height: 108;          // the one window; there is no narrower tablet camera now (§4.4)
  depth: 32;                        // the walkable band: z = 0 at the back, `depth` nearest the camera
  henWalkSpeed: 0.9;                // along the street
  henDepthSpeed: 0.63;              // 70% of it, up and down (prototype)
  henDiagonalX: 0.64; henDiagonalZ: 0.45;   // the two fixed diagonal components: no sqrt at run time
  peckWalkShare: 0.4;               // she still drifts while the peck is out (prototype)
  peckDepthBand: 7;                 // (prototype)
  alignSpeed: 1.2;                  // units a tick toward her target's line while the peck is out (prototype)
  goonHitBand: 4; goonLineBand: 4;  // a lunge hurts within this of its line; a goon honks from within it
  goonStandoff: 8;                  // past its reach, where a goon gets on the line
  reviveTicks: 90; reviveReach: 12; // standing over her: |dx| ≤ reviveReach, |dz| ≤ peckDepthBand
  reviveHearts: 1;
  awayTicks: 600;
  blockTicks: 90 s × 60;            // was 75 s: more geese to get through
  eventWindowTicks: 120;            // how long an event stays in the frame (below)
```

```ts
type BrawlWalk = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;         // standing, then eight directions clockwise from east
type BrawlInput =
  | { tick: number; hen: number; kind: "walk"; dir: BrawlWalk }
  | { tick: number; hen: number; kind: "peck"; held: boolean };   // a press pecks; held repeats at the sim's rate

type BrawlHen = {
  slot: number; x: number; z: number; facing: -1 | 1; walk: BrawlWalk; peckHeld: boolean;
  hearts: number; state: "up" | "down" | "away";
  peckUntilTick: number; peckCooldownUntilTick: number; alignZ: number | null;
  hurtUntilTick: number; invulnerableUntilTick: number;
  reviveSinceTick: number | null;        // on the DOWNED hen: when the count over her began
  lastInputTick: number; hitInWave: boolean;
  stats: { goons: number; worth: number; hits: number; downs: number; revives: number };
};

type BrawlGoon = { /* today's fields */ z: number; target: number | null };
type BrawlFrame = {
  tick: number; hens: BrawlHen[]; goons: BrawlGoon[]; pickups: BrawlPickup[];
  cameraX: number; cameraLocked: boolean; wave: number; waveOpenedTick: number;
  banked: number; outcome: "cleared" | "wipe" | "timeout" | null;
  events: BrawlEvent[];                  // { tick; kind: "hit" | "ko" | "clank" | "dunk" | "bump" | "wing" | "down" | "revive" | "bonus"; hen?; spawnIndex? }
};

resolveBrawlBlock(course: { seed; blocks; block; crew: number }) => BrawlBlock
createBrawlStart(block: BrawlBlock) => BrawlFrame
stepBrawl(frame, block, inputs: readonly BrawlInput[]) => BrawlFrame      // one tick; reads the inputs AT frame.tick
advanceBrawl(frame, block, inputs, toTick) => BrawlFrame                  // steps to toTick or a terminal frame
resolveBrawlBlockTotal(block) => number                                   // goons + waves × cleanWaveBonus × crew + hearts × crew
```

Rules the sim keeps, beyond §0.3:

- **Events are a window, not a history.** The relay's ever-growing tick arrays (`hits`, `kos`,
  `clanks` …) become one `events` list pruned of anything older than `eventWindowTicks`. The
  frame is sent whole, often (§0.5); it must stay a few kilobytes at tick 5,000 as at tick 50.
  Scores and stats are scalars and are never pruned.
- **The kit by crew size.** For a wave whose relay count is `base`: `base + ceil(base × 0.6 ×
  (n − 1))` goons, so block 0's first wave is 3, 5, 7, 9, 11 for a crew of 1 to 5. Gulls,
  raccoons, swans and helmet geese are `relayCount × ceil(n / 2)`; the rest are geese. The boss
  has `4 + 2 × (n − 1)` hp and is still one boss. At most `2 + n` goons stand on the street at
  once; a wave's later goons wait at the edge for a place. `0.6` is a starting value and is
  pinned by bots (§0.9).
- **The roster's rules are per target.** The swan stalks the hen it is on while SHE faces it
  and hisses the tick she turns her back; a teammate may peck it while it stalks, which is the
  co-op answer the relay could not have. The helmet goose clanks any peck that lands while its
  guard is down, whoever threw it. The raccoon charges along its line. The gull dives at its
  target's line and is drawn with a shadow on that line from the moment it arrives (research
  3.4: a flier nobody can place in depth is "insanely frustrating to fight").
- **Shoves stay along the street.** A pecked goon is knocked back in x only, the way she faces.
  The chain stuns standing walkers whose box its path crosses **within `peckDepthBand` of its
  line**. Hazards span the whole depth of the band, so "shove it into the bay" is still a
  question of left and right. Gulls and the boss are still never dunked.
- **The wing** is eaten by any up hen standing still on it with a heart to fill.
- **Layout from the seed**, as today: the mix is the rule and only the order and the sides are
  dealt, from a stream per block. A goon's starting depth is dealt too.

### 0.5 Who runs the fight

Today the device in hand steps the sim, the server re-runs its input log at `endBlock`, and the
TV replays the log six ticks behind. With a crew there is no device in hand. So:

- **The reducer is the sequencer and holds the frame.** Runtime state carries the block's
  authoritative `BrawlFrame` and `startedAtMs`. Every action arrives with the server's
  `receivedAtMs` (already on every envelope); the reducer turns it into a tick
  (`floor((receivedAtMs − startedAtMs) × 60 / 1000)`), advances the frame to that tick, applies
  the input there, and stores the frame. There is no log and no referee: the stored frame IS
  the server's reading, and it is the one that scores.
- **A pad says who it is by its seat, not its payload.** `MinigameRuntimeActionEnvelope` gains
  `actorPlayerId?: string`, stamped by the server from the face the sending socket holds, absent
  on a host action. The reducer maps it to a hen. Nothing a phone sends names a player.
- **The server pulses when the thumbs are quiet.** `selectDeadlineAction` asks for a `pulse`
  half a second past the frame's tick while a block runs. An input arriving first moves the
  state and the deadline with it, so pulses only fire in a lull. A pulse advances the frame —
  which is how a wave going down, a wipe or the tick cap is noticed with no device reporting it
  — and gives every screen a fresh frame at least twice a second.
- **Every screen extrapolates from the latest frame.** The view carries the frame. A screen
  keeps the newest one it has, steps its own copy forward at 60 Hz, and when a newer frame
  lands, adopts it and steps from there. It never reads a wall clock: it anchors "tick K" to its
  own `performance.now()` at the earliest-arriving sample, so a tablet whose clock is a minute
  off still mirrors exactly. Between frames the only thing a screen can be wrong about is an
  input it has not heard yet, for the one network hop it takes to arrive: a hen drawn a tick or
  two (under two units) from where she is, corrected on the next frame.
- **Rehydration is free.** A snapshot holds the frame and nothing else is needed, so a TV that
  reloads mid-fight is back in one message (AGENTS.md §2).
- **The beats are the screens', the clock is the server's.** The fight never pauses for a hit:
  the hit-pause becomes shake and flash, drawn over a sim that keeps going. The block-end beats
  (cleared, the bay, the bell) hold over a frame that is already terminal, as today.

`walk`, `peck`, `stepOut` and `pulse` are `transientActionTypes` (never the host's undo point).

**The load is the thing to measure first.** Each input is a room-state mutation and a snapshot
to the TV and the tablet (phones are spared: their snapshot only changes when a heart does,
§0.6, and an unchanged role is not re-sent). Five frantic thumbs at eight-way are about 50
inputs a second at the very worst, each carrying a frame of a few kilobytes. DRAWING already
streams 14 a second this way. Step 3 measures the server and the TV under five scripted pads
before any surface is built; if it is too much, the fix is to coalesce the BROADCAST (not the
reduction) to one per two ticks with the existing `createTrailingCoalescer`, which costs at most
33 ms and caps the traffic at 30 a second whatever the crew does.

### 0.6 Views, actions and the phones

```ts
type BrawlCrewMember = { player: BrawlPlayerFigure; slot: number };          // slot is the order she stepped out
type BrawlBlockView = {
  blockIndex: number; status: "ready" | "running" | "done";
  crew: BrawlCrewMember[]; crewSize: number | null;                          // locked when it starts
  startedAtMs: number | null; readyAtMs: number | null;                      // the hold before a crew thumb may start it
  frame: BrawlFrame | null; outcome: BrawlOutcome | null; banked: number; total: number; skipped: boolean;
};
type BrawlMinigameViewFields = {
  minigame: "BRAWL"; phase: "ready" | "running" | "finished"; mode: "crew" | "tablet";
  blockIndex: number; blocksPerTurn: number; courseSeed: number; blocks: BrawlBlockView[];
  banked: number; total: number;            // total: the blocks played at their own crew size, the rest at the current one
  points: number | null; bestTurn: BrawlBestTurn | null;
  turnStats: Record<string, BrawlHen["stats"]> | null;   // by playerId, once finished: the results card's names
};
```

Host view equals display view, pinned by test, as for every arcade game.

Actions: `stepOut {}` (phone; a team player, block `ready`), `walk { dir }`, `peck { held }`
(phone, or the tablet's own hen in tablet mode), `startBlock {}` (host any time a block is
ready; or a crew phone on blocks ≥ 1 after `readyAtMs`), `pulse {}` (server), `skipBlock {}`,
`resetTurn {}` (host). Rules (`minigameRules.brawl`): `blocksPerTurn` (3), `courseSeed`
(20261001); `heartPrice` is removed.

The phone plumbing changes, and AGENTS.md §3.5 changes with it in the same commit:

- **A crew is not a contestant.** `selectContestant` models one player holding one leg, with a
  single log writer. BRAWL stops implementing it and implements a new hook, `selectCrew`: the
  players whose phones may send `contestantActionTypes` now (the active team's roster while a
  block is ready or running), which of them have stepped out, and each one's pad state.
  `CREW_MINIGAME_TYPES = ["BRAWL"]` sits beside `CONTESTANT_MINIGAME_TYPES` and the registry
  test pins the hook to the list the same way.
- **`RoomState.crewTurn`**, server-derived after every mutation like `contestantTurn`, and added
  to `PLAYER_SAFE_ROOM_STATE_KEYS`: `{ minigame, deviceMode, playerIds, pads: Record<playerId,
  { slot; hearts; state: "out" | "up" | "down" | "away" }>, blockStatus }`. It changes only when
  somebody steps out, loses a heart, goes down or gets up — a handful of times a block — so the
  phones' snapshot is quiet while the wall's is busy.
- **`player:minigameAction`** is authorized for a crew game by membership of
  `crewTurn.playerIds` in place of "holds the leg in hand". Everything else about the road is
  unchanged: the guard, the refusal reasons, `applyMinigameAction`, and the token bucket (its
  burst is 40; step 2 checks its refill against a thumb at eight-way).
- **The phone mounts a pad, not the game.** `MinigameRendererBundle` gains an optional
  `PadSurface` (props: this player's pad state, the team's colour, `onDispatchAction`). The
  phone shell draws it inside `PhoneGameFrame` whenever `crewTurn` names this player. It is the
  prototype's pad: STEP OUT while `out`; then the stick and PECK, the player's slot colour
  across the top with their hearts; dimmed with **DOWN — shout for a teammate** while down. It
  vibrates on a hit where the phone can (Android; Safari cannot). No scene, no sound.
- **The tablet in a crew turn** mounts no runner. It mirrors the wall inside `<SilentSurface>`
  (the `ContestantPhoneMonitor` pattern) and keeps Start, Skip block and Reset turn, with a line
  saying who has stepped out and who has not.

### 0.7 The wall, the scene, solo

- **`DisplayBrawlSurface`.** The marquee as today (game name, team, the block's own cap as its
  clock line, the worth tally, the wave meter with its sides). New: a **crew strip** — each
  hen's head in its slot colour with her hearts, greyed when down, absent when sat out — and
  the **ready beat**: the hens that have stepped out standing on the line, the names that have
  not, and nothing else moving until Start.
- **`BrawlScene`.** The ground becomes the band: figures are drawn back to front by `z`, each
  on a shadow at its own foot (the only depth cue a flat brawler gets). Every hen stands in a
  ring of her slot colour with her name over her head; the team's colour is still the bird's
  whole paint and her head is still her own. A downed hen lies in the cast's `ko` pose with the
  revive count drawn as a ring closing round her. An away hen sits, dimmed. No new cast pose is
  needed. Backdrops (Dunlop, Waterfront, Beach) are redrawn to the 192×108 window with the
  street as a band, and hazards span it.
- **Tablet mode and solo are one surface.** `HostBrawlSurface` in tablet mode (seat `host`) and
  on the teaser (seat `solo`) runs a crew of one: the scene with the pad's two halves drawn
  over it, exactly the prototype's stick and peck. The reducer is the same reducer; where there
  is no server (`TeaserSoloGame`, the dev sandbox's `SandboxStage`) the page has to stamp
  `receivedAtMs` and fire the pulse itself. Both files already mention one or the other; I have
  not read how far they go, and step 2 does.

### 0.8 Order of work (each step ends with the gate green)

Gate: `pnpm lint && pnpm typecheck && pnpm test`, plus the Playwright suite for any client,
minigame `.tsx` or `tests/e2e` change (CLAUDE.md). Steps 1–3 touch no surface.

1. **The sim. DONE 2026-11-16 (§0.10).** `types.ts`, then `world`, then `simulate`, with the bots
   and the balance pins of §0.9, beside the relay's sim rather than over it.
2. **The seams. DONE 2026-11-16 (§0.10).** `actorPlayerId` on the envelope; `selectCrew`, `CREW_MINIGAME_TYPES`,
   `crewTurn`, the allow-list key, crew authorization of `player:minigameAction`; `PadSurface`
   on the bundle; AGENTS.md §3.5. Confirm the sandbox and the teaser fire a deadline action.
3. **The runtime. DONE 2026-11-16 (§0.10), with interim screens.** The reducer as sequencer, the pulse, views, scoring, round memory, rules.
   **Then measure the load** (§0.5) with five scripted pads through the real socket, and add the
   coalescer only if the numbers ask for it.
4. **The scene. DONE 2026-11-17 (§0.10).** Band, depth sort, shadows, rings and names, revive ring, redrawn backdrops.
5. **The surfaces. DONE 2026-11-17 (§0.10).** Display, pad, the tablet's monitor; the phone shell's crew branch.
6. **Tablet mode and solo.** One hen on the tablet and on the teaser.
7. **E2E and the sandbox.** `/dev/minigame/brawl` grows pads you can add (keyboard-driven, and
   a bot hen on a button, MOUNT's precedent); `tests/e2e/brawl-sandbox.spec.ts` is rewritten.
8. **Docs and the clean-up.** Fold this file into `brawl-spec.md` as built; README row;
   `DESIGN.md` §2.14; the principles' worked example; delete the relay's sim and its leftover
   scene files. (The prototype is already gone: removed 2026-11-17, before the merge to main.)
9. **A table.** Five real phones on the party Wi-Fi and the real TV. §4's tuning list.

### 0.9 Tests that pin it

- **Determinism:** the server's frame and a screen stepping from any earlier frame with the
  same inputs agree to the bit (the property the whole of §0.5 rests on), across every block and
  crew size, over 200 seeds.
- **Balance, by bot, per crew size 1–5:** a crew of mashers (hold right, hold peck) clears block
  0 about two times in three and block 2 rarely — the relay's floor, kept at every `n` — and a
  crew of brawler bots (turn to face, peck into the honk, revive the nearest downed teammate)
  clears all three. This is what sets `0.6`, the standing cap and the boss's hp.
- **Depth:** a hen holding peck among lined-up geese misses none on depth (the prototype's
  number, now a pin).
- **Revive:** the count restarts on a hit; two revivers do not halve it; a wipe is every
  non-away hen down on one tick; a crew of one going down is a wipe.
- **Phones:** a face not on the active team is refused; a payload cannot name another player's
  hen; host view equals display view; the PLAYER snapshot does not move on a `walk`.

### 0.10 As built

**Step 1, the sim (2026-11-16).** `packages/shared/src/brawl/crew/{types.ts, world, simulate,
bots}`, exported from `@wingnight/shared`. 46 tests; the relay's sim and its tests are untouched.
Where the build moved off §0.3–§0.4:

- **A held thumb pecks slower than a pressed one.** `peckHoldRestTicks` (6): a fresh press opens a
  peck the tick the cooldown allows, a thumb merely left down waits six ticks longer, so holding is
  live half the time — the relay's "a mash lands every other press", for a pad that repeats by
  itself. Without it a crew holding PECK was a wall: mashers cleared block 2 up to 70% of the time.
  A press inside the cooldown is kept for `peckBufferTicks` (10), as the prototype did.
- **Goons queue only behind goons on the same hen.** The relay's queue rule, carried over as
  written, deadlocked: two goons on different hens can each stand between the other and its hen,
  and each waited for the other until the bell. Found by the bots (one block in 300); pinned by
  "never leaves a crew that plays properly waiting for the bell".
- **The sim banks the hearts.** `banked` on the terminal frame of a cleared block already includes
  what the hens still up carry off; the relay left that sum to the runtime.
- **One lunge goes through every hen on its line.** Not a rule I wrote down in §0.3, but it falls
  out of "a lunge hurts any hen within ±4 of its line", and it is the right consequence: five hens
  stood in a row lose five hearts to one goose. It is also the one way the brawler bots ever lost.
- **A gull has no standoff.** It flies straight for the spot above its hen's line and dives from
  its reach; only walkers line up from a distance.

What the bots measured (crews of one to five, the default kit, 200 seeds a cell for the mashers
and 300 for the brawlers; the tests pin looser bands over 60):

| A crew of mashers (hold right, hold peck) clears | n = 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| block 0 | 77% | 95% | 96% | 90% | 66% |
| block 1 | 49% | 78% | 72% | 57% | 35% |
| block 2 | 9% | 25% | 19% | 13% | 5% |

A crew of one lands close to the relay's own floor (67%, 40%, 7%). Pairs and threes find mashing
easier than that and fives harder; `0.6` and the standing cap are left where §0.4 put them, because
a masher crew is not how five people play and the table (step 9) is the better judge of the
spread. A crew of brawlers cleared all 4,500 blocks, banking 93–100% of each.

Two numbers for §0.5's load question, from five brawler bots on block 2: the frame never exceeded
**4.7 kB** as JSON, and the crew sent **21 inputs a second** between them. A block steps in 1–4 ms
on the laptop, so the reducer advancing the frame on every input is nothing.

**Step 2, the seams (2026-11-16).** No game uses them yet; BRAWL is still the relay until step 3.

- `MinigameRuntimeActionEnvelope.actorPlayerId`, stamped in `applyMinigameAction` from the face a
  phone's socket holds (`dispatchContestantMinigameAction`); pinned by a test whose payload tries
  to name another player.
- `selectCrew` and `MinigameCrew` on the plugin contract; `CrewTurn`, `CrewPad` and
  `CREW_MINIGAME_TYPES` (empty) in `packages/shared/src/crewTurn`; `RoomState.crewTurn`, derived
  in `apps/server/src/roomState/crewTurnState` and on the display's and the players' allow-lists;
  `not_in_crew` among the refusal reasons; `PadSurface` and `MinigamePadRendererProps` on the
  renderer bundle. AGENTS.md §3.4 and §3.5 say all of it.
- **`crewTurn` carries a `status`** (`ready`, `running`, `done`) rather than §0.6's `blockStatus`:
  the room's word for it should not be BRAWL's.
- **The tablet is not refused anything in a crew turn.** §0.6 did not say; the server leaves the
  host's `minigame:action` alone and the reducer decides what an input with no actor is (the
  tablet's own hen, which only exists in tablet mode). `startBlock` has to be sendable by both,
  so a blanket "phones' actions are the phones'" rule, the relays' rule, cannot hold here.
- **Found, for step 3:** the dev sandbox (`SandboxStage`) and the teaser (`TeaserSoloGame`) both
  stamp `receivedAtMs` but neither fires a game's `selectDeadlineAction` — FAPPY's tablet sends
  its own `timeOut`. The pulse of §0.5 therefore needs a small deadline loop in both shells, or
  solo BRAWL never notices a wave go down between inputs.
- **Left for step 3:** `CREW_MINIGAME_TYPES` gains `BRAWL` and `CONTESTANT_MINIGAME_TYPES` loses
  it in the same change that swaps the runtime, and the tablet's device-mode list
  (`selectDeviceModeRounds`, typed to `ContestantMinigameType`) moves to `isPhoneMinigameType`
  with it. Doing either now would break the registry's pin or the relay.

**Step 3, the runtime (2026-11-16).** Done in place: `BRAWL` is the crew game now and the relay is
gone from the runtime, the views and the lists. 25 runtime tests, 8 through the room
(`apps/server/src/roomState/crewTurnFlow.test.ts`).

- **The reducer is the sequencer**, as §0.5 says: `packages/minigames/brawl/src/runtime`. Actions
  are `stepOut`, `walk { dir }`, `peck { held }` (phones, or the tablet's own hen), `startBlock`,
  `skipBlock`, `resetTurn` (host) and `pulse` (server).
- **Ticks are counted by multiplying first.** `floor(ms × 60 / 1000)`, never `floor(ms / (1000 /
  60))`: 250 ms is tick 15, and the second form makes it 14.999… and floors it to 14. Found when a
  test's clock stopped moving; pinned by its own test.
- **`startBlock` is the host's alone.** §0.6 let a crew phone send it on later blocks; instead a
  crew member's first `walk` or `peck` after `readyAtMs` starts the block and is already in it,
  which is what §0.3 described. A skipped block leaves no beat to hold.
- **The turn to beat is a share, not a sum** (`BrawlBestTurn = { banked, total }`), compared by
  cross-multiplying: a crew of five is dealt more than a crew of three.
- **Screens are INTERIM, and steps 4–6 exist in sketch form.** The relay's surfaces, runner,
  mirror and sound hooks are deleted. In their place: `useCrewFrame` (the extrapolation of §0.5,
  with `resolveCrewAnchor` as its rule), `CrewScene` (a plain night street with every hen in her
  player's head and slot ring, and the relay's own goon drawings on their lines), `CrewPad` (the
  prototype's two thumbs, eight-way), `DisplayBrawlSurface`, `HostBrawlSurface` (the host's
  monitor in a crew's fight; the pad laid over the street when the block is the tablet's — which
  is tablet mode and the teaser's solo game, working) and `PadBrawlSurface` (the phone's pad).
  The relay's backdrops, hazards, beats and wave meter are still in the package, unused, for
  step 4 to redraw from.
- **A phone could not play it at this point** — `PadBrawlSurface` was on the bundle with no
  shell to mount it. That came next (below).
- **No sound.** The relay's sound hooks read its mirror and went with it; the cue table
  (`client/audio`) is kept. Step 5 wires it to the frame's `events`.
- **A page that is its own server keeps a game's clock.** `useRuntimeDeadline`
  (`apps/client/src/utils`) fires `selectDeadlineAction` in the dev sandbox and the teaser, as
  the server's scheduler does. Main gained that hook the same night, for Slingshlong's next
  shooter (`f0da918a`); this branch had written its own and dropped it for main's at the merge.
- **E2E.** The relay's 724-line sandbox spec is replaced by five tests of the pipeline
  (`tests/e2e/brawl-sandbox.spec.ts`); the relay-on-a-phone BRAWL test in
  `contestant-phones.spec.ts` is removed. Step 7 writes the real ones, phones included.
- **Do not deploy the teaser from this branch**: its Streets of Barrie is the interim sketch.
- **Still describing the relay:** `DESIGN.md` §2.14 and the roadmap row. Step 8.

**The load, measured** (§0.5's question). Five scripted pads through the real server and socket
(Quick Play, block one of a crew of five), on the laptop that will drive the TV, with a real
`/display` page in headless Chromium at 1920×1080 timing its own frames in the second run:

| | Five skilled bots | Five frantic thumbs |
|---|---|---|
| Inputs a second, all pads | 33 | 100 |
| Refused | 0 | 0 |
| Server CPU, share of one core | 4% | 13% |
| Snapshots a second to the TV | 32 | 100 |
| One snapshot (whole room, JSON) | 9 kB | 7 kB |
| To the TV, a second | 0.3 MB | 0.8 MB |
| Ack, median / 95th | 4 ms / 27 ms | 14 ms / 75 ms |
| TV frame, median / 95th | not run | 8 ms / 17 ms |
| TV frames over 33 ms | not run | 1 of 2,690 |

"Frantic" is a stick moved eight times a second and a peck mashed at six, per player — above
what a thumb does, and still under the per-face token bucket (30 a second), so nothing was
refused. **The coalescer of §0.5 is not needed** for the server or the TV and is not built. The
ack times are measured inside the script that is also running five bots, so they overstate the
server's own latency. What was NOT measured: a real phone's Wi-Fi hop, and the host tablet, an
Android device that receives the same hundred snapshots a second in the worst case and has less
to spend on them than the laptop. If the tablet struggles at the table, coalescing the broadcast
to thirty a second is still the fix and costs at most 33 ms.

**Step 5, the phones' half, ahead of step 4 (2026-11-16, Brad's call: "phones first").** A team
plays it from its own phones now; the art is still the interim street.

- **The phone shell has a crew branch.** `resolvePhoneTurn` gains two roles off `crewTurn`:
  `crewBriefing` (the whole team is told what to pick up — "Everybody plays this one at once")
  and `pad`. A `pad` phone mounts `PlayerPhone/CrewPadScreen`: the game's own `PadSurface`, the
  whole screen, at the phone's real size (a thumb's travel is in real pixels, so it is not put on
  the scaled canvas a relay's game is), under a turn-it-sideways card. Its inputs go out as
  `player:minigameAction` through `contestantLeg.dispatchTo` — no host view is ever sent to it.
- **The briefing says phones.** `resolveBriefingHandset` takes a relay's turn or a crew's, so the
  TV's "Grab your phones" and the tablet's briefing copy follow a crew turn's device mode too.
- **The pad measures a thumb in its own pixels** (`resolveLocalPoint`), so the stick's ring lands
  under the thumb when the pad is drawn scaled — the sandbox's device frame was the case that
  showed it.
- **The scene fits its box by seat:** `cover` on the wall (a wide arena gives up sky from the top,
  never street from the bottom) and `contain` on the tablet (the whole window, so no hen is off
  the side). A hen's name is kept inside the window's edges.
- **A second stack can serve phones.** `VITE_SOCKET_SERVER_PORT` (`resolveServerOrigin`) moves
  only the server's port, at whatever host the page was opened on; launch entries
  `wing-night-second-server` (3200) and `wing-night-second-client` (5373) use it. Needed here
  because another stack holds 3000 and 5173, and a fixed server URL would pin every phone to
  `localhost`. The prototype's own port variable is gone; the labs use the same resolver.
- **E2E:** `contestant-phones.spec.ts` plays it across four devices — the TV sends the team to
  their phones, two phones step out in turn and the wall shows the crew assembling, the tablet
  starts the fight and stays a monitor, and each thumb moves its own hen on the wall at once.
- **Left for the rest of step 5** (built the next day, below): the wall's crew strip, wave meter
  and ending callouts; sound from `frame.events`; the turn's results card.
  **Unmeasured still:** a real phone on the party Wi-Fi, and the Android tablet as monitor.

**Step 4, the scene, and the rest of step 5 — the wall's extras, sound, results (2026-11-17).**
Built together and landed as one change, with the gate run once over both: the scene's last
piece (the endings) and the wall's callouts for them could not be told apart cleanly enough to
split. The street is the real one on both screens; the relay's client is gone. Gate green
(`pnpm lint && pnpm typecheck && pnpm test`, each on its exit code) and the Playwright suite at
72 passed, four of them new in `brawl-sandbox.spec.ts` (the real street and its hazards, the strip
and the meter, the scene painting without a render a frame, and a hen carried to the bay and
named on the results) and the two-phone test in `contestant-phones.spec.ts` extended for the
ready beat, the strip and the meter.

*The scene (`client/CrewScene`).*

- **The three backdrops are redrawn for the band**, from the relay's own art and night palette
  (`CrewScene/Backdrop`, the files moved rather than copied). The band's back is the sim's ground
  line (y 70), so a figure at depth `z` stands at `70 + z` and every goon drawing — which already
  stands itself on that line — needed no change. **On Dunlop the band is the road**: the crew
  fights down the middle of the street between the two kerbs, with the fronts a third bigger than
  the relay drew them across the far sidewalk. §0.7 did not say where the band was; a sidewalk 32
  deep would have pushed the buildings off the top of the wall's window.
- **Hazards span the band, as street.** The patio is a deck across the whole depth with the
  railing at its back and posts down its sides; the bay is a gap in the boardwalk from the rail to
  the bottom of the window; the plinth is a slab with a front face below the band. All three are
  drawn UNDER the fight. A front rail drawn over the figures was tried on paper and dropped: it
  would stand on the slot rings.
- **Per-frame placement is through refs** (`scenePainter`, `HenSlot`, `FigureLayer`), the relay's
  way: the scene subscribes to the street and writes each frame onto the DOM, every hen's six
  poses are mounted once and shown by `display`, and React renders the figure layer only when a
  goon's picture changes or two figures cross in depth. **`useCrewFrame` is a store now**, not
  state: it no longer re-renders its surface sixty times a second. A surface reads the few values
  it shows with `useStreetValue`, which re-renders on a change of that value only.
- **Depth order has slack** (`drawOrder`, 1.5 units). A goon lines up on its hen's own line before
  it closes, so sorted exactly the two swapped places in the picture on every frame — and the
  order is the DOM's, where moving a node restarts the walk cycle on it.
- **Three layers, not one `<svg>`.** The sky and the block's street are each an `<svg>` drawn once
  and slid by a CSS transform; the figures are a third. `fit` is done with container units on a
  16:9 window div rather than `preserveAspectRatio`, because three stacked layers have to agree on
  one frame. `cover` and `contain` mean what they did.
- **The endings play in the scene, on the screen's own clock** (`beatTimeline`, `beats`): block
  clear (the crew walks over the line and hops), the bay (two geese a hen, a beat apart down the
  slots — the relay's three geese for one hen would have been twenty-four for a full crew), the
  bell. "Carried to the bay on a wipe" is read as: on the `wipe` outcome. There is no screen-wipe
  transition. A terminal frame a screen never saw arrive (a wall reloaded during the hold) is
  drawn with its ending already over. All three fit inside `BRAWL_READY_HOLD_MS`.
- **A hit shakes the picture** (5 px for a heart, 11 px for a hen going down), §0.5's "the
  hit-pause becomes shake and flash". No flash was added: she already reels and flickers.

*The wall (`client/DisplayBrawlSurface`).*

- **The crew strip is in the marquee's readout**, not over the street: a chip a hen (head in her
  slot's ring, name, hearts, and a gold star while the wave has not touched her). §0.7 did not say
  where it went; the top of the arena is the meter's and the bottom is the band's front, where a
  strip would stand on the hens nearest the camera. The star is new: the clean-wave bonus is per
  hen now, so the thing to lose in every wave is shown on the hen who can lose it.
- **The wave meter** is the relay's, counting off `frame.spawned` and the goons on the street,
  with ◀ ▶ for the side each waiting goon comes from; a wave of more than ten pips draws them at
  two thirds (a crew of five's first wave is eleven, its biggest seventeen).
- **The ready beat** is a plate where the meter will be: every player on the team by name, a dot
  in her slot's colour once she is out, and who starts it. **The TV is now told a crew turn is on
  phones at play** (`StageSurface` passes `resolveBriefingHandset(crewTurn, …)`; it used to say
  "tablet" for every crew turn once the briefing ended), which is how the plate knows to ask for
  phones rather than name whose block it is on the tablet.
- **Callouts**: *Block clear!* under the street's name, *Into the bay!*, *Time!*, each with where
  the street goes next and that the first thumb starts it (or that the tablet does).
- **The status line is the one verb line** through the fight (principles 15); the wave count it
  used to carry is the meter's.
- **The results card** is the house `<ResultPlaque>` with the turn's awards under its rule
  (`client/TurnAwards`): most geese, most revives, most often carried. An award nobody scored on
  is not given, **and neither is one the whole crew ties on** — a wipe carries every hen once, and
  "most often carried: everybody" is not a tease. The card waits for the last block's ending to
  play. The tablet's readout carries the same names.

*Sound (`client/useCrewSounds`, `client/crewEvents`, `client/audio`).*

- On the TV only, and on the tablet only when it is the whole game (`seat === "solo"`). The
  frame's `events` go through a reader that hands each out ONCE: an event is new if nothing of
  its kind, hen and goon was rung within eight ticks of it, which covers both the same event in
  the next fifty frames and the server's frame putting it a tick or two off the screen's own
  stepped copy. A screen that first sees a fight already under way rings only the last twelve
  ticks of it.
- **Two cues are new**: `down` (a falling whistle and a thump) and `revive` (four notes climbing).
  §0.8 said "through the existing cue table", and the table had no voice for either; they are the
  two sounds a teammate most needs. `drop` rings nothing (the goon's fall is its sound).
- **Five cues are not events and are read off the change between two frames**: a beak coming out
  (`peck`), a goon starting its telegraph (`honk`, lowest for the boss; `hiss` for a swan), the
  boss stepping on, the camera letting go (`go`), and each ending (`handoff` for a clear, `bay`,
  `bell`). The first frame a screen sees of a fight rings none of them.

*What was deleted.* The relay's leftover client: `BrawlScene` (its index, `Hen`, `RelayMates`,
`GoonLayer`, `camera`, `goonDepth`), `useBrawlBlock`, `useHenFigure`, `mirrorEvents`,
`goonsTally`, `hearts`, `HeartRow`, and the relay's `waveMeter` (rewritten in place for the crew
frame). That is most of step 8's "leftover scene files"; the relay's SIM in `packages/shared`
is untouched, and so are `brawl-spec.md` and the README row.

**The frame rate, measured** (§0.8's "measure before and after"). Five brawler bots on block
three (Centennial Beach) with the real reducer as the server in the page, the real
`DisplayBrawlSurface` at 1920×1080, fifteen seconds a run, interim and finished alternated back to
back, in real Chrome on the laptop's own GPU (Apple M1 Pro, Metal), CPU throttled by DevTools to
stand in for a slower device:

| CPU throttle | | Frames a second | Frames over 33 ms | Main thread, share of a core | of which script | of which style |
|---|---|---|---|---|---|---|
| none | interim | 60 | 0 | 21–22% | 13–14% | 1.5% |
| none | finished | 60 | 0 | 15–16% | 5% | 3% |
| 4× | interim | 60 | 0 | 78–84% | 50–54% | 6% |
| 4× | finished | 60 | 0–2 of 900 | 56% | 18% | 12% |
| 6× | interim | 55–57 | 7–14 of 850 | 97% | 58% | 7% |
| 6× | finished | 48–56 | 10–51 of 720–820 | 83–88% | 27–29% | 17–20% |

- **The wall holds sixty** with five hens and up to ten goons on the street, before and after, and
  the finished scene does it on about a quarter less of a core, with every storefront, lamp and
  hazard drawn. Headless Chrome's own vsync is 60 Hz; the laptop's panel is 120 and that was not
  measured.
- **The interim scene was already holding.** By the task's own rule ("move to refs if it does not
  hold") the refs were not strictly owed for the TV. They were built because the interim scene
  left a fifth of a core at 4× and nothing at 6×, and the host's Android tablet is the slow
  device; at 4× the finished scene has twice the room.
- **At 6× neither holds, and the finished scene is no better there.** Its script is half the
  interim's but its style recalculation is nearly three times it, and taking the backdrop or the
  chrome out of the page did not move that number — so it is in the figure layer. The likeliest
  cause is showing a hen's pose by toggling `display` on six mounted figures where the interim
  re-rendered one; **that is a guess and was not tested.** If the tablet stutters at a table, try
  that first.
- **Playwright's own headless shell is the wrong instrument for this scene.** It has no GPU
  (`WEBGL` reports none) and composites in software, where three large layers cost more than one:
  there the finished scene ran at 84–99 frames a second against the interim's 119, the opposite
  of what the GPU shows. An evening of numbers was taken that way before this was understood, on
  a machine other sessions had loaded to a load average of 28–46, and none of them are quoted
  here. Two "findings" from that evening — that the meter's backdrop blur and the block's enter
  animation each cost twenty frames a second — did not survive an alternated A/B and are NOT
  claimed. The blur is off the wall's plates anyway, for the lobby's reason; the enter animation
  is filled backwards so it holds nothing.
- The harness is not in the repo. It is in the session's notes folder
  (`brawl-wall-perf-harness/`), with how to run it.

**Not verified — nobody has seen this on the real hardware.**

- **Real phones on the party Wi-Fi**, and so the eight-way stick, the 192×108 window and the 0.6
  crew scaling. Nothing here retuned any of them.
- **The Android host tablet as monitor.** The 4× and 6× rows above are a laptop pretending.
- **Real costume heads.** The harness's hens had no generated heads; a head is an `<img>` in the
  chip and an `<image>` with a halo filter on the bird, and five of those moving were not timed.
- **The sound, by ear.** Every cue is pinned to fire once by test; none of it has been listened
  to on the TV's speakers over a playlist, and `BRAWL_MASTER_GAIN` and the two new voices are
  untuned. The pack has no recorded takes for `down` or `revive`.
- **A crew of five on the wall for real**: the strip at five to eight chips beside a long team
  name, seventeen pips in the meter, and five names over five hens in one colour (principles 21).
  Seen only in a headless screenshot with a crew of five bots that stand on top of each other.
- **A timeout.** The bell's beat is pinned by unit test and was not watched: a block takes ninety
  seconds to time out and no e2e waits for one.

**Still to do.** Step 6 (tablet mode and the teaser's solo game work, and got the real street
and its sound for free, but were not polished or re-checked on the teaser build — **still do not
deploy the teaser from this branch without looking**); step 7 (pads you can add in the sandbox —
its e2e is still one hen on the tablet, plus the two-phone test in `contestant-phones.spec.ts`);
step 8 (the relay's sim, `brawl-spec.md`, the README row, the principles' worked example); step 9.

## 1) Principles check (docs/minigame-design-principles.md §11)

1. Clock on the TV: the block's cap is the marquee's clock line, as today.
2. ★ Commit: stepping out is a public commit, hen by hen, before the host's Start; every peck
   is one, with the goon's telegraph before it.
3. Hold beats: GO ▶, the block-end beat with its 2.5 s floor, the bay, the bell.
4. Near miss: every wave has a bonus per hen to lose on its last goose, and a block's hearts are
   lost one hen at a time. A crew of five's course is worth about 230 by the starting numbers
   (the relay's is 61), so the fifteen points move in finer steps than they did.
5. No hidden modifiers: the kit scales by a published rule and the wave meter shows the count.
6. ★ A terrible answer is plausible: standing on a downed friend while a goose winds up behind
   you is what everyone will do.
7. Human judge: n/a; the host keeps skip, reset and the override.
8. Failure is a punchline: the whole crew carried to the bay together.
9. ★ Whole team: **this is the reason for the rewrite.** The relay was the shape principle §6
   calls our weakest — one person plays, four watch their own teammate. Now all five play, and
   the revive makes the voice the only channel: a downed player can do nothing but shout.
10. ★ Information asymmetry: §3. Weaker in kind than the relay's, stronger in volume.
11. Frame while playing: crew strip, worth, block of N, the wave's sides.
12. Standings on results only: unchanged.
13. ★ Spectators' job: call the goose behind a named player, and call the revive. With five
    hens there is always somebody about to be hit who has not seen it.
14. Points land within a second: the tally is written from the frame, every frame.
15. ★ One verb line: "Left thumb walks, right thumb pecks. Stand over a fallen friend to get
    her up."
16. First team disadvantaged: block 0 is the easy one; opener rotation is the engine's.
17. One decision at a time on the phone: STEP OUT is the only button there is until the fight,
    and then there are two thumbs and no menu.
18. First gate easier: wave 0 of block 0 is geese only, at every crew size.
19. Host waiting: the tablet names who has not stepped out and that Start is the host's.
20. Every body is the player's own bird, and now they are all on screen together.
21. Team colour and name throughout. **A cost:** five hens in one colour are told apart by
    head, ring and name only. The prototype has rings and tags but no real heads; step 9 is
    where this is judged.
22. Fail costs ≤ 5 s: **partly no.** A hit is a reel. Going down costs however long a teammate
    takes to come, which can be most of a wave. That wait is the game's one piece of teamwork and
    it is spent shouting, not idle; a block's end always gets her up.
23. ★ Sauce: a thumb anywhere on a half, eight coarse directions, a peck that forgives depth.
24. Reveal-and-react: the turn ends on the crew's own numbers — most geese, most revives, most
    often carried.
25. Shape: twitch, two thumbs, **everyone at once**. Still not beside Dunlop Dash or Fappy Bird.
26. Finale: not decided here. It is now a candidate in a way the relay was not; JOUST's claim is
    that its climax is the whole room's, and this is one team's.

## 2) Why depth now, when October said no

docs/research/tablet-brawler-controls.md recommended against a second axis: attacks whiff when
fighters are a hair off each other's line (3.1, 3.2), the fixes hand most of the axis back to
the computer (3.3), and it cost the two-sided read the TV's "BEHIND YOU" depended on (3.5). All
of that was true of one hen on a tablet, and Brad approved it on 2026-10-02.

Two things changed. Several hens on one line stack: they cannot pass each other, a player
cannot find her bird, and one goose reaches all of them — depth is not a feature of the arcade
four-player brawlers, it is what makes four players fit. And the device changed: a player
looking at the TV with a thumb on a blank pad has none of the "glance at the stick" cost the
research measured on a held tablet (1.2).

The research's own least-bad recipe is what §0.3 builds — scheme C: a floating stick, a depth
band about the hen's own height, auto-align on the peck, goons that line up first — and the
prototype's numbers (§0.2) are that recipe working. What it warned would be lost is lost only
in part (§3).

## 3) Information asymmetry

The relay's was structural: the TV's camera was wider than the tablet's, so the wall saw a goon
before the holder could. That is gone — everyone is looking at the same wall.

What replaces it is **attention**. Five players are each watching one bird in a picture of a
dozen figures; the fifteen people not playing are watching all of it. A goose lining up behind
a hen is on the wall for its whole approach and its whole honk, in plain sight of everyone
except, usually, the one player it is for. It is spectator-only and teammate-only at once, it
collapses at the lunge, and it happens to somebody every couple of seconds. The wave meter still
tells the room which edge each waiting goon comes from. A downed hen adds the reverse case: the
player knows exactly what she needs and can only say it.

This is a claim about a room, not a camera, so no e2e can assert it. It is the first thing to
watch for at the table (step 9): if the players see everything the room sees, the room has no
job, and the fix is more geese per hen, not a wider camera.

## 4) Open — Brad's to confirm or overrule

1. **Stepping out by tap, and the host starting block one** (§0.3). The alternative is dealing
   in every connected phone automatically, which is faster and loses the assembling-the-crew
   beat.
2. **No phones means the relay on the tablet** (§0.3). He ruled the tablet out as a spare pad
   for one missing player; this is the different case of a team, or a night, with none.
3. **Eight directions, not an analog stick** (§0.3). Felt by nobody yet. The prototype can
   grow a toggle in a few lines so he can compare before step 1.
4. **The window, 192×108** (§0.4). The prototype is 160×90 and was played with one or two
   hens. Five hens and seven geese need the room; the cost is every figure a fifth smaller on
   the wall. Worth one session on the prototype with five phones before the backdrops are redrawn.
5. **Peck reach ±7.** Carried from the prototype's default; he did not say it felt wrong.
6. **What "expand it a lot" adds.** Deliberately not in this spec, so the core can be played
   first. The candidates: more blocks or a longer street (Allandale, the Spirit Catcher as a
   boss stage); a mid-boss per block; weapons or throwables as pickups; a team special; a
   third verb (the October research's "never a third verb" was written for one tablet thumb and
   deserves a second look on a pad). The parked "spectators' phones send reinforcements" idea is
   the obvious one for a game where everyone already holds a phone, and it runs against his
   2026-11-16 ruling that phones on the night are for the arcade games only — his call.
