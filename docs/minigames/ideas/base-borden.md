---
name: Base Borden (working title)
oneLiner: A side-view run-and-gun relay where two teammates at a time run their hens through the base from their own phones, eyes on the TV, spraying hot sauce, and hand off to the next pair at the end of each stretch.
confidence: sketch
---

## Pitch

Brad's ask (2026-11-16): a run-and-gun in the Contra mould, played as a relay, but two people go
through at once and hand off to the next two.

Two hens on the wall, each steered from her own teammate's phone. Sauce sprays out of them the
whole time, so no thumb is spent on shooting: the stick runs her and points the spray, the other
thumb jumps. Things shoot back, slowly and visibly, and the two of them have to get through a
stretch of the base together. At the far end the next pair is waiting, and the bottle the first
pair is carrying is the baton.

It is built on the crew turn that Streets of Barrie's four-player rewrite introduces
([brawl-crew-spec.md](../brawl-crew-spec.md), on main since 2026-11-17 with the phones' half
built and the screens still interim): phones are blank pads,
the TV is the one picture, and the server's reducer holds the frame and sequences every thumb by
`receivedAtMs`. That spec is the platform; this game is its second tenant, with a crew of two.

What it has that Streets of Barrie does not: range, a jump, shots to get out of the way of, and
a street with height in place of depth. And a pair is findable. Five hens in a brawl is a crowd;
two hens on a wall is a double act the room can follow, heckle and blame by name.

Base Borden is the Canadian Forces base fifteen minutes from Barrie, which is the setting a
run-and-gun wants and one the room knows. The game is an original in the genre: its own hens,
its own base, its own enemies. Nothing of Contra's levels, look or names.

## Rough rules

- **A stretch per pair.** The turn is `stretchesPerTurn` stretches (3), each harder than the
  last. Pairs are dealt in roster order from the players who have stepped out on their phones
  (A+B, C+D, then E+A on an odd team), so everyone runs and the pairings remix. One phone on
  the team is a solo hen; none is the tablet running one hen, as in the crew spec.
- **The pad is Streets of Barrie's pad.** Left half is the eight-way stick, right half is one
  big button. Stick left or right runs her, the stick's direction is where the sauce goes (ahead,
  up, diagonals), stick down ducks. The button jumps. She never stops spraying. A phone shows no
  scene and makes no sound.
- **Sauce is the weapon and the pickup.** Every hen starts on the mild bottle (one stream).
  Hotter bottles drop into the stretch one at a time: the spread, the long stream, the puddle
  that stays on the floor. A hit costs her the bottle before it costs her anything else.
- **Three hearts each, then down.** A downed hen lies where she fell until her partner stands
  over her for a second and a half, the crew spec's revive. Both down loses the stretch, not the
  turn: what they banked stays and the next pair starts fresh.
- **The camera follows the lead hen** and walks the other along with its left edge, the crew
  spec's rule, so nobody is left behind where she cannot be revived.
- **The handoff.** The stretch is cleared when either hen reaches the far gate. The next pair's
  hens are standing there, and each inherits the bottle of the hen who arrives carrying one. A
  pair that limps in on mild hands over mild.
- **Worth over the course.** Points are the worth banked (enemies down, hearts carried through a
  cleared gate) over the worth of the course the team was dealt, times the round's max. Near
  misses are built in, as in Streets of Barrie.
- **Round memory:** a flag planted where the best team so far got to. Every later team runs
  past it or does not.
- Host keeps skip-stretch and reset-turn. Nothing advances the phase.

## Principles check

- 2 Commit before reveal: the jump. Once she is in the air she lands where she lands, and the
  shot she jumped over is either under her or not. Thinner than a lock-in game's; the handoff
  gate is the turn's larger one.
- 6 A bad answer is still a plausible answer: there is no bank. The bad play is the content: both
  hens going for the one bottle, or one standing on her partner to revive her under a turret.
- 9 Whole team moves or speaks: two play and have to talk (who takes the bottle, "get me up").
  The rest of the team is next up and shouting. This is weaker than Streets of Barrie's
  whole-team crew, by design: the pair is the point.
- 10 Information asymmetry, and when it collapses: attention, as the crew spec argues for the
  brawl. Each player watches one hen; the room watches the whole wall and sees the shot each of
  them has not. Collapses at every hit, and at the gate.
- 13 What the watching teams do: lookout and heckle, and watch their own flag get passed or
  stand.
- 15 Rules in one verb line: "Run and aim with the stick, tap to jump. She never stops
  shooting."
- 23 What the sauce does to it: nothing to mash and nothing to look at on the pad, so a greasy
  thumb only has to find a half of the screen. The risk is the jump's timing through a network
  hop (open question 1).

## Open questions

1. **Does a jump survive the hop?** A pad's thumb reaches the wall through the server with no
   buffer. Brad called that lag fine for a brawler on 2026-11-16. Dodging a shot by jumping is
   tighter than walking up to a goose. Design to forgive it regardless: slow shots, a long
   telegraph, a generous hurt box.

   The throwaway lab for this is built: `/dev/lab/rungun-yard` on the laptop or TV and
   `/dev/lab/rungun-pad` on a phone (`apps/client/src/components/RunGunLab`, relayed by
   `apps/server/src/socketServer/protoRunGunPad`). Every shot flies level, so a low one can only
   be jumped and a high one only ducked, and each hen's chip counts the shots she dodged. First
   numbers, 2026-11-17, headless on the laptop alone with a bot pressing the pad page on a
   fixed cue (shots at 60 units a second, 1.5 units of forgiveness): a hen standing still was
   hit by 14 of 14; the bot dodged 14 of 14 with 0, 100 and 150 ms of lag added, 1 of 14 at
   200 ms, none at 250 ms. The pad's round trip was 11 to 14 ms. So a press can land about
   150 ms late and still clear, which is roughly ten times the hop measured here. Not measured:
   a real phone on the party Wi-Fi, the TV's own display lag, and whether it feels right in a
   hand. That part is Brad's to play.
2. **Build order.** The crew plumbing (`selectCrew`, `crewTurn`, `PadSurface`, `actorPlayerId`,
   the pulse) is on main, but the brawl's own screens are interim and its spec is still a
   draft, so the plumbing may yet move. This game needs one addition to it: a crew that is a
   pair with a pair on deck, where the brawl's crew is everyone who stepped out.
3. **Aim.** Stick-aimed eight ways (the genre's own, and free on this pad) or forward-only with
   the stick left for running and ducking. Forward-only is the easier five-second read.
4. **The cast.** The hen has no jump, duck or spray. `fly` may do for the jump; duck is a new
   pose; the spray is a stream drawn from the beak over any pose. A cast change comes first.
5. **Who shoots back.** Fappy Bird's spitters already spit a glob the sim owns, and they would
   make turrets. Geese as runners would make this read as the brawl with range; the base wants
   its own kit.
6. **The schedule.** With Dunlop Dash, Fappy Bird and Streets of Barrie this is a fourth twitch
   game for the same two slots. It is the same pad as the brawl, so the two must never sit next
   to each other, and one night probably holds one of them.
7. **Solo and the teaser.** One hen runs the stretch alone on a tablet or a phone; the crew
   spec's solo surface is the pattern.
8. **The name.** Working title only.

## References / inspiration

- The run-and-gun genre (Contra, Metal Slug, Gunstar Heroes) for the shape: two players, one
  screen, pickups, a gate at the end. Genre only; no levels, characters or art.
- [brawl-crew-spec.md](../brawl-crew-spec.md) §0.5 and §0.6 for who runs the game and what a
  phone is.
- `docs/research/tablet-brawler-controls.md` §6 for two players sharing one device, the option
  this idea did not take.
