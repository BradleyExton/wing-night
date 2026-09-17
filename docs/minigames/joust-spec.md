# Slingshlong (JOUST) Minigame Spec

Status: **Shipped** — `packages/minigames/joust/`

Last updated: 2026-09-16

## 1) One-liner

The active team loads a very floppy challenger into a slingshot on the host tablet, pulls back,
lets go, and the whole room watches it fly across a desert on the TV — into a cactus, into the
sand, or into the champ standing at the far end. Three shots. Where it lands first is what scores.

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

## 3) Rules

- Per-team turn (AGENTS.md §6.1). The team gets `shotsPerTurn` shots (default 3, from
  `gameConfig.minigameRules.joust.shotsPerTurn`).
- The **shooter** is a verlet chain (5 shaft links, a head, two balls). The **champ** stands at
  the far end: a chain pinned at the base with a home spring, so it wobbles when hit and rights
  itself. Obstacles are content-authored rectangles the renderer draws as cacti.
- The first champ body the shooter touches is the scoring zone: **head 3**, **body 2**,
  **low blow 5**, miss 0. A lob comes down on the head, so it is the easy hit; the balls sit
  behind the champ's own shaft on a flat trajectory, so they pay best. Turn total is capped at
  `pointsMax`.
- The pull is a vector `{ x, y }` in fractions of the band's radius, magnitude clamped to 1 and
  `y` clamped to `JOUST_WORLD.maxPullDown` (0.7): a steeper pull would plant the shooter's tail in
  the floor before launch. Forward pulls are pinned to slack by the tablet.
- A pull shorter than `JOUST_MIN_LAUNCH_PULL` (0.12) does not fire and does not spend a shot.
- Host-paced (`timerKey: null`): the turn ends when the shots are spent.

## 4) Architecture

- **Server simulates, display projects.** `launch` runs `simulateJoustShot` in the reducer and
  stores the keyframe track (30 Hz, 240 Hz integration, cut at settle or when the shooter leaves
  the world, hard cap 4 s) on `lastShot`. The display replays it client-locally from the frame it
  arrives; it never predicts. Same pattern as the drawing stroke replay and the CONTRAPTION
  decision.
- **Only one track in the snapshot.** `nextShot` drops `lastShot` on the way to the next band;
  the final shot is kept so the TV holds the result through `done`. A worst-case track is ~22 KB;
  typical is under 10 KB.
- **Physics is hand-rolled, dependency-free and deterministic.** `packages/shared/src/joust/`
  reuses CONTRAPTION's segment-contact resolver, adds distance constraints, home springs and
  circle-circle contacts, and keeps its transcendental-free guard test. The aim arrives as a
  vector so the integrator never needs an angle.
- **Live pull on the TV.** `setAim` streams the band at ~12/s while dragging (the drawing canvas
  set the ~15/s budget). The tablet shows its own finger's pull immediately and yields to the
  server's echo when the drag ends.
- **Nothing is secret.** Host and display views carry the same fields; the projection test pins
  the display to exactly those and no runtime-only field.
- **Arena per team.** Chosen by turn-order slot, like Song Guess's setlists, so no two teams face
  the same cactus and a reconnect rehydrates the same arena.

## 5) Content

`content/local/minigames/joust.json` (falls back to `content/sample/minigames/joust.json`):

```json
{
  "prompts": [
    {
      "id": "arena-lone-saguaro",
      "name": "Lone Saguaro",
      "targetX": 126,
      "obstacles": [{ "x": 80, "y": 52, "width": 7, "height": 26 }]
    }
  ]
}
```

World is 160 wide, 90 tall, floor at y = 78, slingshot fork at (40, 46). `targetX` must be
between 80 and 152; obstacles must sit inside the world and above the floor. Validation names the
offending arena and field. `featuredPlayers` tagging works as for every other pack.

The sample pack is deliberately **not** scheduled in the sample `gameConfig.json`, so the default
demo night is unchanged. Schedule it with `"minigame": "JOUST"` on a round in
`content/local/gameConfig.json` (or through `/admin`).

## 6) Escape hatches (AGENTS.md §11)

- `skipShot` — forfeit the current shot (dead touch surface, team has had enough). Scores 0.
- `resetTurn` — replay the whole turn; hands back exactly what the turn banked.
- Manual score override — the global scoring dock, as for every game.

## 7) Open questions

- **Zone weights.** 3/2/5 came from an aim-space sweep (heads are ~85% of hits in the sample
  arenas). Worth re-checking after a real night.
- **Trail.** CONTRAPTION's lab found a flight trail makes a miss legible. Not built; the impact
  burst and the plaque carry the result for now.
- **Champ knock-down.** The champ wobbles and rights itself. A shot that actually fells it would
  be funnier and is a scoring question, not a physics one.
