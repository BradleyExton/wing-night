# Wing Night Minigames Roadmap

Index of every minigame — shipped, building, spec'd, or still just a sketch.

Last updated: 2026-09-24

## Stages

- **idea** — name + a sentence or two. Lives in [`ideas/<slug>.md`](ideas/). Confidence: `sketch` / `promising` / `ready`.
- **spec** — a draft `<slug>-spec.md` here at the root of `docs/minigames/`. Ready (or nearly ready) to build.
- **building** — real implementation in progress under `packages/minigames/<slug>/`.
- **shipped** — playable, tested, in the round rotation.

## Roadmap

| Game | Stage | Confidence | Doc |
|---|---|---|---|
| Trivia | shipped | — | [packages/minigames/trivia/](../../packages/minigames/trivia/) — no spec. Information asymmetry: the host holds the answer (`TriviaMinigameHostView.currentPrompt`), the question is on the TV for everyone, and it collapses when the host marks Correct or Incorrect. The flattest game we ship on this axis ([principles §12](../minigame-design-principles.md#12-where-the-shipped-game-falls-short-today)). |
| Geo | shipped | — | [packages/minigames/geo/](../../packages/minigames/geo/) ([spec](geo-spec.md)) |
| Drawing | shipped | — | [packages/minigames/drawing/](../../packages/minigames/drawing/) ([spec](drawing-spec.md)) |
| Who's That Song | shipped | — | [packages/minigames/song-guess/](../../packages/minigames/song-guess/) ([spec](song-guess-spec.md)) |
| Slingshlong (JOUST) | shipped | — | [packages/minigames/joust/](../../packages/minigames/joust/) ([spec](joust-spec.md)) |
| Fappy Bird (FAPPY) | shipped | — | [packages/minigames/fappy/](../../packages/minigames/fappy/) ([spec](fappy-spec.md)) — a timed relay of the cast; built and tested; not in the sample lineup yet |
| Emoji Charades | shipped | — | [packages/minigames/emoji-charades/](../../packages/minigames/emoji-charades/) ([spec](emoji-charades-spec.md)) — built and tested; not in the sample lineup yet |
| RECREATE (Forgery Studio) | shipped | — | [packages/minigames/recreate/](../../packages/minigames/recreate/) — no spec; design in memory and `RecreateMinigameDisplayView` (`packages/shared/src/roomState`). Information asymmetry: the room and the team share the target photo; the ingredients are host-only while the team writes (in pass-and-play the tablet is in the team's hands and the ingredients are the answer) and the authored prompt is held back until the score is locked. It collapses in two beats: ingredients at submit, the authored prompt at scoring. |
| SCHLONIC | shipped | — | [packages/minigames/schlonic/](../../packages/minigames/schlonic/) — no spec; `SchlonicMinigameDisplayView` (`packages/shared/src/roomState`). Information asymmetry: nobody knows. The zone is a rule every team runs, host and display carry the same fields, and the open question is how far the run gets; it collapses run by run as the TV re-plays the input log, and hard at the post or the crash. |
| PETMON | spec | ready | [petmon-design.md](../petmon-design.md) (design + mockups; runtime not started) |
| Read the Room | idea | promising | [ideas/read-the-room.md](ideas/read-the-room.md) |
| ANAMORPH | idea | promising | [ideas/anamorph.md](ideas/anamorph.md) |
| CONTRAPTION | idea | promising | [ideas/contraption.md](ideas/contraption.md) |
| Photo Codenames | idea | promising | [ideas/photo-codenames.md](ideas/photo-codenames.md) — blocked on the photo library, [ADR-0004](../adr/ADR-0004-shared-photo-library.md) |
| SEAR | spec | ready | [sear-spec.md](sear-spec.md) (build plan in §0; runtime not started) |

Target: **at least 8 games**. Current: 9 shipped, 2 spec'd, 4 ideas → 15 concepts, target covered.

ANAMORPH and CONTRAPTION were added to close a specific gap: every other game on this
list is words, recall, or expression, and none of them make the TV do something the room
gasps at. Both are procedural — the server sends a seed and the display renders, so the
graphics cost nothing on the wire and survive reconnect.

SEAR was added to close a different gap: every game above is think-then-commit and runs three
to five minutes a turn, so the night has no short, high-energy beat and no palate cleanser between
the heavy rounds. It is a blind-clock precision game rather than a reaction-speed game on purpose —
the spec explains why raw reaction time is mostly a sobriety test.

## Adding an idea

Drop a file in [`ideas/`](ideas/) using [`ideas/_template.md`](ideas/_template.md). Two lines is fine, plus the template's Principles check — the starred items of [minigame-design-principles.md](../minigame-design-principles.md) §11. Update the table above so the index reflects reality.

## Promoting an idea to a spec

When an idea hits `confidence: ready`:

1. Move `ideas/<slug>.md` → `<slug>-spec.md` and flesh it out — use [drawing-spec.md](drawing-spec.md) as a reference shape, and answer the full [design principles checklist](../minigame-design-principles.md#11-the-review-checklist); where the answer is no, the spec says why the game is worth it anyway.
2. Update the table.
3. Scaffold the package under `packages/minigames/<slug>/` (see [minigame-authoring-guide.md](../minigame-authoring-guide.md)).
