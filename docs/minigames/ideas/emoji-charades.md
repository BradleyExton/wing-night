---
name: Emoji Charades
oneLiner: Pick emojis to represent a subject (friend names, movies, celebs, etc.); team guesses before time runs out
confidence: solid
---

## Pitch

One player has the tablet and sees a subject — a friend's name, a celebrity, a movie, whatever the host loaded in. They build a sequence of emojis to represent it while their team shouts guesses. The emoji sequence appears on the shared display in real time. First team to rack up the most correct guesses wins. Because the content is your actual friends, the emoji choices are always hilarious.

## Rules

- Game is **2 rounds per team**, each round **90 seconds**
- At the start of each team's turn, available decks are shown on the display — the active team calls out which deck they want and the host confirms it on the tablet
- A deck cannot be selected if it has fewer subjects than the points cap
- Subjects within a deck are served in **random order**
- The clue-giver **rotates with every new subject** (within the active team only)
- Clue-giver sees the subject on the tablet and taps emojis to build a clue — the sequence appears on the display in real time
- Teammates shout guesses out loud (no buzzer)
- Clue-giver has two buttons: **Got it** (correct guess, score a point) and **Skip** (no point, move on)
- Tapping either button triggers a **handoff screen** — the old clue-giver passes the tablet, the new clue-giver taps "I'm ready" to reveal their subject
- **Timer keeps running during handoff** — slow handoffs cost the team time
- Timer runs continuously for the full 90 seconds; **clean cutoff at zero, no late taps**
- Host override available for disputes
- Score = correct guesses; accumulates into the global Wing Night score
- Points per correct guess default to **1, fully configurable**; scores accumulate across both rounds

## Emoji picker

- **Category tabs** as the primary surface (6–8 tabs, tuned for describing a person/subject)
- **Search bar** as secondary escape hatch
- A short **sandbox/warmup** before the round lets each clue-giver practice the picker; warmup does not persist recents into the live round

## Display during a round

- Emoji sequence **front and center, large**
- HUD: timer, current clue-giver name, team scores

## Content format

Decks are authored in a JSON content file loaded before the game (same pattern as trivia):

```json
{
  "decks": [
    {
      "id": "the-squad",
      "label": "The Squad",
      "subjects": ["Bradley", "Tyler", "Chris"]
    },
    {
      "id": "celebs",
      "label": "Celebrities",
      "subjects": ["Taylor Swift", "LeBron James"]
    }
  ]
}
```

## Open questions

- Category tab labels and which emojis belong in each — needs a design pass
- Exact points cap / configurable rules shape (mirrors whatever the game config supports)
- Should clue-givers be restricted from using letter emojis to spell the subject's name?

## References / inspiration

- Classic Catchphrase: timed team guessing with a hot-potato handoff
- Emoji-based guessing games on social media (movie/song emoji puzzles)
