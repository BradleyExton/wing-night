---
name: Read the Room
oneLiner: One teammate sees a hidden target zone on a spectrum (e.g. "Overrated ↔ Underrated"), gives a verbal clue, and the rest of the team drags a dial to where they think it lands — closer = more points.
confidence: promising
---

## Pitch

The "you don't have to be good at anything" party game. No drawing, no trivia recall, no acting — just *how do my friends think?* The active team's clue-giver sees a hidden band on a labelled spectrum and a concept card ("rate this thing on Boring ↔ Exciting"), then says one short clue out loud. The rest of the team confers and drags a dial on the tablet to guess where the band is. The TV shows the spectrum and the live dial but **never the hidden band** until the reveal. Big-laugh moments come from the reveal ("you put *sushi* at 2% delicious?") and from arguing about the clue.

It fills a real gap in the roster: nothing currently is a calibration / social-intuition game. Mechanically it's a clean reuse of patterns we already ship — proximity scoring like Geo, clue-giver-sees-answer / display-is-answer-safe like Drawing and Emoji Charades.

## Rough rules

- One active team per turn (same single-tablet handoff model as Drawing/Emoji Charades — runtime is agnostic to who holds it).
- At turn start the runtime picks a spectrum card (two opposing labels) and a hidden target band somewhere along 0–100, plus a concept/prompt to rate.
- The clue-giver looks at the tablet (sees the hidden band), thinks of a clue, and reads it aloud. The tablet hides the band from the rest once they start guessing — or simpler MVP: the giver shows the clue verbally and the team takes over the dial.
- Team drags a dial along the spectrum on the tablet; the TV mirrors the dial position live, with the band hidden.
- Lock in → reveal the band on the TV. Score by proximity: bullseye / close / near / miss → tiered points (mirror Geo's score bands).
- Loop to a new card until the phase timer ends. Pending points applied at the phase boundary like every other minigame.

## Open questions

- **Hidden-band handoff on one device.** Wavelength uses a physical screen that flips. With one tablet, how do we hide the band from the guessers after the giver has seen it? Options: (a) a "ready — pass it" tap that blanks the band before the team dials, (b) keep it simple and trust the giver not to peek-share, (c) giver dials a *decoy* and the team only nudges. Leaning (a).
- Scoring bands: reuse Geo's exact tiers, or a smoother distance curve? Geo-style tiers are simpler and consistent.
- Content shape: spectrum cards are just `{ leftLabel, rightLabel }`. Is a separate "thing to rate" prompt needed, or does the spectrum card alone carry it (classic Wavelength is label-only)? Label-only is simplest and proven.
- One dial per turn or several? Several short rounds per turn keeps the TV lively; cap by the phase timer.
- Does the *other* team get to bet high/low like real Wavelength, or is it purely the active team scoring (consistent with our current single-active-team loop)? MVP: active team only.

## References / inspiration

- Wavelength (CMYK) — the canonical spectrum / "psychic dial" mechanic. [Wikipedia](https://en.wikipedia.org/wiki/Wavelength_(game)), [publisher](https://www.wavelength.zone/)
- Why the format lands for mixed-skill groups (no drawing/trivia pressure): [Byteside review](https://www.byteside.com/2025/07/wavelength-boardgame-review/)
- Proximity-scored guessing already proven in our codebase: `geo-spec.md` (distance bands).
- Clue-giver-sees-answer / answer-safe-display pattern already proven: `drawing-spec.md`, `emoji-charades-spec.md`.
