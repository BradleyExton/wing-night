---
name: Streets of Barrie — the back room (a finale level)
oneLiner: The last block of a BRAWL turn goes indoors: the crew fights through Crossover's to the back room, lifts a sleeping friend onto a hen's back and carries him out the rear door to a cab, while his wallet — which is the block's clock — loses a bill a song.
confidence: sketch
---

An expansion of a shipped game, not a new one: the first concrete candidate for
[brawl-crew-spec.md](../brawl-crew-spec.md) §4.6 ("what expand it a lot adds"). Investigated
2026-11-17. Nothing of the game is built and nothing should be until the throwaway prototype of §7
(`/dev/lab/brawl-back-room`, built the same day) has been played. Decisions are marked the way the crew spec marks them: **(Brad)** is a call he made on
2026-11-17, on a question card; everything else is mine and is his to overrule. A sketch of the
building as a block is at `apps/client/public/mockups/brawl-back-room/index.html`.

## Pitch

Brad's idea (2026-11-17): the final part of the brawl is a shake-up. The players go inside a
building and complete an objective to finish, the building is Crossover's, a friend is asleep in
the back room, his money is going down for as long as he sleeps, and the crew has to get him out.

Two blocks of street teach the crew to walk, peck and stand over a fallen friend. The third
spends all three on a different question. The street asks "how many geese can you put down before
the hearts go"; the back room asks "can five people move one sleeping body through a building
while somebody keeps trying to put him back". He is slung over one hen, and that hen cannot peck.
Everybody else is her escort. The staff do not want him to leave: a goose that gets to him on the
floor starts dragging him back the way he came. So the whole block is a tug of war along the
street's own axis, with one number on the wall — his wallet — getting smaller in the open.

It is worth doing for the reason the crew rewrite was (principles §6): more jobs than hands. On
the street five hens do the same job side by side. In here one carries, some guard, somebody has
to get a downed friend up, and nobody can do two of those at once.

## What Brad has decided

- **The last block is a finale level, and finales are swappable (Brad).** More will be built and
  one is dealt to each turn. Crossover's is the first. The two street blocks before it (Dunlop,
  the waterfront) are every team's.
- **Centennial Beach stays (Brad).** It is the finale for the sleeper's own team, for now: when
  his team is the crew he is on the street, not in the back room, and they finish at the Spirit
  Catcher against the boss goose exactly as today. Three blocks a turn either way, so a turn is
  no longer than it is.
- **The opposition inside is geese on staff (Brad).** The dancers stay on the stage as scenery
  and as the thing that runs the tab. Nobody pecks a dancer. §5 has what that sets and what was
  not picked.
- **The repo calls him "the sleeper" (Brad).** His name and head come from the pack on the night
  (§6). No real name, no real-life story and none of the reference photos go into a commit; this
  repo is public.

## The place — what the references fix

Ten reference images and the sale listing. The images are Brad's and stay on his machine; what
each shows is written down here so nobody needs them to build from.

| Reference | Shows | Use |
|---|---|---|
| Listing, front | The building from the front lot by day: a low flat-roofed brick box, three orange-red fascias, steel doors, clipped cedars, a sign for more parking at the rear | The start line. `@wingnight/scenery`'s `Crossovers` already draws this and the pole sign, for Dunlop Dash |
| Listing, main floor | Chairs up on the tables, the stage along one side under a canopy of bulbs with a chequered valance, poles, purple tube lights across a black ceiling, a chequered-flag panel | Window 0's back wall |
| Listing, pool room | Three pool tables with acid-green rails, mirrors, a pass-through to the bar, an EXIT sign | The hazard, and the look of the floor's far end |
| Listing, patio (two) | A covered patio at the back: block wall, a steel door with a number on it, drink ledges on the wall, slatted roof, a row of wooden benches, a fence | The way out |
| Listing, rear | The back of the building from the rear lot: the patio under its own little gable, a roof ladder, bins, a great deal of empty asphalt | The exit run and where the cab waits |
| Listing, aerial | The lot outlined: the building across the middle, parking in front on the Dunlop side and a larger lot behind | Proof it is one building deep with a lot on both sides |
| Phone photos (three) | The same floor in use, from a table by the stage and from the pool room: the pool room opens straight onto the floor, a wall of TVs and a beer neon over it, the stage beyond with red rope light and a lit chequered panel | How the rooms join, and the palette at night: blue-violet tubes, red rope light, green rails |

The listing (428 Dunlop Street West, at Ferndale Drive North, in the district the listing calls
400 North): about 7,000 square feet on one floor, a lot just under an acre, parking for about 79,
a patio for up to 70, licensed for 308.

Three things follow.

1. **It is nowhere near the other blocks.** Dunlop Street West at Ferndale is out by the
   highway, well west of the downtown blocks and the bay. The existing `Crossovers`
   drawing already says "out on the highway". The course cannot walk there, so the turn needs a
   cut: a cab. The waterfront block's way-out line gets a cab at the kerb, the hold between
   blocks (2.5 s, already there) is the ride, and the finale opens in the front lot. The cab that
   takes the sleeper home at the end is the same cab.
2. **The building is walk-through, and that is what makes it a block.** Front lot, front doors,
   the floor, a rear door, the patio, the rear lot. A scrolling brawler's camera only goes one
   way; an extraction that had to come back out of the door it went in by would need the camera
   to reverse, the stragglers' rule to flip and the way-out line to move. The real building has a
   way out that is not the way in. Nothing about the camera changes direction.
3. **None of the references shows the back room.** Everything about it below is invented from
   one sentence: a curtain, a couch, somebody asleep on it. Where it really sits off the floor is
   a question for Brad (Open questions).

## 1) Where it sits in the turn

**Settled (Brad): the finale replaces the third block for every team but the sleeper's, whose
third block is the beach.** What is left to say is what that costs and one thing it opens.

How long a block takes today, from the crew sim's own brawler bots (perfect play: they face the
goose, peck into the honk and revive), 40 seeds a cell, measured for this file:

| Crew | Block 0 (Dunlop) | Block 1 (waterfront) | Block 2 (beach, boss) | Worth dealt, three blocks |
|---|---|---|---|---|
| 1 | 21 s | 22 s | 36 s | 14 + 18 + 29 = 61 |
| 3 | 19 s | 20 s | 32 s | 37 + 45 + 66 = 148 |
| 5 | 18 s | 20 s | 34 s | 60 + 72 + 102 = 234 |

Bots do not hesitate, so a table of people will be slower by a factor nobody has measured (step 9
of the crew spec). Each block is capped at 90 s. A turn today is therefore somewhere between a
minute and a quarter and four and a half, plus two holds.

- **The finale is built on block 2's own skeleton**: three waves and an exit run, four windows of
  192. The beach's 33 s of perfect play is the floor; the lift, the carry (slower than a walk) and
  the tug of war go on top. The prototype's scripted crews take 42 to 45 s (§7), which puts a real
  crew somewhere near 90. So **the finale's clock is its own number, and I would start it at 120 s** (§4). Worst
  case that is half a minute more per team than today. A fourth block would have been up to a
  minute and a half more, which is why I would not have recommended it.
- **The boss goose becomes the bouncer.** Same goon, same rules, same `4 + 2 × (n − 1)` hp, a
  black T-shirt. He is the last wave, at the rear door, and he gets the one new rule a boss stage
  should have: he goes for whoever has the sleeper (§3). The Spirit Catcher keeps its boss, on
  the beach, for the team that finishes there.
- **Opened by the decision: two finales in one round have to be worth the same.** One team
  finishes on the beach and the rest in the back room. Each is marked out of what its own block
  was dealt, which is already how a crew of three and a crew of five are compared, so the sums
  never meet. But the *difficulty* has to match, or the sleeper's team has the easy night or the
  hard one, and the turn to beat (a share of a street) is compared across both. That is a balance
  pin for the bots, the same kind the crew sizes have: a crew of brawlers banks the same share of
  either finale, within a few points of a hundred, at every crew size. The rule is in the open —
  "they get the beach because he is on their team" — so it is not a hidden modifier (principle 5),
  but it does mean the one team that never plays the joke is the team of the man it is about.
  That may be exactly right. It is Brad's to feel at a table.
- **Whose turn shows the room the finale first** is the engine's opener rotation, as for
  everything else. The first team to play it has seen no extraction (principle 16); §8 says what
  softens that.

## 2) What "inside a building" is in this sim

The street is a band 32 deep; a block is a row of windows 192 wide; each wave locks the camera to
one window until it is down, then GO ▶. Three ways to put a building on that:

| | What it is | For | Against |
|---|---|---|---|
| A. One locked room | The whole finale in one window, camera never moves | Cheapest art; reads as "inside" at once | Nowhere to carry him *to*. An extraction with no distance is a pick-up, and the tug of war has no rope |
| **B. The rooms are the windows** | The band, the camera and the wave lock exactly as they are; each window is dressed as a room and each GO ▶ walks through a door | No new camera, no new geometry, block 2's skeleton as it stands; the building's real order is already left to right | Four windows of interior to draw, the biggest single cost in §7 |
| C. Free-roaming floor | A real floor plan with walls that block and a back room off to one side | Most like a building | Collision, doors with depth, a camera that turns: a different game, and every one of those is a thing a drunk thumb gets stuck on |

**Recommendation: B.** A room is a window the camera is already locked to. Walls are backdrop: a
door frame on the far wall and a change of floor at the seam (carpet, tile, concrete). Nothing
collides and nothing is drawn in front of a figure, the rule the street's hazards already follow
(DESIGN.md §2.14).

```
 window 0              window 1              window 2               exit run
 THE FLOOR             THE BACK ROOM         THE REAR DOOR          THE PATIO, THE LOT
 pole sign and doors   bead curtain,         kegs, the steel door,  benches, the fence,
 at the start; stage,  couch at the far      the bouncer            the cab at the line
 poles, pool tables    end: THE SLEEPER
 wave 0                wave 1                wave 2 + boss          no wave
 ─────────────────────────────────────────────────────────────────────────────▶
                       he is lifted here ──── carried, dropped, dragged back ──▶ out
```

- **Getting in** costs nothing new: the block starts with the crew at the doors under the pole
  sign (the way Dunlop starts at Souldiers), and wave 0 is the floor.
- **The back room is window 1.** The sleeper lies at its far end. He can be lifted while wave 1
  is still up, at the revive's price (standing still in a fight), or for free once it is down.
- **Getting out is window 2 and the exit run**, and it is the half of the block the objective is
  for: wave 2 is fought with him in the room.
- **The camera does not leave him.** Once the crew has reached him, the camera's limit is his
  position: GO ▶ only takes the window as far as he has been brought. Today a hen left behind is
  walked along by the window's left edge so she can be revived; if the sleeper were treated the
  same, the crew could stroll out and let the edge of the screen deliver him.
- **The interior is authored, not dealt.** The seed still deals the goons' order, sides and
  lines. The pool tables (the hazard: a goon shoved into them goes over in a clatter of balls,
  down whatever its hp, as the railing, the bay and the plinth do) stand where the floor has them.

## 3) The objective, with two verbs

Walk, peck, and stand still. Three ways to move a sleeping bird with those:

| | How | For | Against |
|---|---|---|---|
| a. Wake and escort | Stand over him like a revive; he gets up and follows the nearest hen; left alone or bumped, he nods off again | Reuses the revive whole | He is awake, which loses the joke. It is the escort mission as the genre is cursed for it: the crew's score in the hands of a slow follower nobody steers |
| **b. Carry** | Stand over him and he is on her back. She walks slower and cannot peck: a peck puts him down. A hit drops him | One defenceless carrier and a crew of guards: jobs, not a queue. The clearest picture on the wall. The room's "BEHIND YOU" lands on the one hen who cannot answer it herself | A new arrangement to draw; a rule to learn on the clock |
| c. Herd | He never wakes and is never lifted: a peck shoves him along the street the way a goon is shoved, and he bowls through geese | Smallest sim change of the three. The funniest thing to watch. A masher (hold right, hold peck) still gets him out, so the floor survives | No roles: five hens peck one body. A peck from the wrong side sends him back. Aim-assist has to choose between him and a goose. Less to shout |

**Recommendation: b, carry — and prototype c beside it**, because c is a day's work on the same
room and the only way to know which is funnier is to play both. The rest of this section is b.

- **Lifting him is the revive.** An up hen standing still (stick centred, not pecking, not
  reeling) within reach of him for `reviveTicks` (90, a second and a half) has him. The same ring
  closes round him that closes round a downed hen. A hit on her starts the count again.
- **Carrying him.** She walks at about 60% of her speed and her peck is shut. **A press of PECK
  puts him down** and pecks: the right thumb still means only "peck". A hit on her drops him where
  she stood. Going down drops him.
- **The staff put him back.** One goon at a time is "on him". While he is on the floor it walks
  to him and drags him back toward the back room at a crawl until it is pecked. While he is
  carried, it is on his carrier. The bouncer always takes this job when he is in. So leaving him
  on the floor to fight with every beak is a choice with a price, and the carrier always has
  somebody coming for her that only a teammate can stop.
- **The loss is bounded.** He cannot be dragged out of the window the camera holds, so nothing
  the staff do undoes a room. A drop costs the second and a half to lift him again (principle 22).
- **A hen who is down** is the existing rule and a second body on the floor: she needs somebody
  to stand over her, he needs somebody to stand over him, and standing still is what the geese
  punish. If the carrier goes down, both are lying in the same place. Everyone down at once is the
  wipe, as today, and on the last block that ends the turn (Brad's 2026-11-16 rule).
- **The block is cleared when he crosses the way-out line**, on anybody's back. Not when a hen
  does. The cab is at the line.
- **A crew of one** (a team with one phone out, the tablet's relay, the teaser's solo game) is
  both jobs: set him down, fight, lift him again. She cannot guard and carry, so for her the drag
  is the whole danger and the tab is the pressure. It has to be clearable alone by the bots or it
  does not ship.
- **Mashers.** A crew that holds right and holds peck never stands still, never lifts him and
  never clears it. That is the floor block 2 already has (mashers clear the beach 5 to 25% of the
  time), so it is not a new wall, but it is a wall: the finale cannot be mashed through at all.
  Under c it can.

Is "a peck puts him down" a third verb? I think not — no new control, no new thumb, and the pad
does not change — but it is the peck thumb gaining a second consequence, which is as close to the
line as the October research's "do not add a third verb" allows. Brad's to rule.

**Unresearched:** nothing in `docs/research/` covers an escort, carry or rescue objective. The
genre's reputation for hated escort missions is common knowledge and not a finding here. If this
goes to a spec, that gap is worth an afternoon first.

## 4) The timer as his money

**The wallet is the block's clock.** One clock on the wall, not two: the marquee's clock slot,
which shows the block's cap today, shows the wallet in the finale. When it is empty, that is the
bell.

- **How it reads.** Eight bills in the sign beside "$160". The dancers work by the song: at the
  end of each song a bill peels off the wallet and flies to the stage with a till's ring, and the
  number drops by twenty. Between charges the bill that is next burns down along its edge, so
  there is always something moving. Under the last bill the clock does what the house clock does
  in its last ten seconds (principle 1): it is the largest, loudest thing on the wall.
- **Starting numbers, for the prototype to break:** a 120 s clock. The first song is a long one —
  nothing is charged for the first 50 s — then a bill every 10 s, and the eighth goes at the bell.
  The grace is there so that a perfect extraction keeps the whole wallet and a perfect course is
  still full points, the property the scoring's own comment promises.
- **What it is worth.** Each bill is worth one for every hen in the crew, banked when he crosses
  the line, for the bills still in the wallet. So the finale's kit is everything a block's is
  (every goon's worth, the clean-wave bonus per hen per wave, three hearts per hen at the clear)
  **plus `8 × crew`**, and the team is still marked on worth banked over worth dealt. For a crew
  of five that is 40 on a course of about 274, around two of the fifteen points; for a crew of one
  it is 8 on about 69. Nothing is multiplied and nothing is hidden: the bills are on the wall for
  the whole block and each one lands in the tally by itself at the end.
- **At zero.** The bell, which is the existing `timeout`: the block keeps the goons and waves it
  banked, and banks no hearts and no bills. The ending is his, not the crew's: the bouncer carries
  him back to the couch and tucks him in, pockets inside out. A wipe banks the same and ends on
  the staff carrying the crew out to the bins in the rear lot (the bay's punchline, indoors).
- **Fair across crew sizes** because the wallet scales with the crew and the kit already does.
  The thing to pin by bot is that a crew of one and a crew of five lose about the same number of
  bills playing properly.
- **Fair across turn order** to the extent the whole game is: the same room, the same seed, the
  same charges for every team that plays it, and a later team has watched how it is done. The
  sharper question is the two finales (§1).
- **The decision it creates.** The camera will not move until a wave is down, so the crew cannot
  run for the door with the geese behind them. The wallet's pressure lands on the choices inside a
  wave: lift him now, under fire, or clear the room first; send two hens to revive a friend or
  leave her; put him down and peck, or keep walking and trust the escort.

## 5) Who is in there

**Settled (Brad): geese on staff.** For the record, what was on the card:

| Choice | The picture | Tone |
|---|---|---|
| **Geese on staff (picked)** | The street's own roster in work clothes; dancers on stage, never in the fight | The same joke as the street: Barrie's geese run everything. Nothing in it is about the dancers, and nothing to defend on a public site |
| Dancers come for him | Dancer hens walk to the sleeper and the tab runs faster while one is with him; a peck shoos her off, no knockout | Closest to the pitch and the bawdiest. The crew spends the block pecking at women at work, and the shoo is doing a lot of softening |
| Both | Staff are the fight, dancers a second thing to manage | Two systems to learn in the one block that is already teaching a new rule |

What the pick sets:

- The roster needs no new goon and no new rule except "one of them is on him" (§3). In costume:
  the **boss** is the bouncer, a head taller, black T-shirt. The **helmet goose** is the doorman
  with the earpiece, and his cage is what it was. The **goose** is floor staff in a bow tie with a
  tray. The **raccoon** is in the bins and comes in through the rear door. The **gull** is after
  the free wings on the letter-board. The **swan** is the house manager, and still only moves when
  nobody is looking at it. All of it is a layer over drawings that exist.
- The dancers are hens. The pole sign has said HENS HENS HENS since Dunlop Dash, and the cast
  is hens. On stage, feather boas, scenery: they dance, and when a song ends one of them
  catches the bill. They are the clock's face and never a target.

## 6) The sleeper

- **Content, not code.** The game knows "the sleeper"; the pack says who. A rule beside
  `blocksPerTurn` and `courseSeed` in `minigameRules.brawl`: a name, a head (a pack-relative
  avatar path like any other) and, when he is on tonight's roster, his player id. The repo's
  sample pack names nobody.
- **Nobody named means no back room.** With no sleeper in the rules, every team's finale is the
  beach, which is the game as it stands. So the committed sample, the dev sandbox and the public
  teaser never show the interior unless somebody asks for it, and the Crossover's finale only
  exists on a night whose pack names a man to rescue.
- **His own team's turn (Brad): they get the beach.** The sim does not need to know why; the
  runtime deals the finale by "is the sleeper on the active team".
- **He is not at the party.** A name and a head are enough, so he can be rescued in his absence,
  by every team, which may be the best version of the joke. Brad's call whether an absent sleeper
  means everyone plays Crossover's or nobody does.
- **How he is drawn.** His own cast hen in his own team's colour — so on every other team's turn
  one of *their* rivals is the body on the couch, and his team has a reason to watch (§8, item
  13). He lies in the cast's `ko` pose with the "· zzz" an away hen already wears, and rides in
  the same pose across a carrier's back. No new cast pose.
- **Later finales** will want the same shape: a level, the content it needs, and a rule for which
  team gets which. Worth designing the rule once, when there is a second one to design it against.

## 7) What it costs, and what to try first

**First, a throwaway prototype Brad plays** (the house way; the crew game itself began as one).
**Built 2026-11-17, unplayed by a person: `/dev/lab/brawl-back-room`**
(`apps/client/src/components/BrawlBackRoomLab`). It is block 2 of the real crew sim with the
sleeper bolted on in a wrapper round `stepBrawlCrew` (`backRoom/`), outside `packages/shared`, in
flat shapes on a canvas. One or two people on the keyboard (W A S D and Space; arrows and Enter),
or one on a touch screen with the real pad's stick laid over the street; the rest of the crew are
the brawler bots that already exist. Toggles: carry or herd; the drag-back on or off; the clock at
90 or 120; a bill a song on or off; crew of one to five.

It answers the three things no document can: is carrying a job or a chore, does the drag-back
read from the couch, and how long real people take. What it measured on the way, with a scripted
hen doing the carrying (fight like a brawler, put him down to do it, otherwise fetch him and walk
him out) and bots for the rest, 30 seeds a cell on the 120 s clock: **every crew of one to five
got him out, in a median 42 to 45 s, with all eight bills.** So the 50 s of grace is about right
for perfect play and the 90 s clock is not obviously too short; people will say.

What it fakes, so nobody mistakes it for the rules:

- **The goon that is "on him" is steered by the wrapper**, not by the sim: its place is written
  after each step and its own script is held, so it does not honk while it has him. It hurries
  (1.8 times its walk) because at a goose's own pace it never reached him before a bot pecked it.
  Against bots it drags him back up to about 50 units in a run, and often not at all.
- **Bots never lift him or herd him on purpose** (a bot's stray peck does shove him in herd mode).
- **The camera's wait is a clamp** applied after the sim's step, which also takes back a wave the
  sim opened by getting ahead of him.
- **In herd mode he does not bowl through geese.**
- No sound, no real figures, no rooms beyond coloured walls. Not on real phones as pads: a phone
  can open the page and play it alone with bots, which is enough to feel standing still on the
  real stick's dead zone.

It should not be judged before the core game has been on real phones once (step 9), because the
finale stands on things nobody has felt (below). Delete the lab folder, its route and its dev-index
entry once it has been played.

Then, if it is fun, in this order, each step ending with the gate green:

| Step | Where | What changes | Size |
|---|---|---|---|
| 1. Sim | `packages/shared/src/brawl/crew` | A block gains its finale (authored waves and hazard, the sleeper's spot, its own clock, the wallet in its total). The frame gains the sleeper (where, on whom, who is dragging him). `simulate`: lift (the revive's rule), carry speed, drop on peck or hit, the goon that is on him, the camera's limit, the clear rule, charges as events. Still pure, integer-friendly, no transcendentals. Bots that carry and guard; pins for the masher floor, a crew of one, bills kept by crew size, and parity with the beach | Medium: the 1,076-line step gains perhaps a fifth |
| 2. Runtime | `packages/minigames/brawl/src/runtime` | Rules gain the sleeper; the finale is dealt per team; totals include the wallet; views carry the finale and the sleeper's figure; per-hen stats gain carried and dropped. The reducer, the pulse and the phones' road do not change | Small |
| 3. Scene | `client/CrewScene` | The interior: four windows of backdrop in the night palette, the hazard, the cab. The sleeper, and the carry arrangement. Staff costumes over the goon drawings, the dancers. Three endings (the cab, tucked in, the bins) and a bill leaving | Large: this is most of the work, and all of it is drawing |
| 4. Surfaces and sound | `DisplayBrawlSurface`, `HostBrawlSurface`, `PadBrawlSurface`, `audio` | The clock slot as the wallet; the carrier marked on her chip; the finale's verb line; the ready plate naming the sleeper; two awards (carried him furthest, dropped him most). The pad gains at most a line of text. A till, a snore, a cab door | Medium |
| 5. E2E and docs | `tests/e2e`, the spec, `DESIGN.md` §2.14 | One extraction in the sandbox; the crew spec gains the finale; the surface language gains the room | Small |

Not needed: any change to the server, the socket contract, `crewTurn`, the phone shell or the
host's controls.

## 8) Principles check

All twenty-six of [minigame-design-principles.md](../../minigame-design-principles.md) §11,
against the recommended sketch (B, carry, the wallet as the clock). ★ are the items an idea must
answer.

1. Clock on the TV, last ten seconds loudest: **yes, and better than the street's.** The clock is
   a thing with a face on it.
2. ★ Commit before reveal: partly. Lifting him is a visible commit with a ring that closes, and
   crossing the line is the reveal of how many bills are left. Inside the carry there is no
   lock-in: it is continuous, like the rest of the game.
3. Hold beats: the lift, a drop, each bill leaving, the cab.
4. Near miss: **strong.** Bills go one at a time, and "one song late" is a sentence.
5. No hidden modifiers: yes. The wallet is on the wall; the kit is dealt by the published rule.
   The two-finales rule is visible but has to be *balanced* to be fair (§1).
6. ★ A terrible answer is plausible: pecking with him on your back to hit the goose in front of
   you, and dropping him at its feet. Lifting him in the middle of the wave. Three hens guarding
   an empty couch while the fourth carries him the wrong way round a pool table.
7. Human judge: n/a. The host keeps skip, reset and the override.
8. Failure is a punchline: tucked back in by the bouncer; the crew in the bins.
9. ★ Whole team: **the reason to build it.** Carrier, guards, the one reviving: more jobs than
   hands, and the carrier's only weapon is her voice.
10. ★ Information asymmetry: the street's — attention — at its sharpest. The goose that is "on
    him" is in plain sight of the room, and the hen it is coming for is looking at the door. It
    collapses at the drop. Plus one the street does not have: nobody knows how many bills will be
    left until he is over the line.
11. Frame while playing: wallet, crew strip with the carrier marked, block of three, the meter.
12. Standings on results only: unchanged.
13. ★ Spectators' job: call the goose behind the carrier by name, which she cannot answer; call
    the song ("ten seconds!"). And the sleeper's own team is watching its teammate be carried, or
    dropped, by the opposition, in its own colour.
14. Points land within a second: each bill left flies into the tally at the cab, one at a time.
15. ★ One verb line: "Get him out the back before his money's gone. Stand over him to lift him —
    a peck puts him down." That is the limit of one line and two clauses, and it replaces the
    street's line for this block rather than adding to it. **Weak.**
16. First team disadvantaged: **weaker than the street.** The first team to play it meets a new
    rule on the clock. Softened by the lift being the revive they have used for two blocks, by the
    ready beat (the couch is on the wall before Start, and the plate can say the rule), and by the
    grace before the first charge. Not solved.
17. One decision at a time on the phone: yes. The pad does not change.
18. First gate easier: within the block, yes — wave 0 is the floor, before he is in play. Within
    the turn it is the last block and is meant to be the hardest.
19. Host waiting: unchanged.
20. Every body is the player's own bird: yes, and the body being carried is somebody's too.
21. Team colour and name throughout: yes. A second team's colour is on the street for the first
    time (his), which is a cost to "five hens in one colour" only if his colour is near theirs.
22. Fail costs five seconds or less: a drop is a second and a half; a drag-back is bounded by the
    window. A downed hen waits for a teammate, as today, and there is now more for that teammate
    to be doing instead. **Partly no, a little worse than the street.**
23. ★ Sauce: standing still is the most forgiving gesture there is, and the carrier's whole job is
    one thumb. The one thing sauce makes worse is a stray right thumb, which drops him. That is
    either the comedy or the complaint, and only a table can say.
24. Reveal-and-react: the cab, the bills counted out, then the turn's awards with two new names.
25. Shape: unchanged for the night. Within the turn it is the change of shape Brad asked for.
26. Finale: it makes Streets of Barrie's own ending a climax, which the crew spec could not claim.
    It does not settle whether BRAWL should close the *night*: JOUST's claim is that its climax is
    the whole room's, and this is still one team's turn, repeated.

**Weak on, in one place:** it adds a rule to the one block with the least time to teach it (15,
16); it has not been played, and neither has anything it stands on; the carry may turn out to be
a chore for the one player who gets it; two finales in a round is a balance problem this file
names and does not solve; and its biggest cost is art.

## What it leans on that is not confirmed

From [brawl-crew-spec.md](../brawl-crew-spec.md) §4, none of it felt on a real phone:

- **§4.3, the eight-way stick.** The finale's central act is standing still on a spot. How easy
  that is depends on the stick's dead zone, which is the part of the pad Brad has not played.
- **§4.2, no phones means the relay on the tablet.** If that stands, the finale is played by one
  hen alone on the tablet and on the teaser, so "a crew of one" is not an edge case.
- **§4.4, the 192 × 108 window.** A room is exactly one window. If the window changes, so does
  every room.
- **§4.5, peck reach ±7.** The same band is how close in depth a hen must be to lift him.
- **§4.6, never a third verb.** Carry keeps two verbs by giving the peck a second consequence.
- Not in §4 but equally unfelt: `reviveTicks` at 90 (the lift is the same count), the 0.6 crew
  scaling and the standing cap (how many geese there are to guard against).

## Open questions

Brad's:

- Carry, herd, or both in the prototype and decide there?
- Is "a peck puts him down" inside the two-verb rule?
- The clock: 120 s for this block when every other is 90?
- The back room itself: where it is off the floor and what is in it. None of the references shows
  it.
- When the sleeper is not at the party: everyone rescues him, or nobody does?
- Does he know? His head will be asleep on a couch on the TV in front of the room.
- The teaser is public. With nobody named it never shows the interior (§6); is that the right
  default, or should the teaser have a stock regular to rescue?
- A cab from the waterfront to the highway: good enough for the geography, or should the course
  be re-ordered so it walks west?

Mine, for a spec:

- Whether one goon "on him" is enough pressure for a crew of five and not too much for one.
- Whether the lift should take the revive's full second and a half or less: it happens more often.
- What the wave meter shows in a block whose progress is one body's position. A track from the
  couch to the cab may say more than pips.
- Whether the beach, as the other finale, wants a clock with a face too, so the two feel like the
  same kind of ending.

## References / inspiration

- [brawl-crew-spec.md](../brawl-crew-spec.md): §0.3 (the revive, the camera, the wipe), §0.4 (the
  kit by crew size), §0.10 (the bots' numbers), §4.6.
- `packages/shared/src/brawl/crew` (`world` for a block's shape and total, `simulate` for
  `canRevive`, `resolveCameraLimit`, `resolveOutcome`); `packages/minigames/brawl/src/runtime`
  (`scoring`).
- `packages/scenery/src/Crossovers`: the exterior and the pole sign, already drawn.
- [docs/research/brawl-depth-and-strategy.md](../../research/brawl-depth-and-strategy.md): the
  roster's roles (E.3), "do not add a third verb", "do not make mashing fatal". It has nothing on
  escort or rescue objectives.
- `DESIGN.md` §2.14 (the band, hazards as street, never draw over a figure), §2.2D (the marquee's
  clock slot).
- The sale listing for the building, read 2026-11-17 for its size, lot and cross street.
