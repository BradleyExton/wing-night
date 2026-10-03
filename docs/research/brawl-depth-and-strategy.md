<!-- Research notes gathered 2026-10-02 by four background agents against primary sources, merged and synthesised for Streets of Barrie (BRAWL, docs/minigames/brawl-spec.md). Finding numbers (M.n, E.n, S.n, R.n) are what a spec change should cite. The recommendations at the end are the synthesis, not the evidence. -->

# Depth and strategy for a two-verb beat 'em up — research notes for Streets of Barrie

Researched 2026-10-02. Scope: what gives beat 'em ups depth and strategy, how enemy design makes
mashing lose without adding player verbs, how scoring and run structure add decisions to a
simple-input action game, and how party and co-op games give the room a job. Primary sources:
designers' own talks, interviews and devlogs, press releases, store pages, GDC abstracts, and
well-argued design essays (marked as such). Touch controls were researched separately
([tablet-brawler-controls.md](tablet-brawler-controls.md)) and are out of scope here.

## The question

Streets of Barrie ships with two verbs (walk, peck), one line of movement, four goon kinds, a fixed
seeded course, three hearts a block and a score that is worth down over worth on the street. It is
fun for about one block. Brad wants it to be fun for the whole turn, with **depth** (more than one
good way to play a wave) and **strategy** (decisions whose consequences outlast the peck) — without
breaking the five-second rule or the sauce rule (principles §5, §10).

## How to read this

- Findings are numbered by topic: **M** mechanics, **E** enemy design, **S** scoring and run
  structure, **R** the room. Each is a one-line claim in bold, then the evidence with verbatim
  quotes, then the source and URL. Every URL was fetched by the agent that cites it.
- **(synthesis)** marks an inference, not something a source says.
- Where an agent could not reach a primary source for a mechanic the designer wanted evidence on,
  the finding says so and carries no quote. Do not cite those as precedent.
- Wing Night specifics assumed throughout: 3–5 teams, one team plays while the rest watch the TV,
  an Android tablet (1280×800) passed between teammates, drunk players with sauce on their
  fingers, a human host who ends the turn, and a TV that is the speaker.

---

## M. Mechanics that give beat 'em ups depth, and which survive with two verbs

### M.1 Streets of Rage 4 (Guard Crush / Dotemu / Lizardcube)

**M.1.1 The special spends health that is refunded by continuing the combo; a hit forfeits it, and
the designer calls it a gamble.** Jordi Asensio (lead game designer): "In SoR4, you lose a small
amount of health that you can regain by hitting enemies – but if you are hit in the meantime, this
small amount of health is gone for good. This opens the door for some aggressive play styles,
gambling a lot of life in order to do huge combos."
PlayStation Blog, "Streets of Rage 4: How three studios revived the legendary beat 'em up series" (2020): https://blog.playstation.com/archive/2020/04/30/streets-of-rage-4-how-three-studios-revived-the-legendary-beat-em-up-series

**M.1.2 The refund exists because the SoR2 version (a pure health cost) felt bad.** Cyrille Imbert
(Dotemu): "In Streets of Rage 2 when you use your super it burns up some of your life, whereas now
it still burns your life but you can regain it if you do a perfect combo." A translated Guard Crush
interview: "In Streets of Rage 2, using your special move uses some HP, which leaves the player
frustrated...Guard Crush improved this system by making the HP loss temporary, and getting it back
if you manage to net a combo."
TheSixthAxis (2018): https://www.thesixthaxis.com/2018/09/24/interview-why-streets-of-rage-4-needs-to-perfectly-balance-old-and-new/ ; DualShockers, translated Guard Crush interview (2020): https://www.dualshockers.com/streets-of-rage-4-guard-crush-interview-translated/

**M.1.3 Star moves are a scarce pickup whose second job is combo insurance.** Asensio: "it can also
extend the length of a combo. This helps you recover some invested health from special moves and
focus your damage on a boss, for instance." Cyrille Lagarigue (Guard Crush): they "dropped and
replaced" the old star moves "so that you have to pickup star power ups to be able to perform
them." *(synthesis: one resource, spent either for burst or as insurance; the choice is the
decision.)*
PlayStation Blog (2020), link in M.1.1 ; GamingBolt, "Streets of Rage 4 Interview": https://gamingbolt.com/streets-of-rage-4-interview-blast-from-the-past

**M.1.4 The back attack and the charged strike were kept as core verbs.** Lagarigue: "We tried to
keep all the character moves that did not break the gameplay we were trying to achieve, so the back
attack and the charged strike are still there for example." *(synthesis: both are facing- or
hold-driven, not extra buttons.)*
GamingBolt, link in M.1.3

**M.1.5 Assists cost score, so everyone finishes but is tempted upward; spawn placement and AI were
the levers for "strategic but snappy".** Lagarigue: "If you are stuck you can choose to get gameplay
assists (more lives, Star moves…) in exchange for a reduced score... everyone can finish the
campaign, but you are still tempted to choose a higher difficulty level." And: "I think we achieved
it by iterating a lot on the level design, on how and when the enemies appear in the levels. And
also by polishing the enemies' AI, especially for the bosses."
PlayStation Blog (2020), link in M.1.1

**M.1.6 Not evidenced:** the combo counter dropping on hit, wall bounces, weapon throws and food. No
designer statement was reached; the Steam page only says "Classic gameplay enhanced with brand-new
mechanics." Treat these as community knowledge, not cited precedent.
Steam: https://store.steampowered.com/app/985890/Streets_of_Rage_4/

### M.2 TMNT: Shredder's Revenge (Tribute Games)

**M.2.1 The super meter fills by landing hits, is wiped if you are hit while filling, and is safe
once full.** Frédéric Gémus (designer): "Back in the day, you would trade off your health points for
a special attack...We decided to go with a meter that builds up the more enemies you attack
successfully." And: "If you are attacked while building the special meter it gets depleted, but
once it's maxed out you have it until you use it by doing a special attack." *(synthesis: a meter
that only punishes being hit while partial creates a "protect the streak" tension with no new
input.)*
Noisy Pixel, "TMNT: Shredder's Revenge Interview – Frédéric Gémus" (2022): https://noisypixel.net/tmnt-shredders-revenge-interview-frederic-gemus/

**M.2.2 One attack button carries two verbs by hold time; grabs are stick-toward plus the same
button.** Gémus: "There's a basic attack button you can press and hold to charge and do a more
powerful attack." And: "you can grapple by holding your directional stick toward an enemy then
pressing the basic attack button."
Noisy Pixel (2022), link in M.2.1

**M.2.3 Enemy types force a specific answer: blockers demand the charged hit or grab, leapers the
dodge.** Gémus on katana Foot Soldiers: "they can block attacks, so it forces players to either use
charged attacks to break their blocking stance or use grabs." Another foe's leaping attack "forces
you to use a dodge or rising kick."
CBR, "TMNT: Shredder's Revenge Designer Reveals a Love Letter to the Classic Games" (2022): https://www.cbr.com/tmnt-shredders-revenge-fred-gemus-interview/

**M.2.4 Juggling came from a bounds rule, not a juggle feature.** Gémus: "if you throw an enemy,
they won't go off-screen but bounce back, and that enables you to juggle."
CBR (2022), link in M.2.3

**M.2.5 The stated target: mash-friendly on the surface, finesse underneath.** Gémus: "any younger
player can be able to pick up a controller and have fun with the game just mashing random buttons,
but a more skilled player will understand the finesse."
CBR (2022), link in M.2.3

**M.2.6 Not evidenced:** the taunt that charges the super. Neither interview nor the Steam page
mentions it.

### M.3 The classics: Streets of Rage 2, Final Fight, Double Dragon

**M.3.1 SoR2's designer wanted the special to be a decision, not a screen-clear.** Ayano Koshiro
(Ancient): "Being able to strategize and decide how to use your special is more fun...I like having
some special attack that requires thought, instead of just having a bomb that destroys everything."
shmuplations, Streets of Rage 2 developer interview: https://shmuplations.com/streetsofrage2/

**M.3.2 SoR2's enemies were designed movement-first, then differentiated by trickiness and extra
life.** Koshiro: "Our ideas for enemies started with how they would move. Then we would add in
different characters—tricky ones, ones with extra life." On feel: "I was actually more happy when
the sound fx for the hits got added. All of a sudden everything had a weight behind it."
shmuplations, link in M.3.1

**M.3.3 Final Fight's designers credit big sprites and "unexpected" behaviours over many
patterns.** Akira Nishitani: "Thinking about it now, there weren't a whole lot of patterns in Final
Fight. But since the characters were big it lead to a strong impact." On Molotovs: "We wanted
something unexpected, so we added [Molotov cocktails] in." (No quotes on grabs, throws or barrel
food exist in this interview.)
Capcom (Shadaloo C.R.I.), "Final Fight Developer's Interview": https://game.capcom.com/cfn/sfv/column/132673

**M.3.4 Double Dragon: the facing-based back elbow dominated, hunched enemies became throw targets,
pits killed, props were weapons. (Reference source, not developer.)** Hardcore Gaming 101: "The
backward attacks are shockingly overpowered – if you turn your back at them, most enemies blindly
run into elbow blow range." Hazards: "bottomless pits that spell instant death". Props: "oil drums,
crates, and rocks, which stand ready for the taking." The author's verdict is that this made the
game "methodical and controllable" rather than "chaotic".
Hardcore Gaming 101, "Double Dragon": https://www.hardcoregaming101.net/double-dragon/

### M.4 Modern brawlers: one extra verb buying depth

**M.4.1 Double Dragon Gaiden's tag is pitched as the depth mechanic and the answer to crowd
management.** Raymond Teo (Secret Base): "The main feature that sets our game apart would be the
Tag Team mechanic, which adds more depth and strategy to the combat." And: "it should be about
fighting lots of enemies and having the ability to manage the crowd."
Siliconera, "Interview: What Went into Designing Double Dragon Gaiden" (2023): https://www.siliconera.com/interview-what-went-into-designing-double-dragon-gaiden-new-game/

**M.4.2 Fight'N Rage's designer frames the whole game as constant risk/reward evaluation, an
attention economy, and environment changes that break routines.** Sebastián García: the player "has
to constantly evaluate what is the best decision to take… while considering risks and rewards based
on his own skills." Players should be "economizing attention resources, rest a little bit making
safe decisions, and save energy for the moments when they have to be at the highest level." He
deliberately "create[s] changes in the environment" to force players to "modify" routines,
"challenging their evaluation and forcing them to mix the physical part (which follows routines)
with the rational part that uses strategy." Every move should have "a unique and irreplaceable
utility". He names his sources: "I also took some cues from Streets of Rage 2, especially for enemy
behavior. I think SoR2 is one of the best games ever made in that regard."
Game Developer, "A Fight'N Rage post-mortem": https://www.gamedeveloper.com/audio/a-fight-n-rage-post-mortem-the-story-behind-the-first-uruguayan-game-to-be-published-on-a-home-console ; The Outerhaven (2017): https://www.theouterhaven.net/2017/10/interview-developer-behind-indie-hit-fightn-rage/

**M.4.3 River City Girls: every move reachable by anyone; depth from chaining; enemy depth from each
enemy's distinct spatial "shape".** WayForward: "Players should always be able to pull off any move
they decide to. I didn't want complicated button inputs that would be a gate to players." On
enemies: "It comes down to giving each enemy a unique, spatial form of attacking that complements
all other enemies." "So long as the 'shape' of how each enemy moves and attacks looks different than
the others, they'll combine in interesting ways that keep gameplay feeling fresh." On fairness:
"very low-loss Game Over penalties".
Game Developer, "'BARF!': Designing River City Girls' approachable, challenging brawling" (2019): https://www.gamedeveloper.com/design/-barf-designing-i-river-city-girls-i-approachable-challenging-brawling

**M.4.4 Mother Russia Bleeds makes one resource serve heal and berserk, refilled only by harvesting
the dying.** Le Cartel: "You have a synringe with 3 slots. You can choose between two actions: Heal
or get into berserk." "Some of dying ennemies can be sampled: You have to stick the syringe in them,
and wait while your syringe is refilled." *(synthesis: the refill forces you to stand still next to
a downed foe mid-fight, a positional risk bought with no extra combat verb.)*
Gaming Nexus, "Mother Russia Bleeds Interview" (2016): https://www.gamingnexus.com/Article/4887/Mother-Russia-Bleeds-Interview

**M.4.5 Not evidenced:** Castle Crashers juggling (The Behemoth interviews cover scope and
networking, not combat); Fight'N Rage's parry rules; a Game Maker's Toolkit beat 'em up episode
(none found).

### M.5 Theory

**M.5.1 Meier's "interesting decisions": tradeoffs that are situational, personal and persistent.
(Paraphrase; the GDC 2012 video was not fetched.)** Filament Games' summary: "Meier outlines four
core qualities of interesting choices: tradeoffs, situational, personal and persistent." Treat as a
reliable paraphrase, not a quote.
Game Developer (2012): https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay ; Filament Games: https://www.filamentgames.com/blog/sid-meiers-narrative-design-part-one

**M.5.2 Terrell: complexity is the amount of stuff; depth is complexity organised by interplay.**
Richard Terrell defines complexity as "the amount of 'stuff' in a work" and depth as "a balance of
complexity and interplay (with more weight on interplay)". *(synthesis: this is the theoretical
backing for M.2.4's bounce-rule juggling and M.4.3's enemy shapes: depth from how few elements
interact, not from more elements.)*
Game Developer, Richard Terrell, "Depth from Complexity pt 1": https://www.gamedeveloper.com/design/depth-from-complexity-pt-1

### M.6 Which mechanics survive with only walk + hit

Each item names the shipped precedent and whether its input is already hold/tap, position or
facing. The mapping to a two-verb game is *(synthesis)* unless a quote says otherwise.

**M.6.1 Hold-to-charge heavy hit: shipped on one button (M.2.2), given a job by blockers (M.2.3),
kept in SoR4 as "the charged strike" (M.1.4).** *(synthesis: a goon only a held peck can crack turns
tap-vs-hold into a read, with no new control.)*

**M.6.2 Facing as an input: Double Dragon's back elbow (M.3.4), SoR4's back attack (M.1.4).**
*(synthesis: in a 1-D game, which way the hen faces when goons close from both edges is already a
decision; a facing-dependent rule makes it a mechanic.)*

**M.6.3 Knocking goons into goons and screen-edge bounce: depth from a bounds rule (M.2.4), and
Double Dragon's throws into companions (M.3.4).** *(synthesis: in a locked-camera wave, a
knocked-back goon that collides with the one queued behind it, or rebounds off the window's edge, is
the same idea expressed with knockback the sim already has.)*

**M.6.4 Environmental hazards: pits that kill and props that become weapons (M.3.4); environment
changes that break routine (M.4.2).** *(synthesis: a hazard is position-only depth; walking a goon
toward it before the peck is a choice made with the existing walk verb.)*

**M.6.5 Resource gambles attach to existing verbs: SoR4's refundable health (M.1.1), TMNT's meter
wiped on hit (M.2.1), MRB's harvest-from-the-dying (M.4.4).** *(synthesis: none adds a combat input;
each adds a rule about what being hit costs or what standing still earns. They are the cheapest
depth in the genre for a two-verb game.)*

**M.6.6 Enemy "shapes" and forced answers are the depth source designers cite most, and need no
player verbs (M.4.3, M.3.2, M.2.3).** *(synthesis: with two verbs the available answers are peck
now, peck held, step back, turn around; each goon kind should map to exactly one of those, and
mixing kinds in a wave produces the interplay Terrell calls depth.)*

**M.6.7 Not evidenced:** counter-during-telegraph, double-tap dash, stomp-on-downed. No shipped-game
designer quote was found. Treat as untested hypotheses, not precedent.

---

## E. Enemy design that makes mashing lose, without adding player verbs

### E.1 One Finger Death Punch (Silver Dollar Games)

**E.1.1 The core rule: a press with no valid target is a miss, and a miss gets you hit.** The store
page's own heading is "Every Press Matters! DO NOT BUTTON MASH!": "When our friends play tested our
game they'd instinctively button mash, they couldn't help themselves… The game's designed in such a
way that if you button mash, you die. Every press matters. Although playing the game should still be
simple, you see a bad guy in front of you, you attack him, he dies. If you punch even once when
there's no enemy in front of you, you're going to miss. If you miss, chances are you're going to get
hit. It's a simple system but it's ruthless to button mashers." *(synthesis: the anti-mash lever is
not a new verb; it is a cost attached to the existing verb at the wrong moment.)*
Steam, One Finger Death Punch (2014): https://store.steampowered.com/app/264200/One_Finger_Death_Punch/

**E.1.2 They then spent effort on cues to retrain the habit, and sell the payoff as ownership.** "We
spent much time setting up visual and audio queues as well as many warnings trying to steer players
away from their natural button mashing tendencies." "When you string together a long, complex string
of kills, it feels like something 'you' did rather than something the game let you do."
Steam (2014), link in E.1.1

**E.1.3 The sequel kept the rule and added depth through enemy variety, not inputs.** Jon Flook:
"if you button mash in OFDP2 you will lose. In my opinion, it's that very mechanic that makes OFDP
unique". New: "There are new boss type enemies. There are several different struggle moments that
occur during combat. New dual color enemy types will be in the later levels." *(synthesis: a
dual-colour enemy is a roster change whose required input is read off its body; the verb count did
not grow.)*
GamingBolt, "One Finger Death Punch 2 Interview" (2019): https://gamingbolt.com/one-finger-death-punch-2-interview-not-messing-with-a-winning-formula-the-challenges-of-development-and-more

**E.1.4 The design thesis, in the store's words:** "We want to show that a fighting game can be
complex without cumbersome button combinations"; "ATTACK LEFT or ATTACK RIGHT".
Steam, One Finger Death Punch 2 (2019): https://store.steampowered.com/app/980300/One_Finger_Death_Punch_2/

**E.1.5 Not evidenced:** the colour-to-hit-count mapping (grey = multi-hit). The two interviews
that discuss it returned 403 / truncated.

### E.2 Other few-input brawlers

**E.2.1 Punch Quest was built to be playable as a masher AND as a master.** Kepa Auwae (Rocketcat):
"when I grew up playing Street Fighter I just jumped around and mashed buttons and I wanted to make
a game that could be played both ways." On the loop: "The point of the game is that stuff keeps
getting in your way, and you keep punching it." *(synthesis: the opposite philosophy to OFDP, and
the right one for a drunk room: mashing survives, but the ceiling above it is where the score is.)*
Kill Screen, "Chatting with Kepa Auwae, the man behind Punch Quest" (2012): https://www.killscreen.com/chatting-kepa-auwae-man-behind-punch-quest/

**E.2.2 Ra Ra Boom added lanes to make enemy targeting legible in a crowd.** Shacknews: "a lane
system to help with enemy targeting." Chris Bergman (Gylee): "We found fun in adding shoot em up
elements and lane-based combat."
Shacknews (2023): https://www.shacknews.com/article/135110/ra-ra-boom-interview

**E.2.3 Not evidenced:** Beat Street (Lucky Kat) and Dan the Man (Halfbrick) enemy design.

### E.3 Classic archetypes: roles, not stats

**E.3.1 SoR2's roster is three roles that punish three habits, and SoR4 was built on that
triangle.** Asensio: "I love how it was designed around three core enemies: Galsia, Signal, and
Donovan. Galsia will come at you and keep you busy, Signal will attack when you face away from him,
and Donovan will prevent you from jumping on him. So we built enemies and levels around this idea of
synergy between baddies." *(synthesis: each role is defined by the player behaviour it answers, not
by HP.)*
PlayStation Blog (2020): https://blog.playstation.com/2020/04/30/streets-of-rage-4-how-three-studios-revived-a-legendary-series/

**E.3.2 An enemy that is annoying without being answerable was cut.** Asensio: "we decided not to
bring Jet back, because he's so annoying — flying all over the place and not vulnerable to combos…"
*(synthesis: the test is whether the player's existing tools can resolve the enemy; one that evades
the verb set is pressure without a decision.)*
PlayStation Blog (2020), link in E.3.1

**E.3.3 Final Fight made losing to an enemy interesting.** Nishitani: "Even though it's essentially
'losing to the enemy,' getting hit by Andore's pile-driver is more interesting, isn't it?" Akiman on
process: "The attack patterns had more or less been decided upon, so basically, we could think
about how they'd react to getting hit by the player's attacks." *(synthesis: the hit the player
takes should itself be a spectacle; patterns first, hit reactions after.)*
Capcom, Final Fight 30th-anniversary interview (2019): https://game.capcom.com/cfn/sfv/column/132673?lang=en

**E.3.4 Turn-taking and loitering are deliberate crowd control (design essay, not developer).**
Trevor (Tilting at Pixels): "it wouldn't be good game design to have every enemy on the screen punch
the player at once...they'll end up in an impossible situation." Hence enemies "shuffle back and
forth a few times before attacking, or stand around behind your back without doing anything,
contemplating existence between punches." Players are "tested on their ability to manage a crowd of
threats". *(synthesis: the rear-standing enemy is not filler; with SoR2's Signal role it is the
mechanism that makes facing a decision.)*
Tilting at Pixels, "Death and Rebirth of the Beat 'Em Up Genre" (2017): https://tiltingatpixels.com/post/Beat-em-up-Part-2/

### E.4 Pacing by spawn timing

**E.4.1 SoR4's hardest problem was when and how enemies appear.** Lagarigue: "I think the biggest
challenge was to nail down the game's level design and rhythm...by iterating a lot on the level
design, on how and when the enemies appear in the levels."
PlayStation Blog (2020), link in E.3.1

**E.4.2 Guard Crush wanted players to think ahead, kept stages short with few waves so score
matters, and say position and learned spawns are the strategy. (Site paraphrases of a French
interview.)** DualShockers: "they wanted the game to focus on scoring, that's why the stages are
short, and there are few waves of enemies." "Where you choose to position yourself, where you decide
to gather the enemies, learning where the enemies will spawn, is important. All of this was thought
up with scoring in mind." "The developers wish for Streets of Rage 4 players to think ahead, not to
react by reflex." *(synthesis: a fixed, seeded course where spawns can be learned is the
precondition the devs name for scoring to feel like strategy rather than luck.)*
DualShockers (2020), link in M.1.2 ; GoNintendo (2020): https://gonintendo.com/stories/360994-streets-of-rage-4-devs-talk-development-considering-dlc-say-seg

### E.5 Telegraphing and readability from across a room

**E.5.1 A telegraph is a deliberate delay whose job is to say "here I come", through several channels
at once.** Mike Stout: "Before the attack, we need a small delay. The purpose of this delay is to
tell the player 'Okay, here I come.'" "The telegraph is delivered to the player via a combination of
animation, sound effects, voice-over, visual effects, and sometimes even force-feedback." Fairness
test: "if the sword comes down and the player takes damage, it's not because they didn't know what
they were being asked to do."
Game Developer, "Enemy Attacks and Telegraphing" (Mike Stout, 2015): https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing

**E.5.2 Modern descendants make enemies enter frame and vocalise before acting.** Trevor: enemies
"make an effort to walk into camera view before taking any actions, even if the attack is a long
distance lunge. Many yell or reel back before the attack too."
Tilting at Pixels (2017), link in E.3.4

**E.5.3 Sakurai on hitstop: both parties freeze, longer for heavier hits, with a cap.** "When you
strike the opponent, both parties momentarily freeze, emphasizing the power of impact." "In general,
the more damage an attack inflicts, the longer the hitstop period." "I've implemented a cap on the
maximum amount of time characters can be in freeze frames." And for crowds: "When you and the
opponent are frozen in hitstop, that creates a chance for a third player to move in and strike."
Source Gaming, Sakurai's Famitsu column vol. 490 (translation, 2015): https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/ ; Nintendo Wire on the "Eight Hit Stop Techniques" episode (2022): https://nintendowire.com/news/2022/12/12/this-week-in-sakurai-12-5-12-11-fine-tuning-hit-stop-and-cheating-the-system/

**E.5.4 Rocksteady tuned colour and architecture so the player can read the fight space.** "Elements
such as architecture and color palette were refined so they aided the player's ability to study
battlegrounds and see how much space they had to work with, where gun boxes were located, and what
debris enemies might throw."
Episodic Content, "Welcome to the Madhouse… Chapter 3" (2016): https://episodiccontentmag.com/2016/03/11/batmanaa_chapter3/

### E.6 Formations and attack permission

**E.6.1 Arkham's roster is a set of locks for a fixed key set: each type invalidates the default
answer.** "Freeflow combat consists of strikes, cape whips, and counters. Every action is mapped to
a specific button." Knife-wielders need the cape, Taser thugs cannot be hit from the front, Titans
must be stunned first (article paraphrase). Sefton Hill: "If it's something that's simple for Batman
to do in his world, then it should be easy for the player to execute as well." *(synthesis: the
verbs stay at three; depth comes from enemies that each make one of the three wrong.)*
Episodic Content (2016), link in E.5.4

**E.6.2 Not evidenced:** attack-token / aggro-permission systems (Doom 2016, God of War, AC
Valhalla). Talks exist on GDC Vault but were not fetched.

### E.7 Rewards inside the fight

**E.7.1 Not evidenced:** health pickups from scenery, enemy drops, kill-style bonuses. No arcade
manual or developer statement was fetched; fan-wiki point tables are not relied on. The only
primary on in-fight feedback is E.3.3 (the hit you take is a show).

---

## S. Scoring and run structure

### S.1 Score attack in beat 'em ups

**S.1.1 SoR4 scores per stage with a letter rank up to S, and pays bonus for difficulty and
variety.** Lagarigue: "you get bonus points when you play at higher difficulty levels or when you
try different characters." Asensio: "There are leaderboards for every stage and character, so once
you're done obtaining the S rank (the highest rank) for all stages, you can go for some serious
score attacks." *(synthesis: a rank anyone can read from the couch, and a number for the people who
care about the number; the stage is the unit of comparison.)*
PlayStation Blog (2020), link in E.3.1

**S.1.2 Not evidenced:** SoR4's combo pot lost on hit (wiki 402); Fight'N Rage's 100/10 medal rule
(community guide, 403); SoR2 / Final Fight end-of-level bonus tables (403); Shredder's Revenge
arcade scoring. Treat the pot-loss rule as community knowledge.

### S.2 Style and rank

**S.2.1 Kamiya's goal for DMC's STYLISH rank was player-authored expression.** "I want users to
create their own 'STYLISH' attack, not follow the attacking ideas from guide book or somebody
else." (The gauge's rules are not in the fetched text.) *(synthesis: the rank exists to make players
want to vary what they do.)*
devilmaycry.org repost, "Director Hideki Kamiya Interview: STYLISH Desires" (2001): https://devilmaycry.org/threads/director-hideki-kamiya-interview-stylish-desires.20579/

**S.2.2 Not evidenced:** Bayonetta medals, Tony Hawk, Hotline Miami.

### S.3 Resource-at-risk with simple inputs

**S.3.1 Crypt of the NecroDancer: one chain multiplier that grows per kill, breaks on a hit or a
missed beat, and only scales future drops; safe play is viable but poor by design.** Ryan Clark:
"When you kill an enemy you begin a 'groove chain'. If you keep moving on the beat (without missing
a beat or getting hit) you will continue the chain." "As you kill more and more enemies while
staying 'in the groove' your coin multiplier grows." "The game is quite easy to play if you sit and
wait for enemies to come at you, but if you want to gather enough coins to buy the more powerful
items in the shop, you'll need to master the art of fighting while staying in the groove."
*(synthesis: the multiplier never takes what is already banked; a hit is never theft, yet every hit
is expensive, and the chain number is a one-glance readout.)*
Eight and a Half Bit, "Interview: Crypt of the NecroDancer" (2013): https://eightandahalfbit.com/2013/06/08/interview-crypt-of-the-necrodancer/

**S.3.2 Downwell was built around one "gimmick"; the gem-high rule itself was not reached.** GDC
Vault abstract: "the way Ojiro discovered a fun 'gimmick', and designed the entire game around it
trying to maximize its use in gameplay."
GDC Vault, "Polishing the Boots: Designing 'Downwell' Around One Key Mechanic" (2016): https://gdcvault.com/play/1023533/Polishing-the-Boots-Designing-Downwell

**S.3.3 Not evidenced:** Spelunky's ghost (critic's analysis only, no Yu quote), Super Crate Box,
Luftrausers, Nuclear Throne, Devil Daggers, Pac-Man CE.

### S.4 Relay, tag, handoff and between-stage picks

**S.4.1 Double Dragon Gaiden's cash is score, revive fund and upgrade budget at once, modelled on
arcade quarters.** Raymond Teo: "In our game, you have this thing where you earn cash. If you do
well, you can earn more cash, and you can spend some of that cash to revive if you have to." "It's
also the idea of how much money you bring to the arcade when you play games. If today, I brought
five bucks and that gave me like five chances to play the game, it's game over when you spend them
all." *(synthesis: every revive visibly spends the thing you were trying to maximise.)*
Game Rant, "Double Dragon Gaiden Interview" (2023): https://gamerant.com/double-dragon-gaiden-interview/

**S.4.2 The between-mission choice is spend-or-save, and mission order changes the course.** Steam:
"Choose where you improve with randomized purchasable upgrades for your characters at the end of
each mission, or save your cash to revive your players in-mission." "the order in which you choose
your mission will affect mission length, number of enemies, and overall difficulty." *(synthesis: the
upgrade pick is only interesting because it competes with the revive fund; a free perk is a
no-decision. The end-of-mission timing puts the choice at a natural breather.)*
Steam, Double Dragon Gaiden (2023): https://store.steampowered.com/app/1967260/

**S.4.3 SoR4 Survival's between-wave choice is exactly "pick one of two", randomized, stackable, with
a static weekly gauntlet for comparable scores.** Dotemu's press release: "Each completed level
offers two randomized perks to choose from, granting stackable bonuses to power up combatants in
unique and devastating ways until they're defeated." Formats: "Random, which keeps each fight
unpredictable through generated runs; and Weekly, a series of static gauntlets generated each
week." *(synthesis: two options is the smallest menu that is still a choice; the Weekly gauntlet is
a seeded course shared by all competitors, which is what makes scores comparable.)*
Gematsu, "Streets of Rage 4 DLC 'Mr. X Nightmare' launches July 15" (2021): https://gematsu.com/2021/07/streets-of-rage-4-dlc-mr-x-nightmare-launches-july-15

**S.4.4 Not evidenced:** Hades boons / Risk of Rain pick legibility.

### S.5 Shared team stakes

**S.5.1 Not evidenced.** No primary statement on pooled health, lives or score, or on shared failure,
was reached (Overcooked and Spaceteam pages failed; Castle Crashers, SoR4 friendly fire and DD Gaiden
co-op lives not fetched). The nearest fetched evidence is S.4.1's single pot that is score, upgrade
budget and revive fund at once. Treat "shared stakes make spectators care" as a working assumption,
not a cited fact.

### S.6 Comeback rules and the number to beat

**S.6.1 Mario Kart's items are tuned per race position so a weaker player can win when lucky, and the
rule is keyed to a state the room can see.** Hideki Konno: "We don't want to create a game in which
more experienced players will always win; we want to create a game in which when less experienced
players are lucky, they can win too sometimes." "When we create a new item, we do our best to imagine
in detail what kind of effect that item will have on players at different positions in the race."
And the valve: "We have added the ability to limit the items that are available in local and online
multiplayer games so that players can also enjoy races that are less influenced by luck." *(synthesis:
legibility of the catch-up rule is part of the rule.)*
Nintendo Life, "Hideki Konno Discusses Mario Kart 7 and its Development" (2012): https://www.nintendolife.com/news/2012/03/hideki_konno_discusses_mario_kart_7_and_its_development

**S.6.2 Super Meat Boy's all-deaths replay turns failure into a reward shown at the moment of
success.** Edmund McMillen: "even death became something to enjoy when you knew that upon completing
the level you would be rewarded with an epic showing of all your past deaths." "The replay feature
was a way to remind the player that they were getting better through their own actions". Rules:
"Remove lives, reduce respawn time, keep the levels short and keep the goal always in sight."
Game Developer, "Postmortem: Team Meat's Super Meat Boy" (2011): https://www.gamedeveloper.com/audio/postmortem-team-meat-s-i-super-meat-boy-i-

**S.6.3 Not evidenced:** Jackbox's late-round point escalation, Mario Party bonus stars, Trackmania
medals and ghosts.

---

## R. Giving the room a job

### R.1 Spectator agency (Jackbox)

**R.1.1 Jackbox's Audience is an "enhanced spectator" whose vote is the same lever as the players',
pooled with it.** Steve Heinrich (Jackbox): "It's kind of an 'enhanced spectator' role, if you will
– you actually affect the outcome of the game." "The Quiplash Audience actually affects the outcome
of the game by voting, kind of like on a reality competition show on TV." "the other players AND
THE AUDIENCE (if there is one) vote for their favorite answer." *(synthesis: one lever, identical to
the players' own, so spectators never learn a second ruleset.)*
PlayStation Blog, "Quiplash: New Party Game Expands 'Audience' Participation to 10,000" (2015): https://blog.playstation.com/2015/06/30/quiplash-new-party-game-expands-audience-participation-to-10000/

**R.1.2 Jackbox dials audience influence per game, from flavour to "picking the winner".** Jackbox's
own site: in voting games "the audience can be VERY influential — like, picking the winner-type
influential".
Jackbox Games, "Best Jackbox Games for Large Groups": https://www.jackboxgames.com/best-jackbox-games-for-large-groups/

**R.1.3 Jackbox's principles: "my aunt" difficulty, one simple action at a time, pacing that pulls
the group along.** Allard Laban: "If I find it difficult, then, you know, my aunt's going to find it
very difficult". "The games are kind of constructed in a way where we pull you along". *(synthesis:
the host voice holds the spectator's attention between inputs; the job is held by pacing, not extra
mechanics.)*
Built In Chicago, "These Design Principles Made Jackbox a Party Game Phenomenon": https://www.builtinchicago.org/articles/jackbox-games-design-party-pack

### R.2 Viewer interference as a lever

**R.2.1 Crowd Control gives viewers both helpful and hostile levers, and throttles overuse by
price.** Twitch: "viewers can literally help (or hinder!) the game by dropping in a range of in-game
items", e.g. "viewers can gift armor, a heart, or Blue Potion refill to assist Link". "Items which
carry a stronger effect on the game require more Coins, which effectively limits over usage".
*(synthesis: the anti-griefing design is scarcity of a currency, not a cooldown; a LAN room's
equivalent is a scarce per-team token.)*
Twitch Blog, "The Evolution of Speedrunning: Crowd Control" (2019): https://blog.twitch.tv/en/2019/02/15/the-evolution-of-speedrunning-crowd-control-caf6e259e848/

**R.2.2 Choice Chamber refuses to call the chat "helpers" and relishes the villain role.** Michael
Molinari (Studio Bean): "They're not called 'helpers' on purpose." "I just smile like a villain
whenever something goes really wrong for someone." *(synthesis: the crowd is an ambivalent force the
runner must survive, which gives spectators a stake in the suffering as well as the success.)*
Austin Chronicle, "Anatomy of a Choice Chamber Twitch stream" (2015): https://www.austinchronicle.com/screens/choice-chamber-11764706/

### R.3 Asymmetric information: the others hold what the player needs

**R.3.1 Keep Talking's puzzles are tuned for "tension, mistakes, hilarity".** Ben Kane (Steel Crate)
GDC abstract: the game is about "communication between players", with puzzles refined to "keep
players talking in ways that encourage tension, mistakes, hilarity, and occasionally even
camaraderie". *(synthesis: the non-player role is load-bearing because information is withheld
from the controls and placed in everyone else's hands.)*
GDC Vault, "Designing Asymmetric Gameplay For 'Keep Talking and Nobody Explodes'" (2016): https://gdcvault.com/play/1023113/contactUs

**R.3.2 Spaceteam's shouting emerged from an instruction on someone else's screen, and an
all-screens event makes the whole table act at once.** Henry Smith: "instructions on one person's
screen, and someone else was following it". "I wanted to bring this chaos into it where everything
is going crazy. I wanted part of that to be fighting with the interface itself". The "_ASTEROID!
(everybody shake)_" message "arbitrarily appears on every screen". *(synthesis: a broadcast moment
where every participant does one identical thing is the simplest way to give a whole room a job for
two seconds.)*
Episodic Content, "Everybody Shake! The Making of Spaceteam – Chapter 2" (2016): https://episodiccontentmag.com/2016/01/29/everybodyshake2/

**R.3.3 Overcooked: every player equally responsible, so nobody can carry the group.** Phil Duncan:
"With Overcooked all players are equally responsible for the success of the team". They designed
levels "backwards: consider what experience we wanted to give the player and then shape the level to
try and give them that."
Game Developer, "Road to the IGF: Ghost Town Games' Overcooked" (2017): https://gamedeveloper.com/design/road-to-the-igf-ghost-town-games-i-overcooked-i-

### R.4 A second player who assists without playing the same role

**R.4.1 Miyamoto built Galaxy's second-player pointer so the helper can say "This right here!", and
calls it "a very strong sense of participation".** "You can point out all sorts of things and tell
them things like 'This! This right here!'" "I think we were able to have the second player play the
game with a very strong sense of participation."
Nintendo, "Iwata Asks: Super Mario Galaxy, Volume 4" (2007): https://www.nintendo.com/en-gb/Iwata-Asks-Super-Mario-Galaxy/Volume-4-Shigeru-Miyamoto/1-The-Old-Issue-of-Two-Player-Play/1-The-Old-Issue-of-Two-Player-Play-220647.html

**R.4.2 The assist role was made by removing abilities from the solo player.** Miyamoto: "The
single-player mode had become very complicated, so we removed some of its features and moved them to
the two-player mode." *(synthesis: the helper's lever is valuable because the primary player cannot
do it; an assist that duplicates the runner's powers has no reason to exist.)*
Nintendo (2007), link in R.4.1

**R.4.3 New Super Mario Bros. U's fifth player was conceived as "one more person touching the
GamePad to place blocks".** Masataka Takemoto: "We talked about having four players, with one more
person touching the Wii U GamePad to place blocks." (The "No Buddy Play" chapter with the
help/hinder detail was not reachable.)
Nintendo, "Iwata Asks: New Super Mario Bros. U, 1." (2012): https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-New-Super-Mario-Bros-U/New-Super-Mario-Bros-U/1-What-Should-Be-New-/1-What-Should-Be-New--686442.html

**R.4.4 Ultimate Chicken Horse judges a placeable piece by whether it stays interesting when
everyone places one.** Clever Endeavour on the one-way gate: "a block that could be used to force
players to keep going down a certain path once they chose to enter it"; a lock-and-key version was
rejected as not fitting "fast-paced action". *(synthesis: a placeable hazard is a good room lever
when it changes routing for everyone, not when it needs a second rule to read.)*
Clever Endeavour Games, "Behind the scenes: The one-way gate" (2020): https://www.cleverendeavourgames.com/blog/2020/10/2/behind-the-scenes-the-one-way-gate

### R.5 Interference and catch-up (Mario Kart)

**R.5.1 Lightning was built as the deliberate "sudden upset", and balance was the bulk of the
work.** Konno: "We wanted an item with the potential for a sudden upset." "The amount of gameplay we
put in for making adjustments was incredible for that time." (The position-tuning quotes are S.6.1.)
Nintendo, "Nintendo Classic Mini: SNES developer interview – Volume 4: Super Mario Kart" (2017): https://www.nintendo.com/en-gb/News/2017/October/Nintendo-Classic-Mini-SNES-developer-interview-Volume-4-Super-Mario-Kart-1286739.html

### R.6 Callout mechanics

**R.6.1 Not evidenced.** No primary on callout-rewarding games (Hidden in Plain Sight, Spyfall,
PlayLink, Wii Party) was reached. Treat as unresearched, not empty.

### R.7 Pass-the-controller comedy (WarioWare)

**R.7.1 Smooth Moves was designed with the watchers as a second audience from the outset.** Yoshio
Sakamoto: "we were picturing the game being played with people watching a lot of the time." "we also
felt the need to make it fun for those watching." Iwata: "'This is ridiculous!' is the best possible
compliment you could get!" *(synthesis: the holder is the performer, the room the audience; the
comedy is the deliverable.)*
Nintendo, "Iwata Asks: WarioWare: Smooth Moves, 2." (2006): https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/2-This-is-ridiculous-is-the-best-compliment/2-This-is-ridiculous-is-the-best-compliment-228514.html

**R.7.2 Its 12-player mode is one shared Remote passed under time pressure, last one standing
(press description).** Siliconera: "everyone shares one and you have to quickly pass it over to the
next person before it's their turn." "The last person standing wins".
Siliconera, "How twelve person multiplayer works in Wario Ware: Smooth Moves" (2007): https://www.siliconera.com/how-twelve-person-multiplayer-works-in-wario-ware-smooth-moves/

---

## What this means for Streets of Barrie

Everything below is *(synthesis)*. Costs are against the shipped code: the sim in
`packages/shared/src/brawl/`, the runtime in `packages/minigames/brawl/src/runtime/`, the surfaces in
`packages/minigames/brawl/src/client/`.

### Where the shipped game already sits

- **The fixed, seeded course is the precondition the SoR4 team names for scoring to be strategy
  (E.4.2, S.4.3).** Every team fights the same street; spawns can be learned by watching the teams
  before you. Keep it. Anything that randomises the course per team spends this.
- **Mashing is the right floor (E.2.1, M.2.5).** A masher clears block 0 two times in three and
  block 2 almost never (`simulate/index.test.ts`). OFDP's "mash and die" (E.1.1) is the wrong model
  for a drunk room; Punch Quest's "both ways" is the right one. New depth must sit *above* the
  masher, never under them.
- **The hen has four possible answers and the roster uses two.** Peck now, step back, turn around
  (the beat 'em up's own BEHIND YOU), and a held peck if it ever means something. The goose is
  Galsia (E.3.1): it keeps you busy. The gull is a leaper whose answer is "peck when it is low" or
  "step back". The raccoon is a goose with more hp and a charge, and the boss is a goose with more
  of everything. No goon is Signal (attacks when you face away) and no goon is Donovan (shuts down
  the habitual answer). The facing decision the TV is built around has no goon that *rewards* it.
- **There is no interplay between goons (M.5.2).** A shoved goon flies through its neighbours; a
  KO'd one lies there inert. Each goon is a separate problem, so a wave is a queue, not a crowd.
- **Hearts reset every block.** Nothing a teammate does reaches the next teammate except the tally,
  so the relay is three solo runs. The best-turn "number to beat" is the only cross-turn stake.
- **The room has exactly one job, the shout.** It is a good job (the camera asymmetry is real and
  tested), but it ends the moment the goon is on the tablet.

### Candidate features

Each row: what it buys, the evidence, the cost, the catch. The principle numbers are
`docs/minigame-design-principles.md` §11.

| # | Feature | What it buys | Evidence | Cost | Catch |
|---|---|---|---|---|---|
| 1 | **Perfect-wave bonus.** Clear a wave without taking a hit and the wave's pip strip lights gold and the team banks a bonus (the wave's goon count, or a flat 2). Shown on the TV wave meter as a star that goes dark the moment she is hit. | A resource at risk during every wave with no new input (M.6.5, M.2.1, S.3.1). Near misses: "we lost the star on the last goose" (principle 4). A reason not to walk into the goose. | M.2.1, S.3.1 | Small. `BrawlFrame` gains `waveHits` or the wave bonus is derived from `hits` vs `waveOpenedTick`; `goonsTotal` becomes worth + possible bonuses so the share still tops out at 1; `WaveMeter` lights the star. | The denominator grows (34 → 41 on the default seed), so a team that clears everything but is hit in every wave scores lower than today. Decide whether the bonus is on top of 15 or inside it. |
| 2 | **Knockback chaining.** A shoved goon that travels into another standing goon on its side stuns that one too; one that is shoved into the locked window's edge rebounds. | Interplay from a bounds rule, the way Shredder's Revenge got juggling (M.2.4, M.6.3). Position becomes strategy: let them queue, then bowl. The TV sees geese tumble. | M.2.4, M.3.4 | Small. `resolvePeck` already computes the shove; add a pass over `frame.goons` for the shoved goon's path, and `clampGoon` already pins it at the edge. Deterministic, no new state. | Needs a cap (a stunned goon does not re-chain) or the boss's escort becomes free. Tune against the masher bot so block 0 does not get easier than 66%. |
| 3 | **Hearts left carry forward as worth.** At a clean handoff each unlit heart is worth 1 (shown as the hearts flying into the tally). | The first teammate's clean block matters to the last one; the relay becomes a team pot (S.4.1, S.5.1 as a working assumption). Pure rule, no hidden modifier (principle 5). | S.4.1 | Tiny. `scoring/` adds `hearts` from `BrawlBlockResult` (already recorded); the handoff beat animates them. | Rewards timidity if a block can be cleared without engaging, but a wave must be down before the camera lets go, so it cannot. |
| 4 | **A Signal goon: the swan.** Slow, approaches from behind only, and lunges *only while she faces away*; faces her and it stalls at reach, hissing. One peck down. | Gives the facing decision a goon that rewards it, and the room's BEHIND YOU a goon that is *only* answered by turning (E.3.1, E.3.4, M.6.2). Barrie has swans on the bay. | E.3.1 | Medium. New kind in `BRAWL_WORLD.goons`, a branch in `approachGoon` reading `frame.facing`, a drawing under `BrawlScene/Goons`, pips, cue. Appears from block 1. | Must never be unanswerable (E.3.2): it stalls when faced, so it is always peckable from the front. Its stall must read on the TV (a hiss pose). |
| 5 | **A Donovan goon: the helmet goose.** Wears a hockey helmet. Taps bounce off it (a *clank*, a shove, no hp). It drops its guard only while telegraphing, so the one peck that lands is the one timed into the honk; or, if feature 6 ships, a held peck cracks the helmet. | Shuts down the habitual answer (E.3.1, E.6.1, M.2.3). Turns the telegraph the room already shouts about into the moment to act, which is a counter with no new verb. | M.2.3, E.6.1, E.1.1 | Medium. New kind; `resolvePeck` checks the target's state (`telegraph` takes the hit, anything else is a clank). Drawing, pip, cue. Block 2 only. | M.6.7: counter-during-telegraph has no shipped precedent found; test it at a table before trusting it. A clank must still feel good (hit-pause, sound), or it reads as a bug. |
| 6 | **Held peck = charge.** Today a held right thumb repeats at the cooldown. Alternative: a hold past ~400 ms stops repeating, winds up (she rears back, the room sees it), and release lands a peck that hits *every* goon in the box and cracks a helmet (feature 5) or knocks the boss down. | Two verbs from one thumb by hold time (M.2.2, M.1.4); the charge gives the blocker its key. | M.2.2, M.6.1 | Medium. New input kind `peckRelease` (or `peck` with `held` ticks), `peckUntilTick` already exists; `resolvePeck` gets a multi-target branch. Host `PeckZone` changes meaning. | Conflicts with the controls research's item 3 ("holding is what a greasy thumb does; make it safe"). A thumb resting on the zone would now wind up instead of mashing. Only worth it if 5 ships and table tests show newcomers understand the wind-up pose. |
| 7 | **A hazard per block.** Block 0: a patio railing on Dunlop; block 1: the bay's edge at the waterfront (a goon shoved past it is KO'd whatever its hp, with a splash); block 2: the Spirit Catcher's plinth. Position-only. | Depth from the walk verb alone (M.6.4, M.3.4): herd the raccoon to the water instead of pecking it twice. Fight'N Rage's environment changes (M.4.2). The TV gets a splash. | M.3.4, M.4.2 | Medium. `BrawlBlock` gains `hazards: { x, kind }[]` from the seed/rules; `resolvePeck` checks the shove's destination; scenery already draws the bay. | Instant KO is worth only the goon's worth, so it is a shortcut, not a bonus; otherwise it becomes the only play. Keep hazards out of block 0's first wave (principle 18). |
| 8 | **The wing drop.** A KO'd raccoon (or any 2+ worth goon) leaves a wing on the pavement for a few seconds; walking over it restores a heart. One per wave at most. | The classic food-in-the-barrel, with MRB's "stand still to harvest" risk (M.4.4): the wing is where the goons are. Wings are the house currency (SCHLONIC's score-and-health). | M.4.4 | Small-medium. A `pickups` list on the frame, spawned in `resolvePeck` on a KO, collected in `moveHen`. Drawing and cue. | Hearts reset per block anyway, so the drop matters most in block 2. With feature 3 it also feeds the pot. |
| 9 | **The room sees the next goon's side.** The TV wave meter's waiting pips already exist; colour or arrow them by `spawn.side` so the room can call "GULL, LEFT, NEXT" before it spawns. | Upgrades the spectator-only asymmetry from half a second to the whole wave (R.3.1, R.4.1: the helper's lever is information the holder does not have). | R.3.1, R.4.1 | Tiny. `WaveMeter` reads `spawn.side`, which is in `BrawlBlock`. | None, except that the asymmetry collapses earlier; the tablet must never show it. |
| 10 | **Handoff pick: spend or save.** At each handoff the next teammate (or the whole team, shouting) picks one of two: "**+1 heart** this block" or "**+1 worth** on every goon this block"; or, Gaiden-style, "spend 2 banked worth to start with 4 hearts". | A legible between-stage decision, two options, at the natural breather (S.4.2, S.4.3). Strategy that outlasts the peck, argued by the whole team (principle 9). | S.4.2, S.4.3 | Medium-large. A `pick` action, a new `ready` sub-state on the host surface (two big cards, 5 s, default if nobody taps), view fields, per-block `heartsMax`/worth modifier into the sim's course, TV shows the pick. | Principle 17 (never two competing decisions) is satisfied only if the pick is a hold, not during play. Must default sensibly when the tablet changes hands mid-sauce. Do not ship a pick that is strictly better. |
| 11 | **Spectator reinforcements.** Each watching team gets one scarce token per round to add a goon (or a hazard) to one wave of a playing team's block, from their phones. | Jackbox's pooled lever (R.1.1) and Crowd Control's priced interference (R.2.1, R.2.2) give the other teams a stake in every turn. | R.1.1, R.2.1 | Large. Phones are not a surface today; a join flow, a new client, a server action that mutates the course before the block starts (the course must still be a published, replayable block), fairness across teams. | Breaks "every team fights the same course" (E.4.2) unless tokens are symmetric and spent before the round's first block. A later idea, not this pass. |
| 12 | **Replay the turn's KOs on the finish card.** At "Street clear", the TV runs all three blocks' falls at once over the street, Super Meat Boy's death replay (S.6.2). | The reveal-and-react beat gets a show; the room sees the whole fight in one shot (principle 24). | S.6.2 | Medium. The mirror has every block's input log; a fast-forward replay with only `kos` and `hits` rendered. | Pure juice; ship after the rules above. |

### Recommended package

Three tiers, in order. Each tier ends with the gate green and a masher-bot check that block 0
still clears at about two in three.

**Tier 1 — rules only, no new input, no new drawing.** Features 1, 2, 3 and 9. Together they turn a
wave from a queue into a crowd (2), give every wave a thing to lose (1), make the relay a team pot
(3), and give the room a whole wave of lookout instead of half a second (9). Nothing a first-timer
has to learn; the TV explains all four by showing them.

**Tier 2 — the roster.** Features 4 and 5, with 7 and 8 as the street's furniture. The swan rewards
the turn and the helmet goose punishes the mash, which is the SoR2 triangle (E.3.1) in Barrie
wildlife. Test the helmet goose's telegraph-counter at a table before writing it into the spec; it
has no cited precedent (M.6.7). Hold feature 6 (the charged peck) unless the helmet goose needs it,
because it costs the "holding is safe" rule the controls research argued for.

**Tier 3 — structure and the room.** Feature 10 (the handoff pick) is the one real strategy layer
and the one that gets the whole team arguing; it needs a design pass on the host surface. Feature 11
(phones) is a new surface and a new fairness problem; park it in `ideas/`. Feature 12 is juice for
the finish.

### Do not

- **Do not add a third verb** (jump, block, dodge). The evidence says the depth is in the enemies
  and the rules about being hit (M.6.5, M.6.6), and the controls research closed depth input.
- **Do not make mashing fatal** (E.1.1). The masher floor is the party's floor.
- **Do not ship an unanswerable goon** (E.3.2). Every kind must be peckable by a known answer.
- **Do not randomise the course per team** (E.4.2). Learning the street by watching is the strategy.
- **Do not hide a modifier** (principle 5). Every bonus, pot and pick is a rule the TV shows.

### Open questions for Brad

- Is the bonus (feature 1) inside the 15 or on top of it? Inside keeps the cap honest but makes a
  clean-but-bruised clear score under today's game.
- Does the helmet goose take the counter (peck into the honk) or the charge (held peck)? One is a
  timing read the room already shouts about; the other is a new meaning for a held thumb.
- Is the handoff pick the next teammate's alone, or the team's by shouting with a default? The
  second is more fun and slower.

## Sources not reachable

No finding above rests on these.

- Red Bull SoR4 developer tips (empty page); SoR wiki combo rules (402); Fight'N Rage score guide
  (403); Giant Bomb SoR2 bonus table (403); Final Fight / SoR2 manuals.
- TechRaptor and We Got This Covered OFDP interviews (colour-coding); Halfbrick Dan the Man; Lucky
  Kat Beat Street.
- GDC Vault videos: Sid Meier "Interesting Decisions" (2012), Downwell (2016), KTANE (2016), Jackbox
  (2021), AC Valhalla combat, Doom 2016 tokens.
- Vlambeer "The Art of Screenshake" (no transcript); TV Tropes Sakurai episode index (403); TIME
  Arkham interview (TLS).
- Tribute Games, WayForward and Secret Base interviews on Seasoned Gaming / Co-Optimus (403).
- Spelunky (Derek Yu), Super Crate Box, Overcooked (Red Bull, BAFTA), Spaceteam (AdColony), Castle
  Crashers combat, Hades, Risk of Rain, Mario Party, Trackmania, Bayonetta, Tony Hawk, Hotline
  Miami, PlayLink, Hidden in Plain Sight, Rayman Legends' Murfy, NSMBU "No Buddy Play".
