# Minigame Design Principles

What makes a Wing Night minigame worth building, and the review a game passes before it
is spec'd, built, or scheduled. `SPEC.md` says what the engine does, `DESIGN.md` how it
looks, the [authoring guide](minigame-authoring-guide.md) how to wire a game in. This file
is about whether the game will be any good in the room.

Every principle below is grounded in a designer's own account, a game's own rules, or a
paper; the evidence, with quotes and URLs, is in
[docs/research/party-minigame-design.md](research/party-minigame-design.md). Citations
here are that file's finding numbers (`3.1`, `7.1`). Where a principle is our inference
rather than something a source says, it is marked *(synthesis)* there too.

Last updated: 2026-09-24

---

## 0) The thesis

**The room is the player.** One team holds the tablet, but 12 to 20 people are in the game,
and the ones not holding it are the ones who decide whether the night was fun. Every
principle below is a consequence of designing for the whole room rather than for the
person with the device.

Three seats, three jobs:

- **The tablet holder is the contestant.** Under a clock, under a camera (the TV), with sauce
  on their fingers. Their job is to commit to something in public.
- **The TV is the audience's seat.** Not a mirror of the tablet. It shows the room what it
  needs to have an opinion, to see the near miss coming, and to react when it lands.
- **The host is the show.** The app is the announcer and the referee, never the host.
  Nothing auto-advances, and the host always has the final say on a score.

Wing Night's own constraints are assets, not limitations. The two-screen split is a built-in
information asymmetry, which the research says is the whole engine of spectator tension
(`3.1`). One shared tablet, passed around, is the WarioWare model on purpose (`6.6`). The
spice is a designed disruption of the Overcooked kind (`1.6`): it keeps a simple task from
going rote and turns effort into shouting.

---

## 1) Tension: an open question the player can still influence

Tension is uncertainty plus a personal stake in resolving it (`1.1`). A turn with no open
question, or whose outcome the player cannot affect, has none.

- **Show the clock to the room, and escalate it.** Immediate feedback on progress is a
  *condition* of flow, not decoration (`1.2`, `8.3`), and a clock only the tablet can read
  is not feedback for the room. The last ten seconds should be the loudest thing on the TV.
  Since 2026-09-24 the TV's turn clock does this: the marquee pill grows past the team's name in
  bare seconds under ten (`apps/client/src/utils/timerUrgency` still decides when), beats on
  every tick, and the TV's own speaker ticks each second and buzzes at zero
  (`DESIGN.md` §5 MINIGAME_PLAY). The host's chime is the tablet's; the room has its own.
- **Tense and release, not constant pressure.** Enjoyment oscillates (`1.3`). Every success
  or failure needs a beat of hold before the next demand, the way Vlambeer's hit-pause gives
  the brain a moment to register the hit (`8.2`). FAPPY's handoff and crash holds are this
  beat done right. A game that fires the next prompt on the same frame as the last result is
  wearing the room out.
- **Near misses are the engine, but only under player control.** A near miss makes people
  want to go again, and it only works when the player chose the action (`1.4`). A team that
  scores 13 of 15 will talk about the two they missed. Scoring that can only produce 0 or 15
  has no near misses. Random punishment the player could not see or prevent gets the game
  labelled unfair, and then people stop engaging (`4.5`).
- **A visible commit, then a reveal.** Broadcast game shows manufacture pressure with a face,
  a lock-in and a stretchable pause before the answer (`1.7`). GEO's submit and RECREATE's
  prompt-in are lock-ins. JOUST's release and CONTRAPTION's GO are the physics version: a
  hard commit after which nobody in the room can do anything (`joust-spec.md` §2).

## 2) Funny: the players make the jokes, the game builds the stage

- **Do not try to be funny at the room.** Jackbox's stated aim is a space where "people in
  the room really yell at each other" rather than the developers making the jokes (`2.1`).
  Content banks and prompts should be set-ups. The punchline is what someone at the table
  says or draws.
- **Engineer ambiguity so a terrible answer is still a plausible answer.** Drawful works
  because "any weird thing could be right" (`2.2`). A bad drawing is funny when the prompt
  space is already absurd; it is humiliating when there is one right picture and the drawer
  missed it. Review each bank for prompts where a terrible submission is funnier than a good
  one.
- **"This is ridiculous!" is the target reaction, and it comes from the body.** WarioWare's
  designers name that sentence as their best compliment, and the comedy in testing was
  physical: testers squatting because the game told them to (`2.3`). Passing a greasy tablet,
  flapping with a burning mouth, a whole team miming an emoji: the body is the joke.
- **A human judge with a final say is fast, legitimate, and funny.** Apples to Apples licenses
  lobbying the judge and then closes the argument in one line (`2.4`). Song Guess's "the host
  is the judge" and RECREATE's host-ticked ingredients are already this. Never replace a
  human judge with a fuzzy matcher to seem fair; the argument is the content.
- **Fun and funny are different, and both die when someone *has* to win.** DeKoven: "If you
  have to win, there is no game" (`2.5`). Stakes stay playful. The scoreboard matters; it
  should never be the only thing that matters.

## 3) Spectators: the TV is the audience's seat

- **Tension for watchers is information asymmetry, and the reveal is the entertainment.**
  Three kinds: the player knows and the room does not (the drawer's prompt), nobody knows
  (where the shot lands), the room knows and the player does not (spectators see the
  ANAMORPH shape resolve before the dialer does). All of it collapses as the game plays, and
  the collapse is the show (`3.1`). Every minigame should be able to say which of the three
  it uses and when it collapses. "None" means there is nothing to watch.
- **The room needs to read who is winning, or it cannot watch.** Spectators need enough to
  know what is going on (`3.7`), but *when* the score appears matters as much as showing it;
  Starcraft spectators taped over on-screen scores to protect suspense. Standings belong on
  the results screens, not over a turn in progress.
- **When the content is secret, the frame is not.** The TV still shows the clock, the score
  so far, whose hands the tablet is in, and the reactions. A dark TV while a team works is
  a dead room.
- **Give the watchers a job or a viewpoint.** Keep Talking exists because its designers
  wanted spectators involved through the differing viewpoint they already had (`3.3`).
  JOUST makes the other teams the targets. GEO gives the room the photo to argue over
  before the pin lands. Read the Room's TV shows the dial but hides the band. A spectating
  team with nothing to see, guess, or heckle is waiting, not watching.
- **The target reaction is "give it here, I'll show you how it's done".** Iwata names that
  line as the design goal for watchers (`3.2`). Watching is also how later teams learn the
  verb, which is why the first team is disadvantaged (see §5).
- **Being watched restrains people.** Spectators make players "restrained from playful
  play" (`3.6`). The counter is a game whose expected mode is ridiculous, so failing in
  public is the point and not a judgement.

## 4) Fairness and catch-up: visible rules, earned comebacks

- **Keep the trailing team in it, honestly.** Mario Party's designers state the aim openly:
  "various ways to help those lagging behind", and "the outcome of the roll is 100% pure
  luck" (`4.1`). Its end-of-game swing is a published rule (bonus stars in hidden
  categories), not an AI thumb on the scale (`4.2`).
- **Catch-up must not take away responsibility for the result.** Players prefer feeling
  responsible for their own failure and rate a game higher when they do (`4.4`). Comebacks
  earned through play keep motivation; handicaps applied to you read as unfair to the
  leader and do not cheer the trailer. Wing Night's per-round caps and the higher final
  cap are visible rules. Keep it that way: no hidden modifiers, ever.
- **Comebacks are spectator content.** A see-saw is more watchable than a runaway (`4.3`).
  The night should be structured so the last two rounds can still change the winner.
- **The host may bend rules in the open.** A play community adapts rules so more people can
  keep playing (`4.6`). That is permission for documented, visible levers (a handicap the
  room agreed to, the override panel), not silent ones.

## 5) Learnability: one verb, five seconds, learn by watching

Players are drunk, sweating, and half-listening. Design for that.

- **Budget five seconds for comprehension.** WarioWare gives a player five seconds at most
  to grasp the verb, and solves it with one fixed instruction form rather than a longer
  explanation (`1.5`, `5.1`). A minigame's rules fit one TV screen: one verb line and at most
  two clauses. The MINIGAME_INTRO briefing (`apps/client/src/copy/minigameBriefings.ts`) is
  that screen; if a game needs more than three steps there, the game is too complicated.
- **One task at a time, and the player always knows what to do.** The Jack Principles, the
  document behind You Don't Know Jack and Jackbox: one task, few choices, always obvious,
  and move on if the response does not come (`5.2`). A tablet screen with two competing
  actions is a defect.
- **Early success builds the confidence to keep going.** Learning to play is itself the
  first challenge (`5.4`). The first prompt or gate of a turn should be easier than the
  last.
- **The first team to play a new game is disadvantaged** *(synthesis, `5.6`)*. In fixed turn
  order the last team has watched up to four attempts and the first has watched none.
  Mario Party's answer is a rules-and-practice screen before every minigame (`5.3`). Ours
  can be a demo beat before the first team, keeping the first team's *content* secret from
  the TV so later teams learn the verb but not the answers, or rotating which team opens a
  round. Today the same team opens every round: `turnOrderTeamIds` is set once and the
  cursor resets to zero each round (`apps/server/src/roomState/turnState`), and `SPEC.md`
  §MINIGAME_PLAY calls the order fixed for the game. That is an open spec decision, raised
  here, not a bug.
- **Icons over words for in-game state** (`5.5`). Words are for the briefing; play reads at
  a glance.

## 6) The body and the team

- **Shouting emerges when the only channel to a teammate is the voice and the clock is
  short.** Spaceteam and Overcooked both describe it as an emergent result of the setup, not
  a feature they built (`6.1`, `1.6`). Emoji Charades and Drawing get this for free; a game
  where the tablet holder can finish alone does not.
- **More jobs than hands, and every hand equally responsible.** Overcooked always has more
  actions than players and identical player stats, so the focus is coordination (`6.2`).
  Split the information, not the controls, to force talk (`6.3`): the non-holders should
  hold something the holder needs.
- **One shared controller, passed around, is a feature** (`6.6`). JOUST gives every player a
  pull; FAPPY hands the tablet off mid-relay. A team turn in which one person does
  everything and four people watch their own teammate is the weakest shape we ship.
- **Personalisation is a cheap stakes multiplier.** When the on-screen character is your
  Mii, "getting hit becomes more infuriating", and on failure it turns to face you (`8.5`).
  The cast heads are our version. Any game that draws a body should draw the player's own.
- **Teams are secret societies.** Play forms groups that mark their difference with
  "disguise" and "secrecy" (`6.4`). Team colours, anthems, genre silhouettes, and
  content the TV cannot see are what make a team feel like a team.
- **Vary the kind of play.** Caillois's four categories are a checklist (`6.5`):
  competition (agon), chance (alea), make-believe and performance (mimicry), and vertigo
  (ilinx). A roster that is all recall and expression has no vertigo and no chance;
  ANAMORPH and CONTRAPTION were added to the roadmap for exactly that gap.

## 7) Pacing the night

- **People remember the peak and the end, and mostly forget duration** (`7.1`). Every turn
  ends on a reveal-and-react beat, never a hard cut after a fail. The final round is the
  most spectacular game, not merely the one worth 20.
- **Hook, rising peaks with small dips, climax.** Schell's interest curve applies at every
  scale: a turn, a round, the night (`7.2`). Round one is the hook, so it should be fast and
  loud, not the tutorial.
- **A pack is diverse, and can afford a couple of weird ones** (`7.3`, `7.4`). Do not put two
  think-then-commit games back to back. Alternate the Caillois category and the input
  shape (twitch, aim, recall, perform, build).
- **The program never waits silently on a person** (`7.5`). In a host-paced game the tablet
  should tell the host the room is waiting on them.

Worked example, the current pack schedule (`~/wing-night-content/local/gameConfig.json`):

| Round | Game | Dominant kind | Shape |
|---|---|---|---|
| 1 | SCHLONIC | agon | twitch, one button |
| 2 | GEO | agon (knowledge) | think then commit |
| 3 | EMOJI_CHARADES | mimicry | perform, team shouts |
| 4 | SONG_GUESS | agon (recall) | think then commit |
| 5 | DRAWING | mimicry | perform, team shouts |
| 6 | FAPPY | agon + ilinx | twitch relay, tablet handoff |
| 7 | RECREATE | mimicry, judged | write, slow reveal |
| 8 | JOUST | agon + alea | aim, hard commit, spectator physics |

No two consecutive rounds share a shape: recall alternates with perform through the middle
of the night, and the two twitch games sit at rounds 1 and 6. Before 2026-09-24 the pack
ran GEO then SONG_GUESS (two think-then-commit games) and EMOJI_CHARADES then DRAWING (two
perform-and-shout games); swapping rounds 3 and 4 fixed both at no cost. JOUST closes the
night because it is the loudest game we ship, the whole room watching towers collapse, and
because its climax is local physics, whereas RECREATE's climax is a Gemini call that can
refuse or stall, which is not a risk to take on the final round.

## 8) Juice: feedback the room can see

- **Cheap layered feedback turns the same rules into an exciting game** (`8.1`, `8.2`). The
  specific tools are small: a hit pause of about 0.2 s, shake opposite the impact,
  permanence (the ghost of the last shot stays), bigger consequences than the cause.
- **On a TV, immediate also means large** *(synthesis, `8.3`)*. A point that is only
  legible on the tablet is not feedback. Every point should land on the TV within a second,
  at a size readable from the couch.
- **Sound is half of it.** Buzzers, ticks and reveal stings are the broadcast version of
  juice (`8.4`). The TV is the speaker; the announcer work in `BACKLOG.md` is this principle.
- **Failure must be a punchline, not a verdict.** "The game beat me!" is a designed outcome
  (`9.3`). A fail should have an on-TV consequence that is comic and attributable to the
  game's demand, never a plain WRONG.

## 9) Failure that is fun

- **Failure is content** (`9.1`). A game where nothing can go wrong is "interactive muzak".
- **Fail states are caused by a visible action and cheap to recover from** (`9.4`). A
  60-second turn cannot afford a 20-second death. FAPPY sends the bird back to the last
  gate, not the start.
- **Collective failure under time pressure reads as comedy, not shame** (`9.5`). Shared
  responsibility is the difference. When one person can lose it alone, make the loss
  ridiculous rather than quiet.
- **End on the better note** (`9.6`). The same failed turn, ended on the answer reveal and
  the team's birds reacting, is remembered as a moment.

## 10) Spice is a design input

The sauce is the disruption that keeps a simple task from going rote (`1.6`) and the body
that makes the failure funny (`2.3`). Design for it deliberately:

- Prefer forgiving gestures (drag and release, a coarse grid, one button) over precision
  timing windows and pixel-accurate placement (`joust-spec.md` §2, `ideas/contraption.md`).
  Precision with sauce is comedy; precision with sauce and a one-pixel target is misery,
  and by `4.5` it reads as unfair.
- Raw reaction time is mostly a sobriety test (`sear-spec.md`, Research §5). Test judgement,
  aim, and coordination instead.
- The team eats, then plays. The first few seconds of a turn are the worst of the burn;
  do not put the hardest demand there (`5.4`).

---

## 11) The review checklist

Yes or no, against an idea, a spec, or a build. An idea file should be able to answer the
starred items; a spec answers all of them. Numbers in brackets are the research findings.

**Tension**
1. The clock, if any, is on the TV, and the last ten seconds are the largest, loudest thing
   on it. [1.1, 1.2, 8.3]
2. ★ There is a visible commit (lock-in, release, GO) before every reveal. [1.7, 3.1]
3. There is a beat of hold after every success and failure before the next demand. [1.3, 8.2]
4. Scoring can produce a near miss (13 of 15), not only 0 or full marks. [1.4]
5. No hidden modifiers: every catch-up or handicap is a rule the room can read. [4.1, 4.2, 4.4]

**Funny**
6. ★ A terrible answer is still a plausible answer; the reviewer can point at three prompts
   in the bank where a bad submission is funnier than a good one. [2.2]
7. Creative games are judged by a human with a final say. [2.4]
8. Failure has a comic, on-TV consequence attributable to the game's demand, never a plain
   WRONG. [2.3, 9.3]
9. ★ The whole team has to move or speak, not only the tablet holder. [2.3, 6.1, 6.2]

**Spectators**
10. ★ The design names which information asymmetry it uses (player-only, nobody,
    spectator-only) and when it collapses. [3.1]
11. While content is secret, the TV still shows the frame: clock, score so far, whose hands
    the tablet is in. [3.7]
12. Standings appear on results screens, never over a turn in progress. [3.7, 3.1]
13. ★ Spectating teams have a stated job or read: something to see, guess, or heckle. [3.3]
14. Every point lands on the TV within a second, legible from the couch. [8.3, 8.1]

**Learnability**
15. ★ The rules fit one TV screen: one verb line, at most two clauses. [5.1, 5.2]
16. There is a demo or practice beat before the first team, or the first team's content
    stays secret so later teams learn the verb and not the answers. [5.3, 5.6]
17. The tablet never presents two competing decisions at once. [5.2]
18. The first prompt or gate of a turn is easier than the last. [5.4]
19. The host tablet shows when the room is waiting on the host. [7.5]

**Body and team**
20. Every drawn body is the player's own cast bird. [8.5, 6.6]
21. Team colour, name, and heads are on the TV throughout the turn, and the TV addresses
    the team. [6.4, 6.6]
22. Fail states cost five seconds or less to recover from within the turn. [9.4, 9.1]
23. ★ The demand is one that sauce makes funnier, not one it makes miserable. [1.6, 4.5]

**Night**
24. Every turn ends on a reveal-and-react beat, never a hard cut after a fail. [7.1, 9.6]
25. No two consecutive rounds share a dominant kind of play and input shape. [6.5, 7.6]
26. The final round is the most spectacular game of the night, not merely the highest cap.
    [7.1, 7.2]

---

## 12) Where the shipped game falls short today

Audited 2026-09-23 against the checklist. These are candidates for `BACKLOG.md`, not
decisions.

- **The same team opens every round** (item 16, principle §5). Turn order is fixed for the
  night by `SPEC.md` and `turnState`. Rotating the opener each round, or adding a demo beat
  before the first team, is a spec change to decide at the table.
- **The TV clock is a chip.** (Closed 2026-09-24.) Under ten seconds it now grows to more
  than twice its size in bare seconds, beats on every tick, and the TV ticks each second and
  buzzes at zero (`DESIGN.md` §5 MINIGAME_PLAY). The host's chime stays; the room has its own.
- **No practice or demo beat exists** in the phase flow (item 16). MINIGAME_INTRO is a
  briefing card, then EATING, then play.
- **Trivia is the flattest game we ship** against items 2, 9, 10 and 13: one person can
  answer, the room has nothing to do but know the answer too, and there is no commit beat.
  It is not in the pack schedule, and this is a reason to keep it out or redesign it.
- **Song Guess has no commit or reveal beat**: answers are verbal and the host marks them.
  Item 2 wants a visible lock before the title appears on the TV.
- **The pack schedule** used to have two back-to-back recall games and two back-to-back
  perform games (item 25). Fixed 2026-09-24 by swapping rounds 3 and 4, and JOUST moved to
  the finale so the last round does not depend on a network call; see the worked example
  in §7.
- ~~**No game states its information asymmetry** in its spec (item 10).~~ Done 2026-09-24:
  every spec in `docs/minigames/` carries an "Information asymmetry" subsection that names its
  kind and its collapse, and the three shipped games without a spec (TRIVIA, RECREATE, SCHLONIC)
  say theirs in the Doc column of the [roadmap table](minigames/README.md#roadmap).

---

## 13) Using this file

- **New idea:** answer the ★ items in the idea file's "Principles check" section
  (`docs/minigames/ideas/_template.md`). An idea that cannot answer item 10 or item 13 is
  not ready to promote.
- **New spec:** answer every item. Where the answer is no, say why the game is worth it
  anyway; that sentence is what a reviewer reads first.
- **Retuning a shipped game:** run §11 against the build, not the spec. The gaps in §12
  are the starting list.
- **Changing a principle:** change the research first. A principle here with no finding
  behind it is an opinion, and this file is meant to hold fewer of those than the rest of
  the repo.
