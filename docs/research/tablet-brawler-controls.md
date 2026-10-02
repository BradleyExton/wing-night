<!-- Research notes gathered 2026-10-02 by a background agent against primary sources, for Streets of Barrie (BRAWL, docs/minigames/brawl-spec.md §0.3, §0.6). Finding numbers (n.m) are what a spec change should cite. -->

# Touch controls for a tablet beat 'em up — research notes for Streets of Barrie

Researched 2026-10-02. Scope: developers' own words, store pages, platform guidelines, published
studies, and reviews that describe a game's controls precisely. Where a primary source could not be
reached, the finding says so.

## The two questions

1. **Is the current two-zone scheme intuitive, or what would be more intuitive?** Today (§0.3, §0.6)
   the arena is the controller. The left 35% is a walk pad: hold it and the hen walks toward whichever
   side of the pad's *fixed centre* the thumb is on, and slides across that centre to turn. The rest is
   the peck zone, where any tap pecks. There is no jump and no block, and movement is 1-D along `groundY`.
   Facing follows the last walk, never the peck.
2. **Should the hen move up and down as well (classic beat 'em up depth)?** How do touch beat 'em ups
   input 2-D movement, and is it worth it here?

## How to read this

- Each finding is a one-line claim in bold, then the evidence, then the URL. Every URL was fetched
  and quotes are verbatim from the fetched text.
- **(synthesis)** marks my inference, not something a source says.
- The device: an Android tablet, 1280×800 landscape, held in two hands, passed to a new player each
  block, and a phone held sideways on the teaser site. The players are drunk, have sauce on their
  fingers, and may be holding the tablet for the first time mid-game (principles §5 and §10).

---

## 1. Movement schemes

**1.1 A drawn joystick fails because you can't feel it, and any direction slid anywhere on the screen
already carries the input.** James Hague: "you can't feel the image. There's no feedback indicating that
your hand is in the right place or if it slides out of the control area." He credits Jeff Minter's
*Minotaur Rescue* with the fix: "directional movement anywhere on the screen contains useful
information… There's no need to restrict input to a particular part of the screen; anywhere is fine."
James Hague, "Virtual Joysticks and Other Comfortably Poor Solutions" (2012): https://prog21.dadgum.com/124.html

**1.2 In a controlled study, fixed directional buttons demanded the most attention, and a floating
joystick cut glances at the device.** Baldauf et al. compared directional buttons, a d-pad, a floating
joystick and tilt. The paper found "the directional buttons require the most attention of the user,
however, work precisely for direction-restricted navigational tasks", that the d-pad and joystick
"encourage drifting and unintended operations", and that "the floating joystick can reduce the glances
at the device." The current walk pad is in effect two directional buttons (a fixed left half and a
fixed right half), which is the precise but attention-hungry design *(synthesis)*.
Baldauf, Fröhlich, Adegeye & Suette, "Investigating On-Screen Gamepad Designs for Smartphone-Controlled Video Games", *ACM TOMM* (2015): https://publications.ait.ac.at/en/publications/investigating-on-screen-gamepad-designs-for-smartphone-controlled/

**1.3 The "touch anywhere on the left half" stick has shipped in a mass-market port, with a tap target
far larger than the button drawn for it.** Stardew Valley mobile's "Invisible Joystick & 2 Buttons"
scheme: "Tap anywhere on the left half of the screen, this becomes the center of the joystick. Drag
your thumb up/down/left/right to move the farmer". The right-hand button zones run "From the bottom
right half of the screen to 200 pixels in", far past the button art. TouchArcade on the update: "a big
invisible joystick that will center itself wherever you place your thumb."
Stardew Valley Wiki, "Mobile Controls": https://stardewvalleywiki.com/Mobile_Controls ; TouchArcade (2018): https://toucharcade.com/2018/11/01/stardew-valley-mobile-controls-update/

**1.4 Tap-to-move (point and click) was the default that drew complaints, because a fat finger turns
into the wrong action.** The same Stardew update was added because "the game's default tap-to-move
control scheme was not to everyone's liking. Especially on the iPhone where things were much smaller
and 'fat-fingering' an incorrect action could be really frustrating."
TouchArcade (2018), link in 1.3.

**1.5 Brawl Stars offers tap-to-move as the easy default, with a drag stick as the precise option, and
assigns the thumbs by touch order rather than screen position.** Pocket Gamer: "Tapping sends your
character to the location you selected." With the joystick, "You drag on the screen to move, and
tapping will cause you to attack"; the joystick "is arguably better for precise movement. It makes it
much easier to correct your position quickly and to dodge attacks narrowly." Also: "the first finger
you place is always for movement and the second finger will attack." (Supercell's own rationale could
not be found. This is the best reachable description of the shipped options.)
Pocket Gamer, "Brawl Stars tips and tricks": https://www.pocketgamer.com/brawl-stars/brawl-stars-tips-and-tricks-a-guide-for-the-beginner-brawler/

**1.6 Porters who prototyped gestures still went back to virtual buttons and a floating stick for a
complex action game.** On Playdigious's Dead Cells port: "While some gesture-specific schemes were
prototyped and tested, in the end the old standby virtual buttons ended up being the most playable
option." The stick floats by default, with "an option for a fixed rather than floating control stick."
TouchArcade summarising Playdigious's Gamasutra breakdown (2019): https://toucharcade.com/2019/05/07/dead-cells-mobile-blog-post/ (the original Gamasutra post no longer resolves on gamedeveloper.com)

**1.7 Even Blizzard called a virtual stick hard to get right.** Diablo Immortal's BlizzCon 2018 panel:
"Implementing a virtual control stick in mobile is really tricky and hard to get right. To be honest,
I was pretty skeptical we could even pull it off".
BlizzCon 2018 Diablo Immortal panel transcript: https://diablo.blizzplanet.com/blog/comments/blizzcon-2018-diablo-immortal-panel-transcript/5

**1.8 The faithful port, Streets of Rage 4 (stick left, buttons right), reviewed well on phones and
poorly on tablets.** TouchArcade: "The controls work well on my phone, but I didn't enjoy myself much
on the iPad with virtual controls after a few stages." Pocket Gamer: "I struggled with the virtual
D-pad, to be honest, and played most of the game with my controllers". The full SoR control set (an
8-way stick plus several buttons) is the thing that wears on a tablet *(synthesis)*.
TouchArcade review (2022): https://toucharcade.com/2022/05/24/streets-of-rage-4-mobile-review-mr-x-nightmare-dlc-price-worth-it-iphone-ipad-pro-performance-controller-support-graphics-online-multiplayer/ ; Pocket Gamer review: https://www.pocketgamer.com/streets-of-rage-4/mobile-review/

---

## 2. Attack input

**2.1 Mobile-native brawlers make the attack a tap anywhere, and that tap hits whoever is near.**
Beat Street (Lucky Kat), a one-thumb beat 'em up: "A touch anywhere invisible analog stick controls
your movement, with taps unleashing your fists and feet." Stuff: "you tap the screen, to the detriment
of anyone standing nearby." Pocket Gamer: "Tap when you're close to an enemy and you'll unleash a
volley of kicks and punches."
TouchArcade preview: https://toucharcade.com/?p=225055 ; Stuff review: https://www.stuff.tv/?p=41356 ; Pocket Gamer review: https://www.pocketgamer.com/beat-street/review/

**2.2 One Finger Death Punch is a brawler built on two inputs: hit left, hit right.** "Players press
either the left or right button, corresponding to which side of their character the enemies are
currently on." There is no walking; the character steps to the nearest enemy on the side pressed.
Wikipedia, *One Finger Death Punch*: https://en.wikipedia.org/wiki/One_Finger_Death_Punch

**2.3 Brawler players mash by instinct. OFDP punished mashing; a party game probably should not.**
Silver Dollar Games: "When our friends play tested our game they'd instinctively button mash, they
couldn't help themselves… The game's designed in such a way that if you button mash, you die." For a
drunk room, mashing is the input to expect, so it should be safe (it costs nothing) rather than fatal
*(synthesis, with principles §10)*.
Steam store page, *One Finger Death Punch*: https://store.steampowered.com/app/264200/One_Finger_Death_Punch/

**2.4 Punch Quest showed that "tap a side of the screen" can carry a whole runner-brawler.** "The
character is controlled by tapping either side of the screen. Hitting the left side of the screen
uppercuts and slams opponents downward, while hitting the right performs a forward-dashing jab." It
scored 93 on Metacritic.
Wikipedia, *Punch Quest*: https://en.wikipedia.org/wiki/Punch_Quest

**2.5 Combo Crew dropped the d-pad altogether: you swipe at an enemy and the fighter goes to them.**
The Game Bakers: "How come mobile beat 'em ups are never as much fun as the old days at the arcade?
It's because virtual D-pads suck." AppSpy: "Swiping on an enemy will send your fighter in their
direction to attack". Movement becomes a by-product of choosing a target.
The Game Bakers, Combo Crew page: https://www.thegamebakers.com/?p=1648 ; AppSpy review: https://www.appspy.com/combo-crew/review/

**2.6 Auto-attacking whatever is in range is a shipped accessibility answer to touch combat.** Dead
Cells mobile added "an exclusive new mode called Auto-Hit which has your character automatically
performing the melee attack on enemies that are within range".
TouchArcade (2019), link in 1.6.

---

## 3. Depth (the second axis)

**3.1 The genre's known failure is attacks that miss because the fighters are not on the same depth
line, and the fix is generous depth on the hit boxes or an auto-align.** A hobbyist on the OpenBOR forum,
whose engine and community exist for this genre: "It seems hard to hit the enemies unless the player is
lined up perfectly with the enemy." The reply: "if they are thin, they won't collide unless entities
are perfectly aligned", with two fixes: widen the depth of the attack or body box, or "Use script at
start of an attack to auto-align player and enemy if the distance is small enough." A third poster
warns: "A too big value will make weird results."
ChronoCrash (OpenBOR) forum, "Hit boxes in beat em ups": https://www.chronocrash.com/forum/threads/hit-boxes-in-beat-em-ups.7099/latest

**3.2 Free 2-D movement makes the player the worst shot on the screen.** A developer's devlog on
adding depth movement: "it had become increasingly difficult to hit the enemy. The player is at a
serious disadvantage as the AI is better than us at hitting its target."
Game Genies, CrumBrawler devlog, "So Much Room To Move… So Much Room to Miss": https://gamegenies.itch.io/crumbrawler/devlog/687344/so-much-room-to-move-so-much-room-to-miss

**3.3 Classic beat 'em up AI walks onto the player's depth line first and only then closes in, because
attacks only go left and right.** "most BEU games seem to have the enemy try to achieve the same
'horizontal line' as the player, as the primary objective." The reply: "it works best if the enemies go
to the player's horizon line first. While it looks more natural if they approach from all angles, it
can feel cheap if you can only attack left or right." So in the classic form the *enemies* do most of
the depth work *(synthesis)*.
Epic Developer Community forum thread (2023): https://forums.unrealengine.com/t/beat-em-up-game-how-do-you-think-the-enemy-characters-should-move-in-relation-to-the-player/1227311

**3.4 Discrete lanes are a modern answer to depth, and depth must stay readable.** Ra Ra Boom's
studio head: "Making the early choice to add lanes to the environment gave us a fun playground in which
to design different combat scenarios for enemies." On floating enemies: "you have no idea where they
are in relation to your own environment", so they gave one "holographic legs" so it is "tied to the
ground." Without that it was "insanely frustrating to fight." The same holds for our gull's dive if
depth is ever added *(synthesis)*.
Chris Bergman (Gylee Games), Xbox Wire (2025): https://news.xbox.com/en-us/2025/08/12/ra-ra-boom-baddies-worth-punching/

**3.5 Two sides of the screen is what lets a player, and a room, see every threat.** On the 2-D era:
"When the player only had to pay attention to two sides of the screen, it was easy to dole out enemies
in small proportions and still know as a designer the Player would immediately be aware of all threats
on screen." BRAWL's TV "BEHIND YOU" job (§0.3, §3) depends on the same two-sidedness *(synthesis)*.
Tilting at Pixels, "Death and Rebirth of the Beat 'Em Up Genre": https://tiltingatpixels.com/post/Beat-em-up-Part-2/

**3.6 The touch precedent for depth is a one-thumb slide combined with a proximity attack, not a stick
plus aimed hits.** Beat Street's reviews describe 2-D movement by sliding ("You move your thumb around
the screen to move") and an attack that lands on "anyone standing nearby" (2.1). A proximity attack is
what makes depth survivable on touch *(synthesis from 2.1, 3.1 and 3.2)*.
Pocket Gamer and Stuff reviews, links in 2.1.

**3.7 Lane swipes are the most widely known touch input for discrete lanes, but in Subway Surfers they
dodge rather than aim.** "While running, the player can swipe up, down, left, or right to avoid
crashing into oncoming obstacles". The swipe vocabulary is four discrete flicks, so it tolerates
imprecision. It is also a second gesture to learn on top of hold-to-walk *(synthesis)*.
Wikipedia, *Subway Surfers*: https://en.wikipedia.org/wiki/Subway_Surfers

---

## 4. Ergonomics on a landscape tablet

**4.1 A tablet lifted in two hands puts the thumbs on the sides, at mid to upper height. The bottom is
hostile.** Josh Clark: people grip at the sides with thumbs "at the middle to top third of the screen";
"the top and bottom edges of tablet screens are hostile zones, because of the necessary reach. The
bottom is especially tough, since thumbs are rarely near the bottom".
Josh Clark, "How We Hold Our Gadgets", *A List Apart* (excerpt from *Designing for Touch*): https://alistapart.com/article/how-we-hold-our-gadgets/

**4.2 Put the controls where the thumbs come to rest.** Clark again, as liveblogged: "Your thumbs are
more likely to be on the sides, with easy reach to the top. So put controls in those regions where
thumbs can come to rest: the side."
Jeremy Keith liveblogging Josh Clark, An Event Apart Atlanta (2013): https://adactio.com/journal/6053

**4.3 Touch is imprecise everywhere and worst near the edges and corners.** Hoober: "People are better
at tapping at the center of the screen, so touch targets there can be smaller—as small as 7
millimeters, while corner target sizes must be about 12 millimeters", and "not a single user had
tapped the exact center of the menu icon". A boundary a thumb has to land on the correct side of (the
walk pad's fixed centre) is exactly that kind of target *(synthesis)*.
Steven Hoober, "Design for Fingers, Touch, and People, Part 1", UXmatters (2017): https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php

**4.4 Platform floors: 44 pt (Apple) and 48 dp, about 9 mm (Google).** Apple: "Create controls that
measure at least 44 points x 44 points so they can be accurately tapped with a finger." Google: "A
touch target of 48x48dp results in a physical size of about 9mm, regardless of screen size." These are
floors for a sober user's buttons. A greasy, unaimed thumb in a game wants zones many times larger
*(synthesis)*.
Apple, UI Design Dos and Don'ts: https://developer.apple.com/design/tips ; Android Accessibility Help, "Touch target size": https://support.google.com/accessibility/android/answer/7101858?hl=en

---

## 5. Precedents for the exact split "left thumb moves, right thumb hits"

**5.1 The split is the genre's default on touch, so it needs no teaching.** Dan the Man (Halfbrick):
"left and right movement inputs on the left side of the screen and its attacking, jumping, and special
weapon buttons on the right side". The reviewer adds that touch inputs can let such games down,
"Thankfully, this is not the case with Dan the Man." Streets of Rage 4 (1.8), Stardew's invisible
stick (1.3), Brawl Stars' joystick mode (1.5) and Dead Cells (1.6) use the same left/right split.
Super Phillip Central, *Dan the Man* review (2017): https://www.superphillipcentral.com/2017/04/dan-man-ios-android-review.html

**5.2 Dan the Man is the closest shipped precedent to the current pad: 1-D movement as left and right
inputs.** It is the 1-D, directional-buttons form of 1.2. It worked for a reviewer who chose the game,
and the price is attention on the buttons, not on the street *(synthesis from 1.2 and 5.1)*.
Link in 5.1.

**5.3 The one-thumb alternative (Beat Street) folds both verbs into one hand: slide to move, tap to
hit.** See 2.1. It keeps one hand free, which matters for the phone teaser but not for a two-handed
tablet *(synthesis)*.

---

## 6. Two players on one tablet (an option only)

**6.1 Splitting one screen between players is an established party pattern.** Badland: "up to four
players each utilizing a corner of an iPad screen in a race to the finish line." Fruit Ninja HD: "You
and a friend each crowd around your iPad at opposite ends… It's hectic fun".
TouchArcade on Badland (2013): https://toucharcade.com/2013/01/15/badland-set-to-hit-in-march-check-out-its-local-multiplayer-mode-in-this-new-trailer/ ; Macworld, *Fruit Ninja HD* review: https://www.macworld.com/article/206840/fruitninjahdreview.html

**6.2 BRAWL's two zones already split cleanly between two people: one walks, one pecks.** A
"two-person hen", with a walker and a pecker yelling at each other, is a body-and-team joke
(principles §6). It needs no new input, only a different hint line and two seats per block. Flagged as
an option, not a recommendation *(synthesis)*.

---

## What this means for Streets of Barrie

### What is wrong with the current scheme

The *split* is right: left thumb moves, right thumb hits is the genre's touch default (5.1), and
"any tap pecks" on a large zone matches the mobile-native brawlers (2.1). The *walk pad* is the weak
part, for four reasons:

- **Direction is absolute.** The pad's centre (`resolvePadDir` in `HostBrawlSurface/Street`) is a fixed
  line 17.5% of the arena's width in from its left edge, roughly 220 px on the 1280-wide tablet. That is a boundary the thumb has to land on the correct side of. It is the
  directional-buttons design that takes the most attention (1.2), it has an invisible edge you can't
  feel (1.1), and it sits in a region where taps scatter (4.3) *(synthesis)*.
- **A resting thumb walks left.** A two-handed grip puts the left thumb near the bezel (4.1). That is
  the pad's left half, so a newcomer who simply holds the pad walks the hen backwards, away from the
  street. To go right they must reach in past a line they cannot see or feel *(synthesis)*.
- **Turning means a slide across a hidden line.** Turning around to face a goon behind is the one
  skilled move in the game, and it currently depends on knowing where that hidden line is.
- **The glyphs sit low.** If the ◀ ▶ glyphs and the PECK ring sit low in the arena, they teach the
  thumbs to reach for the bottom, the hostile zone (4.1). The thumb-rest glyphs belong at mid height
  *(synthesis)*.

### Candidate schemes

| Scheme | How it feels for a first-timer | Sauce tolerance | Supports up/down? | Cost on the current sim |
|---|---|---|---|---|
| **A. Current:** fixed-split walk pad (left 35%, direction = side of the pad's fixed centre) + tap-anywhere peck zone | Familiar split, but "which side of the line am I on?" A resting thumb walks backwards, and turning needs a slide across an invisible line | Peck: high. Walk: medium-low (a boundary target near the bezel) | No | None (as built) |
| **B. Floating 1-D thumb + peck half** (recommended): left half is the walk zone. Touch down and the hen walks the way she faces. Drag back past a small dead zone (about 30 px) and she turns and walks that way. The landing point is the centre, drawn as a ring under the thumb. Right half: any touch-down pecks (as today), and holding repeats the peck | "Hold to go, pull back to turn." Nothing to aim at, and it works wherever the thumb lands (1.1, 1.3) | High on both thumbs | No | Small, client-only: `Street` pointer handling and glyphs. Sim, actions and TV unchanged |
| **C. Floating 2-D stick + proximity peck + auto-align:** a Beat Street-style slide in x and depth (3.6). Peck hits anything within a wide depth band, and the hen snaps to the nearest goon's line on the peck (3.1). Goons walk onto her line before attacking (3.3) | Reads as "real" Streets of Rage. Fine once moving, but a second axis of drift on a greasy thumb, and two-axis attention is what 1.2 and 1.8 warn about | Medium (forgiving only if the depth band is generous, and "too big" goes weird, 3.1) | Yes | Large: positions gain depth in the sim, plus depth on every box, goon AI line-up, a depth-sorted scene, the TV mirror, the referee replay, the e2e spec and retuning every wave |
| **D. No walking, OFDP-style:** tap the left half to peck left, the right half to peck right. The hen steps to the nearest goon on that side, and walks on by herself between waves | The fastest five-second read ("hit the side they're on", 2.2, 2.4). But it stops being a walk-the-street game, and the room's "BEHIND YOU" becomes trivial | Very high | No | Medium: walk becomes automatic, and the peck takes a side and an auto-step. The scene and TV are unchanged |

### Recommendation: B, keep 1-D, and do not add depth input

**Q1: is it intuitive?** The two-zone idea, yes. The fixed-centre walk pad, not quite. Make the walk
thumb **relative**: wherever it lands is the centre, a plain hold walks the way the hen faces, and a
drag back past a small dead zone turns her. That is the "touch anywhere on the left half" pattern a
mass-market port shipped (1.3), the floating stick that cut glances in the study (1.2), and Minter's
"anywhere is fine" (1.1), reduced to one axis. It keeps the spec's design that facing follows the walk
and the TV's "BEHIND YOU", because turning stays a deliberate act. It just stops depending on an
invisible line.

**Q2: is depth worth it?** Not as an input, not for this night. Every source on depth names the same
cost: attacks that whiff because the fighters are a pixel off each other's line (3.1, 3.2). It is
solved only by fudges (wide depth boxes, auto-align, enemies lining up for you) that hand most of the
second axis back to the computer anyway (3.3). The fudges have to be tuned, and tuned too far they look
wrong (3.1). Meanwhile depth costs exactly what the room needs: two-sided readability on the TV (3.5),
the five-second rule (principles §5) and sauce tolerance (§10). The one touch brawler that does depth
well, Beat Street, gets away with it because its attack hits "anyone standing nearby" (2.1, 3.6). In
other words, depth there is mostly scenery. Building C to get scenery is the large refactor in the
table for a feel the players will barely be steering.

**If Brad wants the *look* of depth,** stage it rather than input it. Goons stand and mill on two or
three depth lines while the camera is locked, then **step onto the hen's line to telegraph and lunge**,
which is what classic beat 'em up AI does anyway (3.3). The hen stays on `groundY`, the peck stays
1-D, and nobody ever whiffs on depth. That is a scene and goon-drawing change plus a small stance
offset that resolves to zero before the goon's attack, so the sim's collision stays 1-D *(synthesis)*.
If depth must become an input someday, the least-bad way is C exactly as written: a floating stick, a
depth band at least the hen's own height wide, auto-align on the peck, and goons that line up before
they attack. Lane swipes (3.7) would add a second gesture vocabulary on top of hold-to-walk.

**Changes to make even though 1-D stays:**

1. **Make the walk thumb relative (scheme B).** The landing point becomes the centre, a hold walks the
   way she faces, and a drag back past about 30 px turns her. Keep pointer capture so a thumb that
   wanders off the zone keeps walking.
2. **Use halves, not 35 / 65.** The left half walks and the right half pecks (1.3), still stopping
   short of the bottom-right dock. The middle is out of both thumbs' reach on a 1280-wide tablet
   anyway, so the boundary never matters to a held tablet. On the phone it gives each thumb the most
   room *(synthesis, 4.1)*.
3. **Keep pecking on touch-down from any finger (it already does: `onPointerDown`), and add repeat
   while held.** Holding is what a greasy thumb does, and
   mashing is what brawler players do by instinct (2.3). Make holding safe rather than punished.
   Stardew's action button repeats while held (1.3), and the sim's own peck timing already rate-limits
   it.
4. **Put the thumb-rest glyphs at mid height on each side** (4.1, 4.2): a ring that appears under the
   walk thumb where it lands (B) and a big PECK ring on the right. Keep re-showing them at every handoff,
   as today, because each block is a new pair of hands.
5. **Do not auto-turn the peck toward a goon behind.** Auto-turning (2.6, Brawl Stars' quick-fire)
   would be more forgiving, but it deletes the room's "BEHIND YOU" (§0.3, 3.5). Making the turn cheap
   (item 1) is the better trade. Revisit only if table tests show newcomers never turn.
6. **Optional party variant:** offer two players per block, one per half (6.2).

Sources not reachable: Supercell's own Brawl Stars controls rationale, Lucky Kat's Beat Street dev
diary (the TouchArcade post embeds a video and has no transcript), Playdigious's original Gamasutra
breakdown, and any Streets of Rage 4 or Shredder's Revenge developer statement on depth tolerance. No
finding above rests on them.
