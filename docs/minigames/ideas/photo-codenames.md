---
name: Photo Codenames (working title)
oneLiner: The TV shows a grid of the group's own party photos; the clue-giver's tablet reveals which three are the targets, and one word has to get the room to call them out.
confidence: promising
---

## Pitch

Codenames, except the board is your friends. The TV fills with a labelled grid of party photos —
Mexico, the cottage, Darren's bachelor, a late-night diner — and the active team's clue-giver looks
at the tablet, which marks three of them as the targets. One word, said out loud, has to connect
all three. The room shouts photo numbers, the clue-giver taps what they picked, and the TV lights
them up as hits or misses.

The laugh is not the word. It is the grid: every photo is a story the room was present for, so a
clue like "shirtless" lands on four candidates and starts an argument before anyone guesses. It is
the only game on the roster where the CONTENT is the friendship, which is also what makes it the
best possible use of the shared photo library (`docs/adr/ADR-0004-shared-photo-library.md`).

Mechanically it is a clean fit for what already ships. Clue-giver sees the answer, display must
never see it — the same host-only projection rule as Drawing and Emoji Charades (`AGENTS.md` §3.1).
One active team per turn, same handoff model. Nothing new on the wire but a grid of photo ids.

## Rough rules

- At turn start the runtime deals a grid from the photo library, and secretly marks the targets.
  Starting point: twenty photos, five across, three targets. Every tile carries a big number so the
  room can call it.
- The clue-giver reads the tablet, which shows the same grid with the three targets marked, and says
  ONE word aloud. No gestures, no "sounds like" — the usual Codenames honour rules, enforced by the
  room, not the app.
- The team confers and calls out numbers. The clue-giver taps each pick on the tablet. The TV
  reveals each pick as it lands: hit, or miss.
- Scoring rewards efficiency rather than just completion. Three hits in three picks is the full
  award; each extra pick past three costs. A turn ends on all three found, on a pick budget being
  spent, or on the phase timer.
- Pending points apply at the phase boundary like every other minigame. Host can skip, redo and
  override the score (`AGENTS.md` §11).

## Open questions

- **The name.** "Photo Codenames" is a description, not a name. Every shipped game here has one
  (Slingshlong, SEAR, PETMON). Candidates: One Word, Shutterbug, Frame Job.
- **Who gives the clue.** Codenames needs a spymaster who is not guessing. With one tablet per team
  turn, the natural reading is "whoever holds the tablet is the clue-giver and the rest of the team
  guesses", which is exactly the Drawing handoff. Worth confirming that is the fun version, because
  the alternative — the OTHER team's captain gives the clue — makes the grid adversarial and the
  scoring more interesting.
- **Whether misses should be more than a cost.** Real Codenames has the assassin, which is the whole
  tension. A photo that ends the turn instantly would be funnier than a points deduction, and it is
  one more flag on the deal.
- **Photos of people who are not playing tonight.** The library knows everyone in a photo, and most
  party shots include friends who are not in the room. Those are fine grid cards and bad GEO
  answers, and the roster filter currently drops prompts featuring nobody present. The ADR flags
  this as the decision that has to land before this game does.
- **Repeats across turns.** Four team turns in a round want four different grids, or at least
  different targets. Seeded per team, like GEO's prompt cursor, is the cheap version.
- **Grid size on a real TV versus a real tablet.** Twenty photos is legible at 4K and cramped at
  tablet width. The tablet may need the grid scrollable, or smaller tiles with the targets pinned.

## References / inspiration

- Codenames (Vlaada Chvátil) and Codenames: Pictures, which is the closer parent — the picture
  edition already proved that images beat words for mixed groups and for people who do not share a
  first language.
- `drawing-spec.md` and `emoji-charades-spec.md` — the clue-giver-sees-answer, answer-safe-display
  pattern, already built twice here.
- `geo-spec.md` — seeded per-team prompt selection over one shared bank.
- `docs/adr/ADR-0004-shared-photo-library.md` — where the photos, the people tags and the events
  come from.
