# Slingshlong (JOUST) Minigame Spec

Status: **Shipped** — `packages/minigames/joust/`

Last updated: 2026-09-18 (schlong drawing + interpolated replay, same day)

## 1) One-liner

The active team loads a very floppy challenger into a slingshot on the host tablet, pulls back,
lets go, and the whole room watches it fly down a desert lane on the TV — into a cactus, into the
sand, or into *everybody who isn't on their team*, stood on scaffolding down the lane as chickens.
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
  its own slab and two legs, all solid. A flat shot cannot reach a shelf however hard it is pulled;
  only an arc gets up there, and a tower's legs will stop a low one dead. That trade — power for
  the sand, arc for the shelves — is the skill of the game.
- The **shooter** is a verlet chain (5 shaft links, a head, two balls). Each **pin** is a foot and
  a head with a stick between them, collided against as the capsule it is drawn as. Obstacles are
  content-authored rectangles the renderer draws as cacti.
- A pin is **bistable**, like the real thing: inside `PIN_RECOVERY_TILT` it rights itself, and past
  it nothing holds it up — gravity swings the head down about the planted foot and it is going
  over. A pin over `JOUST_TOPPLE_TILT` (0.45 of its own height) is latched down for good. Falling
  pins collide with their neighbours, so the rack goes down in chains.
- **Scoring is bowling's.** One point per player toppled, plus `JOUST_RACK_CLEARED_BONUS` (3) for a
  shot that leaves nobody standing. Turn total is capped at `pointsMax`.
- **Whoever goes over stays over.** A felled player is out of the rack for the team's remaining
  shots and leaves their column empty — so three shots are one bowling frame, not three identical
  ones. Clearing the rack ends the turn early; there is nothing left to fire at.
- The pull is a vector `{ x, y }` in fractions of the band's radius, magnitude clamped to 1 and
  `y` clamped to `JOUST_WORLD.maxPullDown` (0.7): a steeper pull would plant the shooter's tail in
  the floor before launch. Forward pulls are pinned to slack by the tablet.
- A pull shorter than `JOUST_MIN_LAUNCH_PULL` (0.12) does not fire and does not spend a shot.
- Host-paced (`timerKey: null`): the turn ends when every player has shot, or when the rack is clear.

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
- **A pin is light, the shot is heavy.** `SHOOTER_MASS_SHARE` (0.15) is what lets a shot plough on
  down the lane instead of stopping dead in the first player it meets.
- **Live pull on the TV.** `setAim` streams the band at ~12/s while dragging (the drawing canvas
  set the ~15/s budget). The tablet shows its own finger's pull immediately and yields to the
  server's echo when the drag ends.
- **Nothing is secret.** Host and display views carry the same fields; the projection test pins
  the display to exactly those and no runtime-only field.
- **Lane per team.** Chosen by turn-order slot, like Song Guess's setlists, so no two teams face
  the same cactus and a reconnect rehydrates the same lane.

## 5) Content

`content/local/minigames/joust.json` (falls back to `content/sample/minigames/joust.json`):

```json
{
  "prompts": [
    {
      "id": "arena-lookout",
      "name": "The Lookout",
      "perches": [
        { "x": 54, "y": 78, "width": 102 },
        { "x": 116, "y": 50, "width": 34 }
      ],
      "obstacles": [{ "x": 46, "y": 66, "width": 5, "height": 12 }]
    }
  ]
}
```

World is 160 wide, 90 tall, floor at y = 78, slingshot fork at (40, 46). A lane is authored as
**shelves, not positions**: how many players stand on them is not content, it is however many are
not shooting that night, dealt across the perches. A perch is anchored by its left edge `x` and by
the surface `y` players stand on; one at floor level is the sand, and any higher one grows its own
slab and legs. Perches must sit between `JOUST_RACK_LEFT` (54) and `JOUST_RACK_RIGHT` (156) and no
higher than `JOUST_RACK_TOP` (22).

Two things quietly eat a lane's standing room, and both are easy to author by accident: a shelf
hung lower than a bird is tall shades out the sand beneath it, and a tower's legs occupy the spots
they stand on. Validation therefore checks the lane still seats `JOUST_MIN_LANE_CAPACITY` (10) and
says how many it actually seats when it does not. Obstacles must sit inside the world and above the
floor. `featuredPlayers` tagging works as for every other pack.

The sample pack is deliberately **not** scheduled in the sample `gameConfig.json`, so the default
demo night is unchanged. Schedule it with `"minigame": "JOUST"` on a round in
`content/local/gameConfig.json` (or through `/admin`).

## 6) Escape hatches (AGENTS.md §11)

- `skipShot` — forfeit the current shot (dead touch surface, team has had enough). Scores 0.
- `resetTurn` — replay the whole turn: the rack back on its feet, and exactly what the turn banked
  handed back.
- Manual score override — the global scoring dock, as for every game.

## 7) Open questions

- **Rack difficulty.** An aim-space sweep against a ten-player rack scores on 48–62% of aims
  depending on the lane, 2.4–4.3 players when it scores, best shot 6–9. Worth re-checking against a
  real roster and a real sofa.
- **Unreachable players.** On the busier lanes an aim-space sweep only ever reaches 7 of 10 —
  somebody tucked behind a tower's legs may be unhittable from the band. That is Angry Birds, but a
  player who can never be knocked over all night is not a fun thing to be. Watch it on a real lane.
- **Destructible structures.** The scaffolding is static: you shoot past it, not through it. Crates
  that topple and crush would be the real thing, and would need a rigid-body layer the engine does
  not have — rotating boxes, box-against-box contacts, stable stacking. Deliberately deferred; a
  janky stack would land worse than a solid one.
- **Trail.** CONTRAPTION's lab found a flight trail makes a miss legible. Not built; the impact
  burst and the plaque carry the result for now.
- **The felled.** A player knocked over on shot one is drawn lying on their own spot, dimmed, for
  the rest of the turn. Whether the room would rather see them pile up somewhere is a playtest
  question.
