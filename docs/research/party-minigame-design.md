<!-- Research notes gathered 2026-09-23 by a background agent against primary sources, for docs/minigame-design-principles.md. The principles doc is what a design review uses; this file is the evidence behind it. Finding numbers (T.n) are what the principles doc cites. -->

# What makes a party minigame work for a room — research notes for Wing Night

Researched 2026-09-23. Scope: primary sources only (designers' own talks, interviews, postmortems, books; games' own rules; peer-reviewed papers). Where a primary source could not be reached, the finding says so and names the substitute.

## How to read this

- Each numbered finding is a one-line principle in bold, one to three sentences of evidence, then the citation. Findings are numbered `T.n` (topic, finding) so the rules at the end can point back at them.
- **(synthesis)** marks a claim that is my inference from the evidence, not something a source says.
- Quotations are short and verbatim from the fetched text. Speaker names are given where the source is an interview.
- Wing Night specifics assumed throughout: 3–5 teams, one team plays while the rest watch the TV, a human host on a tablet, 45–120 s turns, ~8 rounds, per-round point caps, sudden-death trivia on ties.
- "Candidate rules" at the end are written to be checkable at a design review, not aspirational.

---

## 1. Tension and pressure in short-form games

**1.1 Tension *is* uncertainty with a personal stake in resolving it.** Huizinga's formal analysis of play: "Tension means uncertainty, chanciness; a striving to decide the issue and so end it. The player wants something to 'go', to 'come off'; he wants to 'succeed' by his own exertions." A turn with no open question, or whose outcome the player cannot influence, has no tension by this definition.
Johan Huizinga, *Homo Ludens* (1938; Routledge 1949 ed., pp. 10–11), full text: https://archive.org/download/homo_ludens_johan_huizinga_routledge_1949_/homo_ludens_johan_huizinga_routledge_1949__djvu.txt

**1.2 Flow needs three things: a challenge that stretches the skill, a clear near-term goal, and immediate feedback on progress.** Nakamura and Csikszentmihalyi list the conditions as "perceived challenges, or opportunities for action, that stretch (neither overmatching nor underutilizing) existing skills" and "clear proximal goals and immediate feedback about the progress that is being made." Anxiety or boredom follows when challenge and skill diverge.
Jeanne Nakamura & Mihaly Csikszentmihalyi, "The Concept of Flow", *Handbook of Positive Psychology* (2002), p. 90: https://nuovoeutile.it/wp-content/uploads/2015/12/2002-Flow.pdf (Csikszentmihalyi's 1975 *Beyond Boredom and Anxiety* is on archive.org but behind the lending wall; this co-authored chapter is the reachable primary.)

**1.3 Enjoyment oscillates: "tense and release", not constant maximum pressure.** Schell: "This cycle of 'tense and release, tense and release' comes up again and again in design... Too much tension, and we wear out. Too much relaxation, and we grow bored." His Lens of Flow asks: "Does my game have clear goals?" and "Does my game provide a steady stream of not-too-easy, not-too-hard challenges?"
Jesse Schell, *The Art of Game Design: A Book of Lenses* (2008), ch. 9, Lens #18: https://www.inventoridigiochi.it/wp-content/uploads/2020/07/art-of-game-design.pdf

**1.4 Near misses drive the urge to go again — but only when the player had control.** In a slot-machine fMRI study, near-misses were "experienced as aversive" yet "increased ratings of 'continue to play'", and this held only when the participant chose the gamble: "participant-chosen near-misses were significantly less pleasant... but significantly more motivating." Computer-chosen near-misses reduced the desire to play.
Clark, Lawrence, Astley-Jones & Gray, "Gambling Near-Misses Enhance Motivation to Gamble and Recruit Win-Related Brain Circuitry", *Neuron* 61(3), 2009: https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/

**1.5 A hard time cap plus a comprehension cap is the WarioWare engine.** Sakamoto (producer): "With WarioWare speed is everything, people have five seconds at most to grasp the way they have to play." The team solved the comprehension problem with a fixed pre-game instruction form ("Hold the Remote like this") rather than longer explanations.
Iwata Asks: WarioWare Smooth Moves, part 2 (2006): https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/2-This-is-ridiculous-is-the-best-compliment/2-This-is-ridiculous-is-the-best-compliment-228514.html

**1.6 Time pressure converts a simple task into shouting; disruptions keep it from going rote.** Phil Duncan (Ghost Town Games) on the prototype: "when time was against you it would invariably end in lots and lots of shouting." In the design deep dive he describes adding mid-level chaos events (sliding counters, earthquakes) that "force players to rethink their strategy and importantly, to communicate", keeping cooperation from becoming "rote and unspoken", and tuning the scoring to give "more breathing room to think about their actions and coordinate themselves" — the release half of 1.3.
Ghost Town Games, "Road to the IGF: Overcooked" (2017): https://www.gamedeveloper.com/design/road-to-the-igf-ghost-town-games-i-overcooked-i- ; Phil Duncan, "Game Design Deep Dive: Building truly cooperative play in Overcooked" (2017): https://www.gamedeveloper.com/design/game-design-deep-dive-building-truly-cooperative-play-in-i-overcooked-i-

**1.7 Broadcast game shows manufacture pressure with a face, a lock-in, and an exit.** David Briggs (creator, *Who Wants to Be a Millionaire?*): "the simple idea that putting people under pressure, with a television camera right close to their face, would be interesting"; "when that camera is right in those people's eyes, you can almost see inside their souls when they have to make the decision." The "final answer" pause is written into the format so hosts can stretch the moment, and the walk-away option exists because "it's human frailty... that makes you say, 'I'll just take the money, thank you.'" Set designer Andy Walmsley: "why don't we do it in the round, like a coliseum, that will add drama."
David Briggs, *Fresh Air* interview (2001-02-06): https://freshairarchive.org/segments/david-briggs ; Andy Walmsley, designer's own account: https://www.andywalmsley.com/millionaire.php

---

## 2. What makes a game funny in a room

**2.1 The players make the jokes; the game builds the stage.** Arnie Niekamp (Jackbox, director of Drawful): "what we really wanted was people in the room to really be yelling at each other, and... talking to each other"; the aim is "creating a space for the people playing" rather than the developers being funny at them. Allard Laban (Jackbox CCO): "Making stupid jokes and making your friends laugh... There's nothing more gratifying."
BagoGames interview with Arnie Niekamp (2016): https://bagogames.com/interview-jackbox-games/ ; Built In Chicago interview with Laban, McClure, Jacover: https://www.builtinchicago.org/articles/jackbox-games-design-party-pack

**2.2 Engineer ambiguity so that any weird answer *could* be right.** Niekamp: "The basic idea of Drawful is to try and make it so any weird thing could be right" and "literally giving players control of the right answer makes it all the funnier." Bad drawings are funny because the prompt space is already absurd, not because the artist is humiliated.
Same BagoGames interview.

**2.3 "This is ridiculous!" is the target reaction, and it comes from the body.** Sakamoto: "We worked extremely hard to attain our goal of making you say something like: 'This is ridiculous!' or 'The game beat me!'" Iwata: "'This is ridiculous!' is the best possible compliment you could get!" The comedy in testing was physical: testers "squatting in front of the people supervising the product testing simply because they were following the game's instructions."
Iwata Asks: WarioWare Smooth Moves, part 2 (link in 1.5)

**2.4 A subjective judge with a final say is a legitimate, fast, funny scoring mechanism.** The Apples to Apples rules: "Some judges will pick the funniest or most interesting red apple card"; "It's OK for players to try to convince the judge"; "Once the judge has picked a red apple card, the decision is final." The rules explicitly license lobbying and explicitly close the argument.
Mattel, *Apples to Apples Junior* rules sheet (official PDF): https://service.mattel.com/instruction_sheets/n1387-0920.pdf

**2.5 Fun and funny are different; keep the stakes playful or the laughter stops.** DeKoven: "Humor is a survival skill. Comedy is entertainment. Fun is engagement. Funny makes you laugh." And: "a lot of this is about the difference between playing to win versus having to win. If you have to win, there is no game."
Bernie DeKoven, "Deep Fun and the Theater of Games", *American Journal of Play* 7(2), 2015: https://files.eric.ed.gov/fulltext/EJ1053426.pdf

**2.6 Surprise is the root of humour, and rules can be built to let players surprise each other.** Schell defines "Fun is pleasure with surprises" and asks in the Lens of Surprise: "Do your rules give players ways to surprise each other? Do your rules give players ways to surprise themselves?"
Schell (2008), Lens #2 (link in 1.3)

**2.7 (synthesis) Funny failure is failure the *room* can see coming and the player cannot.** This follows from 2.2 (ambiguity), 3.1 (information asymmetry) and 2.3 (the body as punchline): the joke lands when spectators hold information the player lacks and the player's honest effort is visibly wrong. Humiliation is the version where the player is the only one who didn't consent to the joke — the Drawful and WarioWare cases both keep the player in on it by making wrongness the expected mode.

---

## 3. Spectator design

**3.1 Spectator suspense comes from information asymmetry, and it is the *revelation* that entertains.** Cheung & Huang identify three forms: information known to the player but not the spectator (the plan), unknown to both (the outcome), and known to the spectator but not the player (poker hole cards, fog of war). "All information asymmetry is reduced and eliminated as the game progresses. But as the information is revealed, the spectator is entertained in the process." A spoiler is "information that prematurely collapses the desired game suspense." Design implication: "the proper question for designers to ask is not 'how do we give more information to spectators?', but rather... 'where should we place control over the game information?'" They also note "Comebacks... provides suspense" and back-and-forth "epic games" are a further source.
Gifford Cheung & Jeff Huang, "Starcraft from the Stands: Understanding the Game Spectator", CHI 2011: https://jeffhuang.com/papers/StarcraftSpectator_CHI11.pdf

**3.2 The spectator target is "Give it here, I'll show you how it's done!"** Iwata names that line as the design goal. Abe (director): "making sure the person watching was having fun was something we always had at the forefront of our minds during development." Sakamoto: "even if they didn't know what to do either, everyone was able to enjoy the experience equally", and on the finished game: "It really is a game that can be enjoyed by those playing and those watching alike. I think it makes the people watching really get into it."
Iwata Asks: WarioWare Smooth Moves, parts 3 and 4: https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/3-Give-it-here-I-ll-show-you-how-it-s-done-/3-Give-it-here-I-ll-show-you-how-it-s-done--228579.html and https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/4-Everyone-in-the-room-will-have-a-grin-on-their-face-/4-Everyone-in-the-room-will-have-a-grin-on-their-face--228673.html

**3.3 Give spectators a differing viewpoint and a job, and they stop being bystanders.** Steel Crate on the origin of Keep Talking: they "decided to make a game where the spectators could be involved in some way and really take advantage of the differing viewpoint they had." Ben Kane's GDC talk frames the result as "a game about communication between players" producing "tension, mistakes, hilarity, and occasionally even camaraderie."
"Road to the IGF: Steel Crate Games' Keep Talking and Nobody Explodes" (2016): https://www.gamedeveloper.com/design/road-to-the-igf-steel-crate-games-i-keep-talking-and-nobody-explodes-i- ; GDC Vault, Ben Kane, "Designing Asymmetric Gameplay for Keep Talking and Nobody Explodes" (2016): https://gdcvault.com/play/1023471/Designing-Asymmetric-Gameplay-For-Keep

**3.4 The audience's pleasure is partly superiority: "It's so much easier at home."** Briggs reports contestants say exactly that; the format's close-up on the decision (1.7) is what lets viewers feel it. **(synthesis)** For Wing Night the TV is the "at home" seat — spectators should usually be able to see enough to have an opinion before the player commits.
Briggs, *Fresh Air* (link in 1.7)

**3.5 Streaming forced Jackbox to design for the watchers, including extended timers for latency.** GDC description: "streamers would dramatically affect the way we make games." Their Party Pack 8 guide recommends "enabling extended timers to compensate for possible stream delays" and every game gives the audience a vote ("The audience votes and their responses are added to the vote totals").
GDC Vault, Bilder & Hofer, "The Players You Didn't Plan For" (2020): https://www.gdcvault.com/play/1026870/The-Players-You-Didn-t ; Jackbox Games, "Streaming, Moderation, and Accessibility Features in The Jackbox Party Pack 8": https://www.jackboxgames.com/blog/streaming-moderation-accessibility-features-jackbox-party-pack-eight

**3.6 Being watched changes the player, and not only for the better.** DeKoven: "spectators change the experience of play for the players themselves. They play knowing they are being watched and judged. And so they are restrained from playful play, for the most part." **(synthesis)** The counter, per 2.3 and 2.2, is a game whose expected mode is ridiculous, so being watched failing is the point rather than a judgement.
DeKoven (2015), link in 2.5

**3.7 The room needs to read who is winning, or it cannot watch.** Cheung & Huang: "Games need to reveal enough information for the spectator to know what is going on, who is winning, etc. Otherwise, they are hard to watch and understand." Spectators went so far as to tape over on-screen scores/timers to protect suspense — control over *when* the score is revealed matters as much as showing it.
Cheung & Huang (2011), "Implications for Design"

---

## 4. Turn-based fairness and catch-up

**4.1 Mario Party's stance is explicit: keep the trailing player in it, and keep the luck honest.** Shuichiro Nishiya (Nd Cube): "We came up with various ways to help those lagging behind." Jumpei Horita (Nintendo): "Even when you're down on your luck, you can still take advantage of the minigames to survive... There are plenty of ways to turn the situation around." Horita on fairness: "I assure you that the outcome of the roll is 100% pure luck."
Nintendo Life interview with Nintendo/Nd Cube on Mario Party 10 (2015): https://www.nintendolife.com/news/2015/03/interview_nintendo_and_nd_cube_on_bowser_amiibo_and_the_pure_luck_of_the_dice_in_mario_party_10

**4.2 Mario Party's end-of-game swing is a rules mechanic, not an AI cheat.** The manual: "Bonus Stars will be awarded at the end of the game... For each game, 3 Bonus Stars will be automatically selected from the following list of 6." The categories reward things a trailing player can plausibly lead (most spaces moved, most minigames won), and which three count is hidden until the end.
Nintendo, *Mario Party DS* instruction booklet (EN), p. 17: https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_MarioPartyDS_EN.pdf

**4.3 Comebacks and back-and-forth are themselves spectator content.** Cheung & Huang list comebacks ("players are nearly beaten but return to parity after spectacular play") and long see-saw games as sources of suspense, because "when one player loses, it will be all for naught" for the losing side's investment.
Cheung & Huang (2011), link in 3.1

**4.4 Catch-up must not remove the player's sense of responsibility for the result.** Juul's survey: "players *prefer feeling responsible* for their own failure" (p<0.016); players who blamed themselves rated the game higher than those who blamed the game. Combined with 1.4 (near misses motivate only under personal control): **(synthesis)** catch-up that is *earned through play* (harder-but-richer options, bonus categories) keeps the motivation; catch-up that is *applied to you* (invisible handicaps) reads as unfair and demotivates the leader without cheering the trailer.
Jesper Juul, "Fear of Failing? The Many Meanings of Difficulty in Video Games" (2009): https://jesperjuul.net/text/fearoffailing/

**4.5 Punishment the player cannot understand or prevent gets the game labelled "unfair", and then people disengage.** Schell: "It is crucial that all punishment in a game is for things that the player is able to understand and prevent. When punishment feels random and unstoppable... the player will quickly label the game 'unfair.' Once this happens, a player is seldom willing to engage in a game further." His Lens of Challenge asks: "Can my challenges accommodate a wide variety of skill levels?"
Schell (2008), Lens #31 and Lens #41 (link in 1.3)

**4.6 A play community changes the rules so more people can keep playing.** DeKoven describes the play community as one "where players adapt rules to allow more people to play more fully" and prefers games "that had so many variations that they obliged you to decide what rules you wanted to play by... to focus more on each other than on winning." **(synthesis)** For a host-driven night this is permission for the host to have visible, pre-agreed levers (e.g. a documented handicap) rather than silent ones.
DeKoven (2015), link in 2.5

*Not found:* a primary Nintendo statement on Mario Kart item rubber-banding. The Iwata Asks Mario Kart Wii pages 1, 2 and 4 and the Mario Kart World "Ask the Developer" chapters 1–3 were fetched; none discusses position-based item distribution. Do not cite "Nintendo says" on this point.

---

## 5. Learnability under intoxication and spice

**5.1 Budget five seconds for comprehension, and use a fixed instruction form.** Sakamoto's "five seconds at most to grasp" (1.5) is paired with a standardised pre-game frame ("Hold the Remote like this"). Iwata on the same series: "Even people with short attention spans can do it." Part 1 confirms the design unit: "We only need to come up with five seconds apiece!"
Iwata Asks: WarioWare Smooth Moves parts 1–2; Iwata Asks: WarioWare D.I.Y. part 2: https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/1-With-one-of-these-remotes-you-can-do-anything/1-With-one-of-these-remotes-you-can-do-anything-228459.html and https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-WarioWare-D-I-Y-/Iwata-Asks-WarioWare-D-I-Y-/2-Short-Attention-Span-No-problem-/2-Short-Attention-Span-No-problem--215053.html

**5.2 One task at a time; the user must always know what to do; the program moves on if they don't.** Gottlieb's Jack Principles (the document behind You Don't Know Jack and, later, Jackbox), under "Maintaining Pacing": "Give the user only one task to accomplish at a time"; "Limit the number of choices the user has at any one time"; "Make sure the user knows what to do at every moment"; "Pause, quit or move on without the user's response if it doesn't come soon enough." Jackbox restates it today: "The games never ask players to make multiple choices in a given moment; it's always either pick an answer, draw a picture, or enter a word or phrase."
Harry Gottlieb, *The Jack Principles of the Interactive Conversation Interface* (Jellyvision, 1997–2002): https://ia600801.us.archive.org/26/items/the-jack-principles/The_Jack_Principles_djvu.txt ; Built In Chicago (link in 2.1)

**5.3 Put rules, tips and a practice moment on one screen before the minigame, gated by "ready".** The Mario Party DS manual: "Before a minigame begins, the Minigame Instruction Screen is displayed... RULES and TIPS buttons... touch the PRACTICE icon to practise the minigame... touch the START icon to start." This is the series' standard answer to first-time play.
Nintendo, *Mario Party DS* manual (link in 4.2)

**5.4 Learning to play is itself the first challenge; early success builds the confidence to keep going.** Schell: "Just learning to play a game at all is a challenge! For this reason, the first level or two of a game are often incredibly simplistic... a few early successes can do a lot to build a player's confidence — and a confident player will give up less easily."
Schell (2008), ch. 11 (link in 1.3)

**5.5 Prefer icons to words for in-game state.** Duncan on Overcooked: the team used an "iconographic approach" over word-based communication to keep coordination possible without frustration. DeKoven's bar: "Great games are as easy to learn as it is to learn what to do with a Frisbee. And they also may be as difficult to master."
Duncan deep dive (link in 1.6); DeKoven (link in 2.5)

**5.6 (synthesis) The first team to play a new minigame is disadvantaged; later teams learn by watching.** 3.2 shows watching is a genuine learning channel ("Give it here, I'll show you"), so in fixed turn order the last team has seen up to four attempts and the first has seen none. Counters that the sources support: a practice moment for every team (5.3), rotating which team opens each round, and keeping the first team's *content* (not the rules) secret from the TV so later teams learn the verb but not the answer (3.1).

---

## 6. Physical, embodied and social play

**6.1 Shouting emerges when the only channel to your teammate is your voice and the clock is short.** Henry Smith (Spaceteam): "You can get by for a few levels with one player not responding to anything you say, but eventually you have to all work together and start shouting over each other and talking and listening at the same time." He calls the design's odd core "you have to interact with your teammates outside the game", and notes "you have to tell someone else about the game just in order to play it."
Henry Smith interviewed in *ANIMAL* (2014): https://animalnewyork.com/2014/06/05/spaceteam-game-plan/ ; "Road to the IGF: Henry Smith's Spaceteam" (2013): https://www.gamedeveloper.com/design/road-to-the-igf-henry-smith-s-i-spaceteam-i-

**6.2 Give the team more jobs than hands, and make every hand equally responsible.** Duncan: in Overcooked there are "generally always more actions to perform than players available", and "all players are equally responsible for the success of the team." Identical player stats kept the focus on coordination rather than roles.
Duncan deep dive; Road to the IGF: Overcooked (links in 1.6)

**6.3 Split the information, not the controls, to force talk.** Ben Kane: "Each side... would have different pieces of information and they would need to work together to solve a puzzle." The non-controlling teammates hold the manual; the game is unplayable without them.
Road to the IGF: Keep Talking (link in 3.3)

**6.4 Play happens inside a marked-off space with its own rules, and it forms secretive groups.** Huizinga: "All play moves and has its being within a play-ground marked off beforehand... All are temporary worlds within the ordinary world, dedicated to the performance of an act apart." And in summary, play "promotes the formation of social groupings which tend to surround themselves with secrecy and to stress their difference from the common world by disguise or other means." **(synthesis)** Team identity, anthems and secrets-from-the-TV are the "disguise and secrecy" that make teams feel like teams.
Huizinga (1949 ed.), pp. 10 and 13 (link in 1.1)

**6.5 Caillois's four kinds of play are a variety checklist.** Agon: "regulated competition or rivalry" under equal conditions. Alea: chance, where the player "merely awaits the outcome". Mimicry: the player tries to "escape himself and become another". Ilinx: "an attempt to momentarily destroy the stability of perception and inflict a kind of voluptuous panic." Across the paidia–ludus axis from "free improvisation, and carefree gaiety" to "arbitrary, imperative, and purposively tedious conventions."
Roger Caillois, *Man, Play and Games* (1958/1961), quoted in Thomas Henricks, "Caillois's Man, Play, and Games: An Appreciation and Evaluation", *American Journal of Play* (2010): https://archive.org/stream/ERIC_EJ1070247/ERIC_EJ1070247_djvu.txt (the Barash translation itself is not openly hosted; publisher page: https://www.press.uillinois.edu/books/?id=p070334)

**6.6 One shared controller, passed around, is a feature.** Sakamoto: "Everyone can have fun with just one controller!" and Iwata's summary of the whole game: it "will have everyone in the room with a grin on their face with just one Wii Remote and a TV." Personalising the avatar raises stakes: when the on-screen character is your Mii, Abe notes "Getting hit also becomes more infuriating though!"
Iwata Asks: WarioWare Smooth Moves parts 3–4 (links in 3.2)

**6.7 Cooperative games make the player more important than the game.** DeKoven: "In cooperative games... winning is based on collective performance," and "the player is more important than the game. The rules of the game, the goals, are constantly adjusted to optimize access to a shared community of play."
DeKoven (2015), link in 2.5

*Not found:* a primary 1-2-Switch interview on face-to-face design. Searches surfaced only Switch 2 interviews with Kawamoto; the Time and Fortune pieces did not contain the "eye-to-eye" line. Treat 1-2-Switch as unsourced here.

---

## 7. Pacing a multi-game night

**7.1 People remember the peak and the end, and largely forget duration.** Kahneman et al.: retrospective evaluations "are often dominated by the discomfort at the worst and at the final moments of episodes"; in the earlier data "an unweighted combination of peak discomfort and of the discomfort at the end of the episode accounted for 94% of the variance" while duration added 3%. Subjects chose to repeat a *longer* painful trial because it ended better.
Kahneman, Fredrickson, Schreiber & Redelmeier, "When More Pain Is Preferred to Less: Adding a Better End", *Psychological Science* 4(6), 1993: https://www.ius.uzh.ch/dam/jcr:5ae9adc9-61ec-4174-b37c-4b752f36c23b/Kahnemann%20et%20al.%20-%20When%20More%20Pain%20is%20Preferred%20to%20Less%20(1993).pdf

**7.2 A good interest curve has a hook, rising peaks with small dips, a climax, and leaves them wanting more.** Schell: after the hook, "the guest's interest will continually rise, temporarily peaking... and occasionally dropping down a bit... only in anticipation of rising again. Finally... there is a climax." The bad curve has no hook and "just peters out." He notes the same pattern recurs at every scale (a moment, a level, a whole game).
Schell (2008), ch. 14, Lens #61 (link in 1.3)

**7.3 A pack of games should be diverse, and a pack can afford a couple of weird ones.** Niekamp: "we really take advantage of the fact that a pack full of games can have a couple... weirder things." Jackbox's own GDC talk on the annual five-game pack covers "how games are selected for inclusion" and why some (Trivia Murder Party) took years while others moved fast. Laban: games use "timing and pacing that they might expect from a TV show."
BagoGames (link in 2.1); GDC Vault, Evan Jacover, "The Jackbox Party Pack Unboxed" (2021): https://gdcvault.com/play/1027202/The-Jackbox-Party-Pack-Unboxed ; Built In Chicago (link in 2.1)

**7.4 Randomness and variation are load-bearing in a microgame series.** Sakamoto: "This particular series of games takes being random for granted and, although hugely enjoyable to play, would be near impossible to make into a single, stand-alone game." (A search snippet of the same interview on Nintendo's iwataasks host, which failed TLS verification, adds that ~200 microgames were selected from over a thousand for "a good balance, with enough variation to keep the necessary level of excitement" — treat that number as unverified.)
Iwata Asks: WarioWare Smooth Moves part 1 (link in 5.1)

**7.5 The program should never wait indefinitely on a person.** Gottlieb's pacing principles (5.2) include "Make the user aware that the program is waiting" and "move on without the user's response if it doesn't come soon enough." **(synthesis)** In a host-paced game this transfers to the host UI: the tablet should tell the host when the room is waiting on them.
Gottlieb (link in 5.2)

**7.6 (synthesis) Round order should alternate Caillois categories and peak on the last round.** From 6.5 (variety), 7.2 (rising peaks, climax) and 7.1 (peak and end dominate memory): the round list should not put two agon-heavy skill games back to back, and the final round should be the most spectacular, not merely worth more points.

---

## 8. Juice and feedback

**8.1 Cheap layered feedback transforms the same rules into an exciting game.** The GDC description of "Juice It or Lose It": Jonasson and Purho "crank a boring old game up to eleven, live on stage" with particles and sound and hand out the source. The demo repo (Jonasson & Purho, 2012, zlib licence) is the canonical artefact; it was made "to demonstrate 'juicy' game design principles — making games feel alive and responsive through cascading visual and audio feedback."
GDC Vault, "Juice It or Lose It" (GDC Europe 2012): https://www.gdcvault.com/play/1016487/juice-it-or-lose ; source: https://github.com/grapefrukt/juicy-breakout ; video: https://www.youtube.com/watch?v=Fy0aCDmgnxg (not fetched; transcript unavailable)

**8.2 Thirty small tweaks — bigger bullets, screen shake, hit-pause, permanence — make an action game "far more exciting and engaging to watch."** Nijman's INDIGO Classes talk demonstrates 30 changes to a dull shooter; the Gamasutra report of it singles out screen shake opposite the recoil and random harmless explosions on death as making the game more exciting "to watch". A student's notes on the talk report Nijman explaining the ~0.2 s hit-"sleep" as "an opportunity for your brain to process what is going on, without even noticing it."
Game Developer report on the talk (2013): https://www.gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games ; talk video: https://www.youtube.com/watch?v=AJdEqssNZ-U (not fetched); notes (secondary): https://victorweidar.wordpress.com/2016/10/06/the-art-of-screenshake/

**8.3 Immediate feedback is a flow *condition*, not decoration.** See 1.2: "immediate feedback about the progress that is being made" is one of the two listed conditions of flow. **(synthesis)** For a TV read across a room, "immediate" also means "large": a hit or a point that is only legible on the tablet is not feedback for the room.
Nakamura & Csikszentmihalyi (2002), link in 1.2

**8.4 Escalating music and a narrowing set are the broadcast version of juice.** Walmsley designed the Millionaire set "in the round, like a coliseum" for drama and recalls a contestant's "hand shaking so much that the water was spilling all over my plexi glass floor." The often-repeated detail that each question's cue rises a semitone is attributed to composer Matthew Strachan but I could only reach it through fan-wiki and obituary pages — treat as *secondary*.
Walmsley (link in 1.7); semitone claim: https://millionaire.fandom.com/wiki/Music_scores (secondary, not fetched directly; from search results)

**8.5 Personalisation is a cheap stakes multiplier.** Abe on WarioWare's Mii integration: when the character is you, "Getting hit also becomes more infuriating" — and when you fail, "the character turns around to face you and you're staring at yourself!"
Iwata Asks: WarioWare Smooth Moves part 4 (link in 3.2)

---

## 9. Failure that is fun

**9.1 Failure is content: it pushes reconsideration, and too little of it turns a game into "interactive muzak".** Juul: "failure pushes the player into reconsidering strategy, and failure thereby subjectively *adds content* to the game." Players called low-consequence games "interactive muzak"; punishments requiring full replays produced frustration instead.
Juul (2009), link in 4.4

**9.2 The paradox of failure is the engine, not a bug.** Juul's book page: "why do we play video games even though they make us unhappy?" — the answer being that we seek the experience of inadequacy in a frame where it is recoverable.
Jesper Juul, *The Art of Failure* (MIT Press, 2013), author's page: https://jesperjuul.net/artoffailure/ (MIT Press page returned 403)

**9.3 "The game beat me!" is a designed outcome.** Sakamoto's stated goal (2.3) includes the player saying "The game beat me!" — failure that is attributable to a ridiculous demand rather than to the player being stupid. The Mii turning to face you on failure (8.5) makes the failure a punchline the whole room shares.
Iwata Asks: WarioWare Smooth Moves parts 2 and 4

**9.4 Failure must be understandable and preventable to stay fun.** Schell (4.5): random, unstoppable punishment produces "a complete lack of control, which is a very bad feeling." Juul (4.4): players prefer to feel responsible. **(synthesis)** Together: fail states should be *caused by a visible action* and *cheap to recover from within the same turn*; a 60-second turn cannot afford a 20-second death.
Schell Lens #41; Juul 2009

**9.5 Collective failure under time pressure reads as comedy, not shame.** Duncan's "lots and lots of shouting" (1.6) and Kane's "mistakes, hilarity" (3.3) both describe team failure where responsibility is shared and everyone was trying. Spaceteam is the same: the failure is the room's, not one person's.
Links in 1.6, 3.3, 6.1

**9.6 End on the better note.** From 7.1: the end of an episode dominates its memory. **(synthesis)** A turn that ends on a fail buzzer and a cut to the next team is remembered as a fail; the same turn ending on the reveal of what the answer was, the score ticking up, and the team's avatars reacting is remembered as a moment.
Kahneman et al. (1993)

---

## Candidate rules for Wing Night

Each rule is written so a reviewer can answer yes/no against a build or a design doc. Pointers name the findings that justify it.

**Tension and time**
1. Every clock-paced minigame shows its countdown on the TV, and for the final 10 seconds the digits are the largest element on screen with an audible tick. (1.1, 1.2, 8.3, 3.7)
2. Every host-paced minigame has a "lock it in" moment: the host presses one button that visibly commits the team's answer on the TV before the reveal. No reveal without a lock. (1.7, 3.1)
3. Every turn has at least one moment of release: a brief hold after each success or failure (≥0.3 s of hit-pause or reaction) before the next demand. (1.3, 8.2)
4. Each minigame's per-turn cap is reachable with a realistic near miss: the scoring must produce outcomes like 13/15, not only 0 or 15. (1.4, 1.1)
5. Any rubber-banding is a rule the room can see (bonus categories, published handicap), never a hidden modifier. (4.1, 4.2, 4.4, 4.5, 4.6)

**Funny**
6. Every creative minigame (drawing, emoji, forgery, prompts) is scored by a judge or vote with a final decision, and the rules text on the TV says lobbying is allowed. (2.4, 2.1)
7. Prompt banks are written so that a wrong or bad answer is still a plausible answer; a reviewer should be able to point at ≥3 prompts per bank where a terrible submission would be funnier than a good one. (2.2, 2.7)
8. Failure in a minigame produces an on-TV consequence that is comic and attributable to the game's demand ("the game beat you"), not a plain "WRONG". (2.3, 9.3)
9. At least two of the eight rounds require the whole team to move or speak, not just the tablet holder. (2.3, 6.1, 6.2)

**Spectators and the TV**
10. For every minigame, the design doc states which of the three information asymmetries it uses (player-only, nobody, spectator-only) and when the asymmetry collapses. If the answer is "none", redesign. (3.1)
11. When a team's content is secret from the TV, the TV still shows the *frame* (timer, score-so-far, which teammate holds the tablet, reactions) so spectators know what is happening and who is winning. (3.7, 3.1)
12. The TV shows the live standings on every round-results screen, and never during a turn unless the minigame's asymmetry calls for it. (3.7, 3.1)
13. Spectating teams get at least one concrete job or read in every minigame (they can see the answer, they can heckle a specific choice, they can watch the pin move), stated in the design doc. (3.3, 3.2)
14. Every point earned appears on the TV within one second of the action that earned it, at a size readable from across the room. (1.2, 8.3, 8.1)

**Learnability and turn order**
15. Every minigame's rules fit one TV screen: one verb line ("Draw it", "Guess where") plus at most two clauses, no scrolling. (5.1, 5.2)
16. Every minigame has a ≤10-second practice or demo beat before the first team's turn in that round, gated by host "ready". (5.3, 5.4, 5.6)
17. The tablet never presents more than one decision at a time to the player; a screen with two competing actions is a defect. (5.2)
18. Which team opens a round rotates across the night so no team is always first on a fresh minigame. (5.6, 3.2)
19. The host tablet shows a visible "room is waiting on you" indicator whenever no clock is running and no player input is pending. (7.5, 5.2)

**Night structure**
20. No two consecutive rounds use the same dominant Caillois category (skill / chance / performance / vertigo), checked against the round schedule. (6.5, 7.6, 7.4)
21. The final round is the most spectacular minigame of the night, not merely the highest cap. (7.1, 7.2)
22. Every turn ends on a reveal-and-react beat (answer shown, score ticks, avatars react) before control passes; there is no "hard cut" transition after a fail. (9.6, 7.1)
23. Fail states inside a turn cost ≤5 seconds to recover from; anything longer is redesigned or the turn simply ends. (9.4, 9.1)
24. Team identity is on screen at every turn (colour, name, avatars, anthem cue), and the TV addresses the team, not the individual. (6.4, 6.6, 8.5)

---

## Sources

All URLs below were fetched during this research unless marked otherwise.

**Nintendo (Iwata Asks, manuals, Ask the Developer)**
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/1-With-one-of-these-remotes-you-can-do-anything/1-With-one-of-these-remotes-you-can-do-anything-228459.html — Smooth Moves part 1: five seconds apiece, fun to watch, randomness.
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/2-This-is-ridiculous-is-the-best-compliment/2-This-is-ridiculous-is-the-best-compliment-228514.html — part 2: "speed is everything", "This is ridiculous!", designed for watchers.
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/3-Give-it-here-I-ll-show-you-how-it-s-done-/3-Give-it-here-I-ll-show-you-how-it-s-done--228579.html — part 3: spectator goal, one controller.
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Wii/Iwata-Asks-WarioWare-Smooth-Moves/4-Everyone-in-the-room-will-have-a-grin-on-their-face-/4-Everyone-in-the-room-will-have-a-grin-on-their-face--228673.html — part 4: room grinning, Mii stakes.
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-WarioWare-D-I-Y-/Iwata-Asks-WarioWare-D-I-Y-/1-It-Started-Over-Five-Years-Ago/1-It-Started-Over-Five-Years-Ago-214996.html and .../2-Short-Attention-Span-No-problem--215053.html — D.I.Y. parts 1–2: ~five-second microgames, short attention spans.
- https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-Mario-Kart-Wii/Bringing-Racers-Together/1-It-Started-With-A-Guy-In-Overalls/... , .../2-Motivated-by-Frustration/... , .../4-Mario-Kart-X/... — Mario Kart Wii parts 1, 2, 4: fetched; no item rubber-banding statement.
- https://www.nintendo.com/en-gb/News/2025/May/Ask-the-Developer-Vol-18-Mario-Kart-World-Chapter-1-2832687.html, -Chapter-2-2832717.html, -Chapter-3-2832747.html — fetched; accessibility quotes only, no catch-up statement.
- https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_MarioPartyDS_EN.pdf — Mario Party DS manual: instruction/practice screen, bonus stars.
- https://iwataasks.nintendo.com/... — Nintendo's dedicated Iwata Asks host failed TLS verification ("unable to verify the first certificate"); the en-gb mirrors above were used instead.

**Designer interviews, talks, postmortems**
- https://www.gamedeveloper.com/design/game-design-deep-dive-building-truly-cooperative-play-in-i-overcooked-i- — Phil Duncan, Overcooked design deep dive.
- https://www.gamedeveloper.com/design/road-to-the-igf-ghost-town-games-i-overcooked-i- — Duncan, IGF interview ("lots and lots of shouting").
- https://www.gamedeveloper.com/design/road-to-the-igf-steel-crate-games-i-keep-talking-and-nobody-explodes-i- — Steel Crate, spectator origin story.
- https://gdcvault.com/play/1023471/Designing-Asymmetric-Gameplay-For-Keep — GDC 2016, Ben Kane (description only; video paywalled).
- https://www.gamedeveloper.com/design/road-to-the-igf-henry-smith-s-i-spaceteam-i- — Henry Smith IGF interview.
- https://animalnewyork.com/2014/06/05/spaceteam-game-plan/ — Henry Smith on shouting over each other.
- https://episodiccontentmag.com/2016/01/29/everybodyshake2/ — Craddock's making-of, Smith quotes on UI and discovery.
- https://bagogames.com/interview-jackbox-games/ — Arnie Niekamp on Drawful and "people in the room yelling".
- https://www.builtinchicago.org/articles/jackbox-games-design-party-pack — Laban, McClure, Jacover on simple interactivity and TV pacing.
- https://www.jackboxgames.com/blog/mini-qa-weapons-drawn-game-director-arnie-niekamp — Niekamp Q&A (talking and arguing is the fun).
- https://www.jackboxgames.com/blog/streaming-moderation-accessibility-features-jackbox-party-pack-eight — extended timers, audience voting.
- https://www.jackboxgames.com/blog/making-the-jackbox-party-pack — fetched; production trivia, nothing on selection.
- https://gdcvault.com/play/1027202/The-Jackbox-Party-Pack-Unboxed — GDC 2021, Evan Jacover (description).
- https://www.gdcvault.com/play/1026870/The-Players-You-Didn-t — GDC 2020, Bilder & Hofer (description).
- https://ia600801.us.archive.org/26/items/the-jack-principles/The_Jack_Principles_djvu.txt — Gottlieb, The Jack Principles, full text.
- https://www.gdcvault.com/play/1016487/juice-it-or-lose — GDC Europe 2012 talk page.
- https://github.com/grapefrukt/juicy-breakout — Jonasson & Purho's demo source.
- https://www.gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games — report on Nijman's talk.
- https://victorweidar.wordpress.com/2016/10/06/the-art-of-screenshake/ — student notes on Nijman's talk (secondary).
- https://freshairarchive.org/segments/david-briggs — Briggs on Millionaire's format (2001).
- https://www.andywalmsley.com/millionaire.php — Walmsley's own account of the set.
- https://www.nintendolife.com/news/2015/03/interview_nintendo_and_nd_cube_on_bowser_amiibo_and_the_pure_luck_of_the_dice_in_mario_party_10 — Nishiya and Horita on helping trailing players.
- https://www.nintendolife.com/news/2014/05/interview_mario_kart_8_director_kosuke_yabuki_on_key_features_of_the_wii_us_blockbuster_release — fetched; balance-testing quote only.
- https://www.theoryoffun.com/press.shtml — Koster's site; reviewer paraphrases only. Koster's own "10 Years Later" PDF (https://www.raphkoster.com/gaming/gdco12/Koster_Raph_Theory_Fun_10.pdf) was downloaded but is image-only slides, so no Koster text is quoted in this document.

**Books and papers**
- https://archive.org/download/homo_ludens_johan_huizinga_routledge_1949_/homo_ludens_johan_huizinga_routledge_1949__djvu.txt — Huizinga, Homo Ludens, full text.
- https://nuovoeutile.it/wp-content/uploads/2015/12/2002-Flow.pdf — Nakamura & Csikszentmihalyi, "The Concept of Flow".
- https://www.inventoridigiochi.it/wp-content/uploads/2020/07/art-of-game-design.pdf — Schell, The Art of Game Design (2008), full text.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/ — Clark et al. 2009, near-misses.
- https://jeffhuang.com/papers/StarcraftSpectator_CHI11.pdf — Cheung & Huang 2011, spectators.
- https://www.ius.uzh.ch/dam/jcr:5ae9adc9-61ec-4174-b37c-4b752f36c23b/Kahnemann%20et%20al.%20-%20When%20More%20Pain%20is%20Preferred%20to%20Less%20(1993).pdf — Kahneman et al. 1993.
- https://files.eric.ed.gov/fulltext/EJ1053426.pdf — DeKoven interview, American Journal of Play 2015.
- https://archive.org/stream/ERIC_EJ1070247/ERIC_EJ1070247_djvu.txt — Henricks 2010 on Caillois (carries the verbatim Caillois definitions).
- https://www.press.uillinois.edu/books/?id=p070334 — publisher page for Man, Play and Games.
- https://jesperjuul.net/text/fearoffailing/ — Juul 2009, full text.
- https://jesperjuul.net/artoffailure/ — Juul's page for The Art of Failure.
- https://service.mattel.com/instruction_sheets/n1387-0920.pdf — Apples to Apples Junior official rules.

**Attempted and unreachable (not cited as evidence)**
- https://www.livedesignonline.com/final-answer-... (403), https://mitpress.mit.edu/9780262529952/the-art-of-failure/ (403), https://www.gameskinny.com/... Spaceteam interview (403), https://roblog.co.uk/2024/03/juicy-games/ and http://blog.ludimotion.com/2013/10/juice-it-or-lose-it.html (no technique list), https://muzboz.blogspot.com/... (no list), https://dkliao.itch.io/... (404), https://www.raphkoster.com/2012/03/13/... (404), https://archive.org/download/beyondboredomanx00csik/... (401, lending library), https://www.psy.gla.ac.uk/... Flow PDF (TLS mismatch), Google Books API snippet queries (no results).
- No primary source was found for: Mario Kart position-based item weighting; 1-2-Switch's face-to-face design rationale; the Millionaire semitone-per-question claim beyond fan wikis.
