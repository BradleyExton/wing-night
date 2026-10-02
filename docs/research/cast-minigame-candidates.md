# Games worth mimicking as the next cast minigame — research notes for Wing Night

Date: 2026-10-02. Companion to [party-minigame-design.md](party-minigame-design.md) (the
principles) and [tablet-brawler-controls.md](tablet-brawler-controls.md) (touch input on the
host tablet). Idea files under `docs/minigames/ideas/` cite findings here as `C.3`, `C.7`;
principle numbers (§5, finding 6.2) refer to [docs/minigame-design-principles.md](../minigame-design-principles.md)
and the research behind it.

## The question

The four cast games are each a known game wearing the players' heads: Dunlop Dash is a
Sonic one-button runner, Fappy Bird is Flappy Bird as a relay, Slingshlong is Angry Birds with
the other teams as the pins, Streets of Barrie is Streets of Rage. That borrowing works
because a game the room already knows costs nothing to teach (principle §5: five seconds to
grasp the verb) and because the cast hen wearing a friend's face turns any failure into a
punchline (§6, finding 8.5). The question is which *other* well-known game is worth the same
treatment next, and which are traps.

## What a candidate has to survive

The constraints are the platform's, not taste, and they knock out most of the obvious list:

- **One shared Android tablet (1280×800 landscape, multitouch) is the only controller; the TV
  is the audience's screen and the speaker.** Anything that needs a phone per player is out.
- **No cross-screen timing.** A tap on the tablet against a thing moving on the TV crosses two
  unsynced clocks and a Socket.IO hop; Slingshlong rejected a timing tap on exactly this ground
  (`joust-spec.md` §2). Timing games are fine only when the thing being timed is *on the tablet*
  and the TV replays the input log afterwards, which is the Dunlop Dash / Streets of Barrie
  pattern: a pure, seeded, tick-stepped sim with no transcendentals, re-run on the wall.
- **The hen rig has nine poses** (`still idle walk fly dance ride peck hurt ko`) and no sprite
  sheets. A game that needs a verb the rig cannot do is a cast change first.
- **The roster's gaps are specific.** Every cast game is agon (competition) with a twitch or aim
  input shape, played as a per-player relay. Caillois's other two categories, chance (alea) and
  vertigo (ilinx), have nothing on the cast side (§6, finding 6.5). There is no rhythm game, no
  voice game, no simultaneous whole-team input, no push-your-luck decision, and no game where
  the spectating teams get to set a trap.
- **The sauce.** Forgiving gestures over precision; raw reaction time is a sobriety test (§10).

Each candidate below is scored against those and against the starred items of the §11
checklist (2 commit, 6 bad-answer-plausible, 9 whole team, 10 asymmetry, 13 spectator job, 15
one verb, 23 sauce).

---

## 1. Voice control: Chicken Scream

**1.1 The whole input is the microphone's volume, mapped to three states.** Chicken Scream
(Perfect Tap Games, 2017) listens to the device mic: a soft noise makes the chicken walk, a
loud one makes it jump, and silence freezes it on the spot. Louder means faster. The player
sets the sensitivity. It is a 2D platformer otherwise: gaps, spikes, a scrolling course.
PhoneArena, "Chicken Scream is a game where you make a chicken run by shouting at your phone"
(2017): https://www.phonearena.com/news/Chicken-Scream-is-a-game-where-you-make-a-chicken-run-by-shouting-at-your-phone_id92441 ;
The Daily Star, "Shout, don't tap" (app review): https://tds-images.thedailystar.net/shout/app-review/shout-dont-tap-1423567

**1.2 Why it fits here better than it fits a phone.** On a phone the joke is that you have to
scream in public. In this room the joke is that the *whole team* has to scream, at a burning
mouth, while the hen with their face on it stands there until they do. It is the only input
shape on this list that makes item 9 (whole team moves or speaks) literally true, and the
body is the joke (§2, "this is ridiculous" comes from the body). It also fills the vertigo
gap: losing your voice is losing control.

**1.3 Feasibility: the mic is a Web Audio graph, and the tablet is an insecure origin.**
`getUserMedia` → `MediaStreamAudioSourceNode` → `AnalyserNode`, RMS over the time-domain buffer
every frame, is the standard meter and runs on Android Chrome. The lobby already runs a Web
Audio beat detector on the TV (memory: never close the context), so the engine pattern exists.
The catch: Chrome only exposes `navigator.mediaDevices` on a secure context, and the host tablet
reaches the laptop at `http://192.168.x.x`. Either the laptop serves the host surface over HTTPS
(a `mkcert` cert the tablet trusts once) or the tablet gets a one-time
`chrome://flags/#unsafely-treat-insecure-origin-as-secure` entry for the server origin. This is
the one open question that decides whether the idea is buildable, and it is a setup question,
not a code one.
James Fisher, "Measuring audio volume in JavaScript" (2021): https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/ ;
DEV, "Building a real-time microphone level meter using Web Audio API": https://dev.to/tooleroid/building-a-real-time-microphone-level-meter-using-web-audio-api-a-complete-guide-1e0b

**1.4 Wire shape.** The sim runs on the tablet from the metered level (walk / jump / freeze
thresholds, with the host-set sensitivity as a rule), the level samples are the input log, and
the TV replays the log the way Dunlop Dash replays taps. Nothing audio crosses the wire. Promote
as [ideas/scream-run.md](../minigames/ideas/scream-run.md).

## 2. Curling: drag-release plus a sweep

**2.1 The rules that matter.** Each of four players throws two stones an end; "only one team can
score in an end. A team scores one point for every rock that it has closer to the center of the
house than the other team"; "sweeping makes a rock curl less and travel farther"; the hammer is
the last rock of the end; a guard is "a stone placement that protects stones in the house".
Dummies, "Curling For Dummies cheat sheet": https://www.dummies.com/article/home-auto-hobbies/sports-recreation/curling/curling-for-dummies-cheat-sheet-208778/ ;
Grand Slam of Curling, "Beginner's guide to the rules of Olympic curling": https://thegrandslamofcurling.com/beginners-guide-to-the-rules-of-olympic-curling

**2.2 Why it is not just Slingshlong on ice.** The throw is the same forgiving drag-and-release
Slingshlong chose for the sauce. Three things are new, and they are the three the roster lacks:

- **Sweeping is post-commit influence by the people who did not throw.** The thrower lets go,
  and then two teammates rub the tablet to carry the stone further; the throw is the commit, the
  sweep is the whole team on the device at once. Overcooked's "more jobs than hands" (finding
  6.2) in a gesture, and it is the gesture sauce makes funnier, not harder.
- **The sheet persists across the round.** Every team's stones stay in the house until the end
  is scored, so a later team can take out an earlier team's bird. Slingshlong's "whoever goes
  over stays over" and Dunlop Dash's best-run ghost (plugin round memory) are the precedents; the
  payoff is the spectating teams having a stake in every throw (item 13), not just the last one.
- **Curling's scoring is a near-miss machine.** Second-closest scores nothing; a stone an inch
  short of the button is the whole argument. Item 4 for free.

**2.3 Determinism is cheap.** Curl is lateral acceleration proportional to speed, friction is a
constant deceleration: no trig, so the existing `noTranscendentals` test shape applies. Barrie
Curling Club is a real place for the set. Promote as
[ideas/kempenfelt-curling.md](../minigames/ideas/kempenfelt-curling.md).

## 3. Push your luck: Can't Stop, Pass the Pigs, and the Wing of Death

**3.1 The mechanic.** Can't Stop (Sid Sackson, 1980): roll, advance, then choose to stop and bank
or roll again; a roll with no legal move means "the turn is over and the player gains nothing",
"generally called 'going bust'". Zombie Dice and Pass the Pigs are the same decision with
different dice. The genre's whole tension is one question asked repeatedly in public: one more?
Wikipedia, "Can't Stop (board game)": https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game) ;
Meeple's Corner, "What are push your luck games?": https://meeplescorner.co.uk/blogs/boardgame-glossary/what-are-push-your-luck-games-everything-you-need-to-know-about-this-board-game-mechanic

**3.2 Why the roster needs a chance game and why this is the honest kind.** Nothing on the cast
side is alea. Mario Party's designers say "the outcome of the roll is 100% pure luck" and keep it
as a published rule (finding 4.1), and the principles file's only objection to chance is hidden
or unpreventable punishment (finding 4.5). Push-your-luck is chance where the player chose to
roll again, which is exactly the condition under which near misses motivate instead of
annoying (finding 1.4). The decision is also the team's argument, which is the content (§2).

**3.3 The skin is the night's own premise.** A rack of wings on the TV. Each teammate's bird
pecks one; most are points, one is the Wing of Death. Bank or peck again. The peck, hurt and ko
poses already exist. No physics, no content file beyond a seed, no clock: the cheapest thing on
this list to build and the most on-theme. Promote as
[ideas/wing-roulette.md](../minigames/ideas/wing-roulette.md).

## 4. Climb each other: Mount Your Friends

**4.1 The rules, in the game's own words.** "A physics based competitive climbing game where what
you climb is each other. Players take turns climbing to the top of a tower of previous climbers
(and a goat), working to become the new highest point before time runs out. If you run out of
time before reaching the top, you're eliminated." Expert play is flinging: "adept competitors can
create massive towers by flinging themselves faster than simple climbing methods can attain",
and "you may also end up just falling all the way down a tower if you miss". Limbs are
controlled one at a time: pressing a limb's button "unsticky"s it from whatever it held, you
move it, and it sticks to the next thing it touches.
Steam, "Mount Your Friends" (Stegersaurus, 2014): https://store.steampowered.com/app/296470/Mount_Your_Friends/ ;
Giant Bomb user review describing the controls: https://www.giantbomb.com/mount-your-friends/3030-43242/user-reviews/2200-27804/

**4.2 Why it is the best fit on this list.** Brad's group played it, so the five-second teach
is already paid. The shape is already ours: a turn order (a relay, one climb per player), a
clock per climber, a hard commit (let go) followed by physics nobody can touch. And the
mountain is literally the other players, which is Slingshlong's insight ("the targets are
everyone who isn't on your team") made permanent: the pile is plugin round memory, every
team's hens stay where they fell, and by the last team the wall is a stack of the room's faces.
Spectators are the terrain (item 13), every failure improves the mountain (item 6, §9), and
the pile at the end of the round is a keepsake the game draws itself.

**4.3 What has to change, and the one fairness question.** The original is an elimination, so
it never has to be fair across turns. We score, and the last team climbs the tallest pile, so
the rule that compensates (a clock that grows with the pile, or a start perch a fixed height
under the line) must be a published one (finding 4.2). The cast needs a ragdoll mode (six rig
parts as sim bodies, plus the second wing) before anything else; the sim is one live bird
against a static mesh of stuck ones, position-based dynamics without trig like Streets of
Barrie. The earlier "four teammates, one limb each" sketch is a mode of this, not a game.
Promoted to [mount-your-hens-spec.md](../minigames/mount-your-hens-spec.md).

## 5. One button, on a beat: Rhythm Heaven

**5.1 The design.** Rhythm Heaven / Rhythm Paradise (Nintendo, producer Tsunku) keeps input to one
or two buttons and asks for timing against the *sound*, not a scrolling lane: at its best it can
be played without looking at the screen, as call-and-response to audio cues. Tsunku had the team
take dance lessons so they would feel the beat rather than read it.
Iwata Asks, Rhythm Heaven (DS) and Rhythm Heaven Fever (Wii):
https://iwataasks.nintendo.com/interviews/ds/rhythm-heaven/0/2 ,
https://iwataasks.nintendo.com/interviews/wii/rhythmheavenfever/0/2 (the Nintendo host fails TLS
verification from here, as it did for the principles research; the en-gb mirror for Beat the
Beat: https://www.nintendo.co.uk/Iwata-Asks/Iwata-Asks-Beat-the-Beat-Rhythm-Paradise/Iwata-Asks-Beat-the-Beat-Rhythm-Paradise/6-The-Meaning-of-Everyone-/6-The-Meaning-of-Everyone--236716.html)

**5.2 Fit.** The pack already has team anthems and a beat-locked jig in the lobby; the dance pose
exists; pop is the genre whose silhouette "needs motion instead" (memory: genre silhouettes). A
one-button on-beat game is the obvious home for all three. The catch is the speaker rule: the
TV is the speaker, but a timing game must hear and tap on the *same* device. The teaser site
already made the phone its own speaker for Streets of Barrie, so the precedent for a game-local
speaker exists; the room hears the same track from the TV a few tens of ms off, which does not
matter for watching. Not promoted yet: it needs a decision on that rule first. Audio sync is a
spec question, not an idea question.

## 6. Everyone on the tablet at once: Bloop, Bam Fu, Achtung die Kurve

**6.1 The precedents.** Bloop (Rusty Moyher, 2012, IndieCade finalist): two to four players race
to tap the most tiles of their colour on one iPad; "soon the tiles shrink, hands collide, and
fingers cross". Bam Fu (2013): up to four on one iPad, every tap cycles a stone's colour, so the
mind game is flipping stones to an opponent's colour to bait a mistake. Achtung die Kurve
(1995): up to six on one keyboard, two keys each (turn left, turn right), lines move forward on
their own, survive longest.
Bloop, App Store listing: https://apps.apple.com/us/app/bloop-tabletop-finger-frenzy/id517320341 ;
Engadget, "Bam Fu is frenzied fun for multiple players on one device" (2013):
https://www.engadget.com/2013-05-30-daily-ipad-app-bam-fu-is-frenzied-fun-for-multiple-players-on-o.html ;
Achtung die Kurve WebGL remake notes (two keys per player, up to six):
https://pawel-bujnowski.itch.io/achtung-die-kurve

**6.2 Fit.** These prove four sets of hands on one tablet is a real genre and that the comedy is
the hands, which is right for the sauce. The engine's per-team turn means the four hands are
teammates, so the design has to be cooperative (each teammate owns a colour and must tap only
theirs, or each teammate's bird draws a trail and the team's score is total survival), which
removes the baiting that makes Bam Fu good. Worth keeping as an input shape (a four-corner
mode of §4) rather than a game of its own.

## 7. One tap, and waiting is the decision: Crossy Road and Frogger

**7.1 The design.** Hipster Whale on Crossy Road: "It all began with Flappy Bird... We wanted to
create a title that shared the same DNA, but was very different" (Matt Hall); "the core fun
element of Crossy Road is similar to that in Flappy Bird. It's that 'one more time' feeling";
"I wanted to have really obvious hit boxes and sharp edges so that you could play the game in a
precise way" (Andy Sum). Frogger's hazard is timing lanes of traffic and the river's logs, with
a safe median to wait on.
PocketGamer.biz, "The making of Crossy Road": https://www.pocketgamer.biz/making-of-crossy-road/ ;
Wikipedia, "Frogger": https://en.wikipedia.org/wiki/Frogger

**7.2 Fit.** The chicken is literal, the input is one tap, and the decision is *wait or go*,
which is a different decision from Dunlop Dash's *jump now*. But the view, the one button and
the relay shape are Dunlop Dash's, so in the room it would read as the same game with a
different street. Better as a Dunlop Dash *zone* (a Bayfield Street crossing section with
traffic that moves on the beat) than a new entry. Not promoted.

## 8. Catch what the other teams drop: Game & Watch Egg / Fire

**8.1 The design.** Egg / Mickey Mouse (1981): eggs roll from four hen houses, four buttons put
the basket under one, a missed egg breaks; the rate climbs. Fire: two players share one
trampoline. Nintendo's whole early catalogue is one-verb, two-to-four-button games.
Super Mario Wiki, "Egg (Game & Watch)": https://www.mariowiki.com/Egg_(Game_%26_Watch)

**8.2 Fit.** The other teams' birds as the four hens laying, the holder's bird catching with four
lanes: cheap, instantly readable, and the score is a count so near misses are automatic. It is
one person playing, though, and the room's only job is to watch eggs break. Keep on the bench
as a palate-cleanser if a short game is ever wanted; SEAR already holds that slot.

## 9. Faces, specifically: Face Raiders and Face Lift

**9.1 Face Raiders (3DS, 2011)** maps a photographed face onto flying orbs you shoot; "once
you've defeated yourself, you can then take photos of friends (or enemies) and watch as they
invade your living room too"; "scrolling through your collected faces is hilarious".
PocketGamer, "Hands-on with Face Raiders": https://www.pocketgamer.com/features/hands-on-with-face-raiders-on-the-3ds/

**9.2 Face-Lift (Mario Party, 1998)** gives every player the same face and 30 seconds to drag its
features to match a distorted target; most-accurate wins.
Super Mario Wiki, "Face-Lift (minigame)": https://www.mariowiki.com/Face-Lift_(minigame)

**9.3 Fit.** Face Raiders is Slingshlong's insight (the targets are your friends) with a shooting
gallery input, and a tap-to-shoot gallery is a reaction-time test, which §10 rules out. Face-Lift
is the one idea on this list that uses the uploaded heads *as images* rather than as hats on a
hen; it would need a mesh warp of the avatar bitmap and host judging. Fun, but it is a drawing
game with extra steps and the pack already has two of those. Neither promoted.

## 10. Mash: Track & Field and tug of war

**10.1** Konami's Track & Field (1983) "was the originator of the button mashing sports genre":
two run buttons pressed in alternation, the faster the better; home ports broke joysticks.
StrategyWiki, "Track & Field": https://strategywiki.org/wiki/Track_%26_Field

**10.2 Fit.** Multitouch means a whole team can mash one tablet at once, which is physical and
on-brand for the sauce; but mashing is endurance, the screen is going to be covered in sauce,
and the TV has nothing to show but a bar. Good as a *sweep* mechanic inside §2, not a game.

## 11. Set the trap: the penalty shootout

**11.1** Shootout games are simultaneous hidden choices: shooter picks a corner, keeper picks a
dive, reveal. A tabletop version has both players "secretly choose a direction card (LEFT,
CENTER, or RIGHT) and reveal them simultaneously".
SHOOTOUT (itch.io): https://nellwoodgames.itch.io/shootout

**11.2 Fit.** The interesting part is who plays keeper: the *previous* team, at the end of their
turn, secretly picks the dive the next team's shooter will face. That is a spectator job with a
stake (item 13) and a "the room knows and the player does not" asymmetry no shipped game uses
(finding 3.1). As a game it is thin (three choices), but as a *beat* it could be bolted onto
Slingshlong or §2 as a goalie bird on the target. Noted, not promoted.

## 12. Build then watch: Lemmings, Tricky Towers, Stack

**12.1** Lemmings assigns eight skills to walkers and watches; Tricky Towers is physics Tetris
where the fall is the show; Stack (Ketchapp) is one tap per block with the overhang sliced off,
so the tower narrows with every miss and a perfect run rises in pitch.
Wikipedia, "Lemmings": https://en.wikipedia.org/wiki/Lemmings_(video_game) ;
PlayStation, "Tricky Towers": https://www.playstation.com/en-us/games/tricky-towers/

**12.2 Fit.** CONTRAPTION already holds the build-then-watch slot, and Lemmings is a variant of it
(assign jobs to your own birds, hit GO). Stack is worth one sentence: a totem of the team's birds,
one tap each, the tower stays on the TV as round memory. Safe, cheap, and the near miss is built
in; but one person taps and the room has only the tower to watch. Bench.

---

## Scorecard

Against the starred items of the §11 checklist and the platform constraints. ✓ is yes by design,
~ is yes with a stated cost, ✗ is no.

| Candidate | Source game | 2 commit | 6 bad is plausible | 9 whole team | 10 asymmetry | 13 spectator job | 15 one verb | 23 sauce helps | New category | Overlap with shipped | Build cost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Scream Run | Chicken Scream | ✓ scream | ✓ | ✓✓ | nobody-knows | heckle the volume | ✓ "Scream to run" | ✓✓ | ilinx, voice | none | low + HTTPS setup |
| Kempenfelt Curling | curling | ✓ release | ✓ | ✓ sweep | nobody-knows, persistent sheet | their stones are at risk | ✓ "Slide it, sweep it" | ✓ | post-commit team input | Slingshlong's throw | medium (new sim) |
| Wing Roulette | Can't Stop / Hot Ones | ✓ peck | ✓ | ✓ one peck each, team argues | nobody-knows | shout "one more" | ✓ "Peck or bank" | ✓ | alea | none | lowest |
| Mount Your Hens | Mount Your Friends | ✓ let go | ✓✓ | ✓ one climb each | nobody-knows, TV sees the pile | they are the pile | ✓ "Drag a limb, let go to grab" | ✓ | ilinx, persistent spectacle | none | medium + ragdoll cast mode |
| Beat Hen | Rhythm Heaven | ✓ tap | ~ | ~ claps | nobody-knows | listen | ✓ | ~ | rhythm | none | medium + speaker rule |
| Bloop / Achtung | Bloop, Achtung | ~ | ✓ | ✓✓ | nobody-knows | watch hands | ✓ | ✓ | simultaneous | none | low |
| Crossy Barrie | Crossy Road | ✓ | ✓ | ✗ | spectator lead (camera) | lookout | ✓ | ✓ | none | Dunlop Dash | low |
| Egg Catch | Game & Watch | ✓ | ✓ | ✗ | nobody-knows | none | ✓ | ~ | none | none | low |
| Face Lift | Mario Party | ✓ | ✓ | ✗ | player-only | judge | ✓ | ~ | mimicry | Drawing, Forgery | high |
| Goose Hunt | Face Raiders | ✓ | ✗ | ✗ | nobody | targets | ✓ | ✗ reaction | none | Slingshlong | low |
| Mash | Track & Field | ✓ | ✓ | ✓ | nobody | watch a bar | ✓ | ~ | none | none | low |
| Shootout beat | penalty shootout | ✓ | ✓ | ✗ | spectator-only, the trap | set the trap | ✓ | ✓ | new asymmetry | Slingshlong | low |
| Totem | Stack | ✓ | ✓ | ✗ | nobody | watch the tower | ✓ | ✓ | none | none | low |

## Recommendation

Four get idea files, in this order of confidence:

1. **Wing Roulette** (§3). Cheapest, fills the chance gap, and it is the premise of the night as a
   game. Build this first if any of the four is built.
2. **Kempenfelt Curling** (§2). The sweep and the persistent sheet are the two things no shipped
   game does, and the throw is a gesture the room already knows from Slingshlong.
3. **Scream Run** (§1). The most distinct input on the list and the one most likely to be
   remembered; blocked on one setup decision (HTTPS or the Chrome flag on the tablet).
4. **Mount Your Hens** (§4). The room already knows the original, the pile is the best
   spectator object on the list, and the keepsake is free. Fourth only because it needs a
   ragdoll mode in the cast before a line of game code; once that exists it is probably first.

Beat Hen (§5) is the next one up once the speaker rule has an answer. The rest are benched for
the reasons given, and the scorecard says why in a row each.

If one of these is scheduled it takes an unscheduled slot like Streets of Barrie, and §7 of the
principles still holds: it must not sit next to a game of the same shape. Wing Roulette is the
only one that can follow a twitch game.

## Sources

All URLs were fetched during this research unless marked otherwise.

- https://www.pocketgamer.biz/making-of-crossy-road/ — Hall and Sum on Flappy Bird DNA, "one more time", obvious hit boxes.
- https://www.phonearena.com/news/Chicken-Scream-is-a-game-where-you-make-a-chicken-run-by-shouting-at-your-phone_id92441 — Chicken Scream input map (search result; the page returned 403 on fetch).
- https://tds-images.thedailystar.net/shout/app-review/shout-dont-tap-1423567 — Chicken Scream review (search result).
- https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/ and https://dev.to/tooleroid/building-a-real-time-microphone-level-meter-using-web-audio-api-a-complete-guide-1e0b — Web Audio mic meter (search results).
- https://www.dummies.com/article/home-auto-hobbies/sports-recreation/curling/curling-for-dummies-cheat-sheet-208778/ — curling scoring, sweeping, hammer, guard (fetched).
- https://thegrandslamofcurling.com/beginners-guide-to-the-rules-of-olympic-curling — curling positions (search result; 404 on fetch).
- https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game) — Can't Stop rules, "going bust" (fetched).
- https://meeplescorner.co.uk/blogs/boardgame-glossary/what-are-push-your-luck-games-everything-you-need-to-know-about-this-board-game-mechanic — push-your-luck genre (search result).
- https://store.steampowered.com/app/296470/Mount_Your_Friends/ — Mount Your Friends rules (fetched); https://www.giantbomb.com/mount-your-friends/3030-43242/user-reviews/2200-27804/ — limb controls (search result); https://www.gamespark.jp/article/2014/07/30/50403.html , https://www.well-played.com.au/the-best-steam-summer-sale-bargain-is-about-nearly-nude-dudes-climbing-each-other/ — coverage (search results).
- https://iwataasks.nintendo.com/interviews/ds/rhythm-heaven/0/2 , https://iwataasks.nintendo.com/interviews/wii/rhythmheavenfever/0/2 — Rhythm Heaven (TLS failure on fetch, as before; search results); en-gb mirror https://www.nintendo.co.uk/Iwata-Asks/Iwata-Asks-Beat-the-Beat-Rhythm-Paradise/Iwata-Asks-Beat-the-Beat-Rhythm-Paradise/6-The-Meaning-of-Everyone-/6-The-Meaning-of-Everyone--236716.html (not fetched).
- https://apps.apple.com/us/app/bloop-tabletop-finger-frenzy/id517320341 — Bloop (search result).
- https://www.engadget.com/2013-05-30-daily-ipad-app-bam-fu-is-frenzied-fun-for-multiple-players-on-o.html — Bam Fu (fetched).
- https://pawel-bujnowski.itch.io/achtung-die-kurve — Achtung die Kurve rules (search result).
- https://en.wikipedia.org/wiki/Frogger — Frogger (search result).
- https://www.mariowiki.com/Egg_(Game_%26_Watch) — Game & Watch Egg (search result).
- https://www.pocketgamer.com/features/hands-on-with-face-raiders-on-the-3ds/ — Face Raiders (fetched).
- https://www.mariowiki.com/Face-Lift_(minigame) — Face-Lift (search result).
- https://strategywiki.org/wiki/Track_%26_Field — Track & Field mashing (search result).
- https://nellwoodgames.itch.io/shootout — tabletop shootout (search result).
- https://en.wikipedia.org/wiki/Lemmings_(video_game) , https://www.playstation.com/en-us/games/tricky-towers/ — (search results).
- https://www.gamedeveloper.com/design/one-button-games — Berbank Green, "One Button Games" (2005), the taxonomy of press / hold / release / rhythm / timing and the charged-shot claim (fetched); background for every one-button entry above.
- https://en.wikipedia.org/wiki/Ridiculous_Fishing — three-phase structure, "performance in one minigame led to a more rewarding experience in the next" (fetched); considered and dropped: the tilt phases need a gyroscope the tablet has but the TV cannot mirror honestly, and the shooting phase is a reaction test.
