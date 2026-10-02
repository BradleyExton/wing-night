---
name: Kempenfelt Curling
oneLiner: The active team slides its birds down a sheet of bay ice on their bellies with a drag-and-release, teammates sweep by rubbing the tablet while the stone runs, and every team's stones stay in the house until the end is scored.
confidence: promising
---

## Pitch

Curling at the Barrie Curling Club, with the players as the stones. The thrower drags back and
lets go (Slingshlong's gesture, kept because the sauce likes it), and the bird slides off down
the sheet on the TV, spinning slowly, curling toward the house. The moment it is released two
teammates grab the tablet and rub: sweeping carries it further and straightens it. The thrower
chose the line; the sweepers decide whether it gets there. That is the whole team on one
device, after the commit, in the only window where shouting "HARD! HARD!" is useful.

Every team's stones stay on the sheet. A later team's throw can knock an earlier team's bird
clean out of the house, and the TV keeps the sheet between turns, so the spectating teams have
a stake in every single throw. At the end of the round the end is scored the curling way: the
closest stone's team scores one for every stone it has closer than anyone else's best. Second
closest scores nothing, which is the near miss the game is made of.

## Rough rules

- Per-team turn. Every player on the team throws once in roster order, like Slingshlong; the
  sheet, the house and every stone on it are plugin round memory shared across turns.
- Throw: drag back on the tablet and release. Angle and pull are the commit; the server owns
  the slide. Curl is a published constant (a right-hand curl, always), so the line is a skill
  and not a guess.
- Sweep: from release until the stone stops, any touch movement on the tablet adds carry and
  reduces curl, up to a cap per throw. Two thumbs rubbing beat one.
- Takeouts are legal and are the point: a stone hit out of the sheet is gone. A stone that
  stops short of the hog line is removed (the standard rule, and a comic fail).
- Scoring at round end, curling style, as that team's points for the round; a team with nothing
  in the house scores nothing. The hammer (last team to throw in the round) is the team opening
  the next round under the existing rotation, which is already a published rule.
- Host can redo a throw and override (`AGENTS.md` §11).

## Principles check

- 2 Commit before reveal: the release; after it, only the sweep can touch the outcome, and it is
  on the TV as it happens.
- 6 A bad answer is still a plausible answer: a stone that curls into the wrong team's guard is
  a shot; a stone that stops at the hog line with three people sweeping is a story.
- 9 Whole team moves or speaks: the thrower throws, two sweep, the rest call the line.
- 10 Information asymmetry, and when it collapses: nobody knows after release; collapses as the
  stone stops, and again at the end-of-round scoring when the house is measured.
- 13 What the watching teams do: their birds are in the house; every throw can take one out.
- 15 Rules in one verb line: "Slide it, sweep it. Closest to the button wins the end."
- 23 What the sauce does to it: a drag-and-release is forgiving; rubbing a greasy tablet is
  slapstick, and that is the only precision the game asks for.

## Open questions

- Determinism: curl as lateral acceleration proportional to speed, friction as constant
  deceleration, collisions as circles. No trig, so the `noTranscendentals` test shape applies.
  Stone-on-stone with spin is the one place the sim could get expensive; it does not need to
  be accurate, only consistent and funny.
- The sweep rate: measure touch events on the real tablet before picking a cap. If one thumb
  can max it, two sweepers is theatre, which may be fine.
- How much of Slingshlong's beach code is reusable (the bench, the roster-order walk-on, the
  last-shot ghost) and whether the two games read as the same game on the night. The sheet,
  the persistent house and the sweep are the answer, but it has to be checked at a table.
- Overhead view or side view. Curling is read from above; the cast is drawn side-on. A bird on
  its belly from above is a new drawing.

## References / inspiration

- Research: [docs/research/cast-minigame-candidates.md](../../research/cast-minigame-candidates.md) §2.
- Curling rules: https://www.dummies.com/article/home-auto-hobbies/sports-recreation/curling/curling-for-dummies-cheat-sheet-208778/
- Slingshlong's throw and persistent targets: [joust-spec.md](../joust-spec.md) §2–3.
- Dunlop Dash's round memory (`selectRoundMemory`) for the persistent sheet.
