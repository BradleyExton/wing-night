# Slingshlong (JOUST) Minigame Spec

Status: **Shipped** — `packages/minigames/joust/`

Last updated: 2026-09-23 (the loadout: content-authored projectile kinds with their own physics; Centennial Beach at dusk, beach props by `kind`, four Barrie lanes; the bench walks: turn-ordered line, walk-off, the shooter grabs the band; 2026-09-24 information asymmetry named)

## 1) One-liner

The active team loads a very floppy challenger into a slingshot on the host tablet, pulls back,
lets go, and the whole room watches it fly down Centennial Beach at dusk on the TV — into a
lifeguard chair, into the sand, or into *everybody who isn't on their team*, stood on the docks and
lifeguard towers down the beach as chickens, with the Spirit Catcher looking on.
Every player on the shooting team gets one pull of the band. Every player they knock off is a
point, and whoever goes over stays over.

## 2) Why this shape

The pitch started as two alternatives: Angry-Birds pull-back physics, or a timing tap while the
thing is in the air. Pull-back won on the platform's own constraints:

- **Two screens, no player phones.** A timed tap has the flight on the TV and the tap on the
  tablet, on two unsynced clocks across a Socket.IO hop. The pull-back is one gesture, one commit,
  and the server owns everything after it.
- **Hard commit, then spectator physics.** Same emotional shape [CONTRAPTION](ideas/contraption.md)
  was designed around: after release nobody in the room can do anything for a couple of seconds.
- **Sauce on the fingers.** A drag-and-release is forgiving. A precision timing window is not.

The floppy body is the joke and the physics reason at once: a rigid projectile is just a bird.

The single generic champ it originally aimed at was the weak half. The target is now the room:
one chicken per player, wearing that player's own generated head (§2.8), racked up like bowling
pins. A shot that takes four people out at once is the loudest thing in the night, and the
shooting team's own birds stand behind the slingshot so the TV never has to caption whose turn
it is.

## 3) Rules

- Per-team turn (AGENTS.md §6.1). **Everybody on the team shoots**, in roster order, so the turn
  goes round the table rather than to whoever grabbed the tablet. A team's shots are therefore its
  own size; `gameConfig.minigameRules.joust.shotsPerPlayer` (default 1) is only how many each of
  them gets. A four-person team does get a shot more than a three-person one — and faces a rack one
  player smaller for it, under the same `pointsMax` cap. That was a deliberate call: an even
  scoreboard is not worth somebody sitting a round out.
- The **rack** is every player NOT on the shooting team, in roster order, dealt across the lane's
  perches. A player on no team at all is a target too. The **bench** is the shooting team, drawn
  behind the slingshot — scenery, never a body — with whoever's shot it is stepped up to the post.
- **Players stand on scaffolding.** A lane is authored as shelves, and a shelf above the sand grows
  its own slab and two legs. A flat shot cannot reach a shelf however hard it is pulled; only an
  arc gets up there. That trade — power for the sand, arc for the shelves — is the skill of the
  game.
- **Towers come down.** A tower's legs are bodies, not walls: the same bistable stick as a pin,
  taller, pulled upright harder and far heavier, tied together at the top by the slab. A shot
  with enough behind it — hard, and angled down into the base — leans a leg past
  `JOUST_TOWER_TOPPLE_TILT` (0.4 of its own height) and the frame folds. The slab stops being a
  floor on that frame, everyone stood on it is dropped and **counted as felled**, their heads
  shoved the way the tower is going so they tumble rather than ride it down standing, and the
  falling frame sweeps whoever is beneath it. A fallen tower is rubble for the rest of the turn:
  drawn flat, built for nothing, nobody on it. A lob that lands on top of a tower does not fold
  it; the base is the target. Sweeps put 2–5% of the aim space on a collapse per lane, clustered
  low and hard.
- **A player is worth what they stood on.** One point on the sand, like bowling; a shelf pays
  more the higher it is — `resolveJoustPerchPoints`: one more per `JOUST_PERCH_POINTS_TIER` (20)
  units of rise, capped at `JOUST_PERCH_POINTS_MAX` (3). The sample lanes' towers all pay 2 and
  the plank says so on the TV; their docks sit under the tier and pay what the sand does, so a
  dock is a place to stand rather than a prize. Together with collapse this is the choice: pick a
  player off the shelf with an arc for 2, or go for the legs and take the whole shelf at once.
- **The ghost of the last shot.** While a teammate aims, the previous shot's arc (the head's path
  up to its first contact) and the ring it was pulled to stay on the lane, on both screens. Each
  shooter on a team is adjusting off the last one rather than starting blind. Client-drawn from
  `previousShotGhost`; the integrator never sees it. A skipped shot flew nothing and leaves the
  last ghost be; a reset clears it.
- The **shooter** is a verlet chain (5 shaft links, a head, two balls). Each **pin** is a foot and
  a head with a stick between them, collided against as the capsule it is drawn as. Obstacles are
  content-authored rectangles the renderer draws as beach props; their optional `kind` (§5) is
  skin only, and the physics sees four segments whatever it says.
- A pin is **bistable**, like the real thing: inside `PIN_RECOVERY_TILT` it rights itself, and past
  it nothing holds it up — gravity swings the head down about the planted foot and it is going
  over. A pin over `JOUST_TOPPLE_TILT` (0.45 of its own height) is latched down for good. Falling
  pins collide with their neighbours, so the rack goes down in chains.
- **Scoring is bowling's, weighted by height.** A player's perch value per player toppled, plus
  `JOUST_RACK_CLEARED_BONUS` (3) for a shot that leaves nobody standing. Turn total is capped at
  `pointsMax`.
- **Whoever goes over stays over.** A felled player is out of the rack for the team's remaining
  shots and leaves their column empty — so three shots are one bowling frame, not three identical
  ones. Clearing the rack ends the turn early; there is nothing left to fire at.
- The pull is a vector `{ x, y }` in fractions of the band's radius, magnitude clamped to 1 and
  `y` clamped to `JOUST_WORLD.maxPullDown` (0.7): a steeper pull would plant the shooter's tail in
  the floor before launch. Forward pulls are pinned to slack by the tablet.
- A pull shorter than `JOUST_MIN_LAUNCH_PULL` (0.12) does not fire and does not spend a shot.
- **The loadout.** The projectile is a KIND, and the pack decides which kinds are on offer
  (`shooters`, §5). Before pulling, the shooter taps a kind on the tablet; the TV shows it on the
  band and names it ("Rob is up with The Log"). Each kind has its own physics profile and its own
  look, and they genuinely do different things — proven by the aim-space sweep in §7, not by feel.
  A kind may be rationed (`usesPerTurn`): the sample's Log, Pencil and Bouncer are one pull each
  per TEAM turn, the Standard is unlimited. Firing spends a use; a skipped shot spends nothing;
  `resetTurn` hands every kind back. After every shot the band reloads with the default kind — the
  first unlimited one, else the first listed with a pull left — so a rationed kind picked by one
  teammate never carries over to the next. A pack with no `shooters` plays exactly as before: the
  Standard alone, and no picker.
- Host-paced (`timerKey: null`): the turn ends when every player has shot, or when the rack is clear.

### Information asymmetry

- **Kind: nobody knows.** Where the shot lands is decided by the integrator after release (§2
  "hard commit, then spectator physics"; §4 "server simulates, display projects"). Host and display
  views carry the same fields, so nothing is withheld from the room (§4 "Nothing is secret").
- **Collapses during the replay**, over the seconds a shot is in the air (§4, the keyframe track),
  and is complete when the rack settles and the felled players are latched down (§3, bistable
  pins). The release is the commit; after it the room has nothing to do but watch.
- The room's read is the lane itself. The ghost of the last shot (§3) gives the shooter and the
  spectators the same information about the aim, and the spectating teams are stood on the
  perches as the rack (§2, §3), so the collapse lands on them personally.

## 4) Architecture

- **Server simulates, display projects.** `launch` runs `simulateJoustShot` in the reducer and
  stores the keyframe track (24 Hz, 240 Hz integration, cut at settle or when the shooter has left
  the world with the rack quiet, hard cap 4.5 s) on `lastShot`. The display replays it
  client-locally from the frame it arrives; it never predicts. Same pattern as the drawing stroke
  replay and the CONTRAPTION decision.
- **The rack is state, the roster is input.** `MinigameRuntimeInitializationInput` carries the
  night's `players` and `teams`; JOUST is the one game that reads them. The lineup is locked at
  `initialize`, so the spots hold still while it thins out and a mid-turn reconnect rehydrates the
  same rack. Whose shot it is is *derived* from `shotIndex`, not stored — the shot index already
  says it.
- **The layout hands back what it built.** `resolveJoustRackLayout` returns both the standing spots
  and the perches actually used, because a rack too big for a lane's shelves is stood on the bare
  sand instead and the renderer must not then draw towers with nobody on them. Two rules keep the
  rack upright: never deal two players closer than a bird is wide (closer than that and they shove
  each other over on the first step, before the shot is even fired), and never deal one into a
  tower's own timber. Both are pinned by tests.
- **A track names its own rack.** `lastShot.pinPlayerIds` is the standing set the shot was fired
  at, in frame order, and `run.topples[].pinIndex` addresses THAT list. The players a shot is in
  the act of felling are still on their feet in its early frames, so reading the current standing
  set would erase them mid-flight.
- **Only one track in the snapshot.** `nextShot` drops `lastShot` on the way to the next band;
  the final shot is kept so the TV holds the result through `done`. A full roster's worst-case
  track is ~40 KB; typical is well under half that.
- **Physics is hand-rolled, dependency-free and deterministic.** `packages/shared/src/joust/`
  reuses CONTRAPTION's segment-contact resolver, adds distance constraints, home springs and
  circle-versus-capsule contacts, and keeps its transcendental-free guard test. The aim arrives as
  a vector so the integrator never needs an angle — and so does a pin's lean, which is why the
  renderer stands a bird up on a pin with a matrix built from the two body centres rather than a
  rotation.
- **The lane draws the real cast, not a copy of it.** `@wingnight/cast` exports the hen as a
  bare `<g>` (`<CharacterFigure>`) so the lane can place it under its own transform, which is how a
  player's generated head, their team's colour and their genre's apparel all arrive for free. The
  pin's three numbers — `JOUST_PIN_HEIGHT`, `JOUST_PIN_HEAD_RADIUS`, `JOUST_PIN_FOOT_RADIUS` — are
  that bird's own proportions at lane scale, and `ArenaHen`'s test fails if the drawn head and the
  collided head stop being the same size.
- **The shot is drawn along its bodies, between its keyframes.** `@wingnight/cast` exports
  `resolveSchlongPaths`: the five shaft links and the head body are the spine, the glans is a cap
  of the head body's radius, and FAPPY's champs come off the same function. The replay index is
  fractional — the scene blends the two keyframes either side of it — so a 24 Hz track moves on
  every screen frame. The lane's hens are memoised on their body positions, because a replay now
  re-renders the scene at screen rate and most of the rack is standing still through most of it.
- **A pin is light, the shot is heavy, a leg is heavier.** `SHOOTER_MASS_SHARE` (0.15) is what
  lets a shot plough on down the lane instead of stopping dead in the first player it meets;
  `SHOOTER_LEG_SHARE` (0.35) is what makes a leg something to bounce off unless there is real
  weight behind the shot. Legs come LAST in the body order (`resolveJoustBodies(pinCount,
  legCount)`, `joustLegFootIndex`), so felling a player never moves a tower's bodies and bringing
  a tower down never moves a pin's. The slab is the one piece of static timber; it is a segment
  while the tower stands and dropped from the active set the step the legs fold. The renderer
  draws each leg between its own two bodies and the plank across the two tops, so the TV's tower
  falls exactly the way the integrator's did.
- **The bench walks, client-side.** The shooting team's line is ordered by turn distance
  (`resolveBenchOrder` in `runtime/lineup`, pure): the next shooter nearest the post, the spent
  ones at the far end facing away, one spot a head so nobody who has walked off ever moves again.
  Each figure's x tweens toward its spot on `requestAnimationFrame` (`useBenchWalk`, ~14 units/s,
  the FAPPY handoff-beat pattern; `prefers-reduced-motion` teleports), wearing the cast's `walk`
  pose on the move and `still` parked. With the band drawn past `PULL_GUIDE_THRESHOLD` the parked
  shooter's wing is drawn on its own layer aimed at the shooter's tail and the bird leans back
  with the pull. None of it is state: the scene derives it from `teammates`,
  `activeShooterPlayerId`, `shotIndex` and `shotsPerTurn`, and the harness reads
  `data-joust-bench-slot` / `data-joust-walking` / `data-joust-facing` rather than transforms.
- **A kind is a profile, and the body count never changes.** `JoustShooterProfile`
  (`packages/shared/src/joust/types.ts`) is the eleven levers a kind pulls on the integrator:
  the three radii, the link spacing, `massShare` (how much of a shot-versus-pin separation the
  SHOT absorbs — small is heavy), `legShare` (the same against a tower's leg), `restitution` and
  `slip` against the floor, slabs and obstacles, `bendStiffness`, `damping` and
  `launchSpeedScale`. `JOUST_STANDARD_SHOOTER_PROFILE` (`shooterProfile/`) is the constants
  that used to be hard-coded in `world/` and `simulate/`, and a content kind is a diff against
  it (`resolveJoustShooterProfile`). What a kind never changes is the body COUNT — five shaft
  links, a head, two balls — so frame indexing, `joustPinFootIndex` and every renderer hold for
  every kind. `resolveJoustBodies`, `resolveShooterRestPositions`, `resolveJoustRestFrame` and
  `resolveJoustLaunchVelocity` take the profile as a trailing optional argument;
  `simulateJoustShot` reads it off `options.shooter`, so a shot is still a pure function of
  lane + aim + seed + kind.
- **The runtime holds the loadout resolved.** `runtime/loadout/` reads a content kind into
  `JoustRuntimeShooter` — `usesPerTurn: null` for unlimited and the FULL profile, plain JSON —
  and falls back to the Standard kind when the file authors none. The prompt-pack adapter
  carries `prompts` and nothing else by design, so `runtime/content/` reads `shooters` beside
  it. State carries `selectedShooterId` and `usedShooterIds` (one entry per pull); `pickShooter
  { shooterId }` is accepted only while `aiming`, only for a kind the content carries with a pull
  left; `launch` refuses a spent or vanished kind rather than firing a phantom, simulates with
  the kind's profile and records the use; `lastShot` and `previousShotGhost` carry `shooterId`
  so a replay and a ghost are drawn as the kind that flew them. Both views carry `shooters` (id,
  name, blurb, colour, `usesLeft`, resolved profile) and `selectedShooterId`; the projection
  test pins the display to exactly those and `usedShooterIds` is projected only as `usesLeft`.
- **The client draws what the integrator flew.** `Shooter` takes the kind and reads its radii
  off the profile and its inks off the content colour; `resolveJoustScene` picks the kind — the
  one that flew during a replay, the one loaded at rest — and builds the rest frame at that
  kind's link spacing, so the TV shows a Log as long as a Log while the tablet is still pulling.
  `data-joust-shooter-kind` on the shooter group is what the e2e reads.
- **Live pull on the TV.** `setAim` streams the band at ~12/s while dragging (the drawing canvas
  set the ~15/s budget). The tablet shows its own finger's pull immediately and yields to the
  server's echo when the drag ends.
- **Nothing is secret.** Host and display views carry the same fields; the projection test pins
  the display to exactly those and no runtime-only field.
- **Lane per team.** Chosen by turn-order slot, like Song Guess's setlists, so no two teams face
  the same lane and a reconnect rehydrates the same one. Because the slot picks the lane, the
  shipped lanes have to pay alike — `world/index.test.ts` pins the spread of available points
  across the four to one point at every realistic rack size, or going first is a prize.

## 5) Content

`content/local/minigames/joust.json` (falls back to `content/sample/minigames/joust.json`):

```json
{
  "prompts": [
    {
      "id": "arena-centennial-beach",
      "name": "Centennial Beach",
      "perches": [
        { "x": 54, "y": 78, "width": 102 },
        { "x": 54, "y": 64, "width": 28 },
        { "x": 89, "y": 50, "width": 65 }
      ],
      "obstacles": [
        { "x": 45, "y": 64, "width": 7, "height": 14, "kind": "umbrella" },
        { "x": 60, "y": 73, "width": 16, "height": 5, "kind": "canoe" },
        { "x": 156, "y": 50, "width": 2, "height": 28, "kind": "mast" }
      ]
    }
  ]
}
```

World is 160 wide, 90 tall, floor at y = 78, slingshot fork at (40, 46). A lane is authored as
**shelves, not positions**: how many players stand on them is not content, it is however many are
not shooting that night, dealt across the perches. A perch is anchored by its left edge `x` and by
the surface `y` players stand on; one at floor level is the sand, and any higher one grows its own
slab and legs. Perches must sit between `JOUST_RACK_LEFT` (54) and `JOUST_RACK_RIGHT` (156) and no
higher than `JOUST_RACK_TOP` (22). The renderer dresses a shelf by its rise: under
`JOUST_PERCH_POINTS_TIER` (20) it is a dock on pilings, from there up a lifeguard tower — skin only,
the timber is the same boxes either way.

An obstacle's optional `kind` is what the renderer dresses it as, one of `lifeguard-chair`,
`muskoka-chair`, `canoe`, `chip-truck`, `mast` or `umbrella`; anything else is rejected at load,
and a missing `kind` draws an umbrella. It never reaches the physics — a canoe and a chip truck of
the same rectangle stop a shot identically — so pick the drawing that fits the rectangle rather
than the other way round.

**The sample lanes are four Barrie lanes**, dealt by turn slot: Centennial Beach (a dock and a big
lifeguard tower), The Spirit Catcher (a mid shelf and the tallest stand of the four), Allandale
Dock (a long lifeguard tower and a dock at the water's end) and Meridian Place (two shelves). They
seat 14, 15, 14 and 15, and the available points across them are within one at every rack size
from 9 to 14, because the first team's lane must not be the richest one.

**The night pack carries no `joust.json`**, so the sample lanes above are what the party plays
until one is added. A pack file replaces the whole file, not a lane at a time: an author adding one
lane to `~/wing-night-content/local/minigames/joust.json` has to carry the other three across too.
The loader holds every pack lane to the seating floor; the payout spread is pinned by a test on the
sample only, so a pack author checks their own set pays alike before the night.

Two things quietly eat a lane's standing room, and both are easy to author by accident: a shelf
hung lower than a bird is tall shades out the sand beneath it, and a tower's legs occupy the spots
they stand on. Validation therefore checks the lane still seats `JOUST_MIN_LANE_CAPACITY` (14 — a
fifteen-player roster plus two spare chairs, less the three on the smallest shooting team) and
says how many it actually seats when it does not. Obstacles must sit inside the world and above the
floor. `featuredPlayers` tagging works as for every other pack.

**Do not lower the floor to make a lane pass — widen the lane.** The number is the worst rack a
tuned night can hand a lane: fifteen at the table, teams dealt three or four deep, so the SMALLEST
shooting team faces the BIGGEST rack — 15 roster + 2 spare chairs − 3 shooting = 14. A lane that
seats fewer does not fail at a party, it silently falls back: `resolveJoustRackLayout` abandons
every perch, dumps the whole rack on one bare row worth a point a head, and the towers stop being
drawn on. One consequence is deliberate: the sand alone holds eleven, so **every authored lane must
carry at least one shelf** — a bare-sand lane cannot seat a real party, which is the whole bug.

### The loadout

A top-level `shooters` array is the turn's loadout. Each entry is one kind:

```json
{
  "id": "log",
  "name": "The Log",
  "blurb": "Big, slow, heavy. Ploughs the sand row and folds towers. Can't reach the top shelf.",
  "color": { "fill": "#8b5a2b", "dark": "#4a2c12", "light": "#c48b55" },
  "usesPerTurn": 1,
  "profile": { "shaftRadius": 3.4, "headRadius": 4.8, "massShare": 0.06, "legShare": 0.06, "launchSpeedScale": 0.65 }
}
```

`usesPerTurn` absent means unlimited. `profile` is a diff against the Standard profile — every
lever left out is today's value — and each lever is validated inside the band the integrator is
sane over (`JOUST_SHOOTER_PROFILE_RANGES` in `packages/shared/src/content/joust/shooters/`):
radii, spacing, `massShare` and `legShare` in (0, 1], `restitution` in [0, 0.95], `slip` and
`bendStiffness` in [0, 1], `damping` in [0.9, 1], `launchSpeedScale` in [0.5, 1.4]. An unknown
lever name is an error, so a typo cannot silently do nothing. Ids must be unique. `color` is
three `#rrggbb` inks (body, outline, gloss): drawing content, exempt from the two-accent budget,
and best kept off the eight team colours because the hens in the lane wear those.

A file with no `shooters` loads the Standard kind alone and the tablet's picker stays hidden, so
every existing pack keeps working unchanged. The sample ships four: `standard` (unlimited),
`log`, `pencil` and `bouncer` (one pull each), with the profiles the §7 sweep settled on.

**A night pack can author its own loadout** — names, blurbs, colours, profiles, rations — but a
pack `joust.json` replaces the WHOLE sample file, prompts included: there is no per-key merge,
so a pack that wants the sample lanes with its own kinds copies the lanes across.

The sample pack is deliberately **not** scheduled in the sample `gameConfig.json`, so the default
demo night is unchanged. Schedule it with `"minigame": "JOUST"` on a round in
`content/local/gameConfig.json` (or through `/admin`).

## 6) Escape hatches (AGENTS.md §11)

- `skipShot` — forfeit the current shot (dead touch surface, team has had enough). Scores 0.
- `resetTurn` — replay the whole turn: the rack back on its feet, and exactly what the turn banked
  handed back.
- Manual score override — the global scoring dock, as for every game.

## 7) Open questions

### The kinds, by sweep (2026-09-23)

Every aim on a 0.05 × 0.1 grid over the clamped pull space (250 aims a lane, upward pulls
included — those fire into the sand and mostly die, so the absolute rates are diluted) against a
**12-player rack** on the four sample lanes, seed 7. `score` is the share of aims that fell
anybody; `mean` is points when scoring; `collapse` is towers folded; `top` is aims that felled
somebody on the lane's highest shelf WITHOUT folding it; `excl` is aims where this kind scores
and the Standard scores zero; `std>` / `kind>` is the head-to-head — which of the two scored
more from the same pull.

| kind     | lane        | score | mean  | collapse | top   | excl  | std> | kind> |
| -------- | ----------- | ----- | ----- | -------- | ----- | ----- | ---- | ----- |
| standard | Two Towers  | 36.4% | 5.23  | 9.2%     | 8.8%  | —     | —    | —     |
| standard | Lookout     | 19.2% | 8.69  | 5.6%     | 0.0%  | —     | —    | —     |
| standard | Front Porch | 12.0% | 13.43 | 8.8%     | 3.2%  | —     | —    | —     |
| standard | Open Range  | 19.2% | 11.79 | 10.8%    | 8.4%  | —     | —    | —     |
| log      | Two Towers  | 35.6% | 5.85  | 14.0%    | 0.0%  | 10.4% | 19.6% | 18.0% |
| log      | Lookout     | 21.2% | 11.40 | 20.0%    | 0.0%  | 12.4% | 10.8% | 15.2% |
| log      | Front Porch | 44.8% | 18.88 | 44.8%    | 0.0%  | 33.2% | 0.4% | 41.2% |
| log      | Open Range  | 30.8% | 16.71 | 30.8%    | 0.0%  | 18.8% | 7.6% | 25.6% |
| pencil   | Two Towers  | 44.8% | 3.16  | 0.0%     | 16.8% | 16.8% | 16.8% | 23.2% |
| pencil   | Lookout     | 30.4% | 7.57  | 0.0%     | 6.0%  | 18.0% | 8.0% | 23.6% |
| pencil   | Front Porch | 14.0% | 7.77  | 0.0%     | 14.0% | 13.2% | 11.2% | 13.2% |
| pencil   | Open Range  | 18.4% | 8.87  | 0.0%     | 18.4% | 14.0% | 17.2% | 14.0% |
| bouncer  | Two Towers  | 49.2% | 3.04  | 0.0%     | 14.8% | 20.4% | 16.0% | 24.0% |
| bouncer  | Lookout     | 28.0% | 7.76  | 0.0%     | 4.4%  | 14.4% | 7.2% | 18.4% |
| bouncer  | Front Porch | 11.6% | 9.24  | 0.0%     | 11.6% | 9.6%  | 10.0% | 10.0% |
| bouncer  | Open Range  | 18.4% | 8.30  | 0.0%     | 18.4% | 12.8% | 16.8% | 13.2% |
| **all**  | standard    | 21.7% | 8.58  | 8.6%     | 5.1%  | —     | —    | —     |
| **all**  | log         | 33.1% | 13.68 | 27.4%    | 0.0%  | 18.7% | 9.6% | 25.0% |
| **all**  | pencil      | 26.9% | 5.98  | 0.0%     | 13.8% | 15.5% | 13.3% | 18.5% |
| **all**  | bouncer     | 26.8% | 5.85  | 0.0%     | 12.3% | 14.3% | 12.5% | 16.4% |

What the table says, against the bars it was tuned to:

- **The Log folds towers at 3.2× the Standard** (27.4% vs 8.6%) and can NEVER pick a bird off
  the top shelf directly (0.0% vs 5.1%): at 65% launch speed it only reaches a shelf by bringing
  it down. Its mean-when-scoring is higher on every lane — a folded tower is worth the whole
  shelf, and no tuning that keeps 3× collapse moves that — so the trade shows in the head-to-head
  instead: the Standard outscores it on 9.6% of aims (19.6% on Two Towers, where the Log's score
  rate is also below the Standard's) and it is the slowest thing on the band.
- **The Pencil reaches the Lookout's top shelf, which the Standard never does** (6.0% vs 0.0%),
  and reaches the top shelf at 2.7× the Standard's direct rate over all lanes. It never folds a
  tower, its mean is 30% lower, its best shot is 12–14 against the Standard's 14–21: it gets
  there and stops.
- **The Bouncer scores on 14.3% of aims where the Standard scores zero** — mid-power lobs that
  land short and come off the sand or a slab into a shelf row (the whole Front Porch shelf, 12
  points, from pulls the Standard's flop wastes). It never folds a tower and its tracks still
  settle (≈92 keyframes against the Standard's ≈65, cap 109).

Levers that turned out **dead or flat** in this sweep, so nobody re-tunes them expecting
movement: `slip` at 0–0.05 and `restitution` at 0.9–0.95 are indistinguishable for the Bouncer;
`restitution` 0.1 versus 0.2 barely moves the Log; `legShare` flattens below ~0.08 (0.06 and
0.08 fold the same towers); `ballRadius` was never a lever on its own. `massShare` above ~0.3 is
not a lighter kind but a dead one — at 0.45 the Pencil scored on 2% of aims — and
`launchSpeedScale` is what reach is, on both ends: 1.3 is what puts the Pencil on the Lookout's
shelf and 0.65 is what keeps the Log off Two Towers' far tower. As before, `PIN_LEG_SHARE` is
dead and power alone is not a gate: what folds a tower is weight (`legShare`) at a leg, and a
faster shot without it just bounces harder.

- **Rack difficulty.** An aim-space sweep against a ten-player rack scores on 48–62% of aims
  depending on the lane, 2.4–4.3 players when it scores, best shot 6–9. Worth re-checking against a
  real roster and a real sofa.
- **Unreachable players.** On the busier lanes an aim-space sweep only ever reaches 7 of 10 —
  somebody tucked behind a tower's legs may be unhittable from the band. That is Angry Birds, but a
  player who can never be knocked over all night is not a fun thing to be. Watch it on a real lane.
- **Tower sturdiness.** `LEG_UPRIGHT_STIFFNESS` (0.04), `LEG_RECOVERY_TILT` (0.12) and
  `SHOOTER_LEG_SHARE` (0.35) were set by an aim-space sweep, not a sofa, and the sweep was run on
  the desert lanes these Barrie lanes replaced: Two Towers folded on 4% of aims, The Lookout 5%
  (full power just above flat: through the sand row and into the far tower's legs, a 7–10 player
  strike), Front Porch 2% (only from a steep downward pull). Meridian Place is Two Towers moved
  along the sand; the other three have not been swept. Retune at a table;
  the dropped players land in a heap on the fallen timber rather than flat on the sand, which reads
  as a pile and may or may not be what the room wants.
- **Rigid crates** — boxes that rotate, stack and crush — are still out: the engine is capsules
  and segments. Legs-as-pins is what "destructible" means here.
- **Trail.** CONTRAPTION's lab found a flight trail makes a miss legible. Not built; the impact
  burst and the plaque carry the result for now.
- **The felled.** A player knocked over on shot one is drawn lying on their own spot, dimmed, for
  the rest of the turn. Whether the room would rather see them pile up somewhere is a playtest
  question.
